export const prometheus = {
  get url() {
    return process.env["PROMETHEUS_URL"];
  },

  async pql(query: string) {
    return fetch(`${this.url}/api/v1/query?query=${encodeURIComponent(query)}`).then((r) => r.json());
  },

  async test() {
    if (!this.url) return false;
    return fetch(`${this.url}/api/v1/targets`).then((r) => r.ok && r.status === 200);
  },
};

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

export interface IstioRequestsTotalMetricObject {
  metric: IstioRequestsTotalMetric;
  value: [number, string];
}
