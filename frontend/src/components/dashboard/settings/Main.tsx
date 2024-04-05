"use client";

import { Button, Card, Dialog, DialogPanel, Divider, TextInput } from "@tremor/react";
import { useState } from "react";
import { RiLoaderLine, RiGlobalLine, RiErrorWarningLine } from "@remixicon/react";

import type { StrategyService } from "@/lib/setting";
import { mutationApiBuilder, querySWRApiBuilder } from "@/lib/endpoints";
import { debounce } from "@/lib/utils/debounce";
import useSWR, { type KeyedMutator } from "swr";
import { Loading } from "@/components/common/Loading";
import clsx from "clsx";

const updateStratyegyService = mutationApiBuilder("put:server/setting/strategy-service");
const getStratyegyService = querySWRApiBuilder("get:server/setting/strategy-service");

export function Main() {
  const { data: strategyService, mutate: mutateStrategyService } = useSWR(
    "get:server/setting/strategy-service",
    getStratyegyService,
  );
  return (
    <div className="flex flex-col min-h-[100vh] w-[80%] mx-auto justify-center items-start space-y-6">
      <StrategyServiceSettings
        setting={strategyService}
        onMutate={debounce(mutateStrategyService, 1000) as KeyedMutator<StrategyService>}
      />
    </div>
  );
}

interface StrategyServiceSettingsProps {
  setting?: StrategyService;
  onMutate: KeyedMutator<StrategyService>;
}

function StrategyServiceSettings({ setting, onMutate }: StrategyServiceSettingsProps) {
  const [strategyService, setStrategyService] = useState<StrategyService | undefined>(setting);
  const [updating, setUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState({ title: "", message: "", success: false });

  if (strategyService == undefined && setting != undefined) {
    setStrategyService(setting);
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
              type="url"
              icon={
                updating
                  ? ({ className }: { className: string }) => (
                      <RiLoaderLine className={clsx(className, "animate-spin")} />
                    )
                  : strategyService.url.match(/^https?:\/\/.+/) === null
                    ? RiErrorWarningLine
                    : RiGlobalLine
              }
              onValueChange={async (v: string) => {
                setUpdating(true);
                setStrategyService({ ...strategyService, url: v });
                onMutate(async () => {
                  await updateStratyegyService({ body: { ...strategyService, url: v } });
                  setUpdating(false);
                  return undefined;
                });
              }}
            />
          </label>
          <div className="flex flex-row space-x-2">
            <Button
              onClick={async () => {
                try {
                  if (!strategyService.url.match(/^https?:\/\/.+/)) {
                    setDialogStatus({ title: "测试策略服务连接", message: "非法URL", success: false });
                    setDialogOpen(true);
                    return;
                  }
                  setUpdating(true);
                  await fetch(strategyService.url); // TODO test on server side
                  // 更改message
                  setDialogStatus({ title: "测试策略服务连接", message: "测试成功", success: true });
                  setDialogOpen(true);
                } catch (error) {
                  setDialogStatus({ title: "测试策略服务连接", message: (error as Error).message, success: false });
                  setDialogOpen(true);
                } finally {
                  setUpdating(false);
                }
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
