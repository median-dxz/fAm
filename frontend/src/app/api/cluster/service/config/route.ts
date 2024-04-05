import { k8sClient, api } from "@/lib/k8sClient";
import { prisma } from "@/lib/prismaClient";
import { HttpError } from "@kubernetes/client-node";
import type { ServiceConfig } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!api) {
      k8sClient.connect();
    }
    let r = await api?.listServiceForAllNamespaces();
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

    const promises = services.map(async (service) => {
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
    let req: ServiceConfig[] | undefined;
    try {
      req = await request.json();
    } catch (error) {}
    if (req) {
      return Response.json(
        (await Promise.all(promises)).filter((service) => {
          return req.some((r) => r.name === service.name && r.namespace === service.namespace);
        }),
      );
    } else {
      return Response.json(await Promise.all(promises));
    }
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
