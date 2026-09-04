/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI 数字员工智能孵化 — 对齐技能创建 CUI：
 * 全屏左右分栏 · 左侧自然语言对话 · 右侧可收起配置卡片（对齐员工培训）
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Cpu,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
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
import { EMPLOYEE_RESOURCE_TERMS } from '@/lib/platformTerminology';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import { useApp } from '../../context/AppContext';
import { ResizableSplitPane } from '../common/ResizableSplitPane';
import { OnboardingWorkspaceHeader } from '../onboarding/OnboardingWorkspaceHeader';
import { ConfigSection, ONBOARDING_FIELD } from '../onboarding/OnboardingConfigPanel';
import {
  SkillRoundConfirmCard,
  type SkillConfirmItem,
} from '../skills/SkillRoundConfirmCard';
import { SkillThinkingCard } from '../skills/SkillThinkingCard';
import { SkillRewriteField, SkillRewriteProvider } from '../skills/SkillRewriteField';

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

function IncubationDraftTopBar({
  draft,
  formReady,
  onNameChange,
}: {
  draft: IncubationDraft;
  formReady: boolean;
  onNameChange: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  return (
    <div className="shrink-0 px-4 py-3 bg-white border-b border-neutral-200 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {editing ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value.slice(0, 12))}
            onBlur={() => {
              const trimmed = nameDraft.trim();
              if (trimmed) onNameChange(trimmed);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setEditing(false);
            }}
            className={cn(ONBOARDING_FIELD, 'h-8 py-1.5 text-sm max-w-[220px]')}
          />
        ) : (
          <h2 className="text-sm font-extrabold text-neutral-900 tracking-tight truncate">
            {draft.name || '未命名数字员工'}
          </h2>
        )}
        <p className="text-xs text-neutral-500 mt-0.5">
          {formReady ? '草案已确认 · 可继续编辑' : '对话确认后同步草案'}
        </p>
      </div>
      {!editing && formReady ? (
        <button
          type="button"
          onClick={() => {
            setNameDraft(draft.name);
            setEditing(true);
          }}
          className="text-xs font-medium text-primary shrink-0 cursor-pointer"
        >
          编辑名称
        </button>
      ) : null}
    </div>
  );
}

function IncubationDraftPanel({
  draft,
  formReady,
  setDraft,
  showToast,
}: {
  draft: IncubationDraft;
  formReady: boolean;
  setDraft: React.Dispatch<React.SetStateAction<IncubationDraft>>;
  showToast: (message: string) => void;
}) {
  const [open, setOpen] = useState({ persona: true, skills: true, kb: true });
  const toggle = (key: 'persona' | 'skills' | 'kb') =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const fieldCommon = {
    labelClassName: 'text-xs font-medium text-neutral-500',
    className: 'space-y-1',
  } as const;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      <IncubationDraftTopBar
        draft={draft}
        formReady={formReady}
        onNameChange={(name) => setDraft((d) => ({ ...d, name }))}
      />
      <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-2 custom-scrollbar">
        {!formReady ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-8">
            <p className="text-[15px] font-medium text-neutral-800">
              先在左侧
              <span className={cn('font-bold mx-1', SKILL_AOP_GRADIENT_TEXT)}>对话确认</span>
              草案要点
            </p>
            <p className="mt-2 text-[13px] text-neutral-500 max-w-sm leading-relaxed">
              与技能创建相同：AI 先拆解确认卡，你点确认后，员工资料、技能与知识库才会同步到右侧配置区。
            </p>
          </div>
        ) : (
          <SkillRewriteProvider onToast={showToast}>
            <ConfigSection
              title="入职标签"
              icon={<UserCheck size={13} className="text-neutral-500 shrink-0" />}
              open={open.persona}
              onToggle={() => toggle('persona')}
            >
              <div className="space-y-2 pt-1">
                <SkillRewriteField
                  {...fieldCommon}
                  fieldKey="emp-desc"
                  fieldLabel={EMPLOYEE_RESOURCE_TERMS.employeeDescription}
                  label={EMPLOYEE_RESOURCE_TERMS.employeeDescription}
                  multiline
                  rows={3}
                  value={draft.description}
                  maxLength={200}
                  onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
                  placeholder="简要描述这位数字员工的岗位定位与服务范围…"
                  inputClassName={cn(ONBOARDING_FIELD, 'min-h-[72px] resize-y leading-relaxed text-sm')}
                />
                <SkillRewriteField
                  {...fieldCommon}
                  fieldKey="emp-personality"
                  fieldLabel="语言风格"
                  label="语言风格"
                  value={draft.personality}
                  maxLength={80}
                  onChange={(v) => setDraft((d) => ({ ...d, personality: v }))}
                  placeholder="亲和专业、温和体贴、共情力强…"
                  inputClassName={cn(ONBOARDING_FIELD, 'h-8 py-1.5 text-sm')}
                />
                <SkillRewriteField
                  {...fieldCommon}
                  fieldKey="emp-duties"
                  fieldLabel="技能&工作流"
                  label="技能&工作流"
                  multiline
                  rows={4}
                  value={draft.duties}
                  maxLength={1000}
                  onChange={(v) => setDraft((d) => ({ ...d, duties: v }))}
                  placeholder="描述职责步骤与服务流程…"
                  inputClassName={cn(ONBOARDING_FIELD, 'min-h-[72px] resize-y leading-relaxed text-sm')}
                />
                <SkillRewriteField
                  {...fieldCommon}
                  fieldKey="emp-prohibited"
                  fieldLabel="约束&限制"
                  label="约束&限制"
                  multiline
                  rows={4}
                  value={draft.prohibited}
                  maxLength={1000}
                  onChange={(v) => setDraft((d) => ({ ...d, prohibited: v }))}
                  placeholder="1. 回答简洁\n2. 超出知识范围时礼貌拒答…"
                  inputClassName={cn(ONBOARDING_FIELD, 'min-h-[72px] resize-y leading-relaxed text-sm')}
                />
              </div>
            </ConfigSection>

            <ConfigSection
              title={EMPLOYEE_RESOURCE_TERMS.configuredSkillList}
              icon={<Cpu size={13} className="text-neutral-500 shrink-0" />}
              open={open.skills}
              onToggle={() => toggle('skills')}
              badge={
                draft.skills.length > 0 ? (
                  <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                    <CheckCircle2 size={10} />
                    {draft.skills.length}
                  </span>
                ) : null
              }
            >
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        skills: [
                          ...d.skills,
                          { id: uid('sk'), name: '新技能', desc: '请补充技能说明。' },
                        ],
                      }))
                    }
                    className="text-xs text-primary font-medium cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus size={11} />
                    添加技能
                  </button>
                </div>
                <div className="space-y-1">
                  {draft.skills.map((sk) => (
                    <div
                      key={sk.id}
                      className="flex items-start justify-between gap-2 px-2 py-1.5 rounded-md border border-neutral-200 bg-neutral-100/30"
                    >
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{sk.name}</p>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-snug">{sk.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            skills: d.skills.filter((s) => s.id !== sk.id),
                          }))
                        }
                        className="text-neutral-500 hover:text-destructive p-0.5 cursor-pointer shrink-0 mt-0.5"
                        title={EMPLOYEE_RESOURCE_TERMS.removeAssigned}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {draft.skills.length === 0 && (
                    <p className="text-xs text-neutral-500 py-1 leading-relaxed">
                      {EMPLOYEE_RESOURCE_TERMS.configSkillHint}
                    </p>
                  )}
                </div>
              </div>
            </ConfigSection>

            <ConfigSection
              title={EMPLOYEE_RESOURCE_TERMS.configuredKbList}
              icon={<BookOpen size={13} className="text-neutral-500 shrink-0" />}
              open={open.kb}
              onToggle={() => toggle('kb')}
              badge={
                draft.knowledgeBases.length > 0 ? (
                  <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                    <CheckCircle2 size={10} />
                    {draft.knowledgeBases.length}
                  </span>
                ) : null
              }
            >
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        knowledgeBases: [
                          ...d.knowledgeBases,
                          { id: uid('kb'), name: '新知识库', desc: '请补充知识库说明。' },
                        ],
                      }))
                    }
                    className="text-xs text-primary font-medium cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus size={11} />
                    添加知识库
                  </button>
                </div>
                <div className="space-y-1">
                  {draft.knowledgeBases.map((kb) => (
                    <div
                      key={kb.id}
                      className="flex items-start justify-between gap-2 px-2 py-1.5 rounded-md border border-neutral-200 bg-neutral-100/30"
                    >
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{kb.name}</p>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-snug">{kb.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            knowledgeBases: d.knowledgeBases.filter((k) => k.id !== kb.id),
                          }))
                        }
                        className="text-neutral-500 hover:text-destructive p-0.5 cursor-pointer shrink-0 mt-0.5"
                        title={EMPLOYEE_RESOURCE_TERMS.removeAssigned}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {draft.knowledgeBases.length === 0 && (
                    <p className="text-xs text-neutral-500 py-1 leading-relaxed">
                      {EMPLOYEE_RESOURCE_TERMS.configKbHint}
                    </p>
                  )}
                </div>
              </div>
            </ConfigSection>
          </SkillRewriteProvider>
        )}
      </div>
    </div>
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
    skills: platformSkills,
    knowledgeBases: platformKbs,
  } = useApp();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState<IncubationDraft>(emptyDraft);
  const [pendingDraft, setPendingDraft] = useState<IncubationDraft | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [thinkSteps, setThinkSteps] = useState<SkillThinkStep[]>([]);
  const [chipSelections, setChipSelections] = useState<HelpChip[]>([]);
  const [confirmEdit, setConfirmEdit] = useState<{
    msgId: string;
    itemId: string;
    itemIndex: number;
    hint: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resetSession = useCallback(() => {
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
  }, []);

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

  const runUserTurn = async (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;

    if (confirmEdit) {
      const { msgId, itemId } = confirmEdit;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || m.kind !== 'confirm' || m.confirmed) return m;
          return {
            ...m,
            items: m.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    value: text.slice(0, 400),
                    label: `${it.fieldLabel || '要点'}：${text.slice(0, 80)}`,
                  }
                : it,
            ),
          };
        }),
      );
      setConfirmEdit(null);
      setInput('');
      setChipSelections([]);
      showToast('已更新确认要点，请点击确认写入右侧');
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
      description: [
        draft.description,
        '',
        '【性格】',
        draft.personality,
        '',
        '【职责】',
        draft.duties,
        '',
        '【禁止行为】',
        draft.prohibited,
      ].join('\n'),
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
        backLabel="返回智能创建"
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
        minRightPx={360}
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
                    你好！我会像创建技能一样，用对话帮你规划数字员工的主 Prompt、技能边界与知识库，确认后再同步到右侧配置区。
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
                return (
                  <div key={m.id} className="w-full">
                    <SkillRoundConfirmCard
                      title={m.title}
                      items={m.items}
                      confirmed={m.confirmed}
                      editingItemId={
                        confirmEdit?.msgId === m.id ? confirmEdit.itemId : null
                      }
                      onConfirm={(items) => handleConfirm(m.id, items)}
                      onReset={(items) => {
                        setConfirmEdit(null);
                        setInput(
                          items
                            .filter((it) => it.checked)
                            .map((it) => `${it.fieldLabel || '要点'}：${it.value || it.label}`)
                            .join('\n'),
                        );
                        inputRef.current?.focus();
                      }}
                      onEditItem={(item, itemIndex) => {
                        setChipSelections([]);
                        setConfirmEdit({
                          msgId: m.id,
                          itemId: item.id,
                          itemIndex,
                          hint: item.fieldLabel || `要点 ${itemIndex + 1}`,
                        });
                        setInput(item.value || item.label.replace(/^[^：:]+[：:]\s*/, ''));
                        inputRef.current?.focus();
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
                <div className="flex items-center gap-2 pb-2 mb-1 border-b border-neutral-100">
                  <span className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2 rounded-md bg-neutral-100 border border-neutral-200 text-[12px] text-neutral-800 max-w-full">
                    <span className="w-5 h-5 rounded bg-neutral-800 text-white text-[11px] font-semibold tabular-nums flex items-center justify-center shrink-0">
                      {confirmEdit.itemIndex + 1}
                    </span>
                    <span className="truncate">编辑要点 · {confirmEdit.hint}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmEdit(null);
                        setInput('');
                      }}
                      className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </span>
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
                    setInput('');
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void runUserTurn(input);
                  }
                }}
                placeholder={
                  formReady
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
                  <Paperclip size={16} />
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
                    title={confirmEdit ? '更新要点' : '发送'}
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
          <IncubationDraftPanel
            draft={draft}
            formReady={formReady}
            setDraft={setDraft}
            showToast={showToast}
          />
        }
      />
    </div>,
    document.body,
  );
}
