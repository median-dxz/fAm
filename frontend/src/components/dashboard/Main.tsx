"use client";

import type { Cluster } from "@kubernetes/client-node";
import { RiRefreshLine, RiGitForkLine, RiBox1Line, RiIdCardLine } from "@remixicon/react";
import { Button, Card, Badge } from "@tremor/react";
import { useCallback, useEffect, type MouseEventHandler } from "react";
import useSWRMutation from "swr/mutation";

import { FAM_API_KEY, apiBuilder } from "@/lib/endpoint";
import { NODE_ENV, IN_CLUSTER } from "@/lib/config";

export function Main() {
  const { data: kc, error, isMutating, trigger } = useSWRMutation(FAM_API_KEY.cluster, apiBuilder(FAM_API_KEY.cluster));

  const refresh: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    trigger({ param: { reuse: "false" } });
  }, [trigger]);

  useEffect(() => {
    trigger({ param: { reuse: "true" } });
  }, [trigger]);

  return (
    <>
      <Card className="w-fit min-w-12 text-xl mt-8">fill A moment</Card>
      <Button icon={RiRefreshLine} onClick={refresh} variant="secondary" loading={isMutating} loadingText="刷新中...">
        刷新
      </Button>
      {error ? <div>{error.message}</div> : kc ? <AppInfo cluster={kc} /> : <div>loading...</div>}
    </>
  );
}

const AppInfo = ({ cluster }: { cluster: Cluster }) => {
  const prod = NODE_ENV === "production";
  return (
    <div className="flex flex-row space-x-2 flex-wrap">
      <Badge icon={prod ? RiBox1Line : RiGitForkLine} color={prod ? "indigo" : "amber"}>
        env: {NODE_ENV}
      </Badge>
      <Badge icon={IN_CLUSTER ? RiBox1Line : RiGitForkLine} color={IN_CLUSTER ? "indigo" : "amber"}>
        in cluster: {IN_CLUSTER ? "true" : "false"}
      </Badge>
      {cluster && (
        <Badge icon={RiIdCardLine} color={"indigo"}>
          cluster: {cluster.name} - {cluster.server}
        </Badge>
      )}
    </div>
  );
};
