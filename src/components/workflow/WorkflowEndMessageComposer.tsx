import React, { useEffect, useRef, useState } from 'react';
import { Box, X } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  createEndTextPart,
  createEndVarPart,
  ensureEndEditableTail,
  getEndMessageTextLength,
  insertEndVarIntoParts,
  isEndMessageEmpty,
  mergeEndAdjacentText,
  moveEndVarIntoText,
  moveEndVarPart,
} from './workflowConstants';
import type { WorkflowEndPart } from './workflowTypes';
import {
  detectSlashQuery,
  WorkflowSlashVarMenu,
} from './WorkflowSlashVarMenu';

type SlashState = {
  partId: string;
  startIndex: number;
  query: string;
};

type TextDropTarget = {
  partId: string;
  offset: number;
};

type WorkflowEndMessageComposerProps = {
  parts: WorkflowEndPart[];
  onChange: (parts: WorkflowEndPart[]) => void;
  className?: string;
};

const MAX_LEN = 5000;

export function WorkflowEndMessageComposer({
  parts,
  onChange,
  className,
}: WorkflowEndMessageComposerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const focusedPartRef = useRef<string | null>(null);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashAnchor, setSlashAnchor] = useState<DOMRect | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [textDrop, setTextDrop] = useState<TextDropTarget | null>(null);

  const safeParts = parts?.length ? parts : [createEndTextPart('')];
  const textLen = getEndMessageTextLength(safeParts);
  const empty = isEndMessageEmpty(safeParts);

  useEffect(() => {
    for (const p of safeParts) {
      if (p.kind !== 'text') continue;
      const el = textRefs.current[p.id];
      if (!el) continue;
      if (document.activeElement === el) continue;
      if ((el.textContent || '') !== (p.text ?? '')) el.textContent = p.text ?? '';
    }
  }, [safeParts]);

  useEffect(() => {
    if (!slash) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!(t instanceof Element)) return;
      if (t.closest('[data-kb-popover]') || t.closest('[data-kb-trigger]')) return;
      if (rootRef.current?.contains(t)) return;
      setSlash(null);
      setSlashAnchor(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [slash]);

  const commitParts = (next: WorkflowEndPart[]) => {
    onChange(ensureEndEditableTail(mergeEndAdjacentText(next)));
  };

  const updateTextPart = (id: string, text: string) => {
    commitParts(
      safeParts.map((p) =>
        p.id === id && p.kind === 'text' ? { ...p, text: text.slice(0, MAX_LEN) } : p,
      ),
    );
  };

  const removeVar = (id: string) => {
    commitParts(safeParts.filter((p) => p.id !== id));
    setSlash(null);
    setSlashAnchor(null);
  };

  const syncSlashFromPart = (partId: string, value: string, caret: number) => {
    const hit = detectSlashQuery(value, caret);
    if (!hit) {
      setSlash(null);
      setSlashAnchor(null);
      return;
    }
    setSlash({ partId, startIndex: hit.startIndex, query: hit.query });
    const el = textRefs.current[partId];
    if (el) {
      setSlashAnchor(getCaretAnchorRect(el) ?? el.getBoundingClientRect());
    }
  };

  const getCaretInTextNode = (el: HTMLElement): number => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return (el.textContent || '').length;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer)) return (el.textContent || '').length;
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
  };

  const insertVar = (key: string) => {
    if (slash) {
      const slashLen = 1 + slash.query.length;
      commitParts(
        insertEndVarIntoParts(safeParts, slash.partId, slash.startIndex, slashLen, key),
      );
      setSlash(null);
      setSlashAnchor(null);
      return;
    }
    // 插入到当前光标所在文字中间
    const focusId = focusedPartRef.current;
    const focusEl = focusId ? textRefs.current[focusId] : null;
    if (focusId && focusEl && document.activeElement === focusEl) {
      const caret = getCaretInTextNode(focusEl);
      commitParts(insertEndVarIntoParts(safeParts, focusId, caret, 0, key));
      return;
    }
    const last = safeParts[safeParts.length - 1];
    if (last?.kind === 'text') {
      commitParts(
        insertEndVarIntoParts(safeParts, last.id, last.text.length, 0, key),
      );
    } else {
      commitParts([...safeParts, createEndVarPart(key), createEndTextPart('')]);
    }
  };

  /** 在当前光标处插入 /，打开变量菜单（支持文字中间） */
  const openSlashAtCaret = () => {
    const ensured = ensureEndEditableTail(safeParts);
    let target =
      ensured.find((p) => p.id === focusedPartRef.current && p.kind === 'text') ??
      ensured[ensured.length - 1];
    if (!target || target.kind !== 'text') {
      target = createEndTextPart('');
      commitParts([...ensured, target]);
    }
    const el = textRefs.current[target.id];
    const caret =
      el && document.activeElement === el
        ? getCaretInTextNode(el)
        : target.text.length;
    const needsSpace = caret > 0 && !/[\s\n]/.test(target.text[caret - 1] ?? '');
    const insert = needsSpace ? ' /' : '/';
    const slashAt = needsSpace ? caret + 1 : caret;
    const nextText = `${target.text.slice(0, caret)}${insert}${target.text.slice(caret)}`;
    const nextParts = ensured.map((p) =>
      p.id === target!.id && p.kind === 'text' ? { ...p, text: nextText } : p,
    );
    commitParts(nextParts);
    setSlash({ partId: target.id, startIndex: slashAt, query: '' });
    requestAnimationFrame(() => {
      const node = textRefs.current[target!.id];
      if (!node) return;
      node.focus();
      placeCaret(node, slashAt + 1);
      setSlashAnchor(getCaretAnchorRect(node) ?? node.getBoundingClientRect());
    });
  };

  const clearDrag = () => {
    setDragId(null);
    setDropIndex(null);
    setTextDrop(null);
  };

  const onDropAtIndex = (index: number) => {
    if (!dragId) return;
    commitParts(moveEndVarPart(safeParts, dragId, index));
    clearDrag();
  };

  const onDropIntoText = (textPartId: string, offset: number) => {
    if (!dragId) return;
    commitParts(moveEndVarIntoText(safeParts, dragId, textPartId, offset));
    clearDrag();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* 行内混排：文本与变量同一段落流，可插进任意字符之间 */}
      <div
        className="relative min-h-[96px] text-[13px] leading-[22px] text-neutral-800 whitespace-pre-wrap break-words"
        onDragOver={(e) => {
          if (!dragId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (e.target !== e.currentTarget && !t.closest('[data-placeholder-overlay]')) return;
          const last = safeParts[safeParts.length - 1];
          if (last?.kind === 'text') {
            const el = textRefs.current[last.id];
            if (!el) return;
            el.focus();
            placeCaret(el, (last.text || '').length);
          }
        }}
      >
        {empty && safeParts.length === 1 ? (
          <div
            data-placeholder-overlay="1"
            className="absolute inset-0 z-0 text-[13px] leading-[22px] text-neutral-400 pointer-events-none select-none"
          >
            可以使用{'{{变量名}}'}的方式引用输入参数中的变量
          </div>
        ) : null}

        <div className="relative z-[1]">
        {safeParts.map((part, index) => (
          <React.Fragment key={part.id}>
            <DropGap
              active={dragId != null && !textDrop && dropIndex === index}
              onDragEnter={() => {
                if (!dragId) return;
                setTextDrop(null);
                setDropIndex(index);
              }}
              onDrop={() => onDropAtIndex(index)}
            />
            {part.kind === 'var' ? (
              <span
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', part.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragId(part.id);
                  setDropIndex(index);
                  setTextDrop(null);
                }}
                onDragEnd={clearDrag}
                className={cn(
                  'inline-flex items-center gap-1 max-w-full h-7 pl-1.5 pr-1 mx-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[12px] cursor-grab active:cursor-grabbing select-none align-middle',
                  dragId === part.id && 'opacity-40',
                )}
                title="拖到文字中间可调整位置"
              >
                <Box className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
                <span className="truncate text-neutral-700 pointer-events-none">
                  {part.nodeLabel}
                  <span className="text-neutral-400"> / </span>
                  <span className="text-teal-600 font-medium">{part.field}</span>
                </span>
                <button
                  type="button"
                  className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer shrink-0"
                  aria-label={`移除 ${part.nodeLabel}/${part.field}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVar(part.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span
                ref={(el) => {
                  textRefs.current[part.id] = el;
                  if (
                    el &&
                    document.activeElement !== el &&
                    (el.textContent || '') !== (part.text ?? '')
                  ) {
                    el.textContent = part.text ?? '';
                  }
                }}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="消息文本"
                className={cn(
                  'outline-none whitespace-pre-wrap break-words inline align-middle text-neutral-800',
                  empty && safeParts.length === 1
                    ? 'block w-full min-h-[72px]'
                    : 'min-w-[1ch] max-w-full',
                  dragId && textDrop?.partId === part.id && 'rounded-sm ring-1 ring-teal-400',
                  dragId &&
                    textDrop &&
                    textDrop.partId !== part.id &&
                    'rounded-sm ring-1 ring-teal-300/40',
                )}
                onFocus={() => {
                  focusedPartRef.current = part.id;
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  const el = e.currentTarget;
                  const offset = caretOffsetFromPoint(el, e.clientX, e.clientY);
                  setDropIndex(null);
                  setTextDrop({ partId: part.id, offset });
                }}
                onDrop={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const el = e.currentTarget;
                  const offset = caretOffsetFromPoint(el, e.clientX, e.clientY);
                  onDropIntoText(part.id, offset);
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  const value = el.textContent || '';
                  const nextLen = getEndMessageTextLength(
                    safeParts.map((p) =>
                      p.id === part.id && p.kind === 'text' ? { ...p, text: value } : p,
                    ),
                  );
                  if (nextLen > MAX_LEN) {
                    el.textContent = part.text ?? '';
                    placeCaret(el, (part.text ?? '').length);
                    return;
                  }
                  updateTextPart(part.id, value);
                  syncSlashFromPart(part.id, value, getCaretInTextNode(el));
                }}
                  onKeyUp={(e) => {
                    if (e.key === 'Escape') {
                      setSlash(null);
                      setSlashAnchor(null);
                      return;
                    }
                  const el = e.currentTarget;
                  syncSlashFromPart(part.id, el.textContent || '', getCaretInTextNode(el));
                }}
                onClick={(e) => {
                  const el = e.currentTarget;
                  focusedPartRef.current = part.id;
                  syncSlashFromPart(part.id, el.textContent || '', getCaretInTextNode(el));
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.textContent || '';
                  if (value !== (part.text ?? '')) updateTextPart(part.id, value);
                }}
              />
            )}
          </React.Fragment>
        ))}
        <DropGap
          active={dragId != null && !textDrop && dropIndex === safeParts.length}
          onDragEnter={() => {
            if (!dragId) return;
            setTextDrop(null);
            setDropIndex(safeParts.length);
          }}
          onDrop={() => onDropAtIndex(safeParts.length)}
          wide
        />
        </div>
      </div>

      <div className="flex justify-end text-[11px] text-neutral-400 mt-1">
        {textLen}/{MAX_LEN}
      </div>

      {slash ? (
        <WorkflowSlashVarMenu
          query={slash.query}
          anchorRect={
            slashAnchor ??
            (slash.partId ? textRefs.current[slash.partId]?.getBoundingClientRect() : null) ??
            null
          }
          onClose={() => {
            setSlash(null);
            setSlashAnchor(null);
          }}
          onPick={(key) => {
            insertVar(key);
            setSlashAnchor(null);
          }}
        />
      ) : null}

      <button
        type="button"
        data-end-msg-slash-trigger
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onClick={openSlashAtCaret}
      />
    </div>
  );
}

function DropGap({
  active,
  onDragEnter,
  onDrop,
  wide,
}: {
  active: boolean;
  onDragEnter: () => void;
  onDrop: () => void;
  wide?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block align-middle rounded-sm transition-all',
        wide ? 'min-w-[8px] min-h-[18px]' : 'w-1 min-h-[18px]',
        active ? 'bg-teal-400 w-1 mx-0.5' : 'bg-transparent',
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    />
  );
}

function getCaretAnchorRect(el: HTMLElement): DOMRect | null {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0).cloneRange();
    if (el.contains(range.startContainer)) {
      range.collapse(true);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const r = rects[0];
        // 给一个很小的锚点高度，菜单紧贴光标行下方
        return new DOMRect(r.left, r.top, Math.max(r.width, 2), Math.max(r.height, 16));
      }
      // 空节点时 insert 临时标记量位置
      const marker = document.createElement('span');
      marker.textContent = '\u200b';
      range.insertNode(marker);
      const r = marker.getBoundingClientRect();
      marker.parentNode?.removeChild(marker);
      el.normalize();
      if (r.width || r.height || r.top) {
        return new DOMRect(r.left, r.top, 2, Math.max(r.height, 16));
      }
    }
  }
  return null;
}

function caretOffsetFromPoint(el: HTMLElement, x: number, y: number): number {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };
  let range: Range | null = null;
  if (typeof doc.caretRangeFromPoint === 'function') {
    range = doc.caretRangeFromPoint(x, y);
  } else if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }
  if (!range || !el.contains(range.startContainer)) {
    const rect = el.getBoundingClientRect();
    return x < rect.left + rect.width / 2 ? 0 : (el.textContent || '').length;
  }
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function placeCaret(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const textNode = el.firstChild;
  const range = document.createRange();
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    const len = textNode.textContent?.length ?? 0;
    const pos = Math.max(0, Math.min(offset, len));
    range.setStart(textNode, pos);
    range.collapse(true);
  } else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

/** 供外部触发：在光标处打开 / 变量菜单 */
export function triggerEndMessageSlash(root: HTMLElement | null) {
  const btn = root?.querySelector(
    '[data-end-msg-slash-trigger]',
  ) as HTMLButtonElement | null;
  btn?.click();
}
