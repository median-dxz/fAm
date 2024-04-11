import { kube } from "@/server/client/kubernetes";
import { procedure, router } from "../trpc";

export const clusterRouter = router({
  reconnnect: procedure.mutation(() => {
    kube.load();
  }),
  get: procedure.query(async () => {
    const res = kube.kc.getCurrentCluster();
    return { name: String(res?.name), server: String(res?.server) };
  }),
});
