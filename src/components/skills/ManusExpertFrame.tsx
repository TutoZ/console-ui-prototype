/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 专家模式：Figma 24200:25135 — 文件树 + 代码/预览编辑器
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  Hierarchy,
  Loader2,
  MessageSquare,
  Pencil,
  Wand2,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { BTN_SOFT, SKILL_AOP_PRIMARY_BTN } from '@/lib/ui';
import { mockSkillFieldRewrite } from './SkillRewriteField';

export type ManusExpertFile = {
  id: 'skill.md' | 'schema.json' | 'handler.ts' | 'metadata.yaml';
  name: string;
  path: string;
  content: string;
  original?: string;
  editable?: boolean;
};

export type ManusExpertFrameProps = {
  packageName: string;
  files: ManusExpertFile[];
  onSkillMarkdownChange?: (content: string) => void;
  onToast?: (message: string) => void;
  /** 将选中文本带到左侧对话输入 */
  onAddSelectionToChat?: (text: string) => void;
};

type EditorView = 'code' | 'preview';

type SelectionToolbar = {
  text: string;
  start: number;
  end: number;
  left: number;
  top: number;
};

type RewriteSession = {
  start: number;
  end: number;
  original: string;
  left: number;
  top: number;
  phase: 'prompt' | 'loading' | 'diff';
  instruction: string;
  proposed?: string;
};

type InlineDiffLine = {
  key: string;
  lineNo: number;
  text: string;
};

type InlineDiffView = {
  before: InlineDiffLine[];
  removed: InlineDiffLine[];
  after: InlineDiffLine[];
  addStartLine: number;
};

function buildInlineDiffView(
  fullText: string,
  start: number,
  end: number,
  original: string,
): InlineDiffView {
  const lines = fullText.split('\n');
  const startLine = fullText.slice(0, start).split('\n').length - 1;
  const endLine = fullText.slice(0, Math.max(end, start)).split('\n').length - 1;
  const beforeLines = lines.slice(0, startLine);
  const afterLines = lines.slice(endLine + 1);
  const removedLines = original.length === 0 ? [''] : original.split('\n');

  let lineNo = 1;
  const before = beforeLines.map((text, i) => ({
    key: `h-${i}`,
    lineNo: lineNo++,
    text,
  }));
  const removed = removedLines.map((text, i) => ({
    key: `d-${i}`,
    lineNo: lineNo++,
    text,
  }));
  const addStartLine = before.length + 1;
  const after = afterLines.map((text, i) => ({
    key: `t-${i}`,
    lineNo: 0, // 渲染时按绿增行数重算
    text,
  }));
  return { before, removed, after, addStartLine };
}

const MONO =
  'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const SIDEBAR_WIDTH_KEY = 'jxl_manus_expert_sidebar_w';
const SIDEBAR_COLLAPSED_KEY = 'jxl_manus_expert_sidebar_collapsed';
const SIDEBAR_MIN = 140;
const SIDEBAR_MAX = 420;
const SIDEBAR_DEFAULT = 200;

function readSidebarWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT;
  const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  const n = raw ? Number(raw) : SIDEBAR_DEFAULT;
  if (!Number.isFinite(n)) return SIDEBAR_DEFAULT;
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, n));
}

function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.split('\n\n');
  return (
    <article className="max-w-none text-[#181D27]">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-[15.5px] font-semibold leading-[21.7px] mb-2 mt-4 first:mt-0">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-[16.5px] font-semibold leading-[22.27px] tracking-[-0.01em] mb-2 mt-5 first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-[18px] font-semibold leading-[26px] tracking-[-0.018em] mb-3 pb-2.5 border-b border-[#E9EAEB]">
              {trimmed.slice(2)}
            </h1>
          );
        }

        if (trimmed.includes('\n|') || trimmed.startsWith('|')) {
          const rows = trimmed.split('\n').filter((line) => line.includes('|'));
          if (rows.length >= 2) {
            const cells = rows.map((row) =>
              row
                .split('|')
                .map((cell) => cell.trim())
                .filter(Boolean),
            );
            const header = cells[0];
            const body = cells.slice(2);
            return (
              <div
                key={index}
                className="my-4 overflow-hidden rounded-[14px] border border-[#E9EAEB]"
              >
                <table className="w-full text-left text-base">
                  <thead>
                    <tr className="bg-[#F6F6F6] border-b border-[#E9EAEB]">
                      {header.map((cell) => (
                        <th
                          key={cell}
                          className="px-4 py-3 text-[15.44px] font-semibold leading-[22.39px]"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-[#E9EAEB] last:border-b-0">
                        {row.map((cell) => (
                          <td key={cell} className="px-4 py-3 text-base leading-6 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        if (trimmed.startsWith('- ')) {
          return (
            <ul key={index} className="my-2 space-y-1.5 pl-6 list-disc text-base leading-6">
              {trimmed.split('\n').map((line) => (
                <li key={line}>{line.replace(/^- /, '')}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-base leading-6 mb-2 last:mb-0">
            {trimmed}
          </p>
        );
      })}
    </article>
  );
}

export const ManusExpertFrame: React.FC<ManusExpertFrameProps> = ({
  packageName,
  files,
  onSkillMarkdownChange,
  onToast,
  onAddSelectionToChat,
}) => {
  const fileMap = useMemo(() => {
    const map = {} as Record<ManusExpertFile['id'], ManusExpertFile>;
    files.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [files]);

  const [openTabIds, setOpenTabIds] = useState<ManusExpertFile['id'][]>(['skill.md']);
  const [activeId, setActiveId] = useState<ManusExpertFile['id'] | null>('skill.md');
  const [foldersOpen, setFoldersOpen] = useState({ scripts: true, references: true });
  const [editorView, setEditorView] = useState<EditorView>('code');
  const [selToolbar, setSelToolbar] = useState<SelectionToolbar | null>(null);
  const [rewriteSession, setRewriteSession] = useState<RewriteSession | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const [sidebarDragging, setSidebarDragging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);

  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rewriteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const sidebarDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const openTabs = useMemo(
    () => openTabIds.map((id) => fileMap[id]).filter(Boolean) as ManusExpertFile[],
    [openTabIds, fileMap],
  );

  const active = activeId ? fileMap[activeId] : undefined;
  const hasOpenFile = Boolean(active);
  const canEdit = Boolean(active?.editable);
  const displayText = active?.content ?? '';
  const lineCount = Math.max(displayText.split('\n').length, 1);
  const isDirtyMd =
    Boolean(fileMap['skill.md']) &&
    fileMap['skill.md'].content !== (fileMap['skill.md'].original ?? fileMap['skill.md'].content);

  const showCode = hasOpenFile && editorView === 'code';
  const showPreview = hasOpenFile && editorView === 'preview';
  const rewriteBusy = rewriteSession?.phase === 'loading';

  const openFile = (id: ManusExpertFile['id']) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
    setEditorView('code');
    setSelToolbar(null);
    setRewriteSession(null);
  };

  const closeTab = (id: ManusExpertFile['id'], e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabIds((prev) => {
      const next = prev.filter((tabId) => tabId !== id);
      setActiveId((current) => {
        if (current !== id) return current;
        if (next.length === 0) return null;
        const closedAt = prev.indexOf(id);
        const fallback = next[Math.min(closedAt, next.length - 1)] ?? next[0];
        return fallback;
      });
      return next;
    });
    setEditorView('code');
    setSelToolbar(null);
    setRewriteSession(null);
  };

  const clearSelectionToolbar = useCallback(() => {
    setSelToolbar(null);
  }, []);

  const cancelRewrite = useCallback(() => {
    if (rewriteBusy) return;
    setRewriteSession(null);
  }, [rewriteBusy]);

  const syncSelectionToolbar = useCallback(
    (el: HTMLTextAreaElement, anchor?: { x: number; y: number }) => {
      if (rewriteSession) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (end <= start) {
        setSelToolbar(null);
        return;
      }
      const text = el.value.slice(start, end);
      if (!text.trim()) {
        setSelToolbar(null);
        return;
      }

      const pane = editorPaneRef.current;
      if (!pane) return;
      const paneRect = pane.getBoundingClientRect();
      const point = anchor ?? lastPointerRef.current;
      const barWidth = 268;
      let left: number;
      let top: number;
      if (point) {
        // 用视口坐标转内容坐标，需加上 scroll，否则滚动后工具条会跑出可视区
        left = point.x - paneRect.left + pane.scrollLeft;
        top = point.y - paneRect.top - 44 + pane.scrollTop;
      } else {
        left = pane.scrollLeft + 24;
        top = pane.scrollTop + 8;
      }

      left = Math.max(
        pane.scrollLeft + 8,
        Math.min(left - barWidth / 2, pane.scrollLeft + pane.clientWidth - barWidth - 8),
      );
      top = Math.max(
        pane.scrollTop + 8,
        Math.min(top, pane.scrollTop + pane.clientHeight - 44),
      );

      setSelToolbar({ text, start, end, left, top });
    },
    [rewriteSession],
  );

  // 仅切换文件/视图时清工具条；不要绑 displayText，避免父级重渲染把刚出现的条清掉
  useEffect(() => {
    setSelToolbar(null);
  }, [activeId, editorView]);

  useEffect(() => {
    if (rewriteSession) setSelToolbar(null);
  }, [rewriteSession]);

  useEffect(() => {
    if (!selToolbar && !rewriteSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (rewriteSession) {
        if (rewriteSession.phase === 'loading') return;
        cancelRewrite();
        return;
      }
      clearSelectionToolbar();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-expert-sel-toolbar]')) return;
      if (target?.closest('[data-expert-rewrite-panel]')) return;
      if (rewriteSession) return;
      if (target === textareaRef.current) return;
      clearSelectionToolbar();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [selToolbar, rewriteSession, clearSelectionToolbar, cancelRewrite]);

  useEffect(() => {
    if (rewriteSession?.phase !== 'prompt') return;
    requestAnimationFrame(() => {
      rewriteInputRef.current?.focus();
    });
  }, [rewriteSession?.phase]);

  useEffect(() => {
    if (!sidebarDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = sidebarDragRef.current;
      if (!drag) return;
      const frameW = frameRef.current?.clientWidth ?? 800;
      const maxW = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, frameW - 280));
      const next = Math.min(maxW, Math.max(SIDEBAR_MIN, drag.startW + (e.clientX - drag.startX)));
      setSidebarWidth(next);
    };
    const onUp = () => {
      sidebarDragRef.current = null;
      setSidebarDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarWidth((w) => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(w)));
        return w;
      });
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [sidebarDragging]);

  const startSidebarResize = (e: React.PointerEvent) => {
    e.preventDefault();
    sidebarDragRef.current = { startX: e.clientX, startW: sidebarWidth };
    setSidebarDragging(true);
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const treeFile = (id: ManusExpertFile['id']) => {
    const f = fileMap[id];
    if (!f) return null;
    const activeFile = activeId === id;
    const isOpen = openTabIds.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => openFile(id)}
        className={cn(
          'w-full flex items-center gap-1 h-8 pl-8 pr-2 rounded-md text-left cursor-pointer text-[13px] text-[#181D27]',
          activeFile ? 'bg-[#F6F6F6]' : 'hover:bg-[#F6F6F6]/70',
        )}
      >
        <FileText size={16} className="shrink-0 text-[#717680]" />
        <span className="truncate">{f.name}</span>
        {id === 'skill.md' && isDirtyMd ? (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        ) : isOpen && !activeFile ? (
          <span className="ml-auto w-1 h-1 rounded-full bg-[#A4A7AE] shrink-0" />
        ) : null}
      </button>
    );
  };

  const folderRow = (key: 'scripts' | 'references', label: string) => (
    <button
      type="button"
      onClick={() => setFoldersOpen((v) => ({ ...v, [key]: !v[key] }))}
      className="w-full flex items-center gap-1 h-8 pl-5 pr-2 rounded-md text-[13px] text-[#181D27] hover:bg-[#F6F6F6]/70 cursor-pointer"
    >
      <ChevronRight
        size={14}
        className={cn(
          'text-[#717680] shrink-0 transition-transform',
          foldersOpen[key] && 'rotate-90',
        )}
      />
      <Folder size={16} className="text-[#717680] shrink-0" />
      <span>{label}</span>
    </button>
  );

  const handleDownloadZip = () => {
    const payload = files.map((f) => `=== ${f.path} ===\n${f.content}`).join('\n\n');
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${packageName || 'skill'}-bundle.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    onToast?.('已导出技能包文件');
  };

  const handleAddToChat = () => {
    if (!selToolbar?.text.trim()) return;
    onAddSelectionToChat?.(selToolbar.text);
    clearSelectionToolbar();
  };

  const handleStartRewrite = () => {
    if (!selToolbar?.text.trim()) return;
    if (!canEdit || activeId !== 'skill.md') {
      onToast?.('当前文件只读，无法改写');
      return;
    }
    setRewriteSession({
      start: selToolbar.start,
      end: selToolbar.end,
      original: selToolbar.text,
      left: selToolbar.left,
      top: Math.min(selToolbar.top, (editorPaneRef.current?.clientHeight ?? 320) - 180),
      phase: 'prompt',
      instruction: '',
    });
    clearSelectionToolbar();
  };

  const submitRewrite = async () => {
    if (!rewriteSession || rewriteSession.phase !== 'prompt') return;
    const instruction = rewriteSession.instruction.trim();
    if (!instruction) {
      onToast?.('请先填写改写要求');
      return;
    }
    setRewriteSession((prev) => (prev ? { ...prev, phase: 'loading' } : null));
    try {
      const proposed = await mockSkillFieldRewrite(
        rewriteSession.original,
        instruction,
        Math.max(rewriteSession.original.length * 3, 2000),
        'SKILL.md 选中片段',
      );
      setRewriteSession((prev) =>
        prev
          ? {
              ...prev,
              phase: 'diff',
              proposed: proposed || rewriteSession.original,
            }
          : null,
      );
    } catch {
      onToast?.('改写失败，请重试');
      setRewriteSession((prev) => (prev ? { ...prev, phase: 'prompt' } : null));
    }
  };

  const acceptRewrite = useCallback(() => {
    if (!rewriteSession || rewriteSession.phase !== 'diff' || rewriteSession.proposed == null) return;
    const { start, end, proposed } = rewriteSession;
    const next = displayText.slice(0, start) + proposed + displayText.slice(end);
    onSkillMarkdownChange?.(next);
    setRewriteSession(null);
    onToast?.('已保留改写');
  }, [rewriteSession, displayText, onSkillMarkdownChange, onToast]);

  const updateProposed = useCallback((next: string) => {
    setRewriteSession((prev) =>
      prev && prev.phase === 'diff' ? { ...prev, proposed: next } : prev,
    );
  }, []);

  const inlineDiffView = useMemo(() => {
    if (!rewriteSession || rewriteSession.phase !== 'diff' || rewriteSession.proposed == null) {
      return null;
    }
    return buildInlineDiffView(
      displayText,
      rewriteSession.start,
      rewriteSession.end,
      rewriteSession.original,
    );
  }, [rewriteSession, displayText]);

  const showInlineDiff = Boolean(inlineDiffView && rewriteSession?.proposed != null);
  const proposedText = rewriteSession?.proposed ?? '';
  const proposedLineCount = Math.max(proposedText.split('\n').length, 1);

  useEffect(() => {
    if (!showInlineDiff) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        cancelRewrite();
      } else if (key === 'y') {
        e.preventDefault();
        acceptRewrite();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showInlineDiff, cancelRewrite, acceptRewrite]);

  const panelLeft = rewriteSession
    ? Math.max(8, Math.min(rewriteSession.left, (editorPaneRef.current?.clientWidth ?? 420) - 320))
    : 0;
  const panelTop = rewriteSession
    ? Math.max(8, Math.min(rewriteSession.top, (editorPaneRef.current?.clientHeight ?? 320) - 200))
    : 0;

  const renderDiffCtxLine = (line: InlineDiffLine) => (
    <div key={line.key} className="flex min-h-[20px]">
      <div
        aria-hidden
        className="w-10 shrink-0 border-r border-[#E9EAEB] text-right pr-1.5 select-none tabular-nums text-[10px] leading-[20px] text-[#237893] bg-[#FFFFFE]"
      >
        {line.lineNo}
      </div>
      <div aria-hidden className="w-1.5 shrink-0 bg-transparent" />
      <pre className="flex-1 min-w-0 m-0 px-3 whitespace-pre-wrap break-words leading-[20px] text-[#181D27]">
        {line.text || ' '}
      </pre>
    </div>
  );

  const renderDiffDelLine = (line: InlineDiffLine) => (
    <div key={line.key} className="flex min-h-[20px] bg-[#FCECEC]">
      <div
        aria-hidden
        className="w-10 shrink-0 border-r border-rose-200 text-right pr-1.5 select-none tabular-nums text-[10px] leading-[20px] text-rose-500 bg-[repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(244,63,94,0.12)_2px,rgba(244,63,94,0.12)_4px)]"
      >
        {line.lineNo}
      </div>
      <div aria-hidden className="w-1.5 shrink-0 bg-rose-400/80" />
      <pre className="flex-1 min-w-0 m-0 px-3 whitespace-pre-wrap break-words leading-[20px] text-neutral-800">
        {line.text || ' '}
      </pre>
    </div>
  );

  return (
    <div ref={frameRef} className="flex-1 min-h-0 flex overflow-hidden bg-white select-text">
      {!sidebarCollapsed ? (
        <>
          <aside
            style={{ width: sidebarWidth }}
            className="shrink-0 border-r border-[#E9EAEB] overflow-y-auto px-1.5 py-2"
          >
            <button
              type="button"
              onClick={() => openFile('skill.md')}
              className="w-full h-8 px-2 rounded-md text-left text-[13px] text-[#181D27] hover:bg-[#F6F6F6]/70 cursor-pointer truncate"
            >
              {packageName}
            </button>
            <div className="mt-0.5 space-y-0.5">
              {folderRow('references', 'references')}
              {foldersOpen.references ? treeFile('schema.json') : null}
              {folderRow('scripts', 'scripts')}
              {foldersOpen.scripts ? treeFile('handler.ts') : null}
              {treeFile('skill.md')}
              {treeFile('metadata.yaml')}
            </div>
          </aside>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="调整文件树宽度"
            title="拖动调整宽度"
            onPointerDown={startSidebarResize}
            className={cn(
              'relative w-0 shrink-0 z-10 cursor-col-resize touch-none',
              'before:absolute before:inset-y-0 before:-left-1 before:w-2 before:content-[""]',
              'after:absolute after:inset-y-0 after:left-[-1px] after:w-0.5 after:rounded-full after:content-[""] after:transition-colors',
              sidebarDragging
                ? 'after:bg-[#1565BF]/45'
                : 'after:bg-transparent hover:after:bg-[#1565BF]/35',
            )}
          />
        </>
      ) : null}

      <section className="flex-1 min-w-0 flex flex-col bg-white">
        <div className="h-12 px-2 flex items-center justify-between gap-2 border-b border-[#E9EAEB] shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-hidden">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className={cn(
                'h-8 w-8 rounded-md inline-flex items-center justify-center shrink-0 cursor-pointer transition',
                'text-[#181D27] hover:bg-[#F6F6F6]',
                !sidebarCollapsed && 'bg-[#F6F6F6]',
              )}
              title={sidebarCollapsed ? '展开文件树' : '收起文件树'}
              aria-label={sidebarCollapsed ? '展开文件树' : '收起文件树'}
              aria-pressed={!sidebarCollapsed}
            >
              <Hierarchy size={16} />
            </button>
            <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {openTabs.map((tab) => {
                const isActive = activeId === tab.id;
                return (
                  <div
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => openFile(tab.id)}
                    title={`${packageName} / ${tab.path}`}
                    className={cn(
                      'h-8 max-w-[180px] inline-flex items-center gap-1 pl-2 pr-1 rounded-md text-sm min-w-0 cursor-pointer shrink-0 transition',
                      isActive
                        ? 'bg-[#F6F6F6] text-[#181D27]'
                        : 'bg-transparent text-[#717680] hover:bg-[#F6F6F6]/70 hover:text-[#181D27]',
                    )}
                  >
                    <FileText size={14} className="shrink-0 text-[#717680]" />
                    <span className="truncate min-w-0">{tab.name}</span>
                    {tab.id === 'skill.md' && isDirtyMd ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => closeTab(tab.id, e)}
                      className="w-5 h-5 rounded-md inline-flex items-center justify-center text-[#717680] hover:text-[#181D27] hover:bg-white cursor-pointer shrink-0"
                      title="关闭"
                      aria-label={`关闭 ${tab.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeId === 'skill.md' ? (
              <>
                {showPreview && canEdit ? (
                  <button
                    type="button"
                    onClick={() => setEditorView('code')}
                    className="h-8 w-8 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] inline-flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition"
                    title="编辑"
                    aria-label="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditorView('preview')}
                    className="h-8 w-8 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] inline-flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition"
                    title="预览"
                    aria-label="预览"
                  >
                    <Eye size={14} />
                  </button>
                )}
              </>
            ) : null}
            <button
              type="button"
              onClick={handleDownloadZip}
              className="h-8 w-8 rounded-lg border border-[#E9EAEB] bg-white text-[#181D27] inline-flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition"
              title="下载zip"
              aria-label="下载zip"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {!hasOpenFile ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 bg-[#FFFFFE] text-[#717680]">
            <FileText size={28} className="text-[#A4A7AE]" strokeWidth={1.5} />
            <p className="text-sm">请选择文件展示</p>
          </div>
        ) : null}

        {showCode ? (
          <div
            ref={editorPaneRef}
            className="flex-1 min-h-0 overflow-auto bg-[#FFFFFE] relative select-text"
            onScroll={() => {
              if (!rewriteSession) clearSelectionToolbar();
            }}
          >
            <div className="sticky top-0 h-1.5 pointer-events-none bg-gradient-to-b from-[#DDDDDD]/35 to-transparent z-10" />
            {showInlineDiff && inlineDiffView ? (
              <div className="min-h-full pb-8" style={{ fontFamily: MONO, fontSize: 13, lineHeight: '20px' }}>
                {inlineDiffView.before.map(renderDiffCtxLine)}
                {inlineDiffView.removed.map(renderDiffDelLine)}
                <div className="flex bg-[#E7F6ED]">
                  <div
                    aria-hidden
                    className="w-10 shrink-0 border-r border-emerald-200 text-right pr-1.5 select-none tabular-nums text-[10px] leading-[20px] text-emerald-600 bg-emerald-100/50"
                  >
                    {Array.from({ length: proposedLineCount }, (_, idx) => (
                      <div key={idx}>{inlineDiffView.addStartLine + idx}</div>
                    ))}
                  </div>
                  <div aria-hidden className="w-1.5 shrink-0 bg-emerald-500" />
                  <textarea
                    value={proposedText}
                    onChange={(e) => updateProposed(e.target.value)}
                    spellCheck={false}
                    aria-label="编辑改写结果"
                    className="flex-1 min-w-0 m-0 px-3 py-0 bg-transparent outline-none resize-none whitespace-pre-wrap break-words leading-[20px] text-neutral-800"
                    style={{
                      height: `${proposedLineCount * 20}px`,
                      fontFamily: MONO,
                      fontSize: 13,
                      lineHeight: '20px',
                    }}
                  />
                </div>
                <div className="pl-[46px] pr-3 py-1.5 flex items-center gap-1.5 bg-[#FFFFFE]">
                  <button
                    type="button"
                    onClick={cancelRewrite}
                    className={cn(BTN_SOFT, 'h-6 px-2 text-[12px]')}
                  >
                    撤销
                  </button>
                  <button
                    type="button"
                    onClick={acceptRewrite}
                    className="h-6 px-2 rounded-md text-[12px] font-medium inline-flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition"
                  >
                    保留
                  </button>
                </div>
                {inlineDiffView.after.map((line, idx) =>
                  renderDiffCtxLine({
                    ...line,
                    lineNo: inlineDiffView.addStartLine + proposedLineCount + idx,
                  }),
                )}
              </div>
            ) : (
              <div className="flex min-h-full">
                <div
                  aria-hidden
                  className="w-7 shrink-0 border-r border-[#E9EAEB] bg-[#FFFFFE] text-right pr-1 py-3 text-[10px] leading-[20px] text-[#237893] select-none tabular-nums"
                  style={{ fontFamily: MONO }}
                >
                  {Array.from({ length: lineCount }, (_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={displayText}
                  readOnly={!canEdit || Boolean(rewriteSession)}
                  onChange={
                    canEdit && !rewriteSession
                      ? (e) => {
                          onSkillMarkdownChange?.(e.target.value);
                          clearSelectionToolbar();
                        }
                      : undefined
                  }
                  onPointerDown={(e) => {
                    lastPointerRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons > 0) {
                      lastPointerRef.current = { x: e.clientX, y: e.clientY };
                    }
                  }}
                  onMouseUp={(e) => {
                    if (rewriteSession) return;
                    lastPointerRef.current = { x: e.clientX, y: e.clientY };
                    const el = e.currentTarget;
                    // 等选区落定后再读，避免 mouseup 瞬间 selection 仍为空
                    requestAnimationFrame(() => {
                      syncSelectionToolbar(el, { x: e.clientX, y: e.clientY });
                    });
                  }}
                  onSelect={(e) => {
                    if (rewriteSession) return;
                    const el = e.currentTarget;
                    if (el.selectionEnd > el.selectionStart) {
                      syncSelectionToolbar(el, lastPointerRef.current ?? undefined);
                    }
                  }}
                  onKeyUp={(e) => {
                    if (rewriteSession) return;
                    if (e.key === 'Shift' || e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
                      syncSelectionToolbar(e.currentTarget);
                    }
                  }}
                  spellCheck={false}
                  className={cn(
                    'w-full min-w-0 flex-1 py-3 pl-3 pr-5 bg-[#FFFFFE] outline-none resize-none overflow-hidden whitespace-pre text-[#181D27] selection:bg-[rgba(21,101,191,0.12)] select-text',
                    (!canEdit || rewriteSession) && 'cursor-default text-[#717680]',
                  )}
                  style={{
                    height: `${Math.max(lineCount, 28) * 20}px`,
                    fontFamily: MONO,
                    fontSize: 13,
                    lineHeight: '20px',
                  }}
                />
              </div>
            )}

            {selToolbar && !rewriteSession ? (
              <div
                data-expert-sel-toolbar
                role="toolbar"
                aria-label="选中文本操作"
                className="absolute z-20 h-9 px-1.5 inline-flex items-center gap-0.5 rounded-full bg-white border border-[#E9EAEB] shadow-[0_4px_16px_rgba(24,29,39,0.12)]"
                style={{ left: selToolbar.left, top: selToolbar.top }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
              >
                <button
                  type="button"
                  onClick={handleAddToChat}
                  className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-[12px] font-medium text-[#181D27] hover:bg-[#F6F6F6] cursor-pointer transition"
                >
                  <MessageSquare size={14} className="text-[#535862] shrink-0" />
                  添加到对话
                </button>
                <span className="w-px h-4 bg-[#E9EAEB] shrink-0" aria-hidden />
                <button
                  type="button"
                  onClick={handleStartRewrite}
                  className="h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-[12px] font-medium text-[#181D27] hover:bg-[#F6F6F6] cursor-pointer transition"
                >
                  <Wand2 size={14} className="text-[#535862] shrink-0" />
                  大模型改写
                </button>
              </div>
            ) : null}

            {rewriteSession && (rewriteSession.phase === 'prompt' || rewriteSession.phase === 'loading') ? (
              <div
                data-expert-rewrite-panel
                className="absolute z-30 w-[min(360px,calc(100%-16px))] rounded-[16px] border border-neutral-800 bg-white shadow-[0_4px_16px_rgba(17,17,17,0.06)] overflow-hidden"
                style={{ left: panelLeft, top: panelTop }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <textarea
                    ref={rewriteInputRef}
                    rows={3}
                    value={rewriteSession.instruction}
                    disabled={rewriteBusy}
                    onChange={(e) =>
                      setRewriteSession((prev) =>
                        prev ? { ...prev, instruction: e.target.value } : null,
                      )
                    }
                    onKeyDown={(e) => {
                      if (rewriteBusy) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelRewrite();
                        return;
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void submitRewrite();
                      }
                    }}
                    placeholder="描述如何改写这段内容…"
                    className={cn(
                      'w-full min-h-[88px] max-h-40 bg-transparent text-[14px] px-4 pt-3.5 pb-12 outline-none resize-none',
                      'placeholder:text-neutral-400 text-[#181D27] leading-[22px] rounded-[16px]',
                      rewriteBusy && 'opacity-70 cursor-wait',
                    )}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={rewriteBusy}
                      onClick={cancelRewrite}
                      className={cn(BTN_SOFT, 'h-7 px-3 text-[13px]', rewriteBusy && 'opacity-50 cursor-not-allowed')}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={rewriteBusy || !rewriteSession.instruction.trim()}
                      onClick={() => void submitRewrite()}
                      title={rewriteBusy ? '改写中' : '发送改写'}
                      aria-busy={rewriteBusy}
                      className={cn(
                        SKILL_AOP_PRIMARY_BTN,
                        'h-7 px-3 rounded-md text-[13px] gap-1.5 inline-flex items-center',
                        rewriteBusy && 'cursor-wait',
                      )}
                    >
                      {rewriteBusy ? <Loader2 size={13} className="animate-spin" /> : null}
                      发送
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {showPreview ? (
          <div className="flex-1 min-h-0 overflow-auto bg-white p-6">
            <MarkdownPreview content={displayText} />
          </div>
        ) : null}
      </section>
    </div>
  );
};
