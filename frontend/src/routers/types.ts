import type { ReactElement } from "react";

export interface Route {
  name: string;
  icon?: ReactElement;
  url: string;
}
