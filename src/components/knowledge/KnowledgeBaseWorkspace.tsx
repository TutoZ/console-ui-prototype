/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 单库工作台 — 资料列表为主；基础 / 解析 / 检索设置收入弹窗
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Cpu,
  Download,
  FileText,
  HelpCircle,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from '@/lib/icons';
import type { KnowledgeBase } from '../../types';
import { CardIcon } from '../common/CardIcon';
import { MatrixLoader } from '../common/MatrixLoader';
import { Modal } from '../common/Modal';
import { NavBackButton } from '../common/NavBackButton';
import { CompanionAssistOpenButton } from '../common/CompanionAssistPanel';
import { onlineTableClass } from '../common/OnlinePageLayout';
import {
  KnowledgeDocChunksModal,
  type KnowledgeDocChunk,
} from './KnowledgeDocChunksModal';
import {
  BTN_INK,
  BTN_OUTLINE,
  BTN_SOFT,
  BTN_TABLE,
  FIELD,
  LABEL,
  LIST_META,
  MODAL_OVERLAY,
  MODAL_SHELL_FIXED,
  PANEL,
  SEARCH_FIELD,
  SELECT_TRIGGER,
  badgeClass,
} from '@/lib/ui';
import { KB_PAGE_COPY, SEARCH_COPY } from '@/lib/platformTerminology';
import { cn } from '@/lib/utils';
import { pickMockLatencyMs } from '@/lib/mockLatency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SettingsSection = 'basic' | 'parse' | 'recall';
type DocStatus = 'done' | 'parsing' | 'pending';

interface KbDocument {
  id: string;
  name: string;
  sizeLabel: string;
  segments: number;
  parser: string;
  enabled: boolean;
  uploadedAt: string;
  status: DocStatus;
  parseProgress?: number;
}

interface RecallHit {
  title: string;
  snippet: string;
  score: number;
}

const SAMPLE_CHUNK_BODY = `数字员工7期需求

1. 员工上岗前评测二期
案例库作为单独模块维护，支持按业务场景创建不同类型案例库，用于员工上岗前评测。
· 案例库共享：名称、描述、更新时间；操作含查看、删除、新建
· 上限 500 条；删除进行中模板需拦截提示

2. AI 帮写
自动生成和润色数字员工提示词；同步与回滚逻辑保持一致。

3. SaaS 环境设置
公共模板库对试用租户可见；租户权限按组织隔离。`;

function seedDocChunks(doc: KbDocument): KnowledgeDocChunk[] {
  const count = Math.max(doc.segments, doc.status === 'done' ? 1 : 0);
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const suffix =
      i === 0
        ? SAMPLE_CHUNK_BODY
        : `${doc.name.replace(/\.[^.]+$/, '')} · 分片 ${i + 1}\n\n本段保留原文档坐标与语义边界，便于检索召回与追溯。可按业务主题继续拆分或合并。`;
    return {
      id: `${doc.id}_chunk_${i + 1}`,
      index: i + 1,
      body: suffix,
    };
  });
}

const SETTINGS_TABS: { id: SettingsSection; label: string; icon: typeof Sliders }[] = [
  { id: 'basic', label: KB_PAGE_COPY.tabBasic, icon: Sliders },
  { id: 'parse', label: KB_PAGE_COPY.tabParse, icon: Cpu },
  { id: 'recall', label: KB_PAGE_COPY.tabRecall, icon: Search },
];

const DOC_NAME_POOL = [
  '产品说明手册摘录.pdf',
  '常见问题 FAQ.xlsx',
  '理赔流程与材料.docx',
  '费率条款说明.pdf',
  '培训话术汇编.md',
  '监管合规摘要.pdf',
];

const PARSER_LABELS: Record<string, string> = {
  general: '通用解析',
  qa: '问答解析',
  table: '表格结构化',
};

function seedDocuments(kb: KnowledgeBase): KbDocument[] {
  if (kb.docCount <= 0) return [];
  return Array.from({ length: kb.docCount }, (_, i) => {
    const name = DOC_NAME_POOL[(kb.id.length + i) % DOC_NAME_POOL.length];
    const unique = i > 0 ? name.replace(/(\.\w+)$/, `_${i + 1}$1`) : name;
    const status: DocStatus =
      i === 0 && kb.docCount > 2 ? 'parsing' : i === 1 && kb.docCount > 3 ? 'pending' : 'done';
    return {
      id: `${kb.id}_doc_${i}`,
      name: unique,
      sizeLabel: i === 1 && kb.docCount > 3 ? '0 B' : `${(0.5 + (i * 1.7) % 8).toFixed(2)} MB`,
      segments:
        status === 'done'
          ? Math.max(1, Math.floor(kb.wordCount / Math.max(kb.docCount, 1) / 800) + (i % 3))
          : 0,
      parser: '问答解析',
      enabled: status !== 'pending',
      uploadedAt: kb.updatedAt.replace(/-/g, '/'),
      status,
      parseProgress: status === 'parsing' ? 42 : undefined,
    };
  });
}

function getFileExt(name: string): string {
  const match = name.match(/\.([^.]+)$/);
  return match ? match[1].toUpperCase() : 'FILE';
}

function parseSizeToBytes(label: string): number {
  const m = label.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2].toUpperCase();
  if (unit === 'GB') return n * 1024 * 1024 * 1024;
  if (unit === 'MB') return n * 1024 * 1024;
  if (unit === 'KB') return n * 1024;
  return n;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatKbCreatedAt(updatedAt: string): string {
  const raw = updatedAt.trim().replace(/-/g, '/');
  const d = new Date(raw.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return updatedAt;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fileExtTone(ext: string): string {
  if (['PDF'].includes(ext)) return 'bg-rose-50 text-rose-600';
  if (['XLSX', 'XLS', 'CSV'].includes(ext)) return 'bg-emerald-50 text-emerald-600';
  if (['DOCX', 'DOC'].includes(ext)) return 'bg-sky-50 text-sky-600';
  if (['MD', 'TXT'].includes(ext)) return 'bg-sky-50 text-sky-600';
  return 'bg-neutral-100 text-neutral-500';
}

function mockRecallHits(query: string, kb: KnowledgeBase): RecallHit[] {
  if (!query.trim()) return [];
  return [
    {
      title: `${kb.name} · 相关段落 A`,
      snippet: `与“${query.slice(0, 24)}”相关的保障范围说明：第三者责任、医疗费用补偿及线上报案流程…`,
      score: 0.89,
    },
    {
      title: `${kb.name} · 相关段落 B`,
      snippet: `费率与加保条款摘要，含门店面积分档、续保优惠与免赔额说明…`,
      score: 0.76,
    },
    {
      title: `${kb.name} · FAQ 匹配`,
      snippet: `常见咨询：理赔材料清单、处理时效 3–5 个工作日、加急通道触发条件…`,
      score: 0.71,
    },
  ];
}

function DocEnableSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer',
        enabled ? 'bg-emerald-500' : 'bg-neutral-300',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export interface KnowledgeBaseWorkspaceProps {
  kb: KnowledgeBase;
  agentName: string;
  onBack: () => void;
  onUpdateKb: (id: string, updates: Partial<KnowledgeBase>) => void;
  showToast: (message: string) => void;
  /** 弹层模式：顶部统一返回/关闭栏，侧栏不重复返回入口；fullscreen：技能式全屏壳内嵌 */
  variant?: 'page' | 'modal' | 'fullscreen';
  /** 页内知识搭子是否已展开（展开时隐藏打开按钮） */
  companionOpen?: boolean;
  onOpenCompanion?: () => void;
}

export const KnowledgeBaseWorkspace: React.FC<KnowledgeBaseWorkspaceProps> = ({
  kb,
  agentName,
  onBack,
  onUpdateKb,
  showToast,
  variant = 'page',
  companionOpen = false,
  onOpenCompanion,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsSection>('basic');
  const [documents, setDocuments] = useState<KbDocument[]>(() => seedDocuments(kb));
  const [docSearch, setDocSearch] = useState('');
  const [detailDocId, setDetailDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<KnowledgeDocChunk[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<KbDocument | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsingTimers = useRef<Map<string, number>>(new Map());

  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [categoryTags, setCategoryTags] = useState<Array<'professional' | 'basic'>>(['professional']);
  const [chunkMethod, setChunkMethod] = useState('qa');
  const [embeddingModel, setEmbeddingModel] = useState('Qwen3-Embedding-8B');
  const [chunkRule, setChunkRule] = useState<'length' | 'delimiter'>('length');
  const [maxChunkLength, setMaxChunkLength] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(10);
  const [delimiterMode, setDelimiterMode] = useState<'single' | 'double' | 'custom'>('single');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [similarity, setSimilarity] = useState(0.3);
  const [vectorWeight, setVectorWeight] = useState(0.3);
  const [topN, setTopN] = useState(7);
  const [rerank, setRerank] = useState(false);
  const [debugQuery, setDebugQuery] = useState('');
  const [recallHits, setRecallHits] = useState<RecallHit[]>([]);
  const [recallMs, setRecallMs] = useState<number | null>(null);
  const [recallRunning, setRecallRunning] = useState(false);

  useEffect(() => {
    setName(kb.name);
    setAvatarUrl(null);
    const seeded = seedDocuments(kb);
    setDocuments(seeded);
    setSelectedIds(new Set());
    setOpenMenuDocId(null);
    setDetailDocId(null);
    setDocChunks([]);
    seeded.forEach((doc) => {
      if (doc.status === 'parsing') startParsing(doc.id);
    });
  }, [kb.id, kb.name, kb.docCount, kb.wordCount, kb.updatedAt]);

  useEffect(() => {
    return () => {
      if (avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      parsingTimers.current.forEach((timer) => window.clearInterval(timer));
      parsingTimers.current.clear();
    };
  }, []);

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, docSearch]);

  const detailDoc = useMemo(
    () => (detailDocId ? documents.find((d) => d.id === detailDocId) ?? null : null),
    [documents, detailDocId],
  );

  const openDocDetail = (doc: KbDocument) => {
    setDetailDocId(doc.id);
    setDocChunks(seedDocChunks(doc));
    setOpenMenuDocId(null);
  };

  const closeDocDetail = () => {
    setDetailDocId(null);
    setDocChunks([]);
  };

  const handleDocChunksChange = (next: KnowledgeDocChunk[]) => {
    setDocChunks(next);
    if (!detailDocId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === detailDocId ? { ...d, segments: next.length, status: 'done' as DocStatus } : d,
      ),
    );
  };

  const selectedCount = filteredDocs.filter((d) => selectedIds.has(d.id)).length;
  const allFilteredSelected =
    filteredDocs.length > 0 && filteredDocs.every((d) => selectedIds.has(d.id));

  const totalSizeLabel = useMemo(
    () => formatBytes(documents.reduce((sum, d) => sum + parseSizeToBytes(d.sizeLabel), 0)),
    [documents],
  );

  const handleAvatarPick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('图片不能超过 4MB');
      return;
    }
    setAvatarUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    showToast('头像已更新');
  };

  useEffect(() => {
    if (!openMenuDocId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuDocId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openMenuDocId]);

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const toggleCategoryTag = (tag: 'professional' | 'basic') => {
    setCategoryTags((prev) =>
      prev.includes(tag) ? (prev.length > 1 ? prev.filter((t) => t !== tag) : prev) : [...prev, tag],
    );
  };

  const startParsing = (docId: string) => {
    if (parsingTimers.current.has(docId)) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: 'parsing', parseProgress: 0, segments: 0 } : d,
      ),
    );

    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 12 + Math.random() * 18;
      if (progress >= 100) {
        window.clearInterval(timer);
        parsingTimers.current.delete(docId);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status: 'done',
                  parseProgress: 100,
                  segments: 8 + Math.floor(Math.random() * 20),
                  enabled: true,
                }
              : d,
          ),
        );
        return;
      }
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, parseProgress: Math.min(99, Math.floor(progress)) } : d,
        ),
      );
    }, 450);
    parsingTimers.current.set(docId, timer);
  };

  const cancelParsing = (docId: string) => {
    const timer = parsingTimers.current.get(docId);
    if (timer) {
      window.clearInterval(timer);
      parsingTimers.current.delete(docId);
    }
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: 'pending', parseProgress: undefined, segments: 0 } : d,
      ),
    );
  };

  const handleUpload = (file: File) => {
    const uploadedAt = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '/');
    const newDoc: KbDocument = {
      id: `${kb.id}_doc_${Date.now()}`,
      name: file.name,
      sizeLabel: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      segments: 0,
      parser: PARSER_LABELS[chunkMethod] ?? '问答解析',
      enabled: true,
      uploadedAt,
      status: 'parsing',
      parseProgress: 0,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    onUpdateKb(kb.id, {
      docCount: kb.docCount + 1,
      wordCount: kb.wordCount + Math.floor(2500 + Math.random() * 5000),
      updatedAt: uploadedAt.replace(/\//g, '-').slice(0, 16),
    });
    showToast(`“${file.name}”已加入解析队列`);
    startParsing(newDoc.id);
  };

  const handleSaveBasic = () => {
    if (!name.trim()) return;
    onUpdateKb(kb.id, { name: name.trim().slice(0, 30) });
    showToast('基础配置已保存');
  };

  const handleSaveParse = () => {
    showToast('解析配置已保存');
  };

  const runRecallDebug = () => {
    if (!debugQuery.trim()) return;
    setRecallRunning(true);
    setRecallHits([]);
    setRecallMs(null);
    window.setTimeout(() => {
      setRecallHits(mockRecallHits(debugQuery, { ...kb, name: name.trim() || kb.name }));
      setRecallMs(pickMockLatencyMs('recall'));
      setRecallRunning(false);
    }, pickMockLatencyMs('recall'));
  };

  const removeDoc = (docId: string) => {
    cancelParsing(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
    onUpdateKb(kb.id, {
      docCount: Math.max(0, kb.docCount - 1),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
  };

  const toggleSelect = (docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredDocs.forEach((d) => next.delete(d.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredDocs.forEach((d) => next.add(d.id));
        return next;
      });
    }
  };

  const bulkSetEnabled = (enabled: boolean) => {
    setDocuments((prev) =>
      prev.map((d) => (selectedIds.has(d.id) ? { ...d, enabled } : d)),
    );
    showToast(enabled ? '已批量启用所选文档' : '已批量禁用所选文档');
  };

  const bulkReparse = () => {
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc && doc.status !== 'parsing') startParsing(id);
    });
    showToast('已重新解析所选文档');
  };

  const bulkCancelParse = () => {
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc?.status === 'parsing') cancelParsing(id);
    });
    showToast('已取消所选文档的解析任务');
  };

  const bulkDelete = () => {
    if (!confirm(`确定删除已选的 ${selectedCount} 个文档吗？`)) return;
    selectedIds.forEach((id) => removeDoc(id));
    setSelectedIds(new Set());
    showToast('已删除所选文档');
  };

  const openRename = (doc: KbDocument) => {
    setRenamingDoc(doc);
    setRenameValue(doc.name);
    setOpenMenuDocId(null);
  };

  const commitRename = () => {
    if (!renamingDoc || !renameValue.trim()) return;
    setDocuments((prev) =>
      prev.map((d) => (d.id === renamingDoc.id ? { ...d, name: renameValue.trim() } : d)),
    );
    showToast('文档已重命名');
    setRenamingDoc(null);
    setRenameValue('');
  };

  const renderStatus = (doc: KbDocument) => {
    if (doc.status === 'parsing') {
      return <span className={cn(badgeClass('live'), 'whitespace-nowrap')}>解析中</span>;
    }
    if (doc.status === 'pending') {
      return (
        <button
          type="button"
          onClick={() => startParsing(doc.id)}
          className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-800 cursor-pointer whitespace-nowrap"
        >
          <Play size={11} />
          未开始
        </button>
      );
    }
    return <span className={cn(badgeClass('success'), 'whitespace-nowrap')}>已完成</span>;
  };

  const isFullscreen = variant === 'fullscreen';
  const isEmbeddedChrome = variant === 'modal' || isFullscreen;
  const showCompanionOpen =
    (variant === 'page' || isFullscreen) && !companionOpen && Boolean(onOpenCompanion);

  const openSettings = (section: SettingsSection = 'basic') => {
    setSettingsTab(section);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (settingsTab === 'basic') handleSaveBasic();
    else if (settingsTab === 'parse') handleSaveParse();
    else showToast('检索参数已应用（调试时可即时生效）');
  };

  const settingsButton = (
    <button type="button" onClick={() => openSettings('basic')} className={BTN_OUTLINE} title="知识库设置">
      <Sliders size={13} />
      知识库设置
    </button>
  );

  const contentHeader = (
    <header
      className={cn(
        'shrink-0 border-b border-neutral-200 flex items-center gap-3 bg-white',
        isFullscreen ? 'justify-between px-4 py-2.5' : isEmbeddedChrome ? 'justify-end px-4 py-2.5' : 'justify-end px-5 py-3.5',
      )}
    >
      {isFullscreen ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CardIcon seed={kb.id} size="sm" variant="neutral">
            {kb.firstChar}
          </CardIcon>
          <p className="text-[13px] font-semibold text-neutral-900 truncate" title={kb.name}>
            {kb.name}
          </p>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.doc,.docx,.xlsx,.md"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            placeholder="搜索文档…"
            className={cn(SEARCH_FIELD, 'pl-9 pr-8 w-[160px]')}
          />
          {docSearch && (
            <button
              type="button"
              onClick={() => setDocSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
              aria-label="清除搜索"
            >
              清除
            </button>
          )}
        </div>
        {settingsButton}
        <button type="button" onClick={() => fileInputRef.current?.click()} className={BTN_INK}>
          <Upload size={13} />
          上传文档
        </button>
        {showCompanionOpen && !isFullscreen ? (
          <CompanionAssistOpenButton onClick={onOpenCompanion!} />
        ) : null}
      </div>
    </header>
  );

  return (
    <div className="h-full min-h-0 w-full flex flex-col bg-white">
      {variant === 'modal' && (
        <div className="shrink-0 h-11 px-3 border-b border-neutral-200 flex items-center gap-2.5 bg-white">
          <NavBackButton onClick={onBack} label="返回列表" variant="text" />
          <span className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CardIcon seed={kb.id} size="sm" variant="neutral">
              {kb.firstChar}
            </CardIcon>
            <span className="text-xs font-semibold text-neutral-900 truncate" title={kb.name}>
              {kb.name}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
      {!isFullscreen && (
      <aside
        className={cn(
          'shrink-0 border-r border-neutral-200 bg-white flex flex-col',
          variant === 'modal' ? 'w-[196px]' : 'w-[212px]',
        )}
      >
        {variant === 'page' && (
          <div className="mx-3 mt-3 mb-2">
            <NavBackButton onClick={onBack} label="返回列表" variant="text" />
          </div>
        )}

        {variant === 'page' && (
          <div className={cn(PANEL, 'mx-3 mb-3 p-3')}>
            <div className="flex items-center gap-2.5">
              <CardIcon seed={kb.id} size="sm" variant="neutral">
                {kb.firstChar}
              </CardIcon>
              <div className="min-w-0 flex-1">
                <p className={LIST_META}>当前知识库</p>
                <p className="text-xs font-semibold text-neutral-900 truncate" title={kb.name}>
                  {kb.name}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 px-3 pt-2">
          <p className={cn(LIST_META, 'mb-2')}>{KB_PAGE_COPY.docsHint}</p>
          <button
            type="button"
            onClick={() => openSettings('basic')}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition cursor-pointer text-neutral-600 hover:bg-neutral-100/40 hover:text-neutral-900 border border-neutral-200"
          >
            <Sliders size={14} className="shrink-0" />
            <span className="text-xs font-medium">知识库设置</span>
          </button>
        </div>

        <div className="px-3 py-3 border-t border-neutral-200">
          <p className={cn(LIST_META, 'leading-relaxed')}>由以下员工使用</p>
          <p className="text-[11px] font-medium text-neutral-800 truncate mt-0.5" title={agentName}>
            {agentName}
          </p>
        </div>
      </aside>
      )}

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.doc,.docx,.xlsx,.md"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
        {contentHeader}

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div
              className={cn('relative min-h-full space-y-3', isFullscreen ? 'p-3' : isEmbeddedChrome ? 'p-4' : 'p-5')}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
              }}
              onDrop={(e) => {
                handleDocDrop(e);
              }}
            >
              {dragActive && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-50/90 border-2 border-dashed border-neutral-300 rounded-[13px] m-3 pointer-events-none">
                  <div className="text-center">
                    <Upload size={28} className="mx-auto text-neutral-500 mb-2" />
                    <p className="text-sm font-semibold text-neutral-800">松开即可上传文档</p>
                    <p className={cn(LIST_META, 'mt-1')}>支持 PDF、Word、Excel、Markdown 等格式</p>
                  </div>
                </div>
              )}

              {selectedCount > 0 && (
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-neutral-800">
                      已选择 {selectedCount} 个文件
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                    <button type="button" onClick={() => bulkSetEnabled(true)} className={BTN_OUTLINE}>
                      启用
                    </button>
                    <button type="button" onClick={() => bulkSetEnabled(false)} className={BTN_OUTLINE}>
                      禁用
                    </button>
                    <button type="button" onClick={bulkReparse} className={BTN_OUTLINE}>
                      重新解析
                    </button>
                    <button type="button" onClick={bulkCancelParse} className={BTN_OUTLINE}>
                      取消解析
                    </button>
                    <button
                      type="button"
                      onClick={bulkDelete}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer hover:bg-rose-100"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}

              {documents.length === 0 ? (
                <div
                  className={cn(
                    PANEL,
                    'p-12 text-center border-2 border-dashed border-neutral-200 cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition',
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <Upload size={32} className="mx-auto text-neutral-400 mb-3" />
                  <p className="text-sm font-semibold text-neutral-800">拖拽文件到此处，或点击上传</p>
                  <p className={cn(LIST_META, 'mt-1.5')}>支持 PDF、Word、Excel、Markdown 等格式</p>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <Search size={28} className="mx-auto text-neutral-400/50 mb-3" />
                  <p className="text-sm font-medium text-neutral-800">{SEARCH_COPY.noDoc}</p>
                  <p className={cn(LIST_META, 'mt-1')}>
                    试试其他关键词，或
                    <button
                      type="button"
                      onClick={() => setDocSearch('')}
                      className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2 cursor-pointer ml-0.5"
                    >
                      清除搜索
                    </button>
                  </p>
                </div>
              ) : (
                <>
                <div className={cn(onlineTableClass.wrap, 'overflow-x-auto')}>
                  <table className={cn(onlineTableClass.table, 'min-w-[960px] table-fixed')}>
                    <colgroup>
                      <col className="w-10" />
                      <col />
                      <col className="w-[72px]" />
                      <col className="w-[72px]" />
                      <col className="w-[88px]" />
                      <col className="w-16" />
                      <col className="w-[132px]" />
                      <col className="w-[88px]" />
                      <col className="w-14" />
                    </colgroup>
                    <thead>
                      <tr className={onlineTableClass.headRow}>
                        <th className={cn(onlineTableClass.thFirst, 'w-10')}>
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAll}
                            className="cursor-pointer"
                            aria-label="全选"
                          />
                        </th>
                        <th className={onlineTableClass.th}>文件名</th>
                        <th className={cn(onlineTableClass.th, 'w-[72px]')}>大小</th>
                        <th className={cn(onlineTableClass.th, 'w-[72px]')}>分段数量</th>
                        <th className={cn(onlineTableClass.th, 'w-[88px]')}>解析器</th>
                        <th className={cn(onlineTableClass.th, 'w-16 text-center')}>启用</th>
                        <th className={cn(onlineTableClass.th, 'w-[132px]')}>上传时间</th>
                        <th className={cn(onlineTableClass.th, 'w-[88px]')}>状态</th>
                        <th className={cn(onlineTableClass.thLast, 'w-14')}>操作</th>
                      </tr>
                    </thead>
                    <tbody className={onlineTableClass.body}>
                      {filteredDocs.map((doc) => {
                        const ext = getFileExt(doc.name);
                        const isSelected = selectedIds.has(doc.id);
                        const statusLabel =
                          doc.status === 'parsing'
                            ? '解析中'
                            : doc.status === 'pending'
                              ? '未开始'
                              : '已完成';
                        return (
                          <tr
                            key={doc.id}
                            role="link"
                            tabIndex={0}
                            onClick={() => openDocDetail(doc)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openDocDetail(doc);
                              }
                            }}
                            className={cn(
                              onlineTableClass.row,
                              'cursor-pointer',
                              isSelected && 'bg-neutral-50',
                              !doc.enabled && 'opacity-60',
                            )}
                            aria-label={`查看「${doc.name}」分片详情`}
                          >
                            <td
                              className={cn(onlineTableClass.tdFirst, 'align-middle whitespace-nowrap')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(doc.id)}
                                className="cursor-pointer"
                                aria-label={`选择 ${doc.name}`}
                              />
                            </td>
                            <td className={cn(onlineTableClass.td, 'align-middle whitespace-nowrap max-w-0')}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums',
                                    fileExtTone(ext),
                                  )}
                                >
                                  {ext}
                                </span>
                                <span
                                  className="min-w-0 flex-1 font-semibold text-neutral-900 truncate"
                                  title={doc.name}
                                >
                                  {doc.name}
                                </span>
                              </div>
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.td,
                                'align-middle whitespace-nowrap text-neutral-500 tabular-nums',
                              )}
                              title={doc.sizeLabel}
                            >
                              {doc.sizeLabel}
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.td,
                                'align-middle whitespace-nowrap text-neutral-500 tabular-nums',
                              )}
                              title={`分段 ${doc.segments}`}
                            >
                              {doc.segments}
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.td,
                                'align-middle whitespace-nowrap text-neutral-500 truncate',
                              )}
                              title={doc.parser}
                            >
                              {doc.parser}
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.td,
                                'align-middle whitespace-nowrap text-center',
                              )}
                              onClick={(e) => e.stopPropagation()}
                              title={doc.enabled ? '已启用' : '已停用'}
                            >
                              <DocEnableSwitch
                                enabled={doc.enabled}
                                label={doc.enabled ? '已启用' : '已停用'}
                                onChange={() =>
                                  setDocuments((prev) =>
                                    prev.map((d) =>
                                      d.id === doc.id ? { ...d, enabled: !d.enabled } : d,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.td,
                                'align-middle whitespace-nowrap text-neutral-500 tabular-nums',
                              )}
                              title={doc.uploadedAt}
                            >
                              {doc.uploadedAt}
                            </td>
                            <td
                              className={cn(onlineTableClass.td, 'align-middle whitespace-nowrap')}
                              onClick={(e) => e.stopPropagation()}
                              title={statusLabel}
                            >
                              {renderStatus(doc)}
                            </td>
                            <td
                              className={cn(
                                onlineTableClass.tdLast,
                                'relative align-middle whitespace-nowrap',
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuDocId(openMenuDocId === doc.id ? null : doc.id)
                                }
                                className={BTN_TABLE}
                                aria-expanded={openMenuDocId === doc.id}
                              >
                                ···
                              </button>
                              {openMenuDocId === doc.id && (
                                <>
                                  <button
                                    type="button"
                                    className="fixed inset-0 z-20 cursor-default"
                                    aria-label="关闭菜单"
                                    onClick={() => setOpenMenuDocId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-left">
                                    <button
                                      type="button"
                                      onClick={() => openDocDetail(doc)}
                                      className="w-full px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-neutral-50 cursor-pointer"
                                    >
                                      <FileText size={12} />
                                      查看分片
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openRename(doc)}
                                      className="w-full px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-neutral-50 cursor-pointer"
                                    >
                                      <Pencil size={12} />
                                      重命名
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuDocId(null);
                                        if (doc.status !== 'parsing') startParsing(doc.id);
                                      }}
                                      className="w-full px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-neutral-50 cursor-pointer"
                                    >
                                      <RefreshCw size={12} />
                                      重新解析
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuDocId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-neutral-50 cursor-pointer"
                                    >
                                      <Download size={12} />
                                      下载
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuDocId(null);
                                        removeDoc(doc.id);
                                      }}
                                      className="w-full px-3 py-1.5 text-[11px] flex items-center gap-2 text-destructive hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                      删除
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
        </div>
      </div>
      </div>

      <KnowledgeDocChunksModal
        open={!!detailDoc}
        onClose={closeDocDetail}
        docName={detailDoc?.name ?? ''}
        docStatus={detailDoc?.status}
        chunks={docChunks}
        onChunksChange={handleDocChunksChange}
        showToast={showToast}
      />

      {settingsOpen
        ? createPortal(
            <div
              className={cn(MODAL_OVERLAY, 'z-[260]')}
              onClick={() => setSettingsOpen(false)}
            >
              <div
                className={cn(
                  MODAL_SHELL_FIXED,
                  'max-w-[680px] h-[min(640px,90vh)]',
                )}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="知识库设置"
              >
                <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                      知识库设置
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭"
                    onClick={() => setSettingsOpen(false)}
                    className="shrink-0 -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="shrink-0 flex items-center gap-0.5 px-5 border-b border-neutral-200">
                  {SETTINGS_TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSettingsTab(item.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 h-9 px-3 text-[13px] whitespace-nowrap border-b-2 transition cursor-pointer',
                        settingsTab === item.id
                          ? 'border-neutral-900 text-neutral-900 font-medium'
                          : 'border-transparent text-neutral-500 hover:text-neutral-800',
                      )}
                    >
                      <item.icon size={14} className="shrink-0 text-neutral-500" />
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {settingsTab === 'basic' && (
                    <div className="p-5 sm:px-6 sm:py-5 space-y-5">
                      {/* 基本信息摘要 */}
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <span className="pt-2.5 text-[13px] text-neutral-600 leading-none">
                          基本信息
                        </span>
                        <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3 text-[12px] text-neutral-600 flex flex-wrap gap-x-6 gap-y-1.5">
                          <span>
                            文档数量：
                            <span className="tabular-nums text-neutral-800">
                              {documents.length} 个
                            </span>
                          </span>
                          <span>
                            总大小：
                            <span className="tabular-nums text-neutral-800">{totalSizeLabel}</span>
                          </span>
                          <span>
                            创建时间：
                            <span className="tabular-nums text-neutral-800">
                              {formatKbCreatedAt(kb.updatedAt)}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* 名称 */}
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <label className="pt-2 text-[13px] text-neutral-600 leading-none">
                          <span className="text-destructive">*</span> 名称
                        </label>
                        <div className="relative">
                          <input
                            value={name}
                            maxLength={30}
                            onChange={(e) => setName(e.target.value)}
                            className={cn(FIELD, 'pr-12')}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 tabular-nums pointer-events-none">
                            {name.length}/30
                          </span>
                        </div>
                      </div>

                      {/* 头像 */}
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <span className="pt-3 text-[13px] text-neutral-600 leading-none">头像</span>
                        <div className="flex items-start gap-3">
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              handleAvatarPick(e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                          <div className="flex flex-col items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition cursor-pointer"
                              aria-label="更换头像"
                            >
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[22px] font-semibold text-neutral-500 leading-none">
                                  {kb.firstChar}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="text-[12px] text-[#376BFA] hover:underline cursor-pointer"
                              >
                                点击更换头像
                              </button>
                              {avatarUrl ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAvatarUrl((prev) => {
                                      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                                      return null;
                                    });
                                    showToast('已恢复默认头像');
                                  }}
                                  className="text-[12px] text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                                >
                                  恢复默认
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-[12px] text-neutral-400 pt-1">
                            支持上传最大 4MB 的图片
                          </p>
                        </div>
                      </div>

                      {/* 描述 */}
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <label className="pt-2 text-[13px] text-neutral-600 leading-none">描述</label>
                        <div className="relative">
                          <textarea
                            value={description}
                            maxLength={200}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="请输入知识库描述"
                            className={cn(FIELD, 'min-h-[96px] resize-none pb-6')}
                          />
                          <span className="absolute right-3 bottom-2 text-[11px] text-neutral-400 tabular-nums pointer-events-none">
                            {description.length}/200
                          </span>
                        </div>
                      </div>

                      {/* 分类标签 */}
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <span className="pt-0.5 text-[13px] text-neutral-600 leading-snug">
                          分类标签
                          <span className="block text-[11px] text-neutral-400 font-normal">
                            (可多选)
                          </span>
                        </span>
                        <div className="flex flex-col gap-2.5 pt-0.5">
                          {[
                            {
                              id: 'professional' as const,
                              label: '专业知识',
                              isDefault: true,
                              desc: '政策条款、产品手册',
                            },
                            {
                              id: 'basic' as const,
                              label: '基础知识',
                              isDefault: false,
                              desc: 'FAQ、入门话术',
                            },
                          ].map((tag) => {
                            const selected = categoryTags.includes(tag.id);
                            return (
                              <label
                                key={tag.id}
                                className="inline-flex items-center gap-2 cursor-pointer select-none w-fit"
                              >
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={selected}
                                  onClick={() => toggleCategoryTag(tag.id)}
                                  className={cn(
                                    'w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition cursor-pointer',
                                    selected
                                      ? 'bg-[#376BFA] border-[#376BFA] text-white'
                                      : 'bg-white border-neutral-300 hover:border-neutral-400',
                                  )}
                                >
                                  {selected ? <Check size={11} strokeWidth={3} /> : null}
                                </button>
                                <span
                                  className="text-[13px] text-neutral-800"
                                  onClick={() => toggleCategoryTag(tag.id)}
                                >
                                  {tag.label}
                                  {tag.isDefault ? (
                                    <span className="text-neutral-500"> (默认)</span>
                                  ) : null}
                                </span>
                                <span
                                  title={tag.desc}
                                  className="inline-flex text-neutral-400 hover:text-neutral-600"
                                >
                                  <HelpCircle size={14} />
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'parse' && (
                    <div className="p-5 sm:px-6 sm:py-5 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={LABEL}>默认解析策略</label>
                          <Select
                            value={chunkMethod}
                            onValueChange={(v) => v && setChunkMethod(v)}
                          >
                            <SelectTrigger
                              className={cn(SELECT_TRIGGER, 'w-full justify-between')}
                              aria-label="默认解析策略"
                            >
                              <SelectValue>
                                {chunkMethod === 'qa'
                                  ? '问答解析'
                                  : chunkMethod === 'table'
                                    ? '表格结构化'
                                    : '通用解析'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">通用解析</SelectItem>
                              <SelectItem value="qa">问答解析</SelectItem>
                              <SelectItem value="table">表格结构化</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className={LABEL}>嵌入模型</label>
                          <Select
                            value={embeddingModel}
                            onValueChange={(v) => v && setEmbeddingModel(v)}
                          >
                            <SelectTrigger
                              className={cn(SELECT_TRIGGER, 'w-full justify-between')}
                              aria-label="嵌入模型"
                            >
                              <SelectValue>
                                {embeddingModel === 'bge-m3'
                                  ? 'BGE-M3'
                                  : embeddingModel === 'text-embedding-3-small'
                                    ? 'text-embedding-3-small'
                                    : 'Qwen3-Embedding-8B'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Qwen3-Embedding-8B">Qwen3-Embedding-8B</SelectItem>
                              <SelectItem value="text-embedding-3-small">
                                text-embedding-3-small
                              </SelectItem>
                              <SelectItem value="bge-m3">BGE-M3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 items-start">
                        <span className="pt-3 text-[13px] text-neutral-600 leading-none">
                          分片规则 <span className="text-destructive">*</span>
                        </span>
                        <div className="space-y-3 min-w-0">
                          {/* 按长度 */}
                          <div
                            role="radio"
                            aria-checked={chunkRule === 'length'}
                            tabIndex={0}
                            onClick={() => setChunkRule('length')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setChunkRule('length');
                              }
                            }}
                            className={cn(
                              'w-full text-left rounded-[12px] border px-3.5 py-3 transition cursor-pointer',
                              chunkRule === 'length'
                                ? 'border-neutral-900 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]'
                                : 'border-neutral-200 bg-white hover:border-neutral-300',
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                                  chunkRule === 'length'
                                    ? 'border-neutral-900'
                                    : 'border-neutral-300',
                                )}
                                aria-hidden
                              >
                                {chunkRule === 'length' ? (
                                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                                ) : null}
                              </span>
                              <span className="text-[13px] font-medium text-neutral-900 flex-1">
                                按照长度切割
                              </span>
                              {chunkRule === 'length' ? (
                                <span className="shrink-0 h-5 px-2 rounded-full bg-neutral-100 text-[11px] text-neutral-600 inline-flex items-center">
                                  当前生效
                                </span>
                              ) : null}
                            </div>

                            {chunkRule === 'length' ? (
                              <div
                                className="mt-3 space-y-3 pl-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div>
                                  <p className="text-[12px] text-neutral-600 mb-1.5">
                                    最大分片长度 <span className="text-destructive">*</span>
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min={64}
                                      max={2048}
                                      step={16}
                                      value={maxChunkLength}
                                      onChange={(e) => setMaxChunkLength(Number(e.target.value))}
                                      className="flex-1 min-w-0 accent-[#376BFA]"
                                    />
                                    <input
                                      type="number"
                                      min={64}
                                      max={2048}
                                      value={maxChunkLength}
                                      onChange={(e) => {
                                        const n = Number(e.target.value);
                                        if (Number.isNaN(n)) return;
                                        setMaxChunkLength(Math.min(2048, Math.max(64, n)));
                                      }}
                                      className={cn(FIELD, 'w-[72px] shrink-0 text-center tabular-nums')}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[12px] text-neutral-600 mb-1.5">
                                    分片重叠度 <span className="text-destructive">*</span>
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min={0}
                                      max={50}
                                      step={1}
                                      value={chunkOverlap}
                                      onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                      className="flex-1 min-w-0 accent-[#376BFA]"
                                    />
                                    <div className="relative w-[72px] shrink-0">
                                      <input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={chunkOverlap}
                                        onChange={(e) => {
                                          const n = Number(e.target.value);
                                          if (Number.isNaN(n)) return;
                                          setChunkOverlap(Math.min(50, Math.max(0, n)));
                                        }}
                                        className={cn(FIELD, 'w-full text-center tabular-nums pr-6')}
                                      />
                                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 pointer-events-none">
                                        %
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* 按标识符 */}
                          <div
                            role="radio"
                            aria-checked={chunkRule === 'delimiter'}
                            tabIndex={0}
                            onClick={() => setChunkRule('delimiter')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setChunkRule('delimiter');
                              }
                            }}
                            className={cn(
                              'w-full text-left rounded-[12px] border px-3.5 py-3 transition cursor-pointer',
                              chunkRule === 'delimiter'
                                ? 'border-neutral-900 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]'
                                : 'border-neutral-200 bg-white hover:border-neutral-300',
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                                  chunkRule === 'delimiter'
                                    ? 'border-neutral-900'
                                    : 'border-neutral-300',
                                )}
                                aria-hidden
                              >
                                {chunkRule === 'delimiter' ? (
                                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                                ) : null}
                              </span>
                              <span className="text-[13px] font-medium text-neutral-900 flex-1">
                                按照标识符切割
                              </span>
                              {chunkRule === 'delimiter' ? (
                                <span className="shrink-0 h-5 px-2 rounded-full bg-neutral-100 text-[11px] text-neutral-600 inline-flex items-center">
                                  当前生效
                                </span>
                              ) : null}
                            </div>

                            {chunkRule === 'delimiter' ? (
                              <div
                                className="mt-3 pl-6 space-y-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-[12px] text-neutral-600">
                                  分段方式 <span className="text-destructive">*</span>
                                </p>
                                <div className="grid grid-cols-3 gap-1 p-1 rounded-[10px] bg-neutral-100">
                                  {(
                                    [
                                      { id: 'single' as const, label: '单个换行符', hint: '\\n' },
                                      { id: 'double' as const, label: '双换行符', hint: '\\n\\n' },
                                      { id: 'custom' as const, label: '自定义字符', hint: 'Custom' },
                                    ] as const
                                  ).map((opt) => {
                                    const active = delimiterMode === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setDelimiterMode(opt.id)}
                                        className={cn(
                                          'rounded-[8px] px-2 py-2 text-center transition cursor-pointer',
                                          active
                                            ? 'bg-white shadow-sm text-neutral-900'
                                            : 'text-neutral-600 hover:text-neutral-800',
                                        )}
                                      >
                                        <span className="block text-[12px] font-medium leading-tight">
                                          {opt.label}
                                        </span>
                                        <span className="block text-[11px] text-neutral-400 mt-0.5 font-mono">
                                          {opt.hint}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {delimiterMode === 'custom' ? (
                                  <input
                                    value={customDelimiter}
                                    onChange={(e) => setCustomDelimiter(e.target.value)}
                                    placeholder="输入自定义分隔符"
                                    className={cn(FIELD, 'mt-1')}
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'recall' && (
                    <div className="flex min-h-full">
                      <div className="w-[min(320px,40%)] shrink-0 border-r border-neutral-200 p-5 space-y-4">
                        <p className="text-[12px] font-semibold text-neutral-900">检索参数</p>

                        <label className="block space-y-1.5">
                          <span className="text-[11px] text-neutral-500 flex justify-between">
                            <span>相似度阈值</span>
                            <span className="tabular-nums font-mono text-neutral-800">
                              {similarity.toFixed(2)}
                            </span>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={similarity}
                            onChange={(e) => setSimilarity(Number(e.target.value))}
                            className="w-full accent-neutral-800"
                          />
                        </label>

                        <label className="block space-y-1.5">
                          <span className="text-[11px] text-neutral-500 flex justify-between gap-2">
                            <span className="truncate">
                              向量权重（全文 {((1 - vectorWeight) * 100).toFixed(0)}%）
                            </span>
                            <span className="tabular-nums font-mono text-neutral-800 shrink-0">
                              {vectorWeight.toFixed(2)}
                            </span>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={vectorWeight}
                            onChange={(e) => setVectorWeight(Number(e.target.value))}
                            className="w-full accent-neutral-800"
                          />
                        </label>

                        <label className="block space-y-1.5">
                          <span className="text-[11px] text-neutral-500 flex justify-between">
                            <span>Top N 检索数</span>
                            <span className="tabular-nums font-mono text-neutral-800">{topN}</span>
                          </span>
                          <input
                            type="range"
                            min={1}
                            max={15}
                            step={1}
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                            className="w-full accent-neutral-800"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setRerank((v) => !v)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border text-[12px] cursor-pointer transition',
                            rerank
                              ? 'border-neutral-800 bg-neutral-50'
                              : 'border-neutral-200 hover:bg-neutral-50/80',
                          )}
                        >
                          <span className="font-medium text-neutral-800">重排策略</span>
                          <span
                            className={
                              rerank ? 'text-neutral-900 font-semibold' : 'text-neutral-500'
                            }
                          >
                            {rerank ? '已开启' : '关闭'}
                          </span>
                        </button>

                        <div className="pt-3 border-t border-neutral-200 space-y-2">
                          <label className={LABEL}>调试问题</label>
                          <textarea
                            value={debugQuery}
                            onChange={(e) => setDebugQuery(e.target.value)}
                            placeholder="例如：食安险理赔需要哪些材料？"
                            className={cn(FIELD, 'min-h-[88px] resize-none')}
                          />
                          <button
                            type="button"
                            disabled={recallRunning || !debugQuery.trim()}
                            onClick={runRecallDebug}
                            className={cn(BTN_INK, 'w-full h-9 text-[13px]')}
                          >
                            {recallRunning ? (
                              <span className="inline-flex items-center gap-1.5">
                                <MatrixLoader size={16} className="h-4 w-4" />
                                检索中…
                              </span>
                            ) : (
                              '运行调试'
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 p-5 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                          <p className="text-[12px] font-semibold text-neutral-900">效果预览</p>
                          {recallMs !== null && (
                            <span className="text-[11px] text-neutral-500 tabular-nums">
                              耗时 {recallMs} ms
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-h-0">
                          {recallRunning ? (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-2 rounded-[13px] border border-dashed border-neutral-200 bg-neutral-50/50">
                              <MatrixLoader size={40} className="h-10 w-10" title="检索中" />
                              <p className="text-[12px] text-neutral-500">正在检索员工知识…</p>
                            </div>
                          ) : recallHits.length === 0 ? (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-6 rounded-[13px] border border-dashed border-neutral-200 bg-neutral-50/40">
                              <Sparkles size={28} className="text-neutral-400 mb-2.5 opacity-70" />
                              <p className="text-[12px] font-medium text-neutral-800">等待测试</p>
                              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs leading-relaxed">
                                在左侧输入业务问题并运行调试，查看检索片段与相关度
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {recallHits.slice(0, topN).map((hit, i) => (
                                <div key={i} className={cn(PANEL, 'p-3')}>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-[12px] font-semibold text-neutral-800 truncate">
                                      {hit.title}
                                    </p>
                                    <span className={badgeClass('live')}>
                                      {(hit.score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                                    {hit.snippet}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-200 bg-white">
                  <button type="button" onClick={handleSaveSettings} className={BTN_INK}>
                    保存
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Modal
        open={!!renamingDoc}
        onClose={() => {
          setRenamingDoc(null);
          setRenameValue('');
        }}
        title="重命名文档"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRenamingDoc(null);
                setRenameValue('');
              }}
              className={BTN_SOFT}
            >
              取消
            </button>
            <button type="button" onClick={commitRename} disabled={!renameValue.trim()} className={BTN_INK}>
              确定
            </button>
          </>
        }
      >
        <div>
          <label className={LABEL}>文件名</label>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className={FIELD}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};
