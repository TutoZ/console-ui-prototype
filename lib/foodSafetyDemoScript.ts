/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险 / 保险售后咨询演示（精简 3 幕）
 *
 * 剧情（对齐 5 拍口播）：
 * 1) 用户进线：外卖就餐后不适如何理赔
 * 2–3) 自主规划定场景 → 执行 skill → 按理赔 SOP 调知识库告知规则 → 请选订单
 * 4) 用户申请推进 → Browser Use 无侵入查业务系统给结果
 * 5) 客户道谢 → 礼貌安抚（服务记忆在右侧沉淀）
 */

export type FoodSafetyDemoOrder = {
  product: string;
  orderNoMasked: string;
  status: string;
  amount: string;
};

export type LoopNodeTone = 'sense' | 'decision' | 'knowledge' | 'skill' | 'tool' | 'result';

export type LoopRefKind = 'knowledge' | 'skill' | 'process' | 'tool' | 'agent';

export type LoopNodeRef = {
  kind: LoopRefKind;
  name: string;
  meta?: string;
};

export type LoopDemoNode = {
  label: string;
  action: string;
  tone: LoopNodeTone;
  /** 内部思考句（Agent Thought / 思维链） */
  thought?: string;
  /** 本步命中的知识 / 技能 / 流程 / 工具 */
  refs?: LoopNodeRef[];
  /** 本步最少停留（ms，含打字+Finder）；用于左右流程对齐 */
  holdMs?: number;
};

/** 与 AgentLoopThinkPanel 串行节拍一致 */
export const LOOP_THOUGHT_CHAR_MS = 22;
export const LOOP_FINDER_DELAY_MS = 900;
export const LOOP_FINDER_DWELL_MS = 2200;
export const LOOP_STEP_GAP_MS = 480;

export type FoodSafetyDemoTurn = {
  id: string;
  act: number;
  user: string;
  match: string[];
  agent: string;
  /** 先发的安抚/承接气泡（可选）；主回复 agent 随后发出 */
  agentLead?: string;
  thinkMs: number;
  offerOrder?: boolean;
  isOrderSelect?: boolean;
  /** 无用户发言，仅数字员工承接 */
  agentOnly?: boolean;
  /** 仅用户收尾发言，无员工回复 */
  userOnly?: boolean;
};

export function getFoodSafetyAgentBubbles(
  turn: FoodSafetyDemoTurn,
): Array<{ text: string; offerOrder?: boolean }> {
  if (turn.userOnly) return [];
  const bubbles: Array<{ text: string; offerOrder?: boolean }> = [];
  if (turn.agentLead) bubbles.push({ text: turn.agentLead });
  if (turn.agent) bubbles.push({ text: turn.agent, offerOrder: turn.offerOrder });
  return bubbles;
}

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

/** 体验页开场白（主动关心刚配送完成的订单） */
export const FOOD_SAFETY_OPENING_LINE =
  '我看您刚定了一个烤鸭，已完成配送了，是遇到什么餐品问题了吗？';

/**
 * 三幕对话（对齐 5 拍口播；聊天侧只呈现对客话术，能力侧呈现幕后动作）
 *
 * 口播1  短开场「以保险售后为例」→ 切入思维链页
 * 口播2  思维链：主动预测 → 左侧主动开口问用户（用户尚未发言）
 * 口播3  用户发言后：先安抚（读数字员工.md）→ SOP/知识库告知规则
 * 口播4  用户申请推进流程 → 无侵入查业务系统 → 给出处理结果
 * 口播5  客户道谢 → 礼貌安抚（服务记忆在右侧沉淀）
 */
/** 选单推进后，聊天里展示的用户输入（像用户亲手打的） */
export const FOOD_SAFETY_ORDER_FOLLOWUP = '你直接告诉我在哪理赔！';

/** 与选单推进同句；CustomerExperiencePage 仍用此名 */
export const FOOD_SAFETY_ORDER_SELECT_LABEL = FOOD_SAFETY_ORDER_FOLLOWUP;

export function getFoodSafetyOrderSelectUserTexts(): string[] {
  return [FOOD_SAFETY_ORDER_FOLLOWUP];
}

export const FOOD_SAFETY_DEMO_TURNS: FoodSafetyDemoTurn[] = [
  {
    id: 'act1',
    act: 1,
    // 对齐口播：外卖就餐后不舒服如何理赔（对客语气更急）
    user: '吃完外卖肚子疼，你们卖的什么玩意，赶紧给我赔了！！！！！！',
    match: [
      '吃完外卖',
      '肚子疼',
      '赶紧给我赔',
      '给我赔',
      '赔了',
      '理赔',
      '外卖',
      '不舒服',
      '怎么理赔',
      '食安',
    ],
    // 先安抚，再告知理赔规则并请选订单
    agentLead:
      '吃了东西不舒服确实太难受了，您这个时候一定要注意休息！如果有呕吐一定先去医院看大夫。',
    agent:
      '根据理赔规则：餐品送达后 36 小时内，建议到一级及以上公立医院就医；诊断为食源性疾病可申请理赔，请保留诊断证明、病历和医疗票据。请先选择订单，确认后我再帮您推进查询。',
    // synced to act1 narration（先安抚 + SOP/知识库）
    thinkMs: 14448,
    offerOrder: true,
  },
  {
    id: 'act2',
    act: 2,
    // 对齐口播：用户申请推进（点选订单后，聊天只显示用户打的字）
    user: FOOD_SAFETY_ORDER_FOLLOWUP,
    match: ['在哪理赔', '哪里理赔', '直接告诉我', '怎么申请', '去哪理赔', '告诉我在哪'],
    isOrderSelect: true,
    // 先安抚加急，再给出查单结果（两句分泡）
    agentLead: '知道您这边很着急，我已全力为您加急查询。',
    agent: `已在业务系统完成查询：「${FOOD_SAFETY_DEMO_ORDER.product}」，订单 ${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}，状态${FOOD_SAFETY_DEMO_ORDER.status}，实付 ${FOOD_SAFETY_DEMO_ORDER.amount}。请打开我的 - 理赔 - 理赔申请提交。`,
    thinkMs: 11016,
  },
  {
    id: 'act3',
    act: 3,
    // 对齐口播：客户道谢
    user: '好的知道了，就先这样',
    match: ['就先这样', '知道了', '好的知道了'],
    // 对齐口播：礼貌安抚（记忆不写入气泡）
    agent: '不客气，您先安心休息。理赔过程中有问题随时找我我会帮你全程跟进。',
    thinkMs: 7200,
  },
  {
    id: 'closing',
    act: 4,
    user: '好的，谢谢了',
    match: ['谢谢了', '好的谢谢', '谢谢'],
    agent: '',
    userOnly: true,
    thinkMs: 0,
  },
];

/** 右侧能力演示（串行：pre 仅主动问询 → 用户发言后 act1 再安抚/技能/知识） */
export const FOOD_SAFETY_CAPABILITY_STAGES: CapabilityDemoStage[] = [
  {
    turnId: 'pre',
    act: 0,
    title: '主动问询',
    durationMs: 4272,
    highlights: ['主动问询'],
    mode: 'loop',
    headlineAccent: '先定场景，再按 SOP 答对',
    headlinePlain: '自主寻找最优方案、执行并交付结果',
    caption: '主动预测 · 先开口问',
    nodes: [
      {
        action: '自主规划',
        label: '主动问询',
        tone: 'decision',
        thought:
          '来了一个新客户，我看到他的外卖已经都签收了大概率是售后的问题，我先主动问一下用户',
      },
    ],
  },
  {
    turnId: 'act1',
    act: 1,
    title: '安抚 · 技能 · 知识库',
    durationMs: 14448,
    highlights: ['先安抚', '执行技能', '调知识库'],
    mode: 'loop',
    headlineAccent: '先定场景，再按 SOP 答对',
    headlinePlain: '自主寻找最优方案、执行并交付结果',
    caption: '先安抚 · 执行技能 · 告知规则',
    nodes: [
      {
        action: '自主规划',
        label: '先安抚再解决',
        tone: 'decision',
        thought: '用户现在情绪很激动，按照服务原则我应该先安抚再解决。',
        refs: [{ kind: 'agent', name: '外卖保险客服专员', meta: '数字员工.md' }],
        // 对齐口播 act1 首句（先安抚）与左侧安抚气泡
        holdMs: 7632,
      },
      {
        action: '执行技能',
        label: '食源性疾病理赔SOP',
        tone: 'skill',
        thought: '哇，找到啦！Skill 约定要先查看理赔SOP，先确认订单及场景。',
        refs: [{ kind: 'skill', name: '食源性疾病理赔SOP', meta: 'v2.3' }],
      },
      {
        action: '调用知识库',
        label: '食安险理赔知识库',
        tone: 'knowledge',
        thought:
          '嗯..让我查下知识库里的理赔规则，找到后反馈给客户。',
        refs: [{ kind: 'knowledge', name: '食安险理赔知识库', meta: '0.93' }],
      },
    ],
  },
  {
    turnId: 'act2',
    act: 2,
    title: '无侵入查业务系统',
    durationMs: 11016,
    highlights: ['推进流程', 'Browser Use'],
    mode: 'browser',
    headlineAccent: '无需接口对接也能查单',
    headlinePlain: 'Browser Use 无侵入查询',
    caption: '登录业务系统 · 输入订单 · 给出结果',
    nodes: [
      {
        action: 'Browser Use',
        label: '查询企业订单系统',
        tone: 'tool',
        thought:
          '用户要推进了。我直接用 Browser Use 登录业务系统查单就行，不用改接口——输入订单，查完把结果告诉客户。',
        refs: [{ kind: 'tool', name: 'Browser Use', meta: 'zero-dev' }],
      },
    ],
    browserSteps: [
      '登录业务系统',
      '输入订单',
      '完成查询',
      '给出处理结果',
      '回填对话',
    ],
  },
  {
    turnId: 'act3',
    act: 3,
    title: '安抚与服务记忆',
    durationMs: 7200,
    highlights: ['礼貌安抚', '服务记忆'],
    mode: 'care',
    headlineAccent: '道谢之后仍要懂用户',
    headlinePlain: '礼貌安抚与记忆沉淀',
    nodes: [
      {
        action: '礼貌安抚',
        label: '保存服务记忆',
        tone: 'result',
        thought:
          '客户道谢了，我先礼貌安抚一下；这次服务我记下来，下次更能懂他、更快帮上忙。',
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

/** 安抚气泡应对齐右侧第 1 步收束（优先用节点 holdMs） */
export function getCapabilityLeadAtMs(turnId: string, thinkMs: number): number {
  const stage = getCapabilityStage(turnId);
  const first = stage?.nodes[0];
  if (first?.holdMs && first.holdMs > 0) {
    return Math.min(first.holdMs, Math.max(800, thinkMs - 800));
  }
  const thoughtMs = (first?.thought?.length ?? 12) * LOOP_THOUGHT_CHAR_MS + 40;
  const hasRefs = (first?.refs ?? []).length > 0;
  const estimated =
    thoughtMs + (hasRefs ? LOOP_FINDER_DELAY_MS + LOOP_FINDER_DWELL_MS : LOOP_STEP_GAP_MS);
  return Math.min(estimated, Math.max(800, thinkMs - 800));
}
