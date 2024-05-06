# fAm Strategy

该目录用于存放适配 fAm 控制面板中 HPA 控制器的示例策略服务。

一个策略服务应该符合以下要求：

1. 可以通过集群内/外的URL直接访问
2. 通过一个单一 REST api 进行访问

## API  格式

1. api端点方式

> POST 
>
> /strategy/api/v1/query
>
> Content-Type: application/json

2. 入参

```typescript
interface StrategyQueryRequset {
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
```

3. 返回值

```typescript
export interface StrategyQueryResponse {
    success: boolean;
    error?: unknown;
    result?: {
        cpu: number;
        type: "Utilization" | "AverageValue"; // 绝对量分度为m
    };
}
```

