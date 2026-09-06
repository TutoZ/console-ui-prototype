/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险 / 客服体验演示脚本（精简 3 幕）
 *
 * 规划：
 * 1) 命中理赔SOP → 先知识库告知规则 → 再食源性疾病理赔SOP推进 → 请选订单核对实付
 * 2) 用户选订单 → Browser Use 查企业系统（不必人工、不必改接口）
 * 3) 礼貌收尾 + 保留记忆
 */

export type FoodSafetyDemoOrder = {
  product: string;
  orderNoMasked: string;
  status: string;
  amount: string;
};

export type LoopNodeTone = 'sense' | 'decision' | 'knowledge' | 'skill' | 'tool' | 'result';

export type LoopRefKind = 'knowledge' | 'skill' | 'process' | 'tool';

export type LoopNodeRef = {
  kind: LoopRefKind;
  name: string;
  meta?: string;
};

export type LoopDemoNode = {
  label: string;
  action: string;
  tone: LoopNodeTone;
  /** 内部思考句（Agent Thought） */
  thought?: string;
  /** 本步命中的知识 / 技能 / 流程 / 工具 */
  refs?: LoopNodeRef[];
};

export type FoodSafetyDemoTurn = {
  id: string;
  act: number;
  user: string;
  match: string[];
  agent: string;
  thinkMs: number;
  offerOrder?: boolean;
  isOrderSelect?: boolean;
  /** 无用户发言，仅数字员工承接 */
  agentOnly?: boolean;
};

export type CapabilityDemoStage = {
  turnId: string;
  act: number;
  title: string;
  /** 右侧能力动画总时长（与对话 thinkMs 对齐） */
  durationMs: number;
  highlights: string[];
  nodes: LoopDemoNode[];
  mode: 'loop' | 'browser' | 'path-switch' | 'material-reject' | 'care' | 'impact';
  /** 卡片顶栏：场景难点（渐变字） */
  headlineAccent: string;
  /** 卡片顶栏：核心价值点（黑字） */
  headlinePlain: string;
  caption?: string;
  browserSteps?: string[];
  materials?: Array<{ label: string; ok: boolean }>;
  /** 路径切换文案 */
  paths?: { illness: string; nonIllness: string };
  /** 上岗成效页 */
  impact?: {
    eyebrow: string;
    title: string;
    summary: string;
    points?: string[];
    metrics?: Array<{ label: string; before?: string; after: string; unit?: string }>;
  };
};

export const FOOD_SAFETY_DEMO_ORDER: FoodSafetyDemoOrder = {
  product: '烤鸭套餐',
  orderNoMasked: '3603********7268',
  status: '已完成',
  amount: '26.62元',
};

/**
 * 三幕对话
 * act1 用户说症状 → 命中理赔SOP → 先知识库告知规则 → 再SOP推进 → 请选订单
 * act2 选订单 → Browser Use 上电脑查企业订单系统（不必人工、不必改接口）
 * act3 致谢收尾 + 保留记忆
 */
export const FOOD_SAFETY_DEMO_TURNS: FoodSafetyDemoTurn[] = [
  {
    id: 'act1',
    act: 1,
    user: '我吃完外卖后不舒服，刚刚还吐了，怎么理赔？',
    match: [
      '吃完外卖',
      '不舒服',
      '吐了',
      '怎么理赔',
      '理赔',
      '外卖',
      '怎么处理',
      '食安',
    ],
    agent:
      '餐品送达后 36 小时内，建议到一级及以上公立医院就医；诊断为食源性疾病可申请理赔，请保留诊断证明、病历和医疗票据。请先选择订单，我帮您核对实付金额。',
    // synced to act1 narration MP3s
    thinkMs: 12504,
    offerOrder: true,
  },
  {
    id: 'act2',
    act: 2,
    user: `选择订单：${FOOD_SAFETY_DEMO_ORDER.product}`,
    match: [],
    isOrderSelect: true,
    agent: `已在企业订单系统查到「${FOOD_SAFETY_DEMO_ORDER.product}」：订单 ${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}，状态${FOOD_SAFETY_DEMO_ORDER.status}，实付 ${FOOD_SAFETY_DEMO_ORDER.amount}。可按材料清单在京东 APP 提交理赔。`,
    thinkMs: 10272,
  },
  {
    id: 'act3',
    act: 3,
    user: '好的，谢谢。',
    match: ['谢谢', '好的谢谢', '感谢', '好的', '知道了'],
    agent: '不客气，祝您早日康复。理赔过程中有问题随时找我。',
    thinkMs: 5640,
  },
];

/** 右侧能力演示（与对话幕次对应） */
export const FOOD_SAFETY_CAPABILITY_STAGES: CapabilityDemoStage[] = [
  {
    turnId: 'act1',
    act: 1,
    title: '知识库 + 技能',
    durationMs: 12504,
    highlights: ['调知识库', '调技能'],
    mode: 'loop',
    headlineAccent: '细节不全，仍要给对指引',
    headlinePlain: '知识库与 SOP 协同',
    caption: '调知识库 · 调技能',
    nodes: [
      {
        action: '调用知识库',
        label: '食安险理赔知识库',
        tone: 'knowledge',
        thought: '触发理赔SOP技能，先调知识库核对规则告诉客户。',
        refs: [{ kind: 'knowledge', name: '食安险理赔知识库', meta: '0.93' }],
      },
      {
        action: '调用技能',
        label: '食源性疾病理赔SOP',
        tone: 'skill',
        thought: '再调食源性疾病理赔SOP推进流程，请客户选订单。',
        refs: [{ kind: 'skill', name: '食源性疾病理赔SOP', meta: 'v2.3' }],
      },
    ],
  },
  {
    turnId: 'act2',
    act: 2,
    title: 'Browser Use 查订单',
    durationMs: 10272,
    highlights: ['选订单', '上电脑查'],
    mode: 'browser',
    headlineAccent: '要查订单，别麻烦用户翻系统',
    headlinePlain: 'Browser Use 无侵入查询',
    caption: '打开企业系统 · 定位订单 · 读取信息',
    nodes: [
      {
        action: 'Browser Use',
        label: '查询企业订单系统',
        tone: 'tool',
        thought: '不必人工查询、不必改接口，用 Browser Use 核对实付。',
        refs: [{ kind: 'tool', name: 'Browser Use', meta: 'zero-dev' }],
      },
    ],
    browserSteps: ['打开企业订单系统', '输入订单条件', '查询并定位', '读取餐品与金额', '回填对话'],
  },
  {
    turnId: 'act3',
    act: 3,
    title: '自然收尾',
    durationMs: 5640,
    highlights: ['保留记忆', '持续服务'],
    mode: 'care',
    headlineAccent: '咨询结束',
    headlinePlain: '礼貌收尾与记忆保留',
    nodes: [
      {
        action: '礼貌收尾',
        label: '自然收尾',
        tone: 'result',
        thought: '客户道谢，礼貌收尾并保留记忆，有问题随时再找它。',
      },
    ],
  },
];

export const FOOD_SAFETY_DEMO_STEP_COUNT = FOOD_SAFETY_DEMO_TURNS.length;

function normalizeChatText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s，。！？、,.!?;；：:""'‘’（）()【】\[\]]/g, '');
}

/**
 * 优先匹配「当前下一幕」；仅当下一幕未命中时，才在剩余幕中按最长关键词匹配。
 */
export function matchFoodSafetyDemoTurn(
  userText: string,
  completedIds: Set<string>,
): FoodSafetyDemoTurn | null {
  const textTurns = FOOD_SAFETY_DEMO_TURNS.filter((t) => !t.isOrderSelect && !t.agentOnly);
  const pending = textTurns.filter((t) => !completedIds.has(t.id));
  if (pending.length === 0) return null;

  const norm = normalizeChatText(userText);
  if (!norm) return null;

  const scoreTurn = (turn: FoodSafetyDemoTurn): number => {
    let best = 0;
    for (const k of turn.match) {
      const key = normalizeChatText(k);
      if (!key) continue;
      if (norm.includes(key)) best = Math.max(best, key.length);
    }
    const hint = normalizeChatText(turn.user);
    if (hint && (norm === hint || norm.includes(hint) || hint.includes(norm))) {
      best = Math.max(best, hint.length);
    }
    return best;
  };

  const next = pending[0];
  const nextScore = scoreTurn(next);
  if (nextScore > 0) return next;

  let best: FoodSafetyDemoTurn | null = null;
  let bestScore = 0;
  for (const turn of pending.slice(1)) {
    const score = scoreTurn(turn);
    if (score >= 4 && score > bestScore) {
      best = turn;
      bestScore = score;
    }
  }
  return best;
}

export function getFoodSafetyOrderSelectTurn(): FoodSafetyDemoTurn {
  return FOOD_SAFETY_DEMO_TURNS.find((t) => t.isOrderSelect)!;
}

export function getCapabilityStage(turnId: string): CapabilityDemoStage | undefined {
  return FOOD_SAFETY_CAPABILITY_STAGES.find((s) => s.turnId === turnId);
}
