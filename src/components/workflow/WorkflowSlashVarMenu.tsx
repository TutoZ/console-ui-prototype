import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type SlashVarItem = {
  key: string;
  label: string;
  type: string;
};

export type SlashVarGroup = {
  group: string;
  items: SlashVarItem[];
};

/** 结束节点“消息”/ 触发用变量列表（对齐截图分组） */
export const END_SLASH_VAR_GROUPS: SlashVarGroup[] = [
  {
    group: '开始输入',
    items: [
      { key: '{{开始.user_pin}}', label: 'user_pin', type: 'string' },
      { key: '{{sys.conversation_turns}}', label: 'sys.conversation_turns', type: 'number' },
      { key: '{{sys.date}}', label: 'sys.date', type: 'string' },
      { key: '{{sys.files}}', label: 'sys.files', type: 'array<file>' },
      { key: '{{sys.history}}', label: 'sys.history', type: 'array' },
      { key: '{{sys.query}}', label: 'sys.query', type: 'string' },
      { key: '{{sys.user_id}}', label: 'sys.user_id', type: 'string' },
      { key: '{{user_input}}', label: 'user_input', type: 'string' },
      { key: '{{开始.bot_id}}', label: 'bot_id', type: 'string' },
    ],
  },
  {
    group: 'query改写',
    items: [{ key: '{{query改写.content}}', label: 'content', type: 'string' }],
  },
  {
    group: '上游节点输出',
    items: [
      { key: '{{咨询agent.content}}', label: 'content', type: 'string' },
      { key: '{{LLM.output}}', label: 'output', type: 'string' },
      { key: '{{意图识别.intent}}', label: 'intent', type: 'string' },
    ],
  },
];

type FlatItem = SlashVarItem & { group: string; flatIndex: number };

type WorkflowSlashVarMenuProps = {
  query: string;
  onPick: (key: string) => void;
  onClose: () => void;
  className?: string;
  groups?: SlashVarGroup[];
  /** 传入时用 fixed + portal，避免侧栏 overflow 裁切 */
  anchorRect?: DOMRect | null;
};

export function WorkflowSlashVarMenu({
  query,
  onPick,
  onClose,
  className,
  groups = END_SLASH_VAR_GROUPS,
  anchorRect = null,
}: WorkflowSlashVarMenuProps) {
  const [active, setActive] = useState(0);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: needle
          ? g.items.filter(
              (it) =>
                it.label.toLowerCase().includes(needle) ||
                it.key.toLowerCase().includes(needle) ||
                g.group.toLowerCase().includes(needle),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const flat: FlatItem[] = useMemo(() => {
    const list: FlatItem[] = [];
    let i = 0;
    for (const g of filtered) {
      for (const it of g.items) {
        list.push({ ...it, group: g.group, flatIndex: i++ });
      }
    }
    return list;
  }, [filtered]);

  useEffect(() => {
    setActive(0);
  }, [query, filtered.length]);

  useLayoutEffect(() => {
    if (!anchorRect) {
      setFixedStyle(null);
      return;
    }
    const width = 240;
    const estHeight = 240;
    const gap = 2;
    // 紧贴触发点下方；空间不够则翻到上方紧贴
    let top = anchorRect.bottom + gap;
    if (top + Math.min(estHeight, 200) > window.innerHeight - 8) {
      top = Math.max(8, anchorRect.top - Math.min(estHeight, window.innerHeight * 0.4) - gap);
    }
    // 左缘对齐触发点，略向左偏一点更贴光标
    let left = anchorRect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setFixedStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 220,
    });
  }, [anchorRect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!flat.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % flat.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[active];
        if (item) onPick(item.key);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active, flat, onClose, onPick]);

  const panel = (
    <div
      data-kb-popover
      className={cn(
        'max-h-64 overflow-y-auto rounded-[10px] border border-neutral-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] custom-scrollbar-thin',
        !fixedStyle && 'absolute left-0 right-0 top-full mt-1 z-[80]',
        className,
      )}
      style={fixedStyle ?? undefined}
      role="listbox"
      aria-label="插入变量"
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-6 text-center text-[12px] text-neutral-400">无匹配变量</div>
      ) : (
        filtered.map((g) => (
          <div key={g.group}>
            <div className="sticky top-0 px-3 py-1.5 text-[11px] font-medium text-neutral-400 bg-white/95 backdrop-blur-sm border-b border-neutral-50">
              {g.group}
            </div>
            {g.items.map((it) => {
              const flatIndex =
                flat.find((f) => f.key === it.key && f.group === g.group)?.flatIndex ?? 0;
              const isActive = flatIndex === active;
              return (
                <button
                  key={`${g.group}-${it.key}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(flatIndex)}
                  onClick={() => onPick(it.key)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer transition-colors',
                    isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                  )}
                >
                  <span className="text-[13px] text-neutral-800 font-medium truncate">
                    {it.label}
                  </span>
                  <span className="text-[11px] text-neutral-400 shrink-0">{it.type}</span>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  if (fixedStyle) return createPortal(panel, document.body);
  return panel;
}

/** 从 textarea 光标前解析正在输入的 /query */
export function detectSlashQuery(
  value: string,
  caret: number,
): { startIndex: number; query: string } | null {
  const before = value.slice(0, caret);
  const match = before.match(/(^|[\s\n])\/([^\s\n/]*)$/);
  if (!match) return null;
  const token = match[0];
  const slashOffset = token.indexOf('/');
  const startIndex = before.length - token.length + slashOffset;
  return { startIndex, query: match[2] ?? '' };
}
