export const prometheus = {
  get url() {
    return process.env["PROMETHEUS_URL"];
  },

  async query<TMetric extends object, TResultType extends ResultType>(params: {
    query: string;
    time?: string | number;
  }) {
    const searchParams = new URLSearchParams({
      query: params.query,
    });
    if (params.time) {
      searchParams.set("time", params.time.toString());
    }
    console.log(`[Prometheus Client]: query: ${process.env["PROMETHEUS_URL"]}/api/v1/query?${searchParams.toString()}`);
    return fetch(`${process.env["PROMETHEUS_URL"]}/api/v1/query?${searchParams.toString()}`)
      .then((r) => r.json() as Promise<PrometheusQueryResponse<TResultType, TMetric>>)
      .catch(() => {
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
    console.log(
      `[Prometheus Client]: query range: ${process.env["PROMETHEUS_URL"]}/api/v1/query_range?${searchParams.toString()}`,
    );
    return fetch(`${process.env["PROMETHEUS_URL"]}/api/v1/query_range?${searchParams.toString()}`)
      .then((r) => r.json() as Promise<PrometheusQueryResponse<"matrix", TMetric>>)
      .catch(() => {
        throw new Error("Failed to fetch prometheus data");
      });
  },

  async test() {
    if (!this.url) return false;
    return fetch(`${this.url}/api/v1/targets`).then((r) => r.ok && r.status === 200);
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

export interface IstioRequestsTotalMetric {
  __name__: string;
  app: string;
  connection_security_policy: string;
  destination_app: string;
  destination_canonical_revision: string;
  destination_canonical_service: string;
  destination_cluster: string;
  destination_principal: string;
  destination_service: string;
  destination_service_name: string;
  destination_service_namespace: string;
  destination_version: string;
  destination_workload: string;
  destination_workload_namespace: string;
  instance: string;
  job: string;
  namespace: string;
  pod: string;
  pod_template_hash: string;
  reporter: string;
  request_protocol: string;
  response_code: string;
  response_flags: string;
  security_istio_io_tlsMode: string;
  service_istio_io_canonical_name: string;
  service_istio_io_canonical_revision: string;
  source_app: string;
  source_canonical_revision: string;
  source_canonical_service: string;
  source_cluster: string;
  source_principal: string;
  source_version: string;
  source_workload: string;
  source_workload_namespace: string;
  version: string;
}
