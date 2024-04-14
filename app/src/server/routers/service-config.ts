import { ServiceHorizontalPodAutoscalerController } from "@/server/controller";
import { HpaPatchConfigSchema, ServiceQuerySchema, type ServiceConfigQueryResult } from "@/server/controller/type";
import { procedure, router } from "@/server/trpc";

import { z } from "zod";

export const serviceConfigRouter = router({
  get: procedure.input(z.array(ServiceQuerySchema).optional()).query(async ({ input: queries }) => {
    return (await ServiceHorizontalPodAutoscalerController.fromServiceQueries(queries)).map((result) => {
      return {
        serviceName: result.serviceName,
        serviceNamespace: result.serviceNamespace,
        responseTime: result.responseTime,
        hpaState: result.hpaStatus,
        workload: result.workloads?.[0],
        workloadStatus: result.workloadStatus,
      } satisfies ServiceConfigQueryResult;
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
