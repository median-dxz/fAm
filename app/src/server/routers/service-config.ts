import { ServiceHorizontalPodAutoscalerController } from "@/server/controller";
import { HpaPatchConfigSchema, ServiceQuerySchema, type ServiceConfigQueryResult } from "@/server/controller/type";
import { procedure, router } from "@/server/trpc";

import { z } from "zod";

export const serviceConfigRouter = router({
  get: procedure.input(z.array(ServiceQuerySchema).optional()).query(async ({ input: queries }) => {
    return ServiceHorizontalPodAutoscalerController.fromServiceQueries(queries).then((results) => {
      return Promise.all(
        results.map(async (result) => {
          const workloadStatus = await result.workloadStatus();
          return {
            serviceName: result.serviceName,
            serviceNamespace: result.serviceNamespace,
            responseTime: result.responseTime,
            hpaState: result.hpaState,
            workload: result.workloads?.[0],
            workloadStatus,
          } satisfies ServiceConfigQueryResult;
        }),
      );
    });
  }),
  patch: procedure.input(z.array(HpaPatchConfigSchema)).mutation(async ({ input: queries }) => {
    const controllers = await ServiceHorizontalPodAutoscalerController.fromServiceQueries(queries);

    const patchResults = [];

    for (let i = 0; i < queries.length; i++) {
      console.log(`patching ${queries[i].serviceNamespace}/${queries[i].serviceName}`);
      patchResults.push(await controllers[i].patch(queries[i]));
      console.log(`patch result: ${patchResults[i].message}`);
    }

    return { results: patchResults };
  }),
});
