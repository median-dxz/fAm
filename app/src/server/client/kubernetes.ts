import * as k8s from "@kubernetes/client-node";

let kc: k8s.KubeConfig | null = null;
let api: {
  kubernetesObject: k8s.KubernetesObjectApi;
  apps: k8s.AppsV1Api;
  core: k8s.CoreV1Api;
  autoscaling: k8s.AutoscalingV2Api;
} | null = null;

export const kube = {
  get kc() {
    if (!kc) this.load();
    return kc!;
  },
  get api() {
    if (!kc) this.load();
    return api!;
  },
  load() {
    kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    api = {
      kubernetesObject: k8s.KubernetesObjectApi.makeApiClient(kc),
      apps: kc.makeApiClient(k8s.AppsV1Api),
      core: kc.makeApiClient(k8s.CoreV1Api),
      autoscaling: kc.makeApiClient(k8s.AutoscalingV2Api),
    };
  },
  tryLoad() {
    try {
      this.load();
      return true;
    } catch (error) {
      return false;
    }
  },
};
