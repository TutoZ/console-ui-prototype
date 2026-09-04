/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 伴随式 AI 搭子侧栏 — 布局参考 B 端 AI 助手规范（标题栏 / 推荐工具 / 猜你想问 / 底栏输入），
 * 可收起展开。内容按业务域注入，不照搬稿内电商文案。
 */

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Database,
  FileText,
  History,
  Maximize2,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  ArrowUp,
  X,
} from '@/lib/icons';
import { NAV_ACTIVE_GRADIENT_BG, NAV_ACTIVE_GRADIENT_TEXT, SKILL_AOP_ACCENT_TEXT } from '@/lib/ui';
import { PROFILE_USER } from '@/lib/profileUser';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'js_companion_assist_open';

export type CompanionTool = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export type CompanionAssistPanelProps = {
  /** 受控展开；不传则组件内自管，收起后不占位 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 问候语中的统计高亮，如知识库数量 */
  highlightValue?: string | number;
  /** 问候文案：前缀 / 高亮后缀，中间插入 highlightValue */
  greetingBefore?: string;
  greetingAfter?: string;
  tools?: CompanionTool[];
  questions?: string[];
  inputPlaceholder?: string;
  className?: string;
  /** 点击快捷工具 / 猜你想问时回填输入框 */
  onPromptSelect?: (text: string) => void;
  onSend?: (text: string) => void;
};

const DEFAULT_TOOLS: CompanionTool[] = [
  { id: 'create', label: '智能建库', icon: <Database size={16} strokeWidth={1.75} /> },
  { id: 'upload', label: '文档入库', icon: <Upload size={16} strokeWidth={1.75} /> },
  { id: 'search', label: '知识检索', icon: <Search size={16} strokeWidth={1.75} /> },
  { id: 'gap', label: '缺口分析', icon: <Sparkles size={16} strokeWidth={1.75} /> },
  { id: 'qa', label: '问答试跑', icon: <BookOpen size={16} strokeWidth={1.75} /> },
  { id: 'batch', label: '批量整理', icon: <FileText size={16} strokeWidth={1.75} /> },
];

const DEFAULT_QUESTIONS = [
  '如何把 PDF 手册导入知识库？',
  '知识库和数字员工技能怎么绑定？',
  '文档分块方法该怎么选？',
  '怎样检查知识库检索效果？',
  '多个知识库如何分工管理？',
];

const QUESTION_POOL = [
  ...DEFAULT_QUESTIONS,
  '上传失败常见原因有哪些？',
  '字符数统计包含什么内容？',
  '如何给知识库重命名？',
  '删除知识库会影响在岗员工吗？',
  '嵌入模型选错会怎样？',
];

function readInitialOpen(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export function CompanionAssistOpenButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="打开 AI 搭子"
      aria-label="打开 AI 搭子"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 px-3 rounded-[7px]',
        'border border-neutral-200 bg-white text-neutral-800',
        'text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer',
        className,
      )}
    >
      <Sparkles size={14} className={SKILL_AOP_ACCENT_TEXT} />
      <span>AI搭子</span>
    </button>
  );
}

export function CompanionAssistPanel({
  open: openProp,
  onOpenChange,
  highlightValue,
  greetingBefore,
  greetingAfter = ' 个知识库，一起打理吧',
  tools = DEFAULT_TOOLS,
  questions: questionsProp,
  inputPlaceholder = '问问知识库怎么建、怎么用…',
  className,
  onPromptSelect,
  onSend,
}: CompanionAssistPanelProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(readInitialOpen);
  const open = openProp ?? uncontrolledOpen;
  const [draft, setDraft] = useState('');
  const [questionSeed, setQuestionSeed] = useState(0);

  const questions = useMemo(() => {
    if (questionsProp?.length) return questionsProp;
    const start = (questionSeed * 5) % QUESTION_POOL.length;
    return Array.from({ length: 5 }, (_, i) => QUESTION_POOL[(start + i) % QUESTION_POOL.length]);
  }, [questionsProp, questionSeed]);

  const greetingLead =
    greetingBefore ?? `Hi ${PROFILE_USER.name}，当前有 `;

  const setOpenPersist = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const applyPrompt = (text: string) => {
    setDraft(text);
    onPromptSelect?.(text);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend?.(text);
    setDraft('');
  };

  if (!open) return null;

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col h-full min-h-0 w-[320px]',
        'bg-white border-l border-neutral-200 rounded-tl-xl',
        className,
      )}
      aria-label="AI 搭子"
    >
      {/* 标题栏 */}
      <header className="flex items-center justify-between gap-2 px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={16} className={cn(SKILL_AOP_ACCENT_TEXT, 'shrink-0')} />
          <span className={cn('text-[15px] font-semibold tracking-tight', NAV_ACTIVE_GRADIENT_TEXT)}>
            AI搭子
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="历史" ariaLabel="历史记录">
            <History size={16} />
          </IconBtn>
          <IconBtn title="展开" ariaLabel="全屏">
            <Maximize2 size={16} />
          </IconBtn>
          <IconBtn
            title="收起"
            ariaLabel="收起 AI 搭子"
            onClick={() => setOpenPersist(false)}
          >
            <X size={16} />
          </IconBtn>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 pb-3 flex flex-col gap-3">
        <p className="text-[17px] font-semibold leading-6 text-neutral-800">
          {greetingLead}
          {highlightValue !== undefined && highlightValue !== null ? (
            <span className={cn(SKILL_AOP_ACCENT_TEXT, 'tabular-nums')}>{highlightValue}</span>
          ) : null}
          {greetingAfter}
        </p>

        {/* 工具推荐 */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">工具推荐</span>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer transition"
            >
              全部工具
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {tools.slice(0, 6).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  tool.onClick?.();
                  applyPrompt(tool.label);
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 h-16 px-1',
                  'rounded-md border border-neutral-200 bg-white',
                  'text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300',
                  'transition cursor-pointer',
                )}
              >
                <span className="text-neutral-800">{tool.icon}</span>
                <span className="text-[13px] leading-[22px] truncate max-w-full">{tool.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1 py-0.5" aria-hidden>
            <span className="h-1 w-3 rounded-full bg-neutral-800/80" />
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
          </div>
        </section>

        {/* 猜你想问 */}
        <section className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">猜你想问</span>
            <button
              type="button"
              onClick={() => setQuestionSeed((s) => s + 1)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer transition"
            >
              <RefreshCw size={12} />
              换一换
            </button>
          </div>
          <ul className="flex flex-col gap-3">
            {questions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => applyPrompt(q)}
                  className="w-full flex items-center gap-2 text-left cursor-pointer group"
                >
                  <span className="flex-1 min-w-0 text-[14px] leading-[22px] text-neutral-800 group-hover:text-neutral-950 truncate">
                    {q}
                  </span>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-neutral-400 group-hover:text-neutral-600"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 底栏 */}
      <footer className="shrink-0 px-5 pt-2 pb-1.5 bg-white border-t border-transparent">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
            {tools.slice(0, 2).map((tool) => (
              <button
                key={`chip-${tool.id}`}
                type="button"
                onClick={() => applyPrompt(tool.label)}
                className={cn(
                  'inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5',
                  'rounded border border-neutral-200 bg-white',
                  'text-[12px] leading-[18px] text-neutral-800',
                  'hover:bg-neutral-50 cursor-pointer transition',
                )}
              >
                <span className="scale-90">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5',
                'rounded border border-neutral-200 bg-white',
                'text-[12px] leading-[18px] text-neutral-800',
                'hover:bg-neutral-50 cursor-pointer transition',
              )}
            >
              <Plus size={12} />
              更多
            </button>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <IconBtn title="历史" ariaLabel="历史">
              <Clock size={16} />
            </IconBtn>
            <IconBtn title="新建" ariaLabel="新建对话">
              <Plus size={16} />
            </IconBtn>
          </div>
        </div>

        <div
          className={cn(
            'rounded-lg border border-neutral-200 bg-white p-3 flex flex-col gap-3',
            'shadow-[0_2px_12px_rgba(21,101,191,0.04)]',
          )}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={inputPlaceholder}
            className={cn(
              'w-full resize-none border-0 bg-transparent p-0',
              'text-[14px] leading-[22px] text-neutral-800 placeholder:text-neutral-400',
              'outline-none focus:ring-0',
            )}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <IconBtn title="提及" ariaLabel="提及">
                <span className="text-[13px] font-medium text-neutral-500">@</span>
              </IconBtn>
              <IconBtn title="附件" ariaLabel="附件">
                <Paperclip size={14} />
              </IconBtn>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim()}
              title="发送"
              aria-label="发送"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full shrink-0',
                'text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                NAV_ACTIVE_GRADIENT_BG,
              )}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
        <p className="text-center text-[12px] leading-[18px] text-neutral-400 mt-1.5 mb-1">
          内容由 AI 生成，仅供参考
        </p>
      </footer>
    </aside>
  );
}

function IconBtn({
  children,
  title,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md',
        'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
        'transition cursor-pointer',
      )}
    >
      {children}
    </button>
  );
}
