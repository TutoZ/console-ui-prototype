/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 深度思考卡（Cot / jd-think）— 与任务规划（SkillTaskPlanCard）分离
 * https://jdesign.jd.com/x/vue/component/cot
 *
 * - loading     扫光「思考中」
 * - generating  先「思考中」，再正文打字机 + 标题随段落切换
 * - 完成态      「已完成思考 · Ns」· 可折叠全文
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
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

function ThinkProseBody({
  paragraphs,
  charCount,
  showCaret,
}: {
  paragraphs: string[];
  charCount: number;
  showCaret: boolean;
}) {
  const visible = sliceParagraphs(paragraphs, charCount);
  if (visible.length === 0 && !showCaret) return null;

  return (
    <div className="px-3 pb-3">
      {visible.map((text, i) => {
        const isLast = i === visible.length - 1;
        return (
          <p
            key={i}
            className={cn(
              'text-[12px] leading-[18px] text-[#595959] whitespace-pre-wrap break-words',
              i > 0 && 'pt-2',
            )}
          >
            {text}
            {showCaret && isLast ? (
              <span
                className="ml-0.5 inline-block h-[12px] w-[2px] translate-y-[1px] bg-[#1565BF] align-middle animate-pulse"
                aria-hidden
              />
            ) : null}
          </p>
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
  const streamTimerRef = useRef<number | null>(null);
  const streamedCharsRef = useRef(0);
  const wasCompleteRef = useRef(isComplete);

  const paragraphs = useMemo(() => stepsToParagraphs(steps), [steps]);
  const fullLen = useMemo(() => paragraphs.reduce((n, p) => n + p.length, 0), [paragraphs]);
  const statusHints = useMemo(() => steps.map(stepStatusHint), [steps]);

  useEffect(() => {
    if (!isComplete && (loading || generating)) {
      setOpen(true);
      wasCompleteRef.current = false;
      return;
    }
    // 仅在「进行中 → 完成」时自动收起；展台传 defaultExpanded 的完成态不受影响
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
      return;
    }

    if (isComplete || !generating) {
      setStreamedChars(fullLen);
      streamedCharsRef.current = fullLen;
      return;
    }

    // 流式打字机：正文逐字露出，标题随段落切换；与 estimateThinkStreamMs 编排对齐
    const tickMs = 36;
    const charsPerTick = 1;
    streamTimerRef.current = window.setInterval(() => {
      const next = Math.min(fullLen, streamedCharsRef.current + charsPerTick);
      streamedCharsRef.current = next;
      setStreamedChars(next);
      if (next >= fullLen) {
        if (streamTimerRef.current != null) {
          window.clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
      }
    }, tickMs);

    return () => {
      if (streamTimerRef.current != null) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, [loading, generating, isComplete, fullLen]);

  const activeIdx = useMemo(
    () => activeParagraphIndex(paragraphs, streamedChars),
    [paragraphs, streamedChars],
  );

  const headerTitle = useMemo(() => {
    // 先扫光「思考中」，再随段落切到步骤摘要
    if (loading) return SKILL_CREATE_CHAT.thinkInProgress;
    if (generating && !isComplete) {
      const introChars = 22; // ≈0.8s，先稳住「思考中」再切换
      if (streamedChars < introChars) return SKILL_CREATE_CHAT.thinkInProgress;
      return statusHints[activeIdx] || statusHints[0] || SKILL_CREATE_CHAT.thinkInProgress;
    }
    if (isComplete) return SKILL_CREATE_CHAT.thinkDone;
    return title || SKILL_CREATE_CHAT.thinkInProgress;
  }, [loading, generating, isComplete, title, statusHints, activeIdx, streamedChars]);

  const showShimmerTitle = loading || (generating && !isComplete);
  /** 加载态仅标题；生成中起打字机展示正文 */
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
            paragraphs={paragraphs}
            charCount={bodyCharCount}
            showCaret={streaming}
          />
        ) : null}
      </div>
    </div>
  );
};

/** 估算深度思考流式时长（ms），供播放编排对齐 — 约 28 字/秒 */
export function estimateThinkStreamMs(steps: SkillThinkStep[]): number {
  const len = stepsToParagraphs(steps).reduce((n, p) => n + p.length, 0);
  const tickMs = 36;
  const charsPerTick = 1;
  return Math.min(14000, Math.max(2800, Math.ceil(len / charsPerTick) * tickMs + 480));
}
