import type { Metadata } from "next";

import { Main as DashboardGraphMain } from "@/components/dashboard/graph/Main";

export const metadata: Metadata = {
  title: "fAm | Dashboard - 调用关系",
};

export default function DashboardGraph() {
  return <DashboardGraphMain />;
}
