/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 技能表单字段 + “改写”：悬浮叠在输入框上（不占文案位），点击后在下方浮层输入指令并写回。
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  AI_GRADIENT_TEXT,
  AI_REWRITE_CHIP,
} from '@/lib/ui';

export async function mockSkillFieldRewrite(
  currentValue: string,
  instruction: string,
  maxLength: number,
  fieldLabel?: string,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const instr = instruction.trim();
  if (!instr) return currentValue;

  const seed = currentValue.trim() || fieldLabel || '内容';

  if (/清空|删除|重置/.test(instr)) return '';
  if (/精简|缩短|更短|简洁/.test(instr)) {
    const shortened = seed
      .replace(/[，,；;].+$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, Math.min(maxLength, Math.max(12, Math.floor(seed.length * 0.72))));
    return (shortened || seed).slice(0, maxLength);
  }
  if (/英文|代号|en/i.test(instr) && maxLength <= 50) {
    return seed
      .toLowerCase()
      .replace(/[^a-z0-9_\u4e00-\u9fff\s]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, maxLength);
  }
  if (/口语|通俗|易懂/.test(instr)) {
    return seed.replace(/须|应|严禁|不得/g, '要').replace(/；/g, '，').slice(0, maxLength);
  }
  if (/专业|正式|规范/.test(instr)) {
    const normalized = seed.endsWith('。') || seed.endsWith('；') ? seed : `${seed}。`;
    return normalized.slice(0, maxLength);
  }
  if (/补充|扩展|详细|加上/.test(instr)) {
    const hint = instr.replace(/^(请|帮我|把|将|补充|扩展|详细|加上)/g, '').trim();
    const merged = `${seed}${/[。.；;]$/.test(seed) ? '' : '；'}${hint || instr}`;
    return merged.slice(0, maxLength);
  }

  const merged =
    instr.length > 10
      ? `${seed.replace(/[。.]$/, '')}（${instr.slice(0, 48)}）`
      : `${instr}：${seed}`;
  return merged.slice(0, maxLength);
}

type SkillRewriteContextValue = {
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  getInstruction: (key: string) => string;
  setInstruction: (key: string, value: string) => void;
  rewritingKey: string | null;
  setRewritingKey: (key: string | null) => void;
  onDirty?: () => void;
  onToast?: (message: string) => void;
};

const SkillRewriteContext = createContext<SkillRewriteContextValue | null>(null);

export function SkillRewriteProvider({
  children,
  onDirty,
  onToast,
}: {
  children: React.ReactNode;
  onDirty?: () => void;
  onToast?: (message: string) => void;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [rewritingKey, setRewritingKey] = useState<string | null>(null);

  const value = useMemo<SkillRewriteContextValue>(
    () => ({
      activeKey,
      setActiveKey,
      getInstruction: (key) => instructions[key] ?? '',
      setInstruction: (key, v) => setInstructions((prev) => ({ ...prev, [key]: v })),
      rewritingKey,
      setRewritingKey,
      onDirty,
      onToast,
    }),
    [activeKey, instructions, rewritingKey, onDirty, onToast],
  );

  return <SkillRewriteContext.Provider value={value}>{children}</SkillRewriteContext.Provider>;
}

function useSkillRewrite() {
  const ctx = useContext(SkillRewriteContext);
  if (!ctx) {
    throw new Error('SkillRewriteField must be used within SkillRewriteProvider');
  }
  return ctx;
}

export type SkillRewriteFieldProps = {
  fieldKey: string;
  fieldLabel?: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  error?: React.ReactNode;
  afterInput?: React.ReactNode;
  mono?: boolean;
  labelClassName?: string;
  onApplyRewrite?: (instruction: string, currentValue: string) => string | Promise<string>;
};

export const SkillRewriteField: React.FC<SkillRewriteFieldProps> = ({
  fieldKey,
  fieldLabel,
  label,
  value,
  onChange,
  maxLength = 200,
  multiline = false,
  rows = 2,
  id,
  placeholder,
  disabled = false,
  className,
  inputClassName,
  error,
  afterInput,
  mono = false,
  labelClassName,
  onApplyRewrite,
}) => {
  const {
    activeKey,
    setActiveKey,
    getInstruction,
    setInstruction,
    rewritingKey,
    setRewritingKey,
    onDirty,
    onToast,
  } = useSkillRewrite();

  const isOpen = activeKey === fieldKey;
  const isRewriting = rewritingKey === fieldKey;
  const instruction = getInstruction(fieldKey);
  const bubbleRef = useRef<HTMLTextAreaElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const bubbleShellRef = useRef<HTMLDivElement>(null);
  const [bubbleRect, setBubbleRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const updateBubbleRect = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setBubbleRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setBubbleRect(null);
      return;
    }
    updateBubbleRect();
    bubbleRef.current?.focus();

    const onLayoutChange = () => updateBubbleRect();
    window.addEventListener('scroll', onLayoutChange, true);
    window.addEventListener('resize', onLayoutChange);
    return () => {
      window.removeEventListener('scroll', onLayoutChange, true);
      window.removeEventListener('resize', onLayoutChange);
    };
  }, [isOpen, updateBubbleRect]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (isRewriting) return;
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (bubbleShellRef.current?.contains(target)) return;
      if ((event.target as Element).closest('[data-skill-rewrite-toggle]')) return;
      setActiveKey(null);
      setInstruction(fieldKey, '');
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [fieldKey, isOpen, isRewriting, setActiveKey, setInstruction]);

  const submitRewrite = useCallback(async () => {
    const trimmed = instruction.trim();
    if (!trimmed || disabled || isRewriting) return;

    setRewritingKey(fieldKey);
    try {
      const apply = onApplyRewrite ?? ((instr, current) =>
        mockSkillFieldRewrite(current, instr, maxLength, fieldLabel));
      const next = await apply(trimmed, value);
      onChange(next.slice(0, maxLength));
      onDirty?.();
      setActiveKey(null);
      setInstruction(fieldKey, '');
    } finally {
      setRewritingKey(null);
    }
  }, [
    disabled,
    fieldKey,
    fieldLabel,
    instruction,
    isRewriting,
    maxLength,
    onApplyRewrite,
    onChange,
    onDirty,
    setActiveKey,
    setInstruction,
    setRewritingKey,
    value,
  ]);

  const sharedInputClass = cn(
    'w-full bg-white text-xs text-neutral-800 placeholder:text-neutral-400 outline-none transition disabled:opacity-50',
    'border border-neutral-200 rounded-[7px]',
    'focus:border-neutral-800 focus:ring-1 focus:ring-neutral-200',
    mono && 'font-mono',
    inputClassName,
  );

  const floatingBubble =
    isOpen && bubbleRect
      ? createPortal(
          <div
            ref={bubbleShellRef}
            data-skill-rewrite-bubble
            className="fixed z-[130] rounded-2xl border border-neutral-900 bg-white shadow-[0_8px_28px_rgba(17,17,17,0.12)] animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: bubbleRect.top,
              left: bubbleRect.left,
              width: bubbleRect.width,
            }}
          >
            <textarea
              ref={bubbleRef}
              rows={3}
              value={instruction}
              disabled={isRewriting}
              onChange={(e) => setInstruction(fieldKey, e.target.value)}
              onKeyDown={(e) => {
                if (isRewriting) {
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Escape') {
                  setActiveKey(null);
                  setInstruction(fieldKey, '');
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submitRewrite();
                }
              }}
              placeholder="描述如何改写这段内容…"
              className={cn(
                'w-full min-h-[96px] max-h-40 bg-transparent text-[13px] px-4 pt-4 pb-14 outline-none resize-none placeholder:text-neutral-400 text-neutral-800 leading-relaxed rounded-2xl',
                isRewriting && 'opacity-70 cursor-wait',
              )}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                disabled={isRewriting || !instruction.trim()}
                onClick={() => void submitRewrite()}
                title={isRewriting ? '改写中' : '应用改写'}
                aria-busy={isRewriting}
                className={cn(
                  'w-8 h-8 rounded-lg text-white transition flex items-center justify-center shrink-0',
                  isRewriting
                    ? 'bg-neutral-900 cursor-wait'
                    : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer disabled:bg-neutral-200 disabled:cursor-not-allowed',
                )}
              >
                {isRewriting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowUp size={14} />
                )}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className={cn('flex items-center justify-between gap-2', labelClassName ?? 'text-xs font-medium text-neutral-600')}>
        <span className="min-w-0">{label}</span>
      </label>

      <div ref={anchorRef} className="relative group">
        {multiline ? (
          <textarea
            id={id}
            disabled={disabled || isRewriting}
            maxLength={maxLength}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              sharedInputClass,
              'px-2.5 py-2 leading-relaxed',
              /* 仅给字数角标留底边，改写按钮悬浮叠层不占文案位 */
              maxLength && 'pb-7',
            )}
          />
        ) : (
          <input
            id={id}
            type="text"
            disabled={disabled || isRewriting}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              sharedInputClass,
              'h-8 px-2.5',
              mono ? 'font-mono' : undefined,
              /* 仅给字数角标留右内边距，改写悬浮不额外占位 */
              maxLength && 'pr-9',
            )}
          />
        )}
        {maxLength ? (
          <span
            className={cn(
              'pointer-events-none absolute text-[9px] font-mono tabular-nums text-neutral-300/70',
              multiline ? 'bottom-2.5 right-2.5' : 'right-2.5 top-1/2 -translate-y-1/2',
              value.length >= maxLength && 'text-amber-500/80',
            )}
          >
            {value.length}/{maxLength}
          </span>
        ) : null}
        <button
          type="button"
          data-skill-rewrite-toggle
          disabled={disabled || isRewriting}
          onClick={() => {
            if (isOpen) {
              setActiveKey(null);
              setInstruction(fieldKey, '');
            } else {
              setActiveKey(fieldKey);
            }
          }}
          className={cn(
            AI_REWRITE_CHIP,
            'absolute z-[1] border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(17,17,17,0.08)]',
            multiline ? 'right-1.5 top-1.5' : 'right-1.5 top-1/2 -translate-y-1/2',
            // 选中 / 悬停：不透明实底，避免下方文字透出或点穿
            isOpen
              ? 'opacity-100 bg-neutral-50'
              : 'opacity-0 hover:bg-neutral-50',
            !isOpen && 'group-hover:opacity-100 group-focus-within:opacity-100',
            !isOpen &&
              'pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto',
            isOpen && 'pointer-events-auto',
            (disabled || isRewriting) && 'opacity-50 cursor-not-allowed pointer-events-none',
          )}
        >
          <img
            src="/assets/ai-star-rewrite.svg"
            alt=""
            width={12}
            height={12}
            className="size-3 shrink-0"
            aria-hidden
          />
          <span className={AI_GRADIENT_TEXT}>改写</span>
        </button>
      </div>

      {floatingBubble}

      {error}
      {afterInput}
    </div>
  );
};
