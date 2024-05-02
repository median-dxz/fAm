import type { StrategyQueryRequset, StrategyQueryResponse } from "@fam/strategy-service-type";
import { settingManager } from "../setting-manager";

export const strategyService = {
  async getUrl() {
    let { url } = await settingManager.getItme("strategyService");
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    return url;
  },

  async query(queryBody: StrategyQueryRequset) {
    const url = await this.getUrl();
    console.log(`[Strategy Service]: query: ${url}/strategy/api/v1/query`);
    return fetch(`${url}/strategy/api/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    })
      .then((r) => r.json() as Promise<StrategyQueryResponse>)
      .catch(() => {
        throw new Error("[Strategy Service]: error: Failed to fetch CPU Utilization from strategy serivce");
      });
  },

  async test(url: string) {
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    return fetch(`${url}/strategy/api/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hpa: "test",
        namespace: "default",
        responseTime: 100,
      }),
    })
      .then((r) => r.ok && r.status === 200)
      .catch((error) => {
        console.log("[Strategy Service]: test failed", error.message);
        return false;
      });
  },
};
