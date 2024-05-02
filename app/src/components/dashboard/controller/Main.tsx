"use client";

import { Loading } from "@/components/common/Loading";
import type { ServiceConfigQueryResult } from "@/server/controller/type";
import { trpc } from "@/utils/trpc";
import { Button, Divider } from "@tremor/react";
import { produce } from "immer";
import { useRef, useState } from "react";
import { ConfigCard } from "./ConfigCard";
import { generatePatchConfigs } from "./generatePatchConfigs";

export function Main() {
  const {
    data: serverData,
    refetch: refetchServiceConfig,
    error,
    isError,
  } = trpc.serviceConfig.get.useQuery(undefined, {
    refetchInterval: 1000 * 15,
  });
  const { mutateAsync, isPending } = trpc.serviceConfig.patch.useMutation({
    onSettled(data, error, variables, context) {
      refetchServiceConfig();
    },
  });
  const [config, setConfig] = useState<ServiceConfigQueryResult[] | undefined>(serverData);
  const [userModified, setUserModified] = useState(false);
  const previousSetting = useRef(serverData);

  if (previousSetting.current !== serverData) {
    previousSetting.current = serverData;
    setConfig(serverData);
    setUserModified(false);
  }

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
        <ConfigCardGroup
          key={namespace}
          namespace={namespace}
          configs={configs}
          onChange={(newValue: ServiceConfigQueryResult[]) => {
            setUserModified(true);
            setConfig(
              produce((draft) => {
                if (!draft) return;
                newValue.forEach((newConfig) => {
                  const index = draft.findIndex(
                    (c) => c.serviceName === newConfig.serviceName && c.serviceNamespace === newConfig.serviceNamespace,
                  );
                  draft[index] = newConfig;
                });
              }),
            );
          }}
        />
      ))
    : null;

  return (
    <div className="flex flex-row flex-wrap min-h-[100vh] w-[80%] mx-auto justify-center items-center py-6 space-y-6">
      {isError ? (
        errorComponent
      ) : config == undefined || isPending ? (
        <div className="w-full flex justify-center">
          <Loading size="3rem" />
        </div>
      ) : (
        contentComponent
      )}
      {config != undefined && serverData != undefined && userModified && !isPending && (
        <Button
          onClick={() => {
            mutateAsync(generatePatchConfigs(serverData, config));
          }}
        >
          Save
        </Button>
      )}
    </div>
  );
}

interface ConfigCardGroupProps {
  namespace: string;
  configs: ServiceConfigQueryResult[];
  onChange: (newValue: ServiceConfigQueryResult[]) => void;
}

function ConfigCardGroup({ namespace, configs, onChange }: ConfigCardGroupProps) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      <p className="text-tremor-title font-bold text-tremor-content-strong">Namespace: {namespace}</p>
      <Divider />
      <div className="flex flex-col gap-4">
        {configs.map((config) => {
          return (
            <ConfigCard
              key={`${config.serviceNamespace}-${config.serviceName}`}
              config={config}
              onChange={(newConfig) => {
                onChange(
                  produce(configs, (draft) => {
                    const index = draft.findIndex((c) => c.serviceName === config.serviceName);
                    draft[index] = { ...draft[index], ...newConfig };
                  }),
                );
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
