export const dynamic = "force-dynamic";

import { kc, api, k8sClient } from "@/lib/k8sClient";

export async function GET() {
  let cluster = null;
  if (kc) {
    cluster = kc.getCurrentCluster();
  } else {
    k8sClient.connect();
  }

  // TODO move this to lib/k8sClient
  let clusterConnected = Boolean(api);
  if (clusterConnected) {
    try {
      const r = await api?.listPodForAllNamespaces();
      clusterConnected = false;
      if (r?.response?.statusCode === 200) {
        clusterConnected = true;
      }
    } catch (_e) {
      clusterConnected = false;
    }
  }

  // TODO move this to lib/promClient
  const inCluster =
    Boolean(process.env["KUBERNETES_SERVICE_HOST"]) && Boolean(process.env["KUBERNETES_SERVICE_PORT_HTTPS"]);
  let prometheusUrl = process.env["PROMETHEUS_URL"];
  if (inCluster && clusterConnected) {
    // TODO: get prometheus url from cluster ConfigMap
  }

  // TODO: test prometheus connection
  let prometheusConnected = Boolean(prometheusUrl);
  if (prometheusConnected) {
    try {
      const r = await fetch(`${prometheusUrl}/api/v1/targets`);
      prometheusConnected = r.ok && r.status === 200;
    } catch (_e) {
      prometheusConnected = false;
    }
  }

  const status = {
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV !== "development",
    cluster: { name: String(cluster?.name), server: String(cluster?.server) },
    inCluster,
    prometheusUrl,
    clusterConnected,
    prometheusConnected,
  };
  return Response.json(status);
}
