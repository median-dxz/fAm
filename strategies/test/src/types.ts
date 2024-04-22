export interface StrategyQueryRequset {
    hpa: string;
    namespace: string;
    responseTime: number;
}

export interface StrategyQueryResponse {
    success: boolean;
    error?: unknown;
    result?: {
        cpuUtilization: number;
    };
}
