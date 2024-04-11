export interface ServiceStatus {
  workload: Workload;
  //   currentResponseTime: number; // TODO implment this
  currentReplicas: number;
  currentUtilizationPercentage: number;
  targetReplicas: number;
  targetUtilizationPercentage: number;
}

export type HpaStatus = "configured" | "not-configured" | "multiple" | "not-created";

export interface ServiceConfigQueryResult {
  name: string;
  namespace: string;
  responseTime: number;
  hpaStatus: HpaStatus;
  serviceStatus?: ServiceStatus;
}

export interface Workload {
  name: string;
  namespace: string;
  type: WorkloadType;
}

export type WorkloadType = "deployment" | "statefulset" | "daemonset" | "job" | "cronjob";
