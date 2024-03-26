export async function GET() {
  const env = {
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV !== "development",
    inCluster: Boolean(process.env["KUBERNETES_SERVICE_HOST"]) && Boolean(process.env["KUBERNETES_SERVICE_PORT_HTTPS"]),
    promtheusUrl: process.env["PROMETHEUS_URL"],
  };

  return Response.json(env);
}
