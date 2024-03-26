export const NODE_ENV = process.env.NODE_ENV;
export const IN_CLUSTER =
  Boolean(process.env["KUBERNETES_SERVICE_HOST"]) && Boolean(process.env["KUBERNETES_SERVICE_PORT_HTTPS"]);
