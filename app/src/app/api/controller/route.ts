import { ServiceHorizontalPodAutoscalerController } from "@/server/controller";
import type { StrategyQueryResponse } from "@fam/strategy-service-type";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, message: "Test Succeed" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { error, success, result } = JSON.parse(body) as StrategyQueryResponse;
    if (!success) {
      throw new Error(JSON.stringify(error));
    }

    const controller = new ServiceHorizontalPodAutoscalerController(
      service.metadata?.name!,
      service.metadata?.namespace,
    );

    controller.workloads = await getWorkloadsByServiceSpec(service.spec!);
    controller.updateHorizontalPodAutoscaler(hpaList);

    return Response.json({ success: true, message: "Success Ap" });
  } catch (error) {
    console.error("Error: ", error);
    return Response.json({ success: false, message: "Error" });
  }
}
