/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一轮拆解后的确认节点 — 对齐 Figma 4839:27361「确认信息」
 * 编辑：点铅笔后在下方对话输入框改写，本卡用序号索引高亮对应行
 */

import React, { useEffect, useState } from 'react';
import { Check, FileText, Pencil, Plus, Trash2 } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { confirmStatusBadgeClass, SKILL_AOP_PRIMARY_BTN } from '@/lib/ui';

export type SkillConfirmFieldKey =
  | 'cnName'
  | 'businessProblem'
  | 'triggerCond'
  | 'forbiddenCond'
  | 'coreInputIn'
  | 'coreInputOut'
  | 'actionChain'
  | 'notAllowed'
  | 'contentRedLines'
  | 'fallback'
  | 'usageExamples'
  | 'customNotes';

export type SkillConfirmItem = {
  id: string;
  label: string;
  checked: boolean;
  /** 对应右侧表单字段，编辑后写回表单 */
  fieldKey?: SkillConfirmFieldKey;
  fieldLabel?: string;
  value?: string;
};

type SkillRoundConfirmCardProps = {
  title?: string;
  items: SkillConfirmItem[];
  confirmed?: boolean;
  /** 当前在下方输入框编辑的要点 id */
  editingItemId?: string | null;
  onConfirm: (items: SkillConfirmItem[]) => void;
  /** 重新设置要求：将当前要点回填到下方输入框供二次编辑 */
  onReset: (items: SkillConfirmItem[]) => void;
  /** 请求在下方输入框编辑某条（带 1-based 序号） */
  onEditItem?: (item: SkillConfirmItem, index: number) => void;
  /** 本地增删勾选时同步到父级消息 */
  onItemsChange?: (items: SkillConfirmItem[]) => void;
  /** 从对话流移除本张确认卡 */
  onDelete?: () => void;
};

export const SkillRoundConfirmCard: React.FC<SkillRoundConfirmCardProps> = ({
  title = '请确认技能草案要点',
  items,
  confirmed = false,
  editingItemId = null,
  onConfirm,
  onReset,
  onEditItem,
  onItemsChange,
  onDelete,
}) => {
  const [rows, setRows] = useState<SkillConfirmItem[]>(items);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRows(items);
  }, [items]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const needsClamp = (text: string) => text.length > 72 || text.includes('\n');

  const commitRows = (next: SkillConfirmItem[]) => {
    setRows(next);
    onItemsChange?.(next);
  };

  const toggle = (id: string) => {
    commitRows(rows.map((row) => (row.id === id ? { ...row, checked: !row.checked } : row)));
  };

  const addCustom = () => {
    const next = newLabel.trim();
    if (!next) return;
    commitRows([
      ...rows,
      { id: `custom-${Date.now()}`, label: next, checked: true },
    ]);
    setNewLabel('');
    setAdding(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={13} className="text-neutral-500 shrink-0" />
          <span className="text-[13px] font-semibold text-neutral-600 leading-5">确认信息</span>
          {confirmed ? (
            <span className={confirmStatusBadgeClass('confirmed')}>已确认</span>
          ) : null}
        </div>
        {!confirmed && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="w-6 h-6 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-white/80 flex items-center justify-center cursor-pointer"
            aria-label="删除"
            title="删除确认卡"
          >
            <Trash2 size={12} />
          </button>
        ) : null}
      </div>

      <div className="px-3 pb-2.5 space-y-2">
        <div className="rounded bg-white p-3 space-y-2">
          <p className="text-[13px] font-semibold text-neutral-900 leading-5">{title}</p>
          <div className="space-y-1">
            {rows.map((row, index) => {
              const hovered = hoveredId === row.id;
              const editing = editingItemId === row.id;
              const ordinal = index + 1;
              const bodyText = row.fieldLabel ? row.value || row.label : row.label;
              const clamped = needsClamp(bodyText) && !expandedIds.has(row.id) && !editing;
              return (
                <div
                  key={row.id}
                  className={cn(
                    'rounded px-1.5 py-1.5 -mx-0.5 border border-transparent',
                    editing
                      ? 'bg-neutral-100 ring-1 ring-neutral-800 border-neutral-200'
                      : hovered
                        ? 'bg-neutral-50 border-neutral-100'
                        : 'border-neutral-100/80',
                  )}
                  onMouseEnter={() => setHoveredId(row.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === row.id ? null : id))}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          'w-4 h-4 rounded text-[10px] font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5',
                          editing
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-100 text-neutral-500',
                        )}
                        aria-label={`要点 ${ordinal}`}
                      >
                        {ordinal}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <label
                            className={cn(
                              'flex items-center gap-1.5 min-w-0',
                              confirmed ? '' : 'cursor-pointer',
                            )}
                          >
                            <button
                              type="button"
                              disabled={confirmed}
                              onClick={() => toggle(row.id)}
                              className={cn(
                                'w-3 h-3 rounded-[3px] border flex items-center justify-center shrink-0',
                                row.checked
                                  ? 'bg-neutral-800 border-neutral-800 text-white'
                                  : 'bg-white border-neutral-300',
                              )}
                              aria-pressed={row.checked}
                            >
                              {row.checked ? <Check size={8} /> : null}
                            </button>
                            {row.fieldLabel ? (
                              <span className="text-[11px] font-semibold text-neutral-500 leading-4 truncate">
                                {row.fieldLabel}
                              </span>
                            ) : null}
                          </label>
                        </div>
                        <div className="pl-[18px] mt-0.5">
                          <p
                            className={cn(
                              'text-[13px] leading-5 whitespace-pre-wrap break-words',
                              clamped && 'line-clamp-2',
                              editing ? 'text-neutral-900 font-medium' : 'text-neutral-700',
                            )}
                          >
                            {bodyText}
                          </p>
                          {needsClamp(bodyText) && !editing ? (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(row.id)}
                              className="mt-0.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 cursor-pointer"
                            >
                              {expandedIds.has(row.id) ? '收起' : '展开'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {(hovered || editing) && !confirmed ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditItem?.(row, index)}
                          className={cn(
                            'cursor-pointer p-0.5',
                            editing ? 'text-neutral-800' : 'text-neutral-400 hover:text-neutral-700',
                          )}
                          aria-label={`编辑要点 ${ordinal}`}
                          title="在下方输入框编辑"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => commitRows(rows.filter((item) => item.id !== row.id))}
                          className="text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5"
                          aria-label="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {confirmed ? null : adding ? (
              <div className="flex items-center gap-1.5 pl-5 pt-0.5">
                <Plus size={12} className="text-neutral-700 shrink-0" />
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustom();
                    }
                    if (e.key === 'Escape') setAdding(false);
                  }}
                  placeholder="输入自定义要点"
                  className="flex-1 h-6 px-1.5 rounded border border-neutral-200 text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="text-[11px] font-medium text-neutral-800 cursor-pointer"
                >
                  添加
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 text-[13px] text-neutral-700 leading-5 cursor-pointer pl-5 pt-0.5"
              >
                <Plus size={12} />
                添加自定义要点
              </button>
            )}
          </div>
        </div>

        {confirmed ? null : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm(rows)}
              className={cn(SKILL_AOP_PRIMARY_BTN, 'h-7 px-3 rounded-md text-[13px]')}
            >
              确认执行
            </button>
            <button
              type="button"
              onClick={() => onReset(rows)}
              className="h-7 px-3 rounded border border-neutral-300 bg-white text-[13px] text-neutral-900 hover:bg-neutral-50 cursor-pointer"
            >
              重新设置要求
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
