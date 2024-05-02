import type { ServiceConfigQueryResult } from "@/server/controller/type";
import { Card, Divider, Legend, NumberInput } from "@tremor/react";

interface ConfigCardProps {
  config: ServiceConfigQueryResult;
  onChange: (newConfig: { responseTime?: number }) => void;
}
export function ConfigCard({ config, onChange }: ConfigCardProps) {
  return (
    <Card className="flex flex-col space-y-4">
      <div className="flex flex-row items-baseline">
        <p className="text-tremor-title font-bold text-tremor-content-strong">{config.serviceName}</p>
        <Legend
          categories={[config.hpaState]}
          colors={[
            config.hpaState === "configured"
              ? "green"
              : config.hpaState === "not-created"
                ? "gray"
                : config.hpaState === "not-managed"
                  ? "orange"
                  : "red",
          ]}
        />
      </div>
      <Divider />

      {config.workloadStatus && (
        <>
          <span>
            Replicas: {config.workloadStatus?.currentReplicas} / {config.workloadStatus?.targetReplicas}
          </span>
          <span>
            Utilization: {config.workloadStatus?.currentUtilizationPercentage}% /
            {config.workloadStatus?.targetUtilizationPercentage}%
          </span>
        </>
      )}

      <div className="flex flex-row items-center space-x-2">
        <span className="whitespace-nowrap text-tremor-content">Response Time: </span>
        <NumberInput
          name="responseTime"
          placeholder=""
          disabled={config.hpaState !== "configured" && config.hpaState !== "not-created"}
          enableStepper={false}
          value={config.responseTime ?? ""}
          min={1}
          onValueChange={(newValue) => {
            onChange({
              responseTime: isNaN(newValue) ? undefined : newValue,
            });
          }}
        />
        <span className="whitespace-nowrap text-tremor-content"> / </span>
        <span className="whitespace-nowrap text-tremor-content"> ? ms</span>
      </div>
    </Card>
  );
}
