export const prometheus = {
    get url() {
        return process.env["PROMETHEUS_URL"];
    },

    async query<TMetric extends object, TResultType extends ResultType>(
        params: {
            query: string;
            time?: string | number;
        },
        fetchOptions?: RequestInit
    ) {
        const searchParams = new URLSearchParams({
            query: params.query,
        });
        if (params.time) {
            searchParams.set("time", params.time.toString());
        }
        // console.log(`[Prometheus Client]: query: ${this.url}/api/v1/query?${searchParams.toString()}`);
        return fetch(`${this.url}/api/v1/query?${searchParams.toString()}`, fetchOptions)
            .then((r) => r.json() as Promise<PrometheusQueryResponse<TResultType, TMetric>>)
            .catch((e) => {
                console.error(e);
                throw new Error("Failed to fetch prometheus data");
            });
    },

    async queryRange<TMetric extends object>(params: {
        query: string;
        start: string | number;
        end: string | number;
        step: string | number;
    }) {
        const searchParams = new URLSearchParams({
            query: params.query,
            start: params.start.toString(),
            end: params.end.toString(),
            step: params.step.toString(),
        });
        console.log(`[Prometheus Client]: query range: ${this.url}/api/v1/query_range?${searchParams.toString()}`);
        return fetch(`${this.url}/api/v1/query_range?${searchParams.toString()}`)
            .then((r) => r.json() as Promise<PrometheusQueryResponse<"matrix", TMetric>>)
            .catch((e) => {
                console.error(e);
                throw new Error("Failed to fetch prometheus data");
            });
    },
};

export type PrometheusQueryResponse<TResultType extends ResultType, TMetric extends object = {}> = {
    status: "success" | "error";
    warnings?: string[];
    error?: string;
    errorType?: string;
    data: {
        resultType: TResultType;
        result: TResultType extends "matrix"
            ? Array<{ metric: TMetric; values: MetricValue[] }>
            : TResultType extends "vector"
            ? Array<{ metric: TMetric; value: MetricValue }>
            : unknown;
    };
};

export type ResultType = "matrix" | "vector" | "scalar" | "string";
export type MetricValue = [number, string];
