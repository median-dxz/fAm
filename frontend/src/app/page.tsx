import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function Welcome() {
  redirect("/dashboard");
  return <></>;
}
