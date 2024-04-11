import { router } from "../trpc";

import { applicationRouter } from "./application";
import { clusterRouter } from "./cluster";
import { graphRouter } from "./graph";
import { serviceConfigRouter } from "./service-config";

export const appRouter = router({
  cluster: clusterRouter,
  application: applicationRouter,
  serviceConfig: serviceConfigRouter,
  graph: graphRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
