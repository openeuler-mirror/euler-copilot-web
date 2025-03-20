export interface CreateOrUpdateFlowParamsType {
  appId: string;
  flowId: string;
  topologyCheck?: boolean;
  [property: string]: any;
}

/**
 * Flow
 */
export interface CreateOrUpdataFlowBodyType {
  /**
   * 流创建时间
   */
  createdAt: string;
  /**
   * 流的介绍
   */
  description: string;
  edges: Edge[];
  editable: string;
  /**
   * 流是否启用
   */
  enable: boolean;
  /**
   * 流id
   */
  flowId?: string;
  /**
   * 流的名称
   */
  name: string;
  nodes: Node[];
  [property: string]: any;
}

/**
 * Edge
 */
export interface Edge {
  /**
   * 边对应的分支id
   */
  branchId: string;
  /**
   * 边创建的时间
   */
  createdAt?: string;
  /**
   * 边的id
   */
  edgeId: string;
  /**
   * 源节点的id
   */
  sourceNode: string;
  /**
   * 目标节点的id
   */
  targetNode: string;
  /**
   * 边的类型
   */
  type: string;
  [property: string]: any;
}

/**
 * Node
 */
export interface Node {
  /**
   * 节点对应apiId
   */
  apiId: string;
  /**
   * 节点创建时间
   */
  createdAt?: string;
  /**
   * 节点的伴生节点（例如for的begin和end）
   */
  dependency?: Dependency;
  /**
   * 节点介绍
   */
  description: string;
  /**
   * 节点是否可被编辑/删除
   */
  editable: boolean;
  /**
   * 节点是否被启用
   */
  enable: boolean;
  /**
   * 节点名称
   */
  name: string;
  /**
   * 节点id
   */
  nodeId: string;
  parameters?: Parameters;
  /**
   * 节点的位置
   */
  position: Position;
  serviceId: string;
  type: string;
  [property: string]: any;
}

/**
 * 节点的伴生节点（例如for的begin和end）
 *
 * Dependency
 */
export interface Dependency {
  nodeId: string;
  type: string;
  [property: string]: any;
}

export interface Parameters {
  /**
   * 节点类型为choice时才存在这个变量
   */
  choices?: Choice[];
  [property: string]: any;
}

/**
 * choice
 */
export interface Choice {
  /**
   * ID 编号
   */
  branch: string;
  description: string;
  [property: string]: any;
}

/**
 * 节点的位置
 *
 * Position
 */
export interface Position {
  /**
   * 前端显示相对位置的x坐标
   */
  x: number;
  /**
   * 前端显示相对位置的y坐标
   */
  y: number;
  [property: string]: any;
}
