import type { Metadata } from "next";

import { Main as DashBoardMain } from "@/components/dashboard/Main";

export const metadata: Metadata = {
  title: "fAm | Dashboard",
};

export default async function DashboardMain() {
  return (
    <div className="flex flex-col min-h-[100vh] items-center justify-center space-y-8">
      <DashBoardMain />
    </div>
  );
}
