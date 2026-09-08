/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一轮拆解后的确认节点 — 对齐 Figma 4839:27361“确认信息”
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
  onEditItem,
  onBatchModeChange,
  onItemsChange,
  onDelete,
}) => {
  const [rows, setRows] = useState<SkillConfirmItem[]>(items);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineNameDraft, setInlineNameDraft] = useState('');
  const [inlineContentDraft, setInlineContentDraft] = useState('');
  const inlineNameRef = useRef<HTMLInputElement>(null);
  const newContentRef = useRef<HTMLTextAreaElement>(null);
  const editingIdSet = useMemo(() => new Set(editingItemIds), [editingItemIds]);

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    if (!inlineEditId) return;
    inlineNameRef.current?.focus();
    const el = inlineNameRef.current;
    if (!el) return;
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
  }, [inlineEditId]);

  const commitRows = (next: SkillConfirmItem[]) => {
    setRows(next);
    onItemsChange?.(next);
  };

  const addCustom = () => {
    const name = newName.trim();
    const content = newContent.trim();
    if (!name && !content) return;
    const fieldLabel = name || '自定义要点';
    const value = content || name;
    commitRows([
      ...rows,
      {
        id: `custom-${Date.now()}`,
        label: `${fieldLabel}：${value.slice(0, 120)}`,
        checked: true,
        fieldLabel,
        value,
      },
    ]);
    setNewName('');
    setNewContent('');
    setAdding(false);
  };

  const cancelAdding = () => {
    setAdding(false);
    setNewName('');
    setNewContent('');
  };

  const startInlineEdit = (row: SkillConfirmItem) => {
    if (confirmed) return;
    setBatchMode(false);
    onBatchModeChange?.(false);
    setInlineEditId(row.id);
    setInlineNameDraft(row.fieldLabel?.trim() || '');
    setInlineContentDraft(row.fieldLabel ? row.value || '' : row.value || row.label);
  };

  const commitInlineEdit = () => {
    if (!inlineEditId) return;
    const nextName = inlineNameDraft.trim();
    const nextContent = inlineContentDraft.trim();
    if (!nextName && !nextContent) return;
    commitRows(
      rows.map((row) => {
        if (row.id !== inlineEditId) return row;
        const name = nextName || row.fieldLabel || '自定义要点';
        const content = nextContent || nextName;
        return {
          ...row,
          fieldLabel: name,
          value: content,
          label: `${name}：${content.slice(0, 120)}`,
        };
      }),
    );
    setInlineEditId(null);
    setInlineNameDraft('');
    setInlineContentDraft('');
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineNameDraft('');
    setInlineContentDraft('');
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
              return (
                <div
                  key={row.id}
                  role={batchMode && !confirmed ? 'button' : undefined}
                  tabIndex={batchMode && !confirmed ? 0 : undefined}
                  className={cn(
                    'relative rounded px-1.5 py-1.5 -mx-0.5 border border-transparent',
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
                  <div className="flex items-start gap-1.5 min-w-0">
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
                      {isInline ? (
                        <div className="space-y-2">
                          <label className="block space-y-1">
                            <span className="text-[11px] font-semibold text-neutral-500 leading-4">
                              名称
                            </span>
                            <input
                              ref={inlineNameRef}
                              value={inlineNameDraft}
                              onChange={(e) => setInlineNameDraft(e.target.value)}
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
                              placeholder="要点名称"
                              className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2 text-[13px] leading-5 text-neutral-800 outline-none focus:border-neutral-300"
                              aria-label={`编辑名称 ${ordinal}`}
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[11px] font-semibold text-neutral-500 leading-4">
                              内容
                            </span>
                            <textarea
                              value={inlineContentDraft}
                              rows={Math.min(
                                14,
                                Math.max(3, inlineContentDraft.split('\n').length + 1),
                              )}
                              onChange={(e) => setInlineContentDraft(e.target.value)}
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
                              placeholder="要点内容"
                              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[13px] leading-5 text-neutral-800 outline-none focus:border-neutral-300 resize-y min-h-[72px]"
                              aria-label={`编辑内容 ${ordinal}`}
                            />
                          </label>
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
                          {row.fieldLabel ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[11px] font-semibold text-neutral-500 leading-4 truncate">
                                {row.fieldLabel}
                              </span>
                            </div>
                          ) : null}
                          <div className={cn(row.fieldLabel ? 'mt-0.5' : undefined)}>
                            <p
                              className={cn(
                                'text-[13px] leading-5 whitespace-pre-wrap break-words',
                                selected ? 'text-neutral-900 font-medium' : 'text-neutral-700',
                              )}
                            >
                              {bodyText}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {!isInline && (hovered || batchMode) && !confirmed ? (
                    <div className="absolute top-1 right-1 z-[1] flex items-center gap-0.5 rounded-md border border-neutral-200/80 bg-white/95 px-0.5 py-0.5 shadow-[0_1px_4px_rgba(17,17,17,0.08)]">
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
              );
            })}

            {confirmed ? null : adding ? (
              <div className="pl-5 pt-1 space-y-2">
                <div className="flex items-center gap-1.5 text-[13px] text-neutral-700 leading-5">
                  <Plus size={12} className="text-neutral-700 shrink-0" />
                  <span>添加自定义要点</span>
                </div>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-500 leading-4">名称</span>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        newContentRef.current?.focus();
                      }
                      if (e.key === 'Escape') cancelAdding();
                    }}
                    placeholder="要点名称"
                    className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2 text-[13px] leading-5 text-neutral-800 outline-none focus:border-neutral-300"
                    aria-label="自定义要点名称"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-500 leading-4">内容</span>
                  <textarea
                    ref={newContentRef}
                    value={newContent}
                    rows={Math.min(6, Math.max(2, newContent.split('\n').length + 1))}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelAdding();
                      }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        addCustom();
                      }
                    }}
                    placeholder="要点内容"
                    className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[13px] leading-5 text-neutral-800 outline-none focus:border-neutral-300 resize-y min-h-[52px]"
                    aria-label="自定义要点内容"
                  />
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={addCustom}
                    className="h-6 px-2 rounded-md bg-neutral-800 text-white text-[11px] font-medium cursor-pointer"
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={cancelAdding}
                    className="h-6 px-2 rounded-md border border-neutral-200 bg-white text-[11px] text-neutral-600 cursor-pointer"
                  >
                    取消
                  </button>
                  <span className="text-[10px] text-neutral-400">⌘/Ctrl + Enter 添加</span>
                </div>
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
