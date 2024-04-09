import type { ServiceConfig as UserConfig } from "@prisma/client";

export type ServiceConfig = UserConfig & {
  hpaEnabled: boolean;
  hpaStatus?: {
    currentReplicas: number;
    targetReplicas: number;
    currentUtilizationPercentage: number;
    targetUtilizationPercentage: number;
  };
  //   currentResponseTime: number; // TODO implment this
};
