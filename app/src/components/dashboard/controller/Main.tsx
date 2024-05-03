"use client";

import { Loading } from "@/components/common/Loading";
import type { ServiceConfigQueryResult } from "@/server/controller/type";
import { trpc } from "@/utils/trpc";
import { Divider } from "@tremor/react";
import { ConfigCard } from "./ConfigCard";

export function Main() {
  const {
    data: config,
    refetch: refetchServiceConfig,
    error,
    isError,
  } = trpc.serviceConfig.get.useQuery(undefined, {
    refetchInterval: 15 * 1000,
  });

  const configByGroup = config?.reduce(
    (acc, c) => {
      if (!acc[c.serviceNamespace]) {
        acc[c.serviceNamespace] = [];
      }
      acc[c.serviceNamespace].push(c);
      return acc;
    },
    {} as Record<string, ServiceConfigQueryResult[]>,
  );

  const errorComponent = <div className="text-tremor-title text-tremor-content-emphasis">Error: {error?.message}</div>;

  const contentComponent = configByGroup
    ? Object.entries(configByGroup).map(([namespace, configs]) => (
        <ConfigCardGroup key={namespace} namespace={namespace} configs={configs} onChange={refetchServiceConfig} />
      ))
    : null;

  return (
    <div className="flex flex-row flex-wrap min-h-[100vh] w-[80%] mx-auto justify-center items-center py-6 space-y-6">
      {isError ? (
        errorComponent
      ) : config == undefined ? (
        <div className="w-full flex justify-center">
          <Loading size="3rem" />
        </div>
      ) : (
        contentComponent
      )}
    </div>
  );
}

interface ConfigCardGroupProps {
  namespace: string;
  configs: ServiceConfigQueryResult[];
  onChange: () => void;
}

function ConfigCardGroup({ namespace, configs, onChange }: ConfigCardGroupProps) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      <p className="text-tremor-title font-bold text-tremor-content-strong">Namespace: {namespace}</p>
      <Divider />
      <div className="flex flex-col gap-4">
        {configs.map((config) => {
          return (
            <ConfigCard key={`${config.serviceNamespace}-${config.serviceName}`} config={config} onChange={onChange} />
          );
        })}
      </div>
    </div>
  );
}
