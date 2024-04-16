"use client";

import { Loading } from "@/components/common/Loading";
import { trpc } from "@/utils/trpc";
import { RiAnticlockwise2Line, RiQuestionLine, RiDragMoveLine } from "@remixicon/react";
import { Button, Icon, Select, SelectItem, Switch } from "@tremor/react";
import clsx from "clsx";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import stringify from "json-stable-stringify";
import { useEffect, useId, useRef, useState } from "react";
import { EvaluatedTimeInput } from "./EvaluatedTimeInput";

cytoscape.use(dagre);

type TimeRange = {
  unit: "s" | "m" | "h" | "d" | "w" | "M";
  length: number;
};

// type NodeType = "namespace" | "workload" | "service";

export function Main() {
  const id = useId();
  const [autoRefetch, setAutoRefetch] = useState<number>(15);
  const [showIdleNodes, setShowIdleNodes] = useState<boolean>(false);
  const [evaluatedTime, setEvaluatedTime] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    unit: "m",
    length: 5,
  });
  const {
    data: graph,
    isFetching,
    refetch,
    error,
  } = trpc.graph.get.useQuery(
    { evaluatedTime, timeRange },
    { refetchInterval: autoRefetch === 0 ? false : autoRefetch * 1000, refetchOnWindowFocus: autoRefetch !== 0 },
  );

  const cyRef = useRef<cytoscape.Core | null>(null);

  function cy() {
    if (cyRef.current !== null) {
      return cyRef.current;
    }
    cyRef.current = cytoscape({
      headless: true,
      style: [
        {
          selector: "node[type = 'workload']",
          style: {
            "background-color": "#4fc3f7",
            label: "data(name)",
            shape: "round-rectangle",
          },
        },
        {
          selector: "node[type = 'service']",
          style: {
            "background-color": "#4fc3f7",
            shape: "round-triangle",
            label: "data(name)",
          },
        },
        {
          selector: "node[type = 'namespace']",
          style: {
            "background-color": "#e0f7fa",
            "background-opacity": 0.7,
            shape: "rectangle",
            label: "data(id)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#1e88e5",
            "target-arrow-color": "#1e88e5",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],
    });
    return cyRef.current;
  }

  useEffect(() => {
    if (graph) {
      cy().mount(document.getElementById("graph-cy")!);

      const namespaces = Array.from(new Set(graph.nodes.map((node) => node.namespace)));
      cy().add(namespaces.map((namespace) => ({ data: { id: namespace, type: "namespace" } })));

      cy().add(
        graph.nodes
          .filter((node) => {
            if (showIdleNodes) {
              return true;
            } else {
              return !node.idle;
            }
          })
          .flatMap((node) => {
            return [
              {
                data: {
                  id: node.hash,
                  parent: node.namespace,
                  type: node.type,
                  name: node.name,
                },
              },
              ...node.edges.map((edge) => {
                return {
                  data: {
                    id: `${edge.source}-${edge.target}`,
                    source: graph.nodes.find((node) => {
                      return node.hash === edge.source;
                    })!.hash,
                    target: graph.nodes.find((node) => {
                      return node.hash === edge.target;
                    })!.hash,
                  },
                };
              }),
            ] satisfies cytoscape.ElementDefinition[];
          }),
      );
    }

    // cy().elements(`node[type != "namespace"]`).add(cy().elements("edge")).layout({ name: "dagre" }).run();
    cy().layout({ name: "dagre" }).run();

    return () => {
      cy().remove("*");
      cy().unmount();
    };
  }, [graph, showIdleNodes]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-20 bg-white flex flex-row space-x-2 p-4 items-center">
        <EvaluatedTimeInput className="max-w-56" id={id + "-time-eval"} onChange={setEvaluatedTime} />
        <label>
          <Select
            id={id + "-time-past"}
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
              if (stringify(newRange) !== stringify(timeRange)) {
                setTimeRange(newRange);
              } else {
                refetch();
              }
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
        <label className="flex items-center space-x-2">
          <span className="inline-block whitespace-nowrap text-tremor-content-emphasis">Idle Nodes</span>
          <Switch
            checked={showIdleNodes}
            onChange={(c) => {
              setShowIdleNodes(c);
            }}
          />
        </label>
        <div className="grow w-full" />
        <div className="flex justify-end space-x-2">
          <label className="flex items-center space-x-2">
            <span className="inline-block whitespace-nowrap text-tremor-content-emphasis">Auto Refetch</span>
            <Switch
              checked={autoRefetch !== 0}
              onChange={(c) => {
                setAutoRefetch(c ? 15 : 0);
              }}
            />
          </label>
          <Icon
            icon={RiQuestionLine}
            className="border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => {
              // TODO: open help dialog
            }}
          />
        </div>
      </div>
      <div className="h-[calc(100vh-5rem)] flex flex-row bg-gray-100 p-4">
        <div className="w-[80%] pr-4 relative">
          <div
            id="graph-cy"
            className={clsx("w-full h-full shadow bg-white rounded-lg", (error || isFetching) && "hidden")}
          />
          <div id="graph-toolbar" className="absolute bottom-4 left-4 flex flex-col z-[9999]">
            <Icon
              title="Zoom graph to fit"
              icon={RiDragMoveLine}
              className="border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => {
                cy().fit();
              }}
            />
          </div>
          <div className={clsx("w-full h-full justify-center flex", !error && !isFetching && "hidden")}>
            {isFetching && <Loading size="3rem" />}
            {error && <div className="text-red-700">{error.message}</div>}
          </div>
        </div>
        <div className="w-[20%] shadow bg-white p-4 rounded-lg">状态栏</div>
      </div>
    </div>
  );
}
