import { RiAnticlockwise2Line } from "@remixicon/react";
import { Select, SelectItem } from "@tremor/react";

export type TimeRange = {
  unit: "s" | "m" | "h" | "d" | "w" | "M";
  length: number;
};

interface TimeRangeSelectProps {
  id: string;
  timeRange: TimeRange;
  onChange: (newRange: TimeRange) => void;
}

export function TimeRangeSelect({ id, timeRange, onChange }: TimeRangeSelectProps) {
  return (
    <label>
      <Select
        id={id}
        value={timeRange.length.toString() + " " + timeRange.unit}
        icon={RiAnticlockwise2Line}
        onValueChange={(newValue?: string) => {
          if (!newValue) {
            return;
          }
          const [length, unit] = newValue.split(" ");
          const newRange = {
            length: Number(length),
            unit: unit as TimeRange["unit"],
          };
          onChange(newRange);
        }}
      >
        <SelectItem value="15 s">15 secs</SelectItem>
        <SelectItem value="5 m">5 mins</SelectItem>
        <SelectItem value="30 m">30 mins</SelectItem>
        <SelectItem value="1 h">1 hour</SelectItem>
        <SelectItem value="6 h">6 hours</SelectItem>
        <SelectItem value="12 h">12 hours</SelectItem>
        <SelectItem value="1 d">1 day</SelectItem>
        <SelectItem value="3 d">3 days</SelectItem>
        <SelectItem value="1 w">1 week</SelectItem>
        <SelectItem value="1 M">1 month</SelectItem>
      </Select>
    </label>
  );
}
