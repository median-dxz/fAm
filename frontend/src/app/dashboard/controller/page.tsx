import type { Metadata } from "next";

import { Main as DashboardControllerMain } from "@/components/dashboard/controller/Main";

export const metadata: Metadata = {
  title: "fAm | Dashboard - 响应时间配置",
};

export default function DashboardController() {
  return <DashboardControllerMain />;
}
