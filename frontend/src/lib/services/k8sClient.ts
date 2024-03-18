import * as k8s from "@kubernetes/client-node";

// export const k8sClient = {};

const main = async () => {
  try {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    const podsRes = await k8sApi.listNamespacedPod("default");
    console.log(podsRes.body);
  } catch (err) {
    console.error(err);
  }
};

main();
