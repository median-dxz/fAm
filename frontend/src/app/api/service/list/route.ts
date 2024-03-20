import { k8sClient, api } from "@/lib/k8sClient";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const namespace = searchParams.get("namespace") ?? "default";

  try {
    if (!api) {
      k8sClient.connect();
    }
    const r = await api!.listNamespacedService(namespace);
    return NextResponse.json(r.body);
  } catch (error) {
    return NextResponse.json({}, { status: 500, statusText: (error as Error).message });
  }
}
