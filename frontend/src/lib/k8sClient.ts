import * as k8s from "@kubernetes/client-node";

export let kc: k8s.KubeConfig | null = null;
export let api: k8s.CoreV1Api | null = null;

export const k8sClient = {
  connect() {
    kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    // 使用了该库的最后一个默认选项
    // https://github.com/kubernetes-client/javascript/blob/d923fc925610c4f96dd32c7316f3da5d6b909619/src/config.ts#L380
    if (JSON.stringify(kc.clusters[0]) === `{"name":"cluster","server":"http://localhost:8080"}`) {
      throw new Error("KubeConfig not found.");
    }
    api = kc.makeApiClient(k8s.CoreV1Api);
  },
};
