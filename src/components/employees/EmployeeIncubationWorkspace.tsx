/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 数字员工智能孵化 — 左对话规划并直接写入草案，右侧复用员工培训页
 *（入职培训配置 + 能力测试 / 培训存档）
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  Check,
  Loader2,
  Plus,
  Sparkles,
} from '@/lib/icons';
import {
  CHIP,
  CHIP_ACTIVE,
  NAV_ACTIVE_GRADIENT_BG,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import { AGENT_AVATAR_PRESETS } from '@/lib/agentAvatarDisplay';
import { defaultOpeningLineForAgent, defaultFallbackScriptForAgent } from '@/lib/agentDefaultCopy';
import { LIFECYCLE_TERMS } from '@/lib/platformTerminology';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import {
  createSavedSnapshot,
  ensureAgentSnapshots,
  savedSnapshotTitle,
  snapshotToAgentUpdates,
} from '../../lib/agentVersions';
import { useApp } from '../../context/AppContext';
import type { HiredAgent, KnowledgeBase, Skill } from '../../types';
import { ResizableSplitPane } from '../common/ResizableSplitPane';
import { SegmentedTabBar } from '../common/SegmentedTabs';
import { OnboardingWorkspaceHeader } from '../onboarding/OnboardingWorkspaceHeader';
import { OnboardingConfigPanel } from '../onboarding/OnboardingConfigPanel';
import { OnboardingCapabilityTestPanel } from '../onboarding/OnboardingCapabilityTestPanel';
import { AgentVersionPanel } from '../onboarding/AgentVersionPanel';
import { ONBOARDING_WORKSPACE_TABS } from '@/lib/onboardingWorkspaceTabs';
import { SkillThinkingCard } from '../skills/SkillThinkingCard';

export type IncubationDraft = {
  name: string;
  personality: string;
  description: string;
  duties: string;
  prohibited: string;
  skills: Array<{ id: string; name: string; desc: string; sourceId?: string }>;
  knowledgeBases: Array<{ id: string; name: string; desc: string; sourceId?: string }>;
};

type ChatMsg = { id: string; kind: 'user' | 'ai'; text: string; time: string };

type HelpChip = { id: string; label: string; send: string };

const USER_BUBBLE = cn(
  'px-3 py-3 text-[14px] leading-[22px] whitespace-pre-line text-[#181D27] rounded-[20px_4px_20px_20px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);

/** AI 气泡 — 对齐 dongDesign-AI / B 端 AI 组件规范 regular-14 */
const AI_BUBBLE =
  'max-w-[92%] w-full px-3.5 py-3 rounded-2xl text-[14px] leading-[22px] bg-neutral-100 text-[#595959]';

/** 一/二/三级标题 + 正文（dongDesign-AI 文本规范） */
const AI_H1 = 'text-[18px] leading-[28px] font-semibold text-[#262626]';
const AI_H2 = 'text-[16px] leading-[24px] font-semibold text-[#262626]';
const AI_H3 = 'text-[14px] leading-[22px] font-semibold text-[#1c1d1f]';
const AI_BODY = 'text-[14px] leading-[22px] text-[#595959]';
const AI_MUTED = 'text-[14px] leading-[22px] text-[#8c8c8c]';

/** 写入后的排版样例（便于对照标题层级） */
const AI_TYPOGRAPHY_DEMO = [
  '# 已写入右侧配置区',
  '',
  '草案要点已同步到右侧员工资料。下面是气泡内标题与正文字阶样例，便于对照 dongDesign-AI 规范。',
  '',
  '## 二级标题 · 你可以继续做什么',
  '',
  '在对话里继续改性格、职责或红线；也可以点上方“AI 帮写”快捷条，让我按场景扩写一版。',
  '',
  '### 三级标题 · 对话微调',
  '直接说明想改哪一条，例如“把性格写得更共情”，我会立刻同步到右侧。',
  '',
  '### 三级标题 · 完成创建',
  '点右上角“完成培训”结束帮写创建；之后可从员工卡进入“员工培训”。',
  '',
  '> 次要说明：一级 18/28 · 二级 16/24 · 三级与正文 14/22；正文色 #595959，标题 #262626 / #1c1d1f。',
].join('\n');

function renderInlineEmphasis(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/([「『“][^」』”]*[」』”])/);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    /^[「『“].*[」』”]$/.test(part) ? (
      <span key={`${keyPrefix}-${i}`} className="font-semibold text-[#1c1d1f]">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    ),
  );
}

/** 轻量 Markdown：# / ## / ### / > 引用 / 空行分段 */
function renderAiRichContent(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className={AI_H3}>
          {renderInlineEmphasis(line.slice(4), `h3-${i}`)}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${i}`} className={AI_H2}>
          {renderInlineEmphasis(line.slice(3), `h2-${i}`)}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={`h1-${i}`} className={AI_H1}>
          {renderInlineEmphasis(line.slice(2), `h1-${i}`)}
        </h1>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push(
        <p key={`q-${i}`} className={AI_MUTED}>
          {renderInlineEmphasis(line.slice(2), `q-${i}`)}
        </p>,
      );
      i += 1;
      continue;
    }
    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^#{1,3}\s/.test(lines[i]) && !/^>\s/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={`p-${i}`} className={AI_BODY}>
        {renderInlineEmphasis(para.join('\n'), `p-${i}`)}
      </p>,
    );
  }
  return <div className="flex flex-col gap-2 whitespace-pre-line">{blocks}</div>;
}

const HELP_CHIPS: HelpChip[] = [
  { id: 'persona', label: '补充性格人设', send: '请把员工性格写得更具体，突出共情与专业边界' },
  { id: 'duty', label: '细化工作职责', send: '请把工作职责拆成更可执行的步骤' },
  { id: 'prohibit', label: '收紧禁止行为', send: '请补充禁止行为与红线，强调不得擅自承诺赔付' },
  { id: 'skill', label: '再加一项技能', send: '请再规划一项与主场景强相关的技能' },
  { id: 'kb', label: '补充知识库', send: '请再规划一个业务红线或 SOP 知识库' },
];

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function emptyDraft(): IncubationDraft {
  return {
    name: '',
    personality: '',
    description: '',
    duties: '',
    prohibited: '',
    skills: [],
    knowledgeBases: [],
  };
}

function draftFromPrompt(prompt: string): IncubationDraft {
  const named =
    prompt.match(/[「“](.+?)[」”]/)?.[1]
    || prompt.match(/(?:打造|创建)(.+?)(?:，|,|$)/)?.[1]?.trim()
    || '在线客服专员';
  const name = named.slice(0, 12) || '在线客服专员';
  const isInsurance = /保险|理赔|延保|食安/.test(prompt);
  const isIt = /IT|技术支持|故障|派单/.test(prompt);
  const isVip = /高价值|回访|接待/.test(prompt);

  const skillA = isInsurance
    ? {
        id: uid('sk'),
        name: '理赔进度查询与材料预审',
        desc: '对接保单与理赔工单接口，核验身份后返回当前节点、缺件清单与下一步指引。',
      }
    : isIt
      ? {
          id: uid('sk'),
          name: '故障报修与自动派单',
          desc: '识别故障类型与紧急度，自动创建工单并派发至对应技术队列。',
        }
      : {
          id: uid('sk'),
          name: '在线客服全流程服务与订单联动',
          desc: '对接业务数据接口，判断意图后调用查询/改单/工单协同等 API，完成咨询与办理。',
        };

  return {
    name,
    personality: isVip
      ? '亲和专业、主动关怀、高共情与强跟进意识'
      : '严谨专业、温和体贴、共情力强且耐受力高',
    description:
      prompt.trim().slice(0, 180)
      || `面向业务场景，聚焦客户服务与流程协同，基于 OpenClaw 自主规划持续演进能力。`,
    duties: [
      '1. 7×24 小时响应客户咨询并给出可执行结论',
      '2. 识别用户意图并完成分流、查询与办理',
      '3. 监测情绪与高危诉求，必要时升级人工',
    ].join('\n'),
    prohibited: [
      '1. 不得泄露敏感数据、后台接口或未授权内部信息',
      '2. 不得擅自承诺赔付、折扣或超出政策的权益',
      '3. 不得使用攻击性、歧视性或不专业用语',
    ].join('\n'),
    skills: [
      skillA,
      {
        id: uid('sk'),
        name: '客户情绪感知与智能升级调度',
        desc: '评估情绪倾向与紧急程度，触发安抚话术或升级至资深人工专席。',
      },
    ],
    knowledgeBases: [
      {
        id: uid('kb'),
        name: isInsurance
          ? '2026版理赔与延保标准服务知识库'
          : '2026版在线客服标准服务知识库',
        desc: '含标准化 FAQ、业务规则与应急预案，供检索召回。',
      },
      {
        id: uid('kb'),
        name: '业务红线标准与紧急转接预案库',
        desc: '含禁语清单、投诉升级路径与标准 SOP。',
      },
    ],
  };
}

function patchDraftByInstruction(draft: IncubationDraft, text: string): IncubationDraft {
  const next = { ...draft, skills: [...draft.skills], knowledgeBases: [...draft.knowledgeBases] };
  if (/性格|人设|语气/.test(text)) {
    next.personality = text.replace(/^.*?[：:]\s*/, '').slice(0, 80) || next.personality;
  }
  if (/禁止|红线/.test(text)) {
    next.prohibited = `${next.prohibited}\n· ${text.slice(0, 60)}`.slice(0, 1000);
  }
  if (/职责|步骤/.test(text)) {
    next.duties = `${next.duties}\n· ${text.slice(0, 80)}`.slice(0, 1000);
  }
  if (/技能/.test(text)) {
    next.skills.push({
      id: uid('sk'),
      name: '场景补充技能',
      desc: text.slice(0, 120),
    });
  }
  if (/知识库/.test(text)) {
    next.knowledgeBases.push({
      id: uid('kb'),
      name: '补充业务知识库',
      desc: text.slice(0, 120),
    });
  }
  if (/描述|定位|场景/.test(text) && !/性格|禁止|技能|知识库/.test(text)) {
    next.description = text.slice(0, 180);
  }
  return next;
}

/** 用户在请教写法，而非要求立刻改草案 */
function isWritingHelpIntent(text: string): boolean {
  return /怎么写|如何写|不会写|教我写|告诉我.*(写|填)|写什么|怎么填|怎么描述|给(个|一)?(示例|例子|范例|模板|参考)|示例怎么|范例|写法/.test(
    text,
  );
}

type WritingFieldKey = 'name' | 'personality' | 'description' | 'duties' | 'prohibited' | 'skill' | 'kb' | 'general';

function detectWritingField(
  text: string,
  editHints: string[] = [],
): WritingFieldKey {
  const blob = `${text}\n${editHints.join('\n')}`;
  if (/名称|叫什么|起名/.test(blob)) return 'name';
  if (/性格|人设|语气|口吻/.test(blob)) return 'personality';
  if (/描述|定位|简介|场景/.test(blob)) return 'description';
  if (/职责|工作内容|日常|做什么/.test(blob)) return 'duties';
  if (/禁止|红线|不能|不得/.test(blob)) return 'prohibited';
  if (/技能/.test(blob)) return 'skill';
  if (/知识库|FAQ|SOP|资料/.test(blob)) return 'kb';
  return 'general';
}

function buildWritingHelpReply(
  field: WritingFieldKey,
  draft: IncubationDraft,
  editHints: string[] = [],
): string {
  const role = draft.name.trim() || '在线客服专员';
  const hintLine =
    editHints.length > 0
      ? `你正在改的是“${editHints.join('、')}”。可以按下面写法直接改，或复制后微调再发我。\n\n`
      : '';

  const guides: Record<WritingFieldKey, string> = {
    name: `${hintLine}员工名称建议短、好记、能看出岗位：
· 写法：${role} / 延保进度专员 / 高价值客户管家
· 避免：太泛（如“助手”）或带版本号、内部代号`,
    personality: `${hintLine}员工性格用“气质词 + 边界”写 1 句即可：
· 示例：严谨专业、温和体贴；先共情再给结论，不越权承诺
· 结构：3～6 个气质词 + 一句服务原则（共情 / 清晰 / 红线）
· 当前可参考：${draft.personality || '严谨专业、温和体贴、共情力强且耐受力高'}`,
    description: `${hintLine}员工描述写清“服务谁 + 干什么 + 边界”：
· 示例：面向电商售后用户，处理订单/物流/退换咨询；核验身份后给可执行结论，超权事项转人工
· 结构：对象 → 主场景 → 能力范围 → 升级条件
· 当前可参考：${(draft.description || '面向业务场景的客户服务与流程协同').slice(0, 80)}`,
    duties: `${hintLine}工作职责写成可执行的编号清单（建议 3～5 条）：
1. 7×24 响应咨询，先结论后依据
2. 识别意图并完成查询 / 办理 / 分流
3. 监测情绪与高危诉求，必要时升级人工
· 每条用动词开头，写清“做到什么程度”`,
    prohibited: `${hintLine}禁止行为写“不得…”红线，建议 3 条起：
1. 不得泄露敏感数据、后台接口或未授权内部信息
2. 不得擅自承诺赔付、折扣或超出政策的权益
3. 不得使用攻击性、歧视性或不专业用语
· 可再补：不得编造未核验的时效 / 物流节点`,
    skill: `${hintLine}技能写法：名称点明能力，描述写“输入 → 动作 → 产出”：
· 名称示例：理赔进度查询与材料预审
· 描述示例：对接保单与理赔工单，核验身份后返回当前节点、缺件清单与下一步指引
· 一句模板：当用户提供【业务标识】时，【调用/核验】并返回【可读结论】`,
    kb: `${hintLine}知识库写法：名称点明资料域，描述写用途：
· 名称示例：2026版在线客服标准服务知识库
· 描述示例：含标准化 FAQ、业务规则与应急预案，供检索召回
· 可再补：业务红线 / 禁语清单 / 转接 SOP`,
    general: `${hintLine}不会写也没关系，可以按“对象 → 场景 → 能力 → 红线”四句描述，例如：

“面向京东延保用户，查询服务单进度并告知处理节点；需核验单号；不得承诺未核验时效或赔付，超权转人工。”

你也可以直接说“帮我按这个场景生成一版”，或点选上方“AI 帮写”快捷条，我再帮你扩成完整草案。`,
  };

  return guides[field];
}

function buildThinkSteps(prompt: string): SkillThinkStep[] {
  return [
    { id: 's1', label: '解析岗位意图', detail: prompt.slice(0, 48) || '识别服务场景', status: 'pending' },
    { id: 's2', label: '规划主 Agent Prompt', detail: '名称 / 性格 / 职责 / 红线', status: 'pending' },
    { id: 's3', label: '拆解技能边界', detail: '技能表单草稿', status: 'pending' },
    { id: 's4', label: '规划知识库挂载', detail: '知识库表单草稿', status: 'pending' },
    { id: 's5', label: '写入右侧配置', detail: '同步员工资料与资源挂载', status: 'pending' },
  ];
}

function mergeSeedSkills(
  draft: IncubationDraft,
  seedSkills: Array<{ id: string; name: string; description: string }>,
): IncubationDraft {
  if (seedSkills.length === 0) return draft;
  const indexed = seedSkills.map((s) => ({
    id: uid('sk'),
    name: s.name,
    desc: s.description || '已从技能中心索引挂载。',
    sourceId: s.id,
  }));
  const indexedNames = new Set(indexed.map((s) => s.name));
  const rest = draft.skills.filter((s) => !indexedNames.has(s.name));
  return { ...draft, skills: [...indexed, ...rest] };
}

function mergeSeedKbs(
  draft: IncubationDraft,
  seedKbs: Array<{ id: string; name: string }>,
): IncubationDraft {
  if (seedKbs.length === 0) return draft;
  const indexed = seedKbs.map((kb) => ({
    id: uid('kb'),
    name: kb.name,
    desc: '已从员工知识索引挂载。',
    sourceId: kb.id,
  }));
  const indexedNames = new Set(indexed.map((k) => k.name));
  const rest = draft.knowledgeBases.filter((k) => !indexedNames.has(k.name));
  return { ...draft, knowledgeBases: [...indexed, ...rest] };
}

function applySeedResources(
  draft: IncubationDraft,
  seedSkills: Array<{ id: string; name: string; description: string }>,
  seedKbs: Array<{ id: string; name: string }>,
): IncubationDraft {
  return mergeSeedKbs(mergeSeedSkills(draft, seedSkills), seedKbs);
}

const INCUBATION_WORKSPACE_TABS = [{ id: 'build' as const, label: '智能孵化' }];

const INCUBATION_PLACEHOLDER_ID = 'h_incubation_placeholder';

function createBlankIncubationAgent(): HiredAgent {
  return {
    id: INCUBATION_PLACEHOLDER_ID,
    name: '未命名数字员工',
    marketId: 'm_custom_customer_service',
    agentId: 'AGENT_DRAFT',
    avatar: AGENT_AVATAR_PRESETS[10],
    avatarCustomized: true,
    description: '',
    skills: [],
    knowledgeBases: [],
    status: 'draft',
    jobFamily: 'customer_service',
    hiredAt: '',
    buildMode: 'autonomous',
    persona: '',
    languageStyle: '',
    constraints: '',
    workflowNotes: '',
    backgroundKnowledge: '',
    openingLine: defaultOpeningLineForAgent('数字员工'),
    fallbackScript: defaultFallbackScriptForAgent(),
  };
}

/** 右侧直接复用正式培训页；规划完成前也可展示空白配置项 */
function IncubationTrainingPane({
  agent,
  knowledgeBases,
  skills,
  updateHiredAgent,
  showToast,
}: {
  agent: HiredAgent | null;
  knowledgeBases: KnowledgeBase[];
  skills: Skill[];
  updateHiredAgent: (id: string, updates: Partial<HiredAgent>) => void;
  showToast: (message: string) => void;
}) {
  const [placeholderAgent, setPlaceholderAgent] = useState(createBlankIncubationAgent);
  const [rightTab, setRightTab] = useState<'chat' | 'versions'>('chat');
  const [configDirty, setConfigDirty] = useState(false);
  const [configSavedAt, setConfigSavedAt] = useState<Date | null>(null);
  const [previewSnapshotId, setPreviewSnapshotId] = useState<string | null>(null);
  const [configSyncToken, setConfigSyncToken] = useState(0);

  const displayAgent = agent ?? placeholderAgent;
  const isPlaceholder = !agent || displayAgent.id === INCUBATION_PLACEHOLDER_ID;

  useEffect(() => {
    if (!agent) setPlaceholderAgent(createBlankIncubationAgent());
    setRightTab('chat');
    setConfigDirty(false);
    setConfigSavedAt(null);
    setPreviewSnapshotId(null);
    setConfigSyncToken((t) => t + 1);
  }, [agent?.id]);

  const previewSnapshot = useMemo(() => {
    if (isPlaceholder || !previewSnapshotId) return null;
    return ensureAgentSnapshots(displayAgent).find((s) => s.id === previewSnapshotId) ?? null;
  }, [displayAgent, isPlaceholder, previewSnapshotId]);

  const patchAgent = (id: string, updates: Partial<HiredAgent>) => {
    if (id === INCUBATION_PLACEHOLDER_ID || isPlaceholder) {
      setPlaceholderAgent((prev) => ({ ...prev, ...updates }));
      return;
    }
    updateHiredAgent(id, updates);
  };

  const handlePreviewSnapshot = (snapshotId: string) => {
    if (isPlaceholder) return;
    setPreviewSnapshotId(snapshotId);
    setRightTab('versions');
  };

  const handleCancelPreview = () => setPreviewSnapshotId(null);

  const handleApplySnapshot = (snapshotId: string) => {
    if (isPlaceholder) return;
    const snapshots = ensureAgentSnapshots(displayAgent);
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    updateHiredAgent(displayAgent.id, {
      ...snapshotToAgentUpdates(snap),
      publishedSnapshotId: snapshotId,
    });
    setPreviewSnapshotId(null);
    setConfigSyncToken((t) => t + 1);
    setConfigDirty(false);
    showToast(`已切换至“${snap.title}”`);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (isPlaceholder) return;
    const snapshots = ensureAgentSnapshots(displayAgent);
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap || snap.kind === 'baseline') return;
    if (displayAgent.publishedSnapshotId === snapshotId) {
      showToast('无法删除当前运行中的版本，请先应用其他版本。');
      return;
    }
    updateHiredAgent(displayAgent.id, {
      configSnapshots: snapshots.filter((s) => s.id !== snapshotId),
    });
    if (previewSnapshotId === snapshotId) setPreviewSnapshotId(null);
    showToast(`已删除“${snap.title}”`);
  };

  const handleDiscardDraft = () => {
    if (isPlaceholder) return;
    const snapshots = ensureAgentSnapshots(displayAgent);
    const published =
      snapshots.find((s) => s.id === displayAgent.publishedSnapshotId) ??
      snapshots.find((s) => s.kind === 'baseline');
    if (!published) return;
    updateHiredAgent(displayAgent.id, snapshotToAgentUpdates(published));
    setPreviewSnapshotId(null);
    setConfigSyncToken((t) => t + 1);
    setConfigDirty(false);
    showToast('已放弃未保存更改，恢复为当前运行版本。');
  };

  const handleConfigSaved = () => {
    if (isPlaceholder) {
      showToast('请先完成左侧规划，再保存培训存档');
      return;
    }
    const snapshots = ensureAgentSnapshots(displayAgent);
    const title = savedSnapshotTitle(displayAgent, skills);
    const snapshot = createSavedSnapshot(displayAgent, snapshots, title);
    updateHiredAgent(displayAgent.id, {
      configSnapshots: [...snapshots, snapshot],
      publishedSnapshotId: snapshot.id,
    });
    setConfigSavedAt(new Date());
    setConfigDirty(false);
    showToast(`已保存培训存档“${title}”`);
  };

  const chatLocked = isPlaceholder || !!previewSnapshotId;

  return (
    <ResizableSplitPane
      storageKey="js_incubation_training_split_v2"
      defaultRatio={0.6}
      minLeftPx={280}
      minRightPx={260}
      className="bg-paper h-full"
      left={
        <OnboardingConfigPanel
          agent={displayAgent}
          knowledgeBases={knowledgeBases}
          skills={skills}
          hasKbs={knowledgeBases.length > 0}
          hasSks={skills.length > 0}
          updateHiredAgent={patchAgent}
          showToast={showToast}
          onPersonaConfigured={() => {}}
          onKnowledgeBound={() => {}}
          onSkillBound={() => {}}
          onConfigStateChange={({ isDirty, lastSavedAt }) => {
            setConfigDirty(isDirty);
            setConfigSavedAt(lastSavedAt);
          }}
          onConfigSaved={handleConfigSaved}
          previewSnapshot={previewSnapshot}
          configSyncToken={configSyncToken}
          onCancelPreview={isPlaceholder ? undefined : handleCancelPreview}
          onApplyPreview={
            isPlaceholder || !previewSnapshot
              ? undefined
              : () => handleApplySnapshot(previewSnapshot.id)
          }
        />
      }
      right={
        <div className="flex flex-col h-full bg-paper overflow-hidden text-neutral-800 text-left min-h-0">
          {rightTab === 'chat' ? (
            <OnboardingCapabilityTestPanel
              agent={displayAgent}
              knowledgeBases={knowledgeBases}
              skills={skills}
              showToast={showToast}
              locked={chatLocked}
              lockPlaceholder={
                isPlaceholder ? '请先完成左侧规划后再测试' : '预览模式中无法测试'
              }
              lockToast={
                isPlaceholder
                  ? '请先完成左侧规划后再进行能力测试'
                  : `请先取消预览或应用其他${LIFECYCLE_TERMS.examVersion}，再进行${LIFECYCLE_TERMS.onboardTest}。`
              }
              headerLeft={
                <SegmentedTabBar
                  ariaLabel="预览面板"
                  value={rightTab}
                  onChange={(id) => setRightTab(id as 'chat' | 'versions')}
                  items={[
                    { id: 'chat', label: LIFECYCLE_TERMS.onboardTest },
                    { id: 'versions', label: LIFECYCLE_TERMS.examVersion },
                  ]}
                />
              }
            />
          ) : (
            <>
              <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 gap-2 min-h-[54px]">
                <SegmentedTabBar
                  ariaLabel="预览面板"
                  value={rightTab}
                  onChange={(id) => setRightTab(id as 'chat' | 'versions')}
                  items={[
                    { id: 'chat', label: LIFECYCLE_TERMS.onboardTest },
                    { id: 'versions', label: LIFECYCLE_TERMS.examVersion },
                  ]}
                />
              </div>
              {isPlaceholder ? (
                <div className="flex-1 min-h-0 flex items-center justify-center px-6 text-center">
                  <p className="text-[13px] text-neutral-500 leading-relaxed max-w-xs">
                    完成左侧规划后，可在此查看与管理培训存档。
                  </p>
                </div>
              ) : (
                <AgentVersionPanel
                  agent={displayAgent}
                  knowledgeBases={knowledgeBases}
                  skills={skills}
                  isDirty={configDirty}
                  lastSavedAt={configSavedAt}
                  previewSnapshotId={previewSnapshotId}
                  onPreview={handlePreviewSnapshot}
                  onApplySnapshot={handleApplySnapshot}
                  onDeleteSnapshot={handleDeleteSnapshot}
                  onDiscardDraft={handleDiscardDraft}
                />
              )}
            </>
          )}
        </div>
      }
    />
  );
}

type Props = {
  open: boolean;
  seedPrompt?: string;
  /** 智能创作入口已索引的平台技能 id */
  seedSkillIds?: string[];
  /** 智能创作入口已索引的知识库 id */
  seedKbIds?: string[];
  onClose: () => void;
};

export function EmployeeIncubationWorkspace({
  open,
  seedPrompt = '',
  seedSkillIds = [],
  seedKbIds = [],
  onClose,
}: Props) {
  const {
    createBlankHiredAgent,
    createSkill,
    createKnowledgeBase,
    showToast,
    updateHiredAgent,
    deleteHiredAgent,
    hiredAgents,
    skills: platformSkills,
    knowledgeBases: platformKbs,
  } = useApp();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState<IncubationDraft>(emptyDraft);
  const [pendingDraft, setPendingDraft] = useState<IncubationDraft | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [trainingAgentId, setTrainingAgentId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [thinkSteps, setThinkSteps] = useState<SkillThinkStep[]>([]);
  const [chipSelections, setChipSelections] = useState<HelpChip[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const materializedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const trainingAgent = useMemo(
    () => (trainingAgentId ? hiredAgents.find((a) => a.id === trainingAgentId) ?? null : null),
    [hiredAgents, trainingAgentId],
  );

  const trainingAgentIdRef = useRef<string | null>(null);
  trainingAgentIdRef.current = trainingAgentId;

  const resetSession = useCallback(() => {
    const provisionalId = trainingAgentIdRef.current;
    if (provisionalId) deleteHiredAgent(provisionalId);
    setTrainingAgentId(null);
    materializedRef.current = false;
    setMessages([]);
    setDraft(emptyDraft());
    setPendingDraft(null);
    setFormReady(false);
    setInput('');
    setThinking(false);
    setThinkSteps([]);
    setChipSelections([]);
    seededRef.current = false;
  }, [deleteHiredAgent]);

  const runThinkAnimation = async (steps: SkillThinkStep[]) => {
    setThinkSteps(steps.map((s) => ({ ...s, status: 'pending' })));
    for (let i = 0; i < steps.length; i++) {
      setThinkSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? 'done' : idx === i ? 'running' : 'pending',
        })),
      );
      await new Promise((r) => setTimeout(r, 380));
    }
    setThinkSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
    await new Promise((r) => setTimeout(r, 220));
  };

  useEffect(() => {
    if (!open) {
      resetSession();
      return;
    }
    resetSession();
    // 智能创作带入：跳过欢迎空态，立刻进入首轮规划
    if (seedPrompt.trim()) {
      seededRef.current = true;
      const text = seedPrompt.trim();
      setMessages([
        { id: uid('m'), kind: 'user', text, time: nowTime() },
      ]);
      setThinking(true);
      void (async () => {
        const seedSkills = platformSkills
          .filter((s) => seedSkillIds.includes(s.id))
          .map((s) => ({ id: s.id, name: s.name, description: s.description }));
        const seedKbs = platformKbs
          .filter((kb) => seedKbIds.includes(kb.id))
          .map((kb) => ({ id: kb.id, name: kb.name }));
        await runThinkAnimation(buildThinkSteps(text));
        const nextDraft = applySeedResources(draftFromPrompt(text), seedSkills, seedKbs);
        setPendingDraft(nextDraft);
        setDraft(nextDraft);
        setFormReady(true);
        setThinking(false);
        setThinkSteps([]);
        const mountHint = [
          seedSkills.length > 0 ? `${seedSkills.length} 项技能` : '',
          seedKbs.length > 0 ? `${seedKbs.length} 个知识库` : '',
        ]
          .filter(Boolean)
          .join('、');
        setMessages((prev) => [
          ...prev,
          {
            id: uid('m'),
            kind: 'ai',
            text: `已根据你的描述完成自主规划${mountHint ? `，并优先挂载你索引的${mountHint}` : ''}，并写入右侧配置区（含主 Agent、技能与知识库）。\n可继续在对话里改写某一条，或点上方「AI 帮写」快捷补充。`,
            time: nowTime(),
          },
          {
            id: uid('m'),
            kind: 'ai',
            text: AI_TYPOGRAPHY_DEMO,
            time: nowTime(),
          },
        ]);
        showToast('已写入右侧配置区');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedPrompt, seedSkillIds.join('|'), seedKbIds.join('|')]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, thinkSteps]);

  /** 首轮规划写入后物化真实员工，右侧直接复用培训配置 + 预览调试 */
  useEffect(() => {
    if (!open || !formReady || materializedRef.current) return;
    if (!draft.name.trim()) return;

    materializedRef.current = true;
    const skillIds = draft.skills.map((sk, i) => {
      if (sk.sourceId) return sk.sourceId;
      return createSkill(sk.name, sk.desc, 'mine', {
        kind: 'tool',
        source: 'nl',
        status: 'published',
        skillCode: `skill_${Date.now()}_${i}`,
      }).id;
    });
    const kbIds = draft.knowledgeBases.map((kb) => {
      if (kb.sourceId) return kb.sourceId;
      return createKnowledgeBase(kb.name).id;
    });

    const agent = createBlankHiredAgent({
      name: draft.name.slice(0, 8),
      description: draft.description,
      jobFamily: 'customer_service',
      buildMode: 'autonomous',
      enterTraining: false,
    });

    updateHiredAgent(agent.id, {
      skills: skillIds,
      knowledgeBases: kbIds,
      languageStyle: draft.personality,
      constraints: draft.prohibited,
      workflowNotes: draft.duties,
      persona: draft.duties,
    });
    setTrainingAgentId(agent.id);
    // 仅在 formReady 首次置真时物化；后续以培训面板 / 对话同步为准
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formReady]);

  useEffect(() => {
    if (!trainingAgentId || !formReady) return;
    updateHiredAgent(trainingAgentId, {
      name: (draft.name || '新员工').slice(0, 8),
      description: draft.description,
      languageStyle: draft.personality,
      constraints: draft.prohibited,
      workflowNotes: draft.duties,
    });
  }, [
    draft.name,
    draft.description,
    draft.personality,
    draft.duties,
    draft.prohibited,
    formReady,
    trainingAgentId,
    updateHiredAgent,
  ]);

  const runUserTurn = async (raw: string) => {
    let text = raw.trim();
    if (!text || thinking) return;

    const wantsWritingHelp = isWritingHelpIntent(text);

    // 请教写法：只答写法，不改草案
    if (wantsWritingHelp) {
      const userMsg: ChatMsg = { id: uid('m'), kind: 'user', text, time: nowTime() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setChipSelections([]);
      setThinking(true);

      const field = detectWritingField(text, []);
      const helpText = buildWritingHelpReply(field, pendingDraft ?? draft, []);
      await runThinkAnimation([
        {
          id: 'h1',
          label: '理解你的问题',
          detail: '识别为写法请教，不改动草案',
          status: 'pending',
        },
        {
          id: 'h2',
          label: '整理写法示例',
          detail: field === 'general' ? '给出可照着写的模板' : `针对“${field}”给示例`,
          status: 'pending',
        },
      ]);

      setThinking(false);
      setThinkSteps([]);
      setMessages((prev) => [
        ...prev,
        { id: uid('m'), kind: 'ai', text: helpText, time: nowTime() },
      ]);
      return;
    }

    const userMsg: ChatMsg = { id: uid('m'), kind: 'user', text, time: nowTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setChipSelections([]);
    setThinking(true);

    const isFirst = !formReady && !pendingDraft;
    const seedSkills = platformSkills
      .filter((s) => seedSkillIds.includes(s.id))
      .map((s) => ({ id: s.id, name: s.name, description: s.description }));
    const seedKbs = platformKbs
      .filter((kb) => seedKbIds.includes(kb.id))
      .map((kb) => ({ id: kb.id, name: kb.name }));
    const nextDraft = applySeedResources(
      isFirst ? draftFromPrompt(text) : patchDraftByInstruction(pendingDraft ?? draft, text),
      isFirst ? seedSkills : [],
      isFirst ? seedKbs : [],
    );

    await runThinkAnimation(buildThinkSteps(text));

    setPendingDraft(nextDraft);
    setDraft(nextDraft);
    setFormReady(true);
    setThinking(false);
    setThinkSteps([]);

    const mountHint = [
      seedSkills.length > 0 ? `${seedSkills.length} 项技能` : '',
      seedKbs.length > 0 ? `${seedKbs.length} 个知识库` : '',
    ]
      .filter(Boolean)
      .join('、');
    const aiText = isFirst
      ? `已根据你的描述完成自主规划${mountHint ? `，并优先挂载你索引的${mountHint}` : ''}，并写入右侧配置区（含主 Agent、技能与知识库）。\n可继续在对话里改写某一条，或点上方「AI 帮写」快捷补充。`
      : `已按你的补充更新右侧员工资料与技能/知识库。`;

    setMessages((prev) => [
      ...prev,
      { id: uid('m'), kind: 'ai', text: aiText, time: nowTime() },
      ...(isFirst
        ? [{ id: uid('m'), kind: 'ai' as const, text: AI_TYPOGRAPHY_DEMO, time: nowTime() }]
        : []),
    ]);
    showToast(isFirst ? '已写入右侧配置区' : '已同步右侧配置');
  };

  const toggleChip = (chip: HelpChip) => {
    setChipSelections((prev) => {
      const exists = prev.some((c) => c.id === chip.id);
      const next = exists ? prev.filter((c) => c.id !== chip.id) : [...prev, chip];
      setInput(next.map((c) => c.send).join('\n'));
      return next;
    });
    inputRef.current?.focus();
  };

  /** 结束帮写 Builder：落员工卡后关闭；不进入培训页（培训从员工卡“员工培训”进入） */
  const finalizeCreate = () => {
    if (!formReady || !draft.name.trim()) {
      showToast('请先完成首轮规划，再完成创建');
      return;
    }

    if (trainingAgentId && trainingAgent) {
      trainingAgentIdRef.current = null;
      setTrainingAgentId(null);
      materializedRef.current = false;
      showToast(`“${trainingAgent.name}”已创建。需要培训时，从员工卡进入“员工培训”`);
      onClose();
      return;
    }

    const skillIds = draft.skills.map((sk, i) => {
      if (sk.sourceId) return sk.sourceId;
      return createSkill(sk.name, sk.desc, 'mine', {
        kind: 'tool',
        source: 'nl',
        status: 'published',
        skillCode: `skill_${Date.now()}_${i}`,
      }).id;
    });
    const kbIds = draft.knowledgeBases.map((kb) => {
      if (kb.sourceId) return kb.sourceId;
      return createKnowledgeBase(kb.name).id;
    });

    const agent = createBlankHiredAgent({
      name: draft.name.slice(0, 8),
      description: draft.description,
      jobFamily: 'customer_service',
      buildMode: 'autonomous',
      enterTraining: false,
    });

    updateHiredAgent(agent.id, {
      skills: skillIds,
      knowledgeBases: kbIds,
      languageStyle: draft.personality,
      constraints: draft.prohibited,
      workflowNotes: draft.duties,
    });

    showToast(`“${agent.name}”已创建。需要培训时，从员工卡进入“员工培训”`);
    onClose();
  };

  if (!open) return null;

  const canSend = input.trim().length > 0 && !thinking;

  return createPortal(
    <div className="fixed inset-0 z-[120] h-screen w-screen flex flex-col bg-paper overflow-hidden text-neutral-800 animate-in fade-in duration-200">
      <OnboardingWorkspaceHeader
        tabs={formReady ? ONBOARDING_WORKSPACE_TABS : INCUBATION_WORKSPACE_TABS}
        activeTabId="build"
        onTabChange={() => {}}
        onBack={onClose}
        backLabel="返回 Agent Builder"
        actions={
          <button
            type="button"
            disabled={!formReady}
            onClick={finalizeCreate}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-xs font-semibold text-white shrink-0',
              'cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed',
              NAV_ACTIVE_GRADIENT_BG,
            )}
          >
            <Check size={14} strokeWidth={2.5} />
            {LIFECYCLE_TERMS.completeTraining}
          </button>
        }
      />

      <ResizableSplitPane
        storageKey="js_incubation_split_nl_left_v2"
        defaultLeftPx={538}
        defaultRatio={0.33}
        minLeftPx={320}
        minRightPx={480}
        className="bg-paper"
        left={
          <section className="flex flex-col min-h-0 h-full bg-[#F9F9FB] select-text">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-[720px] mx-auto px-4 pt-5 pb-4 space-y-3">
              {messages.length === 0 && !thinking ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900">孵化 AI 助手</p>
                      <p className="text-[11px] text-neutral-500">先说清岗位职责与服务场景</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-neutral-700">
                    你好！我会像创建技能一样，用对话帮你规划数字员工的主 Prompt、技能边界与知识库。规划完成后会直接写入右侧员工培训页，可继续配置、能力测试与保存培训存档。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '帮我创建一个“食安险理赔专员”数字员工',
                      '打造电商智能客服，处理退换货与物流查单',
                      '打造 IT 技术支持与故障自动派单助手',
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={CHIP}
                        onClick={() => void runUserTurn(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((m) => {
                if (m.kind === 'user') {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[88%] flex flex-col items-end gap-1">
                        <div className={USER_BUBBLE}>{m.text}</div>
                        <span className="text-[10px] text-neutral-400">{m.time}</span>
                      </div>
                    </div>
                  );
                }
                if (m.kind === 'ai') {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <div className="max-w-[92%] flex flex-col gap-1">
                        <div className={AI_BUBBLE}>
                          {renderAiRichContent(m.text)}
                        </div>
                        <span className="text-[10px] text-neutral-400">{m.time}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {thinking && thinkSteps.length > 0 ? (
                <SkillThinkingCard
                  title="正在规划数字员工"
                  steps={thinkSteps}
                  isComplete={false}
                  generating
                  className="!ml-0 mr-0"
                />
              ) : null}
            </div>
          </div>

          <div className="w-full max-w-[720px] mx-auto px-3 pb-3 pt-1 shrink-0">
            {formReady && !thinking ? (
              <div className="pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-neutral-400 shrink-0 pr-0.5">AI 帮写</span>
                {HELP_CHIPS.map((chip) => {
                  const selected = chipSelections.some((c) => c.id === chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={selected ? CHIP_ACTIVE : CHIP}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="skill-ai-composer skill-ai-composer--dock p-3">
              <textarea
                ref={inputRef}
                rows={3}
                maxLength={1000}
                value={input}
                disabled={thinking}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void runUserTurn(input);
                  }
                }}
                placeholder={
                  formReady
                    ? '继续补充规则，或点上方“AI 帮写”快捷填充…'
                    : '请描述数字员工的岗位职责与服务场景…'
                }
                className="w-full min-h-[72px] max-h-36 bg-transparent text-[14px] leading-[21px] outline-none resize-none text-neutral-800 placeholder:text-neutral-400"
              />

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded-[7px] border border-neutral-200 bg-white text-neutral-600 flex items-center justify-center cursor-pointer"
                  title="附件"
                >
                  <Plus size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {input.length}/1000
                  </span>
                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={() => void runUserTurn(input)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    title="发送"
                  >
                    {thinking ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </section>
        }
        right={
          <IncubationTrainingPane
            agent={trainingAgent}
            knowledgeBases={platformKbs}
            skills={platformSkills}
            updateHiredAgent={updateHiredAgent}
            showToast={showToast}
          />
        }
      />
    </div>,
    document.body,
  );
}
