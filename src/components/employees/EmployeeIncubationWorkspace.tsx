/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 数字员工智能孵化 — 对齐技能创建 CUI：
 * 全屏左右分栏 · 左侧自然语言对话 · 右侧复用员工培训配置 + 预览调试对话
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  Check,
  Loader2,
  Plus,
  Sparkles,
  X,
} from '@/lib/icons';
import {
  CHIP,
  CHIP_ACTIVE,
  NAV_ACTIVE_GRADIENT_BG,
  SKILL_AOP_GRADIENT_TEXT,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import { useApp } from '../../context/AppContext';
import type { HiredAgent, KnowledgeBase, Skill } from '../../types';
import { ResizableSplitPane } from '../common/ResizableSplitPane';
import { OnboardingWorkspaceHeader } from '../onboarding/OnboardingWorkspaceHeader';
import { OnboardingConfigPanel } from '../onboarding/OnboardingConfigPanel';
import { OnboardingCapabilityTestPanel } from '../onboarding/OnboardingCapabilityTestPanel';
import {
  SkillRoundConfirmCard,
  type SkillConfirmItem,
} from '../skills/SkillRoundConfirmCard';
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

type ConfirmMsg = {
  id: string;
  kind: 'confirm';
  title: string;
  items: SkillConfirmItem[];
  confirmed: boolean;
  time: string;
};

type ChatMsg =
  | { id: string; kind: 'user' | 'ai'; text: string; time: string }
  | ConfirmMsg;

type HelpChip = { id: string; label: string; send: string };

const USER_BUBBLE = cn(
  'px-3 py-3 text-[14px] leading-[22px] whitespace-pre-line text-[#181D27] rounded-[20px_4px_20px_20px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);

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
    prompt.match(/「(.+?)」/)?.[1]
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

function draftToConfirmItems(draft: IncubationDraft): SkillConfirmItem[] {
  return [
    {
      id: 'name',
      label: `员工名称：${draft.name}`,
      checked: true,
      fieldLabel: '员工名称',
      value: draft.name,
    },
    {
      id: 'personality',
      label: `员工性格：${draft.personality}`,
      checked: true,
      fieldLabel: '员工性格',
      value: draft.personality,
    },
    {
      id: 'description',
      label: `员工描述：${draft.description}`,
      checked: true,
      fieldLabel: '员工描述',
      value: draft.description,
    },
    {
      id: 'duties',
      label: `工作职责：${draft.duties.replace(/\n/g, '；')}`,
      checked: true,
      fieldLabel: '工作职责',
      value: draft.duties,
    },
    {
      id: 'prohibited',
      label: `禁止行为：${draft.prohibited.replace(/\n/g, '；')}`,
      checked: true,
      fieldLabel: '禁止行为',
      value: draft.prohibited,
    },
    ...draft.skills.map((sk, i) => ({
      id: `skill_${sk.id}`,
      label: `技能${i + 1}：${sk.name}`,
      checked: true,
      fieldLabel: `技能 · ${sk.name}`,
      value: sk.desc,
    })),
    ...draft.knowledgeBases.map((kb, i) => ({
      id: `kb_${kb.id}`,
      label: `知识库${i + 1}：${kb.name}`,
      checked: true,
      fieldLabel: `知识库 · ${kb.name}`,
      value: kb.desc,
    })),
  ];
}

function applyConfirmItems(base: IncubationDraft, items: SkillConfirmItem[]): IncubationDraft {
  const next = { ...base, skills: [...base.skills], knowledgeBases: [...base.knowledgeBases] };
  for (const item of items) {
    if (!item.checked) continue;
    const v = (item.value ?? '').trim();
    if (item.id === 'name' && v) next.name = v.slice(0, 12);
    else if (item.id === 'personality' && v) next.personality = v.slice(0, 80);
    else if (item.id === 'description' && v) next.description = v.slice(0, 200);
    else if (item.id === 'duties' && v) next.duties = v.slice(0, 1000);
    else if (item.id === 'prohibited' && v) next.prohibited = v.slice(0, 1000);
    else if (item.id.startsWith('skill_')) {
      const sid = item.id.replace(/^skill_/, '');
      next.skills = next.skills.map((s) =>
        s.id === sid ? { ...s, desc: v || s.desc, name: item.fieldLabel?.replace(/^技能 · /, '') || s.name } : s,
      );
    } else if (item.id.startsWith('kb_')) {
      const kid = item.id.replace(/^kb_/, '');
      next.knowledgeBases = next.knowledgeBases.map((k) =>
        k.id === kid ? { ...k, desc: v || k.desc, name: item.fieldLabel?.replace(/^知识库 · /, '') || k.name } : k,
      );
    }
  }
  // drop unchecked skills/kbs
  const keptSkillIds = new Set(
    items.filter((i) => i.checked && i.id.startsWith('skill_')).map((i) => i.id.replace(/^skill_/, '')),
  );
  const keptKbIds = new Set(
    items.filter((i) => i.checked && i.id.startsWith('kb_')).map((i) => i.id.replace(/^kb_/, '')),
  );
  if (items.some((i) => i.id.startsWith('skill_'))) {
    next.skills = next.skills.filter((s) => keptSkillIds.has(s.id));
  }
  if (items.some((i) => i.id.startsWith('kb_'))) {
    next.knowledgeBases = next.knowledgeBases.filter((k) => keptKbIds.has(k.id));
  }
  return next;
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

function buildThinkSteps(prompt: string): SkillThinkStep[] {
  return [
    { id: 's1', label: '解析岗位意图', detail: prompt.slice(0, 48) || '识别服务场景', status: 'pending' },
    { id: 's2', label: '规划主 Agent Prompt', detail: '名称 / 性格 / 职责 / 红线', status: 'pending' },
    { id: 's3', label: '拆解技能边界', detail: '技能表单草稿', status: 'pending' },
    { id: 's4', label: '规划知识库挂载', detail: '知识库表单草稿', status: 'pending' },
    { id: 's5', label: '整理确认要点', detail: '等待你确认后写入右侧', status: 'pending' },
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

function IncubationTrainingPane({
  formReady,
  agent,
  knowledgeBases,
  skills,
  updateHiredAgent,
  showToast,
}: {
  formReady: boolean;
  agent: HiredAgent | null;
  knowledgeBases: KnowledgeBase[];
  skills: Skill[];
  updateHiredAgent: (id: string, updates: Partial<HiredAgent>) => void;
  showToast: (message: string) => void;
}) {
  if (!formReady || !agent) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-8">
          <p className="text-[15px] font-medium text-neutral-800">
            先在左侧
            <span className={cn('font-bold mx-1', SKILL_AOP_GRADIENT_TEXT)}>对话确认</span>
            草案要点
          </p>
          <p className="mt-2 text-[13px] text-neutral-500 max-w-sm leading-relaxed">
            确认后将打开与员工培训相同的配置页，并可在右侧直接对话预览与调试。
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResizableSplitPane
      storageKey="js_incubation_training_split"
      defaultRatio={0.62}
      minLeftPx={280}
      minRightPx={260}
      className="bg-paper h-full"
      left={
        <OnboardingConfigPanel
          agent={agent}
          knowledgeBases={knowledgeBases}
          skills={skills}
          hasKbs={knowledgeBases.length > 0}
          hasSks={skills.length > 0}
          updateHiredAgent={updateHiredAgent}
          showToast={showToast}
          onPersonaConfigured={() => {}}
          onKnowledgeBound={() => {}}
          onSkillBound={() => {}}
        />
      }
      right={
        <OnboardingCapabilityTestPanel
          agent={agent}
          knowledgeBases={knowledgeBases}
          skills={skills}
          showToast={showToast}
          title="预览和调试"
        />
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
    setActiveOnboardingAgentId,
    setActiveTab,
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
  const [confirmEdit, setConfirmEdit] = useState<{
    msgId: string;
    items: Array<{
      itemId: string;
      itemIndex: number;
      hint: string;
      value: string;
    }>;
  } | null>(null);
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
    setConfirmEdit(null);
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
            text: `已根据你的描述完成自主规划${mountHint ? `，并优先挂载你索引的${mountHint}` : ''}，整理了下方确认要点（含主 Agent、技能与知识库）。\n请核对后点击「确认」，我会写入右侧配置区；也可继续在对话里改写某一条。`,
            time: nowTime(),
          },
          {
            id: uid('m'),
            kind: 'confirm',
            title: '请确认数字员工草案要点',
            items: draftToConfirmItems(nextDraft),
            confirmed: false,
            time: nowTime(),
          },
        ]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedPrompt, seedSkillIds.join('|'), seedKbIds.join('|')]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, thinkSteps]);

  /** 确认草案后物化真实员工，右侧直接复用培训配置 + 预览调试 */
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

    if (confirmEdit) {
      const summary = confirmEdit.items
        .map((item) => `${item.itemIndex + 1}. ${item.hint}：${item.value || '（空）'}`)
        .join('\n');
      text = `请按我的要求改写以下确认要点，并更新草案：\n${summary}\n\n修改要求：${text}`;
      setConfirmEdit(null);
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
    setThinking(false);
    setThinkSteps([]);

    const mountHint = [
      seedSkills.length > 0 ? `${seedSkills.length} 项技能` : '',
      seedKbs.length > 0 ? `${seedKbs.length} 个知识库` : '',
    ]
      .filter(Boolean)
      .join('、');
    const aiText = isFirst
      ? `已根据你的描述完成自主规划${mountHint ? `，并优先挂载你索引的${mountHint}` : ''}，整理了下方确认要点（含主 Agent、技能与知识库）。\n请核对后点击「确认」，我会写入右侧配置区；也可继续在对话里改写某一条。`
      : `已按你的补充整理本轮变更要点。确认后会同步到右侧员工资料与技能/知识库。`;

    setMessages((prev) => [
      ...prev,
      { id: uid('m'), kind: 'ai', text: aiText, time: nowTime() },
      {
        id: uid('m'),
        kind: 'confirm',
        title: isFirst ? '请确认数字员工草案要点' : '请确认本轮变更要点',
        items: draftToConfirmItems(nextDraft),
        confirmed: false,
        time: nowTime(),
      },
    ]);
  };

  const handleConfirm = (msgId: string, items: SkillConfirmItem[]) => {
    const source = pendingDraft ?? draft;
    const next = applyConfirmItems(source, items);
    setDraft(next);
    setPendingDraft(next);
    setFormReady(true);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.kind === 'confirm'
          ? { ...m, items, confirmed: true }
          : m,
      ),
    );
    setMessages((prev) => [
      ...prev,
      {
        id: uid('m'),
        kind: 'ai',
        text: `已写入右侧配置区。可继续对话微调，或点右上角「创建此员工」进入培训。`,
        time: nowTime(),
      },
    ]);
    showToast('已确认并写入右侧配置区');
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

  const finalizeCreate = () => {
    if (!formReady || !draft.name.trim()) {
      showToast('请先在对话中确认草案，再创建员工');
      return;
    }

    // 已物化：保留员工并进入正式培训页
    if (trainingAgentId && trainingAgent) {
      setActiveOnboardingAgentId(trainingAgentId);
      setActiveTab('training');
      trainingAgentIdRef.current = null;
      setTrainingAgentId(null);
      materializedRef.current = false;
      showToast(`「${trainingAgent.name}」已就绪，继续完善入职培训`);
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
      enterTraining: true,
    });

    updateHiredAgent(agent.id, {
      skills: skillIds,
      knowledgeBases: kbIds,
      languageStyle: draft.personality,
      constraints: draft.prohibited,
      workflowNotes: draft.duties,
    });

    showToast(`「${agent.name}」已创建并挂载技能/知识库，进入员工培训`);
    onClose();
  };

  if (!open) return null;

  const canSend = input.trim().length > 0 && !thinking;

  return createPortal(
    <div className="fixed inset-0 z-[120] h-screen w-screen flex flex-col bg-paper overflow-hidden text-neutral-800 animate-in fade-in duration-200">
      <OnboardingWorkspaceHeader
        tabs={INCUBATION_WORKSPACE_TABS}
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
            创建此员工
          </button>
        }
      />

      <ResizableSplitPane
        storageKey="js_incubation_split_nl_left"
        defaultLeftPx={480}
        defaultRatio={0.42}
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
                    你好！我会像创建技能一样，用对话帮你规划数字员工的主 Prompt、技能边界与知识库，确认后右侧会打开培训配置页，并可对话预览与调试。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '帮我创建一个「食安险理赔专员」数字员工',
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
                        <div className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line bg-neutral-100 text-neutral-800">
                          {m.text}
                        </div>
                        <span className="text-[10px] text-neutral-400">{m.time}</span>
                      </div>
                    </div>
                  );
                }
                if (m.kind !== 'confirm') return null;
                return (
                  <div key={m.id} className="w-full">
                    <SkillRoundConfirmCard
                      title={m.title}
                      items={m.items}
                      confirmed={m.confirmed}
                      editingItemIds={
                        confirmEdit?.msgId === m.id
                          ? confirmEdit.items.map((item) => item.itemId)
                          : []
                      }
                      onConfirm={(items) => handleConfirm(m.id, items)}
                      onEditItem={(item, itemIndex) => {
                        setChipSelections([]);
                        const hint = item.fieldLabel || `要点 ${itemIndex + 1}`;
                        const value = (
                          item.value || item.label.replace(/^[^：:]+[：:]\s*/, '')
                        ).trim();
                        const nextItem = {
                          itemId: item.id,
                          itemIndex,
                          hint,
                          value,
                        };
                        setConfirmEdit((prev) => {
                          if (prev?.msgId === m.id) {
                            const exists = prev.items.some((row) => row.itemId === item.id);
                            const nextItems = exists
                              ? prev.items.filter((row) => row.itemId !== item.id)
                              : [...prev.items, nextItem].sort(
                                  (a, b) => a.itemIndex - b.itemIndex,
                                );
                            return nextItems.length === 0
                              ? null
                              : { msgId: m.id, items: nextItems };
                          }
                          return { msgId: m.id, items: [nextItem] };
                        });
                        inputRef.current?.focus();
                      }}
                      onBatchModeChange={(active) => {
                        if (!active && confirmEdit?.msgId === m.id) {
                          setConfirmEdit(null);
                        }
                      }}
                      onItemsChange={(items) => {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === m.id && msg.kind === 'confirm'
                              ? { ...msg, items }
                              : msg,
                          ),
                        );
                      }}
                    />
                  </div>
                );
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
              {confirmEdit ? (
                <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-1 border-b border-neutral-100">
                  {confirmEdit.items.map((item) => (
                    <span
                      key={item.itemId}
                      className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2 rounded-md bg-neutral-100 border border-neutral-200 text-[12px] text-neutral-800 max-w-full"
                      title={item.value}
                    >
                      <span className="w-5 h-5 rounded bg-neutral-800 text-white text-[11px] font-semibold tabular-nums flex items-center justify-center shrink-0">
                        {item.itemIndex + 1}
                      </span>
                      <span className="truncate">编辑要点 · {item.hint}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmEdit((prev) => {
                            if (!prev) return null;
                            const nextItems = prev.items.filter((row) => row.itemId !== item.itemId);
                            return nextItems.length === 0
                              ? null
                              : { ...prev, items: nextItems };
                          });
                        }}
                        className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                        aria-label={`移除 ${item.hint}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <textarea
                ref={inputRef}
                rows={3}
                maxLength={1000}
                value={input}
                disabled={thinking}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && confirmEdit) {
                    e.preventDefault();
                    setConfirmEdit(null);
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void runUserTurn(input);
                  }
                }}
                placeholder={
                  confirmEdit
                    ? confirmEdit.items.length > 1
                      ? `说明如何改写已选 ${confirmEdit.items.length} 条要点，发送后由 AI 更新…`
                      : `说明如何改写「${confirmEdit.items[0].hint}」，发送后由 AI 更新…`
                    : formReady
                      ? '继续补充规则，或点上方「AI 帮写」快捷填充…'
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
                    title={confirmEdit ? '发给 AI 改写' : '发送'}
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
            formReady={formReady}
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
