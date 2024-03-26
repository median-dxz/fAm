export async function GET() {
  const env = {
    is_dev: process.env.NODE_ENV === "development",
    is_prod: process.env.NODE_ENV !== "development",
    in_cluster:
      Boolean(process.env["KUBERNETES_SERVICE_HOST"]) && Boolean(process.env["KUBERNETES_SERVICE_PORT_HTTPS"]),
    promtheus_url: process.env["PROMETHEUS_URL"],
  };

  return Response.json(env);
}
