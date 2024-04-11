import { kube } from "@/server/client/kubernetes";
import type { ServiceConfigQueryResult, Workload } from "@/server/controller/type";
import { HttpError } from "@kubernetes/client-node";
import stringify from "json-stable-stringify";
import { z } from "zod";
import { procedure, router } from "../trpc";

async function getWorkloadByService(service: { name: string; namespace: string }) {

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

      const hpaList = (await kube.api.autoscaling.listHorizontalPodAutoscalerForAllNamespaces()).body.items;

      return servicesByQuery.map((service) => {
        const hpa = hpaList.find((hpa) => {
          return (
            hpa.metadata?.labels?.["app.kubernetes.io/managed-by"] === "fam-autoscaler-manager" &&
            hpa.metadata?.annotations?.["workload"] ===
              JSON.stringify({ name: service.name, namespace: service.namespace, type: "deployment" })
          );
        });

        return {
          name: service.name,
          namespace: service.namespace,
          responseTime: hpa ? Number(hpa.metadata?.annotations?.["response-time"]) ?? -1 : -1,
          hpaStatus: hpa ? "configured" : "not-created",
          serviceStatus: hpa
            ? {
                workload: JSON.parse(hpa.metadata?.annotations?.["workload"]!) as Workload,
                currentReplicas: hpa.status?.currentReplicas || NaN,
                currentUtilizationPercentage:
                  hpa.status?.currentMetrics?.[0].resource?.current.averageUtilization || NaN,
                targetReplicas: hpa.status?.desiredReplicas || NaN,
                targetUtilizationPercentage: hpa.spec?.metrics?.[0]?.resource?.target?.averageUtilization || NaN,
              }
            : undefined,
        } satisfies ServiceConfigQueryResult;
      });
    }),
  patch: procedure
    .input(z.array(z.object({ name: z.string(), namespace: z.string(), responseTime: z.number() })))
    .mutation(async ({ input: query }) => {
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
                    "app.kubernetes.io/managed-by": "fam-autoscaler-manager",
                  },
                  annotations: {
                    "response-time": service.responseTime.toString(),
                    workload: stringify({ name: service.name, namespace: service.namespace, type: "deployment" }),
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
      });
      await Promise.all(promises);
      return { success: true };
    }),
});
