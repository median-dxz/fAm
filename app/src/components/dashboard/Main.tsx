"use client";

import { Loading } from "@/components/common/Loading";
import { trpc } from "@/utils/trpc";
import { RiBox1Line, RiGitForkLine, RiGlobalLine, RiRefreshLine } from "@remixicon/react";
import { Badge, Button, Legend } from "@tremor/react";
import { useCallback, type MouseEventHandler } from "react";

export function Main() {
  const clusterQuery = trpc.cluster.get.useQuery(undefined, { refetchOnWindowFocus: "always" });
  const clusterReconnect = trpc.cluster.reconnnect.useMutation();

  const refresh: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    await clusterReconnect.mutateAsync();
    clusterQuery.refetch();
  }, [clusterQuery, clusterReconnect]);

  return (
    <div className="flex flex-col w-[80%] mx-auto min-h-[100vh] justify-center items-center space-y-2">
      <div className="text-7xl font-bold bg-clip-text bg-gradient-to-br from-indigo-300 to-indigo-500 text-transparent">
        fill A moment
      </div>
      <span className="py-4">
        <Button
          icon={RiRefreshLine}
          onClick={refresh}
          variant="secondary"
          loading={clusterReconnect.isPending}
          loadingText="刷新中..."
        >
          刷新
        </Button>
      </span>
      {clusterQuery.isError ? <div>{clusterQuery.error.message}</div> : <AppInfo />}
    </div>
  );
}

const AppInfo = () => {
  const { data } = trpc.application.getStatus.useQuery();

  if (!data) return <Loading text="加载中..." />;

  const { isProd, inCluster, cluster, prometheusUrl, clusterConnected, prometheusConnected } = data;

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
