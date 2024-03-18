import type { Metadata } from "next";
import { Card } from "@tremor/react";

export const metadata: Metadata = {
  title: "fAm | Dashboard",
};

import "@/lib/services/k8sClient";

export default function DashboardMain() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[100vh]">
      <Card className="w-fit min-w-12 text-9xl">Home Page</Card>
    </div>
  );
}
