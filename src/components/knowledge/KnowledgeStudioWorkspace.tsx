/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识库创建工作台：落地页一句话建库 → 左对话坞 + 右知识卡（可收展）。
 * 首页 AI 搭建与「员工知识」列表共用；流程对齐技能工作室，功能为建库/文档/解析/检索。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/src/context/AppContext';
import type { KnowledgeBase } from '@/src/types';
import {
  ArrowUp,
  FileUp,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  Upload,
} from '@/lib/icons';
import { GoalComposerGhost } from '../GoalComposerGhost';
import { CompanionAssistPanel } from '../common/CompanionAssistPanel';
import { NavBackButton } from '../common/NavBackButton';
import { KnowledgeBaseWorkspace } from './KnowledgeBaseWorkspace';
import {
  BTN_OUTLINE,
  CHIP,
  SKILL_AOP_GRADIENT_TEXT,
  SKILL_AOP_PRIMARY_BTN,
  SKILL_AOP_SEND_BTN,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import { KNOWLEDGE_CREATE_CASES } from '@/lib/homeCreateCases';

const LEFT_CHAT_WIDTH = 30;

const KB_LANDING_TIPS = KNOWLEDGE_CREATE_CASES.map((c) => c.label);

type StudioPhase = 'landing' | 'workspace';

export interface KnowledgeStudioWorkspaceProps {
  open: boolean;
  onClose: () => void;
  /** 落地页 / 首页直达时的返回文案 */
  closeLabel?: string;
  /** 首页带入：跳过落地页，直接建库并进入工作台 */
  initialPrompt?: string | null;
  /** 列表进库：直接打开已有知识库 */
  initialKbId?: string | null;
}

function nameFromPrompt(text: string): string {
  const quoted = text.match(/[“"]([^”"]+)[”"]/);
  const name = (quoted?.[1] || text.replace(/^帮我建一个/, '').replace(/知识库$/, ''))
    .trim()
    .slice(0, 30);
  return name || '未命名知识库';
}

export const KnowledgeStudioWorkspace: React.FC<KnowledgeStudioWorkspaceProps> = ({
  open,
  onClose,
  closeLabel = '返回列表',
  initialPrompt = null,
  initialKbId = null,
}) => {
  const {
    knowledgeBases,
    hiredAgents,
    createKnowledgeBase,
    updateKnowledgeBase,
    showToast,
  } = useApp();

  const [phase, setPhase] = useState<StudioPhase>('landing');
  const [activeKBId, setActiveKBId] = useState<string | null>(null);
  /** 刚创建时上下文列表可能尚未刷入，先用本地草稿渲染 */
  const [draftKb, setDraftKb] = useState<KnowledgeBase | null>(null);
  const [landingDraft, setLandingDraft] = useState('');
  const [landingTipIndex, setLandingTipIndex] = useState(0);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  /** 首页直达：工作台返回直接退出，不回落落地页 */
  const [directExit, setDirectExit] = useState(false);
  const bootKeyRef = useRef<string | null>(null);
  const createKnowledgeBaseRef = useRef(createKnowledgeBase);
  createKnowledgeBaseRef.current = createKnowledgeBase;

  const activeKb = useMemo(() => {
    if (!activeKBId) return null;
    const fromStore = knowledgeBases.find((k) => k.id === activeKBId) ?? null;
    if (fromStore) return fromStore;
    if (draftKb?.id === activeKBId) return draftKb;
    return null;
  }, [activeKBId, knowledgeBases, draftKb]);

  const activeKbAgentNames = useMemo(() => {
    if (!activeKb) return '暂无绑定员工';
    const names = hiredAgents
      .filter((a) => a.knowledgeBases.includes(activeKb.id))
      .map((a) => a.name);
    return names.length > 0 ? names.join('、') : '暂无绑定员工';
  }, [activeKb, hiredAgents]);

  useEffect(() => {
    if (!open) {
      bootKeyRef.current = null;
      setPhase('landing');
      setActiveKBId(null);
      setDraftKb(null);
      setLandingDraft('');
      setRightCollapsed(false);
      setDirectExit(false);
      return;
    }

    const bootKey = `${initialKbId ?? ''}|${(initialPrompt ?? '').slice(0, 80)}|open`;
    if (bootKeyRef.current === bootKey) return;
    bootKeyRef.current = bootKey;

    if (initialKbId) {
      setDraftKb(null);
      setActiveKBId(initialKbId);
      setPhase('workspace');
      setRightCollapsed(false);
      setDirectExit(false);
      setLandingDraft('');
      return;
    }

    const seed = initialPrompt?.trim();
    if (seed) {
      const kb = createKnowledgeBaseRef.current(nameFromPrompt(seed));
      setDraftKb(kb);
      setActiveKBId(kb.id);
      setPhase('workspace');
      setRightCollapsed(false);
      setDirectExit(true);
      setLandingDraft('');
      return;
    }

    setDraftKb(null);
    setActiveKBId(null);
    setPhase('landing');
    setRightCollapsed(true);
    setDirectExit(false);
    setLandingDraft('');
  }, [open, initialKbId, initialPrompt]);

  useEffect(() => {
    if (draftKb && knowledgeBases.some((k) => k.id === draftKb.id)) {
      setDraftKb(null);
    }
  }, [draftKb, knowledgeBases]);

  useEffect(() => {
    if (!activeKBId || phase !== 'workspace') return;
    if (activeKb) return;
    // 仅当列表已加载且确实被删除时回落；避免刚创建时的短暂空窗
    const knownGone =
      knowledgeBases.length > 0 && !knowledgeBases.some((k) => k.id === activeKBId);
    if (!knownGone) return;
    setActiveKBId(null);
    setDraftKb(null);
    if (directExit) onClose();
    else {
      setPhase('landing');
      setRightCollapsed(true);
    }
  }, [activeKBId, activeKb, phase, directExit, onClose, knowledgeBases]);

  const openWorkspace = (kbId: string, kb?: KnowledgeBase) => {
    if (kb) setDraftKb(kb);
    setActiveKBId(kbId);
    setPhase('workspace');
    setRightCollapsed(false);
  };

  const backFromWorkspace = () => {
    if (directExit) {
      onClose();
      return;
    }
    setActiveKBId(null);
    setDraftKb(null);
    setPhase('landing');
    setRightCollapsed(true);
  };

  const startFromLanding = (raw?: string) => {
    const text = (raw ?? landingDraft).trim();
    if (!text) return;
    const kb = createKnowledgeBase(nameFromPrompt(text));
    setLandingDraft('');
    openWorkspace(kb.id, kb);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (phase === 'workspace') backFromWorkspace();
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const companionTools = [
    {
      id: 'create',
      label: '智能建库',
      icon: <Plus size={16} strokeWidth={1.75} />,
      onClick: backFromWorkspace,
    },
    {
      id: 'upload',
      label: '文档入库',
      icon: <Upload size={16} strokeWidth={1.75} />,
      onClick: () => {
        showToast('请点击对话输入框旁「+」上传 1 个文件');
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
  ];

  const landingReady = phase === 'landing' || !activeKb;
  const acceptLandingTip = () => {
    const label = KB_LANDING_TIPS[landingTipIndex % KB_LANDING_TIPS.length];
    setLandingDraft(`帮我建一个“${label}”知识库`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[240] bg-white flex flex-col w-screen h-screen overflow-hidden text-neutral-800 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={activeKb ? `知识库：${activeKb.name}` : '创建知识库'}
    >
      {landingReady ? (
        <div className="absolute top-3 left-3 z-30">
          <NavBackButton onClick={onClose} label={closeLabel} variant="soft" />
        </div>
      ) : (
        <header className="h-14 shrink-0 flex bg-white select-none shadow-[0_1px_0_0_rgba(233,234,235,0.65)]">
          <div
            className="flex items-center px-3 shrink-0 min-w-0"
            style={{ width: rightCollapsed ? 'auto' : `${LEFT_CHAT_WIDTH}%` }}
          >
            <NavBackButton
              onClick={backFromWorkspace}
              label={directExit ? closeLabel : '返回'}
              variant="soft"
            />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-end px-2 gap-2">
            {!rightCollapsed && activeKb ? (
              <>
                <button
                  type="button"
                  onClick={() => showToast('请在右侧文档列表中点击「上传文档」')}
                  className={cn(BTN_OUTLINE, 'h-8 gap-1.5')}
                >
                  <Upload size={13} />
                  上传文档
                </button>
                <button
                  type="button"
                  onClick={() => showToast('已发布当前知识库配置')}
                  className={cn(SKILL_AOP_PRIMARY_BTN, 'h-8 px-3 rounded-lg text-[13px]')}
                >
                  发布
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center px-3 shrink-0">
            <button
              type="button"
              onClick={() => setRightCollapsed((v) => !v)}
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-transparent text-[#717680] hover:text-[#181D27] hover:bg-white hover:border-[#E9EAEB] transition cursor-pointer shrink-0"
              title={rightCollapsed ? '展开工作区' : '收起工作区'}
              aria-label={rightCollapsed ? '展开工作区' : '收起工作区'}
            >
              {rightCollapsed ? (
                <PanelLeftOpen size={16} className="rotate-180" />
              ) : (
                <PanelLeftClose size={16} className="rotate-180" />
              )}
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 min-h-0 flex bg-white overflow-hidden">
        {landingReady ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 pb-16 bg-white relative">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[min(560px,70%)] -translate-x-1/2 -translate-y-[55%] rounded-full bg-[rgba(21,101,191,0.09)] blur-[80px]"
            />
            <div className="w-full max-w-[860px] space-y-6 relative z-10 animate-in fade-in duration-200">
              <div className="text-center space-y-3 pt-2">
                <h1 className="text-[40px] sm:text-[44px] leading-[1.05] font-normal text-black tracking-tight">
                  要沉淀什么资料，我来帮你
                  <span className={cn('font-bold', SKILL_AOP_GRADIENT_TEXT)}>创建知识库</span>
                </h1>
                <p className="text-[14px] leading-5 text-[#535862] mx-auto">
                  写清知识用途与覆盖范围，我们会写入右侧知识库并持续帮你补全。
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
                  {!landingDraft ? (
                    <GoalComposerGhost
                      labels={KB_LANDING_TIPS}
                      tipIndex={landingTipIndex}
                      onTipIndexChange={setLandingTipIndex}
                      onAcceptTab={acceptLandingTip}
                      variant="knowledge"
                    />
                  ) : null}
                  <textarea
                    rows={3}
                    autoFocus
                    maxLength={1000}
                    value={landingDraft}
                    onChange={(e) => setLandingDraft(e.target.value.slice(0, 1000))}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey && !landingDraft.trim()) {
                        e.preventDefault();
                        acceptLandingTip();
                        return;
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startFromLanding();
                      }
                    }}
                    aria-label="描述希望沉淀的知识"
                    className="relative z-[1] w-full min-h-[80px] max-h-36 bg-transparent text-[14px] leading-[21px] px-1 pt-1 pb-2 outline-none resize-none text-[#181D27]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 px-1">
                  <span className="text-[12px] leading-[22px] text-neutral-400 tabular-nums">
                    {landingDraft.length}/1000
                  </span>
                  <button
                    type="button"
                    onClick={() => startFromLanding()}
                    disabled={!landingDraft.trim()}
                    className={cn(SKILL_AOP_SEND_BTN, 'w-8 h-8')}
                    title="开始建库"
                    aria-label="开始建库"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {KB_LANDING_TIPS.map((label, tipIndex) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setLandingTipIndex(tipIndex);
                      startFromLanding(`帮我建一个“${label}”知识库`);
                    }}
                    className={cn(CHIP, 'h-8 max-w-[220px] text-neutral-700')}
                  >
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeKb ? (
          <>
            <div
              style={{ width: rightCollapsed ? '100%' : `${LEFT_CHAT_WIDTH}%` }}
              className="flex flex-col min-h-0 relative shrink-0 transition-[width] duration-200 select-text bg-[#F9F9FB]"
            >
              <CompanionAssistPanel
                layout="dock"
                open
                knowledgeName={activeKb.name}
                highlightValue={knowledgeBases.length}
                showChrome={false}
                showToast={showToast}
                onConfirmIngest={(result) => {
                  updateKnowledgeBase(activeKb.id, {
                    docCount: activeKb.docCount + 1,
                    wordCount: activeKb.wordCount + result.total * 80,
                    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  });
                }}
                inputPlaceholder="继续补充规则，或上传文档让我清洗分片…"
                className="w-full min-w-0 max-w-none"
                replyChips={['清理格式并提取问答', '按业务主题生成分片', '试跑检索效果', '完善解析配置']}
                tools={companionTools}
              />
            </div>
            {!rightCollapsed ? (
              <div
                id="kb-form-workspace"
                className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#F9F9FB] pl-2 pr-2 pt-0 pb-2 relative transition-all duration-200 select-text"
              >
                <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#E9EAEB] rounded-2xl shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
                  <KnowledgeBaseWorkspace
                    kb={activeKb}
                    agentName={activeKbAgentNames}
                    onBack={backFromWorkspace}
                    onUpdateKb={updateKnowledgeBase}
                    showToast={(message) => showToast(message)}
                    variant="fullscreen"
                    companionOpen
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
