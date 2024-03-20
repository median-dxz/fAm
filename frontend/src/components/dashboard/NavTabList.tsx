"use client";

import { Tab } from "@headlessui/react";
import { usePathname } from "next/navigation";

import { Tab as FAmTab } from "@/components/dashboard/NavTab";
import { DashboardRouter } from "@/routers/DashboardRouter";

export function TabList() {
  const pathname = usePathname();
  const currentIndex = DashboardRouter.findIndex((route) => route.url === pathname);
  return (
    <Tab.Group vertical selectedIndex={currentIndex}>
      <Tab.List className="flex flex-col space-y-2 items-stretch bg-blue-900/25 rounded px-2 py-2">
        {DashboardRouter.map((route) => (
          <FAmTab key={route.url} route={route} />
        ))}
      </Tab.List>
    </Tab.Group>
  );
}
