import type { Route } from "@/routers/types";
import { RiHomeLine, RiNodeTree, RiTimerLine, RiSettingsLine } from "@remixicon/react";

export const DashboardRouter: Route[] = [
  {
    name: "首页",
    icon: <RiHomeLine />,
    url: "/dashboard",
  },
  {
    name: "调用关系",
    icon: <RiNodeTree />,
    url: "/dashboard/graph",
  },
  {
    name: "服务配置",
    icon: <RiTimerLine />,
    url: "/dashboard/controller",
  },
  {
    name: "设置",
    icon: <RiSettingsLine />,
    url: "/dashboard/settings",
  },
];
