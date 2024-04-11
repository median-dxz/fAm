import type { Metadata } from "next";

import { Main as DashBoardSettingsMain } from "@/components/dashboard/settings/Main";
import { settingManager } from "@/server/setting-manager";

export const metadata: Metadata = {
  title: "fAm | Dashboard - 设置",
};

export const dynamic = "force-dynamic";

export default async function DashboardSettings() {
  return <DashBoardSettingsMain />;
}
