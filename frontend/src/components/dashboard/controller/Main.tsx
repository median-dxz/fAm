"use client";

import { Loading } from "@/components/common/Loading";
import { mutationApiBuilder, querySWRApiBuilder } from "@/lib/endpoints";
import type { ServiceConfig } from "@/lib/controller/type";
import { Button, Card, Divider, Legend, NumberInput, Switch } from "@tremor/react";
import { useState } from "react";
import useSWR from "swr";

const queryServiceConfig = querySWRApiBuilder("post:cluster/service/config");
const updateServiceConfig = mutationApiBuilder("put:cluster/service/config");

export function Main() {
  const { data: serverData, mutate } = useSWR("post:cluster/service/config", queryServiceConfig);
  const [config, setConfig] = useState<ServiceConfig[] | undefined>(serverData);

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
    {} as Record<string, ServiceConfig[]>,
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
              onChange={(newValue: ServiceConfig[]) => {
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
        <Button
          onClick={() => {
            mutate(
              (async () => {
                updateServiceConfig({ body: config });
                return undefined;
              })(),
              { optimisticData: config },
            );
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
  configs: ServiceConfig[];
  onChange: (newValue: ServiceConfig[]) => void;
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
  config: ServiceConfig;
  onChange: (newConfig: { responseTime: number }) => void;
}

function ConfigCard({ config, onChange }: ConfigCardProps) {
  return (
    <Card className="flex flex-col space-y-4 w-fit">
      <p className="text-tremor-title font-bold text-tremor-content-strong">{config.name}</p>
      <Divider />
      <span>HPA Status: {config.hpaStatus}</span>
      {config.hpaRunningStatus && (
        <>
          <span>
            Replicas: {config.hpaRunningStatus?.currentReplicas} / {config.hpaRunningStatus?.targetReplicas}
          </span>
          <span>
            Utilization: {config.hpaRunningStatus?.currentUtilizationPercentage}% /{" "}
            {config.hpaRunningStatus?.targetUtilizationPercentage}%
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
