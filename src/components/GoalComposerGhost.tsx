/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 技能 / 智能创建落地页输入框打字机 Ghost（与 BuildSkillModal 落地页一致）
 */

import React, { useEffect, useState } from 'react';

const TAB_HOLD_MS = 2800;

export type GoalComposerGhostVariant = 'skill' | 'employee';

export function formatGoalGhostText(label: string, variant: GoalComposerGhostVariant) {
  return variant === 'employee'
    ? `帮我创建一个「${label}」数字员工`
    : `帮我做一个「${label}」技能`;
}

export function GoalComposerGhost({
  labels,
  tipIndex,
  onTipIndexChange,
  onAcceptTab,
  variant = 'skill',
}: {
  labels: readonly string[];
  tipIndex: number;
  onTipIndexChange: (index: number) => void;
  onAcceptTab: () => void;
  variant?: GoalComposerGhostVariant;
}) {
  const fullText = formatGoalGhostText(labels[tipIndex % labels.length], variant);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing');
  const [showTab, setShowTab] = useState(false);

  useEffect(() => {
    setCharCount(0);
    setPhase('typing');
    setShowTab(false);
  }, [tipIndex, fullText, variant]);

  useEffect(() => {
    const len = fullText.length;
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (charCount < len) {
        timer = setTimeout(() => setCharCount((c) => c + 1), 68);
      } else {
        setPhase('hold');
        setShowTab(true);
      }
    } else if (phase === 'hold') {
      timer = setTimeout(() => {
        setShowTab(false);
        setPhase('deleting');
      }, TAB_HOLD_MS);
    } else if (charCount > 0) {
      timer = setTimeout(() => setCharCount((c) => c - 1), 32);
    } else {
      onTipIndexChange((tipIndex + 1) % labels.length);
      setPhase('typing');
    }

    return () => clearTimeout(timer);
  }, [phase, charCount, fullText, tipIndex, labels.length, onTipIndexChange, showTab]);

  const displayed = fullText.slice(0, charCount);

  return (
    <div
      className="absolute inset-x-0 top-0 z-0 min-h-[80px] px-1 pt-1 pb-2 text-[14px] leading-[21px] pointer-events-none flex items-start flex-wrap gap-x-1 gap-y-1"
      aria-hidden
    >
      <span className="text-[#B0B2B8]">
        {displayed}
        <span className="inline-block w-[1.5px] h-[15px] ml-px align-[-2px] bg-[#B0B2B8]/75 animate-pulse" />
      </span>
      {showTab ? (
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-0.5 h-[22px] px-1.5 rounded-md border border-[#E9EAEB] bg-white text-[11px] font-medium text-[#535862] shadow-[0_1px_2px_rgba(17,17,17,0.04)] cursor-pointer hover:border-neutral-300 hover:text-neutral-800"
          onClick={onAcceptTab}
          title="按 Tab 填入示例描述"
        >
          Tab <span className="text-[10px] leading-none">⇥</span>
        </button>
      ) : null}
    </div>
  );
}
