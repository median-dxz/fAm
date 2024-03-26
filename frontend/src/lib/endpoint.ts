import type { FAM_API } from "@/types/Endpoint";

export const FAM_API_CONFIG: Record<keyof FAM_API, { path: string; method: string }> = {
  "fam:api/cluster": { path: "cluster", method: "GET" },
  "fam:api/service/list": { path: "service/list", method: "GET" },
  "fam:api/env": { path: "env", method: "GET" },
};

export const FAM_API_KEY = {
  cluster: "fam:api/cluster",
  serviceList: "fam:api/service/list",
  env: "fam:api/env",
} as const;

export function mutationApiBuilder<API extends keyof FAM_API>(key: API) {
  return async (_url: string, { arg }: { arg: FAM_API[API]["args"] }) => apiBuilder(key, arg);
}

export function queryApiBuilder<API extends keyof FAM_API>(key: API) {
  return async (_url: string) => apiBuilder(key, {});
}

async function apiBuilder<API extends keyof FAM_API>(key: API, arg: FAM_API[API]["args"]) {
  const { path, method } = FAM_API_CONFIG[key];
  let url = `/api/${path}`;
  if (arg.param) {
    const query = new URLSearchParams(arg.param as Record<string, string>).toString();
    url += `?${query}`;
  }

  const res = await fetch(url, { method });
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return await (res.json() as Promise<FAM_API[API]["response"]>);
}
