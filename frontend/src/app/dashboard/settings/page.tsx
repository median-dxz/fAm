import type { Metadata } from "next";

import { Main as DashBoardSettingsMain } from "@/components/dashboard/settings/Main";
import { settingManager } from "@/lib/setting";

export const metadata: Metadata = {
  title: "fAm | Dashboard - 设置",
};

export const dynamic = "force-dynamic";

export default async function DashboardSettings() {
  await settingManager.initCache();
  return <DashBoardSettingsMain setting={settingManager.cachedSetting!} />;
}
