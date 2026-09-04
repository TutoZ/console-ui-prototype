import React, { useMemo, useState } from 'react';
import { Pencil, Search, X } from '@/lib/icons';
import { BTN_INK, BTN_SOFT, FIELD, FIELD_CTRL, LABEL } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Modal } from '../common/Modal';
import type { ArchiveItem, ValidationError } from './workflowTypes';
import { createDefaultNodes } from './workflowUtils';
import { WorkflowNodeIcon } from './workflowUi';

function formatArchiveTime(raw: string): string {
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return raw;
  return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

type WorkflowArchiveDrawerProps = {
  open: boolean;
  draftTime: string;
  archives: ArchiveItem[];
  onClose: () => void;
  onApply: (archive: ArchiveItem) => void;
  onDelete: (id: string) => void;
};

/** 培训存档 — 顶栏时钟旁气泡窗（对齐历史版本气泡稿） */
export function WorkflowArchiveDrawer({
  open,
  draftTime,
  archives,
  onClose,
  onApply,
  onDelete,
}: WorkflowArchiveDrawerProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<'draft' | string>('draft');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return archives;
    return archives.filter(
      (arc) =>
        arc.id.toLowerCase().includes(q) ||
        arc.time.toLowerCase().includes(q) ||
        `v_${arc.id}`.toLowerCase().includes(q),
    );
  }, [archives, query]);

  const q = query.trim().toLowerCase();
  const draftVisible =
    !q ||
    'v1.0.3 编辑中'.includes(q) ||
    '当前版本'.includes(q) ||
    draftTime.toLowerCase().includes(q);

  if (!open) return null;

  return (
    <div
      className="absolute top-full right-0 mt-2 w-[320px] bg-white border border-neutral-200 rounded-[13px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-[80] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="历史版本"
    >
      <div
        className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-l border-t border-neutral-200 rotate-45"
        aria-hidden
      />

      <div className="relative px-4 pt-3 pb-1.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-neutral-900">历史版本</h3>
        <button
          type="button"
          className="p-1 rounded-[7px] text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入版本号/描述"
            className={cn(FIELD, FIELD_CTRL, 'pl-8')}
          />
        </div>
      </div>

      <div className="px-2 pb-3 max-h-[360px] overflow-y-auto custom-scrollbar-thin">
        {draftVisible ? (
          <button
            type="button"
            onClick={() => setSelectedId('draft')}
            className={cn(
              'w-full text-left rounded-[10px] px-3 py-2 transition cursor-pointer',
              selectedId === 'draft'
                ? 'border border-neutral-300 bg-neutral-50'
                : 'border border-transparent hover:bg-neutral-50',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex items-center gap-1">
                <span className="text-[12px] font-medium text-neutral-900 truncate">
                  V1.0.3 编辑中
                </span>
                <Pencil size={11} className="text-neutral-400 shrink-0" />
              </div>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-500">
                当前版本
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-neutral-400">
                发布于 {formatArchiveTime(draftTime)}
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">TAOS</span>
            </div>
          </button>
        ) : null}

        {filtered.map((arc, index) => {
          const isActive = arc.status === 'ACTIVE';
          const selected = selectedId === arc.id;
          const versionLabel = `V1.0.${Math.max(0, 2 - index)}`;
          return (
            <div
              key={arc.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(arc.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSelectedId(arc.id);
              }}
              className={cn(
                'w-full text-left rounded-[10px] px-3 py-2 transition cursor-pointer',
                selected
                  ? 'border border-neutral-300 bg-neutral-50'
                  : 'border border-transparent hover:bg-neutral-50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-1">
                  <span className="text-[12px] font-medium text-neutral-900 truncate">
                    {versionLabel} 发布：对话编排…
                  </span>
                  <Pencil size={11} className="text-neutral-400 shrink-0" />
                </div>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-medium text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                    在线
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-neutral-400">
                  发布于 {formatArchiveTime(arc.time)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {!isActive ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const recoveredNodes =
                            arc.nodes.length > 0 ? arc.nodes : createDefaultNodes();
                          onApply({ ...arc, nodes: recoveredNodes });
                        }}
                        className="text-[11px] font-medium text-neutral-800 hover:text-neutral-950 cursor-pointer"
                      >
                        应用
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(arc.id);
                        }}
                        className="text-[11px] font-medium text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        删除
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-neutral-400 font-medium">TAOS</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !draftVisible ? (
          <div className="py-8 text-center text-xs text-neutral-400">无匹配版本</div>
        ) : null}
      </div>
    </div>
  );
}

type WorkflowEditAgentModalProps = {
  open: boolean;
  name: string;
  description: string;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
};

export function WorkflowEditAgentModal({
  open,
  name,
  description,
  onClose,
  onSave,
}: WorkflowEditAgentModalProps) {
  const [draftName, setDraftName] = React.useState(name);
  const [draftDesc, setDraftDesc] = React.useState(description);

  React.useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftDesc(description);
    }
  }, [open, name, description]);

  const canSave = draftName.trim().length > 0 && draftDesc.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="员工基本信息"
      maxWidth="max-w-[500px]"
      footer={
        <>
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            disabled={!canSave}
            className={BTN_INK}
            onClick={() => {
              if (!canSave) return;
              onSave(draftName.trim(), draftDesc.trim());
              onClose();
            }}
          >
            保存
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>
            员工名称 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className={cn(FIELD, FIELD_CTRL, 'text-sm')}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="请输入员工名称"
          />
        </div>
        <div>
          <label className={LABEL}>
            员工描述 <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <textarea
              className={cn(FIELD, 'h-32 resize-none text-sm py-2.5')}
              placeholder="请描述员工职责和服务场景"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              maxLength={2000}
            />
            <span className="absolute bottom-2.5 right-2.5 text-[11px] text-neutral-400">
              {draftDesc.length}/2000
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export type ChecklistPanelProps = {
  open: boolean;
  errors: ValidationError[];
  onToggle: () => void;
  onLocate: (nodeId: string) => void;
};

export function ChecklistPanel({ open, errors, onToggle, onLocate }: ChecklistPanelProps) {
  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative inline-flex items-center justify-center h-8 w-8 rounded-[7px] border transition cursor-pointer',
          open
            ? 'bg-neutral-200 border-neutral-200 text-neutral-800'
            : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200',
        )}
        title="检查清单"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <div
          className={cn(
            'absolute top-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-white',
            errors.length > 0 ? 'bg-rose-500' : 'bg-emerald-500',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-64 bg-white rounded-[10px] shadow-lg border border-neutral-200 z-50 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b border-neutral-100 text-[12px] font-semibold text-neutral-700 bg-neutral-50 flex items-center justify-between">
            <span>检查({errors.length})</span>
          </div>
          <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {errors.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-neutral-500">所有问题均已解决</div>
            ) : (
              <div className="flex flex-col py-0.5">
                {errors.map((err, index) => {
                  const shortId = (err.id.split('_')[1] || err.id).slice(-4);
                  return (
                    <button
                      key={`${err.id}-${index}-${err.msg}`}
                      type="button"
                      onClick={() => onLocate(err.id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-50/70 cursor-pointer text-left transition-colors w-full"
                    >
                      <WorkflowNodeIcon type={err.type} className="w-6 h-6" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="text-[12px] text-neutral-800 font-medium truncate">
                            {err.type}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            {shortId}
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-500 truncate">{err.msg}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
