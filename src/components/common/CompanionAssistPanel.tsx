/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 伴随式知识搭子
 * - rail：列表页右侧窄栏（工具推荐 / 猜你想问）
 * - dock：进库后左侧对话坞（对齐技能搭子：思考卡 / 附件 / 处理结果 / 确认入库）
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  ChevronRight,
  Database,
  Eye,
  FileText,
  History,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  ArrowUp,
  X,
} from '@/lib/icons';
import {
  CHIP,
  MODAL_SHELL_FIXED,
  NAV_ACTIVE_GRADIENT_TEXT,
  SKILL_AOP_ACCENT_TEXT,
  SKILL_AOP_SEND_BTN,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import { PROFILE_USER } from '@/lib/profileUser';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import {
  DEFAULT_KB_PROCESS_PROMPT,
  buildKnowledgeProcessResult,
  buildKnowledgeProcessThinkSteps,
  formatFileSizeLabel,
  type KnowledgeChunkKind,
  type KnowledgeProcessFile,
  type KnowledgeProcessResult,
} from '@/lib/knowledgeAssistMock';
import { ChatAttachmentCards } from './ChatAttachmentCards';
import { SkillThinkingCard, estimateThinkStreamMs } from '../skills/SkillThinkingCard';
import { KnowledgeProcessResultCard } from '../knowledge/KnowledgeProcessResultCard';
import { KnowledgeChunkPreviewModal } from '../knowledge/KnowledgeChunkPreviewModal';

/** 对齐 BuildSkillModal 对话气泡 */
const USER_CHAT_BUBBLE = cn(
  'px-3 py-3 text-[14px] leading-[22px] whitespace-pre-line text-[#181D27] rounded-[20px_4px_20px_20px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);
const AI_CHAT_BUBBLE =
  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[22px] whitespace-pre-line bg-neutral-100 text-[#595959]';

function renderAiBubbleContent(content: string) {
  const parts = content.split(/([「『“][^」』”]*[」』”])/);
  if (parts.length <= 1) return content;
  return parts.map((part, i) =>
    /^[「『“].*[」』”]$/.test(part) ? (
      <span key={i} className="font-semibold text-[#1c1d1f]">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const STORAGE_KEY = 'js_companion_assist_open';
const ATTACH_ACCEPT = '.pdf,.txt,.md,.doc,.docx,.csv,.json,.xlsx,.xls,.png,.jpg,.jpeg,.webp';

export type CompanionTool = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export type CompanionAssistPanelProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  layout?: 'rail' | 'dock';
  knowledgeName?: string;
  highlightValue?: string | number;
  greetingBefore?: string;
  greetingAfter?: string;
  tools?: CompanionTool[];
  questions?: string[];
  replyChips?: string[];
  inputPlaceholder?: string;
  className?: string;
  onPromptSelect?: (text: string) => void;
  onSend?: (text: string) => void;
  showChrome?: boolean;
  showToast?: (message: string) => void;
  /** 确认入库后回调（可同步右侧文档数） */
  onConfirmIngest?: (result: KnowledgeProcessResult) => void;
};

type PendingAttach = {
  id: string;
  name: string;
  sizeLabel: string;
  file?: File;
  /** 本地预览 Object URL，移除/替换时需 revoke */
  previewUrl?: string;
};

type AttachPreviewState = {
  name: string;
  sizeLabel: string;
  url?: string;
  mime?: string;
  text?: string;
};

type CompanionChatMsg =
  | {
      id: string;
      kind: 'user';
      text: string;
      attachments?: Array<{
        name: string;
        sizeLabel?: string;
        statusLabel?: string;
        previewUrl?: string;
        mime?: string;
      }>;
    }
  | { id: string; kind: 'ai'; text: string; tip?: string }
  | {
      id: string;
      kind: 'think';
      steps: SkillThinkStep[];
      durationSec: number;
      generating?: boolean;
    }
  | {
      id: string;
      kind: 'process_result';
      result: KnowledgeProcessResult;
      confirmed?: boolean;
      discarded?: boolean;
      /** 用户选择「重新处理」，结果卡进入调整中态 */
      reprocessing?: boolean;
    };

const DEFAULT_TOOLS: CompanionTool[] = [
  { id: 'create', label: '智能建库', icon: <Database size={16} strokeWidth={1.75} /> },
  { id: 'upload', label: '文档入库', icon: <Upload size={16} strokeWidth={1.75} /> },
  { id: 'search', label: '知识检索', icon: <Search size={16} strokeWidth={1.75} /> },
  { id: 'gap', label: '缺口分析', icon: <Sparkles size={16} strokeWidth={1.75} /> },
  { id: 'qa', label: '问答试跑', icon: <BookOpen size={16} strokeWidth={1.75} /> },
  { id: 'batch', label: '批量整理', icon: <FileText size={16} strokeWidth={1.75} /> },
];

const DEFAULT_QUESTIONS = [
  '如何把 PDF 手册导入知识库？',
  '知识库和员工技能怎么绑定？',
  '文档分块方法该怎么选？',
  '怎样检查知识库检索效果？',
  '多个知识库如何分工管理？',
];

const QUESTION_POOL = [
  ...DEFAULT_QUESTIONS,
  '上传失败常见原因有哪些？',
  '字符数统计包含什么内容？',
  '如何给知识库重命名？',
  '删除知识库会影响在岗员工吗？',
  '嵌入模型选错会怎样？',
];

const DEFAULT_REPLY_CHIPS = [
  '清理格式并提取问答',
  '按业务主题生成分片',
  '试跑检索效果',
  '完善解析配置',
];

/** 与技能多轮 composer 内附件条一致 */
const COMPOSER_FILE_CHIP =
  'inline-flex items-center gap-1.5 h-7 max-w-[280px] pl-1.5 pr-1 rounded-[7px] bg-white border border-neutral-200 text-[12px] text-neutral-800 shrink-0';

function readInitialOpen(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

function buildKnowledgeReply(userText: string, knowledgeName?: string): string {
  const kb = knowledgeName?.trim() || '当前知识库';
  const t = userText.trim();
  if (/解析|分块|切片/.test(t)) {
    return `已为「${kb}」整理解析建议：\n1. 优先按标题/段落切块，单块建议 300–800 字\n2. 表格与清单单独成块，避免与正文混切\n3. 可在右侧「解析配置」核对切块预览后再保存\n\n也可以直接上传文件，我来清洗并生成候选分片。`;
  }
  if (/检索|召回|试跑|问答/.test(t)) {
    return `建议在右侧切到「检索配置 / 召回调试」：\n· 用 3–5 条真实业务问法试跑\n· 关注 Top3 命中是否覆盖关键条款\n· 若跑偏，优先检查分块过碎或标题缺失\n\n可以说一条想试的问法，我帮你拆检索要点。`;
  }
  if (/上传|入库|文档|PDF|手册|xlsx|excel/.test(t)) {
    return `可以直接点输入框旁「+」上传文件（格式与大小限制与普通上传一致，数量不限）。\n我会先清洗无效格式与重复内容，再生成普通文本分片与 QA 问答对；处理完成后你可预览，确认后才写入「${kb}」。`;
  }
  if (/缺口|缺失|覆盖/.test(t)) {
    return `知识缺口可从三侧排查：\n1. 文档清单是否缺「拒赔 / 理赔材料 / 时效」等高频主题\n2. 检索试跑是否命中空或答非所问\n3. 绑定员工场景与库内容是否匹配\n\n说下业务场景，我帮你列一份待补主题清单。`;
  }
  if (/绑定|员工|技能/.test(t)) {
    return `知识库绑定在右侧「绑定员工」区完成；员工技能侧在「员工技能」页订阅后，于培训配置里勾选本库即可调用。\n建议先保证库内文档可检索，再绑定到在岗员工。`;
  }
  return `收到。围绕「${kb}」，我可以帮你：上传并清洗文档、提取问答、生成分片并确认入库，或完善解析与检索。\n也可以点上方快捷项，或直接上传文件开始处理。`;
}

function shouldRunDocumentProcess(text: string, hasAttach: boolean): boolean {
  if (hasAttach) return true;
  return /清理|清洗|分片|问答对|提取|入库|上传|处理文档|xlsx|excel|表格/.test(text);
}

export function CompanionAssistOpenButton({
  onClick,
  className,
  label = '知识搭子',
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`打开 ${label}`}
      aria-label={`打开 ${label}`}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 px-3 rounded-[7px]',
        'border border-neutral-200 bg-white text-neutral-800',
        'text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer',
        className,
      )}
    >
      <Sparkles size={14} className={SKILL_AOP_ACCENT_TEXT} />
      <span>{label}</span>
    </button>
  );
}

export function CompanionAssistPanel({
  open: openProp,
  onOpenChange,
  layout = 'rail',
  knowledgeName,
  highlightValue,
  greetingBefore,
  greetingAfter = ' 个知识库，一起打理吧',
  tools = DEFAULT_TOOLS,
  questions: questionsProp,
  replyChips = DEFAULT_REPLY_CHIPS,
  inputPlaceholder = '继续补充规则，或上传文档让我清洗分片…',
  className,
  onPromptSelect,
  onSend,
  showChrome = true,
  showToast,
  onConfirmIngest,
}: CompanionAssistPanelProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(readInitialOpen);
  const open = openProp ?? uncontrolledOpen;
  const [draft, setDraft] = useState('');
  const [questionSeed, setQuestionSeed] = useState(0);
  const [messages, setMessages] = useState<CompanionChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [pendingAttach, setPendingAttach] = useState<PendingAttach[]>([]);
  const [attachPreview, setAttachPreview] = useState<AttachPreviewState | null>(null);
  const [preview, setPreview] = useState<{
    result: KnowledgeProcessResult;
    tab: KnowledgeChunkKind;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPreviewUrlsRef = useRef<string[]>([]);

  const questions = useMemo(() => {
    if (questionsProp?.length) return questionsProp;
    const start = (questionSeed * 5) % QUESTION_POOL.length;
    return Array.from({ length: 5 }, (_, i) => QUESTION_POOL[(start + i) % QUESTION_POOL.length]);
  }, [questionsProp, questionSeed]);

  const greetingLead = greetingBefore ?? `Hi ${PROFILE_USER.name}，当前有 `;
  const isDock = layout === 'dock';
  const busy = thinking;

  const hasPending = pendingAttach.length > 0;

  const clearPendingAttach = () => {
    pendingPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pendingPreviewUrlsRef.current = [];
    setPendingAttach([]);
  };

  const removePendingAttach = (id: string) => {
    setPendingAttach((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
        pendingPreviewUrlsRef.current = pendingPreviewUrlsRef.current.filter(
          (url) => url !== removed.previewUrl,
        );
      }
      return next;
    });
  };

  const openAttachPreview = async (attach: {
    name: string;
    sizeLabel?: string;
    file?: File;
    previewUrl?: string;
    mime?: string;
  }) => {
    const sizeLabel = attach.sizeLabel ?? '';
    const mime = attach.mime || attach.file?.type || guessMimeFromName(attach.name);
    const url = attach.previewUrl || (attach.file ? URL.createObjectURL(attach.file) : undefined);

    if (isTextLike(attach.name, mime) && attach.file) {
      try {
        const text = (await attach.file.text()).slice(0, 12000);
        setAttachPreview({ name: attach.name, sizeLabel, url, mime, text });
        return;
      } catch {
        /* fall through */
      }
    }

    if (url || isImageLike(attach.name, mime)) {
      setAttachPreview({ name: attach.name, sizeLabel, url, mime });
      return;
    }

    showToast?.(`暂无法预览「${attach.name}」，发送处理后可在结果卡中查看`);
  };

  useEffect(() => {
    if (!open || !isDock) return;
    const kb = knowledgeName?.trim();
    setMessages([
      {
        id: 'welcome',
        kind: 'ai',
        text: kb
          ? `你好，我可以帮你整理文档、清洗内容、提取问答并生成适合知识库使用的知识分片。处理完成后，我会先把结果发给你查看，只有在你确认后才会写入「${kb}」。`
          : `你好，我是知识搭子。选中知识库后，可一起完善解析、入库与检索试跑。`,
      },
    ]);
    setDraft('');
    clearPendingAttach();
    setThinking(false);
    setPreview(null);
    setAttachPreview(null);
  }, [open, isDock, knowledgeName]);

  useEffect(() => {
    if (!isDock) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thinking, isDock, pendingAttach]);

  useEffect(
    () => () => {
      if (thinkTimerRef.current) window.clearTimeout(thinkTimerRef.current);
      pendingPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      pendingPreviewUrlsRef.current = [];
    },
    [],
  );

  const setOpenPersist = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const applyPrompt = (text: string) => {
    setDraft(text);
    onPromptSelect?.(text);
  };

  const toast = (message: string) => {
    showToast?.(message);
  };

  const runDocumentProcess = (userText: string, attach: PendingAttach) => {
    const thinkId = `think_${Date.now()}`;
    const steps = buildKnowledgeProcessThinkSteps(attach.name);
    const streamMs = estimateThinkStreamMs(steps);
    setMessages((prev) => [
      ...prev,
      {
        id: thinkId,
        kind: 'think',
        steps,
        durationSec: 0,
        generating: true,
      },
    ]);
    setThinking(true);
    if (thinkTimerRef.current) window.clearTimeout(thinkTimerRef.current);
    thinkTimerRef.current = window.setTimeout(() => {
      const result = buildKnowledgeProcessResult(attach.name, attach.sizeLabel);
      const durationSec = Math.max(1, Math.round(streamMs / 1000));
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === thinkId && m.kind === 'think'
            ? { ...m, generating: false, durationSec }
            : m,
        ),
        {
          id: `proc_${Date.now()}`,
          kind: 'process_result',
          result,
        },
      ]);
      setThinking(false);
      thinkTimerRef.current = null;
      onSend?.(userText);
    }, streamMs);
  };

  const pushTextReply = (userText: string) => {
    setThinking(true);
    if (thinkTimerRef.current) window.clearTimeout(thinkTimerRef.current);
    thinkTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          kind: 'ai',
          text: buildKnowledgeReply(userText, knowledgeName),
        },
      ]);
      setThinking(false);
      thinkTimerRef.current = null;
    }, 700);
  };

  const handleSend = () => {
    const text = draft.trim() || (hasPending ? DEFAULT_KB_PROCESS_PROMPT : '');
    if ((!text && !hasPending) || busy) return;

    if (!isDock) {
      onSend?.(text);
      setDraft('');
      return;
    }

    const attach = pendingAttach;
    setMessages((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        kind: 'user',
        text,
        attachments: attach.length
          ? attach.map((item) => ({
              name: item.name,
              sizeLabel: item.sizeLabel,
              statusLabel: '上传成功',
              previewUrl: item.previewUrl,
              mime: item.file?.type || guessMimeFromName(item.name),
            }))
          : undefined,
      },
    ]);
    setDraft('');
    pendingPreviewUrlsRef.current = [];
    setPendingAttach([]);

    if (shouldRunDocumentProcess(text, attach.length > 0)) {
      const fileMeta =
        attach[0] ??
        ({
          id: 'fallback',
          name: '食安随问答知识库0827(1).xlsx',
          sizeLabel: '37.90 KB',
        } satisfies PendingAttach);
      runDocumentProcess(text, fileMeta);
      return;
    }

    onSend?.(text);
    pushTextReply(text);
  };

  const handleChip = (chip: string) => {
    applyPrompt(chip);
  };

  const onPickFile = async (fileList: FileList | null) => {
    const incoming = Array.from(fileList ?? []);
    if (incoming.length === 0) return;
    const added: PendingAttach[] = incoming.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      pendingPreviewUrlsRef.current.push(previewUrl);
      return {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        sizeLabel: formatFileSizeLabel(file.size),
        file,
        previewUrl,
      };
    });
    setPendingAttach((prev) => [...prev, ...added]);
    if (!draft.trim()) setDraft(DEFAULT_KB_PROCESS_PROMPT);
    toast(
      added.length === 1
        ? `已选择「${added[0].name}」，可点芯片预览，发送后开始处理`
        : `已选择 ${added.length} 个文件，可点芯片预览，发送后开始处理`,
    );
  };

  const openPreview = (result: KnowledgeProcessResult, tab: KnowledgeChunkKind) => {
    setPreview({ result, tab });
  };

  const updateProcessMsg = (
    id: string,
    patch: Partial<Extract<CompanionChatMsg, { kind: 'process_result' }>>,
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && m.kind === 'process_result' ? { ...m, ...patch } : m)),
    );
  };

  if (!open) return null;

  const header = (
    <header
      className={cn(
        'shrink-0 flex items-center justify-between gap-2 border-b border-neutral-100',
        isDock ? 'h-14 px-5' : 'h-12 px-4',
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Sparkles size={15} className={cn(SKILL_AOP_ACCENT_TEXT, 'shrink-0')} />
        <span className={cn('text-[14px] font-semibold tracking-tight', NAV_ACTIVE_GRADIENT_TEXT)}>
          知识搭子
        </span>
        {knowledgeName ? (
          <span className="hidden sm:inline-flex h-5 items-center px-1.5 rounded-md bg-[rgba(21,101,191,0.08)] text-[11px] font-medium text-[#1565BF]">
            已关联当前知识库
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {!isDock ? (
          <>
            <IconBtn title="历史" ariaLabel="历史记录">
              <History size={15} />
            </IconBtn>
            <IconBtn title="展开" ariaLabel="全屏">
              <Maximize2 size={15} />
            </IconBtn>
          </>
        ) : null}
        <IconBtn title="收起" ariaLabel="收起知识搭子" onClick={() => setOpenPersist(false)}>
          <X size={15} />
        </IconBtn>
      </div>
    </header>
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      accept={ATTACH_ACCEPT}
      multiple
      onChange={(e) => {
        void onPickFile(e.target.files);
        e.currentTarget.value = '';
      }}
    />
  );

  const dockComposer = (
    <div className="w-full max-w-[720px] mx-auto px-3 pb-3 pt-1 shrink-0">
      {replyChips.length > 0 && !busy ? (
        <div className="pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {replyChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              className={CHIP}
              title="点选后填入输入框，可再编辑后发送"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      <div className="pt-1">
        <div className="skill-ai-composer skill-ai-composer--dock p-3">
          {hasPending ? (
            <div className="flex items-center gap-2 pb-2 mb-1 overflow-x-auto no-scrollbar">
              {pendingAttach.map((item) => (
                <span
                  key={item.id}
                  className={COMPOSER_FILE_CHIP}
                  title={`${item.name} · ${item.sizeLabel} · 点击预览`}
                >
                  <button
                    type="button"
                    onClick={() => void openAttachPreview(item)}
                    className="inline-flex items-center gap-1.5 min-w-0 cursor-pointer text-left"
                    aria-label={`预览 ${item.name}`}
                  >
                    <FileText size={12} className="text-neutral-500 shrink-0" />
                    <span className="truncate min-w-0">{item.name}</span>
                    <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
                      {item.sizeLabel}
                    </span>
                    <Eye size={12} className="text-neutral-400 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePendingAttach(item.id)}
                    className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                    aria-label={`移除 ${item.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={inputPlaceholder}
            className="w-full min-h-[44px] max-h-40 overflow-y-auto bg-transparent text-[14px] leading-[22px] pb-2 outline-none resize-none placeholder:text-[#B0B2B8] text-[#1C1D1F]"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {fileInput}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-8 h-8 rounded border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 flex items-center justify-center cursor-pointer shrink-0',
                  pendingAttach.length > 0 && 'border-neutral-300',
                )}
                title="上传文件"
                aria-label="上传文件"
              >
                <Plus size={16} />
              </button>
              <span className="text-[12px] leading-[22px] text-neutral-400 tabular-nums">
                {draft.length}/1000
              </span>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={(!draft.trim() && !hasPending) || busy}
              title="发送"
              aria-label="发送"
              className={cn(SKILL_AOP_SEND_BTN, 'w-8 h-8')}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] leading-4 text-neutral-400">
        内容由 AI 生成，仅供参考
      </p>
    </div>
  );

  const railComposer = (
    <footer className="shrink-0 border-t border-neutral-100 bg-white px-3 pt-2 pb-3">
      <div className="skill-ai-composer skill-ai-composer--dock p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          maxLength={1000}
          placeholder="问问知识库怎么建、怎么用…"
          className="w-full min-h-[44px] max-h-28 overflow-y-auto bg-transparent text-[14px] leading-[22px] pb-2 outline-none resize-none placeholder:text-[#B0B2B8] text-[#1C1D1F]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="w-8 h-8 rounded border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 flex items-center justify-center cursor-pointer shrink-0"
              title="上传文件"
              aria-label="上传文件"
              onClick={() => toast('请进入知识库工作台后上传文档')}
            >
              <Plus size={16} />
            </button>
            <span className="text-[12px] leading-[22px] text-neutral-400 tabular-nums">
              {draft.length}/1000
            </span>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || busy}
            title="发送"
            aria-label="发送"
            className={cn(SKILL_AOP_SEND_BTN, 'w-8 h-8')}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] leading-4 text-neutral-400">
        内容由 AI 生成，仅供参考
      </p>
    </footer>
  );

  const renderDockMessage = (msg: CompanionChatMsg) => {
    if (msg.kind === 'user') {
      return (
        <div key={msg.id} className="flex justify-end">
          <div className="flex flex-col items-end gap-1.5 max-w-[88%]">
            {msg.attachments?.length ? (
              <ChatAttachmentCards
                align="end"
                attachments={msg.attachments.map((a) => ({
                  ...a,
                  statusTone: 'success' as const,
                  onPreview: () => void openAttachPreview(a),
                }))}
              />
            ) : null}
            {msg.text ? <div className={USER_CHAT_BUBBLE}>{msg.text}</div> : null}
          </div>
        </div>
      );
    }
    if (msg.kind === 'ai') {
      return (
        <div key={msg.id} className="flex justify-start">
          <div className={AI_CHAT_BUBBLE}>{renderAiBubbleContent(msg.text)}</div>
        </div>
      );
    }
    if (msg.kind === 'think') {
      return (
        <SkillThinkingCard
          key={msg.id}
          steps={msg.steps}
          durationSec={msg.durationSec}
          isComplete={!msg.generating}
          generating={msg.generating}
          className="!ml-0 mr-0 w-full"
        />
      );
    }
    if (msg.kind === 'process_result') {
      const latestProcessId = [...messages]
        .reverse()
        .find((m) => m.kind === 'process_result')?.id;
      const locked = msg.id !== latestProcessId;
      return (
        <div
          key={msg.id}
          className={cn('w-full animate-in fade-in duration-200', locked && 'opacity-90')}
        >
          <KnowledgeProcessResultCard
            result={msg.result}
            confirmed={msg.confirmed}
            discarded={msg.discarded}
            reprocessing={msg.reprocessing}
            locked={locked}
            onPreviewFile={(file: KnowledgeProcessFile) =>
              openPreview(msg.result, file.kind)
            }
            onDownloadFile={(file) => toast(`已开始下载「${file.name}」`)}
            onConfirm={() => {
              updateProcessMsg(msg.id, { confirmed: true });
              onConfirmIngest?.(msg.result);
              toast(`已将 ${msg.result.total} 条候选知识写入当前知识库`);
            }}
            onReprocess={() => {
              updateProcessMsg(msg.id, { reprocessing: true, discarded: false });
              const fileName = msg.result.sourceFileName;
              const attach: PendingAttach = {
                id: `att_re_${Date.now()}`,
                name: fileName,
                sizeLabel: msg.result.sourceSizeLabel,
              };
              setPendingAttach([attach]);
              setDraft('');
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai_re_${Date.now()}`,
                  kind: 'ai',
                  text: `好的，请在下方输入框告诉我新的处理要求，我会基于原文件 “${fileName}” 重新整理知识。`,
                },
              ]);
            }}
            onDiscard={() => {
              updateProcessMsg(msg.id, { discarded: true, reprocessing: false });
              toast('已放弃本次生成结果');
            }}
          />
        </div>
      );
    }
    return null;
  };

  if (isDock) {
    return (
      <>
        <div
          className={cn('flex flex-col h-full min-h-0 w-full min-w-0 bg-[#F9F9FB]', className)}
          aria-label="知识搭子"
        >
          {showChrome ? header : null}
          <div className="flex-1 min-h-0 flex flex-col">
            <div
              ref={scrollRef}
              className="flex-1 pt-5 pb-5 overflow-y-auto min-h-0 custom-scrollbar-thin"
            >
              <div className="w-full max-w-[720px] mx-auto px-4 space-y-3">
                {messages.map(renderDockMessage)}
                {thinking && !messages.some((m) => m.kind === 'think' && m.generating) ? (
                  <div className="flex justify-start">
                    <div className={AI_CHAT_BUBBLE}>正在梳理知识建议…</div>
                  </div>
                ) : null}
              </div>
            </div>
            {dockComposer}
          </div>
        </div>
        {preview ? (
          <KnowledgeChunkPreviewModal
            open
            result={preview.result}
            initialTab={preview.tab}
            onClose={() => setPreview(null)}
            onDownload={() => toast('已开始下载候选文件')}
          />
        ) : null}
        <AttachFilePreviewModal
          preview={attachPreview}
          onClose={() => setAttachPreview(null)}
        />
      </>
    );
  }

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col h-full min-h-0 w-[320px]',
        'bg-white border-l border-neutral-200',
        className,
      )}
      aria-label="知识搭子"
    >
      {header}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 space-y-4">
        <p className="text-[13px] leading-5 text-neutral-600">
          {greetingLead}
          {highlightValue !== undefined && highlightValue !== null ? (
            <span className={cn('font-semibold tabular-nums', SKILL_AOP_ACCENT_TEXT)}>
              {highlightValue}
            </span>
          ) : null}
          {greetingAfter}
        </p>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-medium text-neutral-500">工具推荐</h2>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-[12px] text-neutral-500 hover:text-neutral-800 cursor-pointer transition"
            >
              全部工具
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {tools.slice(0, 6).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  tool.onClick?.();
                  applyPrompt(tool.label);
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 min-h-[64px] px-1 py-2',
                  'rounded-[7px] border border-neutral-200 bg-neutral-50/70',
                  'text-neutral-800 hover:bg-white hover:border-neutral-300 hover:shadow-[0_1px_4px_rgba(17,17,17,0.04)]',
                  'transition cursor-pointer',
                )}
              >
                <span className="text-neutral-700">{tool.icon}</span>
                <span className="text-[12px] leading-4 font-medium truncate max-w-full">
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-medium text-neutral-500">猜你想问</h2>
            <button
              type="button"
              onClick={() => setQuestionSeed((s) => s + 1)}
              className="inline-flex items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-800 cursor-pointer transition"
            >
              <RefreshCw size={12} />
              换一换
            </button>
          </div>
          <ul className="rounded-[7px] border border-neutral-200 overflow-hidden divide-y divide-neutral-100 bg-white">
            {questions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => applyPrompt(q)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-neutral-50 transition group"
                >
                  <span className="flex-1 min-w-0 text-[13px] leading-5 text-neutral-800 group-hover:text-neutral-950 line-clamp-2">
                    {q}
                  </span>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-neutral-300 group-hover:text-neutral-500"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {railComposer}
    </aside>
  );
}

function IconBtn({
  children,
  title,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md',
        'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
        'transition cursor-pointer',
      )}
    >
      {children}
    </button>
  );
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return 'image/*';
  if (/\.(txt|md|csv|json|log|xml|html?|css|js|ts|tsx|py|yml|yaml)$/.test(lower)) {
    return 'text/plain';
  }
  return '';
}

function isImageLike(name: string, mime?: string) {
  return Boolean(mime?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

function isTextLike(name: string, mime?: string) {
  if (mime?.startsWith('text/')) return true;
  if (mime === 'application/json') return true;
  return /\.(txt|md|csv|json|log|xml|html?|css|js|ts|tsx|py|yml|yaml)$/i.test(name);
}

function AttachFilePreviewModal({
  preview,
  onClose,
}: {
  preview: AttachPreviewState | null;
  onClose: () => void;
}) {
  if (!preview) return null;

  const image = isImageLike(preview.name, preview.mime) && preview.url;
  const text = preview.text;

  return createPortal(
    <div
      className="fixed inset-0 z-[270] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`预览 ${preview.name}`}
      onClick={onClose}
    >
      <div
        className={cn(MODAL_SHELL_FIXED, 'max-w-[720px] h-[min(820px,90vh)]')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-neutral-900 truncate">{preview.name}</h2>
            {preview.sizeLabel ? (
              <p className="text-[11px] text-neutral-400 tabular-nums mt-0.5">{preview.sizeLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-100 cursor-pointer shrink-0"
            aria-label="关闭预览"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-neutral-50 p-4">
          {image ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-w-full max-h-[min(640px,70vh)] mx-auto rounded-lg border border-neutral-200 bg-white object-contain"
            />
          ) : text != null ? (
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-neutral-200 bg-white p-3 text-[12px] leading-5 text-neutral-700 font-mono">
              {text}
            </pre>
          ) : preview.url ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileText size={28} className="text-neutral-400" />
              <p className="text-[13px] text-neutral-600">此类型可在新标签页打开预览</p>
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] font-medium text-[#1565BF] hover:underline"
              >
                打开文件
              </a>
            </div>
          ) : (
            <p className="py-12 text-center text-[13px] text-neutral-400">暂无可预览内容</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
