import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function Welcome({ children }: PropsWithChildren<{}>) {
  redirect("/dashboard");
  return <></>;
}
