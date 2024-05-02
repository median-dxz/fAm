export interface StrategyQueryRequset {
    hpa: {
        name: string; // "" 代表HPA还未创建
        namespace: string;
    };
    workload: {
        name: string;
        namespace: string;
        kind: "Deployment" | "StatefulSet";
    };
    responseTime: number;
}

export interface StrategyQueryResponse {
    success: boolean;
    error?: unknown;
    result?: {
        cpuUtilization: number;
    };
}
