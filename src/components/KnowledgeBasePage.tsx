/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Trash2, Upload, FileUp, Sparkles, HelpCircle, Check, Circle, Pencil } from '@/lib/icons';
import { Modal } from './common/Modal';
import { CardIcon } from './common/CardIcon';
import { ListPagination, LIST_PAGE_SIZE, paginateItems } from './common/ListPagination';
import { BTN_INK, BTN_SOFT, FIELD, LABEL, SEARCH_FIELD } from '@/lib/ui';
import {
  OnlinePageHeader,
  OnlineSectionHeader,
  OnlineEmptyRow,
  onlineTableClass,
} from './common/OnlinePageLayout';
import { cn } from '@/lib/utils';
import { pickMockLatencyMs } from '@/lib/mockLatency';
import { ContentBusy } from './common/ContentBusy';
import { CompanionAssistOpenButton, CompanionAssistPanel } from './common/CompanionAssistPanel';
import { useMockLatency } from '@/lib/useMockLatency';

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
  const { knowledgeBases, createKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, focusKnowledgeBaseId, setFocusKnowledgeBaseId, showToast } = useApp();
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

  const handleCompanionOpenChange = (next: boolean) => {
    setCompanionOpen(next);
    try {
      localStorage.setItem(COMPANION_OPEN_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  // Drag and drop states for file uploading inside selected KB
  const [activeKBId, setActiveKBId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedMsgs, setUploadedMsgs] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusKnowledgeBaseId) {
      setActiveKBId(focusKnowledgeBaseId);
      setUploadedMsgs(null);
      setFocusKnowledgeBaseId(null);
    }
  }, [focusKnowledgeBaseId, setFocusKnowledgeBaseId]);

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

  // Drag-and-drop logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    if (!activeKBId) return;
    setUploadedMsgs(`正在解析文件：\n- 文件名: ${file.name}\n- 大小: ${(file.size/1024).toFixed(1)} KB`);

    setTimeout(() => {
      // Simulate success, adding document to the active KB
      knowledgeBases.forEach(kb => {
        if (kb.id === activeKBId) {
          kb.docCount += 1;
          kb.wordCount += Math.floor(2500 + Math.random() * 5000);
          kb.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
      });
      setUploadedMsgs(`解析完成，文件已加入知识库。`);
      setTimeout(() => setUploadedMsgs(null), 3000);
    }, pickMockLatencyMs('upload'));
  };

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
        {!companionOpen ? (
          <CompanionAssistOpenButton onClick={() => handleCompanionOpenChange(true)} />
        ) : null}
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
                <th className={onlineTableClass.th}>更新时间</th>
                <th className={onlineTableClass.thLast}>操作</th>
              </tr>
            </thead>
            <tbody className={onlineTableClass.body}>
              {pagedFiltered.length === 0 ? (
                <OnlineEmptyRow colSpan={5}>暂无知识库，请先创建</OnlineEmptyRow>
              ) : (
                pagedFiltered.map((kb) => (
                  <tr
                    key={kb.id}
                    className={cn(
                      onlineTableClass.row,
                      activeKBId === kb.id && 'bg-neutral-50/60',
                    )}
                  >
                    <td className={onlineTableClass.tdFirst}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CardIcon seed={kb.id} size="sm" variant="soft">
                          {kb.firstChar}
                        </CardIcon>
                        <span className="font-semibold text-neutral-900 truncate">{kb.name}</span>
                      </div>
                    </td>
                    <td className={onlineTableClass.td}>{kb.docCount} 个</td>
                    <td className={cn(onlineTableClass.td, 'font-mono tabular-nums')}>
                      {kb.wordCount.toLocaleString()}
                    </td>
                    <td className={cn(onlineTableClass.td, 'text-neutral-500')}>{kb.updatedAt}</td>
                    <td className={onlineTableClass.tdLast}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveKBId(kb.id);
                            setUploadedMsgs(null);
                          }}
                          className="text-[11px] font-semibold text-live hover:underline cursor-pointer"
                        >
                          上传
                        </button>
                        <button
                          type="button"
                          onClick={() => openRenameModal(kb.id, kb.name)}
                          className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                          title="重命名"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
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

      {activeKBId && (
        <section className="mt-8 pt-6 border-t border-neutral-200">
          <OnlineSectionHeader
            title={`上传文件到：${knowledgeBases.find((k) => k.id === activeKBId)?.name ?? ''}`}
            icon={<Sparkles size={14} className="text-neutral-500" />}
            actions={
              <button
                type="button"
                onClick={() => setActiveKBId(null)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
              >
                关闭
              </button>
            }
          />

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'cursor-pointer border border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center transition-all',
              dragActive
                ? 'border-neutral-400 bg-neutral-50'
                : 'border-neutral-200 bg-white hover:bg-neutral-50/80',
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.pdf,.docx,.doc,.md"
            />

            <FileUp size={36} className={`mb-3 ${dragActive ? 'text-neutral-900 animate-bounce' : 'text-neutral-400'}`} />

            <span className="text-xs font-bold text-neutral-700">
              {dragActive ? "松手开始上传！" : "拖动文件到此区域，或点击此处选择本地文件"}
            </span>
            <span className="text-[10px] text-neutral-400 mt-1">支持最大 50MB 纯文本/PDF</span>
          </div>

          {/* Feedback logs */}
          {uploadedMsgs && (
            <div className="mt-4 p-3 bg-neutral-900 font-mono text-[11px] text-emerald-400 rounded-lg whitespace-pre-line leading-relaxed">
              {uploadedMsgs}
            </div>
          )}
        </section>
      )}
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
                className={FIELD}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
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
                className={cn(FIELD, 'min-h-[72px] resize-none pr-12')}
              />
              <span className="absolute right-3 bottom-2 text-[10px] text-neutral-500">
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
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition cursor-pointer',
                      selected
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-neutral-200 bg-white hover:bg-neutral-100/40',
                    )}
                  >
                    {selected ? (
                      <Check size={14} className="text-primary shrink-0" />
                    ) : (
                      <Circle size={14} className="text-neutral-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-neutral-800">
                      {tag.label}
                      {tag.hint ? `（${tag.hint}）` : ''}
                    </span>
                    <HelpCircle size={12} className="text-neutral-500 shrink-0" title={tag.desc} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL}>分块方法</label>
            <select
              value={chunkMethod}
              onChange={(e) => setChunkMethod(e.target.value)}
              className={cn(FIELD, 'cursor-pointer')}
            >
              <option value="general">通用解析</option>
              <option value="qa">问答对切分</option>
              <option value="table">表格结构化</option>
            </select>
            <p className="text-[10px] text-neutral-500 mt-1">选择适合您文档类型的分块方法</p>
          </div>

          <div>
            <label className={LABEL}>
              嵌入模型 <span className="text-rose-500">*</span>
            </label>
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className={cn(FIELD, 'cursor-pointer')}
            >
              <option value="Qwen3-Embedding-8B">Qwen3-Embedding-8B</option>
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="bge-m3">BGE-M3</option>
            </select>
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
              className={FIELD}
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
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
                setUploadedMsgs(null);
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
