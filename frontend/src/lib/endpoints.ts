import * as k8s from "@kubernetes/client-node";

export type FAM_API = {
  "fam:cluster": {
    args: {
      param?: {
        reuse?: string;
      };
      body?: undefined;
    };
    response: k8s.Cluster;
  };
  "fam:cluster/service/list": {
    args: {
      param?: {
        namespace?: string;
      };
      body?: undefined;
    };
    response: k8s.V1ServiceList;
  };
  "fam:server/status": {
    args: { param?: undefined; body?: undefined };
    response: {
      isDev: boolean;
      isProd: boolean;
      cluster: { name: string; server: string };
      inCluster: boolean;
      prometheusUrl: string | undefined;
      clusterConnected: boolean;
      prometheusConnected: boolean;
    };
  };
};

export const FAM_API_CONFIG = {
  "fam:cluster": { path: "cluster", method: "GET" },
  "fam:cluster/service/list": { path: "cluster/service/list", method: "GET" },
  "fam:server/status": { path: "server/status", method: "GET" },
} as const;

export function mutationApiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API) {
  return async (_url: string, { arg }: { arg: FAM_API[API]["args"] }) => apiBuilder(key, arg);
}

export function queryApiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API) {
  return async (_url: string) => apiBuilder(key, { param: undefined, body: undefined });
}

async function apiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API, arg: FAM_API[API]["args"]) {
  const { path, method } = FAM_API_CONFIG[key];
  let url = `/api/${path}`;
  if (arg?.param) {
    const query = new URLSearchParams(arg.param as Record<string, string>).toString();
    url += `?${query}`;
  }

  const res = await fetch(url, { method });
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return await (res.json() as Promise<FAM_API[API]["response"]>);
}
