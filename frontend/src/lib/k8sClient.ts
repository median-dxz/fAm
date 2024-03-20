import * as k8s from "@kubernetes/client-node";

export let kc: k8s.KubeConfig | null = null;
export let api: k8s.CoreV1Api | null = null;

export const k8sClient = {
  connect() {
    kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    api = kc.makeApiClient(k8s.CoreV1Api);
  },
};
