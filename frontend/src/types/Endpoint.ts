import * as k8s from "@kubernetes/client-node";

export type FAM_API = {
  [api: string]: {
    args: {
      param?: {
        [key: string]: string | undefined;
      };
      body?: unknown;
    };
    response: unknown;
  };
  "fam:api/cluster": {
    args: {
      param: {
        reuse?: string;
      };
    };
    response: k8s.Cluster;
  };
  "fam:api/service/list": {
    args: {
      param: {
        namespace?: string;
      };
    };
    response: k8s.V1ServiceList;
  };
  "fam:api/env": {
    args: {};
    response: {
      isDev: boolean;
      isProd: boolean;
      inCluster: boolean;
      prometheusUrl: string | undefined;
    };
  };
};
