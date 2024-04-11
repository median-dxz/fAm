export interface ServiceStatus {
  workload: {
    name: string;
    namespace: string;
  };
  //   currentResponseTime: number; // TODO implment this
  currentReplicas: number;
  currentUtilizationPercentage: number;
  targetReplicas: number;
  targetUtilizationPercentage: number;
}

export type HpaStatus = "configured" | "not-configured" | "not-created";

export interface ServiceConfigQueryResult {
  name: string;
  namespace: string;
  responseTime: number;
  hpaStatus: HpaStatus;
  serviceStatus?: ServiceStatus;
}
