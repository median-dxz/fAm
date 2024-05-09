import type { StrategyQueryResponse } from "@fam/strategy-service-type";

export const famController = {
    get url() {
        return process.env["FAM_CONTROLLER_URL"];
    },

    async apply(body: StrategyQueryResponse, fetchOptions?: RequestInit) {
        console.log(`[fAm Controller Client]: apply: ${this.url}/api/controller`);
        return fetch(`${this.url}/api/controller`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            ...fetchOptions,
        })
            .then((r) => r.json() as Promise<{ success: boolean; body: unknown; message: string }>)
            .catch(() => {
                throw new Error("Failed to fetch prometheus data");
            });
    },
};
