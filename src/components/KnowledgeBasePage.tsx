/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  Circle,
  Pencil,
  Library,
  FileText,
} from '@/lib/icons';
import { Modal } from './common/Modal';
import { CardIcon } from './common/CardIcon';
import { ListPagination, LIST_PAGE_SIZE, paginateItems } from './common/ListPagination';
import {
  BTN_INK,
  BTN_SOFT,
  FIELD,
  FIELD_CTRL,
  LABEL,
  SEARCH_FIELD,
  SELECT_TRIGGER,
} from '@/lib/ui';
import {
  OnlinePageHeader,
  OnlineEmptyRow,
  onlineTableClass,
} from './common/OnlinePageLayout';
import { cn } from '@/lib/utils';
import { ContentBusy } from './common/ContentBusy';
import { useMockLatency } from '@/lib/useMockLatency';
import { KnowledgeStudioWorkspace } from './knowledge/KnowledgeStudioWorkspace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StudioOpen =
  | { kind: 'closed' }
  | { kind: 'landing' }
  | { kind: 'workspace'; kbId: string };

export const KnowledgeBasePage: React.FC = () => {
  const {
    knowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    focusKnowledgeBaseId,
    setFocusKnowledgeBaseId,
    showToast,
    setActiveTab,
  } = useApp();
  const [search, setSearch] = useState('');
  const listBusy = useMockLatency('kb-cards', 'pageList');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [categoryTags, setCategoryTags] = useState<Array<'professional' | 'basic'>>(['professional']);
  const [chunkMethod, setChunkMethod] = useState('general');
  const [embeddingModel, setEmbeddingModel] = useState('Qwen3-Embedding-8B');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingKbId, setRenamingKbId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [page, setPage] = useState(1);
  const [studio, setStudio] = useState<StudioOpen>({ kind: 'closed' });
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCreateMenu = () => {
    if (createMenuCloseTimer.current) {
      clearTimeout(createMenuCloseTimer.current);
      createMenuCloseTimer.current = null;
    }
    setCreateMenuOpen(true);
  };

  const scheduleCloseCreateMenu = () => {
    if (createMenuCloseTimer.current) clearTimeout(createMenuCloseTimer.current);
    createMenuCloseTimer.current = setTimeout(() => setCreateMenuOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (createMenuCloseTimer.current) clearTimeout(createMenuCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (focusKnowledgeBaseId) {
      setStudio({ kind: 'workspace', kbId: focusKnowledgeBaseId });
      setFocusKnowledgeBaseId(null);
    }
  }, [focusKnowledgeBaseId, setFocusKnowledgeBaseId]);

  const filtered = knowledgeBases.filter((k) =>
    k.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pagedFiltered = paginateItems(filtered, page, LIST_PAGE_SIZE);

  const resetCreateForm = () => {
    setNewName('');
    setNewDesc('');
    setCategoryTags(['professional']);
    setChunkMethod('general');
    setEmbeddingModel('Qwen3-Embedding-8B');
  };

  const toggleCategoryTag = (tag: 'professional' | 'basic') => {
    setCategoryTags((prev) =>
      prev.includes(tag) ? (prev.length > 1 ? prev.filter((t) => t !== tag) : prev) : [...prev, tag],
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const kb = createKnowledgeBase(newName.trim().slice(0, 30));
    resetCreateForm();
    setIsCreating(false);
    setStudio({ kind: 'workspace', kbId: kb.id });
  };

  const closeCreateModal = () => {
    setIsCreating(false);
    resetCreateForm();
  };

  const openRenameModal = (kbId: string, currentName: string) => {
    setRenamingKbId(kbId);
    setRenameName(currentName);
  };

  const closeRenameModal = () => {
    setRenamingKbId(null);
    setRenameName('');
  };

  const handleRename = () => {
    if (!renamingKbId || !renameName.trim()) return;
    updateKnowledgeBase(renamingKbId, { name: renameName.trim().slice(0, 30) });
    showToast('知识库已重命名');
    closeRenameModal();
  };

  const openAiCreate = () => {
    setCreateMenuOpen(false);
    try {
      sessionStorage.setItem('js_home_create_mode', 'knowledge');
    } catch {
      /* ignore */
    }
    setActiveTab('platformHome');
  };

  const openFormCreate = () => {
    setCreateMenuOpen(false);
    setIsCreating(true);
  };

  return (
    <div className="flex flex-1 min-h-0 min-w-0 h-full overflow-hidden bg-white">
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white text-neutral-800 font-sans text-xs antialiased min-w-0">
        <div className="shrink-0 px-5 pt-5">
          <OnlinePageHeader title="员工知识">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="搜索知识库名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
              />
            </div>

            <div
              className="relative shrink-0"
              onMouseEnter={openCreateMenu}
              onMouseLeave={scheduleCloseCreateMenu}
            >
              <button
                type="button"
                className={BTN_INK}
                aria-haspopup="menu"
                aria-expanded={createMenuOpen}
                onClick={() => setCreateMenuOpen((v) => !v)}
              >
                <Plus size={14} />
                <span>新建知识库</span>
              </button>
              {createMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 pt-1 w-[280px] animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="rounded-[13px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(17,17,17,0.1)] overflow-hidden py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openAiCreate}
                      className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 cursor-pointer flex items-start gap-2.5"
                    >
                      <Library size={15} strokeWidth={1.75} className="text-neutral-700 shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-neutral-900">
                          对话式创建
                        </span>
                        <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          AI 引导建库，支持文档入库、解析与发布
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openFormCreate}
                      className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 cursor-pointer flex items-start gap-2.5"
                    >
                      <FileText size={15} strokeWidth={1.75} className="text-neutral-700 shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-neutral-900">
                          填写创建
                        </span>
                        <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          填写名称、分类与解析配置后直接建库
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </OnlinePageHeader>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5"
          onScroll={() => {
            if (createMenuOpen) setCreateMenuOpen(false);
          }}
        >
          <ContentBusy busy={listBusy} size="panel" minHeight={240}>
            <div className={onlineTableClass.wrap}>
              <table className={onlineTableClass.table}>
                <thead>
                  <tr className={onlineTableClass.headRow}>
                    <th className={onlineTableClass.thFirst}>知识库</th>
                    <th className={onlineTableClass.th}>文档数</th>
                    <th className={onlineTableClass.th}>字符数</th>
                    <th className={onlineTableClass.thLast}>操作</th>
                  </tr>
                </thead>
                <tbody className={onlineTableClass.body}>
                  {pagedFiltered.length === 0 ? (
                    <OnlineEmptyRow colSpan={4}>暂无知识库，请先创建</OnlineEmptyRow>
                  ) : (
                    pagedFiltered.map((kb) => (
                      <tr
                        key={kb.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setStudio({ kind: 'workspace', kbId: kb.id })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setStudio({ kind: 'workspace', kbId: kb.id });
                          }
                        }}
                        className={cn(onlineTableClass.row, 'cursor-pointer')}
                      >
                        <td className={onlineTableClass.tdFirst}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CardIcon seed={kb.id} size="sm" variant="neutral">
                              {kb.firstChar}
                            </CardIcon>
                            <span className="font-semibold text-neutral-900 truncate hover:text-sky-700 transition-colors">
                              {kb.name}
                            </span>
                          </div>
                        </td>
                        <td className={onlineTableClass.td}>{kb.docCount} 个</td>
                        <td className={cn(onlineTableClass.td, 'font-mono tabular-nums')}>
                          {kb.wordCount.toLocaleString()}
                        </td>
                        <td className={onlineTableClass.tdLast}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenameModal(kb.id, kb.name);
                              }}
                              className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                              title="重命名"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    '删除知识库将导致所有绑定它的数字员工丧失对应的检索能力，确定吗？',
                                  )
                                ) {
                                  deleteKnowledgeBase(kb.id);
                                  if (
                                    studio.kind === 'workspace' &&
                                    studio.kbId === kb.id
                                  ) {
                                    setStudio({ kind: 'closed' });
                                  }
                                }
                              }}
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="删除知识库"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ContentBusy>
        </div>

        {filtered.length > LIST_PAGE_SIZE ? (
          <div className="shrink-0 px-5 pb-5 pt-3 border-t border-neutral-200">
            <ListPagination total={filtered.length} page={page} onPageChange={setPage} />
          </div>
        ) : null}

        <Modal
          open={isCreating}
          onClose={closeCreateModal}
          title="创建知识库"
          maxWidth="max-w-md"
          footer={
            <>
              <button type="button" onClick={closeCreateModal} className={BTN_SOFT}>
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className={BTN_INK}
              >
                确定
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={LABEL}>
                知识库名称 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="请输入知识库名称"
                  value={newName}
                  maxLength={30}
                  onChange={(e) => setNewName(e.target.value)}
                  className={cn(FIELD, FIELD_CTRL, 'pr-12')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 tabular-nums pointer-events-none">
                  {newName.length}/30
                </span>
              </div>
            </div>

            <div>
              <label className={LABEL}>描述</label>
              <div className="relative">
                <textarea
                  placeholder="请输入知识库描述"
                  value={newDesc}
                  maxLength={200}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={cn(FIELD, 'min-h-[80px] resize-y pr-12 py-2')}
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-neutral-500 tabular-nums pointer-events-none">
                  {newDesc.length}/200
                </span>
              </div>
            </div>

            <div>
              <label className={LABEL}>分类标签（可多选）</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'professional' as const,
                    label: '专业知识',
                    hint: '默认',
                    desc: '面向业务场景的专业文档与政策条款',
                  },
                  {
                    id: 'basic' as const,
                    label: '基础知识',
                    hint: '',
                    desc: '通用 FAQ、入门说明与基础话术',
                  },
                ].map((tag) => {
                  const selected = categoryTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleCategoryTag(tag.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 h-8 px-2.5 rounded-[7px] border text-left transition cursor-pointer',
                        selected
                          ? 'border-neutral-300 bg-neutral-50'
                          : 'border-neutral-200/50 bg-white hover:bg-neutral-50',
                      )}
                    >
                      {selected ? (
                        <Check size={14} className="text-neutral-800 shrink-0" />
                      ) : (
                        <Circle size={14} className="text-neutral-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-neutral-800">
                        {tag.label}
                        {tag.hint ? `（${tag.hint}）` : ''}
                      </span>
                      <HelpCircle
                        size={12}
                        className="text-neutral-400 shrink-0 ml-auto"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={LABEL}>分块方法</label>
              <Select value={chunkMethod} onValueChange={(v) => v && setChunkMethod(v)}>
                <SelectTrigger
                  className={cn(SELECT_TRIGGER, 'w-full justify-between')}
                  aria-label="分块方法"
                >
                  <SelectValue>
                    {chunkMethod === 'qa'
                      ? '问答对切分'
                      : chunkMethod === 'table'
                        ? '表格结构化'
                        : '通用解析'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用解析</SelectItem>
                  <SelectItem value="qa">问答对切分</SelectItem>
                  <SelectItem value="table">表格结构化</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-neutral-500 mt-1">选择适合您文档类型的分块方法</p>
            </div>

            <div>
              <label className={LABEL}>
                嵌入模型 <span className="text-rose-500">*</span>
              </label>
              <Select
                value={embeddingModel}
                onValueChange={(v) => v && setEmbeddingModel(v)}
              >
                <SelectTrigger
                  className={cn(SELECT_TRIGGER, 'w-full justify-between')}
                  aria-label="嵌入模型"
                >
                  <SelectValue>
                    {embeddingModel === 'text-embedding-3-small'
                      ? 'text-embedding-3-small'
                      : embeddingModel === 'bge-m3'
                        ? 'BGE-M3'
                        : 'Qwen3-Embedding-8B'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qwen3-Embedding-8B">Qwen3-Embedding-8B</SelectItem>
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="bge-m3">BGE-M3</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-neutral-500 mt-1">选择用于生成向量嵌入的模型</p>
            </div>
          </div>
        </Modal>

        <Modal
          open={renamingKbId !== null}
          onClose={closeRenameModal}
          title="重命名知识库"
          maxWidth="max-w-sm"
          footer={
            <>
              <button type="button" onClick={closeRenameModal} className={BTN_SOFT}>
                取消
              </button>
              <button
                type="button"
                onClick={handleRename}
                disabled={!renameName.trim()}
                className={BTN_INK}
              >
                确定
              </button>
            </>
          }
        >
          <div>
            <label className={LABEL}>
              知识库名称 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="请输入知识库名称"
                value={renameName}
                maxLength={30}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameName.trim()) handleRename();
                }}
                className={cn(FIELD, FIELD_CTRL, 'pr-12')}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 tabular-nums pointer-events-none">
                {renameName.length}/30
              </span>
            </div>
          </div>
        </Modal>
      </div>

      <KnowledgeStudioWorkspace
        open={studio.kind !== 'closed'}
        onClose={() => setStudio({ kind: 'closed' })}
        closeLabel="返回列表"
        initialKbId={studio.kind === 'workspace' ? studio.kbId : null}
      />
    </div>
  );
};
