import type { HpaPatchRequest, ServiceConfigQueryResult } from "@/server/controller/type";

export function generatePatchConfigs(
  config: ServiceConfigQueryResult[],
  modifiedConfig: (Omit<ServiceConfigQueryResult, "responseTime"> & { responseTime?: number })[],
): HpaPatchRequest[] {
  if (config.length !== modifiedConfig.length) {
    throw new Error("Unreachable Code: 配置项不一致");
  }
  const patchConfigs: HpaPatchRequest[] = [];
  for (let i = 0; i < config.length; i++) {
    const c = config[i];
    const m = modifiedConfig[i];
    if (c.serviceName !== m.serviceName || c.serviceNamespace !== m.serviceNamespace) {
      throw new Error("Unreachable Code: 配置项不一致");
    }
    if (c.responseTime !== m.responseTime) {
      patchConfigs.push({
        responseTime: m.responseTime,
        serviceName: m.serviceName,
        serviceNamespace: m.serviceNamespace,
      });
    }
  }
  return patchConfigs;
}
