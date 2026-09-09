/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 技能创建首轮反问 — “补充信息”选择题卡
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { BTN_SOFT, SKILL_AOP_PRIMARY_BTN } from '@/lib/ui';
import { SKILL_CREATE_CHAT } from '@/lib/platformTerminology';

export type SkillClarifyOption = {
  id: string;
  label: string;
};

export type SkillClarifyQuestion = {
  id: string;
  prompt: string;
  required?: boolean;
  options: SkillClarifyOption[];
  selectedId?: string | null;
};

export type SkillClarifyPayload = {
  questions: SkillClarifyQuestion[];
  submitted?: boolean;
  skipped?: boolean;
  collapsed?: boolean;
};

type SkillClarifyCardProps = {
  payload: SkillClarifyPayload;
  onChange: (payload: SkillClarifyPayload) => void;
  onSubmit: (payload: SkillClarifyPayload) => void;
  onSkip: () => void;
};

export const SkillClarifyCard: React.FC<SkillClarifyCardProps> = ({
  payload,
  onChange,
  onSubmit,
  onSkip,
}) => {
  const [questions, setQuestions] = useState(payload.questions);
  const [collapsed, setCollapsed] = useState(Boolean(payload.collapsed));
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const locked = Boolean(payload.submitted || payload.skipped);

  useEffect(() => {
    setQuestions(payload.questions);
    if (payload.collapsed != null) setCollapsed(Boolean(payload.collapsed));
  }, [payload.questions, payload.collapsed]);

  useEffect(() => {
    if (locked) setCollapsed(true);
  }, [locked]);

  const canSubmit = useMemo(
    () =>
      questions.every((q) => {
        if (!q.required) return true;
        return Boolean(q.selectedId);
      }),
    [questions],
  );

  const commitQuestions = (next: SkillClarifyQuestion[]) => {
    setQuestions(next);
    onChange({ ...payload, questions: next, collapsed });
  };

  const selectOption = (questionId: string, optionId: string) => {
    if (locked) return;
    commitQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, selectedId: q.selectedId === optionId ? null : optionId } : q,
      ),
    );
  };

  const addCustomOption = (questionId: string) => {
    const label = customDraft.trim();
    if (!label || locked) return;
    const customId = `custom-${Date.now()}`;
    commitQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [...q.options, { id: customId, label }],
              selectedId: customId,
            }
          : q,
      ),
    );
    setCustomDraft('');
    setAddingFor(null);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    onChange({ ...payload, questions, collapsed: next });
  };

  return (
    <div className="rounded-xl border border-[#E9EAEB] bg-white overflow-hidden shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
      <button
        type="button"
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-[#E9EAEB] bg-white hover:bg-neutral-50/80 transition cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-600 leading-5">
          <Pencil size={13} className="text-neutral-500" />
          {SKILL_CREATE_CHAT.clarifyTitle}
          {payload.submitted ? (
            <span className="h-5 px-1.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {SKILL_CREATE_CHAT.clarifySubmitted}
            </span>
          ) : payload.skipped ? (
            <span className="h-5 px-1.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
              {SKILL_CREATE_CHAT.clarifySkipped}
            </span>
          ) : null}
        </span>
        {collapsed ? (
          <ChevronDown size={16} className="text-neutral-400" />
        ) : (
          <ChevronUp size={16} className="text-neutral-400" />
        )}
      </button>

      {!collapsed ? (
        <div className="px-4 py-4 space-y-5">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2.5">
              <p className="text-[14px] leading-[22px] text-[#181D27]">
                <span className="font-semibold tabular-nums">{index + 1}. </span>
                {question.prompt}
                {question.required ? <span className="text-rose-500 ml-0.5">*</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {question.options.map((option) => {
                  const selected = question.selectedId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={locked}
                      onClick={() => selectOption(question.id, option.id)}
                      className={cn(
                        'inline-flex items-center gap-2 h-9 max-w-full px-3 rounded-full border text-[13px] text-[#181D27] transition cursor-pointer',
                        selected
                          ? 'border-[#181D27]/25 bg-[#F9F9FB] shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
                          : 'border-[#E9EAEB] bg-white hover:border-[#181D27]/15 hover:bg-neutral-50',
                        locked && 'opacity-70 cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center',
                          selected ? 'border-[#181D27]' : 'border-[#D5D7DA]',
                        )}
                        aria-hidden
                      >
                        {selected ? <span className="w-1.5 h-1.5 rounded-full bg-[#181D27]" /> : null}
                      </span>
                      <span className="truncate text-left">{option.label}</span>
                    </button>
                  );
                })}

                {addingFor === question.id ? (
                  <div className="inline-flex items-center gap-1.5 h-9 px-2 rounded-full border border-[#E9EAEB] bg-white">
                    <input
                      autoFocus
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomOption(question.id);
                        }
                        if (e.key === 'Escape') {
                          setAddingFor(null);
                          setCustomDraft('');
                        }
                      }}
                      placeholder="输入自定义选项"
                      className="w-[min(220px,40vw)] bg-transparent text-[13px] outline-none placeholder:text-[#B0B2B8]"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomOption(question.id)}
                      className="text-[12px] font-medium text-[#181D27] hover:opacity-70 cursor-pointer shrink-0"
                    >
                      确定
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setAddingFor(question.id);
                      setCustomDraft('');
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-[#E9EAEB] text-[13px] text-[#717680] hover:border-[#181D27]/20 hover:text-[#181D27] transition cursor-pointer',
                      locked && 'opacity-50 cursor-default',
                    )}
                  >
                    <Plus size={14} />
                    添加项
                  </button>
                )}
              </div>
            </div>
          ))}

          {locked ? null : (
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() =>
                  onSubmit({
                    ...payload,
                    questions,
                    submitted: true,
                    skipped: false,
                    collapsed: true,
                  })
                }
                className={cn(
                  'h-9 px-5 rounded-lg text-[14px] font-medium transition cursor-pointer',
                  canSubmit
                    ? cn(SKILL_AOP_PRIMARY_BTN, 'h-9 px-5 text-[14px]')
                    : 'bg-[#F5F5F5] text-[#B0B2B8] cursor-not-allowed',
                )}
              >
                提交
              </button>
              <button
                type="button"
                onClick={onSkip}
                className={cn(BTN_SOFT, 'h-9 px-5 text-[14px]')}
              >
                跳过
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
