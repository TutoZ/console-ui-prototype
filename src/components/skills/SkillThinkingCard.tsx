/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 深度思考卡（Cot / jd-think）— 与任务规划（SkillTaskPlanCard）分离
 * https://jdesign.jd.com/x/vue/component/cot
 *
 * - loading     思考中（扫光标题）
 * - generating  正文流式输出
 * - 完成态      「已完成思考」· defaultExpanded · 段落全文
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';

export type SkillThinkingCardProps = {
  title?: string;
  steps: SkillThinkStep[];
  durationSec?: number;
  isComplete: boolean;
  /** 生成中：渐变标题 + 正文流式 */
  generating?: boolean;
  /** 纯加载态：先于正文出现 */
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
  if (!detail) return '深度思考';
  // 取首句作中间态规划摘要
  const first = detail.split(/[。！？\n]/)[0]?.trim() ?? '';
  return first.slice(0, 18) || '深度思考';
}

/** 根据已流出字数定位当前段落 index */
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
    <span className="skill-thinking-generating-title text-[14px] font-semibold leading-[22px]">
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
  title = '深度思考',
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

    // 流式：约 28～32 字/秒，贴近真实对话阅读节奏
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
    if (loading) {
      // 加载态也直接用首段规划摘要，不写「思考中」
      return statusHints[0] || title;
    }
    if (generating && !isComplete) {
      return statusHints[activeIdx] || statusHints[0] || title;
    }
    if (isComplete) return '已完成思考';
    return title;
  }, [loading, generating, isComplete, title, statusHints, activeIdx]);

  const showShimmerTitle = loading || (generating && !isComplete);
  const showProseBody = !loading && fullLen > 0;
  const streaming = generating && !isComplete && streamedChars < fullLen;

  return (
    <div className={cn('w-full min-w-0 font-sans', className)}>
      <div className="overflow-hidden rounded-lg border border-[#EBEBEB] bg-white">
        <CardHeader open={open} onToggle={() => setOpen((v) => !v)}>
          <div className="flex min-w-0 items-center gap-2">
            {showShimmerTitle ? (
              <GeneratingTitle text={headerTitle} />
            ) : (
              <span className="text-[14px] font-semibold leading-[22px] text-[#595959]">
                {headerTitle}
                {isComplete && durationSec > 0 && (
                  <span className="ml-1.5 text-[12px] font-normal tabular-nums text-[#B5B5B5]">
                    · {durationSec}s
                  </span>
                )}
              </span>
            )}
          </div>
        </CardHeader>

        {open && loading ? (
          <div className="px-3 pb-3">
            <p className="text-[14px] leading-[22px] text-[#8C8C8C] skill-collect-body-shimmer">
              正在理解问题并组织推理…
            </p>
          </div>
        ) : null}

        {open && showProseBody ? (
          <ThinkProseBody
            paragraphs={paragraphs}
            charCount={isComplete || !generating ? fullLen : streamedChars}
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
