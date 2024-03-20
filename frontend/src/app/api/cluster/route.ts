import { NextResponse, type NextRequest } from "next/server";
import { k8sClient, api, kc } from "@/lib/k8sClient";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reuse = searchParams.get("reuse") === "true";
  try {
    if (!api || !reuse) {
      k8sClient.connect();
    }
    return Response.json(kc);
  } catch (error) {
    return NextResponse.json({}, { status: 500, statusText: (error as Error).message });
  }
}