export type * from "./type";

import { prisma } from "../prismaClient";
import { defaultSetting } from "./default";

import type { Setting } from "./type";

export const settingManager: {
  cachedSetting?: Setting;
  initCache(): Promise<void>;
  getItme(key: keyof Setting): Promise<Setting[keyof Setting]>;
  updateItme(key: keyof Setting, value: Setting[keyof Setting]): Promise<void>;
} = {
  cachedSetting: undefined,

  async initCache() {
    if (this.cachedSetting) {
      return;
    }

    const setting = await prisma.setting.findFirst();
    if (setting) {
      this.cachedSetting = JSON.parse(setting.content);
    } else {
      await prisma.setting.create({
        data: {
          content: JSON.stringify(defaultSetting),
        },
      });
      this.cachedSetting = defaultSetting;
    }
  },

  async getItme(key: keyof Setting) {
    await this.initCache();
    return this.cachedSetting![key];
  },

  async updateItme(key: keyof Setting, value: Setting[keyof Setting]) {
    await this.initCache();
    this.cachedSetting = {
      ...this.cachedSetting,
      [key]: value,
    };
    await prisma.setting.updateMany({
      data: {
        content: JSON.stringify(this.cachedSetting),
      },
    });
  },
};
