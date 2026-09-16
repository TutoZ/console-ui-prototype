/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一轮拆解后的确认节点 — 对齐 Figma 4839:27361“确认信息”
 * - 铅笔：原位编辑要点
 * - 批量编辑：多选要点 → 以小卡片带入下方输入框，交由大模型改写
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronUp, FileText, Pencil, Plus, Search, Trash2, X } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { BTN_DANGER_SM, BTN_SOFT_SM, FIELD, FIELD_CTRL, confirmStatusBadgeClass, SKILL_AOP_PRIMARY_BTN_SM } from '@/lib/ui';
import { SKILL_CREATE_CHAT } from '@/lib/platformTerminology';
import { showAppToast } from '@/lib/appToast';

function KbTokenIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 rounded font-semibold bg-emerald-100 text-emerald-700',
        size === 'sm' ? 'h-4 w-4 text-[9px] rounded' : 'h-5 w-5 text-[10px] rounded-md',
      )}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

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
  /** 对应左侧表单字段，编辑后写回表单 */
  fieldKey?: SkillConfirmFieldKey;
  fieldLabel?: string;
  value?: string;
};

/** 确认卡「执行步骤」内逐步挂载的知识库 */
export type SkillConfirmStepResource = {
  stepId: number;
  name: string;
  associatedKBs: string[];
};

type SkillRoundConfirmCardProps = {
  title?: string;
  items: SkillConfirmItem[];
  confirmed?: boolean;
  /**
   * 已被更新的确认卡取代：只读回看，不可再确认/编辑/删除。
   * 新确认表单出现后，旧卡应传 locked。
   */
  locked?: boolean;
  /** 完成后默认折叠；可手动展开回看 */
  collapsed?: boolean;
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
  /** 折叠态变化（用于写入消息 payload） */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 从对话流移除本张确认卡 */
  onDelete?: () => void;
  /** 可选知识库（名称） */
  availableKBs?: string[];
  /** 当前已挂载知识库 */
  mountedKBs?: string[];
  /** 挂载变更（增删） */
  onMountedKBsChange?: (kbs: string[]) => void;
  /** 执行步骤及其已挂知识库（与右侧步骤 associatedKBs 同步） */
  executionSteps?: SkillConfirmStepResource[];
  /** 步骤知识库变更 */
  onExecutionStepsChange?: (steps: SkillConfirmStepResource[]) => void;
};

function rowBodyText(row: SkillConfirmItem): string {
  return row.fieldLabel ? row.value || row.label : row.label;
}

export const SkillRoundConfirmCard: React.FC<SkillRoundConfirmCardProps> = ({
  title = '请确认技能草案要点',
  items,
  confirmed = false,
  locked = false,
  collapsed: collapsedProp,
  editingItemIds = [],
  onConfirm,
  onEditItem,
  onBatchModeChange,
  onItemsChange,
  onCollapsedChange,
  onDelete,
  availableKBs = [],
  mountedKBs = [],
  onMountedKBsChange,
  executionSteps = [],
  onExecutionStepsChange,
}) => {
  const readOnly = confirmed || locked;
  const [rows, setRows] = useState<SkillConfirmItem[]>(items);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineNameDraft, setInlineNameDraft] = useState('');
  const [inlineContentDraft, setInlineContentDraft] = useState('');
  const [collapsed, setCollapsed] = useState(() =>
    collapsedProp != null ? collapsedProp : confirmed || locked,
  );
  const [kbPickerOpen, setKbPickerOpen] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [stepKbPickerId, setStepKbPickerId] = useState<number | null>(null);
  const [stepKbQuery, setStepKbQuery] = useState('');
  const [dragKb, setDragKb] = useState<{ stepId: number; kb: string } | null>(null);
  const [dragOverKb, setDragOverKb] = useState<{ stepId: number; kb: string } | null>(null);
  const headerButtonRef = useRef<HTMLButtonElement>(null);
  const inlineNameRef = useRef<HTMLInputElement>(null);
  const newContentRef = useRef<HTMLTextAreaElement>(null);
  const kbPickerRef = useRef<HTMLDivElement>(null);
  const stepKbPickerRef = useRef<HTMLDivElement>(null);
  const editingIdSet = useMemo(() => new Set(editingItemIds), [editingItemIds]);
  const mountedSet = useMemo(() => new Set(mountedKBs), [mountedKBs]);
  const filteredAvailableKBs = useMemo(() => {
    const q = kbQuery.trim().toLowerCase();
    return availableKBs.filter((kb) => (!q ? true : kb.toLowerCase().includes(q)));
  }, [availableKBs, kbQuery]);
  const filteredStepKBs = useMemo(() => {
    const q = stepKbQuery.trim().toLowerCase();
    return availableKBs.filter((kb) => (!q ? true : kb.toLowerCase().includes(q)));
  }, [availableKBs, stepKbQuery]);
  const canMountKb = Boolean(onMountedKBsChange) && availableKBs.length > 0;
  const canConfigStepKb =
    Boolean(onExecutionStepsChange) && availableKBs.length > 0 && executionSteps.length > 0;

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    if (collapsedProp != null) setCollapsed(collapsedProp);
  }, [collapsedProp]);

  useEffect(() => {
    if (confirmed || locked) setCollapsed(true);
  }, [confirmed, locked]);

  useEffect(() => {
    if (!locked) return;
    setBatchMode(false);
    setInlineEditId(null);
    setAdding(false);
    setKbPickerOpen(false);
    setStepKbPickerId(null);
    onBatchModeChange?.(false);
  }, [locked, onBatchModeChange]);

  useEffect(() => {
    if (!kbPickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && kbPickerRef.current?.contains(target)) return;
      setKbPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [kbPickerOpen]);

  useEffect(() => {
    if (stepKbPickerId == null) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && stepKbPickerRef.current?.contains(target)) return;
      setStepKbPickerId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [stepKbPickerId]);

  useEffect(() => {
    if (readOnly) {
      setKbPickerOpen(false);
      setStepKbPickerId(null);
      setDragKb(null);
      setDragOverKb(null);
    }
  }, [readOnly]);

  useEffect(() => {
    if (!inlineEditId) return;
    inlineNameRef.current?.focus();
    const el = inlineNameRef.current;
    if (!el) return;
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
  }, [inlineEditId]);

  const toggleMountedKb = (kb: string) => {
    if (readOnly || !onMountedKBsChange) return;
    if (mountedSet.has(kb)) {
      onMountedKBsChange(mountedKBs.filter((name) => name !== kb));
      return;
    }
    onMountedKBsChange([...mountedKBs, kb]);
  };

  const removeMountedKb = (kb: string) => {
    if (readOnly || !onMountedKBsChange) return;
    onMountedKBsChange(mountedKBs.filter((name) => name !== kb));
    if (onExecutionStepsChange && executionSteps.length > 0) {
      onExecutionStepsChange(
        executionSteps.map((step) => ({
          ...step,
          associatedKBs: step.associatedKBs.filter((name) => name !== kb),
        })),
      );
    }
  };

  const ensureSkillMounted = (kbs: string[]) => {
    if (!onMountedKBsChange) return;
    const missing = kbs.filter((kb) => !mountedSet.has(kb));
    if (missing.length === 0) return;
    onMountedKBsChange([...mountedKBs, ...missing]);
  };

  const setStepAssociatedKBs = (stepId: number, nextKBs: string[]) => {
    if (readOnly || !onExecutionStepsChange) return;
    ensureSkillMounted(nextKBs);
    onExecutionStepsChange(
      executionSteps.map((step) =>
        step.stepId === stepId ? { ...step, associatedKBs: nextKBs } : step,
      ),
    );
  };

  const toggleStepKb = (stepId: number, kb: string) => {
    const step = executionSteps.find((row) => row.stepId === stepId);
    if (!step) return;
    const has = step.associatedKBs.includes(kb);
    setStepAssociatedKBs(
      stepId,
      has ? step.associatedKBs.filter((name) => name !== kb) : [...step.associatedKBs, kb],
    );
  };

  const removeStepKb = (stepId: number, kb: string) => {
    const step = executionSteps.find((row) => row.stepId === stepId);
    if (!step) return;
    setStepAssociatedKBs(
      stepId,
      step.associatedKBs.filter((name) => name !== kb),
    );
  };

  const reorderStepKb = (stepId: number, fromKb: string, toKb: string) => {
    if (readOnly || !onExecutionStepsChange || fromKb === toKb) return;
    const step = executionSteps.find((row) => row.stepId === stepId);
    if (!step) return;
    const next = [...step.associatedKBs];
    const fromIdx = next.indexOf(fromKb);
    const toIdx = next.indexOf(toKb);
    if (fromIdx < 0 || toIdx < 0) return;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, fromKb);
    setStepAssociatedKBs(stepId, next);
  };

  const setCollapsedAndSync = (next: boolean) => {
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const commitRows = (next: SkillConfirmItem[]) => {
    if (readOnly) return;
    setRows(next);
    onItemsChange?.(next);
  };

  const addCustom = () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly || !onEditItem) return;
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
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          ref={headerButtonRef}
          onClick={() => setCollapsedAndSync(!collapsed)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText size={13} className="text-neutral-500 shrink-0" />
            <span className="text-[13px] font-semibold text-neutral-600 leading-5">
              {SKILL_CREATE_CHAT.confirmTitle}
            </span>
            {confirmed ? (
              <span className={confirmStatusBadgeClass('confirmed')}>
                {SKILL_CREATE_CHAT.confirmDone}
              </span>
            ) : locked ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-medium">
                已失效
              </span>
            ) : null}
            {batchMode && !readOnly ? (
              <span className="text-[11px] font-medium text-neutral-500">多选要点后发送改写</span>
            ) : null}
            {collapsed && !confirmed && !locked ? (
              <span className="truncate text-[11px] text-neutral-400">{title}</span>
            ) : null}
            {collapsed && (confirmed || locked) ? (
              <span className="truncate text-[11px] text-neutral-400">
                {rows.length} 条要点
              </span>
            ) : null}
          </div>
          {collapsed ? (
            <ChevronDown size={14} className="shrink-0 text-neutral-400" />
          ) : (
            <ChevronUp size={14} className="shrink-0 text-neutral-400" />
          )}
        </button>
        {!readOnly && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="w-6 h-6 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-white/80 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="删除"
            title="删除确认卡"
          >
            <Trash2 size={12} />
          </button>
        ) : null}
      </div>

      {!collapsed ? (
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
                  role={batchMode && !readOnly ? 'button' : undefined}
                  tabIndex={batchMode && !readOnly ? 0 : undefined}
                  className={cn(
                    'relative rounded px-1.5 py-1.5 -mx-0.5 border border-transparent',
                    selected
                      ? 'bg-neutral-100 ring-1 ring-neutral-800 border-neutral-200'
                      : hovered || isInline
                        ? 'bg-neutral-50 border-neutral-100'
                        : 'border-neutral-100/80',
                    batchMode && !readOnly && 'cursor-pointer',
                    locked && 'opacity-80',
                  )}
                  onMouseEnter={() => setHoveredId(row.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === row.id ? null : id))}
                  onClick={(event) => {
                    if (readOnly || !batchMode || !onEditItem || isInline) return;
                    const target = event.target as HTMLElement;
                    if (target.closest('button, label, a, input, textarea')) return;
                    onEditItem(row, index);
                  }}
                  onKeyDown={(event) => {
                    if (readOnly || !batchMode || !onEditItem || isInline) return;
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
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-neutral-400">⌘/Ctrl + Enter 保存</span>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              className="h-6 px-2 rounded-md border border-neutral-200 bg-white text-[11px] text-neutral-600 cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={commitInlineEdit}
                              className="h-6 px-2 rounded-md bg-neutral-800 text-white text-[11px] font-medium cursor-pointer"
                            >
                              保存
                            </button>
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
                                'text-[13px] leading-5 whitespace-pre-wrap break-words font-normal',
                                selected ? 'text-neutral-900' : 'text-neutral-700',
                              )}
                            >
                              {bodyText}
                            </p>
                            {row.fieldKey === 'actionChain' &&
                            (executionSteps.length > 0 || canConfigStepKb) ? (
                              <div className="mt-2 space-y-2">
                                <p className="text-[11px] font-semibold text-neutral-500 leading-4">
                                  为每个步骤插入知识库（拖拽图标可排序）
                                </p>
                                {executionSteps.length === 0 ? (
                                  <p className="text-[11px] text-neutral-500 leading-4">
                                    暂无执行步骤可配置
                                  </p>
                                ) : (
                                  executionSteps.map((step, stepIndex) => {
                                    const stepChecked = new Set(step.associatedKBs);
                                    const pickerOpen = stepKbPickerId === step.stepId;
                                    return (
                                      <div key={step.stepId} className="space-y-1">
                                        <p className="text-[12px] font-medium text-neutral-800 truncate leading-4">
                                          <span className="text-neutral-400 tabular-nums mr-1">
                                            {stepIndex + 1}.
                                          </span>
                                          {step.name || `步骤 ${step.stepId}`}
                                        </p>
                                        <div
                                          className={cn(
                                            'relative min-h-9 w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5',
                                            'flex flex-wrap items-center gap-1.5',
                                            !readOnly && 'focus-within:border-neutral-300',
                                          )}
                                          onDragOver={(e) => {
                                            if (!dragKb || dragKb.stepId !== step.stepId) return;
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            if (!dragKb || dragKb.stepId !== step.stepId) return;
                                            if (dragOverKb?.stepId === step.stepId && dragOverKb.kb) {
                                              reorderStepKb(step.stepId, dragKb.kb, dragOverKb.kb);
                                            }
                                            setDragKb(null);
                                            setDragOverKb(null);
                                          }}
                                        >
                                          {step.associatedKBs.length === 0 && readOnly ? (
                                            <span className="text-[11px] text-neutral-400 leading-4 py-0.5">
                                              未插入知识库
                                            </span>
                                          ) : null}
                                          {step.associatedKBs.map((kb) => {
                                            const dragging =
                                              dragKb?.stepId === step.stepId && dragKb.kb === kb;
                                            const dropTarget =
                                              dragOverKb?.stepId === step.stepId &&
                                              dragOverKb.kb === kb;
                                            return (
                                              <span
                                                key={`${step.stepId}-${kb}`}
                                                draggable={!readOnly && Boolean(onExecutionStepsChange)}
                                                onDragStart={(e) => {
                                                  if (readOnly) return;
                                                  e.dataTransfer.setData('text/plain', kb);
                                                  e.dataTransfer.effectAllowed = 'move';
                                                  setDragKb({ stepId: step.stepId, kb });
                                                  setDragOverKb({ stepId: step.stepId, kb });
                                                }}
                                                onDragEnd={() => {
                                                  setDragKb(null);
                                                  setDragOverKb(null);
                                                }}
                                                onDragEnter={(e) => {
                                                  if (!dragKb || dragKb.stepId !== step.stepId) return;
                                                  e.preventDefault();
                                                  setDragOverKb({ stepId: step.stepId, kb });
                                                }}
                                                className={cn(
                                                  'group relative inline-flex items-center justify-center h-7 w-7 rounded-md',
                                                  'border border-emerald-200/70 bg-emerald-50 text-emerald-800',
                                                  'select-none align-middle',
                                                  !readOnly &&
                                                    onExecutionStepsChange &&
                                                    'cursor-grab active:cursor-grabbing',
                                                  dragging && 'opacity-40',
                                                  dropTarget &&
                                                    dragKb?.kb !== kb &&
                                                    'ring-1 ring-neutral-800 ring-offset-1',
                                                )}
                                                title={kb}
                                                aria-label={kb}
                                              >
                                                <BookOpen size={14} className="pointer-events-none" />
                                                {!readOnly && onExecutionStepsChange ? (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      removeStepKb(step.stepId, kb);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white border border-neutral-200 text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-rose-600 cursor-pointer flex items-center justify-center shadow-sm transition"
                                                    aria-label={`从步骤移除 ${kb}`}
                                                  >
                                                    <X size={9} />
                                                  </button>
                                                ) : null}
                                              </span>
                                            );
                                          })}

                                          {!readOnly && canConfigStepKb ? (
                                            <div
                                              className="relative shrink-0"
                                              ref={pickerOpen ? stepKbPickerRef : undefined}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setStepKbQuery('');
                                                  setStepKbPickerId((id) =>
                                                    id === step.stepId ? null : step.stepId,
                                                  );
                                                }}
                                                aria-expanded={pickerOpen}
                                                className={cn(
                                                  'inline-flex items-center gap-1 h-7 px-1.5 rounded-md text-[11px] font-medium cursor-pointer transition',
                                                  'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 border border-dashed border-neutral-200',
                                                  pickerOpen && 'border-solid border-neutral-300 bg-neutral-50 text-neutral-800',
                                                )}
                                              >
                                                <Plus size={12} />
                                                添加
                                              </button>
                                              {pickerOpen ? (
                                                <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[min(280px,72vw)] rounded-xl border border-neutral-200 bg-white shadow-lg p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                                  <div className="relative">
                                                    <Search
                                                      size={13}
                                                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                                                    />
                                                    <input
                                                      autoFocus
                                                      value={stepKbQuery}
                                                      onChange={(e) =>
                                                        setStepKbQuery(e.target.value)
                                                      }
                                                      placeholder="搜索知识库…"
                                                      className={cn(
                                                        FIELD,
                                                        FIELD_CTRL,
                                                        'pl-8 bg-neutral-50',
                                                      )}
                                                    />
                                                  </div>
                                                  <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                                                    {filteredStepKBs.length === 0 ? (
                                                      <p className="px-2 py-3 text-[12px] text-neutral-500 text-center">
                                                        没有可插入的知识库
                                                      </p>
                                                    ) : (
                                                      filteredStepKBs.map((kb) => {
                                                        const checked = stepChecked.has(kb);
                                                        return (
                                                          <button
                                                            key={kb}
                                                            type="button"
                                                            onClick={() => {
                                                              toggleStepKb(step.stepId, kb);
                                                              if (!checked) {
                                                                setStepKbPickerId(null);
                                                              }
                                                            }}
                                                            className={cn(
                                                              'w-full text-left px-2 py-1.5 rounded-md text-[12px] transition flex items-center gap-2 cursor-pointer',
                                                              checked
                                                                ? 'bg-neutral-100 text-neutral-900 font-medium'
                                                                : 'hover:bg-neutral-50 text-neutral-700',
                                                            )}
                                                          >
                                                            <KbTokenIcon name={kb} size="sm" />
                                                            <span className="truncate flex-1 min-w-0">
                                                              {kb}
                                                            </span>
                                                            {checked ? (
                                                              <Check
                                                                size={12}
                                                                className="shrink-0 text-neutral-700"
                                                              />
                                                            ) : (
                                                              <Plus
                                                                size={12}
                                                                className="shrink-0 text-neutral-400"
                                                              />
                                                            )}
                                                          </button>
                                                        );
                                                      })
                                                    )}
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          ) : null}

                                          {!readOnly &&
                                          canConfigStepKb &&
                                          step.associatedKBs.length === 0 &&
                                          !pickerOpen ? (
                                            <span className="text-[11px] text-neutral-400 leading-4 pointer-events-none">
                                              点击添加，插入知识库图标
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {!isInline && (hovered || batchMode) && !readOnly ? (
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

            {readOnly ? null : adding ? (
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
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] text-neutral-400">⌘/Ctrl + Enter 添加</span>
                  <button
                    type="button"
                    onClick={cancelAdding}
                    className="h-6 px-2 rounded-md border border-neutral-200 bg-white text-[11px] text-neutral-600 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={addCustom}
                    className="h-6 px-2 rounded-md bg-neutral-800 text-white text-[11px] font-medium cursor-pointer"
                  >
                    添加
                  </button>
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

        {(canMountKb || mountedKBs.length > 0) ? (
          <div className="rounded bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 leading-5">挂载知识库</p>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-4">
                  技能级可用资料池；执行步骤内可按步选用
                </p>
              </div>
              {!readOnly && canMountKb ? (
                <div className="relative shrink-0" ref={kbPickerRef}>
                  <button
                    type="button"
                    onClick={() => setKbPickerOpen((open) => !open)}
                    aria-expanded={kbPickerOpen}
                    className={cn(
                      BTN_SOFT_SM,
                      'gap-1',
                      kbPickerOpen && 'border-neutral-300',
                    )}
                  >
                    <Plus size={12} />
                    添加
                    <ChevronDown size={11} className={cn(kbPickerOpen && 'rotate-180')} />
                  </button>
                  {kbPickerOpen ? (
                    <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[min(320px,78vw)] rounded-xl border border-neutral-200 bg-white shadow-lg p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          autoFocus
                          value={kbQuery}
                          onChange={(e) => setKbQuery(e.target.value)}
                          placeholder="搜索知识库名称…"
                          className={cn(FIELD, FIELD_CTRL, 'pl-8 bg-neutral-50')}
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                        {filteredAvailableKBs.length === 0 ? (
                          <p className="px-2 py-3 text-[12px] text-neutral-500 text-center">
                            没有可挂载的知识库
                          </p>
                        ) : (
                          filteredAvailableKBs.map((kb) => {
                            const checked = mountedSet.has(kb);
                            return (
                              <button
                                key={kb}
                                type="button"
                                onClick={() => toggleMountedKb(kb)}
                                className={cn(
                                  'w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition flex items-center gap-2 cursor-pointer',
                                  checked
                                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                                    : 'hover:bg-neutral-50 text-neutral-700',
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                    checked
                                      ? 'bg-neutral-800 border-transparent text-white'
                                      : 'border-neutral-200 bg-white',
                                  )}
                                >
                                  {checked ? <Check size={10} /> : null}
                                </span>
                                <span className="truncate">{kb}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {mountedKBs.length === 0 ? (
              <p className="text-[12px] text-neutral-500 leading-5 rounded-md border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5">
                {readOnly
                  ? '未挂载知识库'
                  : canMountKb
                    ? '尚未挂载。点击“添加”从团队知识库中选用。'
                    : '暂无可选知识库'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {mountedKBs.map((kb) => (
                  <span
                    key={kb}
                    className="inline-flex items-center gap-1 max-w-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md"
                    title={kb}
                  >
                    <BookOpen size={11} className="shrink-0" />
                    <span className="truncate min-w-0">{kb}</span>
                    {!readOnly && onMountedKBsChange ? (
                      <button
                        type="button"
                        onClick={() => removeMountedKb(kb)}
                        className="hover:text-emerald-900 cursor-pointer shrink-0"
                        aria-label={`移除 ${kb}`}
                      >
                        <X size={11} />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {readOnly ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (readOnly) return;
                // The submit control disappears on confirmation; retain focus on the persistent header.
                headerButtonRef.current?.focus({ preventScroll: true });
                onConfirm(rows);
              }}
              className={SKILL_AOP_PRIMARY_BTN_SM}
            >
              确认执行
            </button>
            {onEditItem ? (
              <>
                <button
                  type="button"
                  onClick={toggleBatchMode}
                  aria-pressed={batchMode}
                  className={cn(BTN_SOFT_SM, batchMode && 'border-neutral-300')}
                >
                  {batchMode ? '退出批量编辑' : '批量编辑'}
                </button>
                {batchMode && editingIdSet.size > 0 ? (
                  <button
                    type="button"
                    onClick={deleteSelectedRows}
                    className={BTN_DANGER_SM}
                    title={`删除已选 ${editingIdSet.size} 条`}
                  >
                    删除
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>
      ) : null}
    </div>
  );
};
