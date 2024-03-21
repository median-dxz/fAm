import type { FAM_API } from "@/types/Endpoint";

export const FAM_API_CONFIG: Record<keyof FAM_API, { path: string; method: string }> = {
  "fam:api/cluster": { path: "cluster", method: "GET" },
  "fam:api/service/list": { path: "service/list", method: "GET" },
};

export const FAM_API_KEY = {
  cluster: "fam:api/cluster",
  serviceList: "fam:api/service/list",
} as const;

export function apiBuilder<API extends keyof FAM_API>(key: API) {
  return async (_url: string, { arg }: { arg: FAM_API[API]["args"] }) => {
    const { path, method } = FAM_API_CONFIG[key];
    const url = `/api/${path}`;
    const query = new URLSearchParams(arg.param as Record<string, string>).toString();

    return fetch(`${url}?${query}`, { method }).then(async (res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json() as Promise<FAM_API[API]["response"]>;
    });
  };
}
