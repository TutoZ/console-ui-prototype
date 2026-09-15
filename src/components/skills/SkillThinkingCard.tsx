/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 深度思考卡（Cot / jd-think）
 * https://jdesign.jd.com/x/vue/component/cot
 *
 * - loading     扫光「思考中」
 * - generating  先「思考中」，再正文打字机 + 标题随段落切换
 * - Cot         思考中工具逐条扫光；全部完成后收成可展开摘要
 * - 完成态      「已完成思考 · Ns」· 可折叠全文
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText, Terminal } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { SkillThinkCotChild, SkillThinkCotKind, SkillThinkStep } from '@/lib/skillStudioMock';
import { SKILL_CREATE_CHAT } from '@/lib/platformTerminology';

export type SkillThinkingCardProps = {
  title?: string;
  steps: SkillThinkStep[];
  durationSec?: number;
  isComplete: boolean;
  /** 生成中：正文打字机 + 渐变标题按步骤切换 */
  generating?: boolean;
  /** 纯加载态：先于正文出现，标题取首段摘要 */
  loading?: boolean;
  /** 对齐 jd-think default-expanded；默认完成态展开 */
  defaultExpanded?: boolean;
  className?: string;
};

function stepToParagraph(step: SkillThinkStep): string {
  // Cot 正文只用思考段落，不把「规划式标题」拼进段落前
  const detail = step.detail?.trim() ?? '';
  if (detail) return detail;
  return step.label?.trim() ?? '';
}

function stepsToParagraphs(steps: SkillThinkStep[]): string[] {
  return steps.map(stepToParagraph).filter(Boolean);
}

function stepStatusHint(step: SkillThinkStep): string {
  const label = step.label?.trim() ?? '';
  if (label) return label;
  const detail = step.detail?.trim() ?? '';
  if (!detail) return SKILL_CREATE_CHAT.thinkInProgress;
  const first = detail.split(/[。！？\n]/)[0]?.trim() ?? '';
  return first.slice(0, 18) || SKILL_CREATE_CHAT.thinkInProgress;
}

/** 根据已流出字数定位当前段落 index，驱动标题切换 */
function activeParagraphIndex(paragraphs: string[], charCount: number): number {
  if (paragraphs.length === 0) return 0;
  if (charCount <= 0) return 0;
  let left = charCount;
  for (let i = 0; i < paragraphs.length; i += 1) {
    if (left <= paragraphs[i].length) return i;
    left -= paragraphs[i].length;
  }
  return paragraphs.length - 1;
}

function GeneratingTitle({ text }: { text: string }) {
  return (
    <span className="skill-thinking-generating-title text-[13px] font-semibold leading-5">
      {text}
    </span>
  );
}

function CardHeader({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer select-none"
      aria-expanded={open}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronUp
        size={14}
        className={cn(
          'shrink-0 text-[#8C8C8C] transition-transform duration-200',
          !open && 'rotate-180',
        )}
      />
    </button>
  );
}

/** 将「已流出字数」切回段落，便于段间 8px 排版 */
function sliceParagraphs(paragraphs: string[], charCount: number): string[] {
  if (charCount <= 0) return [];
  const out: string[] = [];
  let left = charCount;
  for (const p of paragraphs) {
    if (left <= 0) break;
    if (left >= p.length) {
      out.push(p);
      left -= p.length;
    } else {
      out.push(p.slice(0, left));
      left = 0;
    }
  }
  return out;
}

function cotKindMeta(kind: SkillThinkCotKind | undefined): {
  Icon: typeof BookOpen;
  summaryPhrase: string;
} {
  if (kind === 'run') return { Icon: Terminal, summaryPhrase: '运行了命令' };
  if (kind === 'note') return { Icon: FileText, summaryPhrase: '记录了备注' };
  return { Icon: BookOpen, summaryPhrase: '读取了文件' };
}

/** 按出现顺序拼接动作类型，贴近 Cursor 工具摘要 */
function cotSummaryLabel(items: SkillThinkCotChild[]): string {
  const seen = new Set<SkillThinkCotKind>();
  const phrases: string[] = [];
  for (const item of items) {
    const kind = item.kind ?? 'read';
    if (seen.has(kind)) continue;
    seen.add(kind);
    phrases.push(cotKindMeta(kind).summaryPhrase);
  }
  return phrases.join('');
}

function CotKindIcon({ kind }: { kind?: SkillThinkCotKind }) {
  const { Icon } = cotKindMeta(kind);
  return <Icon size={13} className="shrink-0 text-[#8C8C8C]" />;
}

/** 把 `code` 片段渲染成灰底胶囊，贴近 Cot 工具日志 */
function renderCotLabel(label: string): React.ReactNode {
  const parts = label.split(/(`[^`]+`)/g);
  if (parts.length === 1) return label;
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="mx-0.5 inline rounded bg-[#F0F0F0] px-1 py-0.5 font-mono text-[11px] text-[#434343]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const STREAM_TICK_MS = 36;
const STREAM_TOOL_TICKS = 18;

/**
 * 一轮思考后：生成中逐条扫光；完成后收成一条摘要，点击展开明细
 */
function CotActionRows({
  items,
  collapsed,
  revealedCount,
  shimmerIndex,
}: {
  items: SkillThinkCotChild[];
  collapsed: boolean;
  revealedCount: number;
  shimmerIndex: number;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const primary = items[0];
  const summary = cotSummaryLabel(items);
  const rowClass =
    'flex items-center gap-1.5 py-0.5 text-[12px] leading-[18px] text-[#595959]';

  if (!collapsed) {
    const visible = items.slice(0, Math.max(0, revealedCount));
    if (visible.length === 0) return null;
    return (
      <div className="mt-1.5 space-y-0.5 animate-in fade-in duration-200">
        {visible.map((item, idx) => {
          const shimmer = idx === shimmerIndex;
          return (
            <div key={item.id} className={rowClass} title={item.label}>
              <CotKindIcon kind={item.kind} />
              <span
                className={cn(
                  'min-w-0 truncate',
                  shimmer && 'skill-thinking-generating-title',
                )}
              >
                {renderCotLabel(item.label)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-1.5 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5 text-left text-[12px] leading-[18px] text-[#595959] hover:bg-[#F7F7F7] cursor-pointer"
        aria-expanded={open}
      >
        <CotKindIcon kind={primary.kind} />
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown size={12} className="shrink-0 text-[#BFBFBF]" />
      </button>
      {open ? (
        <div className="mt-0.5 space-y-0.5 animate-in fade-in duration-150">
          {items.map((item) => (
            <div key={item.id} className={rowClass} title={item.label}>
              <CotKindIcon kind={item.kind} />
              <span className="min-w-0 truncate">{renderCotLabel(item.label)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ThinkProseBody({
  steps,
  paragraphs,
  charCount,
  showCaret,
  collapsed,
  toolRevealed,
  shimmerTool,
}: {
  steps: SkillThinkStep[];
  paragraphs: string[];
  charCount: number;
  showCaret: boolean;
  collapsed: boolean;
  toolRevealed: number[];
  shimmerTool: { step: number; index: number } | null;
}) {
  const visible = sliceParagraphs(paragraphs, charCount);
  if (visible.length === 0 && !showCaret) return null;

  let consumed = 0;
  const completedStepIndexes = new Set<number>();
  for (let i = 0; i < paragraphs.length; i += 1) {
    consumed += paragraphs[i].length;
    if (charCount >= consumed) completedStepIndexes.add(i);
  }

  return (
    <div className="px-3 pb-3">
      {visible.map((text, i) => {
        const isLast = i === visible.length - 1;
        const step = steps[i];
        const children = step?.children ?? [];
        const revealed = collapsed ? children.length : (toolRevealed[i] ?? 0);
        const showCot = completedStepIndexes.has(i) && children.length > 0 && revealed > 0;
        return (
          <div key={i} className={cn(i > 0 && 'pt-2')}>
            <p className="text-[12px] leading-[18px] text-[#595959] whitespace-pre-wrap break-words">
              {text}
              {showCaret && isLast ? (
                <span
                  className="ml-0.5 inline-block h-[12px] w-[2px] translate-y-[1px] bg-[#1565BF] align-middle animate-pulse"
                  aria-hidden
                />
              ) : null}
            </p>
            {showCot ? (
              <CotActionRows
                items={children}
                collapsed={collapsed}
                revealedCount={revealed}
                shimmerIndex={
                  shimmerTool && shimmerTool.step === i ? shimmerTool.index : -1
                }
              />
            ) : null}
          </div>
        );
      })}
      {showCaret && visible.length === 0 ? (
        <p className="text-[12px] leading-[18px] text-[#595959]">
          <span
            className="inline-block h-[12px] w-[2px] bg-[#1565BF] align-middle animate-pulse"
            aria-hidden
          />
        </p>
      ) : null}
    </div>
  );
}

export const SkillThinkingCard: React.FC<SkillThinkingCardProps> = ({
  title = SKILL_CREATE_CHAT.thinkInProgress,
  steps,
  durationSec = 0,
  isComplete,
  generating = false,
  loading = false,
  defaultExpanded,
  className,
}) => {
  const initialOpen = defaultExpanded ?? !isComplete;
  const [open, setOpen] = useState(initialOpen);
  const [streamedChars, setStreamedChars] = useState(0);
  const [toolRevealed, setToolRevealed] = useState<number[]>(() => steps.map(() => 0));
  const [shimmerTool, setShimmerTool] = useState<{ step: number; index: number } | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const streamedCharsRef = useRef(0);
  const wasCompleteRef = useRef(isComplete);

  const paragraphs = useMemo(() => stepsToParagraphs(steps), [steps]);
  const fullLen = useMemo(() => paragraphs.reduce((n, p) => n + p.length, 0), [paragraphs]);
  const statusHints = useMemo(() => steps.map(stepStatusHint), [steps]);
  const toolsCollapsed = isComplete || !generating;

  useEffect(() => {
    if (!isComplete && (loading || generating)) {
      setOpen(true);
      wasCompleteRef.current = false;
      return;
    }
    if (isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      const timer = window.setTimeout(() => setOpen(false), 520);
      return () => window.clearTimeout(timer);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete, loading, generating]);

  useEffect(() => {
    streamedCharsRef.current = streamedChars;
  }, [streamedChars]);

  useEffect(() => {
    if (streamTimerRef.current != null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }

    if (loading) {
      setStreamedChars(0);
      streamedCharsRef.current = 0;
      setToolRevealed(steps.map(() => 0));
      setShimmerTool(null);
      return;
    }

    if (isComplete || !generating) {
      setStreamedChars(fullLen);
      streamedCharsRef.current = fullLen;
      setToolRevealed(steps.map((s) => s.children?.length ?? 0));
      setShimmerTool(null);
      return;
    }

    setStreamedChars(0);
    streamedCharsRef.current = 0;
    setToolRevealed(steps.map(() => 0));
    setShimmerTool(null);

    let stepIdx = 0;
    let textPos = 0;
    let toolIdx = 0;
    let toolTick = 0;

    streamTimerRef.current = window.setInterval(() => {
      while (stepIdx < steps.length) {
        const para = paragraphs[stepIdx] ?? '';
        const tools = steps[stepIdx]?.children ?? [];
        if (textPos < para.length) {
          textPos += 1;
          streamedCharsRef.current += 1;
          setStreamedChars(streamedCharsRef.current);
          setShimmerTool(null);
          return;
        }
        if (toolIdx < tools.length) {
          if (toolTick === 0) {
            const revealAt = toolIdx;
            setToolRevealed((prev) => {
              const next = prev.length === steps.length ? [...prev] : steps.map(() => 0);
              next[stepIdx] = revealAt + 1;
              return next;
            });
            setShimmerTool({ step: stepIdx, index: revealAt });
          }
          toolTick += 1;
          if (toolTick >= STREAM_TOOL_TICKS) {
            toolIdx += 1;
            toolTick = 0;
          }
          return;
        }
        stepIdx += 1;
        textPos = 0;
        toolIdx = 0;
        toolTick = 0;
      }
      setShimmerTool(null);
      if (streamTimerRef.current != null) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }, STREAM_TICK_MS);

    return () => {
      if (streamTimerRef.current != null) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, [loading, generating, isComplete, fullLen, steps, paragraphs]);

  const activeIdx = useMemo(
    () => activeParagraphIndex(paragraphs, streamedChars),
    [paragraphs, streamedChars],
  );

  const headerTitle = useMemo(() => {
    if (loading) return SKILL_CREATE_CHAT.thinkInProgress;
    if (generating && !isComplete) {
      const introChars = 22;
      if (streamedChars < introChars) return SKILL_CREATE_CHAT.thinkInProgress;
      return statusHints[activeIdx] || statusHints[0] || SKILL_CREATE_CHAT.thinkInProgress;
    }
    if (isComplete) return SKILL_CREATE_CHAT.thinkDone;
    return title || SKILL_CREATE_CHAT.thinkInProgress;
  }, [loading, generating, isComplete, title, statusHints, activeIdx, streamedChars]);

  const showShimmerTitle = loading || (generating && !isComplete);
  const showProseBody = !loading && fullLen > 0;
  const streaming = generating && !isComplete && streamedChars < fullLen;
  const bodyCharCount = isComplete || !generating ? fullLen : streamedChars;
  const durationText = isComplete ? SKILL_CREATE_CHAT.durationSuffix(durationSec) : '';

  return (
    <div className={cn('w-full min-w-0 font-sans', className)}>
      <div className="overflow-hidden rounded-lg border border-[#EBEBEB] bg-white">
        <CardHeader open={open} onToggle={() => setOpen((v) => !v)}>
          <div className="flex min-w-0 items-center gap-2">
            {showShimmerTitle ? (
              <GeneratingTitle key={headerTitle} text={headerTitle} />
            ) : (
              <span className="text-[13px] font-semibold leading-5 text-neutral-600">
                {headerTitle}
                {durationText ? (
                  <span className="font-normal tabular-nums text-neutral-400">{durationText}</span>
                ) : null}
              </span>
            )}
          </div>
        </CardHeader>

        {open && showProseBody ? (
          <ThinkProseBody
            steps={steps}
            paragraphs={paragraphs}
            charCount={bodyCharCount}
            showCaret={streaming && !shimmerTool}
            collapsed={toolsCollapsed}
            toolRevealed={toolRevealed}
            shimmerTool={shimmerTool}
          />
        ) : null}
      </div>
    </div>
  );
};

/** 估算深度思考流式时长（ms），含工具扫光，供播放编排对齐 */
export function estimateThinkStreamMs(steps: SkillThinkStep[]): number {
  const textLen = stepsToParagraphs(steps).reduce((n, p) => n + p.length, 0);
  const toolCount = steps.reduce((n, s) => n + (s.children?.length ?? 0), 0);
  return Math.min(
    18000,
    Math.max(
      3200,
      textLen * STREAM_TICK_MS + toolCount * STREAM_TOOL_TICKS * STREAM_TICK_MS + 480,
    ),
  );
}
