"use client";

import type { Cluster } from "@kubernetes/client-node";
import { RiRefreshLine, RiGitForkLine, RiBox1Line, RiIdCardLine } from "@remixicon/react";
import { Button, Card, Badge } from "@tremor/react";
import { useCallback, useEffect, type MouseEventHandler } from "react";
import useSWRMutation from "swr/mutation";

import { FAM_API_KEY, mutationApiBuilder, queryApiBuilder } from "@/lib/endpoint";
import useSWR from "swr";

const getCluster = mutationApiBuilder(FAM_API_KEY.cluster);
const listServices = mutationApiBuilder(FAM_API_KEY.serviceList);
const getApplicationEnvironment = queryApiBuilder(FAM_API_KEY.env);

export function Main() {
  const { data: kc, error, isMutating, trigger } = useSWRMutation(FAM_API_KEY.cluster, getCluster);

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
  const { data: env } = useSWR(FAM_API_KEY.env, getApplicationEnvironment);

  if (!env) {
    return <Button loading={true} loadingText="拉取数据中..." variant="secondary" />;
  }

  const { inCluster, isProd } = env;

  return (
    <div className="flex flex-row space-x-2 flex-wrap">
      <Badge icon={isProd ? RiBox1Line : RiGitForkLine} color={isProd ? "indigo" : "amber"}>
        env: {isProd ? "production" : "development"}
      </Badge>
      <Badge icon={inCluster ? RiBox1Line : RiGitForkLine} color={inCluster ? "indigo" : "amber"}>
        in cluster: {inCluster ? "true" : "false"}
      </Badge>
      {cluster && (
        <Badge icon={RiIdCardLine} color={"indigo"}>
          cluster: {cluster.name} - {cluster.server}
        </Badge>
      )}
    </div>
  );
};
