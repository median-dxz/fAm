"use client";

import { Loading } from "@/components/common/Loading";
import type { ApplicationSettings } from "@/server/setting-manager";
import { useDebounce } from "@/utils/hooks/useDebounce";
import { trpc } from "@/utils/trpc";
import { RiErrorWarningLine, RiGlobalLine, RiLoaderLine } from "@remixicon/react";
import { Button, Card, Dialog, DialogPanel, Divider, TextInput, Textarea } from "@tremor/react";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { z } from "zod";

export function Main() {
  const { data: strategyService, refetch: refetchStrategyService } = trpc.application.getSetting.useQuery({
    item: "strategyService",
  });

  const strategyServiceMutation = trpc.application.patchSetting.useMutation({
    onSettled() {
      refetchStrategyService();
    },
  });

  const { data: serverStatus } = trpc.application.getStatus.useQuery();

  return (
    <div className="flex flex-col min-h-[100vh] w-[80%] mx-auto justify-center items-start space-y-6">
      <StrategyServiceSettings setting={strategyService} mutation={strategyServiceMutation} />
      <PrometheusSettings
        setting={
          serverStatus ? { connected: serverStatus.prometheusConnected, url: serverStatus.prometheusUrl } : undefined
        }
      />
    </div>
  );
}

interface StrategyServiceSettingsProps {
  setting?: ApplicationSettings["strategyService"];
  mutation: ReturnType<typeof trpc.application.patchSetting.useMutation>;
}

function StrategyServiceSettings({ setting, mutation }: StrategyServiceSettingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState({ title: "", message: "", success: false });

  const [updating, setUpdating] = useState(false);
  const [strategyService, setStrategyService] = useState(setting);
  const previousSetting = useRef(setting);

  const { mutateAsync: testStrategyService, isPending: isTesting } = trpc.application.testStrategyService.useMutation();

  const { mutate } = mutation;

  const updateStrategyService = useCallback(
    async (value: ApplicationSettings["strategyService"]) => {
      if (value) {
        mutate({ item: "strategyService", value });
        setUpdating(false);
      }
    },
    [mutate],
  );

  const debouncedUpdate = useDebounce(updateStrategyService, 1000);

  if (previousSetting.current !== setting) {
    setStrategyService(setting);
    previousSetting.current = setting;
  }

  return (
    <Card className="flex flex-col space-y-4">
      <p className="text-tremor-title font-bold text-tremor-content-strong">Strategy Settings</p>
      <Divider />
      {strategyService ? (
        <>
          <label className="flex flex-col space-y-2">
            <span className="text-tremor-default font-bold text-tremor-content-emphasis">Service URL: </span>
            <TextInput
              value={strategyService.url}
              name="strategy-service-url"
              type="url"
              icon={
                updating || isTesting
                  ? ({ className }: { className: string }) => (
                      <RiLoaderLine className={clsx(className, "animate-spin")} />
                    )
                  : z.string().url().safeParse(strategyService.url).success
                    ? RiGlobalLine
                    : RiErrorWarningLine
              }
              onValueChange={async (v: string) => {
                setUpdating(true);
                setStrategyService({ ...strategyService, url: v });
                debouncedUpdate({ ...strategyService, url: v });
              }}
            />
          </label>
          <div className="flex flex-row space-x-2">
            <Button
              onClick={async () => {
                const testResult = await testStrategyService(strategyService.url);
                setDialogOpen(true);
                setDialogStatus({
                  title: "Strategy Service Test",
                  message: testResult.message ?? "",
                  success: testResult.success ?? false,
                });
              }}
            >
              测试
            </Button>
          </div>
        </>
      ) : (
        <Loading />
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} static={true} className="z-[100]">
        <DialogPanel className="max-w-sm">
          <p className="text-tremor-title text-tremor-content-strong font-bold mb-4">{dialogStatus.title}</p>
          <p className="text-tremor-content-emphasis mb-4">操作{dialogStatus.success ? "成功" : "失败"}</p>
          <p className="text-tremor-content-emphasis mb-4">{dialogStatus.message}</p>
          <Button variant="light" className="mx-auto flex items-center" onClick={() => setDialogOpen(false)}>
            关闭
          </Button>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}

interface PrometheusSettingsProps {
  setting?: { connected: boolean; url?: string };
}

function PrometheusSettings({ setting }: PrometheusSettingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState({ message: "" });
  const [pql, setPql] = useState("");

  const { mutateAsync } = trpc.application.testPrometheus.useMutation();
  return (
    <Card className="flex flex-col space-y-4">
      <p className="text-tremor-title font-bold text-tremor-content-strong">Prometheus Settings</p>
      <Divider />
      {setting ? (
        <>
          <label className="flex flex-col space-y-2">
            <span className="text-tremor-default font-bold text-tremor-content-emphasis">Prometheus URL: </span>
            <TextInput
              disabled
              name="prometheus-url"
              value={setting.url ?? ""}
              type="url"
              icon={setting.connected ? RiGlobalLine : RiErrorWarningLine}
            />
          </label>

          <div className="flex flex-row space-x-2">
            <label className="flex flex-row space-x-2 items-center w-full">
              <span className="text-tremor-default whitespace-nowrap">PQL Test: </span>
              <TextInput name="prometheus-pql" type="text" value={pql} onValueChange={setPql} />
            </label>
            <Button
              onClick={async () => {
                try {
                  const data = await mutateAsync(pql);
                  setDialogStatus({ message: JSON.stringify(data, undefined, 4) });
                } catch (error) {
                  setDialogStatus({ message: (error as Error).message });
                } finally {
                  setDialogOpen(true);
                }
              }}
            >
              测试
            </Button>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} static={true} className="z-[100]">
              <DialogPanel>
                <Textarea
                  className="text-tremor-content-emphasis p-4 overflow-auto max-h-96"
                  value={dialogStatus.message}
                  autoHeight
                  disabled
                />
                <Button variant="light" className="mx-auto flex items-center mt-4" onClick={() => setDialogOpen(false)}>
                  关闭
                </Button>
              </DialogPanel>
            </Dialog>
          </div>
        </>
      ) : (
        <Loading />
      )}
    </Card>
  );
}
