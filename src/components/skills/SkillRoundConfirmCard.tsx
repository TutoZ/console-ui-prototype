/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一轮拆解后的确认节点 — 对齐 Figma 4839:27361「确认信息」
 * - 铅笔：原位编辑要点
 * - 批量编辑：多选要点 → 以小卡片带入下方输入框，交由大模型改写
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Pencil, Plus, Trash2 } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { confirmStatusBadgeClass, SKILL_AOP_PRIMARY_BTN } from '@/lib/ui';
import { showAppToast } from '@/lib/appToast';

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
  /** 批量编辑：已选中、将带到输入框的要点 id */
  editingItemIds?: string[];
  onConfirm: (items: SkillConfirmItem[]) => void;
  /** 重新设置要求：将当前要点回填到下方输入框供二次编辑 */
  onReset: (items: SkillConfirmItem[]) => void;
  /**
   * 批量编辑模式下点选/取消要点（带 1-based 序号）。
   * 父级据此在输入框上方展示小卡片。
   */
  onEditItem?: (item: SkillConfirmItem, index: number) => void;
  /** 批量编辑开关变化；关闭时父级应清空已选芯片 */
  onBatchModeChange?: (active: boolean) => void;
  /** 本地增删勾选时同步到父级消息 */
  onItemsChange?: (items: SkillConfirmItem[]) => void;
  /** 从对话流移除本张确认卡 */
  onDelete?: () => void;
};

function rowBodyText(row: SkillConfirmItem): string {
  return row.fieldLabel ? row.value || row.label : row.label;
}

export const SkillRoundConfirmCard: React.FC<SkillRoundConfirmCardProps> = ({
  title = '请确认技能草案要点',
  items,
  confirmed = false,
  editingItemIds = [],
  onConfirm,
  onReset,
  onEditItem,
  onBatchModeChange,
  onItemsChange,
  onDelete,
}) => {
  const [rows, setRows] = useState<SkillConfirmItem[]>(items);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState('');
  const inlineRef = useRef<HTMLTextAreaElement>(null);
  const editingIdSet = useMemo(() => new Set(editingItemIds), [editingItemIds]);

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    if (!inlineEditId) return;
    inlineRef.current?.focus();
    const el = inlineRef.current;
    if (!el) return;
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
  }, [inlineEditId]);

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

  const startInlineEdit = (row: SkillConfirmItem) => {
    if (confirmed) return;
    setBatchMode(false);
    onBatchModeChange?.(false);
    setInlineEditId(row.id);
    setInlineDraft(rowBodyText(row));
    setExpandedIds((prev) => new Set(prev).add(row.id));
  };

  const commitInlineEdit = () => {
    if (!inlineEditId) return;
    const nextText = inlineDraft.trim();
    commitRows(
      rows.map((row) => {
        if (row.id !== inlineEditId) return row;
        if (!nextText) return row;
        if (row.fieldLabel) {
          return {
            ...row,
            value: nextText,
            label: `${row.fieldLabel}：${nextText.slice(0, 120)}`,
          };
        }
        return { ...row, label: nextText, value: nextText };
      }),
    );
    setInlineEditId(null);
    setInlineDraft('');
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineDraft('');
  };

  const toggleBatchMode = () => {
    if (confirmed || !onEditItem) return;
    cancelInlineEdit();
    const next = !batchMode;
    setBatchMode(next);
    onBatchModeChange?.(next);
  };

  const deleteSelectedRows = () => {
    if (!batchMode || editingIdSet.size === 0) return;
    commitRows(rows.filter((row) => !editingIdSet.has(row.id)));
    // 清空输入框芯片，仍留在批量编辑模式
    onBatchModeChange?.(false);
    showAppToast('删除成功', 'success');
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
          {batchMode && !confirmed ? (
            <span className="text-[11px] font-medium text-neutral-500">多选要点后发送改写</span>
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
              const selected = editingIdSet.has(row.id);
              const ordinal = index + 1;
              const bodyText = rowBodyText(row);
              const isInline = inlineEditId === row.id;
              const clamped = needsClamp(bodyText) && !expandedIds.has(row.id) && !isInline;
              return (
                <div
                  key={row.id}
                  role={batchMode && !confirmed ? 'button' : undefined}
                  tabIndex={batchMode && !confirmed ? 0 : undefined}
                  className={cn(
                    'rounded px-1.5 py-1.5 -mx-0.5 border border-transparent',
                    selected
                      ? 'bg-neutral-100 ring-1 ring-neutral-800 border-neutral-200'
                      : hovered || isInline
                        ? 'bg-neutral-50 border-neutral-100'
                        : 'border-neutral-100/80',
                    batchMode && !confirmed && 'cursor-pointer',
                  )}
                  onMouseEnter={() => setHoveredId(row.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === row.id ? null : id))}
                  onClick={(event) => {
                    if (confirmed || !batchMode || !onEditItem || isInline) return;
                    const target = event.target as HTMLElement;
                    if (target.closest('button, label, a, input, textarea')) return;
                    onEditItem(row, index);
                  }}
                  onKeyDown={(event) => {
                    if (confirmed || !batchMode || !onEditItem || isInline) return;
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onEditItem(row, index);
                  }}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          'w-4 h-4 rounded text-[10px] font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5',
                          selected
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-100 text-neutral-500',
                        )}
                        aria-label={`要点 ${ordinal}`}
                      >
                        {ordinal}
                      </span>
                      <div className="min-w-0 flex-1">
                        {row.fieldLabel ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-neutral-500 leading-4 truncate">
                              {row.fieldLabel}
                            </span>
                          </div>
                        ) : null}
                        <div className={cn(row.fieldLabel ? 'mt-0.5' : undefined)}>
                          {isInline ? (
                            <div className="space-y-1.5">
                              <textarea
                                ref={inlineRef}
                                value={inlineDraft}
                                rows={Math.min(6, Math.max(2, inlineDraft.split('\n').length))}
                                onChange={(e) => setInlineDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelInlineEdit();
                                  }
                                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    commitInlineEdit();
                                  }
                                }}
                                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[13px] leading-5 text-neutral-800 outline-none focus:border-neutral-300 resize-y min-h-[52px]"
                                aria-label={`原位编辑要点 ${ordinal}`}
                              />
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={commitInlineEdit}
                                  className="h-6 px-2 rounded-md bg-neutral-800 text-white text-[11px] font-medium cursor-pointer"
                                >
                                  保存
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelInlineEdit}
                                  className="h-6 px-2 rounded-md border border-neutral-200 bg-white text-[11px] text-neutral-600 cursor-pointer"
                                >
                                  取消
                                </button>
                                <span className="text-[10px] text-neutral-400">⌘/Ctrl + Enter 保存</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p
                                className={cn(
                                  'text-[13px] leading-5 whitespace-pre-wrap break-words',
                                  clamped && 'line-clamp-2',
                                  selected ? 'text-neutral-900 font-medium' : 'text-neutral-700',
                                )}
                              >
                                {bodyText}
                              </p>
                              {needsClamp(bodyText) ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(row.id)}
                                  className="mt-0.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 cursor-pointer"
                                >
                                  {expandedIds.has(row.id) ? '收起' : '展开'}
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isInline && (hovered || batchMode) && !confirmed ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {!batchMode ? (
                          <button
                            type="button"
                            onClick={() => startInlineEdit(row)}
                            className="cursor-pointer p-0.5 text-neutral-400 hover:text-neutral-700"
                            aria-label={`编辑要点 ${ordinal}`}
                            title="原位编辑"
                          >
                            <Pencil size={12} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            commitRows(rows.filter((item) => item.id !== row.id));
                            if (selected) onEditItem?.(row, index);
                            showAppToast('删除成功', 'success');
                          }}
                          className="text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5"
                          aria-label="删除"
                          title="删除此要点"
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
          <div className="flex flex-wrap items-center gap-2">
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
            {onEditItem ? (
              <>
                <button
                  type="button"
                  onClick={toggleBatchMode}
                  aria-pressed={batchMode}
                  className={cn(
                    'h-7 px-3 rounded border text-[13px] cursor-pointer transition',
                    batchMode
                      ? 'border-neutral-800 bg-neutral-800 text-white'
                      : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50',
                  )}
                >
                  {batchMode ? '退出批量编辑' : '批量编辑'}
                </button>
                {batchMode ? (
                  <button
                    type="button"
                    disabled={editingIdSet.size === 0}
                    onClick={deleteSelectedRows}
                    className={cn(
                      'h-7 px-3 rounded border text-[13px] cursor-pointer transition',
                      editingIdSet.size === 0
                        ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                        : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
                    )}
                    title={
                      editingIdSet.size === 0
                        ? '先点选要删除的要点'
                        : `删除已选 ${editingIdSet.size} 条`
                    }
                  >
                    删除{editingIdSet.size > 0 ? ` · ${editingIdSet.size}` : ''}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
