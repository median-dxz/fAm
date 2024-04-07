import type { Graph } from "@/lib/graph/type";
import { api, k8sClient } from "@/lib/k8sClient";
import { HttpError } from "@kubernetes/client-node";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const graph: Graph = {
    nodes: [],
  };

  try {
    if (!api) {
      k8sClient.connect();
    }
    let r = await api?.listServiceForAllNamespaces();
    if (!r) {
      throw new Error("Failed to fetch services");
    }

    const services = r.body.items;
    for (const service of services) {
      if (!service.metadata?.name || !service.metadata?.namespace) {
        continue;
      }
      graph.nodes.push({
        edges: [],
        service: {
          name: service.metadata?.name,
          namespace: service.metadata?.namespace,
        },
      });
    }

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
