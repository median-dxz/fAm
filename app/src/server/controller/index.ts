import { kube } from "@/server/client/kubernetes";
import type { StrategyQueryRequset, StrategyQueryResponse } from "@fam/strategy-service-type";
import { HttpError, V2HorizontalPodAutoscaler, V2MetricSpec, type V1ServiceSpec } from "@kubernetes/client-node";
import stringify from "json-stable-stringify";
import { strategyService } from "../client/strategy";
import type { HpaPatchRequest, HpaState, ServiceQuery, WorkloadRef, WorkloadStatus } from "./type";

type SupportedWorkloadKind = StrategyQueryRequset["workload"]["kind"];
const SupportedWorkloadKinds: SupportedWorkloadKind[] = ["Deployment"] as const;

const FamHpaCtrlLabel = { "app.kubernetes.io/managed-by": "fam-autoscaler-controller" };

export function getHorizontalPodAutoscalerByWorkloadRef(hpaList: V2HorizontalPodAutoscaler[], workload: WorkloadRef) {
  return hpaList.find((hpa) => {
    return (
      hpa.spec?.scaleTargetRef.name === workload.name &&
      hpa.spec?.scaleTargetRef.kind === workload.kind &&
      hpa.metadata?.namespace === workload.namespace
    );
  });
}

export async function getWorkloadsByServiceSpec(serviceSpec: V1ServiceSpec): Promise<Array<WorkloadRef> | undefined> {
  const selector = serviceSpec.selector;
  if (!selector) return undefined;
  const pods = await kube.api.core.listPodForAllNamespaces(
    undefined,
    undefined,
    undefined,
    Object.entries(selector)
      .map(([key, value]) => `${key}=${value}`)
      .join(","),
  );
  const workloadMetadata = pods.body.items
    .flatMap((item) =>
      item.metadata?.ownerReferences?.map((r) => {
        return { kind: r.kind, name: r.name, namespace: item.metadata?.namespace ?? "default" };
      }),
    )
    .filter(Boolean) as Array<WorkloadRef>;

  return Promise.all(
    workloadMetadata.map(async (metadata) => {
      if (metadata.kind === "ReplicaSet") {
        const rs = (await kube.api.apps.readNamespacedReplicaSet(metadata.name, metadata.namespace)).body;
        if (rs.metadata?.ownerReferences?.length !== 1) {
          return metadata;
        }
        const deployment = await kube.api.apps
          .readNamespacedDeployment(rs.metadata.ownerReferences[0].name, metadata.namespace)
          .then((deploymentRes) => {
            const deployment = deploymentRes.body;
            if (deployment.metadata?.name == undefined) {
              return metadata;
            }
            return {
              name: deployment.metadata?.name,
              kind: "Deployment" as const,
              namespace: metadata.namespace,
            };
          })
          .catch((error) => {
            if (error instanceof HttpError && error.response.statusCode === 404) {
              return metadata;
            } else {
              throw error;
            }
          });
        return deployment;
      } else {
        return metadata;
      }
    }),
  ).then((workloads) => {
    return Array.from(new Set(workloads.map((w) => stringify(w)))).map((w) => JSON.parse(w) as WorkloadRef);
  });
}

export class ServiceHorizontalPodAutoscalerController {
  serviceName: string;
  serviceNamespace: string;

  constructor(serviceName: string, serviceNamespace: string = "default") {
    this.serviceName = serviceName;
    this.serviceNamespace = serviceNamespace;
  }

  workloads?: WorkloadRef[];
  horizontalPodAutoscalers?: V2HorizontalPodAutoscaler[];

  get hpaStatus(): HpaState {
    if (!this.workloads || this.workloads.length === 0) {
      return "workload-not-found";
    }
    if (this.workloads.length > 1) {
      return "multiple-workload";
    }
    if (!(SupportedWorkloadKinds as string[]).includes(this.workloads[0].kind)) {
      return "workload-not-supported";
    }
    if (!this.horizontalPodAutoscalers || this.horizontalPodAutoscalers.length === 0) {
      return "not-created";
    }
    if (this.horizontalPodAutoscalers.length > 1) {
      return "multiple-hpa";
    }
    const hpa = this.horizontalPodAutoscalers[0];
    if (hpa.metadata?.labels?.["app.kubernetes.io/managed-by"] !== FamHpaCtrlLabel["app.kubernetes.io/managed-by"]) {
      return "not-managed";
    }
    return "configured";
  }

  get workloadStatus(): WorkloadStatus | undefined {
    if (this.hpaStatus !== "configured") {
      return undefined;
    }
    const { status, spec } = this.horizontalPodAutoscalers![0];
    if (!status || !spec) {
      return undefined;
    }
    const { currentMetrics, currentReplicas, desiredReplicas, conditions } = status;
    const { metrics } = spec;
    return {
      currentReplicas,
      targetReplicas: desiredReplicas,
      currentUtilizationPercentage: currentMetrics?.[0].resource?.current.averageUtilization,
      targetUtilizationPercentage: metrics?.[0]?.resource?.target?.averageUtilization,
      currentAverageValue: currentMetrics?.[0].resource?.current.averageValue,
      targetAverageValue: metrics?.[0]?.resource?.target?.averageValue,
      conditions: conditions?.map((condition) => {
        const { status, type, message, reason } = condition;
        return {
          status,
          type,
          message,
          reason,
        };
      }),
    } satisfies WorkloadStatus;
  }

  get responseTime(): number | undefined {
    if (this.hpaStatus !== "configured") {
      return undefined;
    }
    const { metadata } = this.horizontalPodAutoscalers![0];
    if (!metadata) {
      return undefined;
    }
    const respnseTimeAnnotation = metadata?.annotations?.["response-time"];
    return respnseTimeAnnotation ? Number(respnseTimeAnnotation) : undefined;
  }

  async getCPUResourceFromStrategyService(responseTime: number, hpaName?: string) {
    if (
      this.hpaStatus === "workload-not-found" ||
      this.hpaStatus === "workload-not-supported" ||
      this.hpaStatus === "multiple-workload"
    ) {
      throw new Error(`Cannot query CPU Resource: ${this.hpaStatus}`);
    }
    const { success, result, error } = await strategyService.query({
      responseTime,
      hpa: {
        name: hpaName ?? "",
        namespace: this.serviceNamespace,
      },
      workload: {
        name: this.workloads![0].name,
        namespace: this.workloads![0].namespace,
        kind: this.workloads![0].kind as SupportedWorkloadKind,
      },
      service: {
        name: this.serviceName,
        namespace: this.serviceNamespace,
      },
    });
    if (success) {
      return result!;
    } else {
      throw new Error(`Failed to fetch CPU Resource from strategy serivce: ${error}`);
    }
  }

  static getHorizontalPodAutoscalerPatchObject({ cpu, type }: NonNullable<StrategyQueryResponse["result"]>) {
    return [
      {
        type: "Resource",
        resource: {
          name: "cpu",
          target: {
            type,
            averageValue: type === "AverageValue" ? cpu + "m" : undefined,
            averageUtilization: type === "Utilization" ? cpu : undefined,
          },
        },
      },
    ] satisfies V2MetricSpec[];
  }

  static async fromServiceQueries(queries?: ServiceQuery[]) {
    const servicesByQueries = (await kube.api.core.listServiceForAllNamespaces()).body.items
      .map((item) => {
        if (!item.metadata?.name || !item.spec) {
          throw new Error(`Failed to fetch services: ${item.metadata?.name} ${item.metadata?.namespace}`);
        }
        return item;
      })
      .filter((service) => {
        return (
          !queries ||
          queries.some(
            (r) => r.serviceName === service.metadata!.name && r.serviceNamespace === service.metadata!.namespace,
          )
        );
      });

    const hpaList = (await kube.api.autoscaling.listHorizontalPodAutoscalerForAllNamespaces()).body.items;

    return Promise.all(
      servicesByQueries.map(async (service) => {
        const controller = new ServiceHorizontalPodAutoscalerController(
          service.metadata?.name!,
          service.metadata?.namespace,
        );

        controller.workloads = await getWorkloadsByServiceSpec(service.spec!);
        controller.updateHorizontalPodAutoscaler(hpaList);
        return controller;
      }),
    );
  }

  updateHorizontalPodAutoscaler(hpaList: V2HorizontalPodAutoscaler[]) {
    this.horizontalPodAutoscalers = this.workloads
      ?.map((workload) => {
        return getHorizontalPodAutoscalerByWorkloadRef(hpaList, workload);
      })
      .filter(Boolean) as V2HorizontalPodAutoscaler[];
  }

  async patch(patchConfig: HpaPatchRequest) {
    const baseMetadata = {
      serviceName: this.serviceName,
      serviceNamespace: this.serviceNamespace,
    };

    if (!["configured", "not-created", "not-managed"].includes(this.hpaStatus)) {
      return {
        success: false,
        message: [`Cannot patch HPA: ${this.hpaStatus}`, `wrong HPA state: ${this.hpaStatus}`].join("\n"),
        ...baseMetadata,
      };
    }

    if (this.hpaStatus === "not-managed") {
      return {
        success: false,
        message: [
          `Cannot patch HPA: ${this.hpaStatus}`,
          `HPA is not managed by fam-autoscaler-controller, current version of app does not support this situation temporarily`,
        ].join("\n"),
        ...baseMetadata,
      };
    }
    try {
      if (this.hpaStatus === "not-created" && patchConfig.responseTime != undefined) {
        await this.createHpa(patchConfig.responseTime);
        return {
          success: true,
          message: [`Create HPA`].join("\n"),
          ...baseMetadata,
        };
      }

      if (this.hpaStatus === "configured") {
        if (patchConfig.responseTime == undefined) {
          await this.deleteHpa();
          return {
            success: true,
            message: [`Delete HPA`].join("\n"),
            ...baseMetadata,
          };
        } else if (patchConfig.responseTime != this.responseTime) {
          await this.changeResponseTime(patchConfig.responseTime);
          return {
            success: true,
            message: [`Change ResponseTime to ${patchConfig.responseTime}`].join("\n"),
            ...baseMetadata,
          };
        }
      }

      return {
        success: true,
        message: [`HPA is up-to-date`].join("\n"),
        ...baseMetadata,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          success: false,
          message: [`Failed to patch HPA`, `error: ${JSON.stringify(error.body, undefined, 2)}`].join("\n"),
          ...baseMetadata,
        };
      } else {
        throw error;
      }
    }
  }

  async changeResponseTime(responseTime: number) {
    console.log(`${this.serviceNamespace}/${this.serviceName} update HPA`);
    const cpu = await this.getCPUResourceFromStrategyService(
      responseTime,
      this.horizontalPodAutoscalers?.[0].metadata?.name!,
    );
    return kube.api.autoscaling.patchNamespacedHorizontalPodAutoscaler(
      this.horizontalPodAutoscalers?.[0].metadata?.name!,
      this.serviceNamespace,
      {
        metadata: {
          annotations: {
            "response-time": responseTime.toString(),
          },
        },
        spec: {
          metrics: ServiceHorizontalPodAutoscalerController.getHorizontalPodAutoscalerPatchObject(cpu),
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { "Content-Type": "application/merge-patch+json" } },
    );
  }

  async deleteHpa() {
    console.log(`${this.serviceNamespace}/${this.serviceName} delete HPA`);
    return kube.api.autoscaling.deleteNamespacedHorizontalPodAutoscaler(
      this.horizontalPodAutoscalers?.[0].metadata?.name!,
      this.serviceNamespace,
    );
  }

  async createHpa(responseTime: number) {
    console.log(`${this.serviceNamespace}/${this.serviceName} create HPA`);
    const cpu = await this.getCPUResourceFromStrategyService(responseTime);
    return kube.api.autoscaling.createNamespacedHorizontalPodAutoscaler(this.serviceNamespace, {
      metadata: {
        name: `fam-hpa-${this.serviceName}`,
        labels: { ...FamHpaCtrlLabel },
        annotations: {
          "response-time": responseTime.toString(),
        },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1",
          kind: this.workloads![0].kind,
          name: this.workloads![0].name,
        },
        minReplicas: 1,
        maxReplicas: 10,
        metrics: ServiceHorizontalPodAutoscalerController.getHorizontalPodAutoscalerPatchObject(cpu),
      },
    });
  }
}
