/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 对话内任务大纲 / 思考过程卡 — 对齐 Figma B端 AI 组件规范四种中间态：
 * - outline   7066-75780  静态大纲
 * - executing 7066-75839  执行进度
 * - generating 442-1997   大纲生成中（渐变标题）
 * - nested    4226-10519  含子步骤大纲
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import { LoadingCircle } from '../common/ToastLoadingIcon';

export type SkillThinkingCardMode = 'outline' | 'executing' | 'generating' | 'nested';

export type SkillThinkingCardProps = {
  title?: string;
  steps: SkillThinkStep[];
  durationSec?: number;
  isComplete: boolean;
  /** 显式指定视觉模式；未传时按步骤状态自动推断 */
  mode?: SkillThinkingCardMode;
  /** 生成中：渐变标题 + 逐步露出步骤 */
  generating?: boolean;
  className?: string;
};

function formatStepTitle(step: SkillThinkStep, index: number): string {
  return `Step${index + 1} - ${step.label}`;
}

function resolveMode(
  mode: SkillThinkingCardMode | undefined,
  generating: boolean,
  steps: SkillThinkStep[],
): SkillThinkingCardMode {
  if (mode) return mode;
  if (generating) return 'generating';
  if (steps.some((s) => s.children && s.children.length > 0)) return 'nested';
  if (steps.some((s) => s.status === 'running' || s.status === 'done')) {
    return 'executing';
  }
  return 'outline';
}

function StaticDot({ className }: { className?: string }) {
  return <span className={cn('h-[4px] w-[4px] shrink-0 rounded-full bg-[#595959]', className)} />;
}

function PendingRing() {
  return (
    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full border border-[#D9D9D9]" />
    </span>
  );
}

function RunningRing() {
  return (
    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <LoadingCircle size={10} />
    </span>
  );
}

function StepStatusIcon({ status }: { status: SkillThinkStep['status'] }) {
  if (status === 'done') {
    return <CheckCircle2 size={14} className="shrink-0 text-[#52C41A]" strokeWidth={2} />;
  }
  if (status === 'running') {
    return <RunningRing />;
  }
  return <PendingRing />;
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

function CollapsibleStepItem({
  step,
  index,
  variant,
  expanded,
  onToggle,
}: {
  step: SkillThinkStep;
  index: number;
  variant: SkillThinkingCardMode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isPending = step.status === 'pending';
  const useStatusIcon = variant === 'executing';
  const title = formatStepTitle(step, index);
  const hasBody = Boolean(step.detail?.trim() || (step.children && step.children.length > 0));

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={hasBody ? onToggle : undefined}
        disabled={!hasBody}
        className={cn(
          'flex w-full min-h-[22px] items-start gap-1 text-left',
          hasBody ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-expanded={hasBody ? expanded : undefined}
      >
        <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          {useStatusIcon ? (
            <StepStatusIcon status={step.status} />
          ) : (
            <StaticDot className={isPending ? 'bg-[#B5B5B5]' : undefined} />
          )}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 text-[14px] leading-[22px]',
            variant === 'executing' && isPending ? 'text-[#B5B5B5]' : 'text-[#262626]',
          )}
        >
          {title}
        </span>
        {hasBody ? (
          <ChevronDown
            size={14}
            className={cn(
              'mt-[3px] shrink-0 text-[#B5B5B5] transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        ) : null}
      </button>

      {hasBody && expanded && (
        <div className="mt-1 ml-[18px] space-y-1.5 pl-2.5">
          {step.detail?.trim() ? (
            <p className="text-[12px] leading-relaxed text-[#8C8C8C] whitespace-pre-wrap break-words">
              {step.detail}
            </p>
          ) : null}
          {step.children?.map((child) => (
            <div key={child.id} className="flex min-h-[20px] items-center gap-1.5">
              <StaticDot className="bg-[#B5B5B5]" />
              <p className="min-w-0 flex-1 text-[12px] leading-[20px] text-[#8C8C8C]">{child.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const SkillThinkingCard: React.FC<SkillThinkingCardProps> = ({
  title = '思考过程',
  steps,
  durationSec = 0,
  isComplete,
  mode: modeProp,
  generating = false,
  className,
}) => {
  const variant = resolveMode(modeProp, generating, steps);
  const [open, setOpen] = useState(() => !isComplete);
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(() => new Set());

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const total = Math.max(steps.length, 1);
  const runningIndex = steps.findIndex((s) => s.status === 'running');
  const runningStepId = runningIndex >= 0 ? steps[runningIndex]?.id : null;
  const current =
    runningIndex >= 0 ? runningIndex + 1 : isComplete ? total : Math.min(doneCount + 1, total);

  const visibleCount = useMemo(() => {
    if (variant !== 'generating') return steps.length;
    if (steps.every((s) => s.status === 'pending')) return steps.length;
    if (runningIndex >= 0) return runningIndex + 1;
    if (doneCount > 0) return doneCount;
    return Math.min(2, steps.length);
  }, [variant, steps, runningIndex, doneCount]);

  useEffect(() => {
    if (!isComplete && (variant === 'executing' || variant === 'generating')) {
      setOpen(true);
    }
  }, [isComplete, variant]);

  useEffect(() => {
    if (!runningStepId) return;
    setExpandedStepIds((prev) => {
      if (prev.has(runningStepId)) return prev;
      const next = new Set(prev);
      next.add(runningStepId);
      return next;
    });
  }, [runningStepId]);

  const headerTitle = useMemo(() => {
    if (variant === 'generating') return '任务大纲生成中';
    if (variant === 'executing' && !isComplete) return `${current}/${total} 任务执行中`;
    if (variant === 'executing' && isComplete) return `${total}/${total} 任务已完成`;
    return title;
  }, [variant, current, total, title, isComplete]);

  const visibleSteps = steps.slice(0, visibleCount);

  const toggleStep = (stepId: string) => {
    setExpandedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <div className={cn('w-full min-w-0 font-sans', className)}>
      <div className="overflow-hidden rounded-lg border border-[#EBEBEB] bg-white">
        <CardHeader open={open} onToggle={() => setOpen((v) => !v)}>
          {variant === 'generating' ? (
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
        </CardHeader>

        {open && visibleSteps.length > 0 && (
          <div className="flex flex-col gap-2 px-3 pb-3">
            {visibleSteps.map((step, idx) => {
              const isLastGenerating = variant === 'generating' && idx === visibleSteps.length - 1;

              return (
                <div key={step.id} className="flex flex-col gap-1">
                  <CollapsibleStepItem
                    step={step}
                    index={idx}
                    variant={variant}
                    expanded={expandedStepIds.has(step.id)}
                    onToggle={() => toggleStep(step.id)}
                  />
                  {isLastGenerating && (
                    <span
                      className="ml-[18px] inline-block h-[14px] w-[2px] animate-pulse bg-[linear-gradient(180deg,#000000_0%,#1565BF_100%)]"
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
