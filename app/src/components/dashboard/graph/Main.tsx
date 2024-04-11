"use client";

import { trpc } from "@/utils/trpc";
import cytoscape from "cytoscape";
import { useEffect } from "react";

export function Main() {
  const { data: graph } = trpc.graph.get.useQuery();

  useEffect(() => {
    const cy = cytoscape({
      container: document.getElementById("graph-cy"),

      elements: graph?.nodes.flatMap((node) => {
        return [
          {
            data: {
              id: node.name,
            },
          },
          ...node.edges.map((edge) => {
            return {
              data: {
                id: `${edge.source}-${edge.target}`,
                source: graph.nodes.find((node) => {
                  return node.hash === edge.source;
                })!.name,
                target: graph.nodes.find((node) => {
                  return node.hash === edge.target;
                })!.name,
              },
            };
          }),
        ];
      }),

      style: [
        // the stylesheet for the graph
        {
          selector: "node",
          style: {
            "background-color": "#666",
            label: "data(id)",
          },
        },

        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
      ],

      layout: {
        name: "grid",
      },
    });
  }, [graph]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-12 bg-white">时间选择</div>
      <div className="h-full flex flex-row bg-gray-100 p-4">
        <div className="w-[80%] pr-4">
          <div id="graph-cy" className="w-full h-full shadow bg-white" />
        </div>
        <div className="w-[20%] shadow bg-white p-4">状态栏</div>
      </div>
    </div>
  );
}
