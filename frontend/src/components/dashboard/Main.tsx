"use client";

import type { KubeConfig } from "@kubernetes/client-node";
import { RiRefreshLine } from "@remixicon/react";
import {
  Button,
  Card,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { useCallback, useEffect, type MouseEventHandler } from "react";
import useSWRMutation from "swr/mutation";

import { FAM_API_KEY, apiBuilder } from "@/lib/endpoint";

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
      {error ? <div>{error.message}</div> : kc ? <ClusterInfo kc={kc} /> : <div>loading...</div>}
    </>
  );
}

const ClusterInfo = ({ kc }: { kc: KubeConfig }) => {
  const { data, isMutating, trigger } = useSWRMutation(FAM_API_KEY.serviceList, apiBuilder(FAM_API_KEY.serviceList));
  return (
    <>
      <h1>集群信息</h1>
      {kc.clusters.map((cluster, index) => (
        <Card className="mx-auto max-w-md" key={index}>
          <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">
            {cluster.name}
          </h3>
          <List className="mt-2">
            {Object.entries(cluster).map(([key, value], index) => (
              <ListItem key={index}>
                <span className="font-medium">{key}</span> {JSON.stringify(value)}
              </ListItem>
            ))}
          </List>
        </Card>
      ))}
      <Button
        onClick={async () => {
          trigger({ param: {} });
        }}
        variant="secondary"
        loading={isMutating}
        loadingText="测试中..."
      >
        测试连接
      </Button>
      {data && (
        <Table className="w-full">
          <TableHead>
            <TableRow>
              <TableHeaderCell>服务</TableHeaderCell>
              <TableHeaderCell>集群IP</TableHeaderCell>
              <TableHeaderCell>端口</TableHeaderCell>
              <TableHeaderCell>选择器</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item?.metadata?.name ?? "unknown"}</TableCell>
                <TableCell>{item?.spec?.clusterIP ?? "unknown"}</TableCell>
                <TableCell>{JSON.stringify(item?.spec?.ports)}</TableCell>
                <TableCell>{JSON.stringify(item?.spec?.selector)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};
