import { NavBar } from "@/components/dashboard/NavBar";
import type { PropsWithChildren } from "react";

export default function DashBoardLayout({ children }: PropsWithChildren<{}>) {
  return (
    <main className="w-full flex flex-row">
      <NavBar />
      {children}
    </main>
  );
}
