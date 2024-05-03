import type { ServiceConfigQueryResult } from "@/server/controller/type";
import "@/utils/dayjs-init";
import { trpc } from "@/utils/trpc";
import { RiToolsFill } from "@remixicon/react";
import { AreaChart, Button, Card, Dialog, DialogPanel, Legend, List, ListItem, NumberInput } from "@tremor/react";
import dayjs from "dayjs";
import { produce } from "immer";
import { useCallback, useEffect, useState } from "react";

interface ConfigCardProps {
  config: ServiceConfigQueryResult;
  onChange: (newConfig: { responseTime?: number }) => void;
}

interface ReplicasData {
  timestamp: string;
  currentReplicas: number;
  targetReplicas: number;
}

interface UtilizationData {
  timestamp: string;
  currentUtilizationPercentage: number;
  targetUtilizationPercentage: number;
}

export function ConfigCard({ config, onChange }: ConfigCardProps) {
  const [replicasData, setReplicasData] = useState<ReplicasData[]>([]);
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([]);
  const [responseTime, setResponseTime] = useState<number | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync, isPending } = trpc.serviceConfig.patch.useMutation();

  const addResouceData = useCallback(() => {
    if (config.hpaState !== "configured") {
      return;
    }
    setReplicasData(
      produce((draft) => {
        if (draft.length > 20) draft.splice(0, Math.max(0, draft.length - 20));
        draft.push({
          currentReplicas: config.workloadStatus?.currentReplicas ?? NaN,
          targetReplicas: config.workloadStatus?.targetReplicas ?? NaN,
          timestamp: dayjs().format("HH:mm:ss"),
        });
      }),
    );

    setUtilizationData(
      produce((draft) => {
        if (draft.length > 20) draft.splice(0, Math.max(0, draft.length - 20));
        draft.push({
          currentUtilizationPercentage: config.workloadStatus?.currentUtilizationPercentage ?? NaN,
          targetUtilizationPercentage: config.workloadStatus?.targetUtilizationPercentage ?? NaN,
          timestamp: dayjs().format("HH:mm:ss"),
        });
      }),
    );
  }, [config.hpaState, config.workloadStatus]);

  useEffect(() => {
    setReplicasData([]);
    setUtilizationData([]);
    addResouceData();
    let timer = window.setInterval(() => {
      addResouceData();
    }, 15 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [addResouceData]);

  return (
    <Card className="flex flex-row flex-wrap justify-stretch items-baseline gap-2">
      <p
        className="w-48 flex-none text-tremor-title text-tremor-content-strong overflow-hidden cursor-default"
        title={config.serviceName}
      >
        {config.serviceName}
      </p>
      <Legend
        className="w-36 flex-none"
        categories={[config.hpaState]}
        colors={[
          config.hpaState === "configured"
            ? "green"
            : config.hpaState === "not-created"
              ? "gray"
              : config.hpaState === "not-managed"
                ? "orange"
                : "red",
        ]}
      />
      <div className="grow flex flex-row justify-start items-center flex-wrap">
        {config.hpaState === "configured" ? (
          <>
            <span className="whitespace-nowrap text-tremor-content mr-4">
              Replicas: {replicasData.at(-1)?.currentReplicas} / {replicasData.at(-1)?.targetReplicas}
            </span>
            <span className="whitespace-nowrap text-tremor-content">
              Utilization: {utilizationData.at(-1)?.currentUtilizationPercentage}% /{" "}
              {utilizationData.at(-1)?.targetUtilizationPercentage}%
            </span>
          </>
        ) : (
          <div className="inline-block">&nbsp;</div>
        )}
      </div>
      <div className="flex flex-row-reverse">
        <Button
          icon={RiToolsFill}
          variant="secondary"
          disabled={config.hpaState !== "configured" && config.hpaState !== "not-created"}
          onClick={() => {
            setIsOpen(true);
            setResponseTime(config.responseTime);
          }}
        >
          配置
        </Button>
      </div>
      <Dialog
        open={isOpen}
        onClose={(val) => {
          setIsOpen(val);
        }}
        unmount
      >
        <DialogPanel className="space-y-8">
          <div className="relative">
            <h2 className="text-lg font-semibold text-tremor-content-strong">Workload Status</h2>
            <div className="flex flex-row space-x-8">
              {config.hpaState === "configured" ? (
                <>
                  <div className="relative">
                    <h3 className="text-base font-semibold text-tremor-content-strong">Replicas</h3>
                    <AreaChart
                      data={replicasData}
                      index="timestamp"
                      categories={["currentReplicas", "targetReplicas"]}
                      colors={["blue", "cyan"]}
                      className="h-36 w-56"
                      showLegend={false}
                      showTooltip={false}
                    />
                  </div>
                  <div className="relative">
                    <h3 className="text-base font-semibold text-tremor-content-strong">Utilization</h3>
                    <AreaChart
                      data={utilizationData}
                      valueFormatter={(v) => `${v}%`}
                      index="timestamp"
                      categories={["currentUtilizationPercentage", "targetUtilizationPercentage"]}
                      colors={["blue", "cyan"]}
                      className="h-36 w-56"
                      showLegend={false}
                    />
                  </div>
                </>
              ) : (
                <div>No Data</div>
              )}
            </div>
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-tremor-content-strong">Conditions</h2>
            {config.hpaState === "configured" ? (
              <List className="overflow-x-auto">
                {config.workloadStatus?.conditions?.map((condition) => (
                  <ListItem key={condition.type} className="text-tremor-content-strong flex flex-row space-x-4">
                    <span className="whitespace-nowrap">
                      {condition.type}: {condition.status}
                    </span>
                    <span className="whitespace-nowrap">{condition.reason}</span>
                    <span className="whitespace-nowrap">{condition.message}</span>
                  </ListItem>
                ))}
              </List>
            ) : (
              <div>No Data</div>
            )}
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold text-tremor-content-strong">Configure</h2>
            <div className="flex flex-row space-x-4 items-center">
              <span className="whitespace-nowrap">Response Time(ms): </span>
              <NumberInput
                name="responseTime"
                placeholder=""
                enableStepper={false}
                value={responseTime ?? ""}
                min={1}
                onValueChange={(newValue) => {
                  setResponseTime(isNaN(newValue) ? undefined : newValue);
                }}
              />
              <Button
                className="flex flex-row flex-nowrap"
                loading={isPending}
                onClick={async () => {
                  await mutateAsync([
                    {
                      responseTime,
                      serviceName: config.serviceName,
                      serviceNamespace: config.serviceNamespace,
                    },
                  ]);
                  onChange({ responseTime });
                }}
              >
                应用更改
              </Button>
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <Button className="w-full" onClick={async () => setIsOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}
