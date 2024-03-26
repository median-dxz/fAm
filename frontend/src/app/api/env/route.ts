import { type NextRequest } from "next/server";

import * as config from "@/lib/config";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const envList = searchParams.get("name")?.split(",");

  try {
    if (!envList) {
      return Response.json([config.IN_CLUSTER, config.NODE_ENV]);
    }
    return Response.json(envList.map((k) => config[k]));
  } catch (error) {
    console.error(`[API]: Error on ${request.url}`);
    console.error(error);
    return Response.json({}, { status: 500, statusText: (error as Error).message });
  }
}
