import type {
  AddableNodeType,
  BranchCompareOp,
  WorkflowBranchCondition,
  WorkflowBranchConfig,
  WorkflowBranchGroup,
  WorkflowEndConfig,
  WorkflowEndPart,
  WorkflowEndVarRef,
  WorkflowKbConfig,
  WorkflowKbInput,
  WorkflowKbItemSettings,
  WorkflowKbOption,
  WorkflowKbSearchStrategy,
  WorkflowNodeType,
} from './workflowTypes';
import type { KnowledgeBase } from '../../types';

export const NODE_TYPES: AddableNodeType[] = [
  'LLM',
  '知识检索',
  'Agent',
  '意图识别',
  '条件分支',
  '变量聚合',
  '变量更新',
  '交互澄清',
  '插件工具',
];

export const NODE_DESCRIPTIONS: Record<AddableNodeType, string> = {
  LLM: '调用大语言模型，使用变量和提示词生成回复，处理复杂的自然语言理解和生成任务。',
  知识检索:
    '单节点对接知识库：根据 Query 在选定知识库中召回最匹配的信息，并以列表形式返回。',
  Agent: '智能体节点，具备自主思考规划能力，可调用多种外部工具完成多步骤复杂指令。',
  意图识别: '问题分类节点可以对输入的内容进行分类，并通过不同流程分支实现不同问题的分流。',
  条件分支:
    '单节点完成分支判断：按规则组从上到下短路命中，控制工作流走向不同下游。',
  变量聚合: '将多个前置分支或节点的输出变量进行整合、拼接与格式化，统一往下游输出。',
  变量更新: '在工作流程运行中，根据需要动态修改、更新或覆盖指定的全局/局部变量值。',
  交互澄清: '当检测到必要信息缺失或不明确时，主动暂停流程并向用户发起提问以收集信息。',
  插件工具: '调用外部预设的API、系统接口或三方插件服务，执行获取数据或状态控制等逻辑。',
};

export type NodeStyleToken = {
  bg: string;
  accent: string;
};

const NODE_STYLES: Record<WorkflowNodeType, NodeStyleToken> = {
  开始: { bg: 'bg-blue-500', accent: 'border-blue-500' },
  结束: { bg: 'bg-indigo-500', accent: 'border-indigo-500' },
  LLM: { bg: 'bg-violet-500', accent: 'border-violet-500' },
  知识检索: { bg: 'bg-blue-500', accent: 'border-blue-500' },
  Agent: { bg: 'bg-sky-500', accent: 'border-sky-500' },
  意图识别: { bg: 'bg-fuchsia-500', accent: 'border-fuchsia-500' },
  条件分支: { bg: 'bg-amber-500', accent: 'border-amber-500' },
  变量聚合: { bg: 'bg-teal-500', accent: 'border-teal-500' },
  变量更新: { bg: 'bg-emerald-500', accent: 'border-emerald-500' },
  交互澄清: { bg: 'bg-cyan-500', accent: 'border-cyan-500' },
  插件工具: { bg: 'bg-slate-500', accent: 'border-slate-500' },
};

export function getNodeStyle(type: WorkflowNodeType): NodeStyleToken {
  return NODE_STYLES[type] ?? { bg: 'bg-purple-500', accent: 'border-purple-500' };
}

export const DEFAULT_NODE_DESC: Partial<Record<WorkflowNodeType, string>> = {
  开始: '定义工作流的全局输入变量',
  结束: '工作流的最终节点，用于返回工作流运行后的结果信息',
  LLM: '调用大语言模型，使用变量和提示词生成回复',
  知识检索: '在选定的知识中，根据输入变量召回最匹配的信息，并以列表形式返回',
  条件分支: '根据设定的变量条件规则，控制工作流走向不同下游',
};

/** @deprecated 仅作无平台上下文时的兜底；正式数据走 mapPlatformKnowledgeBases */
export const WORKFLOW_KB_OPTIONS: WorkflowKbOption[] = [];

/** 将主平台知识库映射为工作流节点可选列表 */
export function mapPlatformKnowledgeBases(list: KnowledgeBase[]): WorkflowKbOption[] {
  return list.map((kb) => ({
    id: kb.id,
    name: kb.name,
    description: `${kb.docCount} 个文档 · ${formatWordCount(kb.wordCount)} · 更新于 ${kb.updatedAt}`,
  }));
}

function formatWordCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)} 万字`;
  return `${n.toLocaleString()} 字`;
}

export const WORKFLOW_KB_SEARCH_STRATEGIES: {
  id: WorkflowKbSearchStrategy;
  label: string;
  hint: string;
}[] = [
  { id: '混合', label: '混合', hint: '全文 + 语义综合排序，综合效果更优' },
  { id: '语义', label: '语义', hint: '理解语义关联，适合意图相关场景' },
  { id: '全文', label: '全文', hint: '关键词精准匹配，适合专有名词 / ID' },
];

export function createDefaultKbItemSettings(
  patch?: Partial<WorkflowKbItemSettings>,
): WorkflowKbItemSettings {
  return {
    maxRecall: 10,
    resultRerank: true,
    rerankThreshold: 0.5,
    fallbackRecall: true,
    ...patch,
  };
}

export function createKbInput(patch?: Partial<WorkflowKbInput>): WorkflowKbInput {
  return {
    id: `kbi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    mode: '引用',
    value: '',
    ...patch,
  };
}

export function createDefaultKbConfig(): WorkflowKbConfig {
  return {
    inputs: [
      createKbInput({
        name: 'Query',
        mode: '引用',
        value: '{{user_input}}',
      }),
    ],
    selectedKbIds: [],
    kbItemSettings: {},
    maxRecall: 5,
    minMatch: 0.5,
    searchStrategy: '混合',
    queryRewrite: true,
    resultRerank: false,
  };
}

export function parseWorkflowVarRef(key: string): { nodeLabel: string; field: string } {
  const inner = key.replace(/^\{\{\s*|\s*\}\}$/g, '').trim();
  if (!inner) return { nodeLabel: '变量', field: '' };
  if (inner.includes('/')) {
    const [nodeLabel, ...rest] = inner.split('/').map((s) => s.trim());
    return { nodeLabel: nodeLabel || '变量', field: rest.join(' / ') || 'value' };
  }
  const i = inner.lastIndexOf('.');
  if (i > 0) {
    return { nodeLabel: inner.slice(0, i), field: inner.slice(i + 1) };
  }
  return { nodeLabel: '变量', field: inner };
}

function newEndPartId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createEndTextPart(text = ''): WorkflowEndPart {
  return { id: newEndPartId('endt'), kind: 'text', text };
}

export function createEndVarPart(key: string): WorkflowEndPart {
  const { nodeLabel, field } = parseWorkflowVarRef(key);
  return {
    id: newEndPartId('endv'),
    kind: 'var',
    key,
    nodeLabel,
    field,
  };
}

/** @deprecated 兼容旧调用；请用 createEndVarPart */
export function createEndVarRef(key: string): WorkflowEndVarRef {
  const { nodeLabel, field } = parseWorkflowVarRef(key);
  return {
    id: newEndPartId('endv'),
    key,
    nodeLabel,
    field,
  };
}

export function mergeEndAdjacentText(parts: WorkflowEndPart[]): WorkflowEndPart[] {
  const out: WorkflowEndPart[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (p.kind === 'text' && last?.kind === 'text') {
      out[out.length - 1] = { ...last, text: last.text + p.text };
    } else {
      out.push(p);
    }
  }
  return out;
}

export function ensureEndEditableTail(parts: WorkflowEndPart[]): WorkflowEndPart[] {
  if (!parts.length) return [createEndTextPart('')];
  if (parts[parts.length - 1].kind !== 'text') return [...parts, createEndTextPart('')];
  return parts;
}

export function getEndMessageTextLength(parts: WorkflowEndPart[]): number {
  return parts.reduce(
    (n, p) => n + (p.kind === 'text' ? (p.text ?? '').length : 0),
    0,
  );
}

export function isEndMessageEmpty(parts: WorkflowEndPart[] | null | undefined): boolean {
  if (!parts?.length) return true;
  return !parts.some(
    (p) => p.kind === 'var' || (p.kind === 'text' && (p.text ?? '').trim().length > 0),
  );
}

export function moveEndVarPart(
  parts: WorkflowEndPart[],
  varId: string,
  toIndex: number,
): WorkflowEndPart[] {
  const from = parts.findIndex((p) => p.id === varId && p.kind === 'var');
  if (from < 0) return parts;
  const next = [...parts];
  const [item] = next.splice(from, 1);
  let insertAt = Math.max(0, Math.min(toIndex, next.length));
  if (from < insertAt) insertAt -= 1;
  next.splice(insertAt, 0, item);
  return ensureEndEditableTail(mergeEndAdjacentText(next));
}

/** 把已有变量拖进某段文字的 offset 处（拆成 前文本 | 变量 | 后文本） */
export function moveEndVarIntoText(
  parts: WorkflowEndPart[],
  varId: string,
  textPartId: string,
  offset: number,
): WorkflowEndPart[] {
  const from = parts.findIndex((p) => p.id === varId && p.kind === 'var');
  if (from < 0) return parts;
  const varPart = parts[from];
  const without = parts.filter((p) => p.id !== varId);
  const textIdx = without.findIndex((p) => p.id === textPartId && p.kind === 'text');
  if (textIdx < 0 || varPart.kind !== 'var') {
    return ensureEndEditableTail(mergeEndAdjacentText(without.concat(varPart)));
  }
  const textPart = without[textIdx];
  if (textPart.kind !== 'text') return parts;
  const pos = Math.max(0, Math.min(offset, textPart.text.length));
  const before = textPart.text.slice(0, pos);
  const after = textPart.text.slice(pos);
  const middle: WorkflowEndPart[] = [];
  if (before) middle.push({ ...textPart, text: before });
  middle.push(varPart);
  middle.push(createEndTextPart(after));
  const next = [...without.slice(0, textIdx), ...middle, ...without.slice(textIdx + 1)];
  return ensureEndEditableTail(mergeEndAdjacentText(next));
}

export function insertEndVarIntoParts(
  parts: WorkflowEndPart[],
  textPartId: string,
  slashStart: number,
  slashLen: number,
  key: string,
): WorkflowEndPart[] {
  const idx = parts.findIndex((p) => p.id === textPartId && p.kind === 'text');
  if (idx < 0) {
    return ensureEndEditableTail(
      mergeEndAdjacentText([...parts, createEndVarPart(key)]),
    );
  }
  const part = parts[idx];
  if (part.kind !== 'text') return parts;
  const before = part.text.slice(0, slashStart);
  const after = part.text.slice(slashStart + slashLen);
  const middle: WorkflowEndPart[] = [];
  if (before) middle.push({ ...part, text: before });
  middle.push(createEndVarPart(key));
  middle.push(createEndTextPart(after));
  const next = [...parts.slice(0, idx), ...middle, ...parts.slice(idx + 1)];
  return ensureEndEditableTail(mergeEndAdjacentText(next));
}

export function createDefaultEndConfig(
  patch?: Partial<WorkflowEndConfig>,
): WorkflowEndConfig {
  const { parts: patchParts, ...rest } = patch ?? {};
  return {
    streaming: true,
    ...rest,
    parts:
      patchParts && patchParts.length > 0
        ? ensureEndEditableTail(patchParts)
        : [createEndTextPart('')],
  };
}

export function normalizeEndConfig(
  raw?: WorkflowEndConfig | null,
): WorkflowEndConfig {
  const streaming = raw?.streaming ?? true;
  if (raw?.parts && Array.isArray(raw.parts) && raw.parts.length > 0) {
    const parts = ensureEndEditableTail(
      mergeEndAdjacentText(
        raw.parts.map((p) => {
          if (p.kind === 'var') {
            return {
              id: p.id || newEndPartId('endv'),
              kind: 'var' as const,
              key: p.key || '',
              nodeLabel: p.nodeLabel || parseWorkflowVarRef(p.key || '').nodeLabel,
              field: p.field || parseWorkflowVarRef(p.key || '').field,
            };
          }
          return {
            id: p.id || newEndPartId('endt'),
            kind: 'text' as const,
            text: typeof p.text === 'string' ? p.text : '',
          };
        }),
      ),
    );
    return { streaming, parts };
  }

  // 兼容旧 text + vars
  const legacyVars = Array.isArray(raw?.vars) ? raw!.vars! : [];
  const legacyText = typeof raw?.text === 'string' ? raw.text : '';
  const parts: WorkflowEndPart[] = [];
  if (legacyText) parts.push(createEndTextPart(legacyText));
  for (const v of legacyVars) {
    parts.push({
      id: v.id || newEndPartId('endv'),
      kind: 'var',
      key: v.key || '',
      nodeLabel: v.nodeLabel || parseWorkflowVarRef(v.key || '').nodeLabel,
      field: v.field || parseWorkflowVarRef(v.key || '').field,
    });
  }
  return { streaming, parts: ensureEndEditableTail(mergeEndAdjacentText(parts)) };
}

/** 取某知识库设置（缺省走默认） */
export function getKbItemSettings(
  config: WorkflowKbConfig,
  kbId: string,
): WorkflowKbItemSettings {
  return config.kbItemSettings?.[kbId]
    ? createDefaultKbItemSettings(config.kbItemSettings[kbId])
    : createDefaultKbItemSettings();
}

/** 取主检索 Query：优先 name=Query，否则首行 */
export function getKbQueryValue(config: WorkflowKbConfig): string {
  const named = config.inputs.find((i) => i.name.trim().toLowerCase() === 'query');
  return (named ?? config.inputs[0])?.value?.trim() ?? '';
}

/** 知识检索固定输出：docRecallList（对齐截图） */
export const WORKFLOW_KB_OUTPUT_SCHEMA: {
  field: string;
  type: string;
}[] = [
  { field: 'docId', type: 'Long' },
  { field: 'docName', type: 'String' },
  { field: 'content', type: 'String' },
];

/** @deprecated 兼容旧卡片展示；新面板用 WORKFLOW_KB_OUTPUT_SCHEMA */
export const WORKFLOW_KB_OUTPUT_FIELDS: {
  key: string;
  type: string;
  label: string;
}[] = [
  { key: 'docRecallList', type: 'Array<Object>', label: '召回列表' },
  { key: 'docRecallList[].docId', type: 'Long', label: '文档 ID' },
  { key: 'docRecallList[].docName', type: 'String', label: '文档名' },
  { key: 'docRecallList[].content', type: 'String', label: '召回文本' },
];

/** 兼容旧快照：queryValue / selectedKbId / selectedKbIds / inputs */
export function normalizeKbConfig(
  raw?:
    | (Partial<WorkflowKbConfig> & {
        selectedKbId?: string;
        queryValue?: string;
      })
    | null,
): WorkflowKbConfig {
  const base = createDefaultKbConfig();
  if (!raw) return base;
  const fromIds = Array.isArray(raw.selectedKbIds)
    ? raw.selectedKbIds.filter(Boolean)
    : [];
  const fromSingle =
    typeof raw.selectedKbId === 'string' && raw.selectedKbId ? [raw.selectedKbId] : [];

  let inputs: WorkflowKbInput[] = [];
  if (Array.isArray(raw.inputs) && raw.inputs.length > 0) {
    inputs = raw.inputs.map((row) =>
      createKbInput({
        id: row.id,
        name: row.name ?? '',
        mode: row.mode === '输入' ? '输入' : '引用',
        value: row.value ?? '',
      }),
    );
  } else if (typeof raw.queryValue === 'string') {
    inputs = [
      createKbInput({
        name: 'Query',
        mode: '引用',
        value: raw.queryValue,
      }),
    ];
  } else {
    inputs = base.inputs;
  }

  return {
    inputs,
    selectedKbIds: fromIds.length ? fromIds : fromSingle,
    kbItemSettings:
      raw.kbItemSettings && typeof raw.kbItemSettings === 'object'
        ? Object.fromEntries(
            Object.entries(raw.kbItemSettings).map(([id, s]) => [
              id,
              createDefaultKbItemSettings(s ?? undefined),
            ]),
          )
        : {},
    maxRecall: raw.maxRecall ?? base.maxRecall,
    minMatch: raw.minMatch ?? base.minMatch,
    searchStrategy: raw.searchStrategy ?? base.searchStrategy,
    queryRewrite: raw.queryRewrite ?? base.queryRewrite,
    resultRerank: raw.resultRerank ?? base.resultRerank,
  };
}

/** 知识检索 Query 可引用的变量（示意） */
export const WORKFLOW_QUERY_VAR_OPTIONS: {
  group: string;
  items: { key: string; label: string }[];
}[] = [
  {
    group: '系统变量',
    items: [
      { key: '{{user_input}}', label: 'user_input' },
      { key: '{{sys.query}}', label: 'sys.query' },
    ],
  },
  {
    group: '上游节点输出',
    items: [
      { key: '{{开始.input}}', label: '开始 / input' },
      { key: '{{LLM.output}}', label: 'LLM / output' },
    ],
  },
];

/** 条件分支比较运算符 */
export const BRANCH_COMPARE_OPS: BranchCompareOp[] = [
  '等于',
  '不等于',
  '大于',
  '大于等于',
  '小于',
  '小于等于',
  '包含',
  '不包含',
  '为空',
  '不为空',
  '被包含在',
  '匹配',
  '模糊匹配',
  '交集',
  '互斥',
];

export const BRANCH_OPS_WITHOUT_RIGHT: BranchCompareOp[] = ['为空', '不为空'];

/** 可配置规则组上限（如果 + 否则如果），否则兜底不计入 */
export const MAX_BRANCH_RULE_GROUPS = 10;
export const MAX_BRANCH_CONDITIONS = 10;

export function createBranchCondition(
  patch?: Partial<WorkflowBranchCondition>,
): WorkflowBranchCondition {
  return {
    id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    left: '',
    operator: '等于',
    right: '',
    rightMode: '引用',
    joinNext: '或',
    ...patch,
  };
}

export function createDefaultBranchConfig(): WorkflowBranchConfig {
  const stamp = Date.now();
  return {
    groups: [
      {
        id: `bg_if_${stamp}`,
        kind: '如果',
        conditions: [
          createBranchCondition({
            left: '{{user_input}}',
            operator: '包含',
            right: '退款',
            rightMode: '输入',
          }),
        ],
      },
      {
        id: `bg_elif_${stamp}`,
        kind: '否则如果',
        conditions: [
          createBranchCondition({
            left: '{{user_input}}',
            operator: '包含',
            right: '投诉',
            rightMode: '输入',
          }),
        ],
      },
      {
        id: `bg_else_${stamp}`,
        kind: '否则',
        conditions: [],
      },
    ],
  };
}

/** @deprecated 与 createDefaultBranchConfig 相同，保留兼容 */
export function createDemoBranchConfig(): WorkflowBranchConfig {
  return createDefaultBranchConfig();
}

export function getConfigurableBranchGroups(
  config: WorkflowBranchConfig,
): WorkflowBranchGroup[] {
  return config.groups.filter((g) => g.kind !== '否则');
}

export function getElseBranchGroup(
  config: WorkflowBranchConfig,
): WorkflowBranchGroup | undefined {
  return config.groups.find((g) => g.kind === '否则');
}

/** 画布卡片 / 连线：按优先级排列（如果 → 否则如果… → 否则） */
export function getOrderedBranchGroups(
  config: WorkflowBranchConfig,
): WorkflowBranchGroup[] {
  const ifGroup = config.groups.find((g) => g.kind === '如果');
  const elseIfs = config.groups.filter((g) => g.kind === '否则如果');
  const elseGroup = config.groups.find((g) => g.kind === '否则');
  return [ifGroup, ...elseIfs, elseGroup].filter(Boolean) as WorkflowBranchGroup[];
}

export function branchGroupPriorityLabel(
  group: WorkflowBranchGroup,
  orderedConfigurable: WorkflowBranchGroup[],
): string | null {
  if (group.kind === '否则') return null;
  const idx = orderedConfigurable.findIndex((g) => g.id === group.id);
  return idx >= 0 ? `优先级 ${idx + 1}` : null;
}

export const CANVAS_BG = '#f8f9fa';
export const CANVAS_DOT = '#d1d5db';

export function getDefaultDesc(type: WorkflowNodeType): string {
  return DEFAULT_NODE_DESC[type] ?? '请描述该节点的作用';
}
