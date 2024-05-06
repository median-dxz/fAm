export interface StrategyQueryRequset {
    hpa: {
        name: string; // "" 代表HPA还未创建
        namespace: string;
    };
    workload: {
        name: string;
        namespace: string;
        kind: "Deployment";
    };
    service: {
        name: string;
        namespace: string;
    };
    responseTime: number;
}

export interface StrategyQueryResponse {
    service: {
        name: string;
        namespace: string;
    };
    success: boolean;
    error?: unknown;
    result?: {
        cpu: number;
        type: "Utilization" | "AverageValue"; // 绝对量分度为m
    };
}
