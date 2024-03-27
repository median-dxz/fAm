import clsx from "clsx/lite";
import Link from "next/link";
import { Tab as HTab } from "@headlessui/react";
import { Fragment } from "react";

import type { Route } from "@/routers/types";

const tabStyle = (selected: boolean) =>
  clsx(
    `px-4 py-2 text-[16px] flex flex-row space-x-2 focus-visible:outline-none focus:outline-none transition-colors rounded decoration-none select-none`,
    selected
      ? `bg-cyan-50 text-tremor-content-strong hover:bg-cyan-50 hover:text-tremor-content-strong`
      : `text-white bg-transparent hover:bg-blue-900/25`,
  );

export interface TabProps {
  route: Route;
}

export function Tab({ route }: TabProps) {
  return (
    <HTab as={Fragment}>
      {({ selected }) => (
        <Link href={route.url} className={tabStyle(selected)}>
          {route.icon}
          <span>{route.name}</span>
        </Link>
      )}
    </HTab>
  );
}
