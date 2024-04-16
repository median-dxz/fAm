import "@/utils/dayjs-init";
import { useDebounce } from "@/utils/hooks/useDebounce";
import { RiTimeLine } from "@remixicon/react";
import { TextInput } from "@tremor/react";
import dayjs from "dayjs";
import { useCallback, useState } from "react";

interface EvaluatedTimeInputProps {
  id: string;
  onChange: (newValue?: number) => void;
  className?: string;
}

const checkTimeValid = (time: string) => {
  if (isNaN(Number(time))) {
    return time === "" ? true : dayjs(time).isValid();
  } else {
    return dayjs(Number(time)).isValid();
  }
};

export function EvaluatedTimeInput({ id, onChange, className }: EvaluatedTimeInputProps) {
  const [evaluatedTimeInput, setEvaluatedTimeInput] = useState<string>("");
  const [timeDisplay, setTimeDisplay] = useState<string>("");
  const valid = checkTimeValid(evaluatedTimeInput);

  const debounceUpdateEvaluatedTime = useCallback(
    (time: string) => {
      if (!checkTimeValid(time)) {
        return;
      }
      if (Boolean(time)) {
        const timeObj = isNaN(Number(time)) ? dayjs(time) : dayjs(Number(time));

        setTimeDisplay(timeObj.format("L LTS"));
        onChange(timeObj.unix());
      } else {
        setTimeDisplay("");
        onChange(undefined);
      }
    },
    [onChange],
  );

  const trigger = useDebounce(debounceUpdateEvaluatedTime, 1000);

  return (
    <TextInput
      id={id + "-time-eval"}
      className={className}
      placeholder="End Timestamp"
      icon={RiTimeLine}
      value={timeDisplay}
      error={!valid}
      onValueChange={(newValue: string) => {
        setEvaluatedTimeInput(newValue);
        setTimeDisplay(newValue);
        trigger(newValue);
      }}
      aria-invalid={!valid}
    />
  );
}
