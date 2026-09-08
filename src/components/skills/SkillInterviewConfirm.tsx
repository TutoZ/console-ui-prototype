/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 分轮澄清确认区 — 参考 Manus“应触发 / 不应触发”与一次一问，视觉对齐平台 token
 */

import React, { useEffect, useState } from 'react';
import { Check, Plus, X } from '@/lib/icons';
import { BTN_INK, BTN_OUTLINE, BTN_SOFT, FIELD, FIELD_CTRL, LABEL, PANEL, SKILL_AOP_ACCENT_TEXT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  SKILL_ARCHETYPE_META,
  suggestAntiTriggersForIntent,
  type InterviewQuestion,
  type InterviewQuestionKind,
  type SkillCapabilityCard,
  type SkillDataField,
} from '@/lib/skillStudioMock';

export type InterviewConfirmAction =
  | { type: 'confirm_understanding' }
  | { type: 'redo_intent' }
  | { type: 'confirm_triggers'; triggers: string[]; antiTriggers: string[] }
  | { type: 'confirm_unique_entry'; unique: boolean }
  | { type: 'confirm_data_fields'; fields: SkillDataField[] }
  | { type: 'confirm_rules' }
  | { type: 'confirm_knowledge' }
  | { type: 'confirm_api'; fields: SkillDataField[] }
  | { type: 'confirm_boundary' }
  | { type: 'confirm_outputs'; outputs: string[] };

export type InterviewPanelMode = 'idle' | 'confirm_type' | 'question';

export interface SkillInterviewConfirmProps {
  mode: InterviewPanelMode;
  card: SkillCapabilityCard | null;
  summary?: string;
  question: InterviewQuestion | null;
  questionIndex: number;
  questionTotal: number;
  onAction: (action: InterviewConfirmAction) => void;
  className?: string;
}

function OptionCard({
  active,
  label,
  hint,
  onClick,
}: {
  active?: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[10px] border px-3 py-2.5 cursor-pointer transition-colors',
        active
          ? 'border-neutral-800 bg-white ring-1 ring-neutral-800/10'
          : 'border-neutral-200 bg-white hover:bg-neutral-50',
      )}
    >
      <p className="text-xs font-medium text-neutral-800">{label}</p>
      {hint ? <p className="text-[11px] text-neutral-500 mt-0.5">{hint}</p> : null}
    </button>
  );
}

function TriggerBoard({
  include,
  exclude,
  onToggleInclude,
  onToggleExclude,
  onAddInclude,
}: {
  include: string[];
  exclude: string[];
  onToggleInclude: (t: string) => void;
  onToggleExclude: (t: string) => void;
  onAddInclude: (t: string) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className={cn(PANEL, 'p-2.5 shadow-none')}>
          <p className="text-[10px] font-semibold text-neutral-500 mb-1.5">应触发的表达</p>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {include.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onToggleInclude(t)}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-800 text-white px-2 py-0.5 text-[11px] cursor-pointer"
              >
                <Check size={10} />
                {t}
                <X size={10} className="opacity-50" />
              </button>
            ))}
          </div>
        </div>
        <div className={cn(PANEL, 'p-2.5 shadow-none')}>
          <p className="text-[10px] font-semibold text-neutral-500 mb-1.5">不应触发的表达</p>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {exclude.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onToggleExclude(t)}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 text-[11px] cursor-pointer"
              >
                {t}
                <X size={10} className="opacity-40" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="添加应触发说法"
          className={cn(FIELD, FIELD_CTRL, 'flex-1')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              onAddInclude(draft.trim());
              setDraft('');
            }
          }}
        />
        <button
          type="button"
          className={BTN_SOFT}
          onClick={() => {
            if (!draft.trim()) return;
            onAddInclude(draft.trim());
            setDraft('');
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export const SkillInterviewConfirm: React.FC<SkillInterviewConfirmProps> = ({
  mode,
  card,
  summary,
  question,
  questionIndex,
  questionTotal,
  onAction,
  className,
}) => {
  const [triggers, setTriggers] = useState<string[]>(card?.triggers ?? []);
  const [antiTriggers, setAntiTriggers] = useState<string[]>([]);
  const [fields, setFields] = useState<SkillDataField[]>(card?.dataFields ?? []);
  const [outputs, setOutputs] = useState<string[]>(card?.outputs ?? []);

  useEffect(() => {
    if (!card) return;
    setTriggers(card.triggers);
    setFields(card.dataFields);
    setOutputs(card.outputs);
    setAntiTriggers(suggestAntiTriggersForIntent(card.name || card.goals[0] || '', card.archetypes));
  }, [card, question?.id, mode]);

  if (mode === 'idle' || !card) return null;

  const kind: InterviewQuestionKind | null = question?.kind ?? null;

  return (
    <div className={cn('mx-3 mb-1', className)}>
      <div className={cn(PANEL, 'p-3 space-y-2.5 shadow-none border-neutral-200')}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-neutral-800">
              {mode === 'confirm_type' ? '确认理解' : '分轮澄清'}
            </p>
            <p className="text-[10px] text-neutral-500">
              {mode === 'confirm_type'
                ? '先对齐类型与目标，再一次确认一项关键信息'
                : question?.hint || '每轮只确认一件事'}
            </p>
          </div>
          {mode === 'question' && questionTotal > 0 && (
            <span className="text-[10px] tabular-nums text-neutral-500 bg-rail px-2 py-0.5 rounded-md">
              {questionIndex + 1}/{questionTotal}
            </span>
          )}
        </div>

        {mode === 'confirm_type' && (
          <>
            <p className="text-[11px] text-neutral-600 leading-relaxed whitespace-pre-wrap">
              {summary ||
                `识别为：${card.archetypes.map((a) => SKILL_ARCHETYPE_META[a].label).join(' + ')}`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {card.archetypes.map((a) => (
                <span
                  key={a}
                  className="rounded-md bg-rail px-2 py-0.5 text-[10px] text-neutral-700"
                >
                  {SKILL_ARCHETYPE_META[a].label}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                className={cn(BTN_INK, 'flex-1')}
                onClick={() => onAction({ type: 'confirm_understanding' })}
              >
                <Check size={14} />
                确认理解
              </button>
              <button
                type="button"
                className={BTN_OUTLINE}
                onClick={() => onAction({ type: 'redo_intent' })}
              >
                重新描述
              </button>
            </div>
          </>
        )}

        {mode === 'question' && kind === 'triggers' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <TriggerBoard
              include={triggers}
              exclude={antiTriggers}
              onToggleInclude={(t) => setTriggers((prev) => prev.filter((x) => x !== t))}
              onToggleExclude={(t) => setAntiTriggers((prev) => prev.filter((x) => x !== t))}
              onAddInclude={(t) => setTriggers((prev) => (prev.includes(t) ? prev : [...prev, t]))}
            />
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() =>
                onAction({ type: 'confirm_triggers', triggers, antiTriggers })
              }
            >
              确认触发边界
            </button>
          </>
        )}

        {mode === 'question' && kind === 'unique_entry' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className="space-y-1.5">
              <OptionCard
                label="是，相关意图都进入这里"
                hint="唯一入口 · 路由优先级提高"
                onClick={() => onAction({ type: 'confirm_unique_entry', unique: true })}
              />
              <OptionCard
                label="不是，只处理更窄的明确意图"
                hint="避免误抢其他业务 Skill"
                onClick={() => onAction({ type: 'confirm_unique_entry', unique: false })}
              />
            </div>
          </>
        )}

        {mode === 'question' && kind === 'data_fields' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className="space-y-1">
              {fields.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-2 text-xs cursor-pointer rounded-lg px-2 py-1.5 hover:bg-rail/60"
                >
                  <input
                    type="checkbox"
                    checked={f.checked}
                    onChange={() =>
                      setFields((prev) =>
                        prev.map((x) => (x.id === f.id ? { ...x, checked: !x.checked } : x)),
                      )
                    }
                  />
                  <span className="flex-1">{f.label}</span>
                  <span className="text-[10px] text-neutral-400 uppercase">{f.source}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_data_fields', fields })}
            >
              确认字段
            </button>
          </>
        )}

        {mode === 'question' && kind === 'rules' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {card.rules.map((r) => (
                <div key={r.id} className="rounded-[10px] bg-rail/50 border border-line px-2.5 py-2">
                  <p className="text-[11px] text-neutral-500">IF {r.when}</p>
                  <p className="text-[11px] font-semibold text-neutral-800 mt-0.5">THEN {r.then}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_rules' })}
            >
              规则无误，继续
            </button>
          </>
        )}

        {mode === 'question' && kind === 'knowledge' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className={cn(PANEL, 'p-3 text-xs space-y-1.5 shadow-none')}>
              <p>
                <span className={LABEL}>知识来源</span>
                <br />
                <span className="font-medium">{card.knowledgeSource || '—'}</span>
              </p>
              <p>
                <span className={LABEL}>判断目标</span>
                <br />
                <span className="font-medium">{card.judgeTarget || '—'}</span>
              </p>
              <p className="text-neutral-700">
                是 → {card.judgeActions.yes || '—'}
                <br />
                否 → {card.judgeActions.no || '—'}
              </p>
            </div>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_knowledge' })}
            >
              确认并继续
            </button>
          </>
        )}

        {mode === 'question' && kind === 'api_strategy' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            {fields.map((f) => (
              <div
                key={f.id}
                className="flex justify-between text-xs rounded-lg border border-line bg-white px-2.5 py-1.5"
              >
                <span>{f.label}</span>
                <span className={cn('font-mono text-[10px]', SKILL_AOP_ACCENT_TEXT)}>→ API</span>
              </div>
            ))}
            <p className="text-[11px] text-rose-600">
              将写入：禁止推测 / 示例数据，字段须来自 API
            </p>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_api', fields })}
            >
              确认执行约束
            </button>
          </>
        )}

        {mode === 'question' && kind === 'boundary' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className={cn(PANEL, 'p-3 text-xs space-y-1.5 shadow-none')}>
              <p>能答：{card.canAnswer.join('、') || '—'}</p>
              <p>不能答：{card.cannotAnswer.join('、') || '—'}</p>
              <p>兜底：{card.fallbackScript || '—'}</p>
            </div>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_boundary' })}
            >
              确认边界
            </button>
          </>
        )}

        {mode === 'question' && kind === 'outputs' && (
          <>
            <p className="text-[11px] text-neutral-600">{question?.prompt}</p>
            <div className="flex flex-wrap gap-1.5">
              {outputs.map((o) => (
                <span
                  key={o}
                  className="rounded-md bg-rail px-2 py-0.5 text-[11px] text-neutral-700"
                >
                  {o}
                </span>
              ))}
            </div>
            <button
              type="button"
              className={cn(BTN_INK, 'w-full')}
              onClick={() => onAction({ type: 'confirm_outputs', outputs })}
            >
              确认产出
            </button>
          </>
        )}
      </div>
    </div>
  );
};
