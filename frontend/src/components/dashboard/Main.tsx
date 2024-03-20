"use client";

import type { KubeConfig } from "@kubernetes/client-node";
import { RiRefreshLine } from "@remixicon/react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react";
import { useCallback, useEffect, type MouseEventHandler } from "react";
import useSWRMutation from "swr/mutation";

import { FAM_API_KEY, apiBuilder } from "@/lib/endpoint";

export function Main() {
  const { data: kc, error, trigger } = useSWRMutation(FAM_API_KEY.cluster, apiBuilder(FAM_API_KEY.cluster));

  const refresh: MouseEventHandler<HTMLButtonElement> = useCallback(async () => {
    trigger({ param: { reuse: "false" } });
  }, [trigger]);

  useEffect(() => {
    trigger({ param: { reuse: "true" } });
  }, [trigger]);

  return (
    <>
      <Button icon={RiRefreshLine} onClick={refresh} variant="secondary">
        刷新
      </Button>
      {error ? <div>{error.message}</div> : kc ? <ClusterInfo kc={kc} /> : <div>loading...</div>}
    </>
  );
}

const ClusterInfo = ({ kc }: { kc: KubeConfig }) => {
  const { data, trigger } = useSWRMutation(FAM_API_KEY.serviceList, apiBuilder(FAM_API_KEY.serviceList));
  return (
    <div className="flex flex-col items-center">
      <h1>集群信息</h1>
      <pre>{JSON.stringify(kc["clusters"], null, 2)}</pre>
      <Button
        onClick={async () => {
          trigger({ param: {} });
        }}
        variant="secondary"
      >
        测试连接
      </Button>
      {data && (
        <>
          <h1>服务信息</h1>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell className="text-right">Monsters Slayed</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                <TableCell>Wilhelm Tell</TableCell>
                <TableCell className="text-right">1</TableCell>
                <TableCell>Uri, Schwyz, Unterwalden</TableCell>
                <TableCell>National Hero</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>The Witcher</TableCell>
                <TableCell className="text-right">129</TableCell>
                <TableCell>Kaedwen</TableCell>
                <TableCell>Legend</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mizutsune</TableCell>
                <TableCell className="text-right">82</TableCell>
                <TableCell>Japan</TableCell>
                <TableCell>N/A</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};
