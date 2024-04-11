import { kube } from "../client/kubernetes";
import type { IstioRequestsTotalMetricObject } from "../client/prometheus";
import { NodeType, type Graph } from "../graph/type";
import { procedure, router } from "../trpc";
import { v4 as uuid } from "uuid";

export const graphRouter = router({
  get: procedure.query(async function () {
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
      });
    }

    const pql = `istio_requests_total`;

    const prometheusResponse: {
      status: "success";
      data: { resultType: "vector"; result: Array<IstioRequestsTotalMetricObject> };
    } = await fetch(`${process.env["PROMETHEUS_URL"]}/api/v1/query?query=${pql}`).then((r) => r.json());

    const requestMetrics = prometheusResponse.data.result;

    for (const metric of requestMetrics) {
      const source = graph.nodes.find(
        (n) => n.name === metric.metric.source_workload && n.namespace === metric.metric.source_workload_namespace,
      );
      const service = graph.nodes.find(
        (n) =>
          n.name === metric.metric.destination_service_name &&
          n.namespace === metric.metric.destination_service_namespace,
      );
      const target = graph.nodes.find(
        (n) =>
          n.name === metric.metric.destination_workload && n.namespace === metric.metric.destination_workload_namespace,
      );
      if (!source || !service || !target) {
        continue;
      }

      if (
        !source.edges.find((e) => {
          return e.target === service.hash && e.source === source.hash;
        })
      ) {
        source.edges.push({ source: source.hash, target: service.hash, code: [metric.metric.response_code] });
      } else {
        source.edges.find((e) => {
          if (e.target === service.hash && e.source === source.hash) {
            e.code.push(metric.metric.response_code);
          }
        });
      }

      if (
        !service.edges.find((e) => {
          return e.target === target.hash && e.source === service.hash;
        })
      ) {
        service.edges.push({ source: service.hash, target: target.hash, code: [metric.metric.response_code] });
      } else {
        service.edges.find((e) => {
          if (e.target === target.hash && e.source === service.hash) {
            e.code.push(metric.metric.response_code);
          }
        });
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
