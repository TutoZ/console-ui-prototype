/**
 * Workflow canvas domain types (converted from workflow prototype).
 */

export type WorkflowNodeType =
  | '开始'
  | '结束'
  | 'LLM'
  | '知识检索'
  | 'Agent'
  | '意图识别'
  | '条件分支'
  | '变量聚合'
  | '变量更新'
  | '交互澄清'
  | '插件工具';

export type AddableNodeType = Exclude<WorkflowNodeType, '开始' | '结束'>;

export type WorkflowKbOption = {
  id: string;
  name: string;
  description: string;
};

export type WorkflowKbSearchStrategy = '混合' | '语义' | '全文';

/** 知识检索输入行：变量名 + 类型（引用/输入）+ 值 */
export type WorkflowKbInput = {
  id: string;
  name: string;
  mode: '引用' | '输入';
  value: string;
};

/** 单条知识库召回设置（对齐截图“知识库设置”） */
export type WorkflowKbItemSettings = {
  /** 最大召回数量 1–20，默认 10 */
  maxRecall: number;
  /** 结果重排 */
  resultRerank: boolean;
  /** 重排得分阈值 0–1 */
  rerankThreshold: number;
  /** 兜底召回 */
  fallbackRecall: boolean;
};

export type WorkflowKbConfig = {
  /** 输入变量行（主检索 Query 取 name=Query 或首行） */
  inputs: WorkflowKbInput[];
  /** 本节点挂载的知识库（可多选） */
  selectedKbIds: string[];
  /** 各知识库独立召回设置 */
  kbItemSettings: Record<string, WorkflowKbItemSettings>;
  maxRecall: number;
  minMatch: number;
  /** 检索策略：对齐扣子/千帆 */
  searchStrategy: WorkflowKbSearchStrategy;
  /** 多轮对话查询改写 */
  queryRewrite: boolean;
  /** 召回结果重排（节点级，兼容旧数据） */
  resultRerank: boolean;
};

/** 条件分支：组内条件连接逻辑 */
export type BranchJoinLogic = '且' | '或';

/** 右值来源：输入固定值 / 引用变量 / 枚举 */
export type BranchRightMode = '输入' | '引用' | '枚举';

/** 条件分支：比较运算符 */
export type BranchCompareOp =
  | '等于'
  | '不等于'
  | '大于'
  | '大于等于'
  | '小于'
  | '小于等于'
  | '包含'
  | '不包含'
  | '为空'
  | '不为空'
  | '被包含在'
  | '匹配'
  | '模糊匹配'
  | '交集'
  | '互斥';

export type BranchGroupKind = '如果' | '否则如果' | '否则';

export type WorkflowBranchCondition = {
  id: string;
  left: string;
  operator: BranchCompareOp;
  right: string;
  /** 右值模式，默认“引用” */
  rightMode: BranchRightMode;
  /** 与下一条条件的连接逻辑（最后一条可忽略） */
  joinNext: BranchJoinLogic;
};

export type WorkflowBranchGroup = {
  id: string;
  kind: BranchGroupKind;
  conditions: WorkflowBranchCondition[];
};

export type WorkflowBranchConfig = {
  groups: WorkflowBranchGroup[];
};

/** 结束节点：回复消息（文本 + 内联变量） */
export type WorkflowEndVarRef = {
  id: string;
  /** 如 {{咨询agent.content}} */
  key: string;
  nodeLabel: string;
  field: string;
};

/** 消息混排片段：纯文本或变量胶囊 */
export type WorkflowEndPart =
  | { id: string; kind: 'text'; text: string }
  | {
      id: string;
      kind: 'var';
      key: string;
      nodeLabel: string;
      field: string;
    };

export type WorkflowEndConfig = {
  /** 流式输出 */
  streaming: boolean;
  /** 文本与变量按顺序混排 */
  parts: WorkflowEndPart[];
  /**
   * @deprecated 已迁移进 parts；读取时由 normalizeEndConfig 兼容
   */
  text?: string;
  /** @deprecated 已迁移进 parts */
  vars?: WorkflowEndVarRef[];
};

export interface CanvasNode {
  id: string;
  type: WorkflowNodeType;
  x: number;
  y: number;
  name?: string;
  desc?: string;
  /** 知识检索节点配置 */
  kbConfig?: WorkflowKbConfig;
  /** 条件分支节点配置 */
  branchConfig?: WorkflowBranchConfig;
  /** 结束节点：回复消息 */
  endConfig?: WorkflowEndConfig;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  /** 条件分支等多出口节点的源句柄（规则组 id） */
  sourceHandle?: string;
}

export interface CanvasNote {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  notes: CanvasNote[];
}

export type ArchiveStatus = 'ACTIVE' | 'HISTORY';

export interface ArchiveItem extends CanvasSnapshot {
  id: string;
  status: ArchiveStatus;
  time: string;
}

export interface CanvasHistory {
  past: CanvasSnapshot[];
  future: CanvasSnapshot[];
}

export interface PanState {
  x: number;
  y: number;
}

export interface AddNodeMenuState {
  visible: boolean;
  x: number;
  y: number;
  sourceNodeId: string | null;
  /** 从条件分支某规则组出口拉线时携带 */
  sourceHandle?: string | null;
  isToolbar: boolean;
}

export interface DrawingLine {
  sourceNodeId: string | null;
  targetNodeId: string | null;
  sourceHandle?: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ValidationError {
  id: string;
  type: WorkflowNodeType;
  msg: string;
}

export type TestPhase = 'config' | 'testing';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

export interface LogKeyValue {
  key: string;
  value: string | number;
}

export interface ExecutionLogStep {
  id: string;
  name: string;
  time: string;
  status: string;
  subInfo?: string;
  details: {
    input: LogKeyValue[];
    output: LogKeyValue[];
  };
}

export interface ExecutionLog {
  id: string;
  time: string;
  steps: ExecutionLogStep[];
}

export interface AgentInfo {
  name: string;
  description: string;
}

export interface WorkflowCanvasPageProps {
  agentName: string;
  agentId: string;
  /** 初始头像 URL；缺省用官方形象预设 */
  agentAvatar?: string;
  onBack: () => void;
}
