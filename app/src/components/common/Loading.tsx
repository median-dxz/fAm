import { RiLoader5Line } from "@remixicon/react";

export interface LoadingProps {
  text?: string;
  textClassName?: string;
}

export function Loading({ text, textClassName }: LoadingProps) {
  return (
    <div className="flex flex-row items-center space-x-2">
      <RiLoader5Line className="animate-spin text-tremor-brand" />
      {text && <span className={textClassName}>{text}</span>}
    </div>
  );
}
