import type { PropsWithChildren } from "react";

import { Nav } from "@/components/dashboard/Nav";

export default async function DashBoardLayout({ children }: PropsWithChildren<{}>) {
  return (
    <main className="w-full flex flex-row">
      <Nav />
      <div className="h-[100vh] w-full overflow-y-auto">{children}</div>
    </main>
  );
}
