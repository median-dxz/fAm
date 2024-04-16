import { RiLoader5Line } from "@remixicon/react";
import clsx from "clsx";

export interface LoadingProps {
  text?: string;
  textClassName?: string;
  size?: string | number;
  fontSize?: string;
}

export function Loading({ text, textClassName, size, fontSize }: LoadingProps) {
  return (
    <div className="flex flex-row items-center space-x-2">
      <RiLoader5Line className="animate-spin text-tremor-brand" size={size} />
      {text && <span className={clsx(textClassName, fontSize && `text-[${fontSize}]`)}>{text}</span>}
    </div>
  );
}
