"use client";

import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";

import { Tab as FAmTab } from "@/components/dashboard/Tab";
import { DashboardRouter } from "@/routers/DashboardRouter";

export function NavBar() {
  const [currentRoute, setCurrentRoute] = useState(0);

  useEffect(() => {
    setCurrentRoute(DashboardRouter.findIndex((route) => route.url === window.location.pathname));
  }, []);

  return (
    <nav className="flex flex-col drop-shadow justify-end h-[100vh] px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-500">
      <p className="text-center text-[5rem] font-semibold bg-clip-text text-white">fAm</p>
      <div className="relative h-full mt-2">
        <Tab.Group vertical defaultIndex={currentRoute}>
          <Tab.List className="flex flex-col space-y-2 items-stretch bg-blue-900/25 rounded px-2 py-2">
            {DashboardRouter.map((route, index) => (
              <FAmTab key={route.url} route={route} />
            ))}
          </Tab.List>
        </Tab.Group>
      </div>
    </nav>
  );
}
