export enum NodeType {
  Service = "service",
  Workload = "workload",
}

export interface Node {
  hash: string;
  type: NodeType;
  name: string;
  namespace: string;
  idle: boolean;
  edges: Edge[];
}

export interface Edge {
  source: string;
  target: string;
  code: string[];
}

export interface Graph {
  nodes: Node[];
}
