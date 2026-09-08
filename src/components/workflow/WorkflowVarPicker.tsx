import React, { useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, MessageSquare, Search, Zap } from '@/lib/icons';
import { cn } from '@/lib/utils';

type WorkflowVarPickerProps = {
  onPick: (key: string) => void;
  className?: string;
  /**
   * variable：知识检索等 — 左侧分组级联
   * branch：条件分支“节点 | 工具”Tab
   */
  mode?: 'variable' | 'branch';
  /**
   * 传入触发器矩形时，用 fixed + portal 挂到 body，避免被侧栏 overflow 裁切
   */
  anchorRect?: DOMRect | null;
};

type ToolItem = {
  id: string;
  label: string;
  children?: { key: string; label: string }[];
};

type VarGroup = {
  id: string;
  group: string;
  icon?: 'session' | 'start' | 'node';
  items: { key: string; label: string; type?: string }[];
};

const TOOL_ITEMS: ToolItem[] = [
  {
    id: 'carousel',
    label: '轮播答案组件',
    children: [
      { key: '{{carousel.answer_index}}', label: '获取答案索引' },
      { key: '{{carousel.answer_id}}', label: '获取答案ID' },
    ],
  },
  { id: 'rating', label: '用户评价', children: [{ key: '{{rating.score}}', label: '评分' }] },
  {
    id: 'transfer_skill',
    label: '场景转人工-获取技能组',
    children: [{ key: '{{transfer.skill_group}}', label: '技能组' }],
  },
  {
    id: 'online_transfer',
    label: '在线通用转人工组件',
    children: [{ key: '{{online_transfer.group}}', label: '技能组' }],
  },
  {
    id: 'answer_pk',
    label: '通用答案PK组件',
    children: [{ key: '{{answer_pk.winner}}', label: '胜出答案' }],
  },
  {
    id: 'quick_entry',
    label: '快捷入口答案组件',
    children: [{ key: '{{quick_entry.id}}', label: '入口ID' }],
  },
  {
    id: 'train_welcome',
    label: '培训欢迎语组件',
    children: [{ key: '{{train_welcome.text}}', label: '欢迎语' }],
  },
  {
    id: 'common_transfer',
    label: '通用转人工组件',
    children: [{ key: '{{common_transfer.group}}', label: '技能组' }],
  },
];

const CASCADE_VAR_GROUPS: VarGroup[] = [
  {
    id: 'session',
    group: '会话变量',
    icon: 'session',
    items: [
      { key: '{{user_input}}', label: 'user_input', type: 'String' },
      { key: '{{sys.query}}', label: 'sys.query', type: 'String' },
      { key: '{{session.id}}', label: 'session_id', type: 'String' },
    ],
  },
  {
    id: 'start',
    group: '开始节点',
    icon: 'start',
    items: [
      { key: '{{开始.user_input}}', label: 'user_input', type: 'String' },
      { key: '{{开始.session_id}}', label: 'session_id', type: 'String' },
      { key: '{{开始.user_pin}}', label: 'user_pin', type: 'String' },
      { key: '{{开始.bot_id}}', label: 'bot_id', type: 'Long' },
    ],
  },
  {
    id: 'upstream',
    group: '上游节点输出',
    icon: 'node',
    items: [
      { key: '{{LLM.output}}', label: 'output', type: 'String' },
      { key: '{{意图识别.intent}}', label: 'intent', type: 'String' },
      { key: '{{咨询agent.content}}', label: 'content', type: 'String' },
    ],
  },
];

const BRANCH_NODE_GROUPS = [
  {
    group: '会话变量',
    items: [
      { key: '{{user_input}}', label: 'user_input' },
      { key: '{{sys.query}}', label: 'sys.query' },
      { key: '{{session.id}}', label: 'session.id' },
    ],
  },
  {
    group: '上游节点输出',
    items: [
      { key: '{{开始.input}}', label: '开始 / input' },
      { key: '{{LLM.output}}', label: 'LLM / output' },
    ],
  },
];

function GroupIcon({ kind }: { kind?: VarGroup['icon'] }) {
  if (kind === 'session') return <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  if (kind === 'start') return <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  return <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
}

/** 知识检索：分组级联；条件分支：节点｜工具 Tab */
export function WorkflowVarPicker({
  onPick,
  className,
  mode = 'variable',
  anchorRect = null,
}: WorkflowVarPickerProps) {
  const [tab, setTab] = useState<'节点' | '工具'>('节点');
  const [q, setQ] = useState('');
  const [expandedTool, setExpandedTool] = useState<string | null>('carousel');
  const [activeGroupId, setActiveGroupId] = useState<string>(CASCADE_VAR_GROUPS[0]?.id ?? '');
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties | null>(null);

  const cascadeGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CASCADE_VAR_GROUPS;
    return CASCADE_VAR_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          item.label.toLowerCase().includes(needle) ||
          item.key.toLowerCase().includes(needle) ||
          g.group.toLowerCase().includes(needle),
      ),
    })).filter((g) => g.items.length > 0 || g.group.toLowerCase().includes(needle));
  }, [q]);

  const activeGroup =
    cascadeGroups.find((g) => g.id === activeGroupId) ?? cascadeGroups[0] ?? null;

  const branchNodeGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return BRANCH_NODE_GROUPS;
    return BRANCH_NODE_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(needle) ||
          item.key.toLowerCase().includes(needle),
      ),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  const tools = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TOOL_ITEMS;
    return TOOL_ITEMS.filter(
      (t) =>
        t.label.toLowerCase().includes(needle) ||
        t.children?.some(
          (c) =>
            c.label.toLowerCase().includes(needle) || c.key.toLowerCase().includes(needle),
        ),
    );
  }, [q]);

  useLayoutEffect(() => {
    if (!anchorRect) {
      setFixedStyle(null);
      return;
    }
    const width = mode === 'variable' ? 290 : 260;
    const estHeight = mode === 'variable' ? 220 : 280;
    const gap = 4;
    let top = anchorRect.bottom + gap;
    if (top + estHeight > window.innerHeight - 8) {
      top = Math.max(8, anchorRect.top - estHeight - gap);
    }
    let left = anchorRect.right - width;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setFixedStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 200,
    });
  }, [anchorRect, mode]);

  const variablePanel = (
    <div
      data-kb-popover
      className={cn(
        'bg-white border border-neutral-200 rounded-[13px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50 flex',
        className,
      )}
      style={fixedStyle ?? undefined}
    >
      <div className="w-[148px] border-r border-neutral-100 bg-neutral-50/80 max-h-64 overflow-y-auto custom-scrollbar-thin">
        {activeGroup?.items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPick(item.key)}
            className="w-full px-2.5 py-2 text-left hover:bg-white cursor-pointer flex items-center justify-between gap-1"
          >
            <span className="text-[12px] text-neutral-800 font-medium truncate">{item.label}</span>
            {item.type ? (
              <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1 py-0.5 rounded shrink-0">
                {item.type}
              </span>
            ) : null}
          </button>
        ))}
        {!activeGroup?.items.length ? (
          <div className="py-6 text-center text-[11px] text-neutral-400">无变量</div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 max-h-64 overflow-y-auto custom-scrollbar-thin">
        <div className="px-2 py-1.5 border-b border-neutral-100">
          <div className="flex items-center gap-1 h-7 px-1.5 rounded-md bg-neutral-50 border border-neutral-200">
            <Search className="w-3 h-3 text-neutral-400 shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索"
              className="w-full bg-transparent text-[11px] outline-none text-neutral-700 placeholder:text-neutral-400"
            />
          </div>
        </div>
        {cascadeGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            onMouseEnter={() => setActiveGroupId(g.id)}
            onClick={() => setActiveGroupId(g.id)}
            className={cn(
              'w-full px-2.5 py-2 text-left text-[12px] cursor-pointer flex items-center gap-1.5',
              activeGroup?.id === g.id
                ? 'bg-sky-50 text-live'
                : 'text-neutral-700 hover:bg-neutral-50',
            )}
          >
            <GroupIcon kind={g.icon} />
            <span className="truncate flex-1 font-medium">{g.group}</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
          </button>
        ))}
        {cascadeGroups.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-neutral-400">无匹配</div>
        ) : null}
      </div>
    </div>
  );

  if (mode === 'variable') {
    if (anchorRect && typeof document !== 'undefined') {
      return createPortal(variablePanel, document.body);
    }
    return variablePanel;
  }

  const searchPlaceholder =
    tab === '工具' ? '搜索插件或组件名称' : '搜索节点或变量名称';

  const branchPanel = (
    <div
      data-kb-popover
      className={cn(
        'bg-white border border-neutral-200 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50',
        className,
      )}
      style={fixedStyle ?? undefined}
    >
      <div className="flex border-b border-neutral-100">
        {(['节点', '工具'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setQ('');
            }}
            className={cn(
              'flex-1 h-9 text-[13px] font-medium cursor-pointer relative',
              tab === t ? 'text-live' : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            {t}
            {tab === t ? (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-live" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="px-2.5 py-2 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 h-8 px-2 rounded-md bg-neutral-50 border border-neutral-200 focus-within:border-live">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-[12px] outline-none text-neutral-700 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto custom-scrollbar-thin">
        {tab === '节点' ? (
          <>
            {branchNodeGroups.map((group) => (
              <div key={group.group}>
                <div className="w-full px-3 py-2 text-left text-[12px] text-neutral-700 flex items-center gap-2">
                  {group.group === '会话变量' ? (
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  ) : null}
                  <span className="font-medium flex-1 truncate">{group.group}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onPick(item.key)}
                    className="w-full pl-8 pr-3 py-1.5 text-left text-[12px] text-neutral-600 hover:bg-sky-50 hover:text-live cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0 max-w-[40%] truncate">
                      {item.key}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {branchNodeGroups.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-neutral-400">无匹配变量</div>
            ) : null}
          </>
        ) : (
          <>
            {tools.map((tool) => {
              const open = expandedTool === tool.id;
              return (
                <div key={tool.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedTool(open ? null : tool.id)}
                    className="w-full px-3 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="font-medium truncate">{tool.label}</span>
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 text-neutral-300 shrink-0 transition',
                        open && 'rotate-90',
                      )}
                    />
                  </button>
                  {open && tool.children
                    ? tool.children.map((child) => (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => onPick(child.key)}
                          className="w-full pl-8 pr-3 py-1.5 text-left text-[12px] text-neutral-600 hover:bg-sky-50 hover:text-live cursor-pointer"
                        >
                          {child.label}
                        </button>
                      ))
                    : null}
                </div>
              );
            })}
            {tools.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-neutral-400">无匹配工具</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  if (anchorRect && typeof document !== 'undefined') {
    return createPortal(branchPanel, document.body);
  }
  return branchPanel;
}
