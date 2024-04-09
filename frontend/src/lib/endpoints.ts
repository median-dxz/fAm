import * as k8s from "@kubernetes/client-node";
import type { StrategyService } from "./setting";
import type { ServiceConfig } from "@prisma/client";
import type { Graph } from "./graph/type";

export type FAM_API = {
  "get:cluster": {
    args: {
      param?: {
        reuse?: string;
      };
      body?: undefined;
    };
    response: k8s.Cluster;
  };
  "get:cluster/service/list": {
    args: {
      param?: {
        namespace?: string;
      };
      body?: undefined;
    };
    response: k8s.V1ServiceList;
  };
  "get:server/status": {
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
  "put:server/setting/strategy-service": {
    args: { param?: undefined; body: StrategyService };
    response: ServiceConfig[];
  };
  "get:server/setting/strategy-service": {
    args: { param?: undefined; body?: undefined };
    response: StrategyService;
  };
  "post:cluster/service/config": {
    args: {
      param?: undefined;
      body?: Array<{ name: string; namespace: string }>;
    };
    response: ServiceConfig[];
  };
  "put:cluster/service/config": {
    args: { param?: undefined; body: ServiceConfig[] };
    response: ServiceConfig[] | null;
  };
  "get:server/graph": { args: { param?: undefined; body?: undefined }; response: Graph };
};

export const FAM_API_CONFIG = {
  "get:cluster": { path: "cluster", method: "GET" },
  "get:cluster/service/list": { path: "cluster/service/list", method: "GET" },
  "get:server/status": { path: "server/status", method: "GET" },
  "put:server/setting/strategy-service": { path: "server/setting/strategy-service", method: "PUT" },
  "get:server/setting/strategy-service": { path: "server/setting/strategy-service", method: "GET" },
  "post:cluster/service/config": { path: "cluster/service/config", method: "POST" },
  "put:cluster/service/config": { path: "cluster/service/config", method: "PUT" },
  "get:server/graph": { path: "server/graph", method: "GET" },
} as const;

export function mutationSWRApiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API) {
  return async (_url: string, { arg }: { arg: FAM_API[API]["args"] }) => apiRunner(key, arg);
}

export function querySWRApiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API) {
  return async (_url: string) => apiRunner(key, { param: undefined, body: undefined });
}

export function mutationApiBuilder<API extends keyof typeof FAM_API_CONFIG>(key: API) {
  return async (arg: FAM_API[API]["args"]) => apiRunner(key, arg);
}

async function apiRunner<API extends keyof typeof FAM_API_CONFIG>(key: API, arg: FAM_API[API]["args"]) {
  const { path, method } = FAM_API_CONFIG[key];
  let url = `/api/${path}`;
  if (arg?.param) {
    const query = new URLSearchParams(arg.param as Record<string, string>).toString();
    url += `?${query}`;
  }

  const res = await fetch(url, { method, body: arg?.body ? JSON.stringify(arg.body) : undefined });
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return await (res.json() as Promise<FAM_API[API]["response"]>);
}
