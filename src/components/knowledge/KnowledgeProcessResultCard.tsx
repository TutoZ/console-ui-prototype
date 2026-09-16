/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识搭子 · 文档处理结果确认卡
 * 结构对齐 SkillRoundConfirmCard：灰底壳 + 可折叠头栏 + 白底要点 + 底部操作。
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Download,
  Eye,
  FileText,
  RotateCcw,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  BTN_DANGER_SM,
  BTN_OUTLINE_SM,
  BTN_SOFT_SM,
  SKILL_AOP_PRIMARY_BTN_SM,
  confirmStatusBadgeClass,
} from '@/lib/ui';
import type { KnowledgeProcessFile, KnowledgeProcessResult } from '@/lib/knowledgeAssistMock';

export type KnowledgeProcessResultCardProps = {
  result: KnowledgeProcessResult;
  confirmed?: boolean;
  discarded?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onPreviewFile?: (file: KnowledgeProcessFile) => void;
  onDownloadFile?: (file: KnowledgeProcessFile) => void;
  onConfirm?: () => void;
  onReprocess?: () => void;
  onDiscard?: () => void;
};

export const KnowledgeProcessResultCard: React.FC<KnowledgeProcessResultCardProps> = ({
  result,
  confirmed = false,
  discarded = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  onPreviewFile,
  onDownloadFile,
  onConfirm,
  onReprocess,
  onDiscard,
}) => {
  const locked = confirmed || discarded;
  const headerButtonRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(() =>
    collapsedProp != null ? collapsedProp : locked,
  );

  useEffect(() => {
    if (collapsedProp != null) setCollapsed(collapsedProp);
  }, [collapsedProp]);

  useEffect(() => {
    if (locked) setCollapsed(true);
  }, [locked]);

  const setCollapsedAndSync = (next: boolean) => {
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const statusBadge = confirmed ? (
    <span className={confirmStatusBadgeClass('confirmed')}>已确认</span>
  ) : discarded ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-medium">
      已放弃
    </span>
  ) : (
    <span className={confirmStatusBadgeClass('pending')}>待确认</span>
  );

  return (
    <div className="w-full max-w-[min(100%,420px)] rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden animate-in fade-in duration-200">
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
            <span className="text-[13px] font-semibold text-neutral-600 leading-5">确认信息</span>
            {statusBadge}
            {collapsed ? (
              <span className="truncate text-[11px] text-neutral-400">
                {confirmed
                  ? `已入库 ${result.total} 条`
                  : discarded
                    ? '未写入知识库'
                    : `${result.total} 条候选`}
              </span>
            ) : null}
          </div>
          {collapsed ? (
            <ChevronDown size={14} className="shrink-0 text-neutral-400" />
          ) : (
            <ChevronUp size={14} className="shrink-0 text-neutral-400" />
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="px-3 pb-2.5 space-y-2">
          <div className="rounded bg-white p-3 space-y-2.5">
            <div className="space-y-2 text-[13px] leading-5 text-neutral-700">
              <p>
                我按照工作表结构、业务主题和语义边界对内容进行了整理，并保留了原始文件、Sheet
                和行号，方便后续追溯。
              </p>
              <p>
                本次共生成 <span className="font-semibold text-neutral-900">{result.total}</span>{' '}
                条候选知识：
              </p>
              <ul className="space-y-1 pl-1">
                <li>
                  · <span className="font-semibold text-neutral-900">{result.textCount}</span>{' '}
                  条普通文本分片；
                </li>
                <li>
                  · <span className="font-semibold text-neutral-900">{result.qaCount}</span> 条
                  QA 客服问答对；
                </li>
                <li>
                  · 已清洗并过滤{' '}
                  <span className="font-semibold text-neutral-900">{result.filteredCount}</span>{' '}
                  条无效及重复内容。
                </li>
              </ul>
              <p>
                所有切片与问答对均已完成语义规范清洗与切分，单行即一条候选
                Chunk，支持回查原始坐标。你可以点击下方卡片预览或直接确认入库。
              </p>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {result.files.map((file) => (
                <ProcessFileRow
                  key={file.id}
                  file={file}
                  onPreview={() => onPreviewFile?.(file)}
                  onDownload={() => onDownloadFile?.(file)}
                />
              ))}
            </div>
          </div>

          {confirmed ? (
            <div className="flex items-center gap-1.5 px-0.5 py-0.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[12px] text-emerald-700">已写入当前知识库</span>
            </div>
          ) : discarded ? (
            <p className="px-0.5 text-[12px] text-neutral-500">已放弃本次结果，未写入知识库。</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  headerButtonRef.current?.focus({ preventScroll: true });
                  onConfirm?.();
                }}
                className={SKILL_AOP_PRIMARY_BTN_SM}
              >
                确认入库
              </button>
              <button type="button" onClick={onReprocess} className={BTN_SOFT_SM}>
                <span className="inline-flex items-center gap-1">
                  <RotateCcw size={11} />
                  重新处理
                </span>
              </button>
              <button type="button" onClick={onDiscard} className={BTN_DANGER_SM}>
                放弃
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

function ProcessFileRow({
  file,
  onPreview,
  onDownload,
}: {
  file: KnowledgeProcessFile;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const isQa = file.kind === 'qa';
  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-2 py-1.5">
      <span
        className={cn(
          'w-7 h-7 rounded-md shrink-0 flex items-center justify-center',
          isQa ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600',
        )}
        aria-hidden
      >
        <Code2 size={14} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-neutral-800 truncate leading-4">{file.name}</p>
        <p className="text-[11px] text-neutral-400 tabular-nums leading-4 mt-0.5">
          {isQa ? 'QA' : '文本'} · {file.count} 条 · {file.sizeLabel}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className={cn(BTN_OUTLINE_SM, 'h-6 px-1.5 gap-0.5')}
          title="预览"
        >
          <Eye size={11} />
          预览
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={cn(BTN_OUTLINE_SM, 'h-6 px-1.5 gap-0.5')}
          title="下载"
        >
          <Download size={11} />
        </button>
      </div>
    </div>
  );
}
