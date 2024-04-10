import type { ServiceConfig as UserConfig } from "@prisma/client";

export type ServiceConfig = UserConfig & {
  hpaStatus: "configured" | "not-configured" | "not-created";
  hpaRunningStatus?: {
    currentReplicas: number;
    targetReplicas: number;
    currentUtilizationPercentage: number;
    targetUtilizationPercentage: number;
  };
  //   currentResponseTime: number; // TODO implment this
};
