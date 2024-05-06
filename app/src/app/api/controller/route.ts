import { kube } from "@/server/client/kubernetes";
import { ServiceHorizontalPodAutoscalerController } from "@/server/controller";
import type { StrategyQueryResponse } from "@fam/strategy-service-type";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, message: "Test Succeed" });
}

export async function POST(request: Request) {
  try {
    const body: StrategyQueryResponse = await request.json();
    console.log(body);
    const { error, success, result, service } = body;
    if (!success) {
      throw new Error(JSON.stringify(error));
    }

    const [controller] = await ServiceHorizontalPodAutoscalerController.fromServiceQueries([
      {
        serviceName: service.name,
        serviceNamespace: service.namespace,
      },
    ] as const);

    const r = await kube.api.autoscaling.patchNamespacedHorizontalPodAutoscaler(
      controller.horizontalPodAutoscalers?.[0].metadata?.name!,
      service.namespace,
      {
        spec: {
          metrics: ServiceHorizontalPodAutoscalerController.getHorizontalPodAutoscalerPatchObject(result!),
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { "Content-Type": "application/merge-patch+json" } },
    );

    return Response.json({ success: true, hpa: r.body, message: "HPA patched successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return Response.json({ success: false, message: JSON.stringify(error) });
  }
}
