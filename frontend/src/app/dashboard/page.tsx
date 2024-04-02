import type { Metadata } from "next";

import { Main as DashBoardMain } from "@/components/dashboard/Main";

export const metadata: Metadata = {
  title: "fAm | Dashboard",
};

export default function DashboardMain() {
  return <DashBoardMain />;
}
