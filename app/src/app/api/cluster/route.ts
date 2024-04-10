import { type NextRequest } from "next/server";
import { k8sClient, api, kc } from "@/lib/k8sClient";
import { HttpError } from "@kubernetes/client-node";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reuse = searchParams.has("reuse");
  try {
    if (!api || !reuse) {
      k8sClient.connect();
    }
    const res = kc?.getCurrentCluster();
    return Response.json({ name: String(res?.name), server: String(res?.server) });
  } catch (error) {
    console.error(`[API]: Error on ${request.url}`);
    if (error instanceof HttpError) {
      console.error(JSON.stringify(error));
    } else {
      console.error(error);
    }
    return Response.json({}, { status: 500, statusText: (error as Error).message });
  }
}
