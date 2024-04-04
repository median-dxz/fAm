import type { Metadata } from "next";

import { Main as DashBoardSettingsMain } from "@/components/dashboard/settings/Main";

export const metadata: Metadata = {
  title: "fAm | Dashboard - 设置",
};

export default function DashboardSettings() {
  return <DashBoardSettingsMain />;
}
