/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识库文档 · 分片详情弹层
 * 交互对齐 KnowledgeChunkPreviewModal（遮罩 + 固定高度壳）；
 * 功能为库内分片管理：搜索 / 新增 / 复制 / 编辑 / 删除。
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, FileText, Pencil, Plus, Search, Trash2, X } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { BTN_INK, FIELD, LIST_META, MODAL_SHELL_FIXED, PANEL, SEARCH_FIELD } from '@/lib/ui';

export type KnowledgeDocChunk = {
  id: string;
  index: number;
  body: string;
};

export type KnowledgeDocChunksModalProps = {
  open: boolean;
  onClose: () => void;
  docName: string;
  docStatus?: 'done' | 'parsing' | 'pending';
  chunks: KnowledgeDocChunk[];
  onChunksChange: (chunks: KnowledgeDocChunk[]) => void;
  showToast?: (message: string) => void;
};

export const KnowledgeDocChunksModal: React.FC<KnowledgeDocChunksModalProps> = ({
  open,
  onClose,
  docName,
  docStatus = 'done',
  chunks,
  onChunksChange,
  showToast,
}) => {
  const [query, setQuery] = useState('');
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setEditingChunkId(null);
    setEditDraft('');
  }, [open, docName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chunks;
    return chunks.filter((c) => c.body.toLowerCase().includes(q));
  }, [chunks, query]);

  if (!open) return null;

  const toast = (msg: string) => showToast?.(msg);

  const renumber = (list: KnowledgeDocChunk[]) =>
    list.map((c, i) => ({ ...c, index: i + 1 }));

  const handleAdd = () => {
    const created: KnowledgeDocChunk = {
      id: `chunk_${Date.now()}`,
      index: 1,
      body: '',
    };
    const next = renumber([created, ...chunks]);
    onChunksChange(next);
    setEditingChunkId(created.id);
    setEditDraft('');
    toast('已新增分片，可直接编辑内容');
  };

  const handleCopy = async (chunk: KnowledgeDocChunk) => {
    try {
      await navigator.clipboard.writeText(chunk.body);
      toast('已复制分片内容');
    } catch {
      toast('复制失败，请手动选择文本');
    }
  };

  const handleDelete = (chunkId: string) => {
    const next = renumber(chunks.filter((c) => c.id !== chunkId));
    onChunksChange(next);
    if (editingChunkId === chunkId) {
      setEditingChunkId(null);
      setEditDraft('');
    }
    toast('已删除分片');
  };

  const startEdit = (chunk: KnowledgeDocChunk) => {
    setEditingChunkId(chunk.id);
    setEditDraft(chunk.body);
  };

  const saveEdit = () => {
    if (!editingChunkId) return;
    onChunksChange(
      chunks.map((c) => (c.id === editingChunkId ? { ...c, body: editDraft } : c)),
    );
    setEditingChunkId(null);
    setEditDraft('');
    toast('分片已保存');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="文档分片详情"
      onClick={onClose}
    >
      <div
        className={cn(MODAL_SHELL_FIXED, 'max-w-[920px]')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-5 pt-4 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-[#181D27] truncate">{docName}</h2>
              <p className="mt-0.5 text-[12px] text-neutral-400 tabular-nums">
                分片详情 · {chunks.length} 条
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={handleAdd} className={cn(BTN_INK, 'h-8 gap-1.5')}>
                <Plus size={13} />
                新增分片
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
              placeholder="搜索切片内容…"
              className={cn(SEARCH_FIELD, 'pl-8 w-full')}
              aria-label="搜索切片内容"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className={cn(PANEL, 'p-10 text-center border-dashed')}>
              <FileText size={28} className="mx-auto text-neutral-400 mb-3" />
              <p className="text-sm font-semibold text-neutral-800">
                {query.trim()
                  ? '没有匹配的分片'
                  : docStatus === 'done'
                    ? '暂无分片'
                    : '文档尚未完成解析'}
              </p>
              <p className={cn(LIST_META, 'mt-1.5')}>
                {query.trim() ? '试试其他关键词' : '可点击「新增分片」手动添加'}
              </p>
              {!query.trim() ? (
                <button type="button" onClick={handleAdd} className={cn(BTN_INK, 'mt-4')}>
                  <Plus size={13} />
                  新增分片
                </button>
              ) : null}
            </div>
          ) : (
            filtered.map((chunk) => {
              const editing = editingChunkId === chunk.id;
              const chars = (editing ? editDraft : chunk.body).length;
              return (
                <article
                  key={chunk.id}
                  className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-semibold text-neutral-900 tabular-nums">
                        CHUNK #{chunk.index}
                      </span>
                      <span className="text-[12px] text-neutral-400 tabular-nums">{chars} 字符</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleCopy(chunk)}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 cursor-pointer"
                        aria-label="复制分片"
                        title="复制"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => (editing ? saveEdit() : startEdit(chunk))}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 cursor-pointer"
                        aria-label={editing ? '保存分片' : '编辑分片'}
                        title={editing ? '保存' : '编辑'}
                      >
                        {editing ? <Check size={14} /> : <Pencil size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(chunk.id)}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        aria-label="删除分片"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {editing ? (
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={10}
                      className={cn(
                        FIELD,
                        'mt-3 w-full min-h-[160px] py-2.5 text-[13px] leading-6 text-neutral-800 whitespace-pre-wrap',
                      )}
                      aria-label={`编辑 CHUNK #${chunk.index}`}
                    />
                  ) : (
                    <p className="mt-3 text-[13px] leading-6 text-neutral-700 whitespace-pre-wrap">
                      {chunk.body || (
                        <span className="text-neutral-400">暂无内容，点击编辑补充</span>
                      )}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
