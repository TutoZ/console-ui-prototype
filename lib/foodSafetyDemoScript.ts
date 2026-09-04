/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险演示视频脚本（40s）— 对话 + 右侧能力演示分镜。
 * 来源：时安险演示视频脚本，30~40秒无旁白.md
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
  /** 无用户发言，仅数字员工承接（如 Browser Use 后的路径判断） */
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

export const FOOD_SAFETY_DEMO_TURNS: FoodSafetyDemoTurn[] = [
  {
    id: 'act1',
    act: 1,
    user: '人工客服',
    match: ['人工客服', '转人工', '人工'],
    agent: '您不妨先把遇到的问题跟我说一说，我会尽力为您妥善处理。',
    thinkMs: 3000,
  },
  {
    id: 'act2',
    act: 2,
    user: '我吃完外卖后不舒服，刚刚还吐了，怎么处理？',
    match: ['吃完外卖', '不舒服', '吐了', '怎么处理', '外卖'],
    agent:
      '建议在餐品送达后36小时内，到一级及以上公立医院就医。如果诊断为食源性疾病，可申请食安险理赔，请保留诊断证明、病历和医疗票据，并通过京东APP在线提交。',
    thinkMs: 8000,
  },
  {
    id: 'act3',
    act: 3,
    user: '我没时间去，还要上班。',
    match: ['还要上班', '没时间去', '没时间去，还要上班', '没空上班'],
    agent:
      '理解您工作忙，可以就近去公立医院或急诊做基础诊断，后续材料通过手机在线上传；如果症状加重，请及时就医。',
    thinkMs: 4000,
  },
  {
    id: 'act4',
    act: 4,
    user: '这个能赔多少钱呢？',
    match: ['能赔多少', '赔多少钱', '多少钱'],
    agent: '理赔金额需结合实付金额、证明材料和保险约定确定。请选择订单，我马上为您查询。',
    thinkMs: 4000,
    offerOrder: true,
  },
  {
    id: 'act5',
    act: 5,
    user: `选择订单：${FOOD_SAFETY_DEMO_ORDER.product}`,
    match: [],
    isOrderSelect: true,
    agent: '已为您查询到该订单信息，我来判断适用的理赔路径。',
    thinkMs: 12000,
  },
  {
    id: 'act6',
    act: 6,
    user: '',
    match: [],
    agentOnly: true,
    agent:
      '这个没有医院诊断，目前无法确定是否属于食源性疾病。如果餐品存在异味、变质或异物，可凭餐品照片和情况说明尝试非致病理赔。',
    thinkMs: 6000,
  },
  {
    id: 'act7',
    act: 7,
    user: '好的，谢谢，我知道怎么弄了。',
    match: ['谢谢', '好的谢谢', '我知道怎么弄', '感谢'],
    agent: '不客气，祝您早日康复，理赔过程中有任何问题随时找我。',
    thinkMs: 3000,
  },
];

/** 右侧能力演示分镜（与对话幕次一一对应） */
export const FOOD_SAFETY_CAPABILITY_STAGES: CapabilityDemoStage[] = [
  {
    turnId: 'act1',
    act: 1,
    title: '主动承接',
    durationMs: 3000,
    highlights: ['主动承接'],
    mode: 'loop',
    headlineAccent: '未说明问题就转人工',
    headlinePlain: '先承接再澄清诉求',
    nodes: [
      {
        action: '感知意图',
        label: '请求人工帮助',
        tone: 'sense',
        thought: '用户请求人工，先识别意图。',
        refs: [{ kind: 'knowledge', name: '客服意图标签库', meta: '转人工 0.94' }],
      },
      {
        action: '执行技能',
        label: '转人工策略',
        tone: 'skill',
        thought: '匹配转人工策略，评估是否直转。',
        refs: [{ kind: 'skill', name: '转人工策略', meta: 'v1.2' }],
      },
      {
        action: '策略判断',
        label: '先主动承接',
        tone: 'decision',
        thought: '问题尚未说明，先主动承接。',
        refs: [{ kind: 'process', name: '首问承接流程', meta: 'P-CS-01' }],
      },
      {
        action: '执行技能',
        label: '情绪安抚',
        tone: 'skill',
        thought: '生成承接话术，引导补充场景。',
        refs: [{ kind: 'skill', name: '情绪安抚', meta: 'v1.4' }],
      },
    ],
  },
  {
    turnId: 'act2',
    act: 2,
    title: '食安险理赔 SOP',
    durationMs: 8000,
    highlights: ['36小时内', '诊断材料', '在线申请'],
    mode: 'loop',
    headlineAccent: '外卖后呕吐，症状不全',
    headlinePlain: '命中食安险理赔SOP',
    caption: '食安险知识库 · 致病 SOP',
    nodes: [
      {
        action: '场景研判',
        label: '疑似致病场景',
        tone: 'decision',
        thought: '不适+呕吐 → 疑似食品安全致病。',
        refs: [{ kind: 'knowledge', name: '症状-场景映射库', meta: '0.89' }],
      },
      {
        action: '检索知识',
        label: '食安险理赔知识库',
        tone: 'knowledge',
        thought: '召回条款与材料清单。',
        refs: [{ kind: 'knowledge', name: '食安险理赔知识库', meta: '0.93' }],
      },
      {
        action: '加载技能',
        label: '致病理赔SOP',
        tone: 'skill',
        thought: '36h就医 · 公立医院 · 保留材料。',
        refs: [{ kind: 'skill', name: '食源性疾病理赔SOP', meta: 'v2.3' }],
      },
      {
        action: '输出要点',
        label: '36h · 医院 · 材料',
        tone: 'result',
        thought: '按 SOP 输出可执行指引。',
        refs: [{ kind: 'process', name: '理赔引导流程', meta: 'P-FS-Claim' }],
      },
    ],
  },
  {
    turnId: 'act3',
    act: 3,
    title: '动态调整方案',
    durationMs: 4000,
    highlights: ['就近诊断', '线上提交'],
    mode: 'loop',
    headlineAccent: '工作忙，没时间就医',
    headlinePlain: '按障碍动态调整方案',
    caption: '时间障碍 · 话术重排',
    nodes: [
      {
        action: '识别障碍',
        label: '时间成本',
        tone: 'decision',
        thought: '核心障碍 = 时间成本。',
        refs: [{ kind: 'skill', name: '障碍识别器', meta: '时间' }],
      },
      {
        action: '优化话术',
        label: '话术优化',
        tone: 'skill',
        thought: '改写为就近/急诊 + 线上传。',
        refs: [{ kind: 'skill', name: '话术优化', meta: '降门槛' }],
      },
      {
        action: '重排方案',
        label: '就近 + 线上',
        tone: 'result',
        thought: '重排：就近诊断 + 材料线上提交。',
        refs: [{ kind: 'process', name: '灵活履约方案', meta: 'plan-B' }],
      },
    ],
  },
  {
    turnId: 'act4',
    act: 4,
    title: '主动获取订单',
    durationMs: 4000,
    highlights: ['理算规则', '缺少订单'],
    mode: 'loop',
    headlineAccent: '问赔付，却缺订单',
    headlinePlain: '主动补齐理算条件',
    caption: '理算缺订单',
    nodes: [
      {
        action: '调取规则',
        label: '理算规则',
        tone: 'knowledge',
        thought: '结合实付、证明与约定理算。',
        refs: [{ kind: 'knowledge', name: '理算规则', meta: 'FS-Amount' }],
      },
      {
        action: '缺口判断',
        label: '缺少订单',
        tone: 'decision',
        thought: '缺少订单，无法判断。',
        refs: [{ kind: 'skill', name: '信息缺口检测', meta: 'order_id' }],
      },
      {
        action: '唤起工具',
        label: '触发订单选择',
        tone: 'tool',
        thought: '下发订单卡片，一键选择。',
        refs: [{ kind: 'tool', name: '订单选择卡片', meta: 'UI' }],
      },
    ],
  },
  {
    turnId: 'act5',
    act: 5,
    title: 'Browser Use 无侵入查询',
    durationMs: 12000,
    highlights: ['无侵入', '零改造', '自主操作'],
    mode: 'browser',
    headlineAccent: '需查订单，不能麻烦用户',
    headlinePlain: 'Browser Use无侵入查询',
    caption: '无侵入 · 零改造 · 自主操作',
    nodes: [
      {
        action: '启动工具',
        label: 'Browser Use',
        tone: 'tool',
        thought: 'Browser Use 启动，无插件无改造。',
        refs: [{ kind: 'tool', name: 'Browser Use', meta: 'zero-dev' }],
      },
      {
        action: '浏览器操作',
        label: '打开订单页面',
        tone: 'tool',
        thought: '自动打开企业订单系统页面。',
        refs: [{ kind: 'process', name: '订单核验流程', meta: 'P-Order-Q' }],
      },
      {
        action: '浏览器操作',
        label: '定位订单',
        tone: 'tool',
        thought: '光标自主定位目标订单。',
        refs: [{ kind: 'tool', name: '页面元素定位', meta: 'auto' }],
      },
      {
        action: '浏览器操作',
        label: '读取订单信息',
        tone: 'tool',
        thought: '读取餐品与订单信息。',
        refs: [{ kind: 'tool', name: '页面信息抓取', meta: 'read' }],
      },
      {
        action: '回填决策',
        label: '继续理算',
        tone: 'decision',
        thought: '信息回填，继续理算。',
        refs: [{ kind: 'skill', name: '结果摘要技能', meta: 'synced' }],
      },
    ],
    browserSteps: ['Browser Use 启动', '打开订单页面', '定位目标订单', '读取餐品信息', '回填继续理算'],
  },
  {
    turnId: 'act6',
    act: 6,
    title: '致病 / 非致病路径判断',
    durationMs: 6000,
    highlights: ['有无诊断', '非致病路径'],
    mode: 'path-switch',
    headlineAccent: '无诊断，致病路径受阻',
    headlinePlain: '切换非致病理赔引导',
    caption: '无诊断 → 非致病',
    nodes: [
      {
        action: '调取规则',
        label: '致病/非致病规则',
        tone: 'knowledge',
        thought: '致病 / 非致病判断规则。',
        refs: [{ kind: 'knowledge', name: '致病/非致病判断规则', meta: 'KB-FS-Path' }],
      },
      {
        action: '路径判断',
        label: '暂无医院诊断',
        tone: 'decision',
        thought: '暂无医院诊断，致病路径受限。',
        refs: [{ kind: 'skill', name: '路径裁决器', meta: 'no-diagnosis' }],
      },
      {
        action: '引导路径',
        label: '非致病路径',
        tone: 'skill',
        thought: '引导：非致病（异味/变质/异物）路径。',
        refs: [{ kind: 'skill', name: '非致病理赔SOP', meta: 'v1.8' }],
      },
    ],
    paths: {
      illness: '致病理赔（需医院诊断）',
      nonIllness: '非致病理赔（异味/变质/异物 + 照片）',
    },
  },
  {
    turnId: 'act7',
    act: 7,
    title: '自然收尾',
    durationMs: 3000,
    highlights: ['早日康复'],
    mode: 'care',
    headlineAccent: '咨询结束，需礼貌收束',
    headlinePlain: '确认理解与持续服务',
    nodes: [
      {
        action: '结束关怀',
        label: '礼貌收尾',
        tone: 'skill',
        thought: '用户致谢，自然收尾。',
        refs: [
          { kind: 'skill', name: '结束关怀', meta: 'close' },
          { kind: 'process', name: '会话收尾流程', meta: 'P-Close' },
        ],
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
 * 优先匹配「当前下一幕」；仅当下一幕未命中时，才在剩余幕中按最长关键词匹配，避免短词串幕。
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

  // 1) 严格优先下一幕
  const next = pending[0];
  const nextScore = scoreTurn(next);
  if (nextScore > 0) return next;

  // 2) 其余未完成幕：取最长命中，且至少 4 字，降低短词误触
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
