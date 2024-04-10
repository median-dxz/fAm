import { k8sClient, api } from "@/lib/k8sClient";
import { prisma } from "@/lib/prismaClient";
import { HttpError, V2HorizontalPodAutoscaler } from "@kubernetes/client-node";
import type { ServiceConfig } from "@/lib/controller/type";

export const dynamic = "force-dynamic";

interface HpaStatus {
  currentReplicas: number;
  targetReplicas: number;
  currentUtilizationPercentage: number;
  targetUtilizationPercentage: number;
}

function getHpaRunningStatus(hpa: V2HorizontalPodAutoscaler): HpaStatus {
  return {
    currentReplicas: hpa.status!.currentReplicas || NaN,
    targetReplicas: hpa.status!.desiredReplicas,
    currentUtilizationPercentage: hpa.status!.currentMetrics?.[0].resource?.current.averageUtilization || NaN,
    targetUtilizationPercentage: hpa.spec!.metrics?.[0]?.resource?.target?.averageUtilization || NaN,
  };
}

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

    const allHpa = (await api!.autoscaling.listHorizontalPodAutoscalerForAllNamespaces()).body.items.filter(
      (hpa) => hpa.metadata?.labels?.["app.kubernetes.io/managed-by"] === "fam-auto-configured",
    );

    let res1: ServiceConfig[] = res.map((service) => {
      const hpa = allHpa.find(
        (hpa) =>
          hpa.metadata?.namespace === service.namespace &&
          hpa.metadata?.name === `fam-hpa-${service.name}` &&
          hpa.spec?.scaleTargetRef?.name === service.name &&
          hpa.metadata.annotations?.["app.kubernetes.io/instance"] === service.name,
      );
      let hpaStatus: ServiceConfig["hpaStatus"] = "not-created";
      if (hpa) {
        hpaStatus = "configured";
      }
      return {
        name: service.name,
        namespace: service.namespace,
        responseTime: service.responseTime,
        hpaStatus,
        hpaRunningStatus: hpa ? getHpaRunningStatus(hpa) : undefined,
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
        const hpaEnabled = Boolean(service.responseTime !== -1);
        try {
          await api!.autoscaling.readNamespacedHorizontalPodAutoscaler(`fam-hpa-${service.name}`, service.namespace);
          if (!hpaEnabled) {
            console.log(`delete hpa for: ${service.name} ${service.namespace}`);
            await api!.autoscaling.deleteNamespacedHorizontalPodAutoscaler(
              `fam-hpa-${service.name}`,
              service.namespace,
            );
          }
        } catch (error) {
          if (error instanceof HttpError && error.response.statusCode === 404) {
            if (hpaEnabled) {
              console.log(`create hpa for: ${service.name} ${service.namespace}`);
              await api!.autoscaling.createNamespacedHorizontalPodAutoscaler(service.namespace, {
                metadata: {
                  name: `fam-hpa-${service.name}`,
                  labels: {
                    "app.kubernetes.io/managed-by": "fam-auto-configured",
                    "app.kubernetes.io/instance": service.name,
                  },
                },
                spec: {
                  scaleTargetRef: {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    name: service.name,
                  },
                  minReplicas: 1,
                  maxReplicas: 10,
                  metrics: [
                    {
                      type: "Resource",
                      resource: {
                        name: "cpu",
                        target: {
                          type: "Utilization",
                          averageUtilization: 50,
                        },
                      },
                    },
                  ],
                },
              });
            }
          } else {
            throw error;
          }
        }
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
