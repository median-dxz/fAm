import * as k8s from "@kubernetes/client-node";

export type FAM_API = {
  "fam:api/cluster": {
    args: {
      param: {
        reuse?: string;
      };
    };
    response: k8s.KubeConfig;
  };
  "fam:api/service/list": {
    args: {
      param: {
        namespace?: string;
      };
    };
    response: k8s.V1ServiceList;
  };
};
