import { createContext } from "@/server/context";
import { appRouter } from "@/server/routers";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext,
    onError(opts) {
      const { error, type, path, input, ctx, req } = opts;
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error("TRPC Occur Error On Server Side: ", error);
        console.error("- Type: ", type);
        console.error("- Path: ", path);
        console.error("- Input: ", input);
        console.error("- Context: ", ctx);
        // console.error("- Request: ", req);
      }
    },
  });
}

export { handler as GET, handler as POST };
