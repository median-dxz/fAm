import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { kube } from "../client/kubernetes";
import { prometheus, type IstioRequestsTotalMetric } from "../client/prometheus";
import { NodeType, type Graph } from "../graph/type";
import { procedure, router } from "../trpc";

export const graphRouter = router({
  get: procedure
    .input(
      z.object({
        timeRange: z
          .object({
            length: z.number(),
            unit: z.enum(["s", "m", "h", "d", "w", "M"]),
          })
          .default({
            length: 5,
            unit: "m",
          }),
        evaluatedTime: z.number().optional(),
      }),
    )
    .query(async function ({ input }) {
      let servicesRes = await kube.api.core.listServiceForAllNamespaces();
      if (!servicesRes) {
        throw new Error("Failed to fetch services");
      }

      const services = servicesRes.body.items;
      const graph: Graph = { nodes: [] };
      for (const service of services) {
        if (!service.metadata?.name || !service.metadata?.namespace) {
          continue;
        }
        graph.nodes.push({
          edges: [],
          hash: uuid(),
          type: NodeType.Service,
          name: service.metadata.name,
          namespace: service.metadata.namespace,
          idle: true,
        });
      }

      let deploymentRes = await kube.api.apps.listDeploymentForAllNamespaces();
      if (!deploymentRes) {
        throw new Error("Failed to fetch deployments");
      }

      const deployments = deploymentRes.body.items;
      for (const deployment of deployments) {
        if (!deployment.metadata?.name || !deployment.metadata?.namespace) {
          continue;
        }
        graph.nodes.push({
          edges: [],
          hash: uuid(),
          type: NodeType.Workload,
          name: deployment.metadata.name,
          namespace: deployment.metadata.namespace,
          idle: true,
        });
      }

      const statefulSetRes = await kube.api.apps.listStatefulSetForAllNamespaces();
      if (!statefulSetRes) {
        throw new Error("Failed to fetch statefulsets");
      }

      const statefulSets = statefulSetRes.body.items;
      for (const statefulSet of statefulSets) {
        if (!statefulSet.metadata?.name || !statefulSet.metadata?.namespace) {
          continue;
        }
        graph.nodes.push({
          edges: [],
          hash: uuid(),
          type: NodeType.Workload,
          name: statefulSet.metadata.name,
          namespace: statefulSet.metadata.namespace,
          idle: true,
        });
      }

      let { timeRange, evaluatedTime } = input;

      const endTime = dayjs.unix(evaluatedTime ?? Date.now() / 1000).startOf("millisecond");
      const startTime = dayjs(endTime).subtract(timeRange.length, timeRange.unit);

      const queryRangeResponse = await prometheus.queryRange<IstioRequestsTotalMetric>({
        query: `istio_requests_total`,
        start: startTime.unix(),
        end: endTime.unix(),
        step: dayjs(endTime).diff(startTime, "second"),
      });

      if (queryRangeResponse.status === "error") {
        const { error, errorType } = queryRangeResponse;
        throw new Error(
          ["Occurred an error while fetching prometheus data", `Error: ${error!}`, `ErrorType: ${errorType!}`].join(
            "\n",
          ),
        );
      }

      const requestMetrics = queryRangeResponse.data.result;

      for (const metric of requestMetrics) {
        if (metric.values.length === 2 && Number(metric.values[0][1]) === Number(metric.values[1][1])) {
          continue;
        }

        const source = graph.nodes.find(
          (n) =>
            n.name === metric.metric.source_workload &&
            n.namespace === metric.metric.source_workload_namespace &&
            n.type === NodeType.Workload,
        );
        const service = graph.nodes.find(
          (n) =>
            n.name === metric.metric.destination_service_name &&
            n.namespace === metric.metric.destination_service_namespace &&
            n.type === NodeType.Service,
        );
        const target = graph.nodes.find(
          (n) =>
            n.name === metric.metric.destination_workload &&
            n.namespace === metric.metric.destination_workload_namespace &&
            n.type === NodeType.Workload,
        );

        if (!source || !service || !target) {
          continue;
        }

        source.idle = service.idle = target.idle = false;

        let edge = source.edges.find((e) => {
          return e.source === source.hash && e.target === service.hash;
        });

        if (edge) {
          edge.code.push(metric.metric.response_code);
        } else {
          source.edges.push({ source: source.hash, target: service.hash, code: [metric.metric.response_code] });
        }

        edge = service.edges.find((e) => {
          return e.source === service.hash && e.target === target.hash;
        });

        if (edge) {
          edge.code.push(metric.metric.response_code);
        } else {
          service.edges.push({ source: service.hash, target: target.hash, code: [metric.metric.response_code] });
        }
      }

      graph.nodes.forEach((node) => {
        node.edges.forEach((edge) => {
          edge.code = Array.from(new Set(edge.code));
        });
      });
      return graph;
    }),
});
