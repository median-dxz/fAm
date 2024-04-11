import { useCallback, useRef } from "react";

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const handle = useRef<null | NodeJS.Timeout>(null);

  const trigger = useCallback(
    (...args: any[]) => {
      handle.current && clearTimeout(handle.current);
      handle.current = setTimeout(() => {
        fn(...args);
        handle.current = null;
      }, delay);
    },
    [fn, delay],
  );

  return trigger;
}
