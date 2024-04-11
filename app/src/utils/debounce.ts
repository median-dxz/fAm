export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timer: number;
  return (...args: Parameters<T>): Promise<ReturnType<T>> =>
    new Promise((resolve) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        resolve(fn(...args));
      }, delay);
    });
};
