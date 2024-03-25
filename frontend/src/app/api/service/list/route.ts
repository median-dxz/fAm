import { k8sClient, api } from "@/lib/k8sClient";
import { HttpError } from "@kubernetes/client-node";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const namespace = searchParams.get("namespace") ?? "default";

  try {
    if (!api) {
      k8sClient.connect();
    }
    const r = await api!.listNamespacedService(namespace);
    return Response.json(r.body);
  } catch (error) {
    console.error(`[API]: ${request.url} ${JSON.stringify(error)}`);

    if (error instanceof HttpError) {
      return Response.json({}, { status: error.statusCode, statusText: error.body?.message });
    } else {
      return Response.json({}, { status: 500, statusText: (error as Error).message });
    }
  }
}
