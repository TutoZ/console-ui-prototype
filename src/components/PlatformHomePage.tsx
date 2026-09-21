/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI搭建 — 一句话创建入口（数字员工创建 / 技能创建 / 知识库创建）
 * 布局对齐 Figma“B端_AI组件规范”创作平台稿（node 24238:29648）。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ArrowUp,
  FileText,
  GitBranch,
  History,
  Layers,
  Library,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from '@/lib/icons';
import { FIELD, BTN_AI, NAV_ACTIVE_GRADIENT_TEXT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { SKILL_PAGE_COPY } from '@/lib/platformTerminology';
import { GoalComposerGhost } from './GoalComposerGhost';
import { EmployeeIncubationWorkspace } from './employees/EmployeeIncubationWorkspace';
import {
  SkillStudioWorkspace,
  type SkillStudioPublishPayload,
} from './skills/SkillStudioWorkspace';
import { KnowledgeStudioWorkspace } from './knowledge/KnowledgeStudioWorkspace';
import {
  EMPLOYEE_CREATE_CASES,
  KNOWLEDGE_CREATE_CASES,
  SKILL_CREATE_CASES,
  type HomeCreateCase,
} from '@/lib/homeCreateCases';

const MAX_LEN = 1000;
const MAX_ATTACHMENTS = 8;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const ATTACHMENT_ACCEPT =
  '.pdf,.txt,.md,.doc,.docx,.csv,.json,.xlsx,.xls,.png,.jpg,.jpeg,.webp';

type HomeAttachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  /** 纯文本类附件摘录，提交时带入上下文 */
  textExcerpt?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}

function isReadableTextFile(file: File): boolean {
  if (file.type.startsWith('text/') || file.type === 'application/json') return true;
  return /\.(txt|md|csv|json|log)$/i.test(file.name);
}

async function buildHomeAttachment(file: File): Promise<HomeAttachment> {
  let textExcerpt: string | undefined;
  if (isReadableTextFile(file) && file.size <= 200_000) {
    try {
      const text = await file.text();
      textExcerpt = text.replace(/\s+$/g, '').slice(0, 4000);
    } catch {
      /* ignore read errors */
    }
  }
  return {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    textExcerpt,
  };
}

import { CHAT_ATTACHMENT_MARKER } from '@/lib/chatAttachments';

function buildPromptWithAttachments(prompt: string, files: HomeAttachment[]): string {
  if (files.length === 0) return prompt.trim();
  const lines = files.map((f) => {
    const base = `- ${f.name}（${formatFileSize(f.size)}）`;
    if (!f.textExcerpt) return base;
    return `${base}\n\`\`\`\n${f.textExcerpt}\n\`\`\``;
  });
  const block = `${CHAT_ATTACHMENT_MARKER}\n${lines.join('\n')}`;
  const body = prompt.trim();
  if (!body) {
    return `请根据附件内容开始创建。\n\n${block}`;
  }
  return `${body}\n\n${block}`;
}

type CreateMode = 'employee' | 'skill' | 'knowledge';

type HomeSession = {
  id: string;
  title: string;
  mode: CreateMode;
  prompt: string;
};

const HEADLINE: Record<CreateMode, { plain: string; accent: string }> = {
  skill: { plain: '要完成什么任务，我来帮你', accent: '创建技能' },
  employee: { plain: '要服务什么场景，我来帮你', accent: '创建员工' },
  knowledge: { plain: '要沉淀什么资料，我来帮你', accent: '创建知识库' },
};

const SUBTITLE: Record<CreateMode, string> = {
  skill: '写清要完成的任务与边界，我们会写入右侧技能包并持续帮你优化。',
  employee: '写清岗位职责与服务边界，我们会帮你生成可培训、可上岗的数字员工草稿。',
  knowledge: '写清知识用途与覆盖范围，我们会写入右侧知识库并持续帮你补全。',
};

const INDEX_CHIP =
  'inline-flex items-center gap-1.5 h-7 max-w-[240px] pl-1.5 pr-1 rounded-[7px] bg-white border border-neutral-200 text-[12px] text-neutral-800 shrink-0';

const MODE_SWITCH_EASE = [0.25, 0.1, 0.25, 1] as const;
const MODE_PILL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 };

const SEED_SESSIONS: HomeSession[] = [
  {
    id: 's1',
    title: EMPLOYEE_CREATE_CASES[0].label,
    mode: 'employee',
    prompt: EMPLOYEE_CREATE_CASES[0].pe,
  },
  {
    id: 's2',
    title: EMPLOYEE_CREATE_CASES[1].label,
    mode: 'employee',
    prompt: EMPLOYEE_CREATE_CASES[1].pe,
  },
];

function sessionTitleFromPrompt(text: string, mode: CreateMode): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const quoted = trimmed.match(/[「『“"](.+?)[」』”"]/);
  if (quoted?.[1]) return quoted[1].slice(0, 28);
  const prefix =
    mode === 'skill'
      ? /^(帮我)?(做一个|创建)?(一个)?/
      : mode === 'knowledge'
        ? /^(帮我)?(建一个|创建一个|创建)?(一个)?/
        : /^(帮我)?(创建一个|创建)?(一个)?/;
  const stripped = trimmed
    .replace(prefix, '')
    .replace(/数字员工|技能|知识库/g, '')
    .trim();
  return (stripped || trimmed).slice(0, 28);
}

export const PlatformHomePage: React.FC = () => {
  const { showToast, skills, knowledgeBases } = useApp();
  const pendingSkillAutoStartRef = useRef(false);
  const [mode, setMode] = useState<CreateMode>(() => {
    try {
      const stored = sessionStorage.getItem('js_home_create_mode');
      if (stored === 'skill' || stored === 'knowledge') {
        sessionStorage.removeItem('js_home_create_mode');
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'employee';
  });
  const [prompt, setPrompt] = useState(() => {
    try {
      const seed = sessionStorage.getItem('js_home_create_seed');
      if (seed) {
        sessionStorage.removeItem('js_home_create_seed');
        pendingSkillAutoStartRef.current = true;
        return seed;
      }
    } catch {
      /* ignore */
    }
    return '';
  });
  const [incubationOpen, setIncubationOpen] = useState(false);
  const [incubationSeed, setIncubationSeed] = useState('');
  const [incubationSkillIds, setIncubationSkillIds] = useState<string[]>([]);
  const [incubationKbIds, setIncubationKbIds] = useState<string[]>([]);
  const [skillStudioOpen, setSkillStudioOpen] = useState(false);
  const [skillSeed, setSkillSeed] = useState<string | null>(null);
  const [skillSeedKbNames, setSkillSeedKbNames] = useState<string[]>([]);
  const [skillStudioKey, setSkillStudioKey] = useState(0);
  const [knowledgeStudioOpen, setKnowledgeStudioOpen] = useState(false);
  const [knowledgeSeed, setKnowledgeSeed] = useState<string | null>(null);
  const [knowledgeStudioKey, setKnowledgeStudioKey] = useState(0);
  const [indexedSkillIds, setIndexedSkillIds] = useState<string[]>([]);
  const [indexedKbIds, setIndexedKbIds] = useState<string[]>([]);
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexTab, setIndexTab] = useState<'skill' | 'kb'>('skill');
  const [indexQuery, setIndexQuery] = useState('');
  const [ghostTipIndex, setGhostTipIndex] = useState(0);
  const [attachments, setAttachments] = useState<HomeAttachment[]>([]);
  const [attachDragging, setAttachDragging] = useState(false);
  const [sessions, setSessions] = useState<HomeSession[]>(SEED_SESSIONS);
  const [sessionQuery, setSessionQuery] = useState('');
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const indexPanelRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    setIndexOpen(false);
    setIndexQuery('');
    setIndexedSkillIds([]);
    setIndexedKbIds([]);
    setAttachments([]);
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

  const canSubmit = prompt.trim().length > 0 || attachments.length > 0;
  const cases: readonly HomeCreateCase[] =
    mode === 'skill'
      ? SKILL_CREATE_CASES
      : mode === 'knowledge'
        ? KNOWLEDGE_CREATE_CASES
        : EMPLOYEE_CREATE_CASES;
  const chipLabels = cases.map((c) => c.label);
  const headline = HEADLINE[mode];

  const addAttachments = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const room = MAX_ATTACHMENTS - attachments.length;
      if (room <= 0) return;

      const accepted: HomeAttachment[] = [];
      for (const file of incoming.slice(0, room)) {
        const extOk =
          !ATTACHMENT_ACCEPT ||
          ATTACHMENT_ACCEPT.split(',').some((token) => {
            const t = token.trim().toLowerCase();
            if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
            return file.type === t;
          });
        if (!extOk) continue;
        if (file.size > MAX_ATTACHMENT_BYTES) continue;
        accepted.push(await buildHomeAttachment(file));
      }

      if (accepted.length > 0) {
        setAttachments((prev) => [...prev, ...accepted].slice(0, MAX_ATTACHMENTS));
      }
    },
    [attachments.length],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const onAttachmentInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) await addAttachments(files);
    e.currentTarget.value = '';
  };

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

  const applyChip = (item: HomeCreateCase) => {
    setPrompt(item.pe.slice(0, MAX_LEN));
    textareaRef.current?.focus();
  };

  const acceptGhostTip = () => {
    const item = cases[ghostTipIndex % cases.length];
    setPrompt(item.pe.slice(0, MAX_LEN));
    setGhostTipIndex((i) => (i + 1) % cases.length);
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
    setSkillSeedKbNames([]);
  };

  const closeKnowledgeStudio = () => {
    setKnowledgeStudioOpen(false);
    setKnowledgeSeed(null);
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
      : mode === 'skill'
        ? indexedKbIds.length
        : 0;

  const pushSession = useCallback((text: string, nextMode: CreateMode) => {
    const session: HomeSession = {
      id: `s_${Date.now()}`,
      title: sessionTitleFromPrompt(text, nextMode),
      mode: nextMode,
      prompt: text,
    };
    setSessions((prev) => [session, ...prev.filter((s) => s.prompt !== text)]);
  }, []);

  /** 技能创建：带入文案后立刻进入对话式创建工作台并自动开聊 */
  const startSkillCreate = useCallback(
    (raw: string, kbIds: string[] = indexedKbIds) => {
      const text = raw.trim();
      if (!text) return;
      const kbNames = knowledgeBases
        .filter((kb) => kbIds.includes(kb.id))
        .map((kb) => kb.name);
      pushSession(text, 'skill');
      setIncubationOpen(false);
      setKnowledgeStudioOpen(false);
      setKnowledgeSeed(null);
      setSkillSeed(text);
      setSkillSeedKbNames(kbNames);
      setSkillStudioKey((k) => k + 1);
      setSkillStudioOpen(true);
      setPrompt('');
      setAttachments([]);
      setIndexedKbIds([]);
      setIndexOpen(false);
    },
    [pushSession, knowledgeBases, indexedKbIds],
  );

  /** 知识库创建：带入文案后立刻建库并进入对话工作台 */
  const startKnowledgeCreate = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      pushSession(text, 'knowledge');
      setIncubationOpen(false);
      setSkillStudioOpen(false);
      setSkillSeed(null);
      setKnowledgeSeed(text);
      setKnowledgeStudioKey((k) => k + 1);
      setKnowledgeStudioOpen(true);
      setPrompt('');
      setAttachments([]);
      setIndexedSkillIds([]);
      setIndexedKbIds([]);
      setIndexOpen(false);
    },
    [pushSession],
  );

  useEffect(() => {
    if (!pendingSkillAutoStartRef.current) return;
    pendingSkillAutoStartRef.current = false;
    if (mode !== 'skill') return;
    const text = prompt.trim();
    if (!text) return;
    startSkillCreate(text);
  }, [mode, prompt, startSkillCreate]);

  const openSession = (session: HomeSession) => {
    setMode(session.mode);
    setRenamingId(null);
    setPrompt('');
    setAttachments([]);
    setIndexOpen(false);
    setIndexedSkillIds([]);
    setIndexedKbIds([]);

    if (session.mode === 'skill') {
      startSkillCreate(session.prompt);
      return;
    }

    if (session.mode === 'knowledge') {
      startKnowledgeCreate(session.prompt);
      return;
    }

    setSkillStudioOpen(false);
    setSkillSeed(null);
    setKnowledgeStudioOpen(false);
    setKnowledgeSeed(null);
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
    const text = buildPromptWithAttachments(prompt, attachments);

    if (mode === 'skill') {
      startSkillCreate(text);
      return;
    }

    if (mode === 'knowledge') {
      startKnowledgeCreate(text);
      return;
    }

    pushSession(text, mode);
    setIncubationSeed(text);
    setIncubationSkillIds(indexedSkillIds);
    setIncubationKbIds(indexedKbIds);
    setIncubationOpen(true);
    setPrompt('');
    setAttachments([]);
    setIndexedSkillIds([]);
    setIndexedKbIds([]);
    setIndexOpen(false);
  };

  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden bg-white">
      {/* 最近会话：展开为侧栏；收起仅“最近会话”+图标，无边线 */}
      {sessionSidebarOpen ? (
        <aside
          className="relative z-[2] flex h-full w-[200px] shrink-0 flex-col border-r border-neutral-100 bg-white"
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
        <div className="absolute left-0 top-0 z-[3] flex h-11 items-center gap-2 px-3">
          <h2 className="text-[14px] font-medium text-neutral-700">最近会话</h2>
          <button
            type="button"
            onClick={() => setSessionSidebarOpen(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 cursor-pointer transition"
            aria-label="展开会话列表"
            title="展开"
          >
            <History size={16} strokeWidth={1.75} />
          </button>
        </div>
      )}

      <div className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white">
      {/* 柔光：大模糊 + 长淡出，避免椭圆硬边 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[min(560px,70%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(21,101,191,0.09)] blur-[80px]"
      />

      <div className="relative z-[1] flex flex-col items-center justify-center px-6 py-8 min-h-full">
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
            <ModeTab
              active={mode === 'knowledge'}
              label="知识库创建"
              icon={<Library size={16} strokeWidth={1.75} className="text-neutral-800" />}
              onClick={() => setMode('knowledge')}
            />
          </div>

          <div
            className={cn(
              'relative z-[2] mt-1 flex flex-col gap-0 rounded-[16px] border border-white/90 bg-white/92 p-[13px]',
              'shadow-[0_4px_24px_rgba(21,101,191,0.06),0_1px_0_rgba(255,255,255,0.8)_inset]',
              'backdrop-blur-[8px]',
              attachDragging && 'border-[#1565BF]/45 ring-2 ring-[#1565BF]/15 bg-white',
            )}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.types.includes('Files')) setAttachDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.types.includes('Files')) setAttachDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setAttachDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAttachDragging(false);
              if (e.dataTransfer.files?.length) {
                void addAttachments(e.dataTransfer.files);
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={onAttachmentInputChange}
            />
            <div className="relative">
              {!prompt ? (
                <GoalComposerGhost
                  labels={chipLabels}
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
                    : mode === 'knowledge'
                      ? '描述希望沉淀的知识用途与范围'
                      : '描述希望创建的数字员工职责'
                }
                rows={3}
                className="relative z-[1] w-full min-h-[80px] max-h-36 bg-transparent text-[14px] leading-[21px] px-1 pt-1 pb-2 outline-none resize-none text-[#181D27]"
              />
            </div>

            {attachments.length > 0 ? (
              <div className="px-1 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {attachments.map((file) => (
                  <span key={file.id} className={INDEX_CHIP} title={`${file.name} · ${formatFileSize(file.size)}`}>
                    <FileText size={12} className="text-neutral-500 shrink-0" />
                    <span className="truncate min-w-0">{file.name}</span>
                    <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                      aria-label={`移除 ${file.name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            {(mode === 'employee'
              ? selectedSkills.length + selectedKbs.length > 0
              : mode === 'skill' && selectedKbs.length > 0) ? (
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
                  aria-label="添加附件"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-[7px]',
                    'border border-neutral-200 bg-white text-neutral-600',
                    'shadow-[0_1px_0_rgba(0,0,0,0.05)]',
                    'hover:bg-neutral-50 cursor-pointer transition',
                    attachments.length > 0 && 'border-neutral-300 text-neutral-800',
                  )}
                >
                  <Plus size={16} />
                </button>
                <div className="relative" ref={indexPanelRef}>
                  {mode !== 'knowledge' ? (
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
                  ) : null}
                  {indexOpen && mode !== 'knowledge' ? (
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
                  title={
                    mode === 'skill'
                      ? '开始创建技能'
                      : mode === 'knowledge'
                        ? '开始创建知识库'
                        : '开始创建数字员工'
                  }
                  aria-label={
                    mode === 'skill'
                      ? '开始创建技能'
                      : mode === 'knowledge'
                        ? '开始创建知识库'
                        : '开始创建数字员工'
                  }
                  className={cn(BTN_AI, 'transition')}
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
            {cases.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => applyChip(item)}
                title={item.hint ?? item.pe}
                className={cn(
                  'inline-flex h-8 items-center px-2.5 rounded-full',
                  'border border-neutral-200 bg-white',
                  'text-[12px] leading-[18px] text-neutral-700',
                  'hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900',
                  'cursor-pointer transition',
                )}
              >
                {item.label}
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

      {skillStudioOpen && skillSeed
        ? createPortal(
            <SkillStudioWorkspace
              key={`create-${skillStudioKey}-${skillSeed.slice(0, 24)}`}
              onBack={closeSkillStudio}
              onPublish={handleSkillPublished}
              showToast={showToast}
              initialMode="interactive"
              initialPrompt={skillSeed}
              initialSelectedKBs={skillSeedKbNames}
              closeLabel="返回AI搭建"
            />,
            document.body,
          )
        : null}

      <KnowledgeStudioWorkspace
        key={`kb-create-${knowledgeStudioKey}-${(knowledgeSeed ?? '').slice(0, 24)}`}
        open={knowledgeStudioOpen && Boolean(knowledgeSeed)}
        onClose={closeKnowledgeStudio}
        initialPrompt={knowledgeSeed}
        closeLabel="返回AI搭建"
      />
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
        'group relative inline-flex h-9 min-w-[120px] items-center justify-center gap-1 px-4 rounded-full',
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
        <span
          className={cn(
            'inline-flex w-4 shrink-0 items-center justify-center transition-opacity duration-200 ease-out',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          aria-hidden={!active}
        >
          {icon}
        </span>
        {label}
      </span>
    </button>
  );
}
