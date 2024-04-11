"use client";

import { Loading } from "@/components/common/Loading";
import type { ServiceConfigQueryResult } from "@/server/controller/type";
import { trpc } from "@/utils/trpc";
import { Button, Card, Divider, NumberInput } from "@tremor/react";
import { useState } from "react";

export function Main() {
  const { data: serverData } = trpc.serviceConfig.get.useQuery();
  const [config, setConfig] = useState<ServiceConfigQueryResult[] | undefined>(serverData);

  if (config == undefined && serverData != undefined) {
    setConfig(serverData);
  }

  const configByGroup = config?.reduce(
    (acc, c) => {
      if (!acc[c.namespace]) {
        acc[c.namespace] = [];
      }
      acc[c.namespace].push(c);
      return acc;
    },
    {} as Record<string, ServiceConfigQueryResult[]>,
  );

  return (
    <div className="flex flex-row flex-wrap min-h-[100vh] w-[80%] mx-auto justify-center items-start py-6 space-y-6">
      {config == undefined ? (
        <Loading />
      ) : (
        Object.entries(configByGroup!).map(([namespace, configs]) => {
          return (
            <ConfigCardGroup
              key={namespace}
              namespace={namespace}
              configs={configs}
              onChange={(newValue: ServiceConfigQueryResult[]) => {
                setConfig((config) => {
                  return config?.map((c) => {
                    if (c.namespace === namespace) {
                      return newValue.find((nc) => nc.name === c.name) || c;
                    }
                    return c;
                  });
                });
              }}
            />
          );
        })
      )}
      {config != undefined && serverData != undefined && serverData != config && (
        <Button onClick={() => {}}>Save</Button>
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
      <div className="flex flex-row flex-wrap gap-4">
        {configs.map((config) => {
          return (
            <ConfigCard
              key={`${config.namespace}-${config.name}`}
              config={config}
              onChange={(newConfig: { responseTime: number }) => {
                onChange(configs.map((c) => (c.name === config.name ? { ...c, ...newConfig } : c)));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ConfigCardProps {
  config: ServiceConfigQueryResult;
  onChange: (newConfig: { responseTime: number }) => void;
}

function ConfigCard({ config, onChange }: ConfigCardProps) {
  return (
    <Card className="flex flex-col space-y-4 w-fit">
      <p className="text-tremor-title font-bold text-tremor-content-strong">{config.name}</p>
      <Divider />
      <span>HPA Status: {config.hpaStatus}</span>
      {config.serviceStatus && (
        <>
          <span>
            Replicas: {config.serviceStatus?.currentReplicas} / {config.serviceStatus?.targetReplicas}
          </span>
          <span>
            Utilization: {config.serviceStatus?.currentUtilizationPercentage}% /{" "}
            {config.serviceStatus?.targetUtilizationPercentage}%
          </span>
        </>
      )}

      <div className="flex flex-row items-center space-x-2">
        <span className="whitespace-nowrap">Response Time: </span>
        <NumberInput
          name="responseTime"
          enableStepper={false}
          value={config.responseTime === -1 ? "" : config.responseTime}
          min={1}
          onValueChange={(newValue) => {
            onChange({
              responseTime: newValue == null || isNaN(newValue) ? -1 : newValue,
            });
          }}
        />
        <span className="text-tremor-content">ms</span>
      </div>
    </Card>
  );
}
