/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识搭子 · 分片 / QA 预览弹层
 * 版式职责唯一：标题=文件身份；Tab=类型切换与总量；工具栏=筛选与校验；列表=内容；页脚=入库说明。
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Code2,
  Download,
  Search,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { BTN_OUTLINE, FIELD, MODAL_SHELL_FIXED, SKILL_AOP_PRIMARY_BTN } from '@/lib/ui';
import type {
  KnowledgeChunkKind,
  KnowledgeProcessResult,
  KnowledgeQaChunk,
  KnowledgeTextChunk,
} from '@/lib/knowledgeAssistMock';

export type KnowledgeChunkPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  result: KnowledgeProcessResult;
  initialTab?: KnowledgeChunkKind;
  onDownload?: () => void;
  onViewRaw?: () => void;
};

export const KnowledgeChunkPreviewModal: React.FC<KnowledgeChunkPreviewModalProps> = ({
  open,
  onClose,
  result,
  initialTab = 'text',
  onDownload,
  onViewRaw,
}) => {
  const [tab, setTab] = useState<KnowledgeChunkKind>(initialTab);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setQuery('');
    }
  }, [open, initialTab]);

  const textFiltered = useMemo(
    () => filterTextChunks(result.textChunks, query),
    [result.textChunks, query],
  );
  const qaFiltered = useMemo(
    () => filterQaChunks(result.qaChunks, query),
    [result.qaChunks, query],
  );

  if (!open) return null;

  const activeFile = result.files.find((f) => f.kind === tab) ?? result.files[0];
  const totalForTab = tab === 'text' ? result.textCount : result.qaCount;
  const listCount = tab === 'text' ? textFiltered.length : qaFiltered.length;
  const filtering = query.trim().length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="分片预览"
      onClick={onClose}
    >
      <div
        className={cn(MODAL_SHELL_FIXED, 'max-w-[920px]')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 身份 + 操作 */}
        <header className="shrink-0 px-5 pt-4 pb-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-[#181D27] truncate">
                {activeFile?.name ?? '候选分片'}
              </h2>
              <p className="mt-0.5 text-[12px] text-neutral-400 tabular-nums">
                {activeFile?.sizeLabel ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onViewRaw} className={cn(BTN_OUTLINE, 'h-8 gap-1.5')}>
                <Code2 size={13} />
                原始 JSONL
              </button>
              <button
                type="button"
                onClick={onDownload}
                className={cn(SKILL_AOP_PRIMARY_BTN, 'h-8 px-3 rounded-lg text-[13px] gap-1.5')}
              >
                <Download size={13} />
                下载
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 类型切换（数量唯一出口） */}
          <div
            className="mt-3 flex items-center gap-6 border-b border-neutral-100"
            role="tablist"
            aria-label="分片类型"
          >
            <TypeTab
              active={tab === 'text'}
              label="文本分片"
              count={result.textCount}
              onClick={() => setTab('text')}
            />
            <TypeTab
              active={tab === 'qa'}
              label="QA 问答"
              count={result.qaCount}
              onClick={() => setTab('qa')}
            />
          </div>
        </header>

        {/* 筛选 + 全局校验（各出现一次） */}
        <div className="shrink-0 px-5 py-3 flex flex-wrap items-center gap-3 border-b border-neutral-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索正文、问答或来源…"
              className={cn(FIELD, 'pl-8 w-full')}
              aria-label="搜索分片"
            />
          </div>
          <div className="flex items-center gap-3 text-[12px] shrink-0">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 size={14} />
              校验通过
            </span>
            <span className="text-neutral-500 tabular-nums">
              {filtering ? `${listCount} / ${totalForTab} 条` : `${listCount} 条`}
            </span>
          </div>
        </div>

        {/* 内容列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2.5">
          {tab === 'text'
            ? textFiltered.map((chunk) => <TextChunkCard key={chunk.id} chunk={chunk} />)
            : qaFiltered.map((chunk) => <QaChunkCard key={chunk.id} chunk={chunk} />)}
          {listCount === 0 ? (
            <p className="py-10 text-center text-[13px] text-neutral-400">没有匹配的分片</p>
          ) : null}
        </div>

        {/* 入库说明（唯一） */}
        <footer className="shrink-0 px-5 py-3 border-t border-neutral-100">
          <p className="text-[11px] leading-4 text-neutral-400">
            确认入库时直接写入候选 Chunk，不重新解析 JSONL。
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

function TypeTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative pb-2.5 text-[13px] font-medium cursor-pointer transition',
        active ? 'text-[#181D27]' : 'text-neutral-500 hover:text-neutral-800',
      )}
    >
      {label}
      <span className={cn('ml-1.5 tabular-nums', active ? 'text-neutral-600' : 'text-neutral-400')}>
        {count}
      </span>
      {active ? (
        <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[#1565BF]" />
      ) : null}
    </button>
  );
}

function TextChunkCard({ chunk }: { chunk: KnowledgeTextChunk }) {
  return (
    <article className="rounded-[12px] border border-neutral-200 bg-white px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="inline-flex h-5 items-center px-1.5 rounded-md bg-[rgba(21,101,191,0.08)] text-[11px] font-semibold text-[#1565BF]">
            {chunk.id}
          </span>
          <span className="text-[11px] text-neutral-500 truncate">{stripSourceKind(chunk.source)}</span>
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums shrink-0">{chunk.chars} 字符</span>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-[#181D27]">{chunk.body}</p>
    </article>
  );
}

function QaChunkCard({ chunk }: { chunk: KnowledgeQaChunk }) {
  return (
    <article className="rounded-[12px] border border-neutral-200 bg-white px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="inline-flex h-5 items-center px-1.5 rounded-md bg-emerald-50 text-[11px] font-semibold text-emerald-700">
            {chunk.id}
          </span>
          <span className="text-[11px] text-neutral-500 truncate">{stripSourceKind(chunk.source)}</span>
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums shrink-0">{chunk.chars} 字符</span>
      </div>
      <div className="mt-2.5 flex items-start gap-2">
        <span className="w-5 h-5 rounded-full bg-[#1565BF] text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0 mt-0.5">
          Q
        </span>
        <p className="text-[13px] leading-5 text-[#181D27]">{chunk.question}</p>
      </div>
      <div className="mt-2 rounded-[8px] border border-neutral-200 bg-neutral-50 px-2.5 py-2">
        <p className="text-[13px] leading-5 text-[#181D27]">
          <span className="text-neutral-500">A </span>
          {chunk.answer}
        </p>
      </div>
      <p className="mt-2 text-[12px] leading-4 text-neutral-500">
        <span className="font-medium text-neutral-600">依据 </span>
        {chunk.evidence}
      </p>
    </article>
  );
}

/** 去掉来源里重复的类型前缀（类型已由 Tab 表达） */
function stripSourceKind(source: string) {
  return source.replace(/^(普通文本分片|客服\s*QA\s*分片|QA\s*分片)\s*\|\s*/i, '');
}

function filterTextChunks(chunks: KnowledgeTextChunk[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return chunks;
  return chunks.filter(
    (c) =>
      c.body.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q),
  );
}

function filterQaChunks(chunks: KnowledgeQaChunk[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return chunks;
  return chunks.filter(
    (c) =>
      c.question.toLowerCase().includes(q) ||
      c.answer.toLowerCase().includes(q) ||
      c.evidence.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q),
  );
}
