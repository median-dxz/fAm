export interface Node {
  service: Service;
  edges: Edge[];
}

export interface Service {
  name: string;
  namespace: string;
}

export interface Edge {
  source: Node;
  target: Node;
}

export interface Graph {
  nodes: Node[];
}
