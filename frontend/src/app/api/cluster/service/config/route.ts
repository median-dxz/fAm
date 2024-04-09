import { k8sClient, api } from "@/lib/k8sClient";
import { prisma } from "@/lib/prismaClient";
import { HttpError } from "@kubernetes/client-node";
import type { ServiceConfig } from "@/lib/controller/type";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!api) {
      k8sClient.connect();
    }
    let r = await api?.core.listServiceForAllNamespaces();
    if (!r) {
      throw new Error("Failed to fetch services");
    }
    const services = r.body.items.map((item) => {
      if (!item.metadata?.name || !item.metadata?.namespace) {
        throw new Error(`Failed to fetch services: ${item.metadata?.name} ${item.metadata?.namespace}`);
      }
      return {
        name: item.metadata.name,
        namespace: item.metadata.namespace,
      };
    });

    let req: { name: string; namespace: string }[] | undefined;
    try {
      req = await request.json();
    } catch (error) {}

    let promises = services.map(async (service) => {
      try {
        const r = await prisma.serviceConfig.findUniqueOrThrow({
          where: {
            name_namespace: {
              name: service.name,
              namespace: service.namespace,
            },
          },
        });
        return r;
      } catch (err) {
        const r = await prisma.serviceConfig.create({
          data: {
            name: service.name,
            namespace: service.namespace,
            responseTime: -1,
          },
        });
        return r;
      }
    });

    let res = await Promise.all(promises);
    if (req) {
      res = res.filter((service) => {
        return req.some((r) => r.name === service.name && r.namespace === service.namespace);
      });
    }

    const allHpa = (await api!.autoscaling.listHorizontalPodAutoscalerForAllNamespaces()).body.items;
    // filter(hpa=>hpa.metadata?.labels["fam-mange"]);

    let res1: ServiceConfig[] = res.map((service) => {
      // const hpa = allHpa.find(hpa=>hpa.metadata.)
      return {
        name: service.name,
        namespace: service.namespace,
        responseTime: service.responseTime,
        hpaEnabled: false,
        hpaStatus: {
          currentReplicas: 1,
          targetReplicas: 1,
          currentUtilizationPercentage: 1,
          targetUtilizationPercentage: 1,
        },
      };
    });

    return Response.json(res1);
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

export async function PUT(request: Request) {
  const data: ServiceConfig[] = await request.json();
  try {
    const promises = data.map(async (service) => {
      try {
        // TODO if different apply service stratgy -> apply hpa
        const r = await prisma.serviceConfig.update({
          where: {
            name_namespace: {
              name: service.name,
              namespace: service.namespace,
            },
          },
          data: {
            responseTime: service.responseTime,
          },
        });
        return r;
      } catch (err) {
        console.error(err);
        return null;
      }
    });
    return Response.json(await Promise.all(promises));
  } catch (error) {
    console.error(`[API]: Error on ${request.url}`);
    console.error(error);
    return Response.json({}, { status: 500, statusText: (error as Error).message });
  }
}
