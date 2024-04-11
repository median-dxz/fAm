export type * from "./type";
export const ApplicationSettingKeys = ["strategyService"] as const;

import { prisma } from "@/server/client/prisma";
import type { Setting } from "@prisma/client";
import { defaultSetting } from "./default";
import type { ApplicationSettings } from "./type";

export const settingManager: {
  cachedSetting?: ApplicationSettings;
  init(): Promise<void>;
  getItme<TKey extends keyof ApplicationSettings>(key: TKey): Promise<ApplicationSettings[TKey]>;
  updateItme<TKey extends keyof ApplicationSettings>(key: TKey, value: ApplicationSettings[TKey]): Promise<Setting>;
} = {
  cachedSetting: undefined,

  async init() {
    if (this.cachedSetting) {
      return;
    }

    const setting = await prisma.setting.findMany();
    if (setting.find((s) => s.key === "strategyService") === undefined) {
      await prisma.setting.create({
        data: {
          key: "strategyService",
          content: JSON.stringify(defaultSetting.strategyService),
        },
      });
    }
    this.cachedSetting = { ...defaultSetting, ...setting };
  },

  async getItme(key) {
    await this.init();
    return this.cachedSetting![key];
  },

  async updateItme(key, value) {
    await this.init();
    this.cachedSetting = {
      ...this.cachedSetting!,
      [key]: value,
    };
    return prisma.setting.update({
      where: {
        key,
      },
      data: {
        content: JSON.stringify(value),
      },
    });
  },
};
