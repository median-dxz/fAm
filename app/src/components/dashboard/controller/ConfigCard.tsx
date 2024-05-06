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

interface ResourceData {
  timestamp: string;
  current: number;
  target: number;
  parameter: "%" | "" | "m";
}

const currentText = (data?: ResourceData) =>
  data ? `${data.current}${data.parameter} / ${data.target}${data.parameter}` : "";

export function ConfigCard({ config, onChange }: ConfigCardProps) {
  const [replicasData, setReplicasData] = useState<ResourceData[]>([]);
  const [cpuData, setCpuData] = useState<ResourceData[]>([]);
  const [responseTime, setResponseTime] = useState<number | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const resourceType = config.workloadStatus?.currentAverageValue ? "Average Value" : "Utilization";

  const { mutateAsync, isPending, error } = trpc.serviceConfig.patch.useMutation();

  const addResouceData = useCallback(() => {
    if (config.hpaState !== "configured") {
      return;
    }
    setReplicasData(
      produce((draft) => {
        if (draft.length > 20) draft.splice(0, Math.max(0, draft.length - 20));
        draft.push({
          current: config.workloadStatus?.currentReplicas ?? NaN,
          target: config.workloadStatus?.targetReplicas ?? NaN,
          timestamp: dayjs().format("HH:mm:ss"),
          parameter: "",
        });
      }),
    );

    setCpuData(
      produce((draft) => {
        if (draft.length > 20) draft.splice(0, Math.max(0, draft.length - 20));
        if (resourceType === "Utilization") {
          draft.push({
            current: config.workloadStatus?.currentUtilizationPercentage ?? NaN,
            target: config.workloadStatus?.targetUtilizationPercentage ?? NaN,
            timestamp: dayjs().format("HH:mm:ss"),
            parameter: "%",
          });
        } else {
          let current = NaN;
          let target = NaN;
          const parameter = "m";

          if (config.workloadStatus?.currentAverageValue) {
            if (config.workloadStatus.currentAverageValue.endsWith("m")) {
              current = Number(config.workloadStatus.currentAverageValue.slice(0, -1));
            } else {
              current = Number(config.workloadStatus.currentAverageValue);
            }
          }

          if (config.workloadStatus?.targetAverageValue) {
            if (config.workloadStatus.targetAverageValue.endsWith("m")) {
              target = Number(config.workloadStatus.targetAverageValue.slice(0, -1));
            } else {
              target = Number(config.workloadStatus.targetAverageValue);
            }
          }

          draft.push({
            current,
            target,
            timestamp: dayjs().format("HH:mm:ss"),
            parameter,
          });
        }
      }),
    );
  }, [config.hpaState, config.workloadStatus, resourceType]);

  useEffect(() => {
    setReplicasData([]);
    setCpuData([]);
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
        className="w-40 flex-none"
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
              Replicas: {currentText(replicasData.at(-1))}
            </span>
            <span className="whitespace-nowrap text-tremor-content">CPU: {currentText(cpuData.at(-1))}</span>
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
                      categories={["current", "target"]}
                      colors={["blue", "cyan"]}
                      className="h-36 w-56"
                      showLegend={false}
                      showTooltip={false}
                    />
                  </div>
                  <div className="relative">
                    <h3 className="text-base font-semibold text-tremor-content-strong">{resourceType}</h3>
                    <AreaChart
                      data={cpuData}
                      valueFormatter={(value) => {
                        if (resourceType === "Utilization") {
                          return `${value}%`;
                        } else {
                          return `${value}m`;
                        }
                      }}
                      index="timestamp"
                      categories={["current", "target"]}
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
                  try {
                    await mutateAsync([
                      {
                        responseTime,
                        serviceName: config.serviceName,
                        serviceNamespace: config.serviceNamespace,
                      },
                    ]);
                  } catch (error) {
                    // TODO Error Handling
                    console.error(error);
                  }

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
