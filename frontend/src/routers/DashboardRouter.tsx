import type { Route } from "@/types/Route";
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
    name: "响应时间配置",
    icon: <RiTimerLine />,
    url: "/dashboard/controller",
  },
  {
    name: "设置",
    icon: <RiSettingsLine />,
    url: "/dashboard/settings",
  },
];
