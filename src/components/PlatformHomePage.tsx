/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 智能创建 — 一句话创建入口（数字员工创建 / 技能创建）
 * 布局对齐 Figma「B端_AI组件规范」创作平台稿（node 24238:29648）。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  ArrowUp,
  GitBranch,
  History,
  Layers,
  Library,
  Paperclip,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from '@/lib/icons';
import { FIELD, NAV_ACTIVE_GRADIENT_BG, NAV_ACTIVE_GRADIENT_TEXT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { SKILL_PAGE_COPY } from '@/lib/platformTerminology';
import { GoalComposerGhost, formatGoalGhostText } from './GoalComposerGhost';
import { EmployeeIncubationWorkspace } from './employees/EmployeeIncubationWorkspace';
import {
  SkillStudioWorkspace,
  type SkillStudioPublishPayload,
} from './skills/SkillStudioWorkspace';

const MAX_LEN = 1000;

type CreateMode = 'employee' | 'skill';

type HomeSession = {
  id: string;
  title: string;
  mode: CreateMode;
  prompt: string;
};

const SKILL_CHIPS = [
  '延保进度查询',
  '退换货自助',
  '高危客诉安抚',
  '物流异常催派',
  '保价差额补退',
  '理赔资料预审',
  '发票开具指引',
] as const;

const EMPLOYEE_CHIPS = [
  '食安险理赔专员',
  '在线客服接待',
  '外呼催收助理',
  '热线质检员',
  '电销拓客顾问',
  '售后回访专员',
  '商户续保顾问',
] as const;

const HEADLINE: Record<CreateMode, { plain: string; accent: string }> = {
  skill: { plain: '要完成什么任务，我来帮你', accent: '创建技能' },
  employee: { plain: '要服务什么场景，我来帮你', accent: '创建员工' },
};

const SUBTITLE: Record<CreateMode, string> = {
  skill: '写清要完成的任务与边界，我们会拆进右侧四张卡片并持续帮你优化。',
  employee: '写清岗位职责与服务边界，我们会帮你生成可培训、可上岗的数字员工草稿。',
};

const INDEX_CHIP =
  'inline-flex items-center gap-1.5 h-7 max-w-[240px] pl-1.5 pr-1 rounded-[7px] bg-white border border-neutral-200 text-[12px] text-neutral-800 shrink-0';

const MODE_SWITCH_EASE = [0.25, 0.1, 0.25, 1] as const;
const MODE_PILL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 };

const SEED_SESSIONS: HomeSession[] = [
  {
    id: 's1',
    title: '食安险理赔专员',
    mode: 'employee',
    prompt: '帮我创建一个「食安险理赔专员」数字员工',
  },
  {
    id: 's2',
    title: '在线客服接待',
    mode: 'employee',
    prompt: '帮我创建一个「在线客服接待」数字员工',
  },
];

function sessionTitleFromPrompt(text: string, mode: CreateMode): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const quoted = trimmed.match(/[「『"“](.+?)[」』"”]/);
  if (quoted?.[1]) return quoted[1].slice(0, 28);
  const prefix =
    mode === 'skill'
      ? /^(帮我)?(做一个|创建)?(一个)?/
      : /^(帮我)?(创建一个|创建)?(一个)?/;
  const stripped = trimmed.replace(prefix, '').replace(/数字员工|技能/g, '').trim();
  return (stripped || trimmed).slice(0, 28);
}

export const PlatformHomePage: React.FC = () => {
  const { showToast, skills, knowledgeBases } = useApp();
  const [mode, setMode] = useState<CreateMode>('employee');
  const [prompt, setPrompt] = useState('');
  const [incubationOpen, setIncubationOpen] = useState(false);
  const [incubationSeed, setIncubationSeed] = useState('');
  const [incubationSkillIds, setIncubationSkillIds] = useState<string[]>([]);
  const [incubationKbIds, setIncubationKbIds] = useState<string[]>([]);
  const [skillStudioOpen, setSkillStudioOpen] = useState(false);
  const [skillSeed, setSkillSeed] = useState<string | null>(null);
  const [indexedSkillIds, setIndexedSkillIds] = useState<string[]>([]);
  const [indexedKbIds, setIndexedKbIds] = useState<string[]>([]);
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexTab, setIndexTab] = useState<'skill' | 'kb'>('skill');
  const [indexQuery, setIndexQuery] = useState('');
  const [ghostTipIndex, setGhostTipIndex] = useState(0);
  const [sessions, setSessions] = useState<HomeSession[]>(SEED_SESSIONS);
  const [sessionQuery, setSessionQuery] = useState('');
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const indexPanelRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    setIndexOpen(false);
    setIndexQuery('');
    setIndexedSkillIds([]);
    setIndexedKbIds([]);
    setIndexTab(mode === 'employee' ? 'skill' : 'kb');
    setGhostTipIndex(0);
  }, [mode]);

  useEffect(() => {
    if (!indexOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (indexPanelRef.current?.contains(e.target as Node)) return;
      setIndexOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [indexOpen]);

  useEffect(() => {
    if (!renamingId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [renamingId]);

  const canSubmit = prompt.trim().length > 0;
  const chips = mode === 'skill' ? SKILL_CHIPS : EMPLOYEE_CHIPS;
  const headline = HEADLINE[mode];

  const filteredSessions = useMemo(() => {
    const q = sessionQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q) || s.prompt.toLowerCase().includes(q));
  }, [sessions, sessionQuery]);

  const indexableSkills = useMemo(
    () =>
      skills.filter(
        (s) =>
          (s.type === 'mine' || s.type === 'subscribed') &&
          (!indexQuery.trim()
            || s.name.toLowerCase().includes(indexQuery.trim().toLowerCase())
            || (s.description ?? '').includes(indexQuery.trim())),
      ),
    [skills, indexQuery],
  );

  const indexableKbs = useMemo(
    () =>
      knowledgeBases.filter(
        (kb) =>
          !indexQuery.trim()
          || kb.name.toLowerCase().includes(indexQuery.trim().toLowerCase()),
      ),
    [knowledgeBases, indexQuery],
  );

  const selectedSkills = useMemo(
    () => skills.filter((s) => indexedSkillIds.includes(s.id)),
    [skills, indexedSkillIds],
  );

  const selectedKbs = useMemo(
    () => knowledgeBases.filter((kb) => indexedKbIds.includes(kb.id)),
    [knowledgeBases, indexedKbIds],
  );

  const applyChip = (label: string) => {
    if (mode === 'skill') {
      setPrompt(`帮我做一个「${label}」技能`);
    } else {
      setPrompt(`帮我创建一个「${label}」数字员工`);
    }
    textareaRef.current?.focus();
  };

  const acceptGhostTip = () => {
    const label = chips[ghostTipIndex % chips.length];
    setPrompt(formatGoalGhostText(label, mode));
    setGhostTipIndex((i) => (i + 1) % chips.length);
    textareaRef.current?.focus();
  };

  const handleTabComplete = () => {
    if (prompt.trim()) return;
    acceptGhostTip();
  };

  const toggleIndexedSkill = (id: string) => {
    setIndexedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleIndexedKb = (id: string) => {
    setIndexedKbIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const closeSkillStudio = () => {
    setSkillStudioOpen(false);
    setSkillSeed(null);
  };

  const handleSkillPublished = (payload: SkillStudioPublishPayload) => {
    if (payload.draftOnly) return;
    showToast(
      payload.versionNote
        ? `${payload.name} · ${payload.versionNote}`
        : SKILL_PAGE_COPY.createSuccess,
    );
    closeSkillStudio();
  };

  const indexedTotal =
    mode === 'employee'
      ? indexedSkillIds.length + indexedKbIds.length
      : indexedKbIds.length;

  const pushSession = (text: string, nextMode: CreateMode) => {
    const session: HomeSession = {
      id: `s_${Date.now()}`,
      title: sessionTitleFromPrompt(text, nextMode),
      mode: nextMode,
      prompt: text,
    };
    setSessions((prev) => [session, ...prev.filter((s) => s.prompt !== text)]);
  };

  const openSession = (session: HomeSession) => {
    setMode(session.mode);
    setRenamingId(null);
    setPrompt('');
    setIndexOpen(false);
    setIndexedSkillIds([]);
    setIndexedKbIds([]);

    if (session.mode === 'skill') {
      setIncubationOpen(false);
      setIncubationSkillIds([]);
      setIncubationKbIds([]);
      setSkillSeed(session.prompt);
      setSkillStudioOpen(true);
      return;
    }

    setSkillStudioOpen(false);
    setSkillSeed(null);
    setIncubationSeed(session.prompt);
    setIncubationSkillIds([]);
    setIncubationKbIds([]);
    setIncubationOpen(true);
  };

  const startRename = (session: HomeSession) => {
    setRenamingId(session.id);
    setRenameDraft(session.title);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const next = renameDraft.trim();
    if (next) {
      setSessions((prev) =>
        prev.map((s) => (s.id === renamingId ? { ...s, title: next.slice(0, 40) } : s)),
      );
    }
    setRenamingId(null);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (renamingId === id) setRenamingId(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const text = prompt.trim();
    pushSession(text, mode);

    if (mode === 'skill') {
      setSkillSeed(text);
      setSkillStudioOpen(true);
      setPrompt('');
      setIndexedKbIds([]);
      setIndexOpen(false);
      return;
    }

    setIncubationSeed(text);
    setIncubationSkillIds(indexedSkillIds);
    setIncubationKbIds(indexedKbIds);
    setIncubationOpen(true);
    setPrompt('');
    setIndexedSkillIds([]);
    setIndexedKbIds([]);
    setIndexOpen(false);
  };

  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden bg-white">
      {/* 最近会话：展开为侧栏；收起仅「最近会话」+图标，无边线 */}
      {sessionSidebarOpen ? (
        <aside
          className="relative z-[2] flex h-full w-[248px] shrink-0 flex-col border-r border-neutral-100 bg-white"
          aria-label="最近会话"
        >
          <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
            <h2 className="text-[14px] font-medium text-neutral-700">最近会话</h2>
            <button
              type="button"
              onClick={() => setSessionSidebarOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 cursor-pointer transition"
              aria-label="收起会话列表"
              title="收起"
            >
              <History size={16} strokeWidth={1.75} />
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                value={sessionQuery}
                onChange={(e) => setSessionQuery(e.target.value)}
                placeholder="搜索会话"
                className={cn(
                  FIELD,
                  'h-8 pl-8 text-[12px] bg-neutral-50/80 border-neutral-200/60 rounded-lg',
                )}
                aria-label="搜索会话"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-3">
            {filteredSessions.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-neutral-400">
                {sessionQuery.trim() ? '没有匹配的会话' : '暂无会话，创建后会出现在这里'}
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filteredSessions.map((session) => {
                  const renaming = renamingId === session.id;
                  return (
                    <li key={session.id}>
                      <div className="group relative flex items-center gap-1 rounded-lg px-2.5 py-2 transition hover:bg-neutral-50">
                        {renaming ? (
                          <input
                            ref={renameInputRef}
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value.slice(0, 40))}
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setRenamingId(null);
                              }
                            }}
                            className="min-w-0 flex-1 h-6 rounded-md border border-neutral-200 bg-white px-1.5 text-[13px] text-neutral-800 outline-none focus:border-neutral-300"
                            aria-label="重命名会话"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSession(session)}
                            className="min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <span className="block truncate text-[13px] leading-5 text-neutral-700 group-hover:text-neutral-900">
                              {session.title}
                            </span>
                          </button>
                        )}
                        {!renaming ? (
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => startRename(session)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white hover:text-neutral-700 cursor-pointer"
                              aria-label={`重命名 ${session.title}`}
                              title="重命名"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSession(session.id)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white hover:text-red-600 cursor-pointer"
                              aria-label={`删除 ${session.title}`}
                              title="删除"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setSessionSidebarOpen(true)}
          className="absolute left-4 top-3 z-[3] inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-700 hover:text-neutral-900 cursor-pointer"
          aria-label="展开最近会话"
          title="展开最近会话"
        >
          <span>最近会话</span>
          <History size={16} strokeWidth={1.75} className="text-neutral-600" />
        </button>
      )}

      <div className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white">
      {/* 柔光：大模糊 + 长淡出，避免椭圆硬边 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[min(560px,70%)] -translate-x-1/2 -translate-y-[55%] rounded-full bg-[rgba(21,101,191,0.09)] blur-[80px]"
      />

      <div className="relative z-[1] flex flex-col items-center justify-center px-6 py-10 min-h-full">
        {/* 标题 */}
        <div className="w-full max-w-[860px] text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: MODE_SWITCH_EASE }}
            >
              <h1 className="text-[40px] leading-[1.05] tracking-tight font-normal text-neutral-900 sm:text-[44px]">
                <span>{headline.plain}</span>
                <span className={cn('font-bold', NAV_ACTIVE_GRADIENT_TEXT)}>{headline.accent}</span>
              </h1>
              <p className="mt-3 text-[14px] leading-5 text-neutral-500">{SUBTITLE[mode]}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 创作卡片：Tab 区保持原样；半透明底仅与输入框齐平 */}
        <div className="relative w-full max-w-[860px] mt-6">
          <div
            className={cn(
              'pointer-events-none absolute left-0 right-0 -top-[4px] h-[78px] rounded-[24px]',
              'border border-white/80',
              'bg-[linear-gradient(180deg,rgba(244,247,252,0.72)_0%,rgba(244,247,252,0.28)_55%,rgba(244,247,252,0)_100%)]',
              'shadow-[0_8px_28px_rgba(21,101,191,0.04)]',
            )}
            aria-hidden
          />
          <div className="relative z-[1] flex items-center gap-0 px-2 pt-1.5 pb-0">
            <ModeTab
              active={mode === 'employee'}
              label="数字员工创建"
              icon={<Users size={16} strokeWidth={1.75} className="text-neutral-800" />}
              onClick={() => setMode('employee')}
            />
            <ModeTab
              active={mode === 'skill'}
              label="技能创建"
              icon={<GitBranch size={16} strokeWidth={1.75} className="text-neutral-800" />}
              onClick={() => setMode('skill')}
            />
          </div>

          <div
            className={cn(
              'relative z-[2] mt-1 flex flex-col gap-0 rounded-[16px] border border-white/90 bg-white/92 p-[13px]',
              'shadow-[0_4px_24px_rgba(21,101,191,0.06),0_1px_0_rgba(255,255,255,0.8)_inset]',
              'backdrop-blur-[8px]',
            )}
          >
            <div className="relative">
              {!prompt ? (
                <GoalComposerGhost
                  labels={chips}
                  tipIndex={ghostTipIndex}
                  onTipIndexChange={setGhostTipIndex}
                  onAcceptTab={acceptGhostTip}
                  variant={mode}
                />
              ) : null}
              <textarea
                ref={textareaRef}
                value={prompt}
                maxLength={MAX_LEN}
                onChange={(e) => setPrompt(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !prompt.trim()) {
                    e.preventDefault();
                    handleTabComplete();
                  }
                  if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                aria-label={
                  mode === 'skill'
                    ? '描述希望 Skill 完成的业务任务'
                    : '描述希望创建的数字员工职责'
                }
                rows={3}
                className="relative z-[1] w-full min-h-[80px] max-h-36 bg-transparent text-[14px] leading-[21px] px-1 pt-1 pb-2 outline-none resize-none text-[#181D27]"
              />
            </div>

            {(mode === 'employee'
              ? selectedSkills.length + selectedKbs.length > 0
              : selectedKbs.length > 0) ? (
              <div className="px-1 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {mode === 'employee'
                  ? selectedSkills.map((sk) => (
                      <span key={sk.id} className={INDEX_CHIP} title={sk.name}>
                        <Layers size={12} className="text-neutral-500 shrink-0" />
                        <span className="truncate min-w-0">{sk.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleIndexedSkill(sk.id)}
                          className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                          aria-label={`移除 ${sk.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  : null}
                {selectedKbs.map((kb) => (
                  <span key={kb.id} className={INDEX_CHIP} title={kb.name}>
                    <Library size={12} className="text-neutral-500 shrink-0" />
                    <span className="truncate min-w-0">{kb.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleIndexedKb(kb.id)}
                      className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                      aria-label={`移除 ${kb.name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex items-end justify-between gap-3 pt-1 px-1">
              <div className="flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  title="添加附件"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-[7px]',
                    'border border-neutral-200 bg-white text-neutral-600',
                    'shadow-[0_1px_0_rgba(0,0,0,0.05)]',
                    'hover:bg-neutral-50 cursor-pointer transition',
                  )}
                >
                  <Paperclip size={16} />
                </button>
                <div className="relative" ref={indexPanelRef}>
                  <button
                    type="button"
                    title={mode === 'employee' ? '索引技能与知识库' : '索引知识'}
                    onClick={() => {
                      setIndexOpen((v) => !v);
                      setIndexQuery('');
                      if (mode === 'employee') setIndexTab('skill');
                      else setIndexTab('kb');
                    }}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 px-2.5 rounded-[7px] border text-[12px] font-medium transition cursor-pointer',
                      indexOpen || indexedTotal > 0
                        ? 'border-neutral-200 bg-white text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-neutral-50'
                        : 'border-transparent bg-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-200 hover:text-neutral-800',
                    )}
                  >
                    {mode === 'employee' ? <Layers size={14} /> : <Library size={14} />}
                    {mode === 'employee' ? '索引资源' : '索引知识'}
                    {indexedTotal > 0 ? (
                      <span className="text-[11px] tabular-nums text-neutral-500">
                        {indexedTotal}
                      </span>
                    ) : null}
                  </button>
                  {indexOpen ? (
                    <div className="skill-goal-composer-menu absolute left-0 top-[calc(100%+6px)] z-[90] w-[min(340px,88vw)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 pt-2.5 pb-2 border-b border-neutral-100 space-y-2">
                        {mode === 'employee' ? (
                          <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-[7px]">
                            <button
                              type="button"
                              onClick={() => {
                                setIndexTab('skill');
                                setIndexQuery('');
                              }}
                              className={cn(
                                'flex-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition cursor-pointer',
                                indexTab === 'skill'
                                  ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
                                  : 'text-neutral-500 hover:text-neutral-800',
                              )}
                            >
                              技能
                              {indexedSkillIds.length > 0 ? ` · ${indexedSkillIds.length}` : ''}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIndexTab('kb');
                                setIndexQuery('');
                              }}
                              className={cn(
                                'flex-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition cursor-pointer',
                                indexTab === 'kb'
                                  ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
                                  : 'text-neutral-500 hover:text-neutral-800',
                              )}
                            >
                              知识库
                              {indexedKbIds.length > 0 ? ` · ${indexedKbIds.length}` : ''}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[12px] font-semibold text-neutral-800">选择参考知识库</p>
                        )}
                        <input
                          type="text"
                          autoFocus
                          value={indexQuery}
                          onChange={(e) => setIndexQuery(e.target.value)}
                          placeholder={
                            mode === 'employee' && indexTab === 'skill'
                              ? '搜索技能名称…'
                              : '搜索知识库名称…'
                          }
                          className={cn(FIELD, 'h-8 text-[12px] bg-neutral-50')}
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5">
                        {mode === 'employee' && indexTab === 'skill' ? (
                          indexableSkills.length > 0 ? (
                            indexableSkills.map((sk) => {
                              const on = indexedSkillIds.includes(sk.id);
                              return (
                                <button
                                  key={sk.id}
                                  type="button"
                                  onClick={() => toggleIndexedSkill(sk.id)}
                                  className={cn(
                                    'w-full text-left px-2.5 py-2 rounded-lg transition cursor-pointer',
                                    on ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] font-medium text-neutral-900 truncate">
                                      {sk.name}
                                    </span>
                                    {on ? (
                                      <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                                        已选
                                      </span>
                                    ) : null}
                                  </div>
                                  {sk.description ? (
                                    <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-1">
                                      {sk.description}
                                    </p>
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <p className="px-2.5 py-4 text-[12px] text-neutral-500 text-center">
                              暂无可索引技能，请先在技能中心创建
                            </p>
                          )
                        ) : indexableKbs.length > 0 ? (
                          indexableKbs.map((kb) => {
                            const on = indexedKbIds.includes(kb.id);
                            return (
                              <button
                                key={kb.id}
                                type="button"
                                onClick={() => toggleIndexedKb(kb.id)}
                                className={cn(
                                  'w-full text-left px-2.5 py-2 rounded-lg transition cursor-pointer',
                                  on ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-medium text-neutral-900 truncate">
                                    {kb.name}
                                  </span>
                                  {on ? (
                                    <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                                      已选
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-2.5 py-4 text-[12px] text-neutral-500 text-center">
                            暂无知识库
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] leading-5 text-neutral-400 tabular-nums">
                  {prompt.length}/{MAX_LEN}
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  title="发送"
                  aria-label="发送"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-[7px] text-white',
                    'shadow-[0_1px_0_rgba(0,0,0,0.05)] transition cursor-pointer',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    NAV_ACTIVE_GRADIENT_BG,
                  )}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 推荐芯片 */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: MODE_SWITCH_EASE, delay: 0.04 }}
            className="w-full max-w-[860px] mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            {chips.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => applyChip(label)}
                className={cn(
                  'inline-flex h-8 items-center px-2.5 rounded-full',
                  'border border-neutral-200 bg-white',
                  'text-[12px] leading-[18px] text-neutral-700',
                  'hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900',
                  'cursor-pointer transition',
                )}
              >
                {label}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <EmployeeIncubationWorkspace
        open={incubationOpen}
        seedPrompt={incubationSeed}
        seedSkillIds={incubationSkillIds}
        seedKbIds={incubationKbIds}
        onClose={() => {
          setIncubationOpen(false);
          setIncubationSkillIds([]);
          setIncubationKbIds([]);
        }}
      />

      {skillStudioOpen ? (
        <SkillStudioWorkspace
          key={`create-${skillSeed ?? 'blank'}`}
          onBack={closeSkillStudio}
          onPublish={handleSkillPublished}
          showToast={showToast}
          initialMode="interactive"
          initialPrompt={skillSeed}
          closeLabel="返回 Agent Builder"
        />
      ) : null}
      </div>
    </div>
  );
};

function ModeTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex h-9 min-w-[120px] items-center justify-center gap-1 px-4 rounded-full',
        'text-[14px] leading-5 font-medium cursor-pointer',
        'transition-colors duration-200 ease-out',
        active ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/45',
      )}
    >
      {active ? (
        <motion.span
          layoutId="platform-home-mode-pill"
          className={cn(
            'absolute inset-0 rounded-full bg-white/90',
            'shadow-[0_2px_10px_rgba(21,101,191,0.08),inset_0_0_0_1px_rgba(255,255,255,0.7)]',
          )}
          transition={MODE_PILL_SPRING}
          aria-hidden
        />
      ) : null}
      <span className="relative z-[1] inline-flex items-center justify-center gap-1">
        <span className="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden={!active}>
          <motion.span
            initial={false}
            animate={{
              opacity: active ? 1 : 0,
              scale: active ? 1 : 0.9,
            }}
            transition={{ duration: 0.18, ease: MODE_SWITCH_EASE }}
            className="inline-flex"
          >
            {icon}
          </motion.span>
        </span>
        {label}
      </span>
    </button>
  );
}
