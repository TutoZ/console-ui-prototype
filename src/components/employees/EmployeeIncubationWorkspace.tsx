/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 数字员工智能孵化 — 左对话澄清→确认后写入草案，右侧复用员工培训页
 *（入职培训配置 + 能力测试 / 培训存档；交互对齐技能创建 BuildSkillModal）
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  CheckCircle2,
  Clock,
  Copy,
  Pencil,
  Plus,
  Sparkles,
  Square,
} from '@/lib/icons';
import {
  CHIP,
  NAV_ACTIVE_GRADIENT_BG,
  SKILL_AOP_SEND_BTN,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import { AGENT_AVATAR_PRESETS } from '@/lib/agentAvatarDisplay';
import { defaultOpeningLineForAgent, defaultFallbackScriptForAgent } from '@/lib/agentDefaultCopy';
import { EMPLOYEE_CREATE_CHAT, LIFECYCLE_TERMS } from '@/lib/platformTerminology';
import { PROFILE_USER } from '@/lib/profileUser';
import { splitChatContentWithAttachments } from '@/lib/chatAttachments';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import {
  buildEmployeeClarifyQuestions,
  buildEmployeeConfirmItems,
  EMPLOYEE_REPLY_CHIPS,
  formatClarifyAnswers,
} from '@/lib/employeeCreateChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatAttachmentCards } from '../common/ChatAttachmentCards';
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
import { SkillThinkingCard, estimateThinkStreamMs } from '../skills/SkillThinkingCard';
import { SkillClarifyCard, type SkillClarifyPayload } from '../skills/SkillClarifyCard';
import {
  SkillRoundConfirmCard,
  type SkillConfirmItem,
} from '../skills/SkillRoundConfirmCard';

export type IncubationDraft = {
  name: string;
  personality: string;
  description: string;
  duties: string;
  prohibited: string;
  skills: Array<{ id: string; name: string; desc: string; sourceId?: string }>;
  knowledgeBases: Array<{ id: string; name: string; desc: string; sourceId?: string }>;
};

type ChatMsg =
  | { id: string; kind: 'user' | 'ai' | 'system_status'; text: string; time: string }
  | {
      id: string;
      kind: 'think';
      steps: SkillThinkStep[];
      durationSec: number;
      time: string;
    }
  | { id: string; kind: 'clarify'; payload: SkillClarifyPayload; time: string }
  | {
      id: string;
      kind: 'confirm';
      items: SkillConfirmItem[];
      confirmed?: boolean;
      locked?: boolean;
      title?: string;
      time: string;
    };

const USER_BUBBLE = cn(
  'px-3 py-3 text-[14px] leading-[22px] whitespace-pre-line text-[#181D27] rounded-[20px_4px_20px_20px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);

/** AI 气泡 — 对齐技能创建 / dongDesign-AI regular-14 */
const AI_BUBBLE =
  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[22px] whitespace-pre-line bg-neutral-100 text-[#595959]';

/** 系统引导气泡 — jd-color-text-200 */
const SYSTEM_STATUS_BUBBLE =
  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[22px] whitespace-pre-line bg-neutral-100 text-[#8c8c8c]';

/** 将「」等书名号片段按规范强调（Semibold #1c1d1f） */
function renderAiBubbleContent(content: string) {
  const parts = content.split(/([「『“][^」』”]*[」』”])/);
  if (parts.length <= 1) return content;
  return parts.map((part, i) =>
    /^[「『“].*[」』”]$/.test(part) ? (
      <span key={i} className="font-semibold text-[#1c1d1f]">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

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

/** 首轮澄清前 — 先问清再写规格 */
function buildClarifyThinkSteps(prompt: string): SkillThinkStep[] {
  const snippet = prompt.trim().replace(/\s+/g, ' ').slice(0, 64) || '岗位职责描述';
  return [
    {
      id: 'goal',
      label: '先总结要服务的场景',
      detail: `${snippet}。把岗位职责、服务边界与产出先在脑中对齐。`,
      status: 'pending',
      children: [
        { id: 'goal-read', label: '已读取岗位目标表述', kind: 'read' },
        { id: 'goal-run', label: '已对齐 `数字员工创建` 边界', kind: 'run' },
      ],
    },
    {
      id: 'spec',
      label: '再看写入员工规格前还缺什么',
      detail: '服务场景、沟通风格与边界策略往往还不够清楚，需要先问清。',
      status: 'pending',
      children: [
        { id: 'spec-run', label: '已扫描 `场景/风格/边界` 缺口', kind: 'run' },
        { id: 'spec-read', label: '已对照同类数字员工澄清范式', kind: 'read' },
      ],
    },
    {
      id: 'ask',
      label: '思路收束',
      detail: '先用少量澄清问题补关键缺口，再生成可点选卡片，避免一上来写死规格。',
      status: 'pending',
      children: [
        { id: 'ask-run', label: '已整理待澄清关键问题', kind: 'run' },
        { id: 'ask-note', label: '准备生成可点选澄清卡片', kind: 'note' },
      ],
    },
  ];
}

/** 澄清后 / 后续改写 — 生成确认要点 */
function buildWriteThinkSteps(prompt: string): SkillThinkStep[] {
  const snippet = prompt.trim().replace(/\s+/g, ' ').slice(0, 64) || '岗位职责描述';
  return [
    {
      id: 'goal',
      label: '先总结本轮要落成的员工规格',
      detail: `${snippet}。把名称、性格、职责与红线对齐。`,
      status: 'pending',
      children: [
        { id: 'goal-read', label: '已读取岗位目标与补充信息', kind: 'read' },
        { id: 'goal-run', label: '已对齐 `数字员工创建` 边界', kind: 'run' },
      ],
    },
    {
      id: 'spec',
      label: '再看写入员工规格前还缺什么',
      detail: '名称 / 性格 / 职责 / 红线，以及技能与知识库挂载往往还需要补齐。',
      status: 'pending',
      children: [
        { id: 'spec-run', label: '已扫描 `Prompt/技能/知识库` 缺口', kind: 'run' },
        { id: 'spec-read', label: '已对照同类数字员工范式', kind: 'read' },
      ],
    },
    {
      id: 'write',
      label: '思路收束',
      detail: '先给出可确认的草案要点，确认后再写入右侧员工培训配置。',
      status: 'pending',
      children: [
        { id: 'write-run', label: '已生成员工资料草案要点', kind: 'run' },
        { id: 'write-note', label: '准备输出确认要点', kind: 'note' },
      ],
    },
  ];
}

function applyConfirmItemsToDraft(
  base: IncubationDraft,
  items: SkillConfirmItem[],
): IncubationDraft {
  const next: IncubationDraft = {
    ...base,
    skills: [...base.skills],
    knowledgeBases: [...base.knowledgeBases],
  };
  for (const item of items) {
    if (!item.checked) continue;
    const val = (item.value ?? '').trim();
    if (!val) continue;
    switch (item.id) {
      case 'name':
        next.name = val.slice(0, 12);
        break;
      case 'description':
        next.description = val.slice(0, 500);
        break;
      case 'personality':
        next.personality = val.slice(0, 120);
        break;
      case 'duties':
        next.duties = val.slice(0, 1000);
        break;
      case 'prohibited':
        next.prohibited = val.slice(0, 1000);
        break;
      default:
        break;
    }
  }
  return next;
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
      storageKey="js_incubation_training_split_v3"
      defaultRatio={0.5}
      minLeftPx={260}
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
                  className="[&_button]:px-2 [&_button]:text-[12px]"
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
              <div className="px-3 py-2.5 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 gap-1.5 min-h-[54px] min-w-0 overflow-hidden">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <SegmentedTabBar
                    ariaLabel="预览面板"
                    className="[&_button]:px-2 [&_button]:text-[12px]"
                    value={rightTab}
                    onChange={(id) => setRightTab(id as 'chat' | 'versions')}
                    items={[
                      { id: 'chat', label: LIFECYCLE_TERMS.onboardTest },
                      { id: 'versions', label: LIFECYCLE_TERMS.examVersion },
                    ]}
                  />
                </div>
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
  /** 数字员工创作入口已索引的平台技能 id */
  seedSkillIds?: string[];
  /** 数字员工创作入口已索引的知识库 id */
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
  const [thinkBootLoading, setThinkBootLoading] = useState(false);
  const [thinkGenerating, setThinkGenerating] = useState(false);
  const [consumedChipIds, setConsumedChipIds] = useState<string[]>([]);
  const [editingUserMsgId, setEditingUserMsgId] = useState<string | null>(null);
  const [editingUserMsgDraft, setEditingUserMsgDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const materializedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userBubbleEditRef = useRef<HTMLTextAreaElement>(null);
  const thinkStartedAtRef = useRef<number | null>(null);
  const thinkAbortRef = useRef(false);
  const thinkTimersRef = useRef<number[]>([]);
  const pendingGoalRef = useRef<string | null>(null);
  const pendingDraftRef = useRef<IncubationDraft | null>(null);
  const draftRef = useRef<IncubationDraft>(emptyDraft());
  const formReadyRef = useRef(false);

  const trainingAgent = useMemo(
    () => (trainingAgentId ? hiredAgents.find((a) => a.id === trainingAgentId) ?? null : null),
    [hiredAgents, trainingAgentId],
  );

  const trainingAgentIdRef = useRef<string | null>(null);
  trainingAgentIdRef.current = trainingAgentId;
  pendingDraftRef.current = pendingDraft;
  draftRef.current = draft;
  formReadyRef.current = formReady;

  const hasPendingClarify = useMemo(
    () =>
      messages.some(
        (m) => m.kind === 'clarify' && !m.payload.submitted && !m.payload.skipped,
      ),
    [messages],
  );

  const visibleReplyChips = useMemo(
    () => EMPLOYEE_REPLY_CHIPS.filter((chip) => !consumedChipIds.includes(chip.id)),
    [consumedChipIds],
  );

  const clearThinkTimers = useCallback(() => {
    thinkTimersRef.current.forEach((id) => window.clearTimeout(id));
    thinkTimersRef.current = [];
  }, []);

  const delay = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, ms);
      thinkTimersRef.current.push(id);
    });
  }, []);

  const resetSession = useCallback(() => {
    thinkAbortRef.current = true;
    clearThinkTimers();
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
    setThinkBootLoading(false);
    setThinkGenerating(false);
    setConsumedChipIds([]);
    setEditingUserMsgId(null);
    setEditingUserMsgDraft('');
    seededRef.current = false;
    thinkStartedAtRef.current = null;
    pendingGoalRef.current = null;
    thinkAbortRef.current = false;
  }, [clearThinkTimers, deleteHiredAgent]);

  const stopThinking = useCallback(() => {
    thinkAbortRef.current = true;
    clearThinkTimers();
    setThinking(false);
    setThinkSteps([]);
    setThinkBootLoading(false);
    setThinkGenerating(false);
    thinkStartedAtRef.current = null;
    showToast('已手动停止 AI 思考');
  }, [clearThinkTimers, showToast]);

  /** 与技能创建统一：加载扫光 → 正文流式 + Cot 扫光 → 归档到对话；可中止 */
  const playThink = async (steps: SkillThinkStep[]): Promise<boolean> => {
    thinkAbortRef.current = false;
    clearThinkTimers();
    setThinking(true);
    setThinkBootLoading(true);
    setThinkGenerating(false);
    setThinkSteps(steps.map((s) => ({ ...s, status: 'pending' })));
    thinkStartedAtRef.current = Date.now();
    await delay(1400);
    if (thinkAbortRef.current) {
      setThinkSteps([]);
      setThinking(false);
      setThinkBootLoading(false);
      setThinkGenerating(false);
      thinkStartedAtRef.current = null;
      return false;
    }
    setThinkBootLoading(false);
    setThinkGenerating(true);
    setThinkSteps(steps.map((s) => ({ ...s, status: 'done' })));
    await delay(estimateThinkStreamMs(steps));
    if (thinkAbortRef.current) {
      setThinkSteps([]);
      setThinking(false);
      setThinkBootLoading(false);
      setThinkGenerating(false);
      thinkStartedAtRef.current = null;
      return false;
    }
    setThinkGenerating(false);
    const startedAt = thinkStartedAtRef.current;
    const durationSec =
      startedAt != null ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 1;
    setMessages((prev) => [
      ...prev,
      {
        id: uid('m'),
        kind: 'think',
        steps: steps.map((s) => ({ ...s, status: 'done' as const })),
        durationSec,
        time: nowTime(),
      },
    ]);
    setThinkSteps([]);
    setThinking(false);
    thinkStartedAtRef.current = null;
    return true;
  };

  const resolveSeedResources = useCallback(() => {
    const seedSkills = platformSkills
      .filter((s) => seedSkillIds.includes(s.id))
      .map((s) => ({ id: s.id, name: s.name, description: s.description }));
    const seedKbs = platformKbs
      .filter((kb) => seedKbIds.includes(kb.id))
      .map((kb) => ({ id: kb.id, name: kb.name }));
    return { seedSkills, seedKbs };
  }, [platformSkills, platformKbs, seedSkillIds, seedKbIds]);

  const pushConfirmRound = useCallback(
    (nextDraft: IncubationDraft, aiText: string) => {
      setPendingDraft(nextDraft);
      setMessages((prev) => {
        const locked = prev.map((m) =>
          m.kind === 'confirm' && !m.confirmed ? { ...m, locked: true } : m,
        );
        return [
          ...locked,
          { id: uid('m'), kind: 'ai', text: aiText, time: nowTime() },
          {
            id: uid('m'),
            kind: 'system_status',
            text: EMPLOYEE_CREATE_CHAT.confirmWriteHint,
            time: nowTime(),
          },
          {
            id: uid('m'),
            kind: 'confirm',
            items: buildEmployeeConfirmItems(nextDraft),
            title: EMPLOYEE_CREATE_CHAT.confirmCardTitle,
            time: nowTime(),
          },
        ];
      });
    },
    [],
  );

  const startFirstTurnClarify = useCallback(
    async (userText: string, opts?: { alreadyPushedUser?: boolean }) => {
      if (!opts?.alreadyPushedUser) {
        setMessages((prev) => [
          ...prev,
          { id: uid('m'), kind: 'user', text: userText, time: nowTime() },
        ]);
      }
      pendingGoalRef.current = userText;
      const ok = await playThink(buildClarifyThinkSteps(userText));
      if (!ok) return;
      const questions = buildEmployeeClarifyQuestions(userText);
      setMessages((prev) => [
        ...prev,
        {
          id: uid('m'),
          kind: 'ai',
          text: EMPLOYEE_CREATE_CHAT.clarifyLead,
          time: nowTime(),
        },
        {
          id: uid('m'),
          kind: 'clarify',
          payload: { questions },
          time: nowTime(),
        },
      ]);
    },
    // playThink closes over latest delay/timers; intentional for session
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const continueAfterClarify = useCallback(
    async (payload: SkillClarifyPayload) => {
      const goalText = pendingGoalRef.current;
      if (!goalText) return;
      pendingGoalRef.current = null;
      const clarifyNote = payload.skipped
        ? undefined
        : formatClarifyAnswers(payload.questions);

      const ok = await playThink(buildWriteThinkSteps(goalText));
      if (!ok) return;

      const enriched = clarifyNote
        ? `${goalText.trim()}\n\n【补充信息】\n${clarifyNote}`
        : goalText.trim();
      const { seedSkills, seedKbs } = resolveSeedResources();
      let nextDraft = applySeedResources(
        draftFromPrompt(enriched),
        seedSkills,
        seedKbs,
      );
      if (clarifyNote) {
        nextDraft = {
          ...nextDraft,
          description: `${nextDraft.description}\n\n【补充信息】\n${clarifyNote}`.slice(
            0,
            500,
          ),
        };
      }

      pushConfirmRound(
        nextDraft,
        clarifyNote
          ? EMPLOYEE_CREATE_CHAT.clarifyReceived
          : EMPLOYEE_CREATE_CHAT.clarifySkippedAck,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pushConfirmRound, resolveSeedResources],
  );

  const handleConfirmItems = useCallback(
    (msgId: string, items: SkillConfirmItem[]) => {
      const base = pendingDraftRef.current ?? draftRef.current;
      const next = applyConfirmItemsToDraft(base, items);
      setDraft(next);
      setPendingDraft(next);
      setFormReady(true);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.kind !== 'confirm') return m;
          if (m.id === msgId) return { ...m, items, confirmed: true };
          if (!m.confirmed) return { ...m, locked: true };
          return m;
        }),
      );
      showToast('已写入右侧配置区');
    },
    [showToast],
  );

  useEffect(() => {
    if (!open) {
      resetSession();
      return;
    }
    resetSession();
    if (seedPrompt.trim()) {
      seededRef.current = true;
      const text = seedPrompt.trim();
      setMessages([{ id: uid('m'), kind: 'user', text, time: nowTime() }]);
      void startFirstTurnClarify(text, { alreadyPushedUser: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedPrompt, seedSkillIds.join('|'), seedKbIds.join('|')]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, thinkSteps, thinkBootLoading, thinkGenerating]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, 44), 160);
    el.style.height = `${next}px`;
  }, [input, formReady, consumedChipIds.length, hasPendingClarify]);

  /** 确认写入后物化真实员工，右侧直接复用培训配置 + 预览调试 */
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
    const text = raw.trim();
    if (!text || thinking || hasPendingClarify) return;

    setMessages((prev) => [
      ...prev,
      { id: uid('m'), kind: 'user', text, time: nowTime() },
    ]);
    setInput('');
    setConsumedChipIds([]);

    const isFirst = !formReadyRef.current && !pendingDraftRef.current;

    // 首轮：只走澄清，不写草案
    if (isFirst) {
      pendingGoalRef.current = text;
      const ok = await playThink(buildClarifyThinkSteps(text));
      if (!ok) return;
      const questions = buildEmployeeClarifyQuestions(text);
      setMessages((prev) => [
        ...prev,
        {
          id: uid('m'),
          kind: 'ai',
          text: EMPLOYEE_CREATE_CHAT.clarifyLead,
          time: nowTime(),
        },
        {
          id: uid('m'),
          kind: 'clarify',
          payload: { questions },
          time: nowTime(),
        },
      ]);
      return;
    }

    // 请教写法：只答写法，不改草案（需已有草案上下文）
    if (isWritingHelpIntent(text)) {
      const field = detectWritingField(text, []);
      const helpText = buildWritingHelpReply(
        field,
        pendingDraftRef.current ?? draftRef.current,
        [],
      );
      const ok = await playThink([
        {
          id: 'h1',
          label: '理解你的问题',
          detail: '识别为写法请教，不改动草案。',
          status: 'pending',
          children: [
            { id: 'h1-read', label: '已读取写法请教', kind: 'read' },
            { id: 'h1-run', label: '已锁定「不改草案」边界', kind: 'run' },
          ],
        },
        {
          id: 'h2',
          label: '整理写法示例',
          detail:
            field === 'general'
              ? '给出可照着写的模板。'
              : '针对当前字段给出可照着写的示例。',
          status: 'pending',
          children: [
            { id: 'h2-run', label: '已整理写法示例', kind: 'run' },
            { id: 'h2-note', label: '准备输出回复', kind: 'note' },
          ],
        },
      ]);
      if (!ok) return;
      setMessages((prev) => [
        ...prev,
        { id: uid('m'), kind: 'ai', text: helpText, time: nowTime() },
      ]);
      return;
    }

    // 后续轮次 / 待确认时的补充：生成新确认卡，确认前不写入右侧
    const ok = await playThink(buildWriteThinkSteps(text));
    if (!ok) return;
    const nextDraft = patchDraftByInstruction(
      pendingDraftRef.current ?? draftRef.current,
      text,
    );
    pushConfirmRound(
      nextDraft,
      formReadyRef.current
        ? '已按你的补充更新草案要点，请确认后写入右侧。'
        : '已根据补充更新草案要点，请确认后写入右侧培训配置。',
    );
  };

  const applyReplyChip = (chip: (typeof EMPLOYEE_REPLY_CHIPS)[number]) => {
    setInput((prev) => {
      const next = prev.trim() ? `${prev.trim()}\n${chip.send}` : chip.send;
      return next.slice(0, 1000);
    });
    setConsumedChipIds((prev) => (prev.includes(chip.id) ? prev : [...prev, chip.id]));
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  };

  /** 结束帮写 Builder：落员工卡后关闭；不进入培训页（培训从员工卡“员工培训”进入） */
  const finalizeCreate = () => {
    if (!formReady || !draft.name.trim()) {
      showToast('请先确认草案并写入右侧配置，再完成创建');
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

  const canSend =
    input.trim().length > 0 && !thinking && !hasPendingClarify;

  return createPortal(
    <div className="fixed inset-0 z-[120] h-screen w-screen flex flex-col bg-paper overflow-hidden text-neutral-800 animate-in fade-in duration-200">
      <OnboardingWorkspaceHeader
        tabs={formReady ? ONBOARDING_WORKSPACE_TABS : INCUBATION_WORKSPACE_TABS}
        activeTabId="build"
        onTabChange={() => {}}
        onBack={onClose}
        backLabel="返回数字员工创作"
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
            <CheckCircle2 size={13} />
            {LIFECYCLE_TERMS.completeTraining}
          </button>
        }
      />

      <ResizableSplitPane
        storageKey="js_incubation_split_nl_left_v3"
        defaultRatio={1 / 3}
        minLeftPx={280}
        minRightPx={520}
        className="bg-paper"
        left={
          <section className="flex flex-col min-h-0 h-full bg-[#F9F9FB] select-text">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-thin">
            <div className="w-full max-w-[720px] mx-auto px-4 pt-5 pb-4 space-y-3">
              {messages.length === 0 && !thinking ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900">
                        {EMPLOYEE_CREATE_CHAT.assistantName}
                      </p>
                      <p className="text-[11px] text-neutral-500">先说清岗位职责与服务场景</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-neutral-700">
                    你好！我会像创建技能一样，先补充关键信息，再请你确认草案要点，确认后写入右侧员工培训页。
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

              {messages.map((m, msgIndex) => {
                if (m.kind === 'user') {
                  const { text, attachments } = splitChatContentWithAttachments(m.text);
                  const isEditingBubble = editingUserMsgId === m.id;
                  return (
                    <div key={m.id} className="flex justify-end group/user-msg">
                      <div
                        className={cn(
                          'flex flex-col items-end gap-2 min-w-0',
                          isEditingBubble ? 'w-2/3 max-w-[480px]' : 'max-w-[88%]',
                        )}
                      >
                        <div className="flex items-center gap-1.5 pr-0.5">
                          <Avatar className="h-5 w-5 rounded-full overflow-hidden after:hidden shrink-0">
                            <AvatarFallback
                              className={cn(PROFILE_USER.fallbackClass, 'text-[10px] select-none')}
                            >
                              {PROFILE_USER.initial}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] leading-4 text-neutral-800">
                            {PROFILE_USER.name}
                          </span>
                        </div>
                        <div className={cn('relative max-w-full', isEditingBubble && 'w-full')}>
                          {!isEditingBubble ? (
                            <div
                              className={cn(
                                'absolute -top-7 right-0 z-10 flex items-center gap-0.5 rounded-md border border-neutral-200/80 bg-white/95 px-1 py-0.5',
                                'shadow-[0_2px_8px_rgba(31,35,41,0.06)]',
                                'opacity-0 pointer-events-none group-hover/user-msg:opacity-100 group-hover/user-msg:pointer-events-auto',
                                'transition-opacity duration-150',
                              )}
                            >
                              <span className="inline-flex items-center gap-0.5 px-1 text-[10px] tabular-nums text-neutral-400">
                                <Clock size={10} className="shrink-0 opacity-70" />
                                {m.time || '--:--'}
                              </span>
                              <span className="w-px h-3 bg-neutral-200/80 shrink-0" aria-hidden />
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(m.text).then(
                                    () => showToast('已复制到剪贴板'),
                                    () => showToast('复制失败，请手动选择文本'),
                                  );
                                }}
                                className="w-6 h-6 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition"
                                title="复制"
                                aria-label="复制消息"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={thinking || hasPendingClarify || editingUserMsgId !== null}
                                onClick={() => {
                                  setEditingUserMsgId(m.id);
                                  setEditingUserMsgDraft(m.text.slice(0, 1000));
                                  requestAnimationFrame(() => {
                                    const el = userBubbleEditRef.current;
                                    if (!el) return;
                                    el.focus();
                                    el.setSelectionRange(el.value.length, el.value.length);
                                  });
                                }}
                                className="w-6 h-6 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                                title="编辑"
                                aria-label="编辑消息"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          ) : null}
                          {isEditingBubble ? (
                            <div className="skill-ai-composer relative w-full overflow-hidden">
                              <textarea
                                ref={userBubbleEditRef}
                                rows={4}
                                maxLength={1000}
                                value={editingUserMsgDraft}
                                onChange={(e) => setEditingUserMsgDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingUserMsgId(null);
                                    setEditingUserMsgDraft('');
                                    return;
                                  }
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const next = editingUserMsgDraft.trim().slice(0, 1000);
                                    if (!next) return;
                                    setMessages((prev) =>
                                      prev.map((row) =>
                                        row.id === m.id && row.kind === 'user'
                                          ? { ...row, text: next }
                                          : row,
                                      ),
                                    );
                                    setEditingUserMsgId(null);
                                    setEditingUserMsgDraft('');
                                    showToast('消息已更新');
                                  }
                                }}
                                className="w-full min-h-[88px] max-h-48 bg-transparent px-3 pt-3 pb-12 text-[14px] leading-[22px] text-[#181D27] outline-none resize-none placeholder:text-neutral-400"
                                placeholder="编辑消息内容…"
                                aria-label="编辑消息内容"
                              />
                              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUserMsgId(null);
                                    setEditingUserMsgDraft('');
                                  }}
                                  className="h-7 px-3 rounded-md text-[13px] border border-neutral-200 bg-white text-neutral-700 cursor-pointer"
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  disabled={!editingUserMsgDraft.trim()}
                                  onClick={() => {
                                    const next = editingUserMsgDraft.trim().slice(0, 1000);
                                    if (!next) return;
                                    setMessages((prev) =>
                                      prev.map((row) =>
                                        row.id === m.id && row.kind === 'user'
                                          ? { ...row, text: next }
                                          : row,
                                      ),
                                    );
                                    setEditingUserMsgId(null);
                                    setEditingUserMsgDraft('');
                                    showToast('消息已更新');
                                  }}
                                  className="h-7 px-3 rounded-md text-[13px] bg-neutral-900 text-white cursor-pointer disabled:opacity-40"
                                >
                                  发送
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5 w-full">
                              <ChatAttachmentCards attachments={attachments} align="end" />
                              {text ? <div className={USER_BUBBLE}>{text}</div> : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (m.kind === 'ai') {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <div className={AI_BUBBLE}>{renderAiBubbleContent(m.text)}</div>
                    </div>
                  );
                }
                if (m.kind === 'system_status') {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <div className={SYSTEM_STATUS_BUBBLE}>
                        {renderAiBubbleContent(m.text)}
                      </div>
                    </div>
                  );
                }
                if (m.kind === 'think') {
                  return (
                    <SkillThinkingCard
                      key={m.id}
                      title={EMPLOYEE_CREATE_CHAT.thinkDone}
                      steps={m.steps}
                      durationSec={m.durationSec}
                      isComplete
                      className="!ml-0 mr-0"
                    />
                  );
                }
                if (m.kind === 'clarify') {
                  return (
                    <div key={m.id} className="w-full animate-in fade-in duration-200">
                      <SkillClarifyCard
                        payload={m.payload}
                        onChange={(next) => {
                          setMessages((prev) =>
                            prev.map((row) =>
                              row.id === m.id && row.kind === 'clarify'
                                ? { ...row, payload: next }
                                : row,
                            ),
                          );
                        }}
                        onSubmit={(next) => {
                          setMessages((prev) =>
                            prev.map((row) =>
                              row.id === m.id && row.kind === 'clarify'
                                ? { ...row, payload: next }
                                : row,
                            ),
                          );
                          void continueAfterClarify(next);
                        }}
                        onSkip={() => {
                          const skippedPayload: SkillClarifyPayload = {
                            ...m.payload,
                            skipped: true,
                            submitted: false,
                            collapsed: true,
                          };
                          setMessages((prev) =>
                            prev.map((row) =>
                              row.id === m.id && row.kind === 'clarify'
                                ? { ...row, payload: skippedPayload }
                                : row,
                            ),
                          );
                          void continueAfterClarify(skippedPayload);
                        }}
                      />
                    </div>
                  );
                }
                if (m.kind === 'confirm') {
                  const hasNewerConfirm = messages
                    .slice(msgIndex + 1)
                    .some((row) => row.kind === 'confirm');
                  const locked =
                    !m.confirmed && (Boolean(m.locked) || hasNewerConfirm);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'w-full animate-in fade-in duration-200',
                        locked && 'opacity-90',
                      )}
                    >
                      <SkillRoundConfirmCard
                        title={m.title || EMPLOYEE_CREATE_CHAT.confirmCardTitle}
                        items={m.items}
                        confirmed={Boolean(m.confirmed)}
                        locked={locked}
                        onConfirm={(items) => handleConfirmItems(m.id, items)}
                        onItemsChange={(items) => {
                          setMessages((prev) =>
                            prev.map((row) =>
                              row.id === m.id && row.kind === 'confirm'
                                ? { ...row, items }
                                : row,
                            ),
                          );
                          if (!m.confirmed && !locked) {
                            const next = applyConfirmItemsToDraft(
                              pendingDraftRef.current ?? draftRef.current,
                              items,
                            );
                            setPendingDraft(next);
                          }
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })}

              {thinking && thinkSteps.length > 0 ? (
                <SkillThinkingCard
                  title={EMPLOYEE_CREATE_CHAT.thinkInProgress}
                  steps={thinkSteps}
                  isComplete={!thinkBootLoading && !thinkGenerating && thinkSteps.length > 0}
                  loading={thinkBootLoading}
                  generating={!thinkBootLoading && thinkGenerating}
                  className="!ml-0 mr-0"
                />
              ) : null}
            </div>
          </div>

          <div className="w-full max-w-[720px] mx-auto px-3 pb-3 pt-1 shrink-0">
            {formReady && !thinking && !hasPendingClarify && visibleReplyChips.length > 0 ? (
              <div className="pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {visibleReplyChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => applyReplyChip(chip)}
                    className={CHIP}
                    title="点选后填入输入框，可再编辑后发送"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="skill-ai-composer skill-ai-composer--dock p-3">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={1000}
                value={input}
                disabled={thinking || hasPendingClarify}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) void runUserTurn(input);
                  }
                }}
                placeholder={
                  hasPendingClarify
                    ? `请先在上方「${EMPLOYEE_CREATE_CHAT.clarifyTitle}」卡片中提交或跳过…`
                    : formReady
                      ? '继续补充规则，或点上方快捷条填充…'
                      : '请描述数字员工的岗位职责与服务场景…'
                }
                className="w-full min-h-[44px] max-h-40 overflow-y-auto bg-transparent text-[14px] leading-[22px] pb-2 outline-none resize-none placeholder:text-[#B0B2B8] text-[#1C1D1F] disabled:opacity-60"
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
                  {thinking ? (
                    <button
                      type="button"
                      onClick={stopThinking}
                      className="w-8 h-8 rounded-full bg-[#ECECF2] hover:bg-[#E9EAEB] text-[#717680] border border-[#E9EAEB] flex items-center justify-center cursor-pointer shrink-0"
                      title="停止"
                    >
                      <Square size={12} className="fill-[#717680]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canSend}
                      onClick={() => void runUserTurn(input)}
                      className={SKILL_AOP_SEND_BTN}
                      title="发送"
                    >
                      <ArrowUp size={16} />
                    </button>
                  )}
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
