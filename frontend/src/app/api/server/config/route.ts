export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prismaClient";

export async function GET() {
  const n = await prisma.strategyService.count();
  return Response.json({ n });
}
