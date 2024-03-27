"use client";

import { RiRefreshLine, RiGitForkLine, RiBox1Line, RiGlobalLine, RiServerLine } from "@remixicon/react";
import { Button, Badge, Legend } from "@tremor/react";
import { useCallback, useEffect, type MouseEventHandler } from "react";
import useSWRMutation from "swr/mutation";

import { mutationApiBuilder, queryApiBuilder } from "@/lib/endpoints";
import useSWR from "swr";

const getCluster = mutationApiBuilder("fam:cluster");
const getApplicationStatus = queryApiBuilder("fam:server/status");

export function Main() {
  const { error, isMutating, trigger } = useSWRMutation("fam:cluster", getCluster);
  const { data: status, mutate } = useSWR("fam:server/status", getApplicationStatus);

  const refresh: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    trigger({});
    mutate();
  }, [trigger, mutate]);

  useEffect(() => {
    trigger({ param: { reuse: "true" } });
  }, [trigger]);

  return (
    <div className="flex flex-col w-[80%] justify-center items-center space-y-2">
      <div className="text-7xl font-bold bg-clip-text bg-gradient-to-br from-indigo-300 to-indigo-500 text-transparent">
        fill A moment
      </div>
      <span className="py-4">
        <Button icon={RiRefreshLine} onClick={refresh} variant="secondary" loading={isMutating} loadingText="刷新中...">
          刷新
        </Button>
      </span>
      {error ? (
        <div>{error.message}</div>
      ) : status ? (
        <AppInfo {...status} />
      ) : (
        <Button loading={true} loadingText="拉取数据中..." variant="secondary" />
      )}
    </div>
  );
}

const AppInfo = ({
  cluster,
  inCluster,
  isProd,
  clusterConnected,
  prometheusConnected,
  prometheusUrl,
}: Awaited<ReturnType<typeof getApplicationStatus>>) => {
  return (
    <>
      <div className="flex flex-row flex-wrap w-[80%] justify-center *:m-2">
        <Badge icon={isProd ? RiBox1Line : RiGitForkLine} color={isProd ? "indigo" : "amber"}>
          env: {isProd ? "production" : "development"}
        </Badge>
        <Badge icon={inCluster ? RiBox1Line : RiGitForkLine} color={inCluster ? "indigo" : "amber"}>
          in cluster: {inCluster ? "true" : "false"}
        </Badge>
        <Badge icon={RiGlobalLine} color={cluster ? "indigo" : "red"}>
          cluster: {cluster ? `${cluster.name} - ${cluster.server}` : "unknown"}
        </Badge>
        <Badge icon={RiGlobalLine} color={prometheusUrl ? "indigo" : "red"}>
          prometheusUrl: {prometheusUrl ? prometheusUrl : "未配置"}
        </Badge>
      </div>
      <div className="flex flex-row flex-wrap w-[80%] justify-center">
        <Legend
          colors={[clusterConnected ? "indigo" : "red", prometheusConnected ? "indigo" : "red"]}
          categories={[
            `cluster: ${clusterConnected ? "已连接" : "未连接"}`,
            `prometheus: ${prometheusConnected ? "已连接" : "未连接"}`,
          ]}
        />
      </div>
    </>
  );
};
