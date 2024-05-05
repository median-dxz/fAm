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
    responseTime: number;
}

export interface StrategyQueryResponse {
    success: boolean;
    error?: unknown;
    result?: {
        cpuResource: number; // cpu资源，绝对量，分度为m
    };
}
