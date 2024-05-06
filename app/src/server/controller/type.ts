import { z } from "zod";

export interface ServiceQuery {
  serviceName: string;
  serviceNamespace: string;
}

export interface WorkloadStatus {
  //   currentResponseTime: number; // TODO implment this
  currentReplicas?: number;
  targetReplicas?: number;
  currentUtilizationPercentage?: number;
  targetUtilizationPercentage?: number;
  currentAverageValue?: string;
  targetAverageValue?: string;
  conditions?: HorizontalPodAutoscalerCondition[];
}

export interface HorizontalPodAutoscalerCondition {
  type: string;
  status: string;
  message?: string;
  reason?: string;
}

export type HpaState =
  | "configured"
  | "not-created"
  | "workload-not-found"
  | "multiple-workload"
  | "workload-not-supported"
  | "multiple-hpa"
  | "not-managed";

export interface ServiceConfigQueryResult {
  serviceName: string;
  serviceNamespace: string;
  responseTime?: number;
  hpaState: HpaState;
  workload?: WorkloadRef;
  workloadStatus?: WorkloadStatus;
}

export interface WorkloadRef {
  name: string;
  namespace: string;
  kind: WorkloadKind;
}

export interface HpaPatchRequest {
  responseTime?: number; // -1 NaN or nullish -> patch action == "delete"
  serviceName: string;
  serviceNamespace: string;
}

export interface HpaPatchResult {
  success: boolean;
  message: string;
}

export type WorkloadKind = "Deployment" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob" | "ReplicaSet";

export const ServiceQuerySchema = z.object({
  serviceName: z.string(),
  serviceNamespace: z.string(),
});

export const HpaPatchConfigSchema = z
  .object({
    responseTime: z.number().optional(),
  })
  .merge(ServiceQuerySchema);
