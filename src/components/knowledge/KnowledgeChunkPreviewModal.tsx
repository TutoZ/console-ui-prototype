/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识搭子 · 分片 / QA 预览弹层
 * 结构化视图 + 原始 JSONL 视图（可切换）。
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Search,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  BTN_INK,
  BTN_OUTLINE,
  FIELD,
  MODAL_SHELL_FIXED,
  SKILL_AOP_PRIMARY_BTN,
} from '@/lib/ui';
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
  /** @deprecated 已内置原始 JSONL 视图；保留兼容 */
  onViewRaw?: () => void;
};

type ViewMode = 'structured' | 'raw';

export const KnowledgeChunkPreviewModal: React.FC<KnowledgeChunkPreviewModalProps> = ({
  open,
  onClose,
  result,
  initialTab = 'text',
  onDownload,
}) => {
  const [tab, setTab] = useState<KnowledgeChunkKind>(initialTab);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setQuery('');
      setViewMode('structured');
      setCopied(false);
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

  const jsonlLines = useMemo(
    () => (tab === 'text' ? buildTextJsonl(result) : buildQaJsonl(result)),
    [tab, result],
  );
  const jsonlText = useMemo(() => jsonlLines.join('\n'), [jsonlLines]);

  if (!open) return null;

  const activeFile = result.files.find((f) => f.kind === tab) ?? result.files[0];
  const totalForTab = tab === 'text' ? result.textCount : result.qaCount;
  const isQa = tab === 'qa';

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(jsonlText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonlText], { type: 'application/x-ndjson;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile?.name ?? `${tab}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    onDownload?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={viewMode === 'raw' ? '原始 JSONL 预览' : '分片预览'}
      onClick={onClose}
    >
      <div
        className={cn(MODAL_SHELL_FIXED, 'max-w-[920px]')}
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === 'structured' ? (
          <>
            <header className="shrink-0 px-5 pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#181D27] truncate">
                    {activeFile?.name ?? '候选分片'}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-neutral-400 tabular-nums">
                    {isQa ? 'QA 问答' : '文本分片'} · {totalForTab} 条 · {activeFile?.sizeLabel ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className={cn(SKILL_AOP_PRIMARY_BTN, 'h-8 px-3 rounded-lg text-[13px]')}
                  >
                    <Download size={13} className="shrink-0" />
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
            </header>

            <div className="shrink-0 px-5 py-3 border-b border-neutral-100">
              <div className="relative w-full">
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
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2.5">
              {isQa
                ? qaFiltered.map((chunk) => <QaChunkCard key={chunk.id} chunk={chunk} />)
                : textFiltered.map((chunk) => <TextChunkCard key={chunk.id} chunk={chunk} />)}
              {(isQa ? qaFiltered : textFiltered).length === 0 ? (
                <p className="py-10 text-center text-[13px] text-neutral-400">没有匹配的分片</p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <header className="shrink-0 px-5 pt-4 pb-3 border-b border-neutral-100">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center',
                    isQa ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600',
                  )}
                  aria-hidden
                >
                  <FileText size={18} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#181D27] truncate">
                    {activeFile?.name ?? '候选分片.jsonl'}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex h-5 items-center px-1.5 rounded-md text-[11px] font-medium',
                        isQa
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[rgba(21,101,191,0.08)] text-[#1565BF]',
                      )}
                    >
                      {isQa ? 'QA 分片' : '文本分片'} · {totalForTab} 条
                    </span>
                    <span className="inline-flex h-5 items-center px-1.5 rounded-md bg-neutral-100 text-[11px] text-neutral-500 tabular-nums">
                      {activeFile?.sizeLabel ?? '—'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed line-clamp-2">
                    {isQa
                      ? '提取自高频客服问答场景的结构化问答对与原表佐证 · 单行即一条候选 Chunk，可直接按 Chunk ID 幂等入库。'
                      : '按业务主题与语义边界切分的普通文本分片 · 单行即一条候选 Chunk，可直接按 Chunk ID 幂等入库。'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 max-w-[420px]">
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100">
                    <RawTypeChip
                      active={tab === 'text'}
                      label={`文本分片 (${result.textCount}条)`}
                      onClick={() => setTab('text')}
                    />
                    <RawTypeChip
                      active={tab === 'qa'}
                      label={`QA问答 (${result.qaCount}条)`}
                      onClick={() => setTab('qa')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('structured')}
                    className={cn(BTN_INK, 'h-8 gap-1')}
                  >
                    <ChevronLeft size={14} />
                    返回结构化视图
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className={cn(SKILL_AOP_PRIMARY_BTN, 'h-8 px-3 rounded-lg text-[13px]')}
                  >
                    <Download size={13} className="shrink-0" />
                    下载文件
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
            </header>

            <div className="shrink-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#2B2F36] text-[11px] text-neutral-300">
              <p className="min-w-0 leading-4">
                每一行一条完整的标准 JSON 对象（NDJSON / JSON Lines 规范）· RAGFlow 可直接按 Chunk
                ID 幂等入库
              </p>
              <button
                type="button"
                onClick={handleCopyAll}
                className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white/10 hover:bg-white/15 text-white cursor-pointer transition"
              >
                <Copy size={12} />
                {copied ? '已复制' : '一键复制全部 JSONL'}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto bg-[#1E2228] custom-scrollbar">
              <pre className="min-w-full text-[12px] leading-5 font-mono">
                <code className="block">
                  {jsonlLines.map((line, i) => (
                    <div key={i} className="flex hover:bg-white/[0.03]">
                      <span className="w-10 shrink-0 select-none text-right pr-3 py-0.5 text-neutral-500 tabular-nums border-r border-white/5">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 px-3 py-0.5 text-[#E8EAED] whitespace-pre-wrap break-all">
                        {colorizeJsonLine(line)}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            <footer className="shrink-0 px-5 py-3 border-t border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50/80">
              <p className="text-[11px] leading-4 text-neutral-500 min-w-0">
                提示：用户确认入库时，系统直接读取候选 Chunk 写入知识库，不重新解析或切分 JSONL
                文件。
              </p>
              <button type="button" onClick={onClose} className={cn(BTN_OUTLINE, 'h-8 shrink-0')}>
                关闭预览
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

function RawTypeChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 rounded-md text-[12px] font-medium cursor-pointer transition',
        active
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-600 hover:text-neutral-800',
      )}
    >
      {label}
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
    <article className="rounded-[12px] border border-neutral-200 bg-white px-3.5 py-3 space-y-2">
      <span className="inline-flex h-5 items-center px-1.5 rounded-md bg-emerald-50 text-[11px] font-semibold text-emerald-700">
        {chunk.id}
      </span>
      <p className="text-[13px] leading-5 text-[#181D27]">
        <span className="mr-1.5 font-medium text-neutral-400">Q</span>
        {chunk.question}
      </p>
      <p className="text-[13px] leading-5 text-neutral-700">
        <span className="mr-1.5 font-medium text-neutral-400">A</span>
        {chunk.answer}
      </p>
    </article>
  );
}

function stripSourceKind(source: string) {
  return source.replace(/^(普通文本分片|客服\s*QA\s*分片|QA\s*分片)\s*\|\s*/i, '');
}

function parseSourceMeta(source: string, fileName: string) {
  const sheet = source.match(/Sheet:\s*([^·]+)/)?.[1]?.trim() ?? '';
  const rows = source.match(/第\s*([\d\-–]+)\s*行/)?.[1] ?? '';
  const [startRow, endRow] = rows.split(/[-–]/).map((s) => Number(s) || undefined);
  return {
    file_id: fileName,
    file_name: fileName,
    sheet,
    start_row: startRow,
    end_row: endRow ?? startRow,
  };
}

function buildTextJsonl(result: KnowledgeProcessResult): string[] {
  return result.textChunks.map((c) =>
    JSON.stringify({
      candidate_chunk_id: c.id,
      chunk_type: 'text',
      content: c.body,
      source: parseSourceMeta(c.source, result.sourceFileName),
    }),
  );
}

function buildQaJsonl(result: KnowledgeProcessResult): string[] {
  return result.qaChunks.map((c) =>
    JSON.stringify({
      candidate_chunk_id: c.id,
      chunk_type: 'qa',
      question: c.question,
      answer: c.answer,
      evidence: c.evidence,
      source: parseSourceMeta(c.source, result.sourceFileName),
    }),
  );
}

/** 简易 JSON 着色：键浅蓝、字符串近白、标点灰 */
function colorizeJsonLine(line: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(\{|\}|\[|\]|,)|(\s+)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) {
      nodes.push(
        <span key={i++} className="text-[#CE9178]">
          {line.slice(last, m.index)}
        </span>,
      );
    }
    if (m[1] != null) {
      if (m[2] != null) {
        nodes.push(
          <span key={i++} className="text-[#9CDCFF]">
            {m[1]}
          </span>,
        );
        nodes.push(
          <span key={i++} className="text-neutral-400">
            {m[2]}
          </span>,
        );
      } else {
        nodes.push(
          <span key={i++} className="text-[#E8EAED]">
            {m[1]}
          </span>,
        );
      }
    } else if (m[3]) {
      nodes.push(
        <span key={i++} className="text-neutral-400">
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      nodes.push(
        <span key={i++} className="text-neutral-500">
          {m[4]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    nodes.push(
      <span key={i++} className="text-[#CE9178]">
        {line.slice(last)}
      </span>,
    );
  }
  return nodes;
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
