/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Trash2, Upload, FileUp, Sparkles, HelpCircle, Check, Circle, Pencil } from '@/lib/icons';
import { Modal } from './common/Modal';
import { CardIcon } from './common/CardIcon';
import { ListPagination, LIST_PAGE_SIZE, paginateItems } from './common/ListPagination';
import { BTN_INK, BTN_SOFT, FIELD, FIELD_CTRL, LABEL, SEARCH_FIELD, SELECT_TRIGGER } from '@/lib/ui';
import {
  OnlinePageHeader,
  OnlineEmptyRow,
  onlineTableClass,
} from './common/OnlinePageLayout';
import { cn } from '@/lib/utils';
import { ContentBusy } from './common/ContentBusy';
import { CompanionAssistPanel } from './common/CompanionAssistPanel';
import { useMockLatency } from '@/lib/useMockLatency';
import { KnowledgeBaseWorkspace } from './knowledge/KnowledgeBaseWorkspace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COMPANION_OPEN_KEY = 'js_companion_assist_open';

function readCompanionOpen(): boolean {
  try {
    const v = localStorage.getItem(COMPANION_OPEN_KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export const KnowledgeBasePage: React.FC = () => {
  const {
    knowledgeBases,
    hiredAgents,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    focusKnowledgeBaseId,
    setFocusKnowledgeBaseId,
    showToast,
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
  const [companionOpen, setCompanionOpen] = useState(readCompanionOpen);
  const [activeKBId, setActiveKBId] = useState<string | null>(null);

  const handleCompanionOpenChange = (next: boolean) => {
    setCompanionOpen(next);
    try {
      localStorage.setItem(COMPANION_OPEN_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (focusKnowledgeBaseId) {
      setActiveKBId(focusKnowledgeBaseId);
      setFocusKnowledgeBaseId(null);
    }
  }, [focusKnowledgeBaseId, setFocusKnowledgeBaseId]);

  const activeKb = useMemo(
    () => (activeKBId ? knowledgeBases.find((k) => k.id === activeKBId) ?? null : null),
    [activeKBId, knowledgeBases],
  );

  const activeKbAgentNames = useMemo(() => {
    if (!activeKb) return '暂无绑定员工';
    const names = hiredAgents
      .filter((a) => a.knowledgeBases.includes(activeKb.id))
      .map((a) => a.name);
    return names.length > 0 ? names.join('、') : '暂无绑定员工';
  }, [activeKb, hiredAgents]);

  useEffect(() => {
    if (activeKBId && !activeKb) setActiveKBId(null);
  }, [activeKBId, activeKb]);

  const filtered = knowledgeBases.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase())
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
    createKnowledgeBase(newName.trim().slice(0, 30));
    resetCreateForm();
    setIsCreating(false);
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

  if (activeKb) {
    return (
      <div className="flex flex-1 min-h-0 min-w-0 h-full overflow-hidden bg-white">
        <KnowledgeBaseWorkspace
          kb={activeKb}
          agentName={activeKbAgentNames}
          onBack={() => setActiveKBId(null)}
          onUpdateKb={updateKnowledgeBase}
          showToast={(message) => showToast(message)}
          variant="page"
          companionOpen={companionOpen}
          onOpenCompanion={() => handleCompanionOpenChange(true)}
        />
        <CompanionAssistPanel
          open={companionOpen}
          onOpenChange={handleCompanionOpenChange}
          highlightValue={knowledgeBases.length}
          tools={[
            {
              id: 'create',
              label: '智能建库',
              icon: <Plus size={16} strokeWidth={1.75} />,
              onClick: () => {
                setIsCreating(true);
                setActiveKBId(null);
              },
            },
            {
              id: 'upload',
              label: '文档入库',
              icon: <Upload size={16} strokeWidth={1.75} />,
              onClick: () => {
                showToast('请在文档列表中点击「上传文档」');
              },
            },
            {
              id: 'search',
              label: '知识检索',
              icon: <Search size={16} strokeWidth={1.75} />,
            },
            {
              id: 'gap',
              label: '缺口分析',
              icon: <Sparkles size={16} strokeWidth={1.75} />,
            },
            {
              id: 'qa',
              label: '问答试跑',
              icon: <HelpCircle size={16} strokeWidth={1.75} />,
            },
            {
              id: 'batch',
              label: '批量整理',
              icon: <FileUp size={16} strokeWidth={1.75} />,
            },
          ]}
          onSend={(text) => {
            showToast(`搭子已收到：${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 min-w-0 h-full overflow-hidden bg-white">
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white text-neutral-800 font-sans text-xs antialiased min-w-0">
      <div className="shrink-0 px-5 pt-5">
      <OnlinePageHeader title="员工知识">
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="搜索知识库名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
          />
        </div>

        <button type="button" onClick={() => setIsCreating(true)} className={BTN_INK}>
          <Plus size={14} />
          <span>新建知识库</span>
        </button>
      </OnlinePageHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5">
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
                    onClick={() => setActiveKBId(kb.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveKBId(kb.id);
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
                              if (activeKBId === kb.id) setActiveKBId(null);
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

      {/* CREATE KB MODAL */}
      <Modal
        open={isCreating}
        onClose={closeCreateModal}
        title="创建知识库"
        maxWidth="max-w-md"
        footer={
          <>
            <button type="button" onClick={closeCreateModal} className={BTN_SOFT}>取消</button>
            <button type="button" onClick={handleCreate} disabled={!newName.trim()} className={BTN_INK}>确定</button>
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
                { id: 'professional' as const, label: '专业知识', hint: '默认', desc: '面向业务场景的专业文档与政策条款' },
                { id: 'basic' as const, label: '基础知识', hint: '', desc: '通用 FAQ、入门说明与基础话术' },
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
                    <HelpCircle size={12} className="text-neutral-400 shrink-0 ml-auto" title={tag.desc} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL}>分块方法</label>
            <Select
              value={chunkMethod}
              onValueChange={(v) => v && setChunkMethod(v)}
            >
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
            <button type="button" onClick={closeRenameModal} className={BTN_SOFT}>取消</button>
            <button type="button" onClick={handleRename} disabled={!renameName.trim()} className={BTN_INK}>确定</button>
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

      <CompanionAssistPanel
        open={companionOpen}
        onOpenChange={handleCompanionOpenChange}
        highlightValue={knowledgeBases.length}
        tools={[
          {
            id: 'create',
            label: '智能建库',
            icon: <Plus size={16} strokeWidth={1.75} />,
            onClick: () => setIsCreating(true),
          },
          {
            id: 'upload',
            label: '文档入库',
            icon: <Upload size={16} strokeWidth={1.75} />,
            onClick: () => {
              if (filtered[0]) {
                setActiveKBId(filtered[0].id);
              } else {
                showToast('请先新建知识库', 'warning');
              }
            },
          },
          {
            id: 'search',
            label: '知识检索',
            icon: <Search size={16} strokeWidth={1.75} />,
          },
          {
            id: 'gap',
            label: '缺口分析',
            icon: <Sparkles size={16} strokeWidth={1.75} />,
          },
          {
            id: 'qa',
            label: '问答试跑',
            icon: <HelpCircle size={16} strokeWidth={1.75} />,
          },
          {
            id: 'batch',
            label: '批量整理',
            icon: <FileUp size={16} strokeWidth={1.75} />,
          },
        ]}
        onSend={(text) => {
          showToast(`搭子已收到：${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`);
        }}
      />
    </div>
  );
};
