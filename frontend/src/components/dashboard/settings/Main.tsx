"use client";

import { Button, Card, Dialog, DialogPanel, Divider, TextInput } from "@tremor/react";
import { useState } from "react";
import { RiLoaderLine, RiGlobalLine } from "@remixicon/react";

import type { Setting, StrategyService } from "@/lib/setting";
import { mutationApiBuilder } from "@/lib/endpoints";
import { debounce } from "@/lib/utils/debounce";

const updateStratyegyService = debounce(mutationApiBuilder("put:server/setting/strategy-service"), 1000);

export function Main({ setting }: { setting: Setting }) {
  return (
    <div className="flex flex-col min-h-[100vh] w-[80%] mx-auto justify-center items-start space-y-6">
      <StrategyServiceSettings setting={setting.strategyService} />
    </div>
  );
}

interface StrategyServiceSettingsProps {
  setting: StrategyService;
}

function StrategyServiceSettings({ setting }: StrategyServiceSettingsProps) {
  const [strategyService, setStrategyService] = useState(setting);
  const [updating, setUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState({ title: "", message: "", success: false });

  return (
    <Card className="flex flex-col space-y-4">
      <p className="text-tremor-title font-bold text-tremor-content-strong">Strategy Settings</p>
      <Divider />
      <label className="flex flex-col space-y-2">
        <span className="text-tremor-default font-bold text-tremor-content-emphasis">Service URL: </span>
        <TextInput
          value={strategyService.url}
          type="url"
          icon={updating ? RiLoaderLine : RiGlobalLine}
          onValueChange={async (v) => {
            setStrategyService({ ...strategyService, url: v });
            setUpdating(true);
            const r = await updateStratyegyService({ body: { ...strategyService, url: v } });
            setUpdating(false);
            if (r.success === false) {
              setDialogStatus({ ...r, title: "更新失败" });
              setDialogOpen(true);
            }
          }}
        />
      </label>
      <div className="flex flex-row space-x-2">
        <Button
          onClick={async () => {
            try {
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
