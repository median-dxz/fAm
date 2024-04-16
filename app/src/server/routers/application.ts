import { ApplicationSettingKeys, settingManager } from "@/server/setting-manager";
import { z } from "zod";
import { kube } from "../client/kubernetes";
import { prometheus } from "../client/prometheus";
import { procedure, router } from "../trpc";

export interface ApplicationStatus {
  isDev: boolean;
  isProd: boolean;
  cluster: { name: string; server: string };
  inCluster: boolean;
  prometheusUrl?: string;
  clusterConnected: boolean;
  prometheusConnected: boolean;
  clusterConnectError: null | unknown;
  prometheusConnectError: null | unknown;
}

const getStatus = procedure.query<ApplicationStatus>(async () => {
  let cluster = null;
  let clusterConnected = false;
  let clusterConnectError = null;
  let prometheusConnected = false;
  let prometheusConnectError = null;

  try {
    kube.load();
    const r = await kube.api.core.listNamespace();
    if (r?.response?.statusCode === 200) {
      cluster = kube.kc.getCurrentCluster();
      clusterConnected = true;
    }
  } catch (e) {
    clusterConnectError = e;
    console.error("cluster connect error", e);
  }

  try {
    prometheusConnected = await prometheus.test();
  } catch (e) {
    prometheusConnectError = e;
    console.error("prometheus connect error", e);
  }

  return {
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV !== "development",
    cluster: { name: String(cluster?.name), server: String(cluster?.server) },
    inCluster: Boolean(process.env["KUBERNETES_SERVICE_HOST"]) && Boolean(process.env["KUBERNETES_SERVICE_PORT_HTTPS"]),
    clusterConnected,
    prometheusUrl: prometheus.url,
    prometheusConnected,
    clusterConnectError: null,
    prometheusConnectError: null,
  };
});

const getSetting = procedure
  .input(z.object({ item: z.enum(ApplicationSettingKeys) }))
  .query(async ({ input: { item } }) => {
    const settingItem = await settingManager.getItme(item);
    return settingItem;
  });

const patchSetting = procedure
  .input(
    z
      .object({
        item: z.enum(ApplicationSettingKeys),
        // value: z.union([z.object({ url: z.string() })]),
        value: z.object({ url: z.string() }),
      })
      .refine(({ item, value }) => {
        switch (item) {
          case "strategyService":
            return z.object({ url: z.string().url() }).safeParse(value).success;
          default:
            break;
        }
      }),
  )
  .mutation(async ({ input: { item, value } }) => {
    return settingManager.updateItme(item, value);
  });

export const applicationRouter = router({
  getStatus,
  getSetting,
  patchSetting,
  testStrategyService: procedure.input(z.string().url()).mutation(async ({ input: url }) => {
    try {
      await fetch(url);
      return { success: true, message: "测试成功" };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }),
  testPrometheus: procedure.input(z.string()).mutation(async ({ input: query }) => {
    return prometheus.query({ query });
  }),
});
