/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/src/context/AppContext';
import { GoalComposerGhost } from '../GoalComposerGhost';
import { SKILL_CREATE_CASES } from '@/lib/homeCreateCases';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  CheckCircle,
  Loader2,
  Settings,
  Cpu,
  ArrowRight,
  Send,
  ArrowUp,
  HelpCircle,
  FileText,
  Clock,
  Circle,
  Layers,
  BookOpen,
  UploadCloud,
  RotateCcw,
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Database,
  Check,
  Eye,
  Copy,
  Play,
  FlaskConical,
  Terminal,
  Workflow,
  Scale,
  Paperclip,
  Code,
  CheckSquare,
  Square,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Upload,
  LayoutGrid,
  Folder,
  Pencil,
} from '@/lib/icons';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import type { Skill } from '@/src/types';
import {
  BTN_INK,
  BTN_OUTLINE,
  BTN_SOFT,
  CHIP,
  FIELD,
  FIELD_CTRL,
  LABEL,
  LIST_META,
  PANEL,
  SKILL_AOP_ACCENT_TEXT,
  SKILL_AOP_CHIP,
  SKILL_AOP_GRADIENT_BG,
  SKILL_AOP_GRADIENT_TEXT,
  SKILL_AOP_HOVER_TINT,
  SKILL_AOP_PRIMARY_BTN,
  SKILL_AOP_SELECTED_ROW,
  SKILL_AOP_SEND_BTN,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import {
  appendComposerChipBlock,
  buildComposerTaggedInput,
  buildDynamicSkillReplyPe,
  hasAwaitingSkillConfirm,
  parseResetRequirementsToConfirmItems,
  pickLatestAiTextsForReplyPe,
  pickLatestUserText,
  type SkillReplyPeChip,
} from '@/lib/skillReplyPe';
import { cn } from '@/lib/utils';
import { SegmentedTabBar } from '../common/SegmentedTabs';
import { Modal } from '../common/Modal';
import { ManusExpertFrame } from './ManusExpertFrame';
import { SkillRewriteField, SkillRewriteProvider } from './SkillRewriteField';
import { SkillRoundConfirmCard, type SkillConfirmFieldKey, type SkillConfirmItem } from './SkillRoundConfirmCard';
import { SkillThinkingCard, estimateThinkStreamMs } from './SkillThinkingCard';
import { SkillTaskPlanCard } from './SkillTaskPlanCard';
import { buildIntentThinkPlan, buildSkillClarifyQuestions, formatClarifyAnswers, type SkillThinkStep } from '@/lib/skillStudioMock';
import { SKILL_PAGE_COPY, SKILL_CREATE_CHAT } from '@/lib/platformTerminology';
import { PROFILE_USER } from '@/lib/profileUser';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SkillClarifyCard, type SkillClarifyPayload } from './SkillClarifyCard';
import { ChatAttachmentCards } from '../common/ChatAttachmentCards';
import {
  CHAT_ATTACHMENT_MARKER,
  splitChatContentWithAttachments,
} from '@/lib/chatAttachments';

const BACK_TO_SKILLS_LABEL = `返回${SKILL_PAGE_COPY.title}`;
const BACK_TO_CREATE_LABEL = '返回技能创建';

const FORM_SECTION_TITLES = {
  1: '技能定义',
  2: '技能主体',
  3: '规范约束',
  4: '补充说明',
} as const;

/** 右侧四张表单：内容区撑满一页，超出再滚动（不再套一层灰底卡片） */
const FORM_SECTION_BODY = 'flex-1 min-h-0 overflow-hidden px-3 pb-3 pt-1 flex flex-col';
const FORM_SECTION_CARD =
  'flex-1 min-h-0 overflow-y-auto custom-scrollbar';
const FORM_SECTION_CARD_INNER = 'min-h-full flex flex-col gap-3';

/** 用户消息气泡 — 右上角小圆角；浅蓝底与顶栏激活渐变 #1565BF 同系 */
const USER_CHAT_BUBBLE = cn(
  'px-3 py-3 text-[14px] leading-[22px] whitespace-pre-line text-[#181D27] rounded-[20px_4px_20px_20px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);

/**
 * AI 气泡正文 — 对齐 Figma B 端 AI 组件规范（2916:46264）
 * regular-14 / lh 22 / jd-color-text-300 #595959；强调标签 medium-14 #1c1d1f
 */
const AI_CHAT_BUBBLE =
  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[22px] whitespace-pre-line bg-neutral-100 text-[#595959]';
/** 系统引导气泡 — Figma jd-color-text-200 */
const SYSTEM_STATUS_CHAT_BUBBLE =
  'max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-[22px] whitespace-pre-line bg-neutral-100 text-[#8c8c8c]';

/** 将“字段名”等书名号片段按规范强调（Semibold #1c1d1f） */
function renderAiBubbleContent(content: string) {
  const parts = content.split(/([「『“][^」』”]*[」』”])/);
  if (parts.length <= 1) return content;
  return parts.map((part, i) =>
    /^[「『“].*[」』”]$/.test(part) ? (
      <span key={i} className="font-semibold text-[#1c1d1f]">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/** 与 SkillRoundConfirmCard / 澄清卡一致的对话流卡片壳 */
const SKILL_CHAT_CARD = 'rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden animate-in fade-in duration-200';
const SKILL_CHAT_CARD_HEAD = 'flex items-center justify-between gap-2 px-3 py-3 min-w-0';
const SKILL_CHAT_CARD_BODY = 'px-3 pb-3 space-y-3';
const SKILL_CHAT_CARD_PANEL = 'rounded border border-neutral-200/80 bg-white p-4 space-y-3';
const SKILL_CHAT_STAT_CELL =
  'rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-2 text-center';
const SKILL_CHAT_SUGGESTION_ROW =
  'rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2.5 space-y-2';

/** 与多轮对话 composer 内索引条（编辑要点）一致 */
const GOAL_INDEX_CHIP =
  'inline-flex items-center gap-1.5 h-7 max-w-[240px] pl-1.5 pr-1 rounded-[7px] bg-white border border-neutral-200 text-[12px] text-neutral-800 shrink-0';

/** 表单必填标记（对齐主应用：星号，不用“必填”字样） */
const REQUIRED_STAR = (
  <span className="text-rose-500 text-[12px] font-semibold leading-none shrink-0" aria-label="必填">
    *
  </span>
);
interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: 'doc' | 'sheet' | 'script';
  inSkill: boolean;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

/** 对话输入框附件（落在 composer，发送时带入上下文） */
type ComposerAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
  textExcerpt?: string;
};

const COMPOSER_FILE_ACCEPT =
  '.pdf,.txt,.md,.doc,.docx,.csv,.json,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.ts,.tsx,.py,.js,.jsx,.sh,.yaml,.yml,.xml,.html,.css,.log,.zip';
const COMPOSER_MAX_FILES = 8;
const COMPOSER_MAX_BYTES = 20 * 1024 * 1024;

function formatComposerFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}

function isComposerReadableText(file: File): boolean {
  if (file.type.startsWith('text/') || file.type === 'application/json') return true;
  return /\.(txt|md|csv|json|log|ts|tsx|js|jsx|py|sh|yaml|yml|xml|html|css)$/i.test(file.name);
}

function isComposerAcceptedFile(file: File): boolean {
  return COMPOSER_FILE_ACCEPT.split(',').some((token) => {
    const t = token.trim().toLowerCase();
    if (!t) return false;
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
    return file.type === t;
  });
}

async function buildComposerAttachment(file: File): Promise<ComposerAttachment> {
  let textExcerpt: string | undefined;
  if (isComposerReadableText(file) && file.size <= 200_000) {
    try {
      const text = await file.text();
      textExcerpt = text.replace(/\s+$/g, '').slice(0, 4000);
    } catch {
      /* ignore */
    }
  }
  return {
    id: `catt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    sizeLabel: formatComposerFileSize(file.size),
    textExcerpt,
  };
}

function buildComposerAttachmentBlock(files: ComposerAttachment[]): string {
  if (files.length === 0) return '';
  const lines = files.map((f) => {
    const base = `- ${f.name}（${f.sizeLabel}）`;
    if (!f.textExcerpt) return base;
    return `${base}\n\`\`\`\n${f.textExcerpt}\n\`\`\``;
  });
  return `${CHAT_ATTACHMENT_MARKER}\n${lines.join('\n')}`;
}

interface ExecutionStep {
  id: number;
  name: string;
  description: string;
  example: string;
  stepKnowledge?: string;
  stepKnowledgeList?: string[];
  isResourcesExpanded?: boolean;
  associatedScripts?: string[];
  associatedKBs?: string[];
  associatedDocs?: string[];
  activeConfig?: 'variables' | 'resources' | 'cases' | null;
  variables?: any[];
  knowledgeBases?: string[];
  selectedScript?: 'erp' | 'claim' | 'crm' | null;
  upstream?: string[];
  downstream?: string[];
}

interface BuildSkillModalProps {
  open: boolean;
  onClose: () => void;
  draftSkillId?: string | null;
  initialMode?: 'interactive' | 'zip' | null;
  /** 智能创作入口带入的目标描述，进入后自动开聊 */
  initialPrompt?: string | null;
  /** 首页已索引知识库名称 */
  initialSelectedKBs?: string[];
  onPublished?: (skill: Skill) => void;
  /** 未进入多轮时的返回文案；默认“返回数字员工技能” */
  closeLabel?: string;
}


interface AttachResourceMenuProps {
  allKBs: string[];
  allScripts: Array<{ id: string; name: string }>;
  attachedKBs?: string[];
  attachedScripts?: string[];
  onAttachKB: (kbName: string) => void;
  onAttachScript: (scriptName: string) => void;
  onRemoveKB?: (kbName: string) => void;
  onRemoveScript?: (scriptName: string) => void;
}

const AttachResourceMenu: React.FC<AttachResourceMenuProps> = ({
  allKBs,
  allScripts,
  attachedKBs = [],
  attachedScripts = [],
  onAttachKB,
  onAttachScript,
  onRemoveKB,
  onRemoveScript
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left my-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium text-neutral-600 transition cursor-pointer"
        >
          <Paperclip size={11} className="text-neutral-500" />
          <span>选用知识库或接口</span>
          <ChevronDown size={10} className="text-neutral-400" />
        </button>

        {attachedKBs.map(kb => (
          <span key={kb} className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            <BookOpen size={10} /> 知识库: {kb}
            {onRemoveKB && (
              <button type="button" onClick={() => onRemoveKB(kb)} className="hover:text-emerald-900 cursor-pointer ml-0.5">
                <X size={10} />
              </button>
            )}
          </span>
        ))}

        {attachedScripts.map(script => (
          <span key={script} className={SKILL_AOP_CHIP}>
            <Code size={10} /> 脚本: {script}
            {onRemoveScript && (
              <button type="button" onClick={() => onRemoveScript(script)} className="hover:text-neutral-900 cursor-pointer ml-0.5">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>

      {isOpen && (
        <div 
          className="absolute left-0 mt-1 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 p-2.5 text-xs space-y-2 max-h-64 overflow-y-auto"
        >
          <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
            <span className="font-bold text-[11px] text-neutral-800">选择可用资料</span>
            <button type="button" onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
              <X size={12} />
            </button>
          </div>

          {allKBs.length === 0 && allScripts.length === 0 ? (
            <div className="text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
              还没有选择知识库或系统接口。
              <br />
              <span className="font-bold text-[10px] text-amber-900 mt-1 block">
                请先在“技能定义”里选好知识库或系统接口。
              </span>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mb-1">
                  <BookOpen size={11} /> 已选知识库 ({allKBs.length})
                </div>
                {allKBs.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 p-1.5 italic bg-neutral-50 rounded">
                    （还没有选知识库）
                  </div>
                ) : (
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {allKBs.map(kb => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => {
                          onAttachKB(kb);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-emerald-50 text-[11px] text-neutral-700 truncate block transition cursor-pointer font-medium"
                        title={kb}
                      >
                        + {kb}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-neutral-100">
                <div className={cn('text-[10px] font-bold flex items-center gap-1 mb-1', SKILL_AOP_ACCENT_TEXT)}>
                  <Code size={11} /> 已选系统接口 ({allScripts.length})
                </div>
                {allScripts.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 p-1.5 italic bg-neutral-50 rounded">
                    （还没有选系统接口）
                  </div>
                ) : (
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {allScripts.map(sc => (
                      <button
                        key={sc.id || sc.name}
                        type="button"
                        onClick={() => {
                          onAttachScript(sc.name);
                          setIsOpen(false);
                        }}
                        className={cn('w-full text-left px-2 py-1 rounded text-[11px] text-neutral-700 truncate block transition cursor-pointer font-medium', SKILL_AOP_HOVER_TINT)}
                        title={sc.name}
                      >
                        + {sc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const GOAL_LANDING_TIPS = SKILL_CREATE_CASES;

/** 用户已输入目标后的 Tab 补写：扩写为更完整的技能描述 */
function expandSkillGoalDraft(raw: string): string {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return '';
  const alreadyRich =
    text.length >= 120 &&
    (/触发/.test(text) || /核验|步骤|边界|转人工/.test(text));
  if (alreadyRich) return text.slice(0, 1000);

  const opener = /^(帮我|请帮|我想|需要)/.test(text)
    ? text
    : `帮我做一个技能：${text}`;
  const suffix =
    '请写清适用场景与触发条件，说明需要核验的关键信息与处理步骤，并给出无法处理时的说明与转人工边界。不承诺规则外结果，结论需可核对。';
  const merged = `${opener}${/[。！？.!?]$/.test(opener) ? '' : '。'}${suffix}`;
  return merged.slice(0, 1000);
}

export const BuildSkillModal: React.FC<BuildSkillModalProps> = ({
  open,
  onClose,
  draftSkillId,
  initialMode,
  initialPrompt,
  initialSelectedKBs,
  onPublished,
  closeLabel,
}) => {
  const {
    createSkill: createSkillBase,
    updateSkill,
    skills,
    hiredAgents,
    showToast,
    setActiveTab,
  } = useApp();

  const createSkill = (
    name: string,
    description: string,
    type: 'subscribed' | 'mine' | 'market',
    kind?: string,
    hasScripts?: boolean,
    hasKBs?: boolean,
  ): Skill => {
    const kindNorm =
      kind === 'tool' || kind === 'kb' ? kind : kind === 'pure_doc' ? 'kb' : 'tool';
    return createSkillBase(name, description, type, {
      kind: kindNorm as Skill['kind'],
      hasScripts,
      hasKBs,
      status: 'published',
      source: 'nl',
    });
  };

  
  // Creation mode state (split 'interactive' and 'zip' modes)
  // Validation error field IDs for highlighting & scrolling
  const [validationErrorFields, setValidationErrorFields] = useState<Set<string>>(new Set());
  const [validationPromptBanner, setValidationPromptBanner] = useState<{ show: boolean; messages: string[] }>({ show: false, messages: [] });

  const [creationMode, setCreationMode] = useState<'interactive' | 'zip'>('interactive');
  const [rightCollapsed, setRightCollapsed] = useState(true);

  React.useEffect(() => {
    if (open) {
      setCreationMode(initialMode || 'interactive');
    }
  }, [open, initialMode]);
  
  // Step selected in right-panel view: 1 to 6
  const [activeStep, setActiveStep] = useState<number>(1);
  const formStepDirRef = useRef<-1 | 0 | 1>(0);
  const activeStepRef = useRef(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([5, 6]);

  // Step 1: Basic Information
  const [cnName, setCnName] = useState('');
  const [enId, setEnId] = useState('');
  const [businessProblem, setBusinessProblem] = useState('');
  const [skillKind, setSkillKind] = useState<'enterprise' | 'pure_doc'>('pure_doc');

  // Integrated resources states
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [selectedKBs, setSelectedKBs] = useState<string[]>(() =>
    Array.isArray(initialSelectedKBs) ? [...initialSelectedKBs] : [],
  );
  const [customScripts, setCustomScripts] = useState<Array<{id: string, name: string}>>([]);
  const [customKBs, setCustomKBs] = useState<string[]>([]);

  // Step 2: Triggering Scenarios
  const [triggerCond, setTriggerCond] = useState('');
  const [timing, setTiming] = useState('');
  const [forbiddenCond, setForbiddenCond] = useState('');

  // Step 3: Core Mission Target (Split into Input, Processing, Output)
  const [coreInputIn, setCoreInputIn] = useState('');
  const [coreInputProc, setCoreInputProc] = useState('');
  const [coreInputOut, setCoreInputOut] = useState('');
  

  // Additional Block D Guardrails fields
  const [contentRedLines, setContentRedLines] = useState('');
  const [expressionStyle, setExpressionStyle] = useState('');

  const parseCoreInput = (fullText: string) => {
    let input = '';
    let proc = '';
    let output = '';
    if (!fullText) return { input, proc, output };

    const inputMatch = fullText.match(/【输入】([\s\S]*?)(?=【处理】|【输出】|$)/);
    const procMatch = fullText.match(/【处理】([\s\S]*?)(?=【输入】|【输出】|$)/);
    const outputMatch = fullText.match(/【输出】([\s\S]*?)(?=【输入】|【处理】|$)/);

    if (inputMatch) input = inputMatch[1].trim();
    if (procMatch) proc = procMatch[1].trim();
    if (outputMatch) output = outputMatch[1].trim();

    if (!inputMatch && !procMatch && !outputMatch) {
      input = fullText.trim();
    }
    return { input, proc, output };
  };

  const coreInput = [
    coreInputIn ? `【输入】${coreInputIn}` : '',
    coreInputProc ? `【处理】${coreInputProc}` : '',
    coreInputOut ? `【输出】${coreInputOut}` : ''
  ].filter(Boolean).join('\n');

  const setCoreInput = (val: string) => {
    const { input, proc, output } = parseCoreInput(val);
    setCoreInputIn(input);
    setCoreInputProc(proc);
    setCoreInputOut(output);
  };

  // Step 4: Security Boundaries
  const [notResp, setNotResp] = useState('');
  const [notAllowed, setNotAllowed] = useState('');
  const [fallback, setFallback] = useState('');

  // Step 4: Business Type and Execution Logic
  const [businessType, setBusinessType] = useState<'flow' | 'knowledge' | 'judgment'>('flow');
  const [hasActionModule, setHasActionModule] = useState(true);
  const [hasKnowledgeModule, setHasKnowledgeModule] = useState(true);

  // Knowledge Type Fields
  const [knowledgeBoundary, setKnowledgeBoundary] = useState('');
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [knowledgeDesc, setKnowledgeDesc] = useState('');
  /** 技能主体：业务知识 / 执行步骤 二选一 */
  const [skillBodyMode, setSkillBodyMode] = useState<'knowledge' | 'steps'>('steps');
  const [knowledgeScripts, setKnowledgeScripts] = useState<string[]>([]);
  const [knowledgeKbs, setKnowledgeKbs] = useState<string[]>([]);
  const [answerTone, setAnswerTone] = useState('');

  // Judgment Type Fields
  const [decisionMatrix, setDecisionMatrix] = useState(''); // 必填
  const [edgeCases, setEdgeCases] = useState('');
  const [confidenceAndEscalation, setConfidenceAndEscalation] = useState('');
  const [showSectionKnowledge, setShowSectionKnowledge] = useState(false);

  // Step 5: Standard Execution Flow / Action Chains
  const [actionChainName, setActionChainName] = useState('');
  const [steps, setSteps] = useState<ExecutionStep[]>([
    {
      id: 1,
      name: '',
      description: '',
      example: '',
      associatedScripts: [],
      associatedKBs: [],
      associatedDocs: []
    }
  ]);

  // Uploaded Files State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);

  // Form interactive edit states
  const [isFormDirty, setIsFormDirty] = useState(false);
  /** 相对上次“保存草稿”是否有未落盘改动；干净时顶栏按钮置灰 */
  const [isDraftDirty, setIsDraftDirty] = useState(() => !draftSkillId);
  /** 本会话内已绑定的草稿 id（首次保存新建后不再重复建技能） */
  const [boundDraftSkillId, setBoundDraftSkillId] = useState<string | null>(draftSkillId ?? null);
  const allowDraftDirtyTrackRef = useRef(false);
  const [isUpdatingForm, setIsUpdatingForm] = useState(false); // Task 3: AI update state
  const [lastSyncedState, setLastSyncedState] = useState<any>(null);
  const [historyState, setHistoryState] = useState<any>(null);

  // Execution Flow
  interface ActionChain {
    id: number;
    name: string;
    steps: ExecutionStep[];
  }
  const [actionChains, setActionChains] = useState<ActionChain[]>([{ id: 1, name: '默认动作链', steps: [{ id: 1, name: '步骤1', description: '', example: '', associatedScripts: [], associatedKBs: [], associatedDocs: [] }] }]);
  const [collapsedChains, setCollapsedChains] = useState<number[]>([]);
  const [collapsedSteps, setCollapsedSteps] = useState<string[]>([]); // chainId-stepId format
  const [collapsedFormSections, setCollapsedFormSections] = useState<number[]>([2, 3, 4]);
  /** 第 1 段“可用资料”默认收起，避免知识库长列表占满一屏 */
  const [resourcesExpanded, setResourcesExpanded] = useState(false);

  // Clean up step attachments if resources are unmounted from Section 1
  React.useEffect(() => {
    const allScriptDefs = [
      { id: 'erp_script', name: 'ERP订单系统数据接口' },
      { id: 'claim_script', name: '理赔核算与自动代缴系统接口' },
      { id: 'crm_script', name: 'CRM客户资料与画像接口' },
      ...customScripts
    ];
    const mountedScriptNames = allScriptDefs.filter(s => selectedScripts.includes(s.id)).map(s => s.name);

    setActionChains(prev => prev.map(chain => ({
      ...chain,
      steps: chain.steps.map(step => {
        const validKBs = (step.associatedKBs || []).filter(kb => selectedKBs.includes(kb));
        const validScripts = (step.associatedScripts || []).filter(sc => selectedScripts.includes(sc) || mountedScriptNames.includes(sc));
        if ((step.associatedKBs || []).length !== validKBs.length || (step.associatedScripts || []).length !== validScripts.length) {
          return { ...step, associatedKBs: validKBs, associatedScripts: validScripts };
        }
        return step;
      })
    })));
  }, [selectedKBs, selectedScripts, customScripts]);

  const openFormSection = (sectionId: number) => {
    activeStepRef.current = sectionId;
    setActiveStep(sectionId);
    setCollapsedFormSections([1, 2, 3, 4].filter((id) => id !== sectionId));
    // 切页后重置目标页滚动，避免停在中间造成“定位偏离”
    requestAnimationFrame(() => {
      const section = document.getElementById(`form-section-${sectionId}`);
      const scroller = section?.querySelector('.overflow-y-auto') as HTMLElement | null;
      if (scroller) scroller.scrollTop = 0;
    });
  };

  /** AI 写入：只记完成态，不切卡/不滚动，避免打断用户当前操作 */
  const markFormSectionWritten = (sectionId: number) => {
    setCompletedSteps((steps) => [...new Set([...steps, sectionId])]);
  };

  const goToFormSection = (sectionId: number) => {
    if (sectionId < 1 || sectionId > 4) return;
    // 用户手动切卡：AI 继续在后台写，不再抢焦点
    confirmTypewriterRef.current.followUi = false;
    formStepDirRef.current = sectionId > activeStep ? 1 : sectionId < activeStep ? -1 : 0;
    openFormSection(sectionId);
  };

  const stepFormSection = (delta: -1 | 1) => {
    goToFormSection(Math.min(4, Math.max(1, activeStep + delta)));
  };

  const FormCarouselPanel = ({ sectionId, children }: { sectionId: number; children: React.ReactNode }) => (
    <motion.div
      className="w-1/4 h-full shrink-0 flex flex-col min-h-0"
      animate={{
        opacity: activeStep === sectionId ? 1 : 0.42,
      }}
      transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );

  const formSectionSummary = (sectionId: number): string => {
    if (sectionId === 1) {
      return cnName.trim() || businessProblem.trim() || '未填写名称';
    }
    if (sectionId === 2) {
      const stepCount = actionChains.reduce(
        (n, c) => n + c.steps.filter((s) => s.name.trim()).length,
        0,
      );
      if (skillBodyMode === 'knowledge') {
        if (knowledgeContent.trim()) return '已填知识';
        return '未完善';
      }
      if (stepCount > 0) return `${stepCount} 个步骤`;
      return '未完善';
    }
    if (sectionId === 3) {
      return notAllowed.trim() || contentRedLines.trim() ? '已填规范' : '未完善';
    }
    if (sectionId === 4) {
      return usageExamples.trim() || customNotes.trim() ? '已填补充' : '未完善';
    }
    return '';
  };

  const FORM_SECTION_NAV = [
    { id: 1, title: FORM_SECTION_TITLES[1], required: true },
    { id: 2, title: FORM_SECTION_TITLES[2], required: true },
    { id: 3, title: FORM_SECTION_TITLES[3], required: false },
    { id: 4, title: FORM_SECTION_TITLES[4], required: false },
  ] as const;

  const formSectionStatus = (sectionId: number): 'empty' | 'partial' | 'done' => {
    if (sectionId === 1) {
      const keys = [cnName, enId, businessProblem, triggerCond, coreInputIn, coreInputOut];
      const filled = keys.filter((v) => v.trim()).length;
      if (filled >= 4) return 'done';
      if (filled > 0) return 'partial';
      return 'empty';
    }
    if (sectionId === 2) {
      const stepCount = actionChains.reduce(
        (n, c) => n + c.steps.filter((s) => s.name.trim()).length,
        0,
      );
      if (skillBodyMode === 'knowledge') {
        return knowledgeContent.trim() || knowledgeDesc.trim() ? 'done' : 'empty';
      }
      if (stepCount > 0) return 'done';
      return 'empty';
    }
    if (sectionId === 3) {
      const filled = [notAllowed, contentRedLines, fallback].filter((v) => v.trim()).length;
      if (filled >= 2) return 'done';
      if (filled > 0) return 'partial';
      return 'empty';
    }
    const filled = [usageExamples, customNotes].filter((v) => v.trim()).length;
    if (filled >= 1) return 'done';
    return 'empty';
  };

  const formSectionPanelHeader = (sectionId: number, title: string, required: boolean) => (
    <div className="flex items-center gap-2 px-3 h-9 shrink-0">
      <span
        className={cn(
          'w-5 h-5 rounded text-[10px] font-semibold flex items-center justify-center shrink-0 text-white',
          required ? 'bg-neutral-800' : 'bg-neutral-400',
          formSectionStatus(sectionId) === 'done' && 'bg-neutral-800',
        )}
      >
        {sectionId}
      </span>
      <h3 className="text-xs font-semibold text-neutral-900 shrink-0">{title}</h3>
      <span className="text-[11px] text-neutral-400 truncate min-w-0">{formSectionSummary(sectionId)}</span>
    </div>
  );

  const sidebarTabClass = (active: boolean) =>
    cn(
      'h-8 min-w-[120px] px-2 rounded-lg inline-flex items-center justify-center gap-1.5 text-sm font-medium transition cursor-pointer',
      active ? 'bg-[#ECECF2] text-[#181D27]' : 'text-[#717680] hover:text-[#181D27]',
    );

  const sidebarWorkspaceToggleClass =
    'w-8 h-8 rounded-lg inline-flex items-center justify-center border border-transparent text-[#717680] hover:text-[#181D27] hover:bg-white hover:border-[#E9EAEB] transition cursor-pointer shrink-0';

  const renderSidebarWorkspaceToggle = (mode: 'collapse' | 'expand') => (
    <button
      type="button"
      onClick={() => setRightCollapsed(mode === 'collapse')}
      className={sidebarWorkspaceToggleClass}
      title={mode === 'collapse' ? '收起工作区' : '展开工作区'}
      aria-label={mode === 'collapse' ? '收起工作区' : '展开工作区'}
    >
      {mode === 'collapse' ? (
        <PanelLeftClose size={16} className="rotate-180" />
      ) : (
        <PanelLeftOpen size={16} className="rotate-180" />
      )}
    </button>
  );

  const toggleChainCollapse = (chainId: number) => {
    setCollapsedChains(prev => 
      prev.includes(chainId) ? prev.filter(id => id !== chainId) : [...prev, chainId]
    );
  };

  const toggleStepCollapse = (chainId: number, stepId: number) => {
    const key = `${chainId}-${stepId}`;
    setCollapsedSteps(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Script missing variable fix indicators
  const [resolvedClaimScript, setResolvedClaimScript] = useState(false);
  const [resolvedCrmScript, setResolvedCrmScript] = useState(false);

  // New inline input states for adding custom scripts and KBs
  const [showAddScriptInput, setShowAddScriptInput] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [showAddKbInput, setShowAddKbInput] = useState(false);
  const [newKbName, setNewKbName] = useState('');

  // Step 6: Format Definition Payload
  const [inputPayload, setInputPayload] = useState('');
  const [outputPayload, setOutputPayload] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [outputConstraints, setOutputConstraints] = useState('');
  const [selectedOutputTemplates, setSelectedOutputTemplates] = useState<string[]>([]);
  const [usageExamples, setUsageExamples] = useState('');


  // Editing Markdown state
  const [editingMarkdown, setEditingMarkdown] = useState<string | null>(null);
  const [skillArtifactOpen, setSkillArtifactOpen] = useState(false);
  const [skillArtifactDraft, setSkillArtifactDraft] = useState('');

  // Split layout: left chat vs right config (fixed ratio, no drag resize)
  const [leftWidth] = useState(36);

  // Generate schema.json content for Codex IDE
  const generateSchemaJson = () => {
    return JSON.stringify({
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": enId ? `${enId.trim()}_schema` : "skill_schema",
      "cnName": cnName || "未命名技能",
      "type": "object",
      "properties": {
        "orderId": { "type": "string", "description": "业务单号" },
        "userRole": { "type": "string", "enum": ["VIP0", "VIP1", "VIP2", "VIP3"] },
        "triggerReason": { "type": "string", "description": triggerCond || "触发理由" }
      },
      "required": ["orderId"]
    }, null, 2);
  };

  // Generate TypeScript handler code for Codex IDE
  const generateHandlerTs = () => {
    return `import { SkillContext, SkillResult } from '@jdl/agent-sdk';

/**
 * ${cnName || '智能技能'} - 核心逻辑处理器 (Codex Engine)
 * EnID: ${enId || 'auto_skill'}
 */
export async function handleSkillExecution(ctx: SkillContext): Promise<SkillResult> {
  const { orderId, userRole } = ctx.params;
  
  // 1. 触发前置对齐校验
  if (!orderId) {
    return ctx.fail('缺少必要参数: orderId');
  }

  // 2. 核心规则拦截 (Safety Redline)
  // ${notAllowed || '未校验凭证阻断发货'}
  
  return ctx.success({
    status: 'EXECUTED',
    message: '${fallback || '技能顺利执行成功'}'
  });
}`;
  };

  // Generate metadata.yaml content for Codex IDE
  const generateMetadataYaml = () => {
    return `id: ${enId || 'skill_pkg'}
cn_name: "${cnName || '未命名技能'}"
version: "1.0.0"
runtime: "nodejs20"
entrypoint: "scripts/handler.ts"
timeout_ms: 3000
security_audit: "PASS"
created_at: "${new Date().toISOString().split('T')[0]}"`;
  };

  // Center Column Tab: 'form' (业务视图) | 'editor' (专家视图 · 文件夹)
  const [centerTab, setCenterTab] = useState<'form' | 'editor'>('form');
  const centerTabRef = useRef<'form' | 'editor'>('form');
  centerTabRef.current = centerTab;

  // 技能测试：保存草稿左侧按钮触发的右上角浮层
  const [skillTestOpen, setSkillTestOpen] = useState(false);
  const [skillTestPinned, setSkillTestPinned] = useState(false);
  const skillTestHoverRef = useRef(false);
  const skillTestCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSkillTestCloseTimer = () => {
    if (skillTestCloseTimerRef.current) {
      clearTimeout(skillTestCloseTimerRef.current);
      skillTestCloseTimerRef.current = null;
    }
  };

  const openSkillTestPanel = () => {
    clearSkillTestCloseTimer();
    skillTestHoverRef.current = true;
    setSkillTestOpen(true);
  };

  const scheduleCloseSkillTestPanel = () => {
    skillTestHoverRef.current = false;
    clearSkillTestCloseTimer();
    skillTestCloseTimerRef.current = setTimeout(() => {
      if (!skillTestPinned && !skillTestHoverRef.current) {
        setSkillTestOpen(false);
      }
    }, 180);
  };

  const toggleSkillTestPanel = () => {
    clearSkillTestCloseTimer();
    if (skillTestPinned) {
      setSkillTestPinned(false);
      setSkillTestOpen(false);
    } else {
      setSkillTestPinned(true);
      setSkillTestOpen(true);
      if (rightCollapsed) setRightCollapsed(false);
    }
  };

  // R1 Test Workflow States
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSource, setTestSource] = useState<'ai' | 'manual' | 'upload'>('ai');
  const [testModalStage, setTestModalStage] = useState<'config' | 'preview'>('config');
  const [dirtyFields, setDirtyFields] = useState<string[]>([]); // 标记被采纳建议影响、需要高亮的字段
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]); // 记录已被采纳的建议 id
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<string[]>([]); // 记录已忽略的建议 id
  const [testRunCount, setTestRunCount] = useState(0);
  const [manualRows, setManualRows] = useState<
    Array<{ id: string; input: string; oracle: string; extra: Record<string, string> }>
  >(() =>
    [1, 2, 3].map((n) => ({
      id: `manual-row-${n}`,
      input: '',
      oracle: '',
      extra: {},
    })),
  );
  const [manualExtraCols, setManualExtraCols] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [aiCount, setAiCount] = useState<number>(5);

  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [editOracle, setEditOracle] = useState('');

  // Initial Test Case Dataset
  const [testCases, setTestCases] = useState<Array<{
    id: string;
    source: 'ai' | 'manual' | 'upload';
    input: string;
    oracle: string;
    status: 'passed' | 'failed' | 'ready';
    failureReason?: string;
  }>>([
    { id: 'case-1', source: 'ai', input: '客户问：“订单 8821903 超过7天能办理退换货并退差价吗？”', oracle: '判定为 VIP2 超期特批通道，允许退货并补退保价差额', status: 'ready' },
    { id: 'case-2', source: 'ai', input: '客户问：“商品未开具发票，可以先申请退差额吗？”', oracle: '未开票阻断红线触发，提示补充发票后方可退差额', status: 'ready' },
    { id: 'case-3', source: 'ai', input: '客户问：“买的生鲜水果已经放了10天，可以退款吗？”', oracle: '生鲜易腐红线拦截，阻断退款申请', status: 'ready' },
    { id: 'case-4', source: 'upload', input: '客户问：“申请换货时运费谁承担？”', oracle: '质量问题商家承担，个人原因买家承担', status: 'ready' },
    { id: 'case-5', source: 'manual', input: '客户问：“7天内降价可以申请补差价吗？”', oracle: '符合保价政策，直接自动发放差额优惠券', status: 'ready' },
    { id: 'case-6', source: 'ai', input: '客户问：“签收 18 天的普通图书，要求退货”', oracle: '超期无特批，提示超过 15 天特批上限不予退货', status: 'ready' },
  ]);

  // AI 优化建议卡片
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    id: string;
    field: 'triggerCond' | 'notAllowed' | 'coreInputOut';
    fieldLabel: string;
    reason: string;
    oldValue: string;
    newValue: string;
    diffRemoved: string;
    diffAdded: string;
  }>>([
    {
      id: 'sug-1',
      field: 'triggerCond',
      fieldLabel: '什么时候该用',
      reason: '触发条件过宽：对签收超过 15 天的普通订单误匹配特批逻辑',
      oldValue: triggerCond || '所有退换货及补保价退差额场景',
      newValue: '支持 7 天内无理由退换货；VIP2 以上客户超期 15 天以内支持保价特批通道',
      diffRemoved: '- 触发规则: 所有退换货及补退差额场景',
      diffAdded: '+ 触发规则: 7天内无理由退换货；VIP2以上客户签收15天内支持保价特批',
    },
    {
      id: 'sug-2',
      field: 'notAllowed',
      fieldLabel: '禁止行为',
      reason: '缺失未开具发票场景与保价退款拦阻红线',
      oldValue: notAllowed || '禁止违规承诺全额退款',
      newValue: '未完成发票校验或异常冻结账号禁止直接发放差额补偿与现金退款；禁止承诺超期生鲜退款',
      diffRemoved: '- 限制红线: 禁止违规承诺全额退款',
      diffAdded: '+ 限制红线: 未完成发票校验或异常冻结账号禁止直接发放差额补偿与现金退款；禁止承诺超期生鲜退款',
    }
  ]);

  // 执行测试闭环（从弹窗确认并运行，或者直接一键重跑/运行选中）
  const handleExecuteR1TestBatch = (targetIds?: string[]) => {
    setShowTestModal(false); // 关闭弹窗
    setTestModalStage('config'); // 重置弹窗阶段
    setTestRunCount(prev => prev + 1);

    const runTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 1. 发送系统的“测试运行中”进度卡片
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'system_test_progress',
        name: '系统自动化测试引擎',
        content: `RUNNING`,
        timestamp: runTimestamp
      }
    ]);

    // 2. 模拟 1.6s 后完成，更新为“测试完成卡片”并追加 AI 优化建议
    setTimeout(() => {
      // 更新用例结果状态
      setTestCases(prev => prev.map((c) => {
        if (!targetIds || targetIds.includes(c.id)) {
          if (c.id === testCases[1]?.id) {
            return { ...c, status: 'failed', failureReason: '未拦阻未发票校验场景' };
          }
          return { ...c, status: 'passed' };
        }
        return c;
      }));

      // 替换刚才的运行中消息为正式测试报告
      setChatMessages(prev => {
        const filtered = prev.filter(m => m.sender !== 'system_test_progress');
        const count = targetIds && targetIds.length > 0 ? targetIds.length : testCases.length;
        return [
          ...filtered,
          {
            sender: 'system_test_report',
            name: '技能测试引擎',
            content: JSON.stringify({
              passRate: 82,
              total: count,
              passed: Math.max(1, count - 1),
              failed: count > 1 ? 1 : 0,
              source: testSource
            }),
            timestamp: runTimestamp
          },
          {
            sender: 'ai_test_suggestions',
            name: '技能大师 AI 助手',
            content: '通过率 82%。针对失败用例整理了下面两条改写建议，采纳后会写回右侧表单。',
            timestamp: runTimestamp
          }
        ];
      });

      showToast('测试已运行完毕！请在左侧查看结果与优化建议');
    }, 1600);
  };

  // 采纳建议
  const handleApplySuggestion = (sugId: string) => {
    if (appliedSuggestions.includes(sugId)) return;

    const sug = aiSuggestions.find(s => s.id === sugId);
    if (!sug) return;

    // 写回中栏字段
    if (sug.field === 'triggerCond') {
      setTriggerCond(sug.newValue);
    } else if (sug.field === 'notAllowed') {
      setNotAllowed(sug.newValue);
    } else if (sug.field === 'coreInputOut') {
      setCoreInputOut(sug.newValue);
    }

    // 将字段添加至 dirtyFields (中栏高亮)
    setDirtyFields(prev => Array.from(new Set([...prev, sug.field])));
    setAppliedSuggestions(prev => [...prev, sugId]);
    setIsFormDirty(true);
    setEditingMarkdown(null);

    showToast(`已采纳建议！已写回【${sug.fieldLabel}】并同步${centerTabRef.current === 'editor' ? '专家视图' : '业务视图'}`);
  };

  // 忽略建议
  const handleIgnoreSuggestion = (sugId: string) => {
    setIgnoredSuggestions(prev => [...prev, sugId]);
    showToast('已忽略该建议');
  };

  // Dialogue Step / state management
  // 0–1: 描述能力；2: 等主体；3: 等规范；4: 等补充；5: 四轮完成待确认；11: 已确认可按需改
  const [chatStep, setChatStep] = useState<number>(0);
  const [showGuide, setShowGuide] = useState(true);
  /** false：先写技能目标；true：已拆进表单，左侧助手做 AOP 优化。从编辑 / 智能创作带 prompt 进入直接多轮，跳过落地页 */
  const enteredWithPrompt = Boolean(initialPrompt?.trim()) && !draftSkillId;
  const [skillGoalReady, setSkillGoalReady] = useState(
    () => Boolean(draftSkillId || enteredWithPrompt),
  );
  /** 智能创作带入的首轮：UI 已是对话态，但仍走落地页首发（澄清卡）逻辑 */
  const seedFirstTurnRef = useRef(enteredWithPrompt);
  /** 落地页：索引知识库 / 脚本 泡泡 */
  const [goalResourceOpen, setGoalResourceOpen] = useState(false);
  const [goalResourceTab, setGoalResourceTab] = useState<'kb' | 'script'>('kb');
  const [goalResourceQuery, setGoalResourceQuery] = useState('');
  const goalResourcePanelRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!goalResourceOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const el = goalResourcePanelRef.current;
      if (el && !el.contains(e.target as Node)) {
        setGoalResourceOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGoalResourceOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [goalResourceOpen]);

  const [chatMessages, setChatMessages] = useState<Array<{sender: string, name: string, content: string, timestamp: string, isRevoked?: boolean}>>([]);
  const [chatInput, setChatInput] = useState('');
  /** 底部快捷芯片：已点选回填后从建议条移除（无选中态） */
  const [composerConsumedChipIds, setComposerConsumedChipIds] = useState<string[]>([]);
  /** 确认卡“重新设置要求”：回填输入框供二次编辑 */
  const [composerResetMode, setComposerResetMode] = useState(false);
  const [goalGhostTipIndex, setGoalGhostTipIndex] = useState(0);
  const [showGoalRewriteTab, setShowGoalRewriteTab] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  /** 深度思考 Cot */
  const [thinkCotSteps, setThinkCotSteps] = useState<SkillThinkStep[]>([]);
  const [thinkCotGenerating, setThinkCotGenerating] = useState(false);
  const [thinkBootLoading, setThinkBootLoading] = useState(false);
  /** 任务规划（与 Cot 分离） */
  const [taskPlanSteps, setTaskPlanSteps] = useState<SkillThinkStep[]>([]);
  const [taskPlanGenerating, setTaskPlanGenerating] = useState(false);
  const thinkStepTimersRef = React.useRef<number[]>([]);
  const thinkBootTimerRef = React.useRef<number | null>(null);
  const thinkCotStepsRef = React.useRef<SkillThinkStep[]>(thinkCotSteps);
  const taskPlanStepsRef = React.useRef<SkillThinkStep[]>(taskPlanSteps);
  const thinkStartedAtRef = React.useRef<number | null>(null);
  thinkCotStepsRef.current = thinkCotSteps;
  taskPlanStepsRef.current = taskPlanSteps;
  /** 用户是否已在确认坞确认过草案（用于阶段条与下一步引导）。编辑已有技能时视为已确认 */
  const [draftConfirmed, setDraftConfirmed] = useState(() => Boolean(draftSkillId));
  /** 确认卡要点：在下方输入框编辑中（可多选叠加） */
  const [confirmEditTarget, setConfirmEditTarget] = useState<{
    msgIndex: number;
    items: Array<{
      itemId: string;
      itemIndex: number;
      hint: string;
      fieldKey?: SkillConfirmFieldKey;
      value: string;
    }>;
  } | null>(null);
  /** 用户消息：在气泡内联编辑 */
  const [editingUserMsgIndex, setEditingUserMsgIndex] = useState<number | null>(null);
  const [editingUserMsgDraft, setEditingUserMsgDraft] = useState('');
  const confirmTypewriterRef = useRef({
    cancelled: false,
    /** 写入时是否自动切卡/滚动；确认写入默认 false，避免抢走用户操作 */
    followUi: false,
    /** 用户已上手改过的字段，AI 打字机跳过 */
    userOwnedFields: new Set<SkillConfirmFieldKey>(),
  });
  const formSnapshotRef = useRef({
    cnName: '',
    businessProblem: '',
    triggerCond: '',
    forbiddenCond: '',
    coreInputIn: '',
    coreInputOut: '',
    notAllowed: '',
    contentRedLines: '',
    fallback: '',
    usageExamples: '',
    customNotes: '',
    actionChainNames: '' as string,
  });
  formSnapshotRef.current = {
    cnName,
    businessProblem,
    triggerCond,
    forbiddenCond,
    coreInputIn,
    coreInputOut,
    notAllowed,
    contentRedLines,
    fallback,
    usageExamples,
    customNotes,
    actionChainNames: (actionChains[0]?.steps || [])
      .map((step) => step.name)
      .filter(Boolean)
      .join(' → '),
  };
  const pendingResetRequirementsRef = useRef(false);
  const chatComposerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const userBubbleEditRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingGoalRef = useRef<string | null>(null);
  const seedPromptConsumedRef = useRef(false);
  const handleSendChatMessageRef = useRef<(forced?: string) => void>(() => {});
  const pendingGoalDraftSideRef = useRef<{
    enId: string;
    generatedSteps: ExecutionStep[];
    knowledgeContent: string;
    knowledgeDesc: string;
    answerTone: string;
    outputConstraints: string;
  } | null>(null);

  const hasPendingClarify = useMemo(() => {
    return chatMessages.some((msg) => {
      if (msg.sender !== 'skill_clarify') return false;
      try {
        const payload = JSON.parse(msg.content) as SkillClarifyPayload;
        return !payload.submitted && !payload.skipped;
      } catch {
        return false;
      }
    });
  }, [chatMessages]);

  const actionChainSummary = useMemo(
    () => steps.map((s) => s.name).filter(Boolean).join(' → '),
    [steps],
  );

  const composerReplyPe = useMemo(
    () =>
      buildDynamicSkillReplyPe({
        latestAiTexts: pickLatestAiTextsForReplyPe(chatMessages, 3),
        lastUserText: pickLatestUserText(chatMessages),
        skillTitle: cnName,
        awaitingConfirm: hasAwaitingSkillConfirm(chatMessages),
        draftConfirmed,
        form: {
          cnName,
          businessProblem,
          triggerCond,
          forbiddenCond,
          notAllowed,
          usageExamples,
          actionChainSummary,
        },
      }),
    [
      chatMessages,
      cnName,
      businessProblem,
      triggerCond,
      forbiddenCond,
      notAllowed,
      usageExamples,
      actionChainSummary,
      draftConfirmed,
    ],
  );

  const visibleComposerReplyPe = useMemo(
    () => composerReplyPe.filter((chip) => !composerConsumedChipIds.includes(chip.id)),
    [composerReplyPe, composerConsumedChipIds],
  );

  useEffect(() => {
    setComposerConsumedChipIds((prev) =>
      prev.filter((id) => composerReplyPe.some((chip) => chip.id === id)),
    );
  }, [composerReplyPe]);

  const applyComposerReplyChip = useCallback((chip: SkillReplyPeChip) => {
    setChatInput((prev) => appendComposerChipBlock(prev, chip));
    setComposerConsumedChipIds((prev) => (prev.includes(chip.id) ? prev : [...prev, chip.id]));
    setComposerResetMode(false);
    setConfirmEditTarget(null);
    requestAnimationFrame(() => {
      const el = chatComposerTextareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, []);

  const goalGhostTip = GOAL_LANDING_TIPS[goalGhostTipIndex % GOAL_LANDING_TIPS.length];

  const applyGoalLandingTip = useCallback((pe: string, nextGhostIndex?: number) => {
    setChatInput(pe.slice(0, 1000));
    if (nextGhostIndex !== undefined) setGoalGhostTipIndex(nextGhostIndex);
    requestAnimationFrame(() => {
      const el = chatComposerTextareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, []);

  const acceptGoalGhostTip = useCallback(() => {
    applyGoalLandingTip(
      goalGhostTip.pe,
      (goalGhostTipIndex + 1) % GOAL_LANDING_TIPS.length,
    );
  }, [applyGoalLandingTip, goalGhostTip.pe, goalGhostTipIndex]);

  const acceptGoalRewrite = useCallback(() => {
    const next = expandSkillGoalDraft(chatInput);
    if (!next || next === chatInput.trim()) {
      setShowGoalRewriteTab(false);
      return;
    }
    setChatInput(next);
    setShowGoalRewriteTab(false);
    requestAnimationFrame(() => {
      const el = chatComposerTextareaRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, [chatInput]);

  useEffect(() => {
    const el = chatComposerTextareaRef.current;
    if (!el || !skillGoalReady) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, 44), 160);
    el.style.height = `${next}px`;
  }, [
    chatInput,
    skillGoalReady,
    composerConsumedChipIds.length,
    confirmEditTarget,
    composerResetMode,
  ]);

  useEffect(() => {
    if (skillGoalReady || isAiThinking || !chatInput.trim()) {
      setShowGoalRewriteTab(false);
      return;
    }
    setShowGoalRewriteTab(false);
    const timer = setTimeout(() => {
      const next = expandSkillGoalDraft(chatInput);
      if (next && next !== chatInput.trim()) setShowGoalRewriteTab(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [chatInput, isAiThinking, skillGoalReady]);

  const formScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (rightCollapsed || centerTab === 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFormSection(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFormSection(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rightCollapsed, centerTab, activeStep]);

  /**
   * 四卡轮播手势分工（避免「页内滚」和「切卡」抢同一纵向轴）：
   * - 纵向滚轮 / 上下滑：只滚当前卡内容，绝不切卡
   * - 横向滚轮 / 左右滑：切上一/下一卡
   * - Tab 点选、左右按钮、←→ 键：显式切卡
   */
  React.useEffect(() => {
    if (rightCollapsed || centerTab === 'editor') return;
    const root = formScrollRef.current;
    if (!root) return;

    const SWITCH_THRESHOLD = 72;
    const COOLDOWN_MS = 420;
    const GESTURE_GAP_MS = 280;
    const TOUCH_SWIPE_PX = 56;
    /** |dx| 需明显大于 |dy|，才认定是横向切卡意图 */
    const AXIS_RATIO = 1.35;

    let cooldownUntil = 0;
    let wheelAccX = 0;
    let lastWheelAt = 0;
    let touchStartX: number | null = null;
    let touchStartY: number | null = null;

    const normalizeDelta = (value: number, mode: number) => {
      if (mode === 1) return value * 16;
      if (mode === 2) return value * Math.max(320, root.clientWidth);
      return value;
    };

    const switchByDelta = (delta: -1 | 1) => {
      const now = Date.now();
      if (now < cooldownUntil) return false;
      const current = activeStepRef.current;
      const next = Math.min(4, Math.max(1, current + delta));
      if (next === current) return false;
      cooldownUntil = now + COOLDOWN_MS;
      wheelAccX = 0;
      formStepDirRef.current = delta;
      openFormSection(next);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (!root.contains(e.target as Node)) return;
      const targetEl = e.target as HTMLElement | null;
      const tag = targetEl?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || targetEl?.isContentEditable) return;

      const dx = normalizeDelta(e.deltaX, e.deltaMode);
      const dy = normalizeDelta(e.deltaY, e.deltaMode);
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // 纵向占优：交给页内滚动，完全不拦截
      if (absY >= absX * AXIS_RATIO || absX < 2) {
        wheelAccX = 0;
        return;
      }

      // 横向占优：累计后切卡
      const now = Date.now();
      if (now < cooldownUntil) {
        e.preventDefault();
        return;
      }
      if (now - lastWheelAt > GESTURE_GAP_MS) wheelAccX = 0;
      lastWheelAt = now;

      wheelAccX += dx;
      if (wheelAccX > SWITCH_THRESHOLD) {
        if (switchByDelta(1)) e.preventDefault();
      } else if (wheelAccX < -SWITCH_THRESHOLD) {
        if (switchByDelta(-1)) e.preventDefault();
      } else {
        e.preventDefault();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!root.contains(e.target as Node)) return;
      touchStartX = e.touches[0]?.clientX ?? null;
      touchStartY = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const startX = touchStartX;
      const startY = touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (startX == null || startY == null) return;
      if (Date.now() < cooldownUntil) return;

      const endX = e.changedTouches[0]?.clientX;
      const endY = e.changedTouches[0]?.clientY;
      if (endX == null || endY == null) return;

      const dx = endX - startX;
      const dy = endY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      // 只有明确左右滑才切卡；上下滑留给页内滚动
      if (absX < TOUCH_SWIPE_PX || absX < absY * AXIS_RATIO) return;

      if (dx < 0) switchByDelta(1);
      else switchByDelta(-1);
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchend', onTouchEnd);
    };
  }, [rightCollapsed, centerTab, open]);

  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const thinkingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const bubbleTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  const clearThinkStepTimers = () => {
    thinkStepTimersRef.current.forEach((t) => clearTimeout(t));
    thinkStepTimersRef.current = [];
  };

  const clearThinkBootTimer = () => {
    if (thinkBootTimerRef.current != null) {
      clearTimeout(thinkBootTimerRef.current);
      thinkBootTimerRef.current = null;
    }
  };

  const archiveThinkPlanToChat = () => {
    const stamp = new Date().toTimeString().substring(0, 5);
    const startedAt = thinkStartedAtRef.current;
    const durationSec =
      startedAt != null ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const cotSteps = thinkCotStepsRef.current;
    const planSteps = taskPlanStepsRef.current;
    const extras: Array<{ sender: string; name: string; content: string; timestamp: string }> = [];
    if (cotSteps.length > 0) {
      extras.push({
        sender: 'skill_think',
        name: SKILL_CREATE_CHAT.thinkDone,
        content: JSON.stringify({
          title: SKILL_CREATE_CHAT.thinkDone,
          steps: cotSteps.map((s) => ({ ...s, status: 'done' as const })),
          durationSec: planSteps.length > 0 ? Math.max(1, Math.round(durationSec * 0.4)) : durationSec,
        }),
        timestamp: stamp,
      });
    }
    if (planSteps.length > 0) {
      extras.push({
        sender: 'skill_plan',
        name: SKILL_CREATE_CHAT.planDone,
        content: JSON.stringify({
          title: SKILL_CREATE_CHAT.planDone,
          steps: planSteps.map((s) => ({ ...s, status: 'done' as const })),
          durationSec,
        }),
        timestamp: stamp,
      });
    }
    if (extras.length > 0) {
      setChatMessages((prev) => [...prev, ...extras]);
    }
    thinkStartedAtRef.current = null;
  };

  const playTaskPlan = (steps: SkillThinkStep[], totalMs: number, onDone: () => void) => {
    clearThinkStepTimers();
    setTaskPlanGenerating(true);
    setTaskPlanSteps(steps.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'pending' })));
    const n = Math.max(steps.length, 1);
    const slice = Math.max(1200, Math.floor(totalMs / n));
    steps.forEach((_, i) => {
      const timer = window.setTimeout(() => {
        setTaskPlanSteps((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx <= i ? 'done' : idx === i + 1 ? 'running' : 'pending',
          })),
        );
        if (i === n - 1) {
          setTaskPlanGenerating(false);
          const settle = window.setTimeout(() => onDone(), 600);
          thinkStepTimersRef.current.push(settle);
        }
      }, slice * (i + 1));
      thinkStepTimersRef.current.push(timer);
    });
  };

  const playDeepThinkThenPlan = (
    cotSteps: SkillThinkStep[],
    planSteps: SkillThinkStep[],
    totalMs: number,
    onDone: () => void,
  ) => {
    clearThinkStepTimers();
    setThinkBootLoading(false);
    setThinkCotGenerating(true);
    // 一次性给出全文，由 SkillThinkingCard 流式吐字
    setThinkCotSteps(cotSteps.map((s) => ({ ...s, status: 'done' as const })));
    const streamMs = estimateThinkStreamMs(cotSteps);
    const planMs = Math.max(3600, Math.floor(totalMs * 0.45), planSteps.length * 1200);
    // 流式结束后稍作停顿，再进入任务规划
    const timer = window.setTimeout(() => {
      setThinkCotGenerating(false);
      const bridge = window.setTimeout(() => {
        playTaskPlan(planSteps, planMs, onDone);
      }, 520);
      thinkStepTimersRef.current.push(bridge);
    }, streamMs);
    thinkStepTimersRef.current.push(timer);
  };

  const startThinkThen = (
    plan: { title: string; steps: SkillThinkStep[]; totalMs: number; planSteps?: SkillThinkStep[] },
    onDone: () => void,
    _opts?: { seedText?: string },
  ) => {
    clearThinkStepTimers();
    clearThinkBootTimer();
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setThinkCotSteps(plan.steps.map((s) => ({ ...s, status: 'pending' as const })));
    setThinkCotGenerating(false);
    setTaskPlanSteps([]);
    setTaskPlanGenerating(false);
    setThinkBootLoading(true);
    setIsAiThinking(true);
    thinkStartedAtRef.current = Date.now();
    const taskSteps =
      plan.planSteps && plan.planSteps.length > 0
        ? plan.planSteps
        : plan.steps.map((s) => ({ ...s, detail: s.detail }));
    /** Cot：先加载态 → 深度思考 → 任务规划 */
    thinkBootTimerRef.current = window.setTimeout(() => {
      thinkBootTimerRef.current = null;
      playDeepThinkThenPlan(plan.steps, taskSteps, plan.totalMs, onDone);
    }, 1400);
  };

  const buildRoundThinkPlan = (userText: string) => {
    const snippet = userText.trim().replace(/\s+/g, ' ').slice(0, 64) || '用户本轮补充';
    return {
      title: SKILL_CREATE_CHAT.thinkInProgress,
      totalMs: 7200 + Math.floor(Math.random() * 1800),
      steps: [
        {
          id: 'intent',
          label: '先总结本轮想改什么',
          detail: `${snippet}。核心是在已有技能上做定向调整，而不是从零重写。`,
          status: 'pending' as const,
        },
        {
          id: 'gap',
          label: '再看写入四张表单前还缺什么',
          detail:
            '优先看定义与规范里的触发边界是否要收紧；主体与补充信息若无新约束，本轮可先不动。',
          status: 'pending' as const,
        },
        {
          id: 'reply',
          label: '思路收束',
          detail:
            '先给用户一句确认理解，再进入任务规划，把改写步骤拆成可执行、可回看的清单。',
          status: 'pending' as const,
        },
      ],
      planSteps: [
        {
          id: 'p1',
          label: '核对可改写字段',
          detail: '锁定本轮要动的表单区块',
          status: 'pending' as const,
        },
        {
          id: 'p2',
          label: '生成确认要点',
          detail: '准备可勾选的写入建议',
          status: 'pending' as const,
        },
        {
          id: 'p3',
          label: '输出回复草案',
          detail: '完成对话回传与右侧同步',
          status: 'pending' as const,
        },
      ],
    };
  };

  const buildClarifyThinkPlan = (userText: string) => {
    const snippet = userText.trim().replace(/\s+/g, ' ').slice(0, 64) || '技能目标描述';
    return {
      title: SKILL_CREATE_CHAT.thinkInProgress,
      totalMs: 7000 + Math.floor(Math.random() * 1600),
      steps: [
        {
          id: 'goal',
          label: '先总结用户想做成的能力',
          detail: `${snippet}。把场景、触发与产出先在脑中对齐。`,
          status: 'pending' as const,
        },
        {
          id: 'gap',
          label: '再看写入四张表单前还缺什么',
          detail:
            '触发边界、必填标识、禁答范围或示例往往还不够清楚，需要先问清。',
          status: 'pending' as const,
        },
        {
          id: 'ask',
          label: '思路收束',
          detail:
            '先用少量澄清问题补关键缺口，再进入任务规划生成可点选卡片，避免一上来写死规格。',
          status: 'pending' as const,
        },
      ],
      planSteps: [
        {
          id: 'p1',
          label: '整理澄清问题',
          detail: '准备可点选的澄清卡片',
          status: 'pending' as const,
        },
        {
          id: 'p2',
          label: '对齐四张表单',
          detail: '明确答案将写入定义 / 主体 / 规范 / 补充',
          status: 'pending' as const,
        },
        {
          id: 'p3',
          label: '等待用户点选',
          detail: '收集后进入确认与写入',
          status: 'pending' as const,
        },
      ],
    };
  };

  const clearBubbleTimers = () => {
    bubbleTimersRef.current.forEach((t) => clearTimeout(t));
    bubbleTimersRef.current = [];
  };

  /** 一次回复可连发多条气泡；可选中间插一条无泡状态文案 */
  const pushAiTurn = (
    parts: Array<string | { sender?: 'ai' | 'system_status' | 'skill_confirm'; content: string }>,
    opts?: { staggerMs?: number },
  ) => {
    const stagger = opts?.staggerMs ?? 900;
    const cleaned = parts
      .map((p) =>
        typeof p === 'string'
          ? { sender: 'ai' as const, content: p.trim() }
          : { sender: (p.sender || 'ai') as 'ai' | 'system_status' | 'skill_confirm', content: (p.content || '').trim() },
      )
      .filter((p) => p.content);

    if (cleaned.length === 0) {
      setIsAiThinking(false);
      setThinkCotSteps([]); setTaskPlanSteps([]);
      setThinkCotGenerating(false); setTaskPlanGenerating(false);
      setThinkBootLoading(false);
      clearThinkBootTimer();
      thinkingTimerRef.current = null;
      return;
    }

    clearBubbleTimers();

    const willPushConfirm = cleaned.some((p) => p.sender === 'skill_confirm');

    cleaned.forEach((part, index) => {
      const timer = setTimeout(() => {
        if (index === 0) {
          archiveThinkPlanToChat();
          setIsAiThinking(false);
          setThinkCotSteps([]); setTaskPlanSteps([]);
          setThinkCotGenerating(false); setTaskPlanGenerating(false);
          setThinkBootLoading(false);
          thinkingTimerRef.current = null;
        }
        const stamp = new Date().toTimeString().substring(0, 5);
        const shouldSupersedeOlder =
          part.sender === 'skill_confirm' || (willPushConfirm && index === 0);
        if (shouldSupersedeOlder) {
          setConfirmEditTarget(null);
        }
        setChatMessages((prev) => {
          let next = prev;
          // 新确认卡出现前，先锁定旧的未确认卡
          if (shouldSupersedeOlder) {
            next = prev.map((m) => {
              if (m.sender !== 'skill_confirm') return m;
              try {
                const payload = JSON.parse(m.content) as {
                  confirmed?: boolean;
                  superseded?: boolean;
                };
                if (payload.confirmed || payload.superseded) return m;
                return {
                  ...m,
                  content: JSON.stringify({
                    ...payload,
                    superseded: true,
                    collapsed: true,
                  }),
                };
              } catch {
                return m;
              }
            });
          }
          return [
            ...next,
            {
              sender: part.sender,
              name:
                part.sender === 'system_status'
                  ? '系统'
                  : part.sender === 'skill_confirm'
                    ? SKILL_CREATE_CHAT.confirmTitle
                    : SKILL_CREATE_CHAT.assistantName,
              content: part.content,
              timestamp: stamp,
            },
          ];
        });
      }, index * stagger);
      bubbleTimersRef.current.push(timer);
    });
  };

  const handleStopThinking = () => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    clearThinkStepTimers();
    clearThinkBootTimer();
    setThinkBootLoading(false);
    setThinkCotSteps([]); setTaskPlanSteps([]);
    setThinkCotGenerating(false); setTaskPlanGenerating(false);
    confirmTypewriterRef.current.cancelled = true;
    setIsUpdatingForm(false);
    clearBubbleTimers();
    setIsAiThinking(false);
    showToast('已手动停止 AI 思考与推演');
  };

  React.useEffect(() => {
    if (!isAiThinking && messageQueue.length > 0) {
      const nextMsg = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      handleSendChatMessage(nextMsg);
    }
  }, [isAiThinking, messageQueue]);

  // Submit Flow Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const isVerifyingRef = React.useRef(false);
  const verificationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    isVerifyingRef.current = isVerifying;
    if (!isVerifying && verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
  }, [isVerifying]);

  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyPhase, setVerifyPhase] = useState<'required_fields' | 'uniqueness' | 'auto_fix' | 'success' | 'failed' | 'deployment_failed'>('required_fields');
  const [verificationMissingFields, setVerificationMissingFields] = useState<string[]>([]);
  const [verificationDuplicates, setVerificationDuplicates] = useState<string[]>([]);
  
  // Auto Repair progress
  const [repairSkillMd, setRepairSkillMd] = useState<'pending' | 'checking' | 'fixing' | 'success' | 'failed'>('pending');
  const [repairPackageStruct, setRepairPackageStruct] = useState<'pending' | 'checking' | 'fixing' | 'success' | 'failed'>('pending');
  const [repairSecurity, setRepairSecurity] = useState<'pending' | 'checking' | 'fixing' | 'success' | 'failed'>('pending');
  
  const [repairAttemptsSkillMd, setRepairAttemptsSkillMd] = useState(0);
  const [repairAttemptsPackageStruct, setRepairAttemptsPackageStruct] = useState(0);
  const [repairAttemptsSecurity, setRepairAttemptsSecurity] = useState(0);

  const [repairLog, setRepairLog] = useState<string[]>([]);
  /** 发布版本弹窗（对齐设计稿，替代黑屏“自动校验与修复”） */
  const [showPublishVersionModal, setShowPublishVersionModal] = useState(false);
  const [publishVersionNote, setPublishVersionNote] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const publishVersionNoteRef = React.useRef('');

  const logEndRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [repairLog]);

  const chatMessagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const prevChatLenRef = React.useRef(chatMessages.length);
  const prevThinkingRef = React.useRef(isAiThinking);
  React.useEffect(() => {
    const grew = chatMessages.length > prevChatLenRef.current;
    const thinkingStarted = isAiThinking && !prevThinkingRef.current;
    prevChatLenRef.current = chatMessages.length;
    prevThinkingRef.current = isAiThinking;
    // 仅新消息入列 / 开始思考时滚到底；确认卡编辑写回等原地更新不跳滚动
    if (!grew && !thinkingStarted) return;
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiThinking]);

  // Dynamically update completedSteps based on whether required fields are filled
  const actionChainsKey = JSON.stringify(actionChains.map(c => ({
    name: c.name,
    stepsCount: c.steps.length,
    stepNames: c.steps.map(s => s.name)
  })));

  useEffect(() => {
    const updatedCompleted: number[] = [];

    // Step 1: 技能定义 (Required: cnName, enId, businessProblem, triggerCond, coreInputIn, coreInputOut)
    if (cnName.trim().length > 0 && enId.trim().length > 0 && businessProblem.trim().length > 0 && triggerCond.trim().length > 0 && coreInputIn.trim().length > 0 && coreInputOut.trim().length > 0) {
      updatedCompleted.push(1);
    }

    // Step 2: 技能主体（业务知识 / 执行步骤 二选一）
    const hasKnowledge = (knowledgeContent && knowledgeContent.trim().length > 0) || (selectedKBs && selectedKBs.length > 0) || (knowledgeDesc && knowledgeDesc.trim().length > 0);
    const hasStepName = actionChains.length > 0 && actionChains.some(c => 
      c.steps.length > 0 && c.steps.some(st => st.name.trim().length > 0)
    );
    if (skillBodyMode === 'knowledge' ? hasKnowledge : hasStepName) {
      updatedCompleted.push(2);
    }

    // Step 3: 规范约束 (Optional: completed if any field is filled)
    if (notAllowed.trim().length > 0 || fallback.trim().length > 0 || contentRedLines.trim().length > 0 || answerTone.trim().length > 0 || expressionStyle.trim().length > 0) {
      updatedCompleted.push(3);
    }

    // Step 4: 补充说明 (Optional: usageExamples or customNotes filled)
    if (usageExamples.trim().length > 0 || customNotes.trim().length > 0) {
      updatedCompleted.push(4);
    }

    // Safely update to avoid infinite renders
    setCompletedSteps(prev => {
      const isSame = prev.length === updatedCompleted.length && 
                     prev.every(val => updatedCompleted.includes(val));
      return isSame ? prev : updatedCompleted;
    });
  }, [
    cnName,
    businessProblem,
    triggerCond,
    coreInputIn,
    coreInputOut,
    actionChainsKey,
    skillBodyMode,
    knowledgeContent,
    knowledgeDesc,
    selectedKBs,
    notAllowed,
    fallback,
    usageExamples,
    customNotes
  ]);

  // Snapshot Capture and Restore
  const captureStateSnapshot = () => {
    return {
      cnName,
      enId,
      skillKind,
      businessProblem,
      selectedScripts: [...selectedScripts],
      selectedKBs: [...selectedKBs],
      customScripts: JSON.parse(JSON.stringify(customScripts)),
      customKBs: [...customKBs],
      triggerCond,
      timing,
      forbiddenCond,
      coreInput,
      notResp,
      notAllowed,
      fallback,
      businessType,
      hasActionModule,
      hasKnowledgeModule,
      knowledgeBoundary,
      knowledgeContent,
      knowledgeDesc,
      skillBodyMode,
      knowledgeScripts: [...knowledgeScripts],
      knowledgeKbs: [...knowledgeKbs],
      answerTone,
      decisionMatrix,
      showSectionKnowledge,
      edgeCases,
      confidenceAndEscalation,
      actionChains: JSON.parse(JSON.stringify(actionChains)),
      inputPayload,
      outputPayload,
      uploadedFiles: JSON.parse(JSON.stringify(uploadedFiles)),
      customNotes,
      outputConstraints,
      selectedOutputTemplates,
      usageExamples,
      
      contentRedLines,
      expressionStyle,
      chatStep,
      skillGoalReady: true,
      draftConfirmed,
      chatMessages: JSON.parse(JSON.stringify(chatMessages)),
    };
  };

  const restoreStateFromSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    setCnName(snapshot.cnName);
    setEnId(snapshot.enId);
    setSkillKind(snapshot.skillKind);
    if (snapshot.businessProblem !== undefined) setBusinessProblem(snapshot.businessProblem);
    if (snapshot.selectedScripts) setSelectedScripts(snapshot.selectedScripts);
    if (snapshot.selectedKBs) setSelectedKBs(snapshot.selectedKBs);
    if (snapshot.customScripts) setCustomScripts(snapshot.customScripts);
    if (snapshot.customKBs) setCustomKBs(snapshot.customKBs);
    setTriggerCond(snapshot.triggerCond);
    setTiming(snapshot.timing);
    setForbiddenCond(snapshot.forbiddenCond);
    setCoreInput(snapshot.coreInput);
    setNotResp(snapshot.notResp);
    setNotAllowed(snapshot.notAllowed);
    setFallback(snapshot.fallback);
    
    if (snapshot.contentRedLines !== undefined) setContentRedLines(snapshot.contentRedLines);
    if (snapshot.expressionStyle !== undefined) setExpressionStyle(snapshot.expressionStyle);
    if (snapshot.businessType) setBusinessType(snapshot.businessType);
    if (snapshot.hasActionModule !== undefined) setHasActionModule(snapshot.hasActionModule);
    if (snapshot.hasKnowledgeModule !== undefined) setHasKnowledgeModule(snapshot.hasKnowledgeModule);
    if (snapshot.knowledgeBoundary !== undefined) setKnowledgeBoundary(snapshot.knowledgeBoundary);
    if (snapshot.knowledgeContent !== undefined) setKnowledgeContent(snapshot.knowledgeContent);
    if (snapshot.knowledgeDesc !== undefined) setKnowledgeDesc(snapshot.knowledgeDesc);
    if (snapshot.skillBodyMode === 'knowledge' || snapshot.skillBodyMode === 'steps') {
      setSkillBodyMode(snapshot.skillBodyMode);
    }
    if (snapshot.knowledgeScripts) setKnowledgeScripts(snapshot.knowledgeScripts);
    if (snapshot.knowledgeKbs) setKnowledgeKbs(snapshot.knowledgeKbs);
    if (snapshot.answerTone !== undefined) setAnswerTone(snapshot.answerTone);
    if (snapshot.decisionMatrix !== undefined) setDecisionMatrix(snapshot.decisionMatrix);
    if (snapshot.showSectionKnowledge !== undefined) setShowSectionKnowledge(snapshot.showSectionKnowledge);
    if (snapshot.edgeCases !== undefined) setEdgeCases(snapshot.edgeCases);
    if (snapshot.confidenceAndEscalation !== undefined) setConfidenceAndEscalation(snapshot.confidenceAndEscalation);
    setActionChains(snapshot.actionChains);
    setInputPayload(snapshot.inputPayload);
    setOutputPayload(snapshot.outputPayload);
    setUploadedFiles(snapshot.uploadedFiles);
    if (snapshot.customNotes !== undefined) setCustomNotes(snapshot.customNotes);
    if (snapshot.outputConstraints !== undefined) setOutputConstraints(snapshot.outputConstraints);
    if (snapshot.selectedOutputTemplates !== undefined) setSelectedOutputTemplates(snapshot.selectedOutputTemplates);
    if (snapshot.usageExamples !== undefined) setUsageExamples(snapshot.usageExamples);
    if (typeof snapshot.skillGoalReady === 'boolean') setSkillGoalReady(snapshot.skillGoalReady);
    if (typeof snapshot.draftConfirmed === 'boolean') setDraftConfirmed(snapshot.draftConfirmed);
    if (Array.isArray(snapshot.chatMessages)) setChatMessages(snapshot.chatMessages);
  };

  const captureFullSnapshot = () => {
    return {
      cnName,
      enId,
      skillKind,
      businessProblem,
      selectedScripts: [...selectedScripts],
      selectedKBs: [...selectedKBs],
      customScripts: JSON.parse(JSON.stringify(customScripts)),
      customKBs: [...customKBs],
      triggerCond,
      timing,
      forbiddenCond,
      coreInput,
      notResp,
      notAllowed,
      fallback,
      businessType,
      hasActionModule,
      hasKnowledgeModule,
      knowledgeBoundary,
      knowledgeContent,
      knowledgeDesc,
      skillBodyMode,
      knowledgeScripts: [...knowledgeScripts],
      knowledgeKbs: [...knowledgeKbs],
      answerTone,
      decisionMatrix,
      showSectionKnowledge,
      edgeCases,
      confidenceAndEscalation,
      actionChains: JSON.parse(JSON.stringify(actionChains)),
      inputPayload,
      outputPayload,
      uploadedFiles: JSON.parse(JSON.stringify(uploadedFiles)),
      chatStep,
      showGuide,
      activeStep,
      completedSteps: [...completedSteps],
      customNotes,
      outputConstraints,
      selectedOutputTemplates,
      usageExamples,
      skillGoalReady,
      draftConfirmed,
      chatMessages: JSON.parse(JSON.stringify(chatMessages)),
    };
  };

  const restoreFullSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    setCnName(snapshot.cnName);
    setEnId(snapshot.enId);
    setSkillKind(snapshot.skillKind);
    if (snapshot.businessProblem !== undefined) setBusinessProblem(snapshot.businessProblem);
    if (snapshot.selectedScripts) setSelectedScripts(snapshot.selectedScripts);
    if (snapshot.selectedKBs) setSelectedKBs(snapshot.selectedKBs);
    if (snapshot.customScripts) setCustomScripts(snapshot.customScripts);
    if (snapshot.customKBs) setCustomKBs(snapshot.customKBs);
    setTriggerCond(snapshot.triggerCond);
    setTiming(snapshot.timing);
    setForbiddenCond(snapshot.forbiddenCond);
    setCoreInput(snapshot.coreInput);
    setNotResp(snapshot.notResp);
    setNotAllowed(snapshot.notAllowed);
    setFallback(snapshot.fallback);
    if (snapshot.businessType) setBusinessType(snapshot.businessType);
    if (snapshot.hasActionModule !== undefined) setHasActionModule(snapshot.hasActionModule);
    if (snapshot.hasKnowledgeModule !== undefined) setHasKnowledgeModule(snapshot.hasKnowledgeModule);
    if (snapshot.knowledgeBoundary !== undefined) setKnowledgeBoundary(snapshot.knowledgeBoundary);
    if (snapshot.knowledgeContent !== undefined) setKnowledgeContent(snapshot.knowledgeContent);
    if (snapshot.knowledgeDesc !== undefined) setKnowledgeDesc(snapshot.knowledgeDesc);
    if (snapshot.skillBodyMode === 'knowledge' || snapshot.skillBodyMode === 'steps') {
      setSkillBodyMode(snapshot.skillBodyMode);
    }
    if (snapshot.knowledgeScripts) setKnowledgeScripts(snapshot.knowledgeScripts);
    if (snapshot.knowledgeKbs) setKnowledgeKbs(snapshot.knowledgeKbs);
    if (snapshot.answerTone !== undefined) setAnswerTone(snapshot.answerTone);
    if (snapshot.decisionMatrix !== undefined) setDecisionMatrix(snapshot.decisionMatrix);
    if (snapshot.showSectionKnowledge !== undefined) setShowSectionKnowledge(snapshot.showSectionKnowledge);
    if (snapshot.edgeCases !== undefined) setEdgeCases(snapshot.edgeCases);
    if (snapshot.confidenceAndEscalation !== undefined) setConfidenceAndEscalation(snapshot.confidenceAndEscalation);
    setActionChains(snapshot.actionChains);
    setInputPayload(snapshot.inputPayload);
    setOutputPayload(snapshot.outputPayload);
    setUploadedFiles(snapshot.uploadedFiles);
    setChatStep(snapshot.chatStep);
    if (snapshot.showGuide !== undefined) setShowGuide(snapshot.showGuide);
    setActiveStep(snapshot.activeStep);
    setCompletedSteps(snapshot.completedSteps);
    if (snapshot.customNotes !== undefined) setCustomNotes(snapshot.customNotes);
    if (snapshot.outputConstraints !== undefined) setOutputConstraints(snapshot.outputConstraints);
    if (snapshot.selectedOutputTemplates !== undefined) setSelectedOutputTemplates(snapshot.selectedOutputTemplates);
    if (snapshot.usageExamples !== undefined) setUsageExamples(snapshot.usageExamples);
    if (typeof snapshot.skillGoalReady === 'boolean') setSkillGoalReady(snapshot.skillGoalReady);
    if (typeof snapshot.draftConfirmed === 'boolean') setDraftConfirmed(snapshot.draftConfirmed);
    if (Array.isArray(snapshot.chatMessages)) setChatMessages(snapshot.chatMessages);
  };


  React.useEffect(() => {
    if (!open) {
      seedPromptConsumedRef.current = false;
      seedFirstTurnRef.current = Boolean(initialPrompt?.trim()) && !draftSkillId;
    }
  }, [open, initialPrompt, draftSkillId]);

  React.useEffect(() => {
    if (!open || draftSkillId) return;
    const seed = initialPrompt?.trim();
    if (!seed) return;
    seedFirstTurnRef.current = true;
    setSkillGoalReady(true);
    setRightCollapsed(true);
    if (Array.isArray(initialSelectedKBs) && initialSelectedKBs.length > 0) {
      setSelectedKBs((prev) => Array.from(new Set([...prev, ...initialSelectedKBs])));
    }
    /** StrictMode 会先 cleanup 再重跑：只在真正发出时标记 consumed，避免首轮被取消后不再发 */
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || seedPromptConsumedRef.current) return;
      seedPromptConsumedRef.current = true;
      handleSendChatMessageRef.current(seed);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, initialPrompt, draftSkillId, initialSelectedKBs]);

  React.useEffect(() => {
    if (!open || !draftSkillId) return;
    const skill = skills.find((s) => s.id === draftSkillId);
    if (!skill) return;

    /** 编辑入口：跳过“描述技能目标”落地页，直接进入多轮 AOP */
    setSkillGoalReady(true);
    setDraftConfirmed(true);
    setRightCollapsed(true);
    setCompletedSteps([1, 2, 3, 4]);

    if (skill.draftData) {
      restoreFullSnapshot(skill.draftData);
      setSkillGoalReady(true);
      const snap = skill.draftData as Record<string, unknown>;
      if (typeof snap.draftConfirmed === 'boolean') setDraftConfirmed(snap.draftConfirmed);
      else setDraftConfirmed(true);
      const confirmed =
        typeof snap.draftConfirmed === 'boolean' ? snap.draftConfirmed : true;
      setRightCollapsed(!confirmed);
      if (Array.isArray(snap.chatMessages) && snap.chatMessages.length > 0) {
        setChatMessages(snap.chatMessages as typeof chatMessages);
      } else {
        const step = typeof snap.chatStep === 'number' ? snap.chatStep : 0;
        if (step < 1) setChatStep(5);
        const skillLabel = skill.cnName || skill.name || '当前技能';
        setChatMessages([
          {
            sender: 'ai',
            name: SKILL_CREATE_CHAT.assistantName,
            content: `已载入“${skillLabel}”草稿，可直接对话优化右侧四张卡片，或测一条 / 校验发布。`,
            timestamp: new Date().toTimeString().substring(0, 5),
          },
        ]);
      }
      return;
    }

    setCnName(skill.cnName || skill.name || '');
    setEnId(skill.enId || skill.skillCode || '');
    setBusinessProblem(skill.description || '');
    setChatStep(5);
    setRightCollapsed(false);
    const skillLabel = skill.cnName || skill.name || '当前技能';
    setChatMessages([
      {
        sender: 'ai',
        name: SKILL_CREATE_CHAT.assistantName,
        content: `已载入“${skillLabel}”，可直接对话优化右侧四张卡片，或测一条 / 校验发布。`,
        timestamp: new Date().toTimeString().substring(0, 5),
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftSkillId]);

  useEffect(() => {
    if (draftSkillId) setBoundDraftSkillId(draftSkillId);
  }, [draftSkillId]);

  useEffect(() => {
    if (!open) {
      allowDraftDirtyTrackRef.current = false;
      setBoundDraftSkillId(draftSkillId ?? null);
      setIsDraftDirty(!draftSkillId);
      return;
    }
    if (draftSkillId) {
      // 等草稿快照灌入后再开始脏检测，避免载入过程误点亮“保存草稿”
      allowDraftDirtyTrackRef.current = false;
      const timer = window.setTimeout(() => {
        setIsDraftDirty(false);
        setIsFormDirty(false);
        allowDraftDirtyTrackRef.current = true;
      }, 0);
      return () => window.clearTimeout(timer);
    }
    allowDraftDirtyTrackRef.current = true;
    setIsDraftDirty(true);
  }, [open, draftSkillId]);

  useEffect(() => {
    if (!allowDraftDirtyTrackRef.current) return;
    if (isFormDirty) setIsDraftDirty(true);
  }, [isFormDirty]);

  useEffect(() => {
    if (!allowDraftDirtyTrackRef.current) return;
    setIsDraftDirty(true);
  }, [chatMessages.length]);

  const handleRollbackLastRound = () => {
    if (!historyState) return;
    restoreFullSnapshot(historyState.snapshot);
    const count = historyState.messagesCountBeforeRound;
    setChatMessages(prev => prev.map((msg, idx) => {
      if (idx >= count) {
        return { ...msg, isRevoked: true };
      }
      return msg;
    }));
    setHistoryState(null);
    showToast('✨ 已成功撤回本轮对话修改！');
  };

  // ZIP Upload Handlers for direct creation without interaction
  const [isZipDragging, setIsZipDragging] = useState(false);
  const [isZipUploading, setIsZipUploading] = useState(false);

  const handleZipUpload = (fileName: string, fileSize: number) => {
    setIsZipUploading(true);
    setTimeout(() => {
      setIsZipUploading(false);
      
      const nameBase = fileName.replace(/\.[^/.]+$/, "");
      const cleanName = nameBase.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + " 智能技能";
      
      setCnName(cleanName);
      setEnId(nameBase.toLowerCase().replace(/[^a-z0-9_]/g, "_") + "_bot");
      setBusinessProblem(`基于上传的 ${fileName} 技能压缩包提取的自动化智能服务，用于快速处理相关业务流程并解答咨询。`);
      setSkillKind('pure_doc');
      setTriggerCond('当接收到该类型业务相关指令时触发。');
      setTiming('自动匹配意图并运行技能。');
      setForbiddenCond('无特定禁止响应场景。');
      setCoreInput('1. 用户诉求内容 (String)');
      setNotResp('不负责回答与此技能职责无关的任何其他企业信息。');
      setNotAllowed('严禁提供虚假的服务指引。');
      setFallback('引导用户进入人工客服排队。');
      setCoreInputIn('解包读取到的指令及相关数据');
      setCoreInputOut('自动回复指引及结构化 JSON 数据');
      setSelectedScripts([]);
      setSelectedKBs([]);
      
      // Add ZIP contents as uploaded files inside the skill
      const sizeStr = fileSize > 1024 * 1024 
        ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
        : `${(fileSize / 1024).toFixed(0)} KB`;
      
      const newZipFile: UploadedFile = {
        id: `zip_${Date.now()}`,
        name: fileName,
        size: sizeStr,
        type: 'doc',
        inSkill: true
      };
      
      setUploadedFiles([newZipFile]);
      setIsFormDirty(true);
      
      // Delay validation slightly to let state settle and provide better UX
      setTimeout(() => {
        setIsVerifying(true);
        setVerifyStep(1);
        
        setTimeout(() => {
          setVerifyStep(2);
          setTimeout(() => {
            setVerifyStep(3);
            setTimeout(() => {
              const actualKind = 'kb';
              const descStr = '当接收到该类型业务相关指令时触发。';
              
              if (draftSkillId) {
                updateSkill(draftSkillId, {
                  name: cleanName,
                  description: descStr,
                  status: 'published',
                  kind: actualKind,
                  hasScripts: false,
                  hasKBs: true,
                  draftData: undefined
                });
              } else {
                createSkill(cleanName, descStr, 'mine', actualKind, false, true);
              }
              
              showToast(`✨ 恭喜！智能技能 ${cleanName} 已成功发布并部署！`);
              setIsVerifying(false);
              onClose();
            }, 1200);
          }, 1000);
        }, 1200);
      }, 500);
      
    }, 1200);
  };

  // File Upload Handlers（右侧表单「技能包文件」）
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const addComposerAttachments = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const room = COMPOSER_MAX_FILES - composerAttachments.length;
    if (room <= 0) return;

    const accepted: ComposerAttachment[] = [];
    for (const file of incoming.slice(0, room)) {
      if (!isComposerAcceptedFile(file)) continue;
      if (file.size > COMPOSER_MAX_BYTES) continue;
      accepted.push(await buildComposerAttachment(file));
    }

    if (accepted.length > 0) {
      setComposerAttachments((prev) => [...prev, ...accepted].slice(0, COMPOSER_MAX_FILES));
    }
  };

  const removeComposerAttachment = (id: string) => {
    setComposerAttachments((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileUpload = (fileName: string, fileSize: number) => {
    setUploadProgress(10);
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(null);
        
        const sizeStr = fileSize > 1024 * 1024 
          ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
          : `${(fileSize / 1024).toFixed(0)} KB`;
          
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const allowedExtensions = [
          'md', 'ts', 'tsx', 'py', 'js', 'jsx', 'json', 'sh',
          'pdf', 'txt', 'doc', 'docx', 'csv', 'xlsx', 'xls',
          'yaml', 'yml', 'xml', 'html', 'css', 'log', 'zip',
          'png', 'jpg', 'jpeg', 'webp',
        ];
        const isAllowed = allowedExtensions.includes(extension);

        let fileType: 'doc' | 'sheet' | 'script' = 'doc';
        if (['ts', 'tsx', 'py', 'js', 'jsx', 'json', 'sh', 'yaml', 'yml'].includes(extension)) {
          fileType = 'script';
        } else if (['csv', 'xlsx', 'xls'].includes(extension)) {
          fileType = 'sheet';
        }

        const newFile: UploadedFile = {
          id: `file_${Date.now()}`,
          name: fileName,
          size: sizeStr,
          type: fileType,
          inSkill: true,
          status: isAllowed ? 'success' : 'failed',
          errorMessage: isAllowed
            ? undefined
            : '不支持的文件格式（文档 / 表格 / 脚本 / 图片 / 压缩包均可）'
        };

        setUploadedFiles(prev => [...prev, newFile]);
        setIsFormDirty(true);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  const handleToggleFilePosition = (fileId: string) => {
    setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, inSkill: !f.inSkill } : f));
    setIsFormDirty(true);
    showToast('已更改文件部署位置');
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setIsFormDirty(true);
    showToast('已移除上传文件');
  };

  // Action Chains Management
  const handleAddActionChain = () => {
    if (actionChains.length >= 10) {
      showToast('⚠️ 动作链数量已达上限 (10个)！');
      return;
    }
    const nextId = actionChains.length > 0 ? Math.max(...actionChains.map(c => c.id)) + 1 : 1;
    setActionChains(prev => [
      ...prev,
      { 
        id: nextId, 
        name: `动作链 #${nextId}`, 
        steps: [{ 
          id: 1, 
          name: '步骤1', 
          description: '请描述此执行步骤的内部操作。', 
          example: '在此填入一个具体的成功运行实例。', 
          associatedScripts: [], 
          associatedKBs: [], 
          associatedDocs: [] 
        }] 
      }
    ]);
    setIsFormDirty(true);
  };

  const handleRemoveActionChain = (chainId: number) => {
    setActionChains(prev => prev.filter(c => c.id !== chainId));
    setIsFormDirty(true);
  };

  const handleAddStepToChain = (chainId: number) => {
    setActionChains(prev => prev.map(chain => {
      if (chain.id === chainId) {
        if (chain.steps.length >= 10) {
          showToast('⚠️ 步骤数量已达上限 (10个)！');
          return chain;
        }
        const nextStepId = chain.steps.length > 0 ? Math.max(...chain.steps.map(s => s.id)) + 1 : 1;
        return {
          ...chain,
          steps: [
            ...chain.steps,
            {
              id: nextStepId,
              name: `新增加的动作步骤 #${nextStepId}`,
              description: '请描述此执行步骤的内部操作。',
              example: '在此填入一个具体的成功运行实例。',
              isResourcesExpanded: false
            }
          ]
        };
      }
      return chain;
    }));
    setIsFormDirty(true);
  };

  const handleRemoveStepFromChain = (chainId: number, stepId: number) => {
    setActionChains(prev => prev.map(chain => {
      if (chain.id === chainId) {
        return {
          ...chain,
          steps: chain.steps.filter(s => s.id !== stepId)
        };
      }
      return chain;
    }));
    setIsFormDirty(true);
    showToast('已移除动作步骤');
  };

  const handleCancelManualChanges = () => {
    restoreFullSnapshot(lastSyncedState);
    setIsFormDirty(false);
    showToast('已撤销本次手动修改');
  };

  // Dynamic Skill MD Generator
  const generateSkillMarkdown = () => {
    return `# Skill Specification: ${cnName || '智能技能'} (${enId || 'auto_skill'})

## 技能定义 / Skill Definition
- **技能名称**: ${cnName || '未命名技能'}
- **技能标识**: ${enId || 'auto_skill'}
- **能力简介**: ${businessProblem || '暂无能力简介'}
- **触发条件**: ${triggerCond || '暂无触发条件'}
- **禁止触发场景**: ${forbiddenCond || '无特定禁止触发场景'}
${(selectedScripts.length > 0 || selectedKBs.length > 0) ? `- **资源挂载**:
${selectedScripts.length > 0 ? `  - 企业接入脚本: ${selectedScripts.join(', ')}\n` : ''}${selectedKBs.length > 0 ? `  - 企业知识库: ${selectedKBs.join(', ')}\n` : ''}` : ''}
- **任务目标与核心数据流**:
  - **【输入】**: ${coreInputIn || '暂无输入定义'}
  ${coreInputProc ? `- **【处理】**: ${coreInputProc}\n  ` : ''}- **【输出】**: ${coreInputOut || '暂无输出定义'}

## 技能主体 / Skill Body
${(knowledgeContent || knowledgeDesc) ? `### 1. 业务知识
${knowledgeContent ? `- **知识内容**:\n${knowledgeContent}\n` : ''}${knowledgeDesc ? `- **知识说明**:\n${knowledgeDesc}\n` : ''}
` : ''}### 2. 执行步骤
${actionChains.some(c => c.steps.some(st => st.name.trim())) ? actionChains.flatMap((chain) => chain.steps).map((st, i) => `#### 步骤 ${i + 1}: ${st.name || '执行步骤'}
- **步骤说明**: ${st.description || '暂无说明'}${st.stepKnowledge ? `\n- **步骤知识**: ${st.stepKnowledge}` : ''}
- **运行实例**: ${st.example || '暂无实例'}`).join('\n\n') : '暂无结构化步骤'}

## 规范约束 / Specification Constraints
- **禁止行为**: ${notAllowed || '暂无禁止行为'}
- **内容红线**: ${contentRedLines || '无特殊内容红线'}
- **回答口径**: ${answerTone || '标准客服专业口径'}
- **托底策略**: ${fallback || '转人工客服或提示稍后重试'}
- **表达风格**: ${expressionStyle || '亲切、专业'}

## 补充说明 / Supplementary
- **使用示例**:
\`\`\`text
${usageExamples || '暂无调用示例'}
\`\`\`
- **补充资料**: ${customNotes || '无补充备注'}
`;
  };

  const extractSkillTitleFromGoal = (raw: string) => {
    const quoted = raw.match(/[「『“"]([^」』”"]{2,24})[」』”"]/);
    if (quoted?.[1]) return quoted[1].replace(/技能$/, '').trim().slice(0, 16);
    const named = raw.match(/(?:做一个|创建)\s*(?:一个)?\s*([^，。：:\n]{2,16})/);
    if (named?.[1]) {
      return named[1].replace(/[「『"']|[」』"']技能?/g, '').trim().slice(0, 16);
    }
    return '未命名技能';
  };

  const toConfirmItem = (
    fieldKey: SkillConfirmFieldKey,
    fieldLabel: string,
    value: string,
  ): SkillConfirmItem => {
    const text = (value || '').replace(/\r\n/g, '\n').trim() || '未填写';
    const compactLabel = text.replace(/\s+/g, ' ');
    return {
      id: fieldKey,
      fieldKey,
      fieldLabel,
      value: text,
      label: `${fieldLabel}：${compactLabel}`,
      checked: true,
    };
  };

  const sectionForConfirmField = (fieldKey: SkillConfirmFieldKey): number => {
    if (fieldKey === 'actionChain' || fieldKey === 'knowledgeContent' || fieldKey === 'knowledgeDesc') {
      return 2;
    }
    if (
      fieldKey === 'notAllowed' ||
      fieldKey === 'contentRedLines' ||
      fieldKey === 'fallback' ||
      fieldKey === 'answerTone'
    ) {
      return 3;
    }
    if (fieldKey === 'usageExamples' || fieldKey === 'customNotes') {
      return 4;
    }
    return 1;
  };

  const confirmFieldDomId = (fieldKey: SkillConfirmFieldKey) =>
    fieldKey === 'actionChain' ? 'form-section-2' : `field-${fieldKey}`;

  const markConfirmFieldUserOwned = (fieldKey: SkillConfirmFieldKey) => {
    confirmTypewriterRef.current.userOwnedFields.add(fieldKey);
    confirmTypewriterRef.current.followUi = false;
  };

  const isConfirmFieldFocused = (fieldKey: SkillConfirmFieldKey) => {
    const el = document.getElementById(confirmFieldDomId(fieldKey));
    const active = document.activeElement;
    return Boolean(el && active && el.contains(active));
  };

  const shouldSkipConfirmFieldWrite = (fieldKey: SkillConfirmFieldKey) =>
    confirmTypewriterRef.current.userOwnedFields.has(fieldKey) ||
    isConfirmFieldFocused(fieldKey);

  const resolveConfirmFieldKeyFromDom = (node: EventTarget | null): SkillConfirmFieldKey | null => {
    if (!(node instanceof Element)) return null;
    const host = node.closest('[id^="field-"], #form-section-2');
    if (!host) return null;
    if (host.id === 'form-section-2') return 'actionChain';
    const key = host.id.replace(/^field-/, '') as SkillConfirmFieldKey;
    return key || null;
  };

  /** 确认写入期间：用户点进/改字段 → 该字段归用户，AI 不再抢写 */
  useEffect(() => {
    if (!isUpdatingForm) return;
    const root = document.getElementById('skill-form-workspace');
    if (!root) return;
    const claim = (target: EventTarget | null) => {
      const key = resolveConfirmFieldKeyFromDom(target);
      if (!key) return;
      markConfirmFieldUserOwned(key);
    };
    const onFocusIn = (e: FocusEvent) => claim(e.target);
    const onInput = (e: Event) => claim(e.target);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('input', onInput);
    return () => {
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('input', onInput);
    };
  }, [isUpdatingForm]);

  const switchToConfirmFieldSection = (fieldKey: SkillConfirmFieldKey) => {
    if (centerTabRef.current !== 'form') return;
    const sectionId = sectionForConfirmField(fieldKey);
    setCompletedSteps((steps) => [...new Set([...steps, sectionId])]);
    if (!confirmTypewriterRef.current.followUi) return;
    const prev = activeStepRef.current;
    formStepDirRef.current = sectionId > prev ? 1 : sectionId < prev ? -1 : 0;
    openFormSection(sectionId);
    requestAnimationFrame(() => {
      document.getElementById(confirmFieldDomId(fieldKey))?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  };

  const CONFIRM_TYPEWRITER_MS = 28;

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const setConfirmFieldTyping = (fieldKey: SkillConfirmFieldKey, active: boolean) => {
    const el = document.getElementById(confirmFieldDomId(fieldKey));
    if (!el) return;
    el.classList.toggle('skill-confirm-typing', active);
  };

  const flashConfirmWrittenFields = (fieldKeys: SkillConfirmFieldKey[]) => {
    if (centerTabRef.current !== 'form') return;
    fieldKeys.forEach((key) => {
      document.getElementById(confirmFieldDomId(key))?.classList.add('skill-confirm-written-flash');
    });
    window.setTimeout(() => {
      fieldKeys.forEach((key) => {
        document.getElementById(confirmFieldDomId(key))?.classList.remove('skill-confirm-written-flash');
      });
    }, 3200);
  };

  const parseActionChainStepNames = (value: string): string[] => {
    const marked = value.match(/写入表单步骤名[：:]\s*([^\n）)]+)/);
    if (marked?.[1]) {
      return marked[1]
        .split(/\s*→\s*|\s*->\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const numbered = [...value.matchAll(/^\s*\d+[\.、．]\s*(.+)$/gm)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    if (numbered.length > 0) return numbered;
    return value
      .split(/\s*→\s*|\s*->\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const getConfirmFieldSnapshot = (fieldKey: SkillConfirmFieldKey): string => {
    const snap = formSnapshotRef.current;
    if (fieldKey === 'cnName') return snap.cnName;
    if (fieldKey === 'businessProblem') return snap.businessProblem;
    if (fieldKey === 'triggerCond') return snap.triggerCond;
    if (fieldKey === 'forbiddenCond') return snap.forbiddenCond;
    if (fieldKey === 'coreInputIn') return snap.coreInputIn;
    if (fieldKey === 'coreInputOut') return snap.coreInputOut;
    if (fieldKey === 'notAllowed') return snap.notAllowed;
    if (fieldKey === 'contentRedLines') return snap.contentRedLines;
    if (fieldKey === 'fallback') return snap.fallback;
    if (fieldKey === 'usageExamples') return snap.usageExamples;
    if (fieldKey === 'customNotes') return snap.customNotes;
    if (fieldKey === 'actionChain') return snap.actionChainNames;
    return '';
  };

  const applyConfirmValueToForm = (
    fieldKey: SkillConfirmFieldKey,
    value: string,
    options?: { scroll?: boolean; openSection?: boolean; allowEmpty?: boolean },
  ) => {
    const next = value.trim();
    if (!next && !options?.allowEmpty) return;
    if (fieldKey === 'cnName') setCnName(next.slice(0, 30));
    if (fieldKey === 'businessProblem') setBusinessProblem(next.slice(0, 50));
    if (fieldKey === 'triggerCond') setTriggerCond(next.slice(0, 200));
    if (fieldKey === 'forbiddenCond') setForbiddenCond(next.slice(0, 200));
    if (fieldKey === 'coreInputIn') setCoreInputIn(next.slice(0, 200));
    if (fieldKey === 'coreInputOut') setCoreInputOut(next.slice(0, 200));
    if (fieldKey === 'notAllowed') setNotAllowed(next.slice(0, 500));
    if (fieldKey === 'contentRedLines') setContentRedLines(next.slice(0, 500));
    if (fieldKey === 'fallback') setFallback(next.slice(0, 500));
    if (fieldKey === 'usageExamples') setUsageExamples(next.slice(0, 1000));
    if (fieldKey === 'customNotes') setCustomNotes(next);
    if (fieldKey === 'actionChain') {
      const names = parseActionChainStepNames(next);
      if (names.length > 0) {
        setActionChains((prev) =>
          prev.map((chain, idx) =>
            idx === 0
              ? {
                  ...chain,
                  steps: chain.steps.map((step, i) =>
                    names[i] ? { ...step, name: names[i] } : step,
                  ),
                }
              : chain,
          ),
        );
      } else if (options?.allowEmpty) {
        setActionChains((prev) =>
          prev.map((chain, idx) =>
            idx === 0
              ? {
                  ...chain,
                  steps: chain.steps.map((step) => ({ ...step, name: '' })),
                }
              : chain,
          ),
        );
      }
    }
    setIsFormDirty(true);
    if (options?.openSection && confirmTypewriterRef.current.followUi) {
      openFormSection(sectionForConfirmField(fieldKey));
    }
    if (options?.scroll !== false && confirmTypewriterRef.current.followUi) {
      requestAnimationFrame(() => {
        document.getElementById(confirmFieldDomId(fieldKey))?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  };

  const writeActionChainNames = (names: string[]) => {
    setActionChains((prev) => {
      const chain = prev[0];
      if (!chain) return prev;
      const steps = [...chain.steps];
      while (steps.length < names.length) {
        steps.push({
          id: Date.now() + steps.length,
          name: '',
          description: '',
          example: '',
          associatedScripts: [],
          associatedKBs: [],
          associatedDocs: [],
        });
      }
      return prev.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              steps: steps.map((step, stepIdx) =>
                stepIdx < names.length ? { ...step, name: names[stepIdx] } : step,
              ),
            }
          : item,
      );
    });
    setIsFormDirty(true);
  };

  const typewriterWriteActionChain = async (value: string) => {
    const names = parseActionChainStepNames(value);
    if (names.length === 0) return;
    if (shouldSkipConfirmFieldWrite('actionChain')) {
      markConfirmFieldUserOwned('actionChain');
      return;
    }

    // 后台写入：一次落盘，避免逐字重渲染打断用户操作
    if (!confirmTypewriterRef.current.followUi) {
      writeActionChainNames(names);
      markFormSectionWritten(2);
      return;
    }

    switchToConfirmFieldSection('actionChain');
    setConfirmFieldTyping('actionChain', true);

    setActionChains((prev) => {
      const chain = prev[0];
      if (!chain) return prev;
      const steps = [...chain.steps];
      while (steps.length < names.length) {
        steps.push({
          id: Date.now() + steps.length,
          name: '',
          description: '',
          example: '',
          associatedScripts: [],
          associatedKBs: [],
          associatedDocs: [],
        });
      }
      return prev.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              steps: steps.map((step, stepIdx) =>
                stepIdx < names.length ? { ...step, name: '' } : step,
              ),
            }
          : item,
      );
    });

    await sleep(CONFIRM_TYPEWRITER_MS);
    let lastWritten = '';
    for (let stepIdx = 0; stepIdx < names.length; stepIdx += 1) {
      const fullName = names[stepIdx];
      for (let i = 1; i <= fullName.length; i += 1) {
        if (confirmTypewriterRef.current.cancelled) return;
        if (shouldSkipConfirmFieldWrite('actionChain')) {
          markConfirmFieldUserOwned('actionChain');
          setConfirmFieldTyping('actionChain', false);
          return;
        }
        if (getConfirmFieldSnapshot('actionChain') !== lastWritten) {
          markConfirmFieldUserOwned('actionChain');
          setConfirmFieldTyping('actionChain', false);
          return;
        }
        const partial = fullName.slice(0, i);
        setActionChains((prev) =>
          prev.map((chain, chainIdx) =>
            chainIdx === 0
              ? {
                  ...chain,
                  steps: chain.steps.map((step, idx) =>
                    idx === stepIdx ? { ...step, name: partial } : step,
                  ),
                }
              : chain,
          ),
        );
        lastWritten = [...names.slice(0, stepIdx), partial].join(' → ');
        await sleep(CONFIRM_TYPEWRITER_MS + (i % 4 === 0 ? 6 : 0));
      }
    }

    setIsFormDirty(true);
    setConfirmFieldTyping('actionChain', false);
  };

  const capConfirmFieldValue = (fieldKey: SkillConfirmFieldKey, value: string): string => {
    const next = value.trim();
    if (fieldKey === 'cnName') return next.slice(0, 30);
    if (fieldKey === 'businessProblem') return next.slice(0, 50);
    if (fieldKey === 'usageExamples') return next.slice(0, 1000);
    if (
      fieldKey === 'notAllowed' ||
      fieldKey === 'contentRedLines' ||
      fieldKey === 'fallback'
    ) {
      return next.slice(0, 500);
    }
    if (
      fieldKey === 'triggerCond' ||
      fieldKey === 'forbiddenCond' ||
      fieldKey === 'coreInputIn' ||
      fieldKey === 'coreInputOut'
    ) {
      return next.slice(0, 200);
    }
    return next;
  };

  const typewriterWriteToField = async (fieldKey: SkillConfirmFieldKey, value: string) => {
    const next = value.trim();
    if (!next) return;
    if (shouldSkipConfirmFieldWrite(fieldKey)) {
      markConfirmFieldUserOwned(fieldKey);
      return;
    }
    if (fieldKey === 'actionChain') {
      await typewriterWriteActionChain(next);
      return;
    }

    // 后台写入：一次落盘，不切卡/不逐字，避免影响用户正在编辑/浏览
    if (!confirmTypewriterRef.current.followUi) {
      applyConfirmValueToForm(fieldKey, capConfirmFieldValue(fieldKey, next), {
        scroll: false,
        openSection: false,
      });
      markFormSectionWritten(sectionForConfirmField(fieldKey));
      return;
    }

    switchToConfirmFieldSection(fieldKey);
    setConfirmFieldTyping(fieldKey, true);
    applyConfirmValueToForm(fieldKey, '', {
      scroll: false,
      openSection: false,
      allowEmpty: true,
    });
    await sleep(CONFIRM_TYPEWRITER_MS);

    let lastWritten = '';
    for (let i = 1; i <= next.length; i += 1) {
      if (confirmTypewriterRef.current.cancelled) return;
      if (shouldSkipConfirmFieldWrite(fieldKey)) {
        markConfirmFieldUserOwned(fieldKey);
        setConfirmFieldTyping(fieldKey, false);
        return;
      }
      if (getConfirmFieldSnapshot(fieldKey) !== lastWritten) {
        // 用户改过该字段：停止本字段，其它字段继续写
        markConfirmFieldUserOwned(fieldKey);
        setConfirmFieldTyping(fieldKey, false);
        return;
      }
      const partial = capConfirmFieldValue(fieldKey, next.slice(0, i));
      applyConfirmValueToForm(fieldKey, partial, {
        scroll: false,
        openSection: false,
      });
      lastWritten = partial;
      await sleep(CONFIRM_TYPEWRITER_MS + (i % 4 === 0 ? 6 : 0));
    }

    setConfirmFieldTyping(fieldKey, false);
  };

  const handleConfirmSkillItems = async (items: SkillConfirmItem[]) => {
    const checkedWithField = items.filter(
      (item) => item.checked && item.fieldKey,
    ) as Array<SkillConfirmItem & { fieldKey: SkillConfirmFieldKey }>;
    const writtenKeys: SkillConfirmFieldKey[] = [];

    setDraftConfirmed(true);
    setConfirmEditTarget(null);
    setRightCollapsed(false);
    setEditingMarkdown(null);
    confirmTypewriterRef.current.cancelled = false;
    // AI 后台写入，不抢切卡/滚动；用户可自由操作右侧表单
    confirmTypewriterRef.current.followUi = false;
    confirmTypewriterRef.current.userOwnedFields = new Set();
    setIsUpdatingForm(true);

    const pendingSide = pendingGoalDraftSideRef.current;
    if (pendingSide) {
      const emptySteps = pendingSide.generatedSteps.map((step) => ({ ...step, name: '' }));
      setEnId(pendingSide.enId);
      setKnowledgeContent(pendingSide.knowledgeContent);
      setKnowledgeDesc(pendingSide.knowledgeDesc);
      setAnswerTone(pendingSide.answerTone);
      setOutputConstraints(pendingSide.outputConstraints);
      setSteps(emptySteps);
      setActionChains([{ id: 1, name: '标准闭环动作链', steps: emptySteps }]);
      pendingGoalDraftSideRef.current = null;
    }

    try {
      for (const item of checkedWithField) {
        const nextValue = (item.value || item.label.replace(/^[^：:]+[：:]\s*/, '')).trim();
        if (!nextValue) continue;
        await typewriterWriteToField(item.fieldKey, nextValue);
        if (confirmTypewriterRef.current.cancelled) break;
        writtenKeys.push(item.fieldKey);
      }

      if (writtenKeys.length > 0) {
        const sections = [...new Set(writtenKeys.map(sectionForConfirmField))];
        setCompletedSteps((prev) => [...new Set([...prev, ...sections])]);

        // 仅在跟随 UI 写入时闪一下；后台写入不抢注意力
        if (confirmTypewriterRef.current.followUi) {
          requestAnimationFrame(() => {
            flashConfirmWrittenFields(writtenKeys);
          });
        }
      }
    } finally {
      setIsUpdatingForm(false);
      writtenKeys.forEach((key) => setConfirmFieldTyping(key, false));
    }
  };

  const computeSkillDraftFromGoal = (raw: string) => {
    const extractedCn = extractSkillTitleFromGoal(raw);
    const extractedEn = `skill_${Math.abs(
      Array.from(extractedCn).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
    )
      .toString(36)
      .slice(0, 8)}`;
    const intro =
      (
        raw
          .replace(/^[\s\S]*[」』”"]技能[：:]?\s*/, '')
          .replace(/^帮我做[一个]*[「『"']?[^」』"']+[」』"']?\s*技能[：:]?\s*/, '')
          .replace(/^[。．.!！?？、，,\s]+/, '')
          .trim() || raw.trim()
      ).slice(0, 50) || extractedCn;
    const trigger =
      `当用户表达“${extractedCn}”相关意图（如查询进度、办理状态、下一步怎么走），并提供必要业务标识（服务单号 / 订单号等）时触发；可用手机号后四位做轻量核验。`.slice(
        0,
        200,
      );
    const forbiddenCond =
      `非“${extractedCn}”业务范围；缺少关键业务标识且用户拒绝补充；情绪严重失控、明确要求投诉升级，或需越权改单 / 承诺赔付时，不该使用本技能。`.slice(
        0,
        200,
      );
    const inputIn =
      `用户自然语言诉求；必要业务标识（如延保服务单号、订单号、物流单号）；可选核验信息（手机号后四位）；用户对时效 / 寄回 / 进度节点的追问。`.slice(
        0,
        200,
      );
    const outputOut =
      `当前办理节点与可读状态说明；预计时效或下一步动作；若不可办理则给出原因与可执行替代路径（含是否需转人工）。`.slice(
        0,
        200,
      );
    const step1Name = '核验诉求与业务标识';
    const step2Name = '查询并组织结论';
    const generatedSteps: ExecutionStep[] = [
      {
        id: 1,
        name: step1Name,
        description:
          '解析用户意图是否属于本技能范围；检查服务单号 / 订单号等必要标识是否齐全；缺失时礼貌追问，齐全后做轻量核验（如手机号后四位）再进入查询。',
        example:
          '用户：“帮我查一下延保修到哪了，单号 XB20260301。”→ 确认属进度查询，核验标识通过后进入查询步骤。',
        associatedScripts: selectedScripts.length > 0 ? [selectedScripts[0]] : [],
        associatedKBs: [] as string[],
        associatedDocs: [] as string[],
      },
      {
        id: 2,
        name: step2Name,
        description:
          '调用挂载脚本 / 知识库获取真实状态；将内部节点转成用户可理解的进度说明；给出下一步建议话术；异常或越权诉求则按托底策略阻断并转人工。',
        example:
          '返回：“您的延保单当前在质检环节，预计 2 个工作日内寄回；如需加急请说明，我帮您转专席。”',
        associatedScripts: [] as string[],
        associatedKBs: selectedKBs.length > 0 ? [selectedKBs[0]] : [],
        associatedDocs: [] as string[],
      },
    ];
    const notAllowed =
      `严禁越权改单、擅自承诺赔付或时效标准、伪造进度；不得泄露后台接口、内部工单号规则或未授权写操作；不得在未核验标识时直接查询并回传完整客户资料。`.slice(
        0,
        500,
      );
    const fallback =
      `当标识缺失且用户拒绝补充、系统接口超时 / 报错、或诉求超出本技能范围时：明确告知需人工处理，安抚后转接专席，并同步已收集的业务标识，避免用户重复说明。`.slice(
        0,
        500,
      );
    const contentRedLines =
      `不编造进度与时效；不泄露内部工单、仓库地址、接口细节；不输出未授权的客户隐私字段；不确定时说明“以系统实时状态为准”并引导核验或转人工。`.slice(
        0,
        500,
      );
    const usageExamples = [
      `用户："帮我查一下延保进度，单号 XB20260301。"`,
      `数字员工：启用“${extractedCn}”，核验单号后返回当前节点、预计时效与下一步建议。`,
      ``,
      `用户："修到哪一步了？什么时候寄回？"`,
      `数字员工：确认标识后说明当前环节与寄回预估；若系统无时效则如实说明并给出跟进方式。`,
    ].join('\n');
    const customNotes =
      `高峰或接口延迟时，3 秒内先告知用户“正在查询，请稍候”；同一会话内已核验的标识可复用，避免重复追问；多单并存时请用户确认目标单号再继续。`;
    const actionChainSummary = [
      `1. ${step1Name}`,
      `说明：${generatedSteps[0].description}`,
      `实例：${generatedSteps[0].example}`,
      ``,
      `2. ${step2Name}`,
      `说明：${generatedSteps[1].description}`,
      `实例：${generatedSteps[1].example}`,
      ``,
      `（写入表单步骤名：${step1Name} → ${step2Name}）`,
    ].join('\n');

    return {
      extractedCn,
      side: {
        enId: extractedEn,
        generatedSteps,
        knowledgeContent: `围绕“${extractedCn}”完成标识核验、状态查询与可读结论输出；优先使用已挂载脚本取数，知识库补充话术与规则口径。`,
        knowledgeDesc:
          '执行前先核验必要标识；查询结果须转成用户可理解的节点说明；异常与越权统一走托底与内容红线。',
        answerTone: '先结论后依据，语气克制清晰；涉及时效用“预计”表述，避免绝对承诺。',
        outputConstraints: '结论须简明，含状态与下一步；严禁泄露后台地址与内部字段。',
      },
      confirmItems: [
        toConfirmItem('cnName', '技能名称', extractedCn),
        toConfirmItem('businessProblem', '一句话介绍', intro),
        toConfirmItem('triggerCond', '触发条件', trigger),
        toConfirmItem('forbiddenCond', '不该使用的情况', forbiddenCond),
        toConfirmItem('coreInputIn', '用户输入信息', inputIn),
        toConfirmItem('coreInputOut', '产出物', outputOut),
        toConfirmItem('actionChain', '执行步骤', actionChainSummary),
        toConfirmItem('notAllowed', '禁止行为', notAllowed),
        toConfirmItem('contentRedLines', '内容红线', contentRedLines),
        toConfirmItem('fallback', '托底策略', fallback),
        toConfirmItem('usageExamples', '使用示例', usageExamples),
        toConfirmItem('customNotes', '补充资料', customNotes),
      ],
    };
  };

  const runGoalDraftPipeline = useCallback(
    (goalText: string, clarifyNote?: string) => {
      const enrichedGoal = clarifyNote
        ? `${goalText.trim()}\n\n【补充信息】\n${clarifyNote}`
        : goalText.trim();
      const plan = buildIntentThinkPlan(enrichedGoal);
      startThinkThen(
        {
          title: plan.title,
          steps: plan.steps,
          planSteps: plan.planSteps,
          totalMs: plan.totalMs,
        },
        () => {
          const draft = computeSkillDraftFromGoal(enrichedGoal);
          pendingGoalDraftSideRef.current = draft.side;
          setDraftConfirmed(false);
          setRightCollapsed(true);
          setChatStep(5);
          pushAiTurn([
            clarifyNote
              ? SKILL_CREATE_CHAT.clarifyReceived
              : SKILL_CREATE_CHAT.clarifySkippedAck,
            { sender: 'system_status', content: SKILL_CREATE_CHAT.confirmPrompt },
            {
              sender: 'skill_confirm',
              content: JSON.stringify({
                items: draft.confirmItems,
                confirmed: false,
                title: '请确认技能草案',
              }),
            },
          ]);
        },
        { seedText: enrichedGoal },
      );
    },
    [pushAiTurn, selectedKBs, selectedScripts],
  );

  const continueAfterClarify = useCallback(
    (payload: SkillClarifyPayload) => {
      const goalText = pendingGoalRef.current;
      if (!goalText) return;
      pendingGoalRef.current = null;
      const clarifyNote = payload.skipped ? undefined : formatClarifyAnswers(payload.questions);
      runGoalDraftPipeline(goalText, clarifyNote);
    },
    [runGoalDraftPipeline],
  );

  // Conversational interface logic
  const handleSendChatMessage = (forcedText?: string) => {
    const attachmentBlock =
      forcedText === undefined ? buildComposerAttachmentBlock(composerAttachments) : '';
    const baseText = forcedText !== undefined ? forcedText : chatInput;
    const textToSend = [baseText.trim(), attachmentBlock].filter(Boolean).join('\n\n');
    if (!textToSend.trim()) {
      if (confirmEditTarget && forcedText === undefined) {
        showToast('请输入修改内容');
      } else if (forcedText === undefined) {
        showToast('请输入内容或上传附件');
      }
      return;
    }

    const clearComposerOnSend = () => {
      if (forcedText !== undefined) return;
      setChatInput('');
      setComposerAttachments([]);
      setComposerConsumedChipIds([]);
    };

    const isResetRequirementsSend =
      composerResetMode && forcedText === undefined && !confirmEditTarget;

    if (isResetRequirementsSend) {
      pendingResetRequirementsRef.current = true;
      setComposerResetMode(false);
      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.sender !== 'skill_confirm') return m;
          try {
            const payload = JSON.parse(m.content) as { confirmed?: boolean };
            if (!payload.confirmed) {
              return {
                ...m,
                content: JSON.stringify({ ...payload, confirmed: true, superseded: true }),
              };
            }
          } catch {
            /* ignore */
          }
          return m;
        }),
      );
    }

    /** 批量编辑：已选要点以芯片带入输入框，交由大模型按用户要求改写 */
    if (confirmEditTarget && forcedText === undefined) {
      const instruction = textToSend.trim();
      const { items: selectedItems } = confirmEditTarget;
      const summary = selectedItems
        .map((item) => `${item.itemIndex + 1}. ${item.hint}：${item.value || '（空）'}`)
        .join('\n');
      const outbound = `请按我的要求改写以下确认要点，并更新草案：\n${summary}\n\n修改要求：${instruction}`;
      setConfirmEditTarget(null);
      clearComposerOnSend();
      return handleSendChatMessage(outbound);
    }

    if (isAiThinking) {
      setMessageQueue(prev => [...prev, textToSend]);
      clearComposerOnSend();
      showToast('当前 AI 正在思考中，您的消息已加入发送队列，将在思考完成后自动处理');
      return;
    }

    setShowGuide(false);

    // 右侧有手动修改时：发送对话自动带上最新表单，不再弹阻断确认
    if (isFormDirty && forcedText === undefined) {
      setHistoryState({
        snapshot: lastSyncedState,
        messagesCountBeforeRound: chatMessages.length,
      });
      setIsFormDirty(false);
      setLastSyncedState(captureFullSnapshot());
    }

    const userText = textToSend.trim();

    if (userText === '重新开始' || userText === '重新设计' || userText === '重置' || userText === '重置引导') {
      handleResetGuide();
      clearComposerOnSend();
      return;
    }

    // Capture snapshot before this dialogue round modifies any state
    const preChangeSnapshot = captureFullSnapshot();
    setHistoryState({
      snapshot: preChangeSnapshot,
      messagesCountBeforeRound: chatMessages.length
    });

    const userMsg = {
      sender: 'user',
      name: '我',
      content: textToSend,
      timestamp: new Date().toTimeString().substring(0, 5)
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    if (forcedText === undefined) {
      setChatInput('');
      setComposerAttachments([]);
      setComposerConsumedChipIds([]);
      setComposerResetMode(false);
    }
    clearBubbleTimers();
    setIsAiThinking(true);
    thinkStartedAtRef.current = Date.now();

    if (!skillGoalReady || seedFirstTurnRef.current) {
      /** 先切到对话区，展示一轮补充信息反问，再拆解草案 */
      seedFirstTurnRef.current = false;
      pendingGoalRef.current = userText;
      setSkillGoalReady(true);
      setRightCollapsed(true);
      startThinkThen(
        buildClarifyThinkPlan(userText),
        () => {
          archiveThinkPlanToChat();
          setIsAiThinking(false);
          setThinkCotSteps([]); setTaskPlanSteps([]);
          setThinkCotGenerating(false); setTaskPlanGenerating(false);
          const questions = buildSkillClarifyQuestions(userText);
          const stamp = new Date().toTimeString().substring(0, 5);
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'ai',
              name: SKILL_CREATE_CHAT.assistantName,
              content: SKILL_CREATE_CHAT.clarifyLead,
              timestamp: stamp,
            },
            {
              sender: 'skill_clarify',
              name: SKILL_CREATE_CHAT.clarifyTitle,
              content: JSON.stringify({ questions } satisfies SkillClarifyPayload),
              timestamp: stamp,
            },
          ]);
        },
        { seedText: userText },
      );
      return;
    }

    startThinkThen(
      buildRoundThinkPlan(userText),
      () => {
      /** 本轮可连发多条；pushAiTurn 负责落库与结束 thinking */
      let aiBubbles: Array<string | { sender?: 'ai' | 'system_status'; content: string }> = [];

      if (pendingResetRequirementsRef.current) {
        pendingResetRequirementsRef.current = false;
        const resetItems = parseResetRequirementsToConfirmItems(userText) as SkillConfirmItem[];
        if (resetItems.length > 0) {
          setDraftConfirmed(false);
          setChatStep(5);
          aiBubbles = [
            '已根据你重新设置的要求拆解草案，请确认下方要点。',
            { sender: 'system_status', content: SKILL_CREATE_CHAT.confirmWriteHint },
            {
              sender: 'skill_confirm',
              content: JSON.stringify({
                items: resetItems,
                confirmed: false,
                title: '请确认重新设置后的要点',
              }),
            },
          ];
        } else {
          aiBubbles = [
            '未识别到【字段名】格式的要点，请补充标注后再发送改写。',
            '也可以说“补触发”“补红线”“生成动作链”按需修改。',
          ];
        }
        pushAiTurn(aiBubbles);
        return;
      }

      const looksLikeIntent =
        userText.trim().length >= 6 &&
        !/^(你好|您好|在吗|嗨|hi|hello)[.!！？\s]*$/i.test(userText.trim());
      const isMagicOnly =
        /^(我想)?创建(一个)?技能[.!！？\s]*$/.test(userText.trim()) ||
        userText.trim() === '创建技能' ||
        userText.trim() === '新增技能';
      const useRoundDefault = /默认|采用|继续|好的|好|嗯|可以|按这个/.test(userText) || userText.trim().length < 6;

      const stripComposerTags = (raw: string) =>
        raw
          .replace(/^【[^】]+】\s*/gm, '')
          .replace(/\n{2,}/g, '\n')
          .trim();
      const refineBody = stripComposerTags(userText);
      const looksLikePeChip =
        /^【/.test(userText.trim()) ||
        /^(?:补触发|补安全红线|生成动作链|补使用示例)/.test(refineBody);

      const fillDefinition = (raw: string) => {
        const extractedCn =
          raw.length > 24 ? `${raw.slice(0, 22)}…` : raw.replace(/[。.!！?？]+$/, '').slice(0, 30);
        const extractedEn = `skill_${Math.abs(
          Array.from(raw).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
        )
          .toString(36)
          .slice(0, 8)}`;
        setCnName(extractedCn);
        setEnId(extractedEn);
        setBusinessProblem(raw.slice(0, 50));
        setTriggerCond(`当用户表达“${raw.slice(0, 18)}”相关意图且提供必要标识时`);
        setForbiddenCond('非本技能业务范围；缺少关键上下文时');
        setCoreInputIn('用户诉求与必要业务标识（如单号、手机号后四位）');
        setCoreInputOut('结构化结论或进度说明 + 下一步引导');
        setDraftConfirmed(false);
        markFormSectionWritten(1);
        setChatStep(2);
        return extractedCn;
      };

      if ((chatStep === 0 || chatStep === 1) && isMagicOnly && !looksLikePeChip) {
        setChatStep(1);
        aiBubbles = [
          '好的。请直接描述业务能力，例如“查询京东延保服务单进度并告知处理节点”。',
          '也可以点选下方示例。说完第一轮后，我会把“技能定义”写到右侧。',
        ];
      } else if ((chatStep === 0 || chatStep === 1) && looksLikeIntent && !looksLikePeChip) {
        const extractedCn = fillDefinition(userText);
        aiBubbles = [
          `第一轮已写入“技能定义”：${extractedCn}。`,
          { sender: 'system_status', content: '已更新第 1 张卡片，下一轮进入技能主体' },
          '第二轮请告诉我技能怎么执行：步骤、知识或点“采用默认动作链”。',
        ];
      } else if (chatStep === 2 && !looksLikePeChip) {
        const generatedSteps = [
          {
            id: 1,
            name: '核验诉求与业务标识',
            description: useRoundDefault ? '解析用户意图，校验必要标识是否齐全。' : userText.slice(0, 200),
            example: '用户提供服务单号后，确认属于本技能可处理范围。',
            associatedScripts: selectedScripts.length > 0 ? [selectedScripts[0]] : [],
            associatedKBs: [] as string[],
            associatedDocs: [] as string[],
          },
          {
            id: 2,
            name: '查询并组织结论',
            description: '调用挂载资源获取状态，组织对用户可读的结论。',
            example: '返回当前处理节点与下一步建议话术。',
            associatedScripts: [] as string[],
            associatedKBs: selectedKBs.length > 0 ? [selectedKBs[0]] : [],
            associatedDocs: [] as string[],
          },
        ];
        setSteps(generatedSteps);
        setActionChains([{ id: 1, name: '标准闭环动作链', steps: generatedSteps }]);
        setKnowledgeContent(
          useRoundDefault
            ? `围绕“${cnName || '本技能'}”核验标识、查询状态并给出可读结论。`
            : userText.slice(0, 400),
        );
        setKnowledgeDesc('执行前先核验必要标识；查询结果需转成用户可理解的节点说明。');
        markFormSectionWritten(2);
        setChatStep(3);
        aiBubbles = [
          `第二轮已写入“技能主体”：${generatedSteps[0].name} → ${generatedSteps[1].name}。`,
          { sender: 'system_status', content: '已更新第 2 张卡片' },
          '第三轮请约定红线与兜底，或点“采用高安全防护线”。',
        ];
      } else if (chatStep === 3 && !looksLikePeChip) {
        const extractedNotAllowed = useRoundDefault
          ? '严禁越权改单、擅自承诺赔付标准、泄露后台接口或未授权写操作。'
          : userText.slice(0, 200);
        setNotAllowed(extractedNotAllowed);
        setFallback('阻断并回复：该请求需人工处理，正在为您转接专席…');
        setContentRedLines('不编造进度、不泄露内部工单与接口细节。');
        setAnswerTone('先结论后依据，语气克制清晰。');
        setOutputConstraints('结论须简明，含状态与下一步；严禁泄露后台地址。');
        markFormSectionWritten(3);
        setChatStep(4);
        aiBubbles = [
          `第三轮已写入“规范约束”：${extractedNotAllowed}`,
          { sender: 'system_status', content: '已更新第 3 张卡片' },
          '第四轮请补一条示例或备注，或点“采用默认说明”。',
        ];
      } else if (chatStep === 4 && !looksLikePeChip) {
        const extractedExamples =
          useRoundDefault
            ? `用户："帮我查一下进度"\n数字员工：启用本技能，核验标识后返回当前节点与下一步。`
            : `用户："${userText}"\n数字员工：启动当前技能并给出结构化结论。`;
        setUsageExamples(extractedExamples);
        setCustomNotes('高峰或接口延迟时，3 秒内告知用户稍候。');
        markFormSectionWritten(4);
        setChatStep(5);
        aiBubbles = [
          '第四轮已写入“补充说明”。四张卡片已齐。',
          { sender: 'system_status', content: '可点“展开配置”核对草案' },
          '需要时点右上角展开配置核对；确认后可测一条或校验发布。',
        ];
      } else if (
        chatStep === 5 ||
        chatStep === 10 ||
        chatStep === 11 ||
        chatStep >= 7 ||
        looksLikePeChip
      ) {
        type RefineTopic = 'io' | 'trigger' | 'chain' | 'safety' | 'examples' | null;
        const t = userText;
        const topic: RefineTopic =
          /补触发|触发边界|触发条件|禁止触发|阻断/.test(t) || t.includes('触发')
            ? 'trigger'
            : /红线|安全|禁止行为|异常处理|越权/.test(t)
              ? 'safety'
              : /动作链|动作步骤|执行流程|步骤/.test(t) || t.includes('挂载')
                ? 'chain'
                : /示例|使用说明|备注/.test(t)
                  ? 'examples'
                  : /输入|输出|流控|目标流|数据流/.test(t)
                    ? 'io'
                    : null;

        if (!draftConfirmed) setChatStep(5);
        let didPatch = false;
        let secondaryConfirmItems: SkillConfirmItem[] | null = null;

        if (topic === 'trigger') {
          didPatch = true;
          const cleaned = refineBody.replace(/^补触发边界[：:]?\s*/, '').trim();
          const instructional =
            cleaned.length < 16 || /请根据|写清何时|我想优化|再写具体/.test(cleaned);
          const extractedTrigger = instructional
            ? `当用户表达“${cnName || '该业务'}”相关意图，并提供必要业务标识（如单号）时`
            : cleaned.slice(0, 200);
          const nextForbidden = '非本技能范围、缺少关键标识、情绪严重失控或客诉升级时不该使用';
          setTriggerCond(extractedTrigger);
          setForbiddenCond(nextForbidden);
          markFormSectionWritten(1);
          secondaryConfirmItems = [
            toConfirmItem('triggerCond', '触发条件', extractedTrigger),
            toConfirmItem('forbiddenCond', '不该使用的情况', nextForbidden),
          ];
          aiBubbles = [`已更新表单“触发条件 / 不该使用的情况”。`, '请确认本轮变更要点。'];
        } else if (topic === 'io') {
          didPatch = true;
          const nextIn =
            /默认|标准|生成|流控/.test(t)
              ? '用户诉求与必要业务标识（如订单号、物流单号）'
              : t.replace(/^(?:补)?(?:输入|产出|流控)[：:]?\s*/, '').slice(0, 200) ||
                '用户诉求与必要业务标识';
          const nextOut =
            /默认|标准|生成|流控/.test(t)
              ? '是否可办理、办理路径、时效与费用规则，或不可办理原因'
              : '校验后给出明确方案与可执行下一步';
          setCoreInputIn(nextIn);
          setCoreInputOut(nextOut);
          markFormSectionWritten(1);
          secondaryConfirmItems = [
            toConfirmItem('coreInputIn', '用户输入信息', nextIn),
            toConfirmItem('coreInputOut', '产出物', nextOut),
          ];
          aiBubbles = ['已更新表单“用户输入信息 / 产出物”。', '请确认本轮变更要点。'];
        } else if (topic === 'chain') {
          didPatch = true;
          const generatedSteps = [
            {
              id: 1,
              name: '核验诉求与业务标识',
              description: '解析用户意图，校验必要标识是否齐全。',
              example: '用户提供服务单号后，确认属于本技能可处理范围。',
              associatedScripts: selectedScripts.length > 0 ? [selectedScripts[0]] : [],
              associatedKBs: [] as string[],
              associatedDocs: [] as string[],
            },
            {
              id: 2,
              name: '查询并组织结论',
              description: '调用挂载资源获取状态，组织对用户可读的结论。',
              example: '返回当前处理节点与下一步建议话术。',
              associatedScripts: [] as string[],
              associatedKBs: selectedKBs.length > 0 ? [selectedKBs[0]] : [],
              associatedDocs: [] as string[],
            },
          ];
          setSteps(generatedSteps);
          setActionChains([{ id: 1, name: '标准闭环动作链', steps: generatedSteps }]);
          markFormSectionWritten(2);
          secondaryConfirmItems = [
            toConfirmItem(
              'actionChain',
              '执行步骤',
              [
                `1. ${generatedSteps[0].name}`,
                `说明：${generatedSteps[0].description}`,
                `实例：${generatedSteps[0].example}`,
                ``,
                `2. ${generatedSteps[1].name}`,
                `说明：${generatedSteps[1].description}`,
                `实例：${generatedSteps[1].example}`,
                ``,
                `（写入表单步骤名：${generatedSteps[0].name} → ${generatedSteps[1].name}）`,
              ].join('\n'),
            ),
          ];
          aiBubbles = [
            `已更新表单“执行步骤”：${generatedSteps[0].name} → ${generatedSteps[1].name}`,
            '请确认本轮变更要点。',
          ];
        } else if (topic === 'safety') {
          didPatch = true;
          const extractedNotAllowed = /高安全|默认|红线/.test(t)
            ? '严禁越权改单、擅自承诺赔付标准、泄露后台接口或未授权写操作。'
            : t.replace(/^补安全红线[：:]?\s*/, '').slice(0, 500) ||
              '严格禁止执行任何未经授权的敏感写操作。';
          const nextRedLines = '不编造进度、不泄露内部工单与接口细节。';
          const nextFallback = '阻断并回复：该请求需人工处理，正在为您转接专席…';
          setNotAllowed(extractedNotAllowed);
          setContentRedLines(nextRedLines);
          setFallback(nextFallback);
          setOutputConstraints('结论须简明，含状态与下一步；严禁泄露后台地址。');
          markFormSectionWritten(3);
          secondaryConfirmItems = [
            toConfirmItem('notAllowed', '禁止行为', extractedNotAllowed),
            toConfirmItem('contentRedLines', '内容红线', nextRedLines),
            toConfirmItem('fallback', '托底策略', nextFallback),
          ];
          aiBubbles = ['已更新表单“禁止行为 / 内容红线 / 托底策略”。', '请确认本轮变更要点。'];
        } else if (topic === 'examples') {
          didPatch = true;
          const nextExamples =
            /默认|示例|说明/.test(t) && t.length < 24
              ? `用户："帮我查一下进度"\n数字员工：启用本技能，核验标识后返回当前节点与下一步。`
              : `用户："${t.replace(/^补使用示例[：:]?\s*/, '')}"\n数字员工：启动当前技能并给出结构化结论。`;
          const nextNotes = '高峰或接口延迟时，3 秒内告知用户稍候。';
          setUsageExamples(nextExamples);
          setCustomNotes(nextNotes);
          markFormSectionWritten(4);
          secondaryConfirmItems = [
            toConfirmItem('usageExamples', '使用示例', nextExamples),
            toConfirmItem('customNotes', '补充资料', nextNotes),
          ];
          aiBubbles = ['已更新表单“使用示例 / 补充资料”。', '请确认本轮变更要点。'];
        } else if (!draftConfirmed) {
          aiBubbles = ['草案要点已在下方确认卡中，请核对后点“确认执行”写入右侧。', '若要改某一类，可说“补触发 / 补红线 / 生成动作链 / 补示例”。'];
        } else {
          aiBubbles = [
            '可以说“补触发”“补红线”“生成动作链”“补示例”按需修改。',
            '也可以直接测一条或校验发布。',
          ];
        }

        if (didPatch) {
          setEditingMarkdown(null);
          showToast('已按你的说明更新对应要素');
          if (secondaryConfirmItems) {
            setDraftConfirmed(false);
            aiBubbles.push(
              { sender: 'system_status', content: '请确认下方本轮变更后再继续' },
              {
                sender: 'skill_confirm',
                content: JSON.stringify({
                  items: secondaryConfirmItems,
                  confirmed: false,
                  title: '请确认本轮变更要点',
                }),
              },
            );
          }
        }
      } else {
        aiBubbles = [
          '用一句话描述业务能力即可，例如“查询京东延保服务单进度”。',
          '也可以点选下方示例。四轮对话会依次写入右侧卡片。',
        ];
      }

      pushAiTurn(aiBubbles);
    },
      { seedText: userText },
    );
  };
  handleSendChatMessageRef.current = handleSendChatMessage;

  // Quick reset helper
  const handleResetGuide = () => {
    setHistoryState(null);
    setChatStep(0);
    setShowGuide(true);
    openFormSection(1);
    setCompletedSteps([5, 6]);
    setCnName('');
    setEnId('');
    setBusinessProblem('');
    setSkillKind('pure_doc');
    setTriggerCond('');
    setTiming('');
    setForbiddenCond('');
    setCoreInput('');
    setNotResp('');
    setNotAllowed('');
    setFallback('');
    setCustomNotes('');
    setSelectedScripts([]);
    setSelectedKBs([]);
    setCustomScripts([]);
    setCustomKBs([]);
    
    const resetSteps: ExecutionStep[] = [
      {
        id: 1,
        name: '',
        description: '',
        example: '',
        associatedScripts: [],
        associatedKBs: [],
        associatedDocs: []
      }
    ];
    setSteps(resetSteps);
    setActionChains([{ id: 1, name: '', steps: resetSteps }]);
    
    setInputPayload('');
    setOutputPayload('');
    setChatMessages([]);
    setDraftConfirmed(false);
    setConfirmEditTarget(null);
    setEditingUserMsgIndex(null);
    setEditingUserMsgDraft('');
    pendingGoalRef.current = null;
    pendingGoalDraftSideRef.current = null;
    setSkillGoalReady(false);
    setRightCollapsed(true);
    setGoalResourceOpen(false);
    setGoalResourceQuery('');
    setChatInput('');
    setComposerAttachments([]);
    setComposerConsumedChipIds([]);
    setComposerResetMode(false);
    showToast('已回到技能目标输入');

    // Set initial sync state after all sets
    setTimeout(() => {
      setLastSyncedState(captureFullSnapshot());
    }, 0);
  };

  // Helper to collect all validation errors based on Sections 1-4 requirements
  const getValidationErrors = () => {
    const missingFields: string[] = [];
    const overflowFields: string[] = [];

    // 第 1 部分 技能定义
    if (!cnName || !cnName.trim()) {
      missingFields.push('技能定义：技能名称');
    } else if (cnName.length > 30) {
      overflowFields.push('技能定义：技能名称 (超过30字上限)');
    }

    if (!enId || !enId.trim()) {
      missingFields.push('技能定义：英文代号');
    } else if (enId.length > 50) {
      overflowFields.push('技能定义：英文代号 (超过50字上限)');
    }

    if (!businessProblem || !businessProblem.trim()) {
      missingFields.push('技能定义：一句话介绍');
    } else if (businessProblem.length > 50) {
      overflowFields.push('技能定义：一句话介绍 (超过50字上限)');
    }

    if (!triggerCond || !triggerCond.trim()) {
      missingFields.push('技能定义：触发条件');
    } else if (triggerCond.length > 200) {
      overflowFields.push('技能定义：触发条件 (超过200字上限)');
    }

    if (forbiddenCond && forbiddenCond.length > 200) {
      overflowFields.push('技能定义：不该使用的情况 (超过200字上限)');
    }

    if (!coreInputIn || !coreInputIn.trim()) {
      missingFields.push('技能定义：用户输入信息');
    } else if (coreInputIn.length > 200) {
      overflowFields.push('技能定义：用户输入信息 (超过200字上限)');
    }

    if (!coreInputOut || !coreInputOut.trim()) {
      missingFields.push('技能定义：产出物');
    } else if (coreInputOut.length > 200) {
      overflowFields.push('技能定义：产出物 (超过200字上限)');
    }

    // 第 2 部分 技能主体（业务知识 / 执行步骤 二选一必填）
    if (knowledgeContent && knowledgeContent.length > 1000) {
      overflowFields.push('技能主体：知识内容 (超过1000字上限)');
    }
    if (knowledgeDesc && knowledgeDesc.length > 1000) {
      overflowFields.push('技能主体：知识说明 (超过1000字上限)');
    }

    const stepsList = actionChains[0]?.steps || [];
    const hasKnowledgeContent = (knowledgeContent && knowledgeContent.trim().length > 0) || (selectedKBs && selectedKBs.length > 0) || (knowledgeDesc && knowledgeDesc.trim().length > 0);
    const hasStepName = stepsList.some(s => s.name && s.name.trim().length > 0);

    if (skillBodyMode === 'knowledge') {
      if (!hasKnowledgeContent) {
        missingFields.push('技能主体：请填写业务知识（知识内容或知识说明）');
      }
    } else if (!hasStepName) {
      missingFields.push('技能主体：请至少填写一个执行步骤名称');
    }

    stepsList.forEach((step, idx) => {
      const stepLabel = step.name.trim() || `步骤 [${idx + 1}]`;
      if (step.name && step.name.length > 50) {
        overflowFields.push(`技能主体：${stepLabel} 的名称 (超过50字上限)`);
      }
      if (step.description && step.description.length > 1000) {
        overflowFields.push(`技能主体：${stepLabel} 的描述说明 (超过1000字上限)`);
      }
      if (step.stepKnowledge && step.stepKnowledge.length > 1000) {
        overflowFields.push(`技能主体：${stepLabel} 的步骤知识 (超过1000字上限)`);
      }
      if (step.example && step.example.length > 1000) {
        overflowFields.push(`技能主体：${stepLabel} 的运行实例 (超过1000字上限)`);
      }
    });

    // 第 3 部分 规范约束 (全员选填)
    if (notAllowed && notAllowed.length > 500) {
      overflowFields.push('规范约束：禁止行为 (超过500字上限)');
    }
    if (contentRedLines && contentRedLines.length > 500) {
      overflowFields.push('规范约束：内容红线 (超过500字上限)');
    }
    if (answerTone && answerTone.length > 200) {
      overflowFields.push('规范约束：回答口径 (超过200字上限)');
    }
    if (fallback && fallback.length > 500) {
      overflowFields.push('规范约束：托底策略 (超过500字上限)');
    }
    if (expressionStyle && expressionStyle.length > 200) {
      overflowFields.push('规范约束：表达风格 (超过200字上限)');
    }

    // 第 4 部分 补充说明
    if (usageExamples && usageExamples.length > 1000) {
      overflowFields.push('补充说明：示例 (超过1000字上限)');
    }
    if (customNotes && customNotes.length > 1000) {
      overflowFields.push('补充说明：补充资料 (超过1000字上限)');
    }

    return { missingFields, overflowFields };
  };

  const validateForm = () => {
    const errorFields: string[] = [];
    const errorMsgs: string[] = [];
    const sectionsToExpand = new Set<number>();

    // 1. 检查技能名称 (必填，且不能重复)
    const trimmedCnName = cnName.trim();
    const isDuplicateSkillName = trimmedCnName.length > 0 && skills.some(s => s.name.trim() === trimmedCnName && s.id !== draftSkillId);
    if (isDuplicateSkillName) {
      errorFields.push('field-cnName');
      errorMsgs.push(`技能名称“${trimmedCnName}”与现有技能库重复，请修改`);
      sectionsToExpand.add(1);
    } else if (!trimmedCnName) {
      errorFields.push('field-cnName');
      errorMsgs.push('技能定义：技能名称未填写');
      sectionsToExpand.add(1);
    }

    // 2. 检查技能标识 (必填)
    const trimmedEnId = enId.trim();
    if (!trimmedEnId) {
      errorFields.push('field-enId');
      errorMsgs.push('技能定义：英文代号未填写');
      sectionsToExpand.add(1);
    }

    // 3. 检查能力简介 (必填)
    if (!businessProblem || !businessProblem.trim()) {
      errorFields.push('field-businessProblem');
      errorMsgs.push('技能定义：一句话介绍未填写');
      sectionsToExpand.add(1);
    }

    // 4. 检查触发条件 (必填)
    if (!triggerCond || !triggerCond.trim()) {
      errorFields.push('field-triggerCond');
      errorMsgs.push('技能定义：触发条件未填写');
      sectionsToExpand.add(1);
    }

    // 5. 检查用户输入信息 (必填)
    if (!coreInputIn || !coreInputIn.trim()) {
      errorFields.push('field-coreInputIn');
      errorMsgs.push('技能定义：用户输入信息未填写');
      sectionsToExpand.add(1);
    }

    // 6. 检查产出物 (必填)
    if (!coreInputOut || !coreInputOut.trim()) {
      errorFields.push('field-coreInputOut');
      errorMsgs.push('技能定义：产出物未填写');
      sectionsToExpand.add(1);
    }

    // 7. 检查技能主体（业务知识 / 执行步骤 二选一必填）
    const stepsList = actionChains[0]?.steps || [];
    const hasKnowledgeContent = (knowledgeContent && knowledgeContent.trim().length > 0) || (selectedKBs && selectedKBs.length > 0) || (knowledgeDesc && knowledgeDesc.trim().length > 0);
    const hasStepName = stepsList.some(s => s.name && s.name.trim().length > 0);

    if (skillBodyMode === 'knowledge') {
      if (!hasKnowledgeContent) {
        errorFields.push('field-knowledgeContent');
        errorMsgs.push('技能主体：请填写业务知识');
        sectionsToExpand.add(2);
      }
    } else if (!hasStepName) {
      errorFields.push('field-steps-container');
      errorMsgs.push('技能主体：请至少填写一个执行步骤名称');
      sectionsToExpand.add(2);
    }

    if (skillBodyMode === 'steps' && hasStepName) {
      const stepNames = stepsList.map(s => s.name.trim()).filter(n => n.length > 0);
      stepsList.forEach((st, idx) => {
        const fId = `field-step-name-${st.id}`;
        if (st.name && st.name.trim().length > 0 && stepNames.filter(n => n === st.name.trim()).length > 1) {
          if (!errorFields.includes(fId)) {
            errorFields.push(fId);
            errorMsgs.push(`技能主体：步骤 [${idx + 1}] 名称“${st.name.trim()}”与其他步骤重复`);
            sectionsToExpand.add(2);
          }
        }
      });
    }

    // 规范约束 (兜底策略等均为选填，不作强校验)

    // 检查字数上限
    const { overflowFields } = getValidationErrors();

    if (errorFields.length > 0 || overflowFields.length > 0) {
      if (sectionsToExpand.size > 0) {
        openFormSection(Math.min(...sectionsToExpand));
      }

      // 展开存在错误的步骤
      stepsList.forEach(st => {
        if (errorFields.includes(`field-step-name-${st.id}`)) {
          const stepKey = `${actionChains[0]?.id || 1}-${st.id}`;
          setCollapsedSteps(prev => prev.filter(k => k !== stepKey));
        }
      });

      setValidationErrorFields(new Set(errorFields));

      const allErrors = [...errorMsgs, ...overflowFields];
      setValidationPromptBanner({ show: true, messages: allErrors });

      showToast(`⚠️ 包含未补充的必填项，已高亮并滚动到首个待填项！`);

      if (centerTabRef.current === 'form') {
        // 页面直接平滑滚动跳转到第一个未填的必填项
        const firstErrorFieldId = errorFields[0];
        if (firstErrorFieldId) {
          const sectionForError =
            firstErrorFieldId.startsWith('field-notAllowed') ||
            firstErrorFieldId.includes('contentRedLines') ||
            firstErrorFieldId.includes('fallback')
              ? 3
              : firstErrorFieldId.includes('usageExamples') || firstErrorFieldId.includes('customNotes')
                ? 4
                : firstErrorFieldId.includes('knowledge') ||
                    firstErrorFieldId.includes('step') ||
                    firstErrorFieldId.includes('action')
                  ? 2
                  : 1;
          openFormSection(sectionForError);
          setTimeout(() => {
            const el = document.getElementById(firstErrorFieldId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus?.();
            }
          }, 120);
        }
      }

      return false;
    }

    setValidationErrorFields(new Set());
    setValidationPromptBanner({ show: false, messages: [] });
    return true;
  };

  const handleSaveAsDraft = () => {
    const finalCnName = cnName.trim() || enId.trim() || '未命名技能';
    const draftData = captureStateSnapshot();
    const descStr = triggerCond || '草稿态专属技能';
    const actualKind = skillKind === 'pure_doc' ? 'kb' : 'tool';
    const hasScripts = selectedScripts.length > 0;
    const hasKBs = selectedKBs.length > 0;
    const targetId = boundDraftSkillId || draftSkillId || null;

    if (targetId) {
      updateSkill(targetId, {
        name: finalCnName,
        description: descStr,
        status: 'draft',
        kind: actualKind,
        hasScripts,
        hasKBs,
        draftData: draftData
      });
      const sk = skills.find((s) => s.id === targetId);
      if (sk) onPublished?.({ ...sk, name: finalCnName, description: descStr, status: 'draft', draftData });
      setBoundDraftSkillId(targetId);
    } else {
      const newSkill = createSkill(finalCnName, descStr, 'mine', actualKind, hasScripts, hasKBs);
      updateSkill(newSkill.id, {
        status: 'draft',
        draftData: draftData
      });
      setBoundDraftSkillId(newSkill.id);
      onPublished?.({ ...newSkill, status: 'draft', draftData });
    }
    setIsFormDirty(false);
    setIsDraftDirty(false);
    showToast('已保存到“我的技能”');
  };

  // Run auto fix sub-sequence（合计约 10s，与顶栏“发布中”加载态同步）
  const runAutoFixSequence = () => {
    const addLog = (msg: string) => {
      setRepairLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const stillRunning = () => isVerifyingRef.current;

    addLog('🚀 正在启动云侧智能集成编译器与安全分析引擎...');

    const steps: Array<{ at: number; run: () => void }> = [
      {
        at: 800,
        run: () => {
          setRepairSkillMd('checking');
          addLog('🔍 [1/3] 正在对生成的 SKILL.md Markdown 结构与词法规范进行深度诊断...');
        },
      },
      {
        at: 2200,
        run: () => {
          setRepairSkillMd('fixing');
          setRepairAttemptsSkillMd(1);
          addLog('⚠️ 警告：发现 SKILL.md 文件中 metadata 头部属性和标准 schema 出现轻微词法偏差。');
          addLog('🤖 AI Co-pilot 正在自动校准 YAML 属性格式并执行语法微调 (第 1/3 次自动修复)...');
        },
      },
      {
        at: 3600,
        run: () => {
          setRepairSkillMd('success');
          addLog('✅ 自动修复通过！SKILL.md 标准规范语法已格式化并成功对齐。');
          setRepairPackageStruct('checking');
          addLog('🔍 [2/3] 正在扫描技能包的物理链路依赖、绑定文件及 TS 自动化脚本连通性...');
        },
      },
      {
        at: 5200,
        run: () => {
          setRepairPackageStruct('success');
          addLog('✅ 校验通过：引用资源配置无回路，本地沙盒脚本已完成自动化测试插桩。');
          setRepairSecurity('checking');
          addLog('🔍 [3/3] 正在对技能执行步骤进行安全审计，评估敏感信息防越权与执行注入风险...');
        },
      },
      {
        at: 7000,
        run: () => {
          setRepairSecurity('fixing');
          setRepairAttemptsSecurity(1);
          addLog('⚠️ 警告：检测到执行流程步骤中存在两处语义模糊的描述，易发生意图误判。');
          addLog('🤖 AI Co-pilot 正在生成标准的执行阻断门规，注入高安全性越权防护策略 (第 1/3 次)...');
        },
      },
      {
        at: 8800,
        run: () => {
          setRepairSecurity('success');
          addLog('✅ 安全拦截规则注入成功！提示词逻辑边界加固率达到 100%。安全通过。');
        },
      },
      {
        at: 10000,
        run: () => {
          const finalCnName = cnName.trim() || enId.trim();
          const descStr = triggerCond || '调用特定服务或工具，赋能数字员工运行更高级流控。';
          const actualKind = skillKind === 'pure_doc' ? 'kb' : 'tool';
          const hasScripts = selectedScripts.length > 0;
          const hasKBs = selectedKBs.length > 0;
          const targetId = boundDraftSkillId || draftSkillId || null;

          try {
            if (enId.includes('error')) {
              throw new Error('Service unavailable');
            }

            if (targetId) {
              updateSkill(targetId, {
                name: finalCnName,
                description: descStr,
                status: 'published',
                kind: actualKind,
                hasScripts,
                hasKBs,
                enId: enId.trim(),
                cnName: cnName.trim(),
                draftData: undefined,
              });
              const sk = skills.find((s) => s.id === targetId);
              if (sk) {
                onPublished?.({
                  ...sk,
                  name: finalCnName,
                  description: descStr,
                  status: 'published',
                  enId: enId.trim(),
                  cnName: cnName.trim(),
                  versionNote: publishVersionNoteRef.current,
                } as Skill & { versionNote?: string });
              }
            } else {
              const newSkill = createSkill(finalCnName, descStr, 'mine', actualKind, hasScripts, hasKBs);
              updateSkill(newSkill.id, {
                status: 'published',
                enId: enId.trim(),
                cnName: cnName.trim(),
              });
              onPublished?.({
                ...newSkill,
                status: 'published',
                enId: enId.trim(),
                cnName: cnName.trim(),
                versionNote: publishVersionNoteRef.current,
              } as Skill & { versionNote?: string });
            }

            addLog('🎉 [成功] 静态资源包部署全网发布成功！新版技能已在分布式智能大脑节点激活上线！');
            setVerifyStep(4);
            setVerifyPhase('success');
            setShowPublishVersionModal(false);
            showToast(`✨ 恭喜！专属技能 ${finalCnName} 已经校验合格并成功在云侧部署生效！`);
            if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
            window.setTimeout(() => {
              setIsVerifying(false);
              isVerifyingRef.current = false;
              onClose();
            }, 600);
          } catch {
            setVerifyPhase('deployment_failed');
            addLog('❌ [部署失败] 无法连接到部署服务，请稍后重试。');
          }
        },
      },
    ];

    steps.forEach(({ at, run }) => {
      window.setTimeout(() => {
        if (!stillRunning()) return;
        run();
      }, at);
    });
  };

  const fourRoundsDone = [1, 2, 3, 4].every((s) => completedSteps.includes(s));
  const skillPackageReady = getValidationErrors().missingFields.length === 0;
  const publishBlockedReason = !fourRoundsDone
    ? '请先完善右侧四张卡片'
    : null;

  const handleValidateAndPublish = () => {
    if (publishBlockedReason) {
      showToast(publishBlockedReason);
      setRightCollapsed(false);
      return;
    }
    if (!validateForm()) return;
    setPublishVersionNote('');
    publishVersionNoteRef.current = '';
    setShowPublishVersionModal(true);
  };

  const handleConfirmPublishVersion = () => {
    const note = publishVersionNote.trim();
    if (!note) {
      showToast('请填写版本描述');
      return;
    }
    publishVersionNoteRef.current = note;
    setShowPublishVersionModal(false);
    // 同步置位，避免 setState 未刷入 ref 时校验序列被跳过；顶栏图标进入约 10s 加载态
    isVerifyingRef.current = true;
    setIsVerifying(true);
    setVerifyStep(1);
    setVerifyPhase('auto_fix');
    setRepairLog([]);
    setRepairSkillMd('checking');
    setRepairPackageStruct('checking');
    setRepairSecurity('checking');
    runAutoFixSequence();
  };

  const handleConfirmAddTestCases = () => {
    if (testSource === 'manual') {
      const filled = manualRows.filter((r) => r.input.trim());
      if (filled.length === 0) {
        showToast('请至少填写一条输入场景');
        return;
      }
      const newCases = filled.map((row, idx) => {
        const extraBits = manualExtraCols
          .map((col) => {
            const v = (row.extra[col.id] || '').trim();
            return v ? `${col.name}：${v}` : '';
          })
          .filter(Boolean);
        const parts = [...extraBits, row.input.trim()].filter(Boolean);
        return {
          id: `case-${Date.now()}-${idx + 1}`,
          source: 'manual' as const,
          input: parts.join('\n'),
          oracle: row.oracle.trim() || 'AI 自动根据执行合理性评定',
          status: 'ready' as const,
        };
      });
      setTestCases((prev) => [...newCases, ...prev]);
      setManualRows(
        [1, 2, 3].map((n) => ({
          id: `manual-row-${Date.now()}-${n}`,
          input: '',
          oracle: '',
          extra: {},
        })),
      );
      setManualExtraCols([]);
      showToast(`手动测试用例已加入用例集（${newCases.length} 条）`);
    } else if (testSource === 'upload') {
      const importedCases = [
        { id: `case-up-1`, source: 'upload' as const, input: '客户问：“已签收 20 天的数码产品可以申请无理由退货吗？”', oracle: '超期拦截，提示超过 7 天无理由退货期限', status: 'ready' as const },
        { id: `case-up-2`, source: 'upload' as const, input: '客户问：“商品有质量瑕疵，申请换货如何处理？”', oracle: '核实质量凭证后开具换货单', status: 'ready' as const },
      ];
      setTestCases((prev) => [...importedCases, ...prev]);
      setUploadFileName('');
      showToast('批量测试集文件导入成功');
    } else if (testSource === 'ai') {
      const count = Math.max(1, aiCount || 5);
      const types = ['标准正向咨询', '异常参数容错', '敏感红线拦截', '缺失参数反问', '高频并发压力', '多轮意图切换', '边缘条件回归'];
      const aiGeneratedCases = Array.from({ length: count }, (_, i) => {
        const idx = i + 1;
        const typeName = types[i % types.length];
        return {
          id: `case-ai-${Date.now()}-${idx}`,
          source: 'ai' as const,
          input: `测试输入：关于“${cnName || '智能技能'}”的第 ${idx} 条模拟测试请求（${typeName}）`,
          oracle: `AI 自动判定：符合“${cnName || '智能技能'}”的${typeName}规则且执行合规`,
          status: 'ready' as const,
        };
      });
      setTestCases((prev) => [...aiGeneratedCases, ...prev]);
      showToast(`AI 已成功自动生成 ${count} 条测试用例并加入用例库`);
    }

    setShowTestModal(false);
  };

  const handleLeaveWorkbench = () => {
    setShowLeaveConfirm(false);
    onClose();
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    // 智能创作入口：返回直接退出工作台，不再回落技能落地页（避免二次跳转）
    if (skillGoalReady && !closeLabel) {
      setSkillGoalReady(false);
      setRightCollapsed(true);
      setGoalResourceOpen(false);
      setIsAiThinking(false);
      setSkillTestOpen(false);
      setSkillTestPinned(false);
      return;
    }
    onClose();
  };

  const handleTryClose = () => {
    if (skillGoalReady) {
      setShowLeaveConfirm(true);
      return;
    }
    handleLeaveWorkbench();
  };

  const backButtonLabel = skillGoalReady && !closeLabel
    ? BACK_TO_CREATE_LABEL
    : (closeLabel ?? BACK_TO_SKILLS_LABEL);

  const PRESET_KNOWLEDGE_BASES = [
    '交通事故理赔报案流程与操作指引',
    '人身意外险保单权益变更说明（2026版）',
    '机动车商业保险费率调整通知',
    '家庭财产保险常见拒赔场景案例库',
    '健康险理赔审核标准说明',
    '互联网保险销售行为可回溯管理见解'
  ];

  const PRESET_STREAMS = [
    '物流状态深度追踪',
    '商品咨询',
    '智能导购专家',
    '理赔条件查询'
  ];

      const allAvailableScriptDefs = [
    { id: 'erp_script', name: 'ERP订单系统数据接口' },
    { id: 'claim_script', name: '理赔核算与自动代缴系统接口' },
    { id: 'crm_script', name: 'CRM客户资料与画像接口' },
    ...customScripts
  ];
  const mountedScriptsForSection2 = allAvailableScriptDefs.filter(s => selectedScripts.includes(s.id));
  const mountedKBsForSection2 = selectedKBs;

  const renderSavePublishButtons = () => {
    /** 与 SkillRoundConfirmCard 一致：次级 BTN_SOFT，主 CTA 渐变 PRIMARY */
    const softBtn = cn(BTN_SOFT, 'h-7 px-3 text-[13px]');
    const primaryBtn = cn(
      SKILL_AOP_PRIMARY_BTN,
      'h-7 px-3 rounded-md text-[13px] inline-flex items-center gap-1.5',
    );

    return (
    <>
      <div
        className="relative"
        onMouseEnter={openSkillTestPanel}
        onMouseLeave={scheduleCloseSkillTestPanel}
      >
        <button
          type="button"
          onClick={toggleSkillTestPanel}
          className={cn(
            softBtn,
            (skillTestOpen || skillTestPinned) && 'border-neutral-300',
          )}
          title="技能测试"
        >
          技能测试
          <span
            className={cn(
              'min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-semibold leading-none tabular-nums inline-flex items-center justify-center',
              skillTestOpen || skillTestPinned
                ? 'bg-[rgba(21,101,191,0.12)] text-[#1565BF]'
                : 'bg-neutral-100 text-neutral-500',
            )}
          >
            {testCases.length}
          </span>
        </button>
        {skillTestOpen && (
          <div
            className={cn(
              PANEL,
              'absolute right-0 top-[calc(100%+8px)] z-[80] w-[min(440px,92vw)] h-[min(520px,72vh)] flex flex-col overflow-hidden',
              'shadow-[0_8px_24px_rgba(31,35,41,0.08)] ring-1 ring-neutral-200/60',
              'animate-in fade-in slide-in-from-top-1 duration-200',
            )}
            onMouseEnter={openSkillTestPanel}
            onMouseLeave={scheduleCloseSkillTestPanel}
          >
            <div className="px-4 pt-4 pb-3 shrink-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-neutral-900 leading-snug">测试用例</h3>
                  <p className={cn(LIST_META, 'mt-0.5')}>
                    共 {testCases.length} 条 · 运行后可校验技能表现
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkillTestPinned(false);
                    setSkillTestOpen(false);
                  }}
                  className="shrink-0 -mr-1 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
                  title="关闭"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 rounded-[10px] bg-neutral-50 border border-neutral-200/70 px-2 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTestModal(true);
                    setTestSource('manual');
                  }}
                  className={cn(BTN_SOFT, 'h-7 px-3 text-[13px] gap-1 shrink-0')}
                >
                  <Plus size={12} />
                  新增
                </button>
                <div className="flex-1 min-w-0" />
                <button
                  type="button"
                  disabled={selectedCaseIds.length === 0}
                  onClick={() => handleExecuteR1TestBatch(selectedCaseIds)}
                  className={cn(BTN_SOFT, 'h-7 px-3 text-[13px] gap-1 shrink-0 disabled:opacity-40')}
                >
                  <Play size={11} />
                  运行选中{selectedCaseIds.length > 0 ? ` ${selectedCaseIds.length}` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteR1TestBatch()}
                  className={cn(
                    SKILL_AOP_PRIMARY_BTN,
                    'h-7 px-3 rounded-md text-[13px] gap-1 shrink-0 inline-flex items-center',
                  )}
                >
                  <Play size={11} />
                  全部测试
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 custom-scrollbar" data-skill-test-panel>
              <div className="rounded-[10px] bg-[#F9F9FB] border border-neutral-200/60 p-2 min-h-full space-y-2">
                <label className="flex items-center gap-2 px-2 py-1 text-[11px] text-neutral-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={testCases.length > 0 && selectedCaseIds.length === testCases.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCaseIds(testCases.map((c) => c.id));
                      } else {
                        setSelectedCaseIds([]);
                      }
                    }}
                    className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-300/40"
                  />
                  全选
                </label>
              {testCases.map((item) => {
                const isSelected = selectedCaseIds.includes(item.id);
                const isEditing = editingCaseId === item.id;
                const sourceLabel =
                  item.source === 'ai' ? 'AI 生成' : item.source === 'upload' ? '导入' : '手动';
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-[10px] border px-3 py-2.5 transition-all duration-200',
                      isSelected
                        ? SKILL_AOP_SELECTED_ROW
                        : 'border-neutral-200/80 bg-white hover:border-neutral-300/80 hover:shadow-[0_2px_8px_rgba(31,35,41,0.04)]',
                    )}
                  >
                    <div className="flex items-center gap-2 min-h-[24px]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCaseIds((prev) => [...prev, item.id]);
                          } else {
                            setSelectedCaseIds((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                        className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-300/40 shrink-0"
                      />
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0',
                          item.source === 'ai' ? SKILL_AOP_CHIP : cn(CHIP, 'py-0.5'),
                        )}
                      >
                        {sourceLabel}
                      </span>
                      <span className="flex-1 min-w-0" />
                      {item.status === 'passed' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                          <CheckCircle size={11} />
                          通过
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 shrink-0"
                          title={item.failureReason}
                        >
                          <AlertTriangle size={11} />
                          失败
                        </span>
                      )}
                      {item.status === 'ready' && (
                        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200/80 shrink-0">
                          待测
                        </span>
                      )}
                      {!isEditing ? (
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCaseId(item.id);
                              setEditInput(item.input);
                              setEditOracle(item.oracle);
                            }}
                            className="w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition"
                            title="编辑"
                          >
                            <FileText size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTestCases((prev) => prev.filter((c) => c.id !== item.id));
                              setSelectedCaseIds((prev) => prev.filter((id) => id !== item.id));
                              showToast('已删除用例');
                            }}
                            className="w-7 h-7 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition"
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2 pl-6">
                        <textarea
                          rows={2}
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          className={cn(FIELD, 'text-[12px] leading-relaxed px-2.5 py-2 resize-none')}
                          placeholder="测试输入"
                        />
                        <textarea
                          rows={2}
                          value={editOracle}
                          onChange={(e) => setEditOracle(e.target.value)}
                          className={cn(FIELD, 'text-[12px] leading-relaxed px-2.5 py-2 resize-none')}
                          placeholder="期望结果"
                        />
                        <div className="flex justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setEditingCaseId(null)}
                            className={cn(BTN_SOFT, 'h-7 px-3 text-[13px]')}
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTestCases((prev) =>
                                prev.map((c) =>
                                  c.id === item.id ? { ...c, input: editInput, oracle: editOracle } : c,
                                ),
                              );
                              setEditingCaseId(null);
                              showToast('已更新用例');
                            }}
                            className={cn(
                              SKILL_AOP_PRIMARY_BTN,
                              'h-7 px-3 rounded-md text-[13px]',
                            )}
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1.5 pl-6">
                        <p className="text-[12px] text-neutral-800 leading-relaxed border-l-2 border-[rgba(21,101,191,0.22)] pl-2.5">
                          {item.input}
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed pl-2.5">
                          <span className="text-neutral-400">期望 · </span>
                          {item.oracle}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleSaveAsDraft}
        disabled={!isDraftDirty}
        title={isDraftDirty ? '保存到“我的技能”' : '已保存，修改后可再次保存'}
        className={softBtn}
      >
        保存草稿
      </button>
      <button
        type="button"
        onClick={handleValidateAndPublish}
        disabled={isVerifying || Boolean(publishBlockedReason)}
        title={publishBlockedReason || '发布技能'}
        className={primaryBtn}
      >
        {isVerifying ? (
          <>
            <Loader2 size={13} className="animate-spin text-white" />
            发布中...
          </>
        ) : (
          <>
            <CheckCircle2 size={13} />
            发布技能
          </>
        )}
      </button>
    </>
    );
  };

  const savePublishButtons = renderSavePublishButtons();

  
  const expertModeFiles = useMemo(() => {
    const generatedMd = generateSkillMarkdown();
    return [
      {
        id: 'skill.md' as const,
        name: 'SKILL.md',
        path: 'SKILL.md',
        content: editingMarkdown !== null ? editingMarkdown : generatedMd,
        original: generatedMd,
        editable: true,
      },
      {
        id: 'handler.ts' as const,
        name: 'handler.ts',
        path: 'scripts/handler.ts',
        content: generateHandlerTs(),
        editable: false,
      },
      {
        id: 'schema.json' as const,
        name: 'schema.json',
        path: 'references/schema.json',
        content: generateSchemaJson(),
        editable: false,
      },
      {
        id: 'metadata.yaml' as const,
        name: 'metadata.yaml',
        path: 'metadata.yaml',
        content: generateMetadataYaml(),
        editable: false,
      },
    ];
  }, [
    editingMarkdown,
    cnName,
    enId,
    businessProblem,
    triggerCond,
    forbiddenCond,
    selectedScripts,
    selectedKBs,
    coreInputIn,
    coreInputProc,
    coreInputOut,
    knowledgeContent,
    knowledgeDesc,
    actionChains,
    isFormDirty,
  ]);

  const handleExpertMarkdownChange = useCallback((content: string) => {
    setEditingMarkdown(content);
    setIsFormDirty(true);
  }, []);

  if (!open) return null;

return (
    <div className="fixed inset-0 z-[240] bg-white flex flex-col w-screen h-screen overflow-hidden text-neutral-800 animate-in fade-in duration-200">
        {/* 落地页仅保留返回；进入对话后再显示顶栏 Tab / 操作区 */}
        {!skillGoalReady ? (
          <div className="absolute top-3 left-3 z-30">
            <button
              type="button"
              onClick={handleTryClose}
              title={backButtonLabel}
              className={cn(BTN_SOFT, 'shrink-0 gap-1.5 text-neutral-500 hover:text-neutral-800')}
            >
              <ArrowLeft size={14} />
              {backButtonLabel}
            </button>
          </div>
        ) : (
        <header className="h-14 shrink-0 flex bg-white select-none shadow-[0_1px_0_0_rgba(233,234,235,0.65)]">
          <div
            className="flex items-center px-3 shrink-0 min-w-0"
            style={{ width: rightCollapsed ? 'auto' : `${Math.max(leftWidth, 36)}%` }}
          >
            <button
              type="button"
              onClick={handleTryClose}
              title={backButtonLabel}
              className={cn(BTN_SOFT, 'shrink-0 gap-1.5 text-neutral-500 hover:text-neutral-800')}
            >
              <ArrowLeft size={14} />
              {backButtonLabel}
            </button>
          </div>
          {!rightCollapsed ? (
            <div className="flex-1 min-w-0 flex items-center justify-between px-2 gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setCenterTab('form')}
                  className={sidebarTabClass(centerTab === 'form')}
                >
                  <LayoutGrid size={16} className="shrink-0" />
                  <span className="inline-flex items-center gap-1.5">
                    业务视图
                    {dirtyFields.length > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    ) : null}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCenterTab('editor')}
                  className={sidebarTabClass(centerTab === 'editor')}
                >
                  <Code size={16} className="shrink-0" />
                  专家视图
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {savePublishButtons}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex items-center justify-end px-2 gap-2">
              {savePublishButtons}
            </div>
          )}
          <div className="flex items-center px-3 shrink-0">
            {renderSidebarWorkspaceToggle(rightCollapsed ? 'expand' : 'collapse')}
          </div>
        </header>
        )}

        {/* MAIN BODY: SPLIT TWO-COLUMN */}
        <div className="flex-1 min-h-0 flex bg-white overflow-hidden select-none">
          
          {/* LEFT PANEL: CONVERSATIONAL CHAT WINDOW / ZIP UPLOAD WINDOW */}
          <div 
            style={{ width: rightCollapsed ? '100%' : `${Math.max(leftWidth, 36)}%` }}
            className={cn(
              'flex flex-col min-h-0 relative shrink-0 transition-[width] duration-200 select-text',
              skillGoalReady ? 'bg-[#F9F9FB]' : 'bg-white',
            )}
          >
            <input
              ref={chatFileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={COMPOSER_FILE_ACCEPT}
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) void addComposerAttachments(files);
                e.currentTarget.value = '';
              }}
            />
            {!skillGoalReady ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 pb-16 bg-white relative">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[min(560px,70%)] -translate-x-1/2 -translate-y-[55%] rounded-full bg-[rgba(21,101,191,0.09)] blur-[80px]"
              />
              <div className="w-full max-w-[860px] space-y-6 relative z-10 animate-in fade-in duration-200">
                  <div className="text-center space-y-3 pt-2">
                    <h1 className="text-[40px] sm:text-[44px] leading-[1.05] font-normal text-black tracking-tight">
                      要完成什么任务，我来帮你
                      <span className={cn('font-bold', SKILL_AOP_GRADIENT_TEXT)}>创建技能</span>
                    </h1>
                    <p className="text-[14px] leading-5 text-[#535862] mx-auto">
                      写清要完成的任务与边界，我们会拆进右侧四张卡片并持续帮你优化。
                    </p>
                  </div>

                  <div
                    className={cn(
                      'relative z-[2] flex flex-col gap-0 rounded-[16px] border border-white/90 bg-white/92 p-[13px]',
                      'shadow-[0_4px_24px_rgba(21,101,191,0.06),0_1px_0_rgba(255,255,255,0.8)_inset]',
                      'backdrop-blur-[8px]',
                    )}
                  >
                    <div className="relative">
                      {!chatInput && !isAiThinking ? (
                        <GoalComposerGhost
                          labels={GOAL_LANDING_TIPS.map((tip) => tip.label)}
                          tipIndex={goalGhostTipIndex}
                          onTipIndexChange={setGoalGhostTipIndex}
                          onAcceptTab={acceptGoalGhostTip}
                          variant="skill"
                        />
                      ) : null}
                      {showGoalRewriteTab && chatInput.trim() && !isAiThinking ? (
                        <div
                          className="absolute inset-x-0 top-0 z-[2] min-h-[80px] max-h-36 overflow-hidden px-1 pt-1 pb-2 text-[14px] leading-[21px] pointer-events-none whitespace-pre-wrap break-words"
                          aria-hidden
                        >
                          <span className="invisible">{chatInput}</span>
                          <button
                            type="button"
                            className="pointer-events-auto inline-flex items-center gap-0.5 h-[22px] ml-1 px-1.5 rounded-md border border-[#E9EAEB] bg-white text-[11px] font-medium text-[#535862] shadow-[0_1px_2px_rgba(17,17,17,0.04)] cursor-pointer hover:border-neutral-300 hover:text-neutral-800 align-[-4px]"
                            onClick={acceptGoalRewrite}
                            title="按 Tab 补写描述"
                          >
                            Tab <span className="text-[10px] leading-none">⇥</span>
                          </button>
                        </div>
                      ) : null}
                      <textarea
                        ref={chatComposerTextareaRef}
                        rows={3}
                        autoFocus
                        maxLength={1000}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' && !e.shiftKey) {
                            if (!chatInput.trim()) {
                              e.preventDefault();
                              acceptGoalGhostTip();
                              return;
                            }
                            if (showGoalRewriteTab) {
                              e.preventDefault();
                              acceptGoalRewrite();
                              return;
                            }
                          }
                          if (e.key === '@' && !chatInput.trim()) {
                            e.preventDefault();
                            setGoalResourceOpen(true);
                            return;
                          }
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setGoalResourceOpen(false);
                            handleSendChatMessage();
                          }
                        }}
                        aria-label="描述希望 Skill 完成的业务任务"
                        className="relative z-[1] w-full min-h-[80px] max-h-36 bg-transparent text-[14px] leading-[21px] px-1 pt-1 pb-2 outline-none resize-none text-[#181D27]"
                      />
                    </div>

                    {composerAttachments.length > 0 ? (
                      <div className="px-1 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {composerAttachments.map((file) => (
                          <span
                            key={file.id}
                            className={GOAL_INDEX_CHIP}
                            title={`${file.name} · ${file.sizeLabel}`}
                          >
                            <FileText size={12} className="text-neutral-500 shrink-0" />
                            <span className="truncate min-w-0">{file.name}</span>
                            <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
                              {file.sizeLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeComposerAttachment(file.id)}
                              className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                              aria-label={`移除 ${file.name}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {(selectedKBs.length > 0 || selectedScripts.length > 0) && (
                      <div className="px-1 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {selectedKBs.map((kb) => (
                          <span
                            key={`goal-kb-${kb}`}
                            className={GOAL_INDEX_CHIP}
                            title={kb}
                          >
                            <BookOpen size={12} className="text-neutral-500 shrink-0" />
                            <span className="truncate min-w-0">{kb}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedKBs((prev) => prev.filter((x) => x !== kb))}
                              className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                              aria-label={`移除 ${kb}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {selectedScripts.map((sid) => {
                          const name =
                            allAvailableScriptDefs.find((s) => s.id === sid)?.name || sid;
                          return (
                            <span
                              key={`goal-sc-${sid}`}
                              className={GOAL_INDEX_CHIP}
                              title={name}
                            >
                              <Code size={12} className="text-neutral-500 shrink-0" />
                              <span className="truncate min-w-0">{name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedScripts((prev) => prev.filter((x) => x !== sid))}
                                className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                                aria-label={`移除 ${name}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-end justify-between gap-3 px-1 pt-1">
                      <div className="flex items-center gap-1 min-w-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => chatFileInputRef.current?.click()}
                          className={cn(
                            'w-8 h-8 rounded-[7px] border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 flex items-center justify-center cursor-pointer shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.05)]',
                            composerAttachments.length > 0 && 'border-neutral-300',
                          )}
                          title="上传文件到输入框"
                        >
                          <Plus size={16} strokeWidth={2} />
                        </button>
                        <div className="relative" ref={goalResourcePanelRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setGoalResourceOpen((v) => !v);
                              setGoalResourceQuery('');
                            }}
                            className={cn(
                              'h-8 px-2.5 rounded-[7px] border text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition',
                              goalResourceOpen || selectedKBs.length + selectedScripts.length > 0
                                ? 'border-neutral-200 bg-white text-neutral-800 shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-neutral-50'
                                : 'border-transparent bg-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-200 hover:text-neutral-800',
                            )}
                          >
                            <BookOpen size={14} />
                            索引知识
                            {selectedKBs.length + selectedScripts.length > 0 ? (
                              <span className="text-[11px] tabular-nums text-neutral-500">
                                {selectedKBs.length + selectedScripts.length}
                              </span>
                            ) : null}
                          </button>
                          {goalResourceOpen && (
                            <div className="skill-goal-composer-menu absolute left-0 top-[calc(100%+6px)] z-[90] w-[min(340px,88vw)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-3 pt-2.5 pb-2 border-b border-neutral-100 space-y-2">
                                <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-[7px]">
                                  <button
                                    type="button"
                                    onClick={() => setGoalResourceTab('kb')}
                                    className={cn(
                                      'flex-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition cursor-pointer',
                                      goalResourceTab === 'kb'
                                        ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
                                        : 'text-neutral-500 hover:text-neutral-800',
                                    )}
                                  >
                                    知识库
                                    {selectedKBs.length > 0 ? ` · ${selectedKBs.length}` : ''}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGoalResourceTab('script')}
                                    className={cn(
                                      'flex-1 px-2.5 py-1 rounded-md text-[12px] font-medium transition cursor-pointer',
                                      goalResourceTab === 'script'
                                        ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
                                        : 'text-neutral-500 hover:text-neutral-800',
                                    )}
                                  >
                                    脚本
                                    {selectedScripts.length > 0 ? ` · ${selectedScripts.length}` : ''}
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  autoFocus
                                  value={goalResourceQuery}
                                  onChange={(e) => setGoalResourceQuery(e.target.value)}
                                  placeholder={
                                    goalResourceTab === 'kb'
                                      ? '搜索知识库名称…'
                                      : '搜索脚本名称…'
                                  }
                                  className={cn(FIELD, FIELD_CTRL, 'bg-neutral-50')}
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-0.5">
                                {goalResourceTab === 'kb'
                                  ? [...PRESET_KNOWLEDGE_BASES, ...customKBs]
                                      .filter((kb) =>
                                        !goalResourceQuery.trim()
                                          ? true
                                          : kb.toLowerCase().includes(goalResourceQuery.trim().toLowerCase()),
                                      )
                                      .map((kb) => {
                                        const checked = selectedKBs.includes(kb);
                                        return (
                                          <button
                                            key={kb}
                                            type="button"
                                            onClick={() =>
                                              setSelectedKBs((prev) =>
                                                checked ? prev.filter((x) => x !== kb) : [...prev, kb],
                                              )
                                            }
                                            className={cn(
                                              'w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition flex items-center gap-2 cursor-pointer',
                                              checked
                                                ? cn(SKILL_AOP_TINT_BG, SKILL_AOP_ACCENT_TEXT)
                                                : 'hover:bg-neutral-50 text-neutral-700',
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                                checked
                                                  ? cn(SKILL_AOP_GRADIENT_BG, 'border-transparent text-white')
                                                  : 'border-neutral-200 bg-white',
                                              )}
                                            >
                                              {checked ? <Check size={10} /> : null}
                                            </span>
                                            <span className="truncate">{kb}</span>
                                          </button>
                                        );
                                      })
                                  : allAvailableScriptDefs
                                      .filter((s) =>
                                        !goalResourceQuery.trim()
                                          ? true
                                          : s.name
                                              .toLowerCase()
                                              .includes(goalResourceQuery.trim().toLowerCase()),
                                      )
                                      .map((sc) => {
                                        const checked = selectedScripts.includes(sc.id);
                                        return (
                                          <button
                                            key={sc.id}
                                            type="button"
                                            onClick={() =>
                                              setSelectedScripts((prev) =>
                                                checked
                                                  ? prev.filter((x) => x !== sc.id)
                                                  : [...prev, sc.id],
                                              )
                                            }
                                            className={cn(
                                              'w-full text-left px-2.5 py-1.5 rounded-md text-[12px] transition flex items-center gap-2 cursor-pointer',
                                              checked
                                                ? cn(SKILL_AOP_TINT_BG, SKILL_AOP_ACCENT_TEXT)
                                                : 'hover:bg-neutral-50 text-neutral-700',
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                                checked
                                                  ? cn(SKILL_AOP_GRADIENT_BG, 'border-transparent text-white')
                                                  : 'border-neutral-200 bg-white',
                                              )}
                                            >
                                              {checked ? <Check size={10} /> : null}
                                            </span>
                                            <span className="truncate">{sc.name}</span>
                                          </button>
                                        );
                                      })}
                                {((goalResourceTab === 'kb'
                                  ? [...PRESET_KNOWLEDGE_BASES, ...customKBs]
                                  : allAvailableScriptDefs.map((s) => s.name)
                                ).filter((name) =>
                                  !goalResourceQuery.trim()
                                    ? true
                                    : name.toLowerCase().includes(goalResourceQuery.trim().toLowerCase()),
                                ).length === 0) && (
                                  <p className="text-[11px] text-neutral-400 text-center py-5">
                                    没有匹配结果
                                  </p>
                                )}
                              </div>
                              <div className="px-3 py-2 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/60">
                                <span className="text-[11px] text-neutral-400">
                                  已选 {selectedKBs.length} 知识库 · {selectedScripts.length} 脚本
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setGoalResourceOpen(false)}
                                  className="text-[12px] font-semibold text-neutral-800 hover:text-neutral-950 cursor-pointer"
                                >
                                  完成
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[12px] leading-5 text-neutral-400 tabular-nums">
                          {chatInput.length}/1000
                        </span>
                        {isAiThinking ? (
                          <button
                            type="button"
                            onClick={handleStopThinking}
                            className="w-8 h-8 rounded-[7px] bg-neutral-100 hover:bg-neutral-200 text-neutral-500 border border-neutral-200 flex items-center justify-center cursor-pointer shrink-0"
                            title="停止"
                          >
                            <Square size={12} className="fill-neutral-500" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!chatInput.trim() && composerAttachments.length === 0}
                            onClick={() => {
                              setGoalResourceOpen(false);
                              handleSendChatMessage();
                            }}
                            className={SKILL_AOP_SEND_BTN}
                            title="发送"
                          >
                            <ArrowUp size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {GOAL_LANDING_TIPS.map((item, tipIndex) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => applyGoalLandingTip(item.pe, tipIndex)}
                      className={cn(CHIP, 'h-8 max-w-[220px] text-neutral-700')}
                      title={item.pe}
                    >
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            ) : (
            <div className="flex-1 min-h-0 flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 pt-5 pb-5 overflow-y-auto min-h-0 custom-scrollbar-thin">
            <div className="w-full max-w-[720px] mx-auto px-4 space-y-3">
              {chatMessages.filter(msg => msg.sender !== 'system').map((msg, i) => {
                const msgKey = msg.timestamp ? `chat-${msg.sender}-${msg.timestamp}-${i}` : `chat-${i}`;
                if (msg.sender === 'skill_think') {
                  let thinkPayload: {
                    title?: string;
                    steps?: SkillThinkStep[];
                    durationSec?: number;
                  } = {};
                  try {
                    thinkPayload = JSON.parse(msg.content);
                  } catch {
                    /* keep defaults */
                  }
                  return (
                    <SkillThinkingCard
                      key={msgKey}
                      title={thinkPayload.title || SKILL_CREATE_CHAT.thinkDone}
                      steps={thinkPayload.steps || []}
                      durationSec={thinkPayload.durationSec ?? 0}
                      isComplete
                      className="!ml-0 mr-0"
                    />
                  );
                }

                if (msg.sender === 'skill_plan') {
                  let planPayload: {
                    title?: string;
                    steps?: SkillThinkStep[];
                    durationSec?: number;
                  } = {};
                  try {
                    planPayload = JSON.parse(msg.content);
                  } catch {
                    /* keep defaults */
                  }
                  return (
                    <SkillTaskPlanCard
                      key={msgKey}
                      title={planPayload.title || SKILL_CREATE_CHAT.planDone}
                      steps={planPayload.steps || []}
                      durationSec={planPayload.durationSec ?? 0}
                      isComplete
                      defaultExpanded={false}
                      className="!ml-0 mr-0"
                    />
                  );
                }

                // SPECIAL CARD 1: RUNNING PROGRESS CARD
                if (msg.sender === 'system_test_progress') {
                  return (
                    <div key={msgKey} className={SKILL_CHAT_CARD}>
                      <div className={SKILL_CHAT_CARD_HEAD}>
                        <div className="flex items-center gap-2 min-w-0">
                          <FlaskConical size={14} className="text-neutral-500 shrink-0" />
                          <span className="text-[14px] font-semibold text-neutral-600 leading-[22px]">正在跑测试…</span>
                        </div>
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 border', SKILL_AOP_TINT_BG, SKILL_AOP_TINT_BORDER, SKILL_AOP_ACCENT_TEXT)}>
                          进行中
                        </span>
                      </div>
                      <div className={SKILL_CHAT_CARD_BODY}>
                        <div className={SKILL_CHAT_CARD_PANEL}>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[12px] text-neutral-500">
                              <span>评估 6 条用例</span>
                              <span className="tabular-nums">82%</span>
                            </div>
                            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                              <div className={cn('h-full w-[82%] animate-pulse rounded-full', SKILL_AOP_GRADIENT_BG)} />
                            </div>
                          </div>
                          <div className="text-[12px] text-neutral-500 space-y-1 pt-1 border-t border-neutral-100">
                            <p className="flex items-center gap-1.5 text-emerald-700">
                              <Check size={12} className="shrink-0" />
                              <span>意图匹配：6/6</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-amber-700">
                              <span className="w-3 text-center shrink-0">!</span>
                              <span>未开票拦截：1 条异常</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // SPECIAL CARD 2: TEST REPORT SUMMARY CARD
                if (msg.sender === 'system_test_report') {
                  let data = { passRate: 82, total: 6, passed: 5, failed: 1, source: 'ai' };
                  try {
                    data = JSON.parse(msg.content);
                  } catch {
                    /* keep defaults */
                  }

                  return (
                    <div key={msgKey} className={SKILL_CHAT_CARD}>
                      <div className={SKILL_CHAT_CARD_HEAD}>
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                          <span className="text-[14px] font-semibold text-neutral-600 leading-[22px] truncate">
                            测试完成 · 通过率 {data.passRate}%
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleExecuteR1TestBatch()}
                          className={cn(BTN_OUTLINE, 'h-7 px-2.5 text-[11px] font-medium gap-1 shrink-0 cursor-pointer')}
                          title="复用同一批测试用例重新评估"
                        >
                          <RotateCcw size={11} />
                          重跑
                        </button>
                      </div>
                      <div className={SKILL_CHAT_CARD_BODY}>
                        <div className={SKILL_CHAT_CARD_PANEL}>
                          <p className="text-[12px] text-neutral-500">
                            {data.total} 条用例
                            {data.failed > 0 ? `，${data.failed} 条未通过` : '全部通过'}
                            {' · '}
                            {data.source === 'ai' ? 'AI 生成' : data.source === 'upload' ? 'Excel 导入' : '手动输入'}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={SKILL_CHAT_STAT_CELL}>
                              <div className="text-[11px] text-neutral-400">总用例</div>
                              <div className="text-[15px] font-semibold text-neutral-800 mt-0.5 tabular-nums">{data.total}</div>
                            </div>
                            <div className={cn(SKILL_CHAT_STAT_CELL, 'border-emerald-200 bg-emerald-50/50')}>
                              <div className="text-[11px] text-emerald-600/80">通过</div>
                              <div className="text-[15px] font-semibold text-emerald-700 mt-0.5 tabular-nums">{data.passed}</div>
                            </div>
                            <div className={cn(SKILL_CHAT_STAT_CELL, 'border-rose-200 bg-rose-50/50')}>
                              <div className="text-[11px] text-rose-600/80">失败</div>
                              <div className="text-[15px] font-semibold text-rose-600 mt-0.5 tabular-nums">{data.failed}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // SPECIAL CARD 3: AI SUGGESTIONS CARDS
                if (msg.sender === 'ai_test_suggestions') {
                  return (
                    <div key={msgKey} className={SKILL_CHAT_CARD}>
                      <div className={SKILL_CHAT_CARD_HEAD}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles size={14} className="text-neutral-500 shrink-0" />
                          <span className="text-[14px] font-semibold text-neutral-600 leading-[22px]">测试优化建议</span>
                        </div>
                      </div>
                      <div className={SKILL_CHAT_CARD_BODY}>
                        <div className={SKILL_CHAT_CARD_PANEL}>
                          <p className="text-[12px] text-neutral-500 leading-relaxed">{msg.content}</p>
                          <div className="space-y-2">
                            {aiSuggestions.map((sug, sugIndex) => {
                              const isApplied = appliedSuggestions.includes(sug.id);
                              const isIgnored = ignoredSuggestions.includes(sug.id);
                              if (isIgnored) return null;

                              const removedText = sug.diffRemoved.replace(/^\-\s*/, '');
                              const addedText = sug.diffAdded.replace(/^\+\s*/, '');

                              return (
                                <div
                                  key={sug.id}
                                  className={cn(
                                    SKILL_CHAT_SUGGESTION_ROW,
                                    isApplied && 'border-emerald-200 bg-emerald-50/40',
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[11px] font-medium text-neutral-400 shrink-0">
                                        建议 {sugIndex + 1}
                                      </span>
                                      <span className="text-neutral-200">·</span>
                                      <span className="text-[12px] font-medium text-neutral-700 truncate">
                                        {sug.fieldLabel}
                                      </span>
                                    </div>
                                    {isApplied ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                                        <CheckCircle size={11} />
                                        已写回
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shrink-0">
                                        失败用例
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[13px] text-neutral-700 leading-relaxed">{sug.reason}</p>

                                  <div className="rounded-md bg-neutral-50/40 overflow-hidden">
                                    <div className="px-2.5 py-1.5 text-[11px] text-neutral-400">
                                      改写预览
                                    </div>
                                    <div className="px-2.5 pb-2 space-y-1.5 text-[12px] leading-relaxed">
                                      <div className="rounded-md bg-rose-50/70 px-2.5 py-2 text-neutral-800">
                                        <span className="whitespace-pre-wrap break-words">{removedText}</span>
                                      </div>
                                      <div
                                        className={cn(
                                          'rounded-md px-2.5 py-2 text-neutral-800 border',
                                          SKILL_AOP_TINT_BG,
                                          SKILL_AOP_TINT_BORDER,
                                        )}
                                      >
                                        <span className="whitespace-pre-wrap break-words">{addedText}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChatInput(`针对【${sug.fieldLabel}】，我想微调改写为：`);
                                      }}
                                      className={cn(BTN_SOFT, 'h-7 px-3 text-[13px]')}
                                    >
                                      调整
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleIgnoreSuggestion(sug.id)}
                                      className={cn(BTN_SOFT, 'h-7 px-3 text-[13px]')}
                                    >
                                      忽略
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isApplied}
                                      onClick={() => handleApplySuggestion(sug.id)}
                                      className={cn(
                                        SKILL_AOP_PRIMARY_BTN,
                                        'h-7 px-3 rounded-md text-[13px] inline-flex items-center gap-1',
                                        isApplied && 'opacity-80 cursor-default',
                                      )}
                                    >
                                      <Check size={11} />
                                      {isApplied ? '已采纳' : '采纳'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.sender === 'skill_clarify') {
                  let payload: SkillClarifyPayload = { questions: [] };
                  try {
                    payload = JSON.parse(msg.content) as SkillClarifyPayload;
                  } catch {
                    payload = { questions: [] };
                  }
                  return (
                    <div key={msgKey} className="w-full animate-in fade-in duration-200">
                      <SkillClarifyCard
                        payload={payload}
                        onChange={(next) => {
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_clarify'
                                ? { ...m, content: JSON.stringify(next) }
                                : m,
                            ),
                          );
                        }}
                        onSubmit={(next) => {
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_clarify'
                                ? { ...m, content: JSON.stringify(next) }
                                : m,
                            ),
                          );
                          continueAfterClarify(next);
                        }}
                        onSkip={() => {
                          const skippedPayload: SkillClarifyPayload = {
                            ...payload,
                            skipped: true,
                            submitted: false,
                            collapsed: true,
                          };
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_clarify'
                                ? { ...m, content: JSON.stringify(skippedPayload) }
                                : m,
                            ),
                          );
                          continueAfterClarify(skippedPayload);
                        }}
                      />
                    </div>
                  );
                }

                if (msg.sender === 'skill_confirm') {
                  let payload: {
                    items?: SkillConfirmItem[];
                    confirmed?: boolean;
                    superseded?: boolean;
                    title?: string;
                    collapsed?: boolean;
                  } = {};
                  try {
                    payload = JSON.parse(msg.content);
                  } catch {
                    payload = {};
                  }
                  const hasNewerConfirm = chatMessages
                    .slice(i + 1)
                    .some((m) => m.sender === 'skill_confirm');
                  const locked =
                    !payload.confirmed && (Boolean(payload.superseded) || hasNewerConfirm);
                  return (
                    <div
                      key={msgKey}
                      className={cn(
                        'w-full animate-in fade-in duration-200',
                        locked && 'opacity-90',
                      )}
                    >
                      <SkillRoundConfirmCard
                        title={payload.title || '请确认本轮变更要点'}
                        items={payload.items ?? []}
                        confirmed={Boolean(payload.confirmed)}
                        locked={locked}
                        collapsed={
                          payload.collapsed != null
                            ? Boolean(payload.collapsed)
                            : Boolean(payload.confirmed) || locked
                        }
                        editingItemIds={
                          !locked && confirmEditTarget?.msgIndex === i
                            ? confirmEditTarget.items.map((item) => item.itemId)
                            : []
                        }
                        onEditItem={
                          locked
                            ? undefined
                            : (item, itemIndex) => {
                          setComposerConsumedChipIds([]);
                          setComposerResetMode(false);
                          const hint = item.fieldLabel || `要点 ${itemIndex + 1}`;
                          const value = (
                            item.value || item.label.replace(/^[^：:]+[：:]\s*/, '')
                          ).trim();
                          const nextItem = {
                            itemId: item.id,
                            itemIndex,
                            hint,
                            fieldKey: item.fieldKey,
                            value,
                          };

                          const prev = confirmEditTarget;
                          let nextTarget: typeof confirmEditTarget = null;
                          if (prev?.msgIndex === i) {
                            const exists = prev.items.some((row) => row.itemId === item.id);
                            const nextItems = exists
                              ? prev.items.filter((row) => row.itemId !== item.id)
                              : [...prev.items, nextItem].sort(
                                  (a, b) => a.itemIndex - b.itemIndex,
                                );
                            nextTarget =
                              nextItems.length === 0 ? null : { msgIndex: i, items: nextItems };
                          } else {
                            nextTarget = { msgIndex: i, items: [nextItem] };
                          }
                          setConfirmEditTarget(nextTarget);

                          requestAnimationFrame(() => {
                            chatComposerTextareaRef.current?.focus();
                            chatComposerTextareaRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                            });
                          });
                        }
                        }
                        onBatchModeChange={
                          locked
                            ? undefined
                            : (active) => {
                          if (!active && confirmEditTarget?.msgIndex === i) {
                            setConfirmEditTarget(null);
                          }
                        }
                        }
                        onItemsChange={
                          locked
                            ? undefined
                            : (items) => {
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_confirm'
                                ? {
                                    ...m,
                                    content: JSON.stringify({
                                      ...payload,
                                      items,
                                      confirmed: Boolean(payload.confirmed),
                                    }),
                                  }
                                : m,
                            ),
                          );
                        }
                        }
                        onCollapsedChange={(nextCollapsed) => {
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_confirm'
                                ? {
                                    ...m,
                                    content: JSON.stringify({
                                      ...payload,
                                      collapsed: nextCollapsed,
                                    }),
                                  }
                                : m,
                            ),
                          );
                        }}
                        onConfirm={
                          locked
                            ? () => {}
                            : (items) => {
                          void handleConfirmSkillItems(items);
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i && m.sender === 'skill_confirm'
                                ? {
                                    ...m,
                                    content: JSON.stringify({
                                      ...payload,
                                      items,
                                      confirmed: true,
                                      collapsed: true,
                                    }),
                                  }
                                : m,
                            ),
                          );
                        }
                        }
                        onDelete={
                          locked
                            ? undefined
                            : () => {
                          setChatMessages((prev) => prev.filter((_, idx) => idx !== i));
                          if (confirmEditTarget?.msgIndex === i) {
                            setConfirmEditTarget(null);
                            setChatInput('');
                          }
                        }
                        }
                      />
                    </div>
                  );
                }

                if (msg.sender === 'skill_artifact') {
                  const completedSections = [
                    cnName.trim(),
                    actionChains.some((chain) => chain.steps.some((step) => step.name.trim())),
                    notAllowed.trim() || contentRedLines.trim(),
                    usageExamples.trim() || customNotes.trim(),
                  ].filter(Boolean).length;

                  return (
                    <button
                      key={msgKey}
                      type="button"
                      onClick={() => {
                        setSkillArtifactDraft(editingMarkdown ?? generateSkillMarkdown());
                        setSkillArtifactOpen(true);
                      }}
                      className="group w-full rounded-xl border border-line bg-white p-4 text-left shadow-xs transition hover:border-neutral-300 hover:shadow-md cursor-pointer animate-in fade-in duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                          <FileText size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-[13px] font-semibold text-neutral-900">
                              {cnName || '未命名 Skill'}
                            </h4>
                            <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              已生成
                            </span>
                          </div>
                          <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
                            {enId || 'auto_skill'} · SKILL.md
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                            <span>{actionChains.reduce((total, chain) => total + chain.steps.length, 0)} 个执行步骤</span>
                            <span>{selectedKBs.length + selectedScripts.length} 项资源</span>
                            <span>{completedSections}/4 模块完整</span>
                          </div>
                        </div>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 group-hover:text-neutral-900">
                          查看修改
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </button>
                  );
                }

                // Standard: AI light-gray left / user bubble right with creator header
                if (msg.sender === 'user') {
                  const originalIndex = chatMessages.indexOf(msg);
                  const isEditingBubble =
                    editingUserMsgIndex !== null && editingUserMsgIndex === originalIndex;
                  const commitUserBubbleEdit = () => {
                    const next = editingUserMsgDraft.trim();
                    if (!next) {
                      showToast('消息内容不能为空', 'error');
                      return;
                    }
                    if (originalIndex < 0) return;
                    setChatMessages((prev) =>
                      prev.map((m, idx) =>
                        idx === originalIndex && m.sender === 'user'
                          ? { ...m, content: next.slice(0, 1000) }
                          : m,
                      ),
                    );
                    setEditingUserMsgIndex(null);
                    setEditingUserMsgDraft('');
                    showToast('消息已更新');
                  };
                  const cancelUserBubbleEdit = () => {
                    setEditingUserMsgIndex(null);
                    setEditingUserMsgDraft('');
                  };
                  return (
                    <div key={msgKey} className="flex justify-end group/user-msg">
                      <div
                        className={cn(
                          'flex flex-col items-end gap-2 min-w-0',
                          isEditingBubble ? 'w-2/3 max-w-[480px]' : 'max-w-[88%]',
                        )}
                      >
                        <div className="flex items-center gap-1.5 pr-0.5">
                          <Avatar className="h-5 w-5 rounded-full overflow-hidden after:hidden shrink-0">
                            <AvatarFallback
                              className={cn(PROFILE_USER.fallbackClass, 'text-[10px] select-none')}
                            >
                              {PROFILE_USER.initial}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] leading-4 text-neutral-800">
                            {PROFILE_USER.name}
                          </span>
                        </div>
                        <div className={cn('relative max-w-full', isEditingBubble && 'w-full')}>
                          {!isEditingBubble ? (
                            <div
                              className={cn(
                                'absolute -top-7 right-0 z-10 flex items-center gap-0.5 rounded-md border border-neutral-200/80 bg-white/95 px-1 py-0.5',
                                'shadow-[0_2px_8px_rgba(31,35,41,0.06)]',
                                'opacity-0 pointer-events-none group-hover/user-msg:opacity-100 group-hover/user-msg:pointer-events-auto',
                                'transition-opacity duration-150',
                              )}
                            >
                              <span className="inline-flex items-center gap-0.5 px-1 text-[10px] tabular-nums text-neutral-400">
                                <Clock size={10} className="shrink-0 opacity-70" />
                                {msg.timestamp || '--:--'}
                              </span>
                              <span className="w-px h-3 bg-neutral-200/80 shrink-0" aria-hidden />
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(msg.content).then(
                                    () => showToast('已复制到剪贴板'),
                                    () => showToast('复制失败，请手动选择文本', 'error'),
                                  );
                                }}
                                className="w-6 h-6 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition"
                                title="复制"
                                aria-label="复制消息"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={isAiThinking || hasPendingClarify || editingUserMsgIndex !== null}
                                onClick={() => {
                                  if (originalIndex < 0) return;
                                  setConfirmEditTarget(null);
                                  setComposerResetMode(false);
                                  setComposerConsumedChipIds([]);
                                  setEditingUserMsgIndex(originalIndex);
                                  setEditingUserMsgDraft(msg.content.slice(0, 1000));
                                  requestAnimationFrame(() => {
                                    const el = userBubbleEditRef.current;
                                    if (!el) return;
                                    el.focus();
                                    el.setSelectionRange(el.value.length, el.value.length);
                                  });
                                }}
                                className="w-6 h-6 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                                title="编辑"
                                aria-label="编辑消息"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          ) : null}
                          {isEditingBubble ? (
                            <div className="skill-ai-composer relative w-full overflow-hidden">
                              <textarea
                                ref={userBubbleEditRef}
                                rows={4}
                                maxLength={1000}
                                value={editingUserMsgDraft}
                                onChange={(e) => setEditingUserMsgDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelUserBubbleEdit();
                                    return;
                                  }
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    commitUserBubbleEdit();
                                  }
                                }}
                                className="w-full min-h-[88px] max-h-48 bg-transparent px-3 pt-3 pb-12 text-[14px] leading-[22px] text-[#181D27] outline-none resize-none placeholder:text-neutral-400"
                                placeholder="编辑消息内容…"
                                aria-label="编辑消息内容"
                              />
                              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={cancelUserBubbleEdit}
                                  className={cn(BTN_SOFT, 'h-7 px-3 text-[13px]')}
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  onClick={commitUserBubbleEdit}
                                  disabled={!editingUserMsgDraft.trim()}
                                  className={cn(
                                    SKILL_AOP_PRIMARY_BTN,
                                    'h-7 px-3 rounded-md text-[13px]',
                                  )}
                                >
                                  发送
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5 w-full">
                              {(() => {
                                const { text, attachments } = splitChatContentWithAttachments(
                                  msg.content,
                                );
                                return (
                                  <>
                                    <ChatAttachmentCards attachments={attachments} align="end" />
                                    {text ? (
                                      <div className={USER_CHAT_BUBBLE}>{text}</div>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msgKey} className="flex justify-start">
                    <div
                      className={
                        msg.sender === 'system_status' ? SYSTEM_STATUS_CHAT_BUBBLE : AI_CHAT_BUBBLE
                      }
                    >
                      {renderAiBubbleContent(msg.content)}
                    </div>
                  </div>
                );
              })}
              {messageQueue.length > 0 && (
                <p className="text-[11px] text-neutral-400 text-center">
                  还有 {messageQueue.length} 条消息排队，思考结束后自动发送
                </p>
              )}

              {isAiThinking && (thinkBootLoading || thinkCotSteps.length > 0) ? (
                <SkillThinkingCard
                  title={SKILL_CREATE_CHAT.thinkInProgress}
                  steps={thinkCotSteps}
                  isComplete={!thinkBootLoading && !thinkCotGenerating && thinkCotSteps.length > 0}
                  loading={thinkBootLoading}
                  generating={!thinkBootLoading && thinkCotGenerating}
                  className="!ml-0 mr-0"
                />
              ) : null}
              {isAiThinking && taskPlanSteps.length > 0 ? (
                <SkillTaskPlanCard
                  title={SKILL_CREATE_CHAT.planInProgress}
                  steps={taskPlanSteps}
                  isComplete={!taskPlanGenerating && taskPlanSteps.every((s) => s.status === 'done')}
                  generating={taskPlanGenerating}
                  className="!ml-0 mr-0"
                />
              ) : null}

              <div ref={chatMessagesEndRef} />
            </div>
            </div>

            <div className="w-full max-w-[720px] mx-auto px-3 pb-3 pt-1 shrink-0">
            {skillGoalReady && !isAiThinking && !hasPendingClarify && visibleComposerReplyPe.length > 0 ? (
            <div className="pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {visibleComposerReplyPe.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => applyComposerReplyChip(chip)}
                  className={CHIP}
                  title="点选后填入输入框，可再编辑后发送"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            ) : null}

            <div className="pt-1">
              <div className="skill-ai-composer skill-ai-composer--dock p-3">
                {composerResetMode ? (
                  <div className="flex items-center gap-2 pb-2 mb-1 border-b border-neutral-100">
                    <span className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2 rounded-md bg-amber-50 border border-amber-200 text-[12px] text-amber-900 max-w-full">
                      <RotateCcw size={12} className="shrink-0" />
                      <span className="truncate">重新设置要求 · 编辑后发送</span>
                      <button
                        type="button"
                        onClick={() => {
                          setComposerResetMode(false);
                          setChatInput('');
                        }}
                        className="ml-0.5 text-amber-700/60 hover:text-amber-900 cursor-pointer shrink-0"
                        aria-label="取消重新设置"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  </div>
                ) : null}
                {confirmEditTarget ? (
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-1 border-b border-neutral-100">
                    {confirmEditTarget.items.map((item) => (
                      <span
                        key={item.itemId}
                        className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2 rounded-md bg-neutral-100 border border-neutral-200 text-[12px] text-neutral-800 max-w-full"
                        title={item.value}
                      >
                        <span className="w-5 h-5 rounded bg-neutral-800 text-white text-[11px] font-semibold tabular-nums flex items-center justify-center shrink-0">
                          {item.itemIndex + 1}
                        </span>
                        <span className="truncate">编辑要点 · {item.hint}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirmEditTarget) return;
                            const nextItems = confirmEditTarget.items.filter(
                              (row) => row.itemId !== item.itemId,
                            );
                            setConfirmEditTarget(
                              nextItems.length === 0
                                ? null
                                : { ...confirmEditTarget, items: nextItems },
                            );
                          }}
                          className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                          aria-label={`移除 ${item.hint}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                {composerAttachments.length > 0 ? (
                  <div className="flex items-center gap-2 pb-2 mb-1 overflow-x-auto no-scrollbar">
                    {composerAttachments.map((file) => (
                      <span
                        key={file.id}
                        className={GOAL_INDEX_CHIP}
                        title={`${file.name} · ${file.sizeLabel}`}
                      >
                        <FileText size={12} className="text-neutral-500 shrink-0" />
                        <span className="truncate min-w-0">{file.name}</span>
                        <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
                          {file.sizeLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeComposerAttachment(file.id)}
                          className="ml-0.5 text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0"
                          aria-label={`移除 ${file.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <textarea
                  ref={chatComposerTextareaRef}
                  rows={1}
                  maxLength={1000}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && composerResetMode) {
                      e.preventDefault();
                      setComposerResetMode(false);
                      setChatInput('');
                      setComposerAttachments([]);
                      setComposerConsumedChipIds([]);
                      return;
                    }
                    if (e.key === 'Escape' && confirmEditTarget) {
                      e.preventDefault();
                      setConfirmEditTarget(null);
                      return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder={
                    hasPendingClarify
                      ? `请先在上方“${SKILL_CREATE_CHAT.clarifyTitle}”卡片中提交或跳过…`
                      : confirmEditTarget
                        ? confirmEditTarget.items.length > 1
                          ? `说明如何改写已选 ${confirmEditTarget.items.length} 条要点，发送后由 AI 更新…`
                          : `说明如何改写“${confirmEditTarget.items[0].hint}”，发送后由 AI 更新…`
                          : composerResetMode
                          ? '可继续补充或修改各【要点】内容，回车发送…'
                          : draftConfirmed
                            ? '继续补充规则，或点上方“AI 帮写”快捷填充…'
                            : '说明想改哪张卡片，或点上方“AI 帮写”快捷填充…'
                  }
                  className="w-full min-h-[44px] max-h-40 overflow-y-auto bg-transparent text-[14px] leading-[22px] pb-2 outline-none resize-none placeholder:text-[#B0B2B8] text-[#1C1D1F]"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className={cn(
                        'w-8 h-8 rounded border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 flex items-center justify-center cursor-pointer shrink-0',
                        composerAttachments.length > 0 && 'border-neutral-300',
                      )}
                      title="上传文件"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="text-[14px] leading-[22px] text-neutral-400 tabular-nums">
                      {chatInput.length}/1000
                    </span>
                  </div>
                  {isAiThinking ? (
                    <button
                      type="button"
                      onClick={handleStopThinking}
                      className="w-8 h-8 rounded-full bg-[#ECECF2] hover:bg-[#E9EAEB] text-[#717680] border border-[#E9EAEB] flex items-center justify-center cursor-pointer shrink-0"
                      title="停止"
                    >
                      <Square size={12} className="fill-[#717680]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        (!chatInput.trim() && composerAttachments.length === 0) || hasPendingClarify
                      }
                      onClick={() => handleSendChatMessage()}
                      className={cn(
                        SKILL_AOP_SEND_BTN,
                        composerResetMode && 'px-3 gap-1.5 w-auto min-w-[2rem]',
                      )}
                      title={composerResetMode ? '发送改写' : confirmEditTarget ? '发给 AI 改写' : '发送'}
                      aria-label={composerResetMode ? '发送改写' : confirmEditTarget ? '发给 AI 改写' : '发送'}
                    >
                      {composerResetMode ? (
                        <span className="text-[12px] font-medium leading-none">发送改写</span>
                      ) : (
                        <ArrowUp size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
            </div>
            )}
          </div>

          {!rightCollapsed && (
          <div
            id="skill-form-workspace"
            className="flex-1 flex flex-col min-h-0 bg-[#F9F9FB] pl-3 pr-3 pt-0 pb-3 relative transition-all duration-200 select-text"
          >
            <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#E9EAEB] rounded-2xl shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
              {centerTab === 'editor' ? (
                <ManusExpertFrame
                  packageName={enId?.trim() || 'my_skill'}
                  files={expertModeFiles}
                  onSkillMarkdownChange={handleExpertMarkdownChange}
                  onToast={showToast}
                />
              ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div
                  ref={formScrollRef}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden p-3"
                >
                <SkillRewriteProvider
                  onDirty={() => setIsFormDirty(true)}
                  onToast={(msg) => showToast(msg)}
                >
                <div className="shrink-0 mb-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 flex items-stretch gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {FORM_SECTION_NAV.map((sec) => {
                      const isActive = activeStep === sec.id;
                      const status = formSectionStatus(sec.id);
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => goToFormSection(sec.id)}
                          className={cn(
                            'relative min-w-[96px] flex-1 rounded-[7px] border px-2 py-1.5 text-left transition-colors duration-200 cursor-pointer',
                            isActive
                              ? 'border-transparent text-neutral-900 z-[1]'
                              : 'border-transparent bg-neutral-50/60 hover:border-neutral-200/80 hover:bg-white text-neutral-600',
                          )}
                          title={sec.title}
                        >
                          {isActive ? (
                            <motion.span
                              layoutId="skill-form-step-highlight"
                              className="absolute inset-0 rounded-[7px] border border-neutral-300 bg-[linear-gradient(135deg,rgba(0,0,0,0.04)_0%,rgba(21,101,191,0.1)_100%)]"
                              transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.75 }}
                              aria-hidden
                            />
                          ) : null}
                          <span className="relative z-10 flex items-center gap-1 min-w-0">
                            <span
                              className={cn(
                                'w-4 h-4 rounded text-[10px] font-semibold flex items-center justify-center shrink-0 text-white transition-colors',
                                sec.required || status === 'done' ? 'bg-neutral-800' : 'bg-neutral-400',
                              )}
                            >
                              {sec.id}
                            </span>
                            <span className={cn('truncate text-[11px] font-medium', isActive ? 'text-neutral-900' : 'text-neutral-600')}>
                              {sec.title}
                            </span>
                          </span>
                          <span className="relative z-10 block truncate text-[10px] text-neutral-400 mt-0.5 pl-5">
                            {formSectionSummary(sec.id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => stepFormSection(-1)}
                      disabled={activeStep <= 1}
                      className={cn(
                        'w-6 h-6 rounded-md inline-flex items-center justify-center shrink-0 border transition cursor-pointer',
                        activeStep <= 1
                          ? 'border-transparent text-neutral-300 cursor-not-allowed'
                          : 'border-[#E9EAEB] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                      )}
                      title="上一张卡"
                      aria-label="上一张卡"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="flex-1 h-1 rounded-full bg-neutral-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#000000_0%,#1565BF_100%)]"
                        initial={false}
                        animate={{ width: `${(activeStep / 4) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">{activeStep}/4</span>
                    <button
                      type="button"
                      onClick={() => stepFormSection(1)}
                      disabled={activeStep >= 4}
                      className={cn(
                        'w-6 h-6 rounded-md inline-flex items-center justify-center shrink-0 border transition cursor-pointer',
                        activeStep >= 4
                          ? 'border-transparent text-neutral-300 cursor-not-allowed'
                          : 'border-[#E9EAEB] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                      )}
                      title="下一张卡"
                      aria-label="下一张卡"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <p className="px-1 text-[10px] leading-none text-neutral-400">
                    上下滚动浏览本卡 · 左右滑动或点 Tab 切卡
                  </p>
                </div>

                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <motion.div
                    className="relative flex h-full w-[400%]"
                    animate={{ x: `-${(activeStep - 1) * 25}%` }}
                    transition={{
                      type: 'tween',
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <FormCarouselPanel sectionId={1}>
                      <div id="form-section-1" className="flex flex-col h-full min-h-0">
                        {formSectionPanelHeader(1, FORM_SECTION_TITLES[1], true)}
                        <div className={FORM_SECTION_BODY}>
                          <div className={FORM_SECTION_CARD}>
                            <div className={FORM_SECTION_CARD_INNER}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SkillRewriteField
                            fieldKey="cnName"
                            fieldLabel="技能名称"
                            id="field-cnName"
                            value={cnName}
                            maxLength={30}
                            disabled={isAiThinking}
                            onChange={(val) => {
                              setCnName(val);
                              setIsFormDirty(true);
                              if (validationErrorFields.has('field-cnName')) {
                                setValidationErrorFields((prev) => {
                                  const n = new Set(prev);
                                  n.delete('field-cnName');
                                  return n;
                                });
                              }
                            }}
                            placeholder="例如：京东延保进度查询助手"
                            inputClassName={
                              validationErrorFields.has('field-cnName')
                                ? 'bg-white border-2 border-rose-500 text-rose-950 font-extrabold'
                                : ''
                            }
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                {REQUIRED_STAR}
                                <span>技能名称</span>
                              </span>
                            }
                            error={
                              validationErrorFields.has('field-cnName') ? (
                                <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                  <AlertCircle size={11} />
                                  {skills.some((s) => s.name.trim() === cnName.trim() && s.id !== draftSkillId)
                                    ? `技能名称“${cnName.trim()}”与现有技能重名，请修改`
                                    : '技能名称为必填项，请输入名称'}
                                </p>
                              ) : null
                            }
                          />

                          <SkillRewriteField
                            fieldKey="enId"
                            fieldLabel="英文代号"
                            id="field-enId"
                            value={enId}
                            maxLength={50}
                            mono
                            disabled={isAiThinking}
                            onChange={(val) => {
                              setEnId(val);
                              setIsFormDirty(true);
                              if (validationErrorFields.has('field-enId')) {
                                setValidationErrorFields((prev) => {
                                  const n = new Set(prev);
                                  n.delete('field-enId');
                                  return n;
                                });
                              }
                            }}
                            placeholder="例如：yb_progress"
                            inputClassName={
                              validationErrorFields.has('field-enId')
                                ? 'bg-white border-2 border-rose-500 text-rose-950 font-extrabold'
                                : ''
                            }
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                {REQUIRED_STAR}
                                <span>英文代号</span>
                              </span>
                            }
                            error={
                              validationErrorFields.has('field-enId') ? (
                                <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                  <AlertCircle size={11} /> 英文代号为必填项，请填写
                                </p>
                              ) : null
                            }
                          />
                        </div>

                        <SkillRewriteField
                          fieldKey="businessProblem"
                          fieldLabel="一句话介绍"
                          id="field-businessProblem"
                          multiline
                          rows={2}
                          maxLength={50}
                          disabled={isAiThinking}
                          value={businessProblem}
                          onChange={(val) => {
                            setBusinessProblem(val);
                            setIsFormDirty(true);
                            if (validationErrorFields.has('field-businessProblem')) {
                              setValidationErrorFields((prev) => {
                                const n = new Set(prev);
                                n.delete('field-businessProblem');
                                return n;
                              });
                            }
                          }}
                          placeholder="例如：查询京东延保服务单进度与状态"
                          inputClassName={
                            validationErrorFields.has('field-businessProblem')
                              ? 'bg-white border-2 border-rose-500 text-rose-950 font-bold'
                              : ''
                          }
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              {REQUIRED_STAR}
                              <span>一句话介绍</span>
                            </span>
                          }
                          error={
                            validationErrorFields.has('field-businessProblem') ? (
                              <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                <AlertCircle size={11} /> 一句话介绍为必填项，请填写
                              </p>
                            ) : null
                          }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SkillRewriteField
                            fieldKey="triggerCond"
                            fieldLabel="触发条件"
                            id="field-triggerCond"
                            multiline
                            rows={3}
                            maxLength={200}
                            disabled={isAiThinking}
                            value={triggerCond}
                            onChange={(val) => {
                              setTriggerCond(val);
                              setIsFormDirty(true);
                              if (validationErrorFields.has('field-triggerCond')) {
                                setValidationErrorFields((prev) => {
                                  const n = new Set(prev);
                                  n.delete('field-triggerCond');
                                  return n;
                                });
                              }
                            }}
                            placeholder="例如：用户问延保服务单进度/状态"
                            inputClassName={
                              validationErrorFields.has('field-triggerCond')
                                ? 'bg-white border-2 border-rose-500 text-rose-950 font-bold'
                                : ''
                            }
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                {REQUIRED_STAR}
                                <span>触发条件</span>
                              </span>
                            }
                            error={
                              validationErrorFields.has('field-triggerCond') ? (
                                <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                  <AlertCircle size={11} /> 触发条件为必填项，请输入触发条件
                                </p>
                              ) : null
                            }
                          />

                          <SkillRewriteField
                            fieldKey="forbiddenCond"
                            fieldLabel="不该使用的情况"
                            id="field-forbiddenCond"
                            multiline
                            rows={3}
                            maxLength={200}
                            disabled={isAiThinking}
                            value={forbiddenCond}
                            onChange={(val) => {
                              setForbiddenCond(val);
                              setIsFormDirty(true);
                            }}
                            placeholder="例如：非京东延保、非本人订单"
                            inputClassName="leading-relaxed"
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span>不该使用的情况</span>
                              </span>
                            }
                          />
                        </div>

                  {/* ENTERPRISE INTEGRATION RESOURCES SUBPANEL */}
                  <div className="border-t border-neutral-100 text-left overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setResourcesExpanded((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 py-2 cursor-pointer hover:bg-neutral-50 transition"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Cpu size={14} className="text-neutral-600 shrink-0" />
                        <h4 className="text-xs font-semibold text-neutral-900">可用资料</h4>
                        {!resourcesExpanded ? (
                          <span className="text-[11px] text-neutral-400 truncate">
                            知识库 {selectedKBs.length} · 接口 {selectedScripts.length}
                            {uploadedFiles.length > 0 ? ` · 文件 ${uploadedFiles.length}` : ''}
                          </span>
                        ) : null}
                      </div>
                      {resourcesExpanded ? (
                        <ChevronDown size={14} className="text-neutral-400 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                      )}
                    </button>

                    {resourcesExpanded ? (
                    <div className="pb-2 space-y-3 border-t border-neutral-100 pt-2">
                    <div className="pt-0" />

                    {(() => {
                      const availableScripts = [
                        { id: 'erp_script', name: 'ERP订单系统数据接口' },
                        { id: 'claim_script', name: '理赔核算与自动代缴系统接口' },
                        { id: 'crm_script', name: 'CRM客户资料与画像接口' },
                        ...customScripts
                      ];
                      const showScriptColumn = availableScripts.length > 0;

                      return (
                        <div className={`grid grid-cols-1 ${showScriptColumn ? 'md:grid-cols-2' : ''} gap-4`}>
                          {/* Knowledge Base Column (First) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-[11px] font-black text-neutral-700 flex items-center gap-1">
                                  <span>知识库</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSaveAsDraft();
                                    onClose();
                                    setActiveTab('kb');
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                                  title="保存草稿并跳转至知识库上传页面"
                                >
                                  <UploadCloud size={11} />
                                  <span>知识库</span>
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {[
                                ...PRESET_KNOWLEDGE_BASES,
                                ...customKBs
                              ].map((kbName) => {
                                const isChecked = selectedKBs.includes(kbName);
                                return (
                                  <div
                                    key={kbName}
                                    onClick={() => {
                                      setSelectedKBs(prev =>
                                        prev.includes(kbName) ? prev.filter(name => name !== kbName) : [...prev, kbName]
                                      );
                                      setIsFormDirty(true);
                                    }}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer select-none transition ${
                                      isChecked
                                        ? 'border-emerald-300 bg-emerald-50/30 font-bold text-emerald-900'
                                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                                    }`}
                                  >
                                    <span className="truncate pr-2" title={kbName}>{kbName}</span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // Controlled via parent click
                                      className="h-3 w-3 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Scripts Column (Second, conditional if scripts exist) */}
                          {showScriptColumn && (
                            <div className="space-y-2">
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-[11px] font-black text-neutral-700 flex items-center gap-1">
                                  <span>系统接口</span>
                                </span>
                              </div>

                              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                {availableScripts.map((script) => {
                                  const isChecked = selectedScripts.includes(script.id);
                                  return (
                                    <div
                                      key={script.id}
                                      onClick={() => {
                                        setSelectedScripts(prev =>
                                          prev.includes(script.id) ? prev.filter(id => id !== script.id) : [...prev, script.id]
                                        );
                                        setIsFormDirty(true);
                                      }}
                                      className={cn(
                                        'p-2 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer select-none transition',
                                        isChecked
                                          ? cn(SKILL_AOP_SELECTED_ROW, 'font-bold text-neutral-900')
                                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300',
                                      )}
                                    >
                                      <span>{script.name}</span>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // Controlled via parent click
                                        className="h-3 w-3 rounded accent-[#1565BF] focus:ring-neutral-400"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                    );
                    })()}

                  {/* Drag and Drop Reference Material / Script Uploader */}
                  <div className="border-t border-neutral-100 pt-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                        <span>上传参考资料</span>
                      </label>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          handleFileUpload(file.name, file.size);
                        }
                      }}
                      className={cn(
                        'rounded-[7px] border border-dashed p-3 transition space-y-2',
                        isDragging ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-200 bg-white',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] text-neutral-500">
                          支持文档 / 表格 / 脚本 / 图片 / 压缩包，拖拽或点击上传
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = COMPOSER_FILE_ACCEPT;
                            input.onchange = (e: any) => {
                              if (e.target.files && e.target.files.length > 0) {
                                const file = e.target.files[0];
                                handleFileUpload(file.name, file.size);
                              }
                            };
                            input.click();
                          }}
                          className={cn(BTN_SOFT, 'h-7 px-3 text-[13px] shrink-0')}
                        >
                          选择文件
                        </button>
                      </div>

                      {uploadProgress !== null ? (
                        <div className="space-y-1">
                          <div className="text-[10px] text-neutral-500 font-semibold">
                            正在解析并提取文件特征 ({uploadProgress}%)
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-neutral-800 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      ) : null}

                      <div className="border-t border-neutral-200/70 pt-2">
                        <div className="text-[11px] text-neutral-600">
                          已上传 {uploadedFiles.length} 个文件
                        </div>
                        {uploadedFiles.length > 0 ? (
                          <div className="mt-2 space-y-1.5 max-h-[132px] overflow-y-auto pr-1">
                            {uploadedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium text-neutral-800 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <span className="text-[10px] text-neutral-400">{file.size}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                                      file.status === 'success'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-rose-50 text-rose-600 border-rose-100',
                                    )}
                                    title={file.errorMessage || ''}
                                  >
                                    {file.status === 'success' ? '成功' : '失败'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(file.id);
                                    }}
                                    className="text-neutral-400 hover:text-rose-500 p-0.5 rounded transition"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] text-neutral-400">暂无文件</div>
                        )}
                      </div>
                    </div>
                    </div>
                    </div>
                    ) : null}
                  </div>

                    {/* 任务目标与数据流 (合并入技能定义) */}
                    <div className="border-t border-neutral-100 pt-3 mt-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-800">输入与结果</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SkillRewriteField
                          fieldKey="coreInputIn"
                          fieldLabel="用户输入信息"
                          id="field-coreInputIn"
                          multiline
                          rows={3}
                          maxLength={200}
                          disabled={isAiThinking}
                          value={coreInputIn}
                          onChange={(val) => {
                            setCoreInputIn(val);
                            setIsFormDirty(true);
                            if (validationErrorFields.has('field-coreInputIn')) {
                              setValidationErrorFields((prev) => {
                                const n = new Set(prev);
                                n.delete('field-coreInputIn');
                                return n;
                              });
                            }
                          }}
                          placeholder="例如：提供延保服务单号、关联订单号或绑定手机号"
                          inputClassName={
                            validationErrorFields.has('field-coreInputIn')
                              ? 'bg-white border-2 border-rose-500 font-medium text-rose-950'
                              : ''
                          }
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              {REQUIRED_STAR}
                              <span>用户输入信息</span>
                            </span>
                          }
                          error={
                            validationErrorFields.has('field-coreInputIn') ? (
                              <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                <AlertCircle size={11} /> 用户输入信息为必填项，请填写
                              </p>
                            ) : null
                          }
                        />

                        <SkillRewriteField
                          fieldKey="coreInputOut"
                          fieldLabel="产出物"
                          id="field-coreInputOut"
                          multiline
                          rows={3}
                          maxLength={200}
                          disabled={isAiThinking}
                          value={coreInputOut}
                          onChange={(val) => {
                            setCoreInputOut(val);
                            setIsFormDirty(true);
                            if (validationErrorFields.has('field-coreInputOut')) {
                              setValidationErrorFields((prev) => {
                                const n = new Set(prev);
                                n.delete('field-coreInputOut');
                                return n;
                              });
                            }
                          }}
                          placeholder="例如：延保服务单当前节点、处理人、预计完成时间及最新进展详情"
                          inputClassName={
                            validationErrorFields.has('field-coreInputOut')
                              ? 'bg-white border-2 border-rose-500 font-medium text-rose-950'
                              : ''
                          }
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              {REQUIRED_STAR}
                              <span>产出物</span>
                            </span>
                          }
                          error={
                            validationErrorFields.has('field-coreInputOut') ? (
                              <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                <AlertCircle size={11} /> 产出物为必填项，请填写
                              </p>
                            ) : null
                          }
                        />
                      </div>
                    </div>

                          </div>
                        </div>
                      </div>
                      </div>
                    </FormCarouselPanel>

                    <FormCarouselPanel sectionId={2}>
                      <div id="form-section-2" className="flex flex-col h-full min-h-0">
                        {formSectionPanelHeader(2, FORM_SECTION_TITLES[2], true)}
                        <div className={FORM_SECTION_BODY}>
                          <div className={FORM_SECTION_CARD}>
                            <div className={FORM_SECTION_CARD_INNER}>
                        {/* 技能主体：业务知识 / 执行步骤 二选一 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            {REQUIRED_STAR}
                            <span className="text-xs font-semibold text-neutral-900">技能主体</span>
                            <span className="text-[10px] text-neutral-400">二选一</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isAiThinking}
                              onClick={() => {
                                setSkillBodyMode('knowledge');
                                setIsFormDirty(true);
                              }}
                              className={cn(
                                'flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                skillBodyMode === 'knowledge'
                                  ? 'border-neutral-900 bg-neutral-50 shadow-[0_1px_0_rgba(17,17,17,0.06)]'
                                  : 'border-neutral-200 bg-white hover:bg-neutral-50',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]',
                                  skillBodyMode === 'knowledge'
                                    ? 'bg-white text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-500',
                                )}
                              >
                                <BookOpen size={15} strokeWidth={2.2} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-neutral-900">业务知识</span>
                                <span className="block text-[10px] text-neutral-500 mt-0.5 leading-snug">
                                  沉淀条文与说明
                                </span>
                              </span>
                              {skillBodyMode === 'knowledge' ? (
                                <Check size={14} className="shrink-0 text-neutral-900" strokeWidth={2.5} />
                              ) : null}
                            </button>
                            <button
                              type="button"
                              disabled={isAiThinking}
                              onClick={() => {
                                setSkillBodyMode('steps');
                                setIsFormDirty(true);
                              }}
                              className={cn(
                                'flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                skillBodyMode === 'steps'
                                  ? 'border-neutral-900 bg-neutral-50 shadow-[0_1px_0_rgba(17,17,17,0.06)]'
                                  : 'border-neutral-200 bg-white hover:bg-neutral-50',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]',
                                  skillBodyMode === 'steps'
                                    ? 'bg-white text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-500',
                                )}
                              >
                                <Workflow size={15} strokeWidth={2.2} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-neutral-900">执行步骤</span>
                                <span className="block text-[10px] text-neutral-500 mt-0.5 leading-snug">
                                  编排动作与流程
                                </span>
                              </span>
                              {skillBodyMode === 'steps' ? (
                                <Check size={14} className="shrink-0 text-neutral-900" strokeWidth={2.5} />
                              ) : null}
                            </button>
                          </div>
                        </div>

                        {/* 1. 业务知识板块 */}
                        {skillBodyMode === 'knowledge' ? (
                        <div className="space-y-3.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={14} className="text-neutral-700" />
                            <span className="text-xs font-semibold text-neutral-900">业务知识</span>
                          </div>

                          <SkillRewriteField
                            fieldKey="knowledgeContent"
                            fieldLabel="知识内容"
                            multiline
                            rows={3}
                            maxLength={1000}
                            disabled={isAiThinking}
                            value={knowledgeContent}
                            onChange={(val) => {
                              setKnowledgeContent(val);
                              setIsFormDirty(true);
                            }}
                            labelClassName="text-[11px] font-medium text-neutral-600"
                            inputClassName="leading-relaxed"
                            placeholder="例如：&#10;1. 7天无理由退换货：商品签收7天内保持完好包装可申请退货；&#10;2. 保价政策：VIP2级以上用户享有签收15天内自动保价及全额补退差价。"
                            label={<span>知识内容</span>}
                            afterInput={
                              <AttachResourceMenu
                                allKBs={mountedKBsForSection2}
                                allScripts={mountedScriptsForSection2}
                                attachedKBs={selectedKBs}
                                attachedScripts={selectedScripts}
                                onAttachKB={(kb) => {
                                  const tag = `[挂载知识库: ${kb}]`;
                                  if (!knowledgeContent.includes(tag)) {
                                    setKnowledgeContent((prev) => (prev ? `${prev}\n${tag}` : tag));
                                  }
                                  setIsFormDirty(true);
                                }}
                                onAttachScript={(sc) => {
                                  const tag = `[挂载脚本: ${sc}]`;
                                  if (!knowledgeContent.includes(tag)) {
                                    setKnowledgeContent((prev) => (prev ? `${prev}\n${tag}` : tag));
                                  }
                                  setIsFormDirty(true);
                                }}
                                onRemoveKB={(kb) => {
                                  setKnowledgeContent((prev) => prev.replace(`[挂载知识库: ${kb}]`, '').trim());
                                }}
                                onRemoveScript={(sc) => {
                                  setKnowledgeContent((prev) => prev.replace(`[挂载脚本: ${sc}]`, '').trim());
                                }}
                              />
                            }
                          />

                          <SkillRewriteField
                            fieldKey="knowledgeDesc"
                            fieldLabel="知识说明"
                            multiline
                            rows={2}
                            maxLength={1000}
                            disabled={isAiThinking}
                            value={knowledgeDesc}
                            onChange={(val) => {
                              setKnowledgeDesc(val);
                              setIsFormDirty(true);
                            }}
                            labelClassName="text-[11px] font-medium text-neutral-600"
                            inputClassName="leading-relaxed"
                            placeholder="例如：本知识适用于所有售后服务单场景，当与特定活动政策冲突时以本知识为准；每月1日自动更新保价标准。"
                            label={<span>知识说明</span>}
                          />
                        </div>
                        ) : null}

                        {/* 2. 执行步骤板块 */}
                        {skillBodyMode === 'steps' ? (
                        <>
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                              <Workflow size={14} className="text-neutral-700" />
                              <span>执行步骤</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const chainId = actionChains[0]?.id || 1;
                                  if (actionChains.length === 0) {
                                    handleAddActionChain();
                                  } else {
                                    handleAddStepToChain(chainId);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-neutral-800 hover:opacity-90 px-3 py-1.5 rounded-[7px] transition shrink-0 cursor-pointer shadow-3xs"
                              >
                                <Plus size={13} />
                                <span>增加步骤</span>
                              </button>
                            </div>
                          </div>

                        {/* 步骤列表平铺展示 */}
                        <div className="space-y-3">
                          {(() => {
                            const activeChain = actionChains[0] || { id: 1, name: '核心流程', steps: [] };
                            const stepsList = activeChain.steps;

                            if (stepsList.length === 0) {
                              return (
                                <div className="p-6 border border-dashed border-neutral-200 rounded-[7px] text-center">
                                  <p className="text-xs text-neutral-400 mb-2">暂无执行步骤，点击右上角“增加步骤”创建</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (actionChains.length === 0) {
                                        handleAddActionChain();
                                      } else {
                                        handleAddStepToChain(activeChain.id);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-[7px] border border-neutral-200 transition cursor-pointer"
                                  >
                                    <Plus size={12} />
                                    <span>增加步骤</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <Reorder.Group 
                                id="field-steps-container"
                                axis="y" 
                                values={stepsList} 
                                onReorder={(newSteps) => {
                                  setActionChains(prev => prev.length > 0 ? [{ ...prev[0], steps: newSteps }, ...prev.slice(1)] : [{ id: 1, name: '核心流程', steps: newSteps }]);
                                  setIsFormDirty(true);
                                }} 
                                className="space-y-3"
                              >
                                {stepsList.map((st, sIdx) => {
                                  const stepKey = `${activeChain.id}-${st.id}`;
                                  const isStepCollapsed = collapsedSteps.includes(stepKey);
                                  
                                  return (
                                    <Reorder.Item key={st.id} value={st} className="relative border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0 space-y-2.5 text-left">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 transition p-0.5 shrink-0">
                                            <GripVertical size={13} />
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => toggleStepCollapse(activeChain.id, st.id)}
                                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 cursor-pointer shrink-0"
                                          >
                                            {isStepCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                          </button>
                                          <span className="text-[10px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                                            步骤 {sIdx + 1}
                                          </span>
                                          {isStepCollapsed && st.name.trim() ? (
                                            <span className="text-[11px] text-neutral-500 truncate">{st.name}</span>
                                          ) : null}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveStepFromChain(activeChain.id, st.id)}
                                          className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg transition cursor-pointer shrink-0"
                                          title="删除步骤"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>

                                      <AnimatePresence initial={false}>
                                        {!isStepCollapsed && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden space-y-3 pt-1 pl-6"
                                          >
                                            <SkillRewriteField
                                              fieldKey={`step-name-${st.id}`}
                                              fieldLabel="步骤名称"
                                              id={`field-step-name-${st.id}`}
                                              maxLength={50}
                                              disabled={isAiThinking}
                                              value={st.name}
                                              onChange={(val) => {
                                                setActionChains((prev) =>
                                                  prev.map((c) =>
                                                    c.id === activeChain.id
                                                      ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, name: val } : p)) }
                                                      : c,
                                                  ),
                                                );
                                                setIsFormDirty(true);
                                                if (validationErrorFields.has(`field-step-name-${st.id}`)) {
                                                  setValidationErrorFields((prev) => {
                                                    const n = new Set(prev);
                                                    n.delete(`field-step-name-${st.id}`);
                                                    return n;
                                                  });
                                                }
                                              }}
                                              placeholder="请输入步骤名称"
                                              labelClassName="text-[11px] font-medium text-neutral-600"
                                              inputClassName={cn(
                                                'text-xs font-semibold px-2.5 py-1.5',
                                                validationErrorFields.has(`field-step-name-${st.id}`)
                                                  ? 'bg-white border-2 border-rose-500 text-rose-950 font-bold'
                                                  : '',
                                              )}
                                              label={
                                                <span className="flex items-center gap-1">
                                                  <span>步骤名称</span>
                                                </span>
                                              }
                                            />
                                            <SkillRewriteField
                                              fieldKey={`step-desc-${st.id}`}
                                              fieldLabel="步骤说明"
                                              multiline
                                              rows={2}
                                              maxLength={1000}
                                              disabled={isAiThinking}
                                              value={st.description}
                                              onChange={(val) => {
                                                setActionChains((prev) =>
                                                  prev.map((c) =>
                                                    c.id === activeChain.id
                                                      ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, description: val } : p)) }
                                                      : c,
                                                  ),
                                                );
                                                setIsFormDirty(true);
                                              }}
                                              labelClassName="text-[11px] font-medium text-neutral-600"
                                              inputClassName="leading-relaxed"
                                              placeholder="例如：向用户索取延保服务单号及下单手机号，并在系统中检索匹配的工单记录..."
                                              label={
                                                <span className="flex items-center gap-1">
                                                  <span>步骤说明</span>
                                                </span>
                                              }
                                              afterInput={
                                                <AttachResourceMenu
                                                  allKBs={mountedKBsForSection2}
                                                  allScripts={mountedScriptsForSection2}
                                                  attachedKBs={st.associatedKBs || []}
                                                  attachedScripts={st.associatedScripts || []}
                                                  onAttachKB={(kb) => {
                                                    const currentKBs = st.associatedKBs || [];
                                                    const newKBs = currentKBs.includes(kb) ? currentKBs : [...currentKBs, kb];
                                                    const tag = `[挂载知识库: ${kb}]`;
                                                    const newDesc = st.description.includes(tag) ? st.description : (st.description ? `${st.description}\n${tag}` : tag);
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, description: newDesc, associatedKBs: newKBs } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                    setIsFormDirty(true);
                                                  }}
                                                  onAttachScript={(sc) => {
                                                    const currentScripts = st.associatedScripts || [];
                                                    const newScripts = currentScripts.includes(sc) ? currentScripts : [...currentScripts, sc];
                                                    const tag = `[挂载脚本: ${sc}]`;
                                                    const newDesc = st.description.includes(tag) ? st.description : (st.description ? `${st.description}\n${tag}` : tag);
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, description: newDesc, associatedScripts: newScripts } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                    setIsFormDirty(true);
                                                  }}
                                                  onRemoveKB={(kb) => {
                                                    const newKBs = (st.associatedKBs || []).filter((k) => k !== kb);
                                                    const newDesc = st.description.replace(`[挂载知识库: ${kb}]`, '').trim();
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, description: newDesc, associatedKBs: newKBs } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                  }}
                                                  onRemoveScript={(sc) => {
                                                    const newScripts = (st.associatedScripts || []).filter((s) => s !== sc);
                                                    const newDesc = st.description.replace(`[挂载脚本: ${sc}]`, '').trim();
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, description: newDesc, associatedScripts: newScripts } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                  }}
                                                />
                                              }
                                            />

                                            <SkillRewriteField
                                              fieldKey={`step-knowledge-${st.id}`}
                                              fieldLabel="步骤专属知识"
                                              multiline
                                              rows={2}
                                              maxLength={1000}
                                              disabled={isAiThinking}
                                              value={st.stepKnowledge || ''}
                                              onChange={(val) => {
                                                setActionChains((prev) =>
                                                  prev.map((c) =>
                                                    c.id === activeChain.id
                                                      ? {
                                                          ...c,
                                                          steps: c.steps.map((p) =>
                                                            p.id === st.id ? { ...p, stepKnowledge: val, hasKnowledge: true } : p,
                                                          ),
                                                        }
                                                      : c,
                                                  ),
                                                );
                                                setIsFormDirty(true);
                                              }}
                                              labelClassName="text-[11px] font-medium text-neutral-600"
                                              inputClassName="leading-relaxed"
                                              placeholder="输入本步骤遵循的专属知识条文、业务判断规则或SOP细则..."
                                              label={
                                                <span className="flex items-center gap-1">
                                                  <span>步骤专属知识</span>
                                                </span>
                                              }
                                              afterInput={
                                                <AttachResourceMenu
                                                  allKBs={mountedKBsForSection2}
                                                  allScripts={mountedScriptsForSection2}
                                                  attachedKBs={st.associatedKBs || []}
                                                  attachedScripts={st.associatedScripts || []}
                                                  onAttachKB={(kb) => {
                                                    const currentKBs = st.associatedKBs || [];
                                                    const newKBs = currentKBs.includes(kb) ? currentKBs : [...currentKBs, kb];
                                                    const tag = `[挂载知识库: ${kb}]`;
                                                    const newKnow = (st.stepKnowledge || '').includes(tag)
                                                      ? (st.stepKnowledge || '')
                                                      : (st.stepKnowledge || '')
                                                        ? `${st.stepKnowledge || ''}\n${tag}`
                                                        : tag;
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, stepKnowledge: newKnow, associatedKBs: newKBs, hasKnowledge: true } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                    setIsFormDirty(true);
                                                  }}
                                                  onAttachScript={(sc) => {
                                                    const currentScripts = st.associatedScripts || [];
                                                    const newScripts = currentScripts.includes(sc) ? currentScripts : [...currentScripts, sc];
                                                    const tag = `[挂载脚本: ${sc}]`;
                                                    const newKnow = (st.stepKnowledge || '').includes(tag)
                                                      ? (st.stepKnowledge || '')
                                                      : (st.stepKnowledge || '')
                                                        ? `${st.stepKnowledge || ''}\n${tag}`
                                                        : tag;
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, stepKnowledge: newKnow, associatedScripts: newScripts, hasKnowledge: true } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                    setIsFormDirty(true);
                                                  }}
                                                  onRemoveKB={(kb) => {
                                                    const newKBs = (st.associatedKBs || []).filter((k) => k !== kb);
                                                    const newKnow = (st.stepKnowledge || '').replace(`[挂载知识库: ${kb}]`, '').trim();
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, stepKnowledge: newKnow, associatedKBs: newKBs } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                  }}
                                                  onRemoveScript={(sc) => {
                                                    const newScripts = (st.associatedScripts || []).filter((s) => s !== sc);
                                                    const newKnow = (st.stepKnowledge || '').replace(`[挂载脚本: ${sc}]`, '').trim();
                                                    setActionChains((prev) =>
                                                      prev.map((c) =>
                                                        c.id === activeChain.id
                                                          ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, stepKnowledge: newKnow, associatedScripts: newScripts } : p)) }
                                                          : c,
                                                      ),
                                                    );
                                                  }}
                                                />
                                              }
                                            />

                                            <SkillRewriteField
                                              fieldKey={`step-example-${st.id}`}
                                              fieldLabel="运行实例"
                                              multiline
                                              rows={2}
                                              maxLength={1000}
                                              disabled={isAiThinking}
                                              value={st.example}
                                              onChange={(val) => {
                                                setActionChains((prev) =>
                                                  prev.map((c) =>
                                                    c.id === activeChain.id
                                                      ? { ...c, steps: c.steps.map((p) => (p.id === st.id ? { ...p, example: val } : p)) }
                                                      : c,
                                                  ),
                                                );
                                                setIsFormDirty(true);
                                              }}
                                              labelClassName="text-[11px] font-medium text-neutral-600"
                                              inputClassName="leading-relaxed"
                                              placeholder="例如：用户输入'查下FW12345678的进度' -> 系统返回'服务单审核通过，已进入检测环节'..."
                                              label={
                                                <span className="flex items-center gap-1">
                                                  <span>运行实例</span>
                                                </span>
                                              }
                                            />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </Reorder.Item>
                                  );
                                })}
                              </Reorder.Group>
                            );
                          })()}
                        </div>
                        </div>

                        {/* 执行步骤大表单下的业务知识与规则模块 */}
                        {showSectionKnowledge && (
                          <div className="mt-4 space-y-3.5 relative border-t border-neutral-100 pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <BookOpen size={14} className="text-neutral-700" />
                                <span className="text-xs font-semibold text-neutral-900">执行业务知识与判定规则</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSectionKnowledge(false);
                                  setKnowledgeContent('');
                                  setDecisionMatrix('');
                                  setIsFormDirty(true);
                                }}
                                className="p-1 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px]"
                                title="删除此知识模块"
                              >
                                <Trash2 size={13} />
                                <span>删除知识模块</span>
                              </button>
                            </div>

                            <SkillRewriteField
                              fieldKey="section-knowledgeContent"
                              fieldLabel="业务知识条文与SOP"
                              multiline
                              rows={3}
                              maxLength={1000}
                              disabled={isAiThinking}
                              value={knowledgeContent}
                              onChange={(val) => {
                                setKnowledgeContent(val);
                                setIsFormDirty(true);
                              }}
                              labelClassName="text-[11px] font-medium text-neutral-600"
                              inputClassName="leading-relaxed"
                              placeholder="例如：&#10;1. 7天无理由退换货：商品签收7天内保持完好包装可申请退货；&#10;2. 保价政策：VIP2级以上用户享有签收15天内自动保价及全额补退差价。"
                              label={<span>业务知识条文与SOP</span>}
                            />

                            <SkillRewriteField
                              fieldKey="decisionMatrix"
                              fieldLabel="判断规则"
                              multiline
                              rows={3}
                              maxLength={1000}
                              disabled={isAiThinking}
                              value={decisionMatrix}
                              onChange={(val) => {
                                setDecisionMatrix(val);
                                setIsFormDirty(true);
                              }}
                              labelClassName="text-[11px] font-medium text-neutral-600"
                              inputClassName="leading-relaxed"
                              placeholder="例如：&#10;- 条件A [金额 < 500元 且 信用良好] -> 自动通过并秒级退款&#10;- 条件B [金额 >= 500元 或 疑似风控] -> 触发二审流并转接人工专家"
                              label={<span>判断规则</span>}
                            />
                          </div>
                        )}
                        </>
                        ) : null}
                          </div>
                        </div>
                      </div>
                      </div>
                    </FormCarouselPanel>

                    <FormCarouselPanel sectionId={3}>
                      <div id="form-section-3" className="flex flex-col h-full min-h-0">
                        {formSectionPanelHeader(3, FORM_SECTION_TITLES[3], false)}
                        <div className={FORM_SECTION_BODY}>
                          <div className={FORM_SECTION_CARD}>
                            <div className={FORM_SECTION_CARD_INNER}>
                        <SkillRewriteField
                          fieldKey="notAllowed"
                          fieldLabel="禁止行为"
                          id="field-notAllowed"
                          multiline
                          rows={3}
                          maxLength={500}
                          disabled={isAiThinking}
                          value={notAllowed}
                          onChange={(val) => {
                            setNotAllowed(val);
                            setIsFormDirty(true);
                            if (validationErrorFields.has('field-notAllowed')) {
                              setValidationErrorFields((prev) => {
                                const n = new Set(prev);
                                n.delete('field-notAllowed');
                                return n;
                              });
                            }
                          }}
                          placeholder="例如：未核验订单凭证严禁承诺全额退款、禁止泄露客户未脱敏手机号..."
                          inputClassName={
                            validationErrorFields.has('field-notAllowed')
                              ? 'bg-white border-2 border-rose-500 font-medium text-rose-950'
                              : dirtyFields.includes('notAllowed')
                                ? 'bg-white border-2 border-amber-400 font-medium text-neutral-900'
                                : ''
                          }
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>禁止行为</span>
                              {dirtyFields.includes('notAllowed') && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                  ✦ 采纳 AI 建议待保存
                                </span>
                              )}
                            </span>
                          }
                          error={
                            validationErrorFields.has('field-notAllowed') ? (
                              <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                <AlertCircle size={11} /> 禁止行为为必填项，请填写
                              </p>
                            ) : null
                          }
                        />

                        <SkillRewriteField
                          fieldKey="contentRedLines"
                          fieldLabel="内容红线"
                          id="field-contentRedLines"
                          multiline
                          rows={2}
                          maxLength={500}
                          disabled={isAiThinking}
                          value={contentRedLines}
                          onChange={(val) => {
                            setContentRedLines(val);
                            setIsFormDirty(true);
                          }}
                          placeholder="例如：严禁使用'绝对假货'、'保证100%赔付'等极限词；不得输出内部工单系统敏感参数..."
                          inputClassName="leading-relaxed"
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>内容红线</span>
                            </span>
                          }
                        />

                        <SkillRewriteField
                          fieldKey="answerTone"
                          fieldLabel="回答口径"
                          multiline
                          rows={2}
                          maxLength={200}
                          disabled={isAiThinking}
                          value={answerTone}
                          onChange={(val) => {
                            setAnswerTone(val);
                            setIsFormDirty(true);
                          }}
                          placeholder="例如：涉及运费险争议统一以京东官方保险条款为准；回答必须包含售后服务单号..."
                          inputClassName="leading-relaxed"
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>回答口径</span>
                            </span>
                          }
                        />

                        <SkillRewriteField
                          fieldKey="fallback"
                          fieldLabel="托底策略"
                          id="field-fallback"
                          multiline
                          rows={3}
                          maxLength={500}
                          disabled={isAiThinking}
                          value={fallback}
                          onChange={(val) => {
                            setFallback(val);
                            setIsFormDirty(true);
                            if (validationErrorFields.has('field-fallback')) {
                              setValidationErrorFields((prev) => {
                                const n = new Set(prev);
                                n.delete('field-fallback');
                                return n;
                              });
                            }
                          }}
                          placeholder="例如：如遇延保系统响应超时超过3秒，请安抚客户并提示稍后刷新，或无缝转接延保人工客服专员..."
                          inputClassName={
                            validationErrorFields.has('field-fallback')
                              ? 'bg-white border-2 border-rose-500 font-medium text-rose-950'
                              : ''
                          }
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>托底策略</span>
                            </span>
                          }
                        />

                        <SkillRewriteField
                          fieldKey="expressionStyle"
                          fieldLabel="表达风格"
                          maxLength={200}
                          disabled={isAiThinking}
                          value={expressionStyle}
                          onChange={(val) => {
                            setExpressionStyle(val);
                            setIsFormDirty(true);
                          }}
                          placeholder="例如：亲切、专业、严谨，单次回复控制在150字以内"
                          label={
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>表达风格</span>
                            </span>
                          }
                        />
                          </div>
                        </div>
                      </div>
                      </div>
                    </FormCarouselPanel>

                    <FormCarouselPanel sectionId={4}>
                      <div id="form-section-4" className="flex flex-col h-full min-h-0">
                        {formSectionPanelHeader(4, FORM_SECTION_TITLES[4], false)}
                        <div className={FORM_SECTION_BODY}>
                          <div className={FORM_SECTION_CARD}>
                            <div className={FORM_SECTION_CARD_INNER}>
                        <div className="space-y-3">
                          <SkillRewriteField
                            fieldKey="usageExamples"
                            fieldLabel="使用示例"
                            id="field-usageExamples"
                            multiline
                            rows={3}
                            maxLength={1000}
                            disabled={isAiThinking}
                            value={usageExamples}
                            onChange={(val) => {
                              setUsageExamples(val);
                              setIsFormDirty(true);
                            }}
                            placeholder="例如：&#10;用户：'我的延保服务单FW123456到哪一步了？'&#10;数字员工：调用延保查询脚本，返回：'尊敬的客户，您的延保服务单正在工程师检测中...'"
                            inputClassName="leading-relaxed text-neutral-600"
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span>使用示例</span>
                              </span>
                            }
                          />

                          <SkillRewriteField
                            fieldKey="customNotes"
                            fieldLabel="补充资料"
                            id="field-customNotes"
                            multiline
                            rows={2}
                            maxLength={1000}
                            disabled={isAiThinking}
                            value={customNotes}
                            onChange={(val) => {
                              setCustomNotes(val);
                              setIsFormDirty(true);
                            }}
                            placeholder="任何其他补充注意事项或背景信息..."
                            inputClassName="leading-relaxed text-neutral-600"
                            label={
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span>补充资料</span>
                              </span>
                            }
                          />
                        </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </FormCarouselPanel>
                  </motion.div>
                </div>
                </SkillRewriteProvider>
              </div>

              {isFormDirty && (
                <div className="px-3 pb-3 shrink-0">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E9EAEB] bg-[#F9F9FB] px-3 py-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-[#717680] min-w-0 leading-snug">
                      右侧有未同步修改 · 继续对话时会自动带上
                    </p>
                    <button
                      type="button"
                      onClick={handleCancelManualChanges}
                      className="h-7 shrink-0 px-2 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] text-[11px] font-medium hover:bg-neutral-50 cursor-pointer"
                    >
                      撤销修改
                    </button>
                  </div>
                </div>
              )}
            </div>
              )}
            </div>
          </div>
          )}

        </div>

        {/* 发布版本 — 对齐设计稿 */}
        {showPublishVersionModal && (
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-[140] animate-in fade-in duration-200 p-4">
            <div
              className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-neutral-100 animate-in zoom-in-95 duration-150 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publish-version-title"
            >
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                      <UploadCloud size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="publish-version-title"
                        className="text-[16px] font-semibold text-neutral-900 leading-6"
                      >
                        发布版本
                      </h3>
                      <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                        为技能“{enId.trim() || cnName.trim() || '未命名技能'}”发布新版本
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPublishVersionModal(false)}
                    className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer shrink-0"
                    aria-label="关闭"
                  >
                    <X size={15} />
                  </button>
                </div>

                {(() => {
                  const bound = draftSkillId
                    ? hiredAgents.filter((a) => a.skills.includes(draftSkillId))
                    : [];
                  if (bound.length === 0) return null;
                  const names = bound.map((a) => a.name).join('、');
                  return (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-900 leading-relaxed">
                      该技能已绑定{' '}
                      <span className="font-semibold">{bound.length}</span> 个数字员工（{names}
                      ），发布后将更新其运行版本。
                    </div>
                  );
                })()}

                <div className="mt-4 space-y-1.5">
                  <label className={LABEL}>
                    版本描述 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      maxLength={120}
                      autoFocus
                      value={publishVersionNote}
                      onChange={(e) => setPublishVersionNote(e.target.value)}
                      placeholder="描述这次发布的内容或变更…"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none resize-none focus:border-neutral-400 placeholder:text-neutral-400 min-h-[96px]"
                    />
                    <span className="absolute right-2.5 bottom-2 text-[11px] tabular-nums text-neutral-400">
                      {publishVersionNote.length}/120
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPublishVersionModal(false)}
                  className={BTN_OUTLINE}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!publishVersionNote.trim()}
                  onClick={handleConfirmPublishVersion}
                  className={BTN_INK}
                >
                  确认发布
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEPPER OVERLAY */}
        {isVerifying && (
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-[140] animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-neutral-100 animate-in zoom-in-95 duration-150">
              
              {verifyPhase === 'required_fields' && (
                <div className="text-center">
                  <AlertCircle size={36} className="text-amber-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-neutral-900">必填内容校验</h4>
                  <div className="text-xs text-neutral-600 mt-2 text-left max-h-40 overflow-y-auto bg-neutral-50 p-3 rounded-lg">
                    {verificationMissingFields.map((field, idx) => (
                      <p key={idx} className="mb-1">• {field}</p>
                    ))}
                  </div>
                  <button onClick={() => setIsVerifying(false)} className="mt-4 w-full py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg">返回填写</button>
                </div>
              )}

              {verifyPhase === 'uniqueness' && (
                <div className="text-center">
                  <AlertCircle size={36} className="text-amber-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-neutral-900">唯一性验证失败</h4>
                  <div className="text-xs text-neutral-600 mt-2 text-left max-h-40 overflow-y-auto bg-neutral-50 p-3 rounded-lg">
                    {verificationDuplicates.map((err, idx) => (
                      <p key={idx} className="mb-1">• {err}</p>
                    ))}
                  </div>
                  <button onClick={() => setIsVerifying(false)} className="mt-4 w-full py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg">返回修改</button>
                </div>
              )}

              {verifyPhase === 'auto_fix' && (
                <div className="text-center py-2">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mx-auto mb-4">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-900">正在发布版本</h4>
                  <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
                    正在校验技能包并部署到运行环境…
                  </p>
                  <div className="mt-4 text-left space-y-1.5 max-h-28 overflow-y-auto rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2">
                    {repairLog.slice(-4).map((log, idx) => (
                      <p key={idx} className="text-[11px] text-neutral-500 leading-relaxed truncate">
                        {log.replace(/^[^\]]+\]\s*/, '')}
                      </p>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}

              {verifyPhase === 'success' && (
                <div className="text-center">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-neutral-900">校验发布成功</h4>
                  <button onClick={() => setIsVerifying(false)} className="mt-4 w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">关闭</button>
                </div>
              )}

              {verifyPhase === 'deployment_failed' && (
                <div className="text-center">
                  <AlertCircle size={36} className="text-red-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-neutral-900">部署失败</h4>
                  <p className="text-xs text-neutral-500 mt-2">部署服务不可用，请稍后重试。</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={runAutoFixSequence} className="flex-1 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg">重试</button>
                    <button onClick={() => setIsVerifying(false)} className="flex-1 py-2 bg-neutral-100 text-neutral-900 text-xs font-bold rounded-lg">返回编辑</button>
                  </div>
                </div>
              )}

              {verifyPhase === 'failed' && (
                <div className="text-center">
                  <AlertCircle size={36} className="text-red-500 mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-neutral-900">校验发布失败</h4>
                  <p className="text-xs text-neutral-500 mt-2">校验未通过，请根据提示返回修改。</p>
                  <button onClick={() => setIsVerifying(false)} className="mt-4 w-full py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg">返回</button>
                </div>
              )}
            </div>
          </div>
        )}

        {skillArtifactOpen && (
          <div
            className="fixed inset-0 z-[260] flex items-center justify-center bg-neutral-900/50 p-5 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setSkillArtifactOpen(false)}
          >
            <div
              className="flex h-[min(720px,88vh)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="查看并修改完整 Skill"
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <FileText size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-neutral-900">
                        {cnName || '未命名 Skill'}
                      </h3>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        完整 Skill
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-neutral-400">
                      {enId || 'auto_skill'} / SKILL.md
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSkillArtifactOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
                  aria-label="关闭"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-b border-line bg-paper px-5 py-2.5 text-[11px] text-neutral-500">
                <span className="rounded-md border border-line bg-white px-2 py-1">
                  {actionChains.reduce((total, chain) => total + chain.steps.length, 0)} 个执行步骤
                </span>
                <span className="rounded-md border border-line bg-white px-2 py-1">
                  {selectedKBs.length} 个知识库
                </span>
                <span className="rounded-md border border-line bg-white px-2 py-1">
                  {selectedScripts.length} 个系统接口
                </span>
                <span className="ml-auto">可直接修改完整规范</span>
              </div>

              <div className="min-h-0 flex-1 bg-white p-4">
                <textarea
                  autoFocus
                  value={skillArtifactDraft}
                  onChange={(event) => setSkillArtifactDraft(event.target.value)}
                  spellCheck={false}
                  className="h-full w-full resize-none rounded-lg border border-line bg-paper p-4 font-mono text-[12px] leading-5 text-neutral-800 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-line bg-white px-5 py-3">
                <span className="text-[11px] text-neutral-400">
                  {skillArtifactDraft.split('\n').length} 行 · {skillArtifactDraft.length} 字符
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillArtifactOpen(false)}
                    className={BTN_OUTLINE}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMarkdown(skillArtifactDraft);
                      setIsFormDirty(true);
                      setSkillArtifactOpen(false);
                      showToast('完整 Skill 已更新');
                    }}
                    className={BTN_INK}
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Modal
          open={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          overlayClassName="z-[260]"
          maxWidth="max-w-sm"
          title="确定返回？"
          description="未保存的内容将丢失，可先点“保存草稿”"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className={BTN_OUTLINE}
              >
                取消
              </button>
              <button type="button" onClick={handleConfirmLeave} className={BTN_INK}>
                确定返回
              </button>
            </>
          }
        >
          <span className="sr-only">返回确认</span>
        </Modal>

        <Modal
          open={showTestModal}
          onClose={() => setShowTestModal(false)}
          overlayClassName="z-[260]"
          maxWidth="max-w-2xl"
          title="配置测试"
          description="选择测试用例来源，AI 将自动运行并生成优化建议"
          footer={
            <>
              <button type="button" onClick={() => setShowTestModal(false)} className={BTN_OUTLINE}>
                取消
              </button>
              <button type="button" onClick={handleConfirmAddTestCases} className={BTN_INK}>
                确认加入用例库
              </button>
            </>
          }
        >
          <div className="space-y-4 max-h-[min(520px,58vh)] overflow-y-auto">
            <SegmentedTabBar
              ariaLabel="测试用例来源"
              stretch
              value={testSource}
              onChange={(id) => setTestSource(id as 'ai' | 'manual' | 'upload')}
              items={[
                {
                  id: 'ai',
                  label: (
                    <span className="inline-flex items-center gap-1">
                      AI 自动生成
                      <span className="text-[10px] text-neutral-400 font-medium">推荐</span>
                    </span>
                  ),
                },
                { id: 'manual', label: '手动输入' },
                { id: 'upload', label: '上传测试集' },
              ]}
            />

            {testSource === 'manual' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] text-neutral-500">
                    逐行填写场景与期望，可增加自定义列
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = manualExtraCols.length + 1;
                      setManualExtraCols((prev) => [
                        ...prev,
                        { id: `col-${Date.now()}`, name: `自定义${idx}` },
                      ]);
                    }}
                    className={cn(BTN_OUTLINE, 'h-7 shrink-0')}
                  >
                    <Plus size={12} />
                    增加列
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-[11px] text-neutral-500 border-b border-neutral-200">
                        <th className="w-10 px-2 py-2 font-medium text-center">#</th>
                        <th className="px-2 py-2 font-medium min-w-[180px]">
                          <span className="text-rose-500">*</span> 输入场景
                        </th>
                        <th className="px-2 py-2 font-medium min-w-[160px]">
                          期望结果
                        </th>
                        {manualExtraCols.map((col) => (
                          <th key={col.id} className="px-2 py-2 font-medium min-w-[120px]">
                            <span className="inline-flex items-center gap-1">
                              {col.name}
                              <button
                                type="button"
                                className="text-neutral-300 hover:text-rose-500 cursor-pointer"
                                aria-label="删除列"
                                onClick={() =>
                                  setManualExtraCols((prev) => prev.filter((c) => c.id !== col.id))
                                }
                              >
                                <X size={10} />
                              </button>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {manualRows.map((row, rowIdx) => (
                        <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-2 py-1.5 text-[11px] text-neutral-400 text-center tabular-nums">
                            {rowIdx + 1}
                          </td>
                          <td className="px-1.5 py-1">
                            <input
                              value={row.input}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, input: e.target.value } : r,
                                  ),
                                )
                              }
                              placeholder='如：用户问“拍错尺码怎么换货？”'
                              className={cn(FIELD, FIELD_CTRL)}
                            />
                          </td>
                          <td className="px-1.5 py-1">
                            <input
                              value={row.oracle}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, oracle: e.target.value } : r,
                                  ),
                                )
                              }
                              placeholder="留空则由 AI 自动判定"
                              className={cn(FIELD, FIELD_CTRL)}
                            />
                          </td>
                          {manualExtraCols.map((col) => (
                            <td key={col.id} className="px-1.5 py-1">
                              <input
                                value={row.extra[col.id] || ''}
                                onChange={(e) =>
                                  setManualRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? { ...r, extra: { ...r.extra, [col.id]: e.target.value } }
                                        : r,
                                    ),
                                  )
                                }
                                placeholder={col.name}
                                className={cn(FIELD, FIELD_CTRL)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setManualRows((prev) => [
                      ...prev,
                      {
                        id: `manual-row-${Date.now()}`,
                        input: '',
                        oracle: '',
                        extra: {},
                      },
                    ])
                  }
                  className="text-[12px] text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  添加一行
                </button>
              </div>
            )}

            {testSource === 'upload' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setUploadFileName('Customer_Support_TestSet_2026.xlsx')}
                  className="w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400 px-4 py-6 text-center transition cursor-pointer"
                >
                  <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-[7px] bg-neutral-100 text-neutral-700">
                    <UploadCloud size={16} />
                  </span>
                  <p className="text-[13px] font-semibold text-neutral-800">
                    {uploadFileName ? `已选择：${uploadFileName}` : '点击上传 CSV / Excel 测试集'}
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-500">支持批量导入 bad case 与回归集</p>
                </button>
                <a
                  href="/assets/testset-standard-template.csv"
                  download
                  className="inline-block text-[12px] font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
                >
                  下载标准用例格式模板
                </a>
              </div>
            )}

            {testSource === 'ai' && (
              <div className="space-y-3">
                <div className={cn(PANEL, 'px-3.5 py-3 flex items-center justify-between gap-3')}>
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-neutral-800">生成条数</label>
                    <p className="mt-0.5 text-[11px] text-neutral-500">默认 5 条，最多 50 条</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={aiCount}
                    onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value) || 5))}
                    className={cn(FIELD, FIELD_CTRL, 'w-20 shrink-0 text-center tabular-nums')}
                    aria-label="生成条数"
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>

    </div>
  );
};
