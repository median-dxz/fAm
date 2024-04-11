import { kube } from "@/server/client/kubernetes";
import { prisma } from "@/server/client/prisma";
import type { ServiceConfigQueryResult, ServiceStatus } from "@/server/controller/type";
import { HttpError, V2HorizontalPodAutoscaler } from "@kubernetes/client-node";
import type { ServiceConfig } from "@prisma/client";
import { z } from "zod";
import { procedure, router } from "../trpc";

function getHpaRunningStatus(
  hpa: V2HorizontalPodAutoscaler,
): Pick<
  ServiceStatus,
  "currentReplicas" | "currentUtilizationPercentage" | "targetReplicas" | "targetUtilizationPercentage"
> {
  return {
    currentReplicas: hpa.status!.currentReplicas || NaN,
    targetReplicas: hpa.status!.desiredReplicas,
    currentUtilizationPercentage: hpa.status!.currentMetrics?.[0].resource?.current.averageUtilization || NaN,
    targetUtilizationPercentage: hpa.spec!.metrics?.[0]?.resource?.target?.averageUtilization || NaN,
  };
}

export const serviceConfigRouter = router({
  get: procedure
    .input(z.array(z.object({ name: z.string(), namespace: z.string() })).nullish())
    .query(async ({ input: query }) => {
      const servicesByQuery = (await kube.api.core.listServiceForAllNamespaces()).body.items
        .map((item) => {
          if (!item.metadata?.name || !item.metadata?.namespace) {
            throw new Error(`Failed to fetch services: ${item.metadata?.name} ${item.metadata?.namespace}`);
          }
          return {
            name: item.metadata.name,
            namespace: item.metadata.namespace,
          };
        })
        .filter((service) => {
          return !query || query.some((r) => r.name === service.name && r.namespace === service.namespace);
        });

      const servicesWithResponseTime: Array<ServiceConfig> = [];

      for (const service of servicesByQuery) {
        const serviceConfig = await prisma.serviceConfig.upsert({
          where: {
            name_namespace: {
              name: service.name,
              namespace: service.namespace,
            },
          },
          create: {
            name: service.name,
            namespace: service.namespace,
            responseTime: -1,
          },
          update: {},
        });
        servicesWithResponseTime.push(serviceConfig);
      }

      const hpaList = (await kube.api.autoscaling.listHorizontalPodAutoscalerForAllNamespaces()).body.items;

      return servicesWithResponseTime.map((service) => {
        const hpa = hpaList.find((hpa) => {
          return (
            hpa.metadata?.labels?.["app.kubernetes.io/managed-by"] === "fam-auto-configured" &&
            hpa.metadata?.namespace === service.namespace &&
            hpa.metadata?.annotations?.["app.kubernetes.io/instance"] === service.name
          );
        });
        return {
          ...service,
          hpaStatus: hpa ? "configured" : "not-created",
          serviceStatus: hpa
            ? {
                currentReplicas: hpa.status?.currentReplicas || NaN,
                currentUtilizationPercentage:
                  hpa.status?.currentMetrics?.[0].resource?.current.averageUtilization || NaN,
                targetReplicas: hpa.status?.desiredReplicas,
                targetUtilizationPercentage: hpa.spec?.metrics?.[0]?.resource?.target?.averageUtilization || NaN,
              }
            : undefined,
        } as ServiceConfigQueryResult;
      });
    }),
  patch: procedure
    .input(z.array(z.object({ name: z.string(), namespace: z.string(), responseTime: z.number() })))
    .query(async ({ input: query }) => {
      const promises = query.map(async (service) => {
        const hpaEnabled = Boolean(service.responseTime !== -1);
        try {
          await kube.api.autoscaling.readNamespacedHorizontalPodAutoscaler(
            `fam-hpa-${service.name}`,
            service.namespace,
          );
          if (!hpaEnabled) {
            console.log(`delete hpa for: ${service.name} ${service.namespace}`);
            await kube.api.autoscaling.deleteNamespacedHorizontalPodAutoscaler(
              `fam-hpa-${service.name}`,
              service.namespace,
            );
          }
        } catch (error) {
          if (error instanceof HttpError && error.response.statusCode === 404) {
            if (hpaEnabled) {
              console.log(`create hpa for: ${service.name} ${service.namespace}`);
              await kube.api.autoscaling.createNamespacedHorizontalPodAutoscaler(service.namespace, {
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
      });
      await Promise.all(promises);
      return { success: true };
    }),
});
