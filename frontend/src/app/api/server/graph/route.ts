import type { Graph } from "@/lib/graph/type";
import { NodeType } from "@/lib/graph/type";
import { api, k8sClient } from "@/lib/k8sClient";
import { HttpError } from "@kubernetes/client-node";
import { v4 as uuid } from "uuid";

export const dynamic = "force-dynamic";

interface Metric {
  __name__: string;
  app: string;
  connection_security_policy: string;
  destination_app: string;
  destination_canonical_revision: string;
  destination_canonical_service: string;
  destination_cluster: string;
  destination_principal: string;
  destination_service: string;
  destination_service_name: string;
  destination_service_namespace: string;
  destination_version: string;
  destination_workload: string;
  destination_workload_namespace: string;
  instance: string;
  job: string;
  namespace: string;
  pod: string;
  pod_template_hash: string;
  reporter: string;
  request_protocol: string;
  response_code: string;
  response_flags: string;
  security_istio_io_tlsMode: string;
  service_istio_io_canonical_name: string;
  service_istio_io_canonical_revision: string;
  source_app: string;
  source_canonical_revision: string;
  source_canonical_service: string;
  source_cluster: string;
  source_principal: string;
  source_version: string;
  source_workload: string;
  source_workload_namespace: string;
  version: string;
}

interface MetricObject {
  metric: Metric;
  value: [number, string];
}

export async function GET(request: Request) {
  const graph: Graph = {
    nodes: [],
  };

  try {
    if (!api) {
      k8sClient.connect();
    }
    let servicesRes = await api?.core.listServiceForAllNamespaces();
    if (!servicesRes) {
      throw new Error("Failed to fetch services");
    }

    const services = servicesRes.body.items;
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

    let deploymentRes = await api?.apps.listDeploymentForAllNamespaces();
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

    const statefulSetRes = await api?.apps.listStatefulSetForAllNamespaces();
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
      data: { resultType: "vector"; result: Array<MetricObject> };
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

    return Response.json(graph);
  } catch (error) {
    console.error(`[API]: Error on ${request.url}`);
    if (error instanceof HttpError) {
      console.error(JSON.stringify(error));
    } else {
      console.error(error);
    }
    return Response.json({}, { status: 500, statusText: (error as Error).message });
  }
}
