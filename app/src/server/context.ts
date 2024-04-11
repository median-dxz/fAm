import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export function createContext({}: FetchCreateContextFnOptions) {
  return {};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
