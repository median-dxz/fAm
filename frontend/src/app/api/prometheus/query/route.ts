import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const prometheusUrl = process.env["PROMETHEUS_URL"];
  const res = await fetch(`${prometheusUrl}/api/v1/query?query=${query}`).then((r) => r.json());
  return Response.json(res);
}
