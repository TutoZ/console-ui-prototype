/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险演示 — 右侧只展示当前步骤背后的能力原理（少文案、重动画）。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  GitBranch,
  FileText,
  Folder,
  Library,
  Lock,
  MousePointer2,
  RefreshCw,
  Search,
  Terminal,
  X,
  Zap,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { SKILL_AOP_GRADIENT_BG, SKILL_AOP_GRADIENT_TEXT } from '@/lib/ui';
import {
  FOOD_SAFETY_DEMO_ORDER,
  FOOD_SAFETY_CAPABILITY_STAGES,
  type CapabilityDemoStage,
  type LoopDemoNode,
  type LoopNodeRef,
  type LoopNodeTone,
  type LoopRefKind,
} from '@/lib/foodSafetyDemoScript';

const CYCLE_PHASES = [
  { key: 'perceive', label: '感知' },
  { key: 'reason', label: '推理' },
  { key: 'act', label: '行动' },
  { key: 'observe', label: '观察' },
] as const;

/** 与下方 THOUGHT / TRACE 卡片同宽对齐 */
const LOOP_CONTENT_FRAME = 'w-full max-w-3xl mx-auto px-5 sm:px-7';

function CapabilityStageHeadline({
  challenge,
  coreValue,
  className,
  compact,
}: {
  challenge: string;
  coreValue: string;
  className?: string;
  compact?: boolean;
}) {
  const titleClass = compact
    ? 'text-[24px] sm:text-[28px]'
    : 'text-[28px] sm:text-[34px]';

  return (
    <div className={cn('shrink-0 flex flex-col items-center', className)}>
      <div className="flex items-start justify-center gap-5 sm:gap-10 max-w-full">
        <div className="flex flex-col items-center min-w-0 max-w-[46%] sm:max-w-none">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-neutral-400 mb-1.5">
            场景难点
          </span>
          <p
            className={cn(
              'food-safety-hero-caption food-safety-hero-caption-accent leading-none tracking-[-0.02em] text-center',
              titleClass,
            )}
          >
            {challenge}
          </p>
        </div>
        <div
          className="w-px self-stretch bg-gradient-to-b from-transparent via-neutral-200 to-transparent shrink-0"
          aria-hidden
        />
        <div className="flex flex-col items-center min-w-0 max-w-[46%] sm:max-w-none">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-neutral-400 mb-1.5">
            核心价值点
          </span>
          <p
            className={cn(
              'food-safety-hero-caption food-safety-hero-caption-plain leading-none tracking-[-0.02em] text-center',
              titleClass,
            )}
          >
            {coreValue}
          </p>
        </div>
      </div>
    </div>
  );
}

function loopToneMeta(tone: LoopNodeTone): {
  badge: string;
  chip: string;
  active: string;
  iconWrap: string;
  iconActive: string;
} {
  switch (tone) {
    case 'decision':
      return {
        badge: '决策',
        chip: 'border-amber-200/90 bg-amber-50/90 text-amber-950',
        active: 'border-amber-400 bg-amber-100 text-amber-950 shadow-[0_0_0_3px_rgba(251,191,36,0.22)]',
        iconWrap: 'bg-amber-100 text-amber-700',
        iconActive: 'bg-amber-500 text-white',
      };
    case 'knowledge':
      return {
        badge: '知识',
        chip: 'border-emerald-200/90 bg-emerald-50/90 text-emerald-950',
        active:
          'border-emerald-400 bg-emerald-100 text-emerald-950 shadow-[0_0_0_3px_rgba(52,211,153,0.22)]',
        iconWrap: 'bg-emerald-100 text-emerald-700',
        iconActive: 'bg-emerald-500 text-white',
      };
    case 'skill':
      return {
        badge: '技能',
        chip: 'border-teal-200/90 bg-teal-50/90 text-teal-950',
        active: 'border-teal-400 bg-teal-100 text-teal-950 shadow-[0_0_0_3px_rgba(45,212,191,0.22)]',
        iconWrap: 'bg-teal-100 text-teal-700',
        iconActive: 'bg-teal-500 text-white',
      };
    case 'tool':
      return {
        badge: '工具',
        chip: 'border-sky-200/90 bg-sky-50/90 text-sky-950',
        active: 'border-sky-400 bg-sky-100 text-sky-950 shadow-[0_0_0_3px_rgba(56,189,248,0.22)]',
        iconWrap: 'bg-sky-100 text-sky-700',
        iconActive: 'bg-sky-500 text-white',
      };
    case 'result':
      return {
        badge: '结果',
        chip: 'border-neutral-200 bg-neutral-50 text-neutral-800',
        active: cn(SKILL_AOP_GRADIENT_BG, 'border-transparent text-white shadow-md'),
        iconWrap: 'bg-neutral-200 text-neutral-700',
        iconActive: 'bg-white/25 text-white',
      };
    default:
      return {
        badge: '感知',
        chip: 'border-neutral-200 bg-white text-neutral-700',
        active: 'border-neutral-400 bg-neutral-100 text-neutral-900 shadow-[0_0_0_3px_rgba(115,115,115,0.16)]',
        iconWrap: 'bg-neutral-100 text-neutral-600',
        iconActive: 'bg-neutral-700 text-white',
      };
  }
}

function LoopToneIcon({ tone, size = 13 }: { tone: LoopNodeTone; size?: number }) {
  switch (tone) {
    case 'decision':
      return <Compass size={size} strokeWidth={2} />;
    case 'knowledge':
      return <Library size={size} strokeWidth={2} />;
    case 'skill':
      return <Zap size={size} strokeWidth={2} />;
    case 'tool':
      return <Terminal size={size} strokeWidth={2} />;
    case 'result':
      return <CheckCircle2 size={size} strokeWidth={2} />;
    default:
      return <Search size={size} strokeWidth={2} />;
  }
}

function refMeta(kind: LoopRefKind): { label: string; cls: string; Icon: typeof Library } {
  switch (kind) {
    case 'knowledge':
      return {
        label: '知识',
        cls: 'bg-emerald-50 text-neutral-900',
        Icon: Library,
      };
    case 'skill':
      return {
        label: '技能',
        cls: 'bg-teal-50 text-neutral-900',
        Icon: Zap,
      };
    case 'process':
      return {
        label: '流程',
        cls: 'bg-violet-50 text-neutral-900',
        Icon: GitBranch,
      };
    default:
      return {
        label: '工具',
        cls: 'bg-sky-50 text-neutral-900',
        Icon: Terminal,
      };
  }
}

function LoopRefChips({
  refs,
  active,
}: {
  refs?: LoopNodeRef[];
  active?: boolean;
}) {
  if (!refs?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {refs.map((ref) => {
        const meta = refMeta(ref.kind);
        const Icon = meta.Icon;
        return (
          <span
            key={`${ref.kind}-${ref.name}`}
            title={ref.meta ? `${ref.name} · ${ref.meta}` : ref.name}
            className={cn(
              'inline-flex items-center gap-0.5 max-w-[9rem] rounded px-1 py-px text-[9px] font-medium',
              active ? 'bg-white/90 text-neutral-900' : meta.cls,
            )}
          >
            <Icon size={9} className="shrink-0 text-neutral-800" />
            <span className="shrink-0 opacity-70">{meta.label}</span>
            <span className="truncate text-neutral-900">{ref.name}</span>
          </span>
        );
      })}
    </div>
  );
}

/** TRACE 内：知识库 / 技能名称单独成行，完整可读 */
function TraceAssetHits({
  refs,
  active,
}: {
  refs?: LoopNodeRef[];
  active?: boolean;
}) {
  if (!refs?.length) return null;
  const knowledge = refs.filter((r) => r.kind === 'knowledge');
  const skills = refs.filter((r) => r.kind === 'skill');
  const others = refs.filter((r) => r.kind !== 'knowledge' && r.kind !== 'skill');
  if (knowledge.length === 0 && skills.length === 0 && others.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1 min-w-0">
      {knowledge.map((ref) => (
        <div
          key={`k-${ref.name}`}
          className="flex items-center gap-2 min-w-0 py-0.5"
        >
          <Library
            size={14}
            strokeWidth={2}
            className="shrink-0 text-emerald-700"
          />
          <span className="shrink-0 text-[12px] font-semibold text-emerald-700">
            知识库
          </span>
          <span
            className="min-w-0 flex-1 text-[14px] font-semibold truncate text-neutral-900"
            title={ref.meta ? `${ref.name} · ${ref.meta}` : ref.name}
          >
            {ref.name}
          </span>
          {ref.meta ? (
            <span className="shrink-0 text-[11px] tabular-nums max-w-[5rem] truncate text-neutral-500">
              {ref.meta}
            </span>
          ) : null}
        </div>
      ))}
      {skills.map((ref) => (
        <div
          key={`s-${ref.name}`}
          className="flex items-center gap-2 min-w-0 py-0.5"
        >
          <Zap
            size={14}
            strokeWidth={2}
            className="shrink-0 text-teal-700"
          />
          <span className="shrink-0 text-[12px] font-semibold text-teal-700">
            技能
          </span>
          <span
            className="min-w-0 flex-1 text-[14px] font-semibold truncate text-neutral-900"
            title={ref.meta ? `${ref.name} · ${ref.meta}` : ref.name}
          >
            {ref.name}
          </span>
          {ref.meta ? (
            <span className="shrink-0 text-[11px] tabular-nums max-w-[5rem] truncate text-neutral-500">
              {ref.meta}
            </span>
          ) : null}
        </div>
      ))}
      {others.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <LoopRefChips refs={others} active={active} />
        </div>
      ) : null}
    </div>
  );
}

/** 知识 / 技能调取：样式对齐 AgentLoopThinkPanel TRACE 列表 */
function KnowledgeSkillCallStrip({
  nodes,
  revealed,
  currentIdx,
}: {
  nodes: LoopDemoNode[];
  revealed: number;
  currentIdx: number;
}) {
  const calls = nodes.flatMap((node, nodeIdx) =>
    (node.refs ?? [])
      .filter((r) => r.kind === 'knowledge' || r.kind === 'skill')
      .map((ref) => ({ node, nodeIdx, ref })),
  );
  if (calls.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 mb-1 px-1">
        调取知识 / 技能
      </p>
      <ul className="divide-y divide-neutral-100">
        {calls.map(({ node, nodeIdx, ref }) => {
          const meta = refMeta(ref.kind);
          const active = nodeIdx === currentIdx;
          const done = nodeIdx < revealed && !active;
          const pending = nodeIdx >= revealed;
          return (
            <li
              key={`${nodeIdx}-${ref.kind}-${ref.name}`}
              className={cn(
                'relative px-1 py-3 transition-colors duration-300',
                active && 'bg-[rgba(21,101,191,0.04)] rounded-lg',
                pending && 'opacity-40',
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={cn(
                    'mt-0.5 w-6 h-6 inline-flex items-center justify-center shrink-0',
                    active && 'text-[#1565BF]',
                    done && 'text-emerald-600',
                    pending && 'text-neutral-300',
                  )}
                >
                  {done ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : active ? (
                    <span
                      className="block w-3.5 h-3.5 rounded-full border-2 border-[#1565BF]/20 border-t-[#1565BF] animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <LoopToneIcon
                      tone={ref.kind === 'knowledge' ? 'knowledge' : 'skill'}
                      size={14}
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                    <span
                      className={cn(
                        'text-[11px] font-semibold shrink-0',
                        active ? 'text-[#1565BF]' : 'text-neutral-400',
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[15px] font-semibold text-neutral-900">
                      调取{meta.label}
                    </span>
                    <span className="text-[13px] text-neutral-500 truncate">{ref.name}</span>
                    {active ? (
                      <span className="text-[11px] font-medium text-[#1565BF]/80">执行中</span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 min-w-0 py-0.5">
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-neutral-900',
                        ref.kind === 'knowledge' ? 'bg-emerald-50' : 'bg-teal-50',
                      )}
                    >
                      {ref.kind === 'knowledge' ? '知识库' : '技能'}
                    </span>
                    <span
                      className="min-w-0 flex-1 text-[14px] font-semibold truncate text-neutral-900"
                      title={ref.meta ? `${ref.name} · ${ref.meta}` : ref.name}
                    >
                      {ref.name}
                    </span>
                    {ref.meta ? (
                      <span className="shrink-0 text-[11px] tabular-nums max-w-[5rem] truncate text-neutral-500">
                        {ref.meta}
                      </span>
                    ) : null}
                    <span className="shrink-0 text-[11px] text-neutral-400 truncate max-w-[5rem]">
                      {node.action}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 顶部 Agent Loop：独立持续循环（与下方 Thought / Finder / Browser 解耦） */
function useAgentLoopCycle(active: boolean, stepMs = 850) {
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!active) return;

    setPhaseIdx(0);
    setRound(1);
    const id = window.setInterval(() => {
      setPhaseIdx((prev) => {
        const next = (prev + 1) % 4;
        if (next === 0) setRound((r) => r + 1);
        return next;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [active, stepMs]);

  return { phaseIdx, round };
}

function AgentLoopStrip({
  stage,
  running,
}: {
  stage: CapabilityDemoStage;
  running: boolean;
}) {
  const nodes = stage.nodes;
  if (nodes.length === 0 && stage.mode !== 'browser') return null;

  const cycle = useAgentLoopCycle(Boolean(running));

  return (
    <div className="shrink-0 py-2.5 px-5 sm:px-7">
      <div className="flex items-center gap-2 min-w-0 mb-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em]',
            SKILL_AOP_GRADIENT_TEXT,
          )}
        >
          <Bot size={12} className={running ? 'animate-pulse' : undefined} />
          AGENT LOOP
        </span>
        <span className="text-[10px] text-neutral-400 tabular-nums">
          {running
            ? `持续循环 · 第 ${Math.max(1, cycle.round)} 轮`
            : cycle.round > 0
              ? `已运行 ${cycle.round} 轮`
              : '待命'}
        </span>
      </div>

      <div className="w-full flex items-center gap-1">
        {CYCLE_PHASES.map((p, i) => {
          const on = running && cycle.phaseIdx === i;
          const passedInRound = running && cycle.phaseIdx >= 0 && i < cycle.phaseIdx;
          const showPassed = !on && ((!running && cycle.round > 0) || passedInRound);

          return (
            <React.Fragment key={p.key}>
              {i > 0 ? (
                <div
                  className={cn(
                    'h-[2px] w-2 sm:w-3 shrink-0 transition-colors duration-300',
                    on || showPassed ? 'bg-[#1565BF]' : 'bg-neutral-200',
                  )}
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  'flex-1 min-w-0 inline-flex items-center justify-center gap-0.5 rounded-md border px-1.5 py-1.5 text-[10px] sm:text-[11px] font-semibold transition-all duration-300',
                  on &&
                    'border-[#1565BF]/40 bg-[rgba(21,101,191,0.08)] text-[#1565BF] shadow-[0_0_0_2px_rgba(21,101,191,0.12)] scale-[1.02]',
                  !on && showPassed && 'border-[#1565BF]/25 bg-[rgba(21,101,191,0.04)] text-[#1565BF]/80',
                  !on && !showPassed && 'border-neutral-200 bg-white text-neutral-400',
                )}
              >
                {on ? (
                  <span
                    className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#1565BF] animate-pulse"
                    aria-hidden
                  />
                ) : null}
                {!on && showPassed ? (
                  <span className="shrink-0 w-1 h-1 rounded-full bg-[#1565BF]/70" aria-hidden />
                ) : null}
                <span className="truncate">{p.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** 0..phases，按总时长均分推进；结束后停在最后一相 */
function usePhase(active: boolean, phases: number, durationMs: number, freezeAtEnd: boolean) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) {
      if (freezeAtEnd && phases > 0) setPhase(phases);
      else setPhase(0);
      return;
    }
    setPhase(1);
    if (phases <= 1) return;
    const step = Math.max(1100, Math.floor(durationMs / phases));
    const timers: number[] = [];
    for (let i = 2; i <= phases; i += 1) {
      timers.push(window.setTimeout(() => setPhase(i), step * (i - 1)));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, phases, durationMs, freezeAtEnd]);

  return phase;
}

function TypedOrderNo({
  play,
  done,
  text,
}: {
  play: boolean;
  done: boolean;
  text: string;
}) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (done) {
      setShown(text);
      return;
    }
    if (!play) {
      setShown('');
      return;
    }
    setShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 95);
    return () => window.clearInterval(id);
  }, [play, done, text]);
  return (
    <span className="tabular-nums">
      {shown}
      {play && !done && shown.length < text.length ? (
        <span className="inline-block w-[1px] h-[14px] bg-[#1677ff] align-middle ml-0.5 animate-pulse" />
      ) : null}
    </span>
  );
}

/** Browser Use：模拟鼠标查找 / 点击 / 下滑读取 */
function BrowserUseDemo({
  phase,
}: {
  phase: number;
}) {
  const open = phase >= 1;
  const urlReady = phase >= 2;
  const pageReady = phase >= 3;
  const typing = phase >= 4;
  const typedDone = phase >= 5;
  const clicking = phase >= 5;
  const loading = phase === 6;
  const results = phase >= 7;
  const reading = phase >= 7;

  const scrollRef = useRef<HTMLDivElement>(null);
  const orderFieldRef = useRef<HTMLDivElement>(null);
  const queryBtnRef = useRef<HTMLButtonElement>(null);
  const resultRowRef = useRef<HTMLTableRowElement>(null);
  const amountCellRef = useRef<HTMLTableCellElement>(null);

  const [cursor, setCursor] = useState({ x: 72, y: 18, visible: false, clicking: false });

  useEffect(() => {
    if (!pageReady) {
      setCursor({ x: 72, y: 18, visible: false, clicking: false });
      return;
    }

    const moveTo = (
      el: HTMLElement | null,
      fallback: { x: number; y: number },
      opts?: { click?: boolean },
    ) => {
      const root = scrollRef.current?.parentElement;
      if (!el || !root) {
        setCursor((c) => ({
          ...c,
          ...fallback,
          visible: true,
          clicking: Boolean(opts?.click),
        }));
        return;
      }
      const rootBox = root.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const x = ((box.left + box.width * 0.72 - rootBox.left) / rootBox.width) * 100;
      const y = ((box.top + box.height * 0.55 - rootBox.top) / rootBox.height) * 100;
      setCursor({
        x: Math.min(92, Math.max(6, x)),
        y: Math.min(90, Math.max(8, y)),
        visible: true,
        clicking: Boolean(opts?.click),
      });
    };

    if (phase === 3) {
      // 先在页面上扫一眼，再落到订单号
      setCursor({ x: 58, y: 26, visible: true, clicking: false });
      const t = window.setTimeout(() => moveTo(orderFieldRef.current, { x: 28, y: 44 }), 380);
      return () => window.clearTimeout(t);
    }
    if (phase === 4) {
      moveTo(orderFieldRef.current, { x: 28, y: 44 });
      return;
    }
    if (phase === 5) {
      moveTo(queryBtnRef.current, { x: 82, y: 56 }, { click: true });
      const t = window.setTimeout(
        () => setCursor((c) => ({ ...c, clicking: false })),
        420,
      );
      return () => window.clearTimeout(t);
    }
    if (phase === 6) {
      setCursor((c) => ({ ...c, visible: true, clicking: false }));
      return;
    }
    if (phase === 7) {
      // 下滑到结果区并读取商品
      scrollRef.current?.scrollTo({ top: 220, behavior: 'smooth' });
      const t = window.setTimeout(() => moveTo(resultRowRef.current, { x: 36, y: 70 }), 280);
      return () => window.clearTimeout(t);
    }
    if (phase === 8) {
      scrollRef.current?.scrollTo({ top: 280, behavior: 'smooth' });
      const t = window.setTimeout(() => {
        const statusEl = resultRowRef.current?.querySelector('[data-read="status"]') as HTMLElement | null;
        moveTo(statusEl, { x: 52, y: 72 });
      }, 120);
      return () => window.clearTimeout(t);
    }
    if (phase >= 9) {
      scrollRef.current?.scrollTo({ top: 340, behavior: 'smooth' });
      const t = window.setTimeout(() => moveTo(amountCellRef.current, { x: 68, y: 74 }), 120);
      return () => window.clearTimeout(t);
    }
  }, [phase, pageReady]);

  return (
    <div className="h-full min-h-0 flex flex-col p-3 sm:p-4">
      <div
        className={cn(
          'flex-1 min-h-0 flex flex-col rounded-[10px] border border-neutral-300/90 bg-neutral-200 overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.14)] transition-all duration-500',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]',
        )}
      >
        {/* macOS 风格浏览器壳 */}
        <div className="shrink-0 bg-[#dee1e6] border-b border-neutral-300/80">
          <div className="flex items-center gap-3 px-3 pt-2.5 pb-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="hidden sm:flex items-center gap-0.5 text-neutral-500">
              <span className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-black/5 text-[14px] leading-none">
                ‹
              </span>
              <span className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-black/5 text-[14px] leading-none">
                ›
              </span>
              <RefreshCw size={12} className="ml-0.5 opacity-70" />
            </div>
            <div className="flex-1 min-w-0 h-7 rounded-full bg-white border border-neutral-300/70 px-3 flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <Lock size={11} className="shrink-0 text-emerald-600" strokeWidth={2.2} />
              <span className="text-[12px] text-neutral-700 truncate font-medium tracking-tight">
                {urlReady
                  ? 'https://insure-ops.jd.com/claim/order/query?channel=foodsafe'
                  : 'about:blank'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <span className="h-5 px-1.5 rounded bg-white/70 border border-neutral-300/60 text-[10px] text-neutral-500 truncate max-w-[7rem]">
                订单查询
              </span>
              <span className="h-5 w-5 rounded bg-white/40 border border-dashed border-neutral-300 text-[11px] text-neutral-400 inline-flex items-center justify-center">
                +
              </span>
            </div>
          </div>
        </div>

        {/* 网页内容：企业理赔中台 */}
        <div className="flex-1 min-h-0 bg-[#f0f2f5] relative overflow-hidden">
          {/* 模拟鼠标 */}
          <div
            className={cn(
              'pointer-events-none absolute z-30 transition-all duration-700 ease-out',
              cursor.visible ? 'opacity-100' : 'opacity-0',
              cursor.clicking && 'scale-90',
            )}
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            aria-hidden
          >
            <MousePointer2
              size={22}
              className="text-neutral-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
              strokeWidth={1.8}
            />
            {cursor.clicking ? (
              <span className="absolute left-1 top-1 w-5 h-5 rounded-full border-2 border-sky-400 animate-ping opacity-70" />
            ) : null}
            {reading && phase >= 7 ? (
              <span className="absolute left-5 top-5 whitespace-nowrap rounded bg-neutral-900/85 text-white text-[10px] font-medium px-1.5 py-0.5 shadow">
                {phase === 7 ? '读取商品…' : phase === 8 ? '读取状态…' : '读取金额…'}
              </span>
            ) : null}
          </div>

          {!pageReady ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-[#1677ff] animate-spin" />
              <p className="text-[12px] text-neutral-400">正在加载企业系统…</p>
            </div>
          ) : (
            <div className="h-full min-h-0 flex flex-col overflow-hidden">
              <header className="shrink-0 h-11 bg-[#001529] text-white flex items-center px-3 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded bg-[#1677ff] inline-flex items-center justify-center text-[11px] font-bold shrink-0">
                    保
                  </span>
                  <span className="text-[13px] font-semibold tracking-tight truncate">
                    京保理赔作业中台
                  </span>
                </div>
                <nav className="hidden sm:flex items-center gap-1 text-[12px] min-w-0">
                  {[
                    { label: '工作台', on: false },
                    { label: '订单中心', on: true },
                    { label: '理赔管理', on: false },
                    { label: '规则库', on: false },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition',
                        item.on ? 'bg-white/15 text-white' : 'text-white/55',
                      )}
                    >
                      {item.label}
                    </span>
                  ))}
                </nav>
                <div className="ml-auto flex items-center gap-2 text-[11px] text-white/60 shrink-0">
                  <span className="hidden md:inline">数字员工 · Browser Use</span>
                  <span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center text-[10px] text-white">
                    AI
                  </span>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
                <div className="px-3 sm:px-4 py-3 max-w-3xl mx-auto w-full pb-16">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 mb-2.5">
                    <span>首页</span>
                    <ChevronRight size={11} className="opacity-60" />
                    <span>订单中心</span>
                    <ChevronRight size={11} className="opacity-60" />
                    <span className="text-neutral-600">订单查询</span>
                  </div>

                  <section className="rounded-md border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="px-3.5 py-2.5 border-b border-neutral-100 flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-neutral-900">查询条件</h3>
                      <span className="text-[11px] text-neutral-400">食安险 · 现网页面复用</span>
                    </div>
                    <div className="p-3.5 sm:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block min-w-0">
                          <span className="text-[12px] text-neutral-500">
                            订单号 <span className="text-red-500">*</span>
                          </span>
                          <div
                            ref={orderFieldRef}
                            className={cn(
                              'mt-1 h-9 rounded border px-2.5 flex items-center text-[13px] transition bg-white',
                              typing || typedDone
                                ? 'border-[#1677ff] shadow-[0_0_0_2px_rgba(22,119,255,0.15)]'
                                : 'border-neutral-200',
                              phase === 3 && 'ring-2 ring-sky-200',
                            )}
                          >
                            {typing || typedDone ? (
                              <TypedOrderNo
                                play={typing && !typedDone}
                                done={typedDone}
                                text={FOOD_SAFETY_DEMO_ORDER.orderNoMasked}
                              />
                            ) : (
                              <span className="text-neutral-300">请输入完整订单号</span>
                            )}
                            {typedDone ? (
                              <span className="ml-auto text-[11px] text-emerald-600 font-medium shrink-0">
                                已填入
                              </span>
                            ) : null}
                          </div>
                        </label>
                        <label className="block min-w-0 opacity-55">
                          <span className="text-[12px] text-neutral-500">商品名称</span>
                          <div className="mt-1 h-9 rounded border border-neutral-200 bg-neutral-50 px-2.5 flex items-center text-[13px] text-neutral-300">
                            选填
                          </div>
                        </label>
                        <label className="block min-w-0 opacity-55">
                          <span className="text-[12px] text-neutral-500">订单状态</span>
                          <div className="mt-1 h-9 rounded border border-neutral-200 bg-neutral-50 px-2.5 flex items-center justify-between text-[13px] text-neutral-400">
                            全部
                            <span className="text-[10px]">▾</span>
                          </div>
                        </label>
                        <label className="block min-w-0 opacity-55">
                          <span className="text-[12px] text-neutral-500">下单时间</span>
                          <div className="mt-1 h-9 rounded border border-neutral-200 bg-neutral-50 px-2.5 flex items-center text-[13px] text-neutral-300">
                            开始日期 — 结束日期
                          </div>
                        </label>
                      </div>

                      <div className="mt-3.5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="h-8 px-3.5 rounded border border-neutral-200 bg-white text-[12px] text-neutral-600"
                        >
                          重置
                        </button>
                        <button
                          ref={queryBtnRef}
                          type="button"
                          className={cn(
                            'relative h-8 px-4 rounded text-[12px] font-semibold transition inline-flex items-center gap-1.5',
                            clicking || results || loading
                              ? 'bg-[#1677ff] text-white shadow-sm'
                              : 'bg-neutral-200 text-neutral-500',
                          )}
                        >
                          <Search size={12} strokeWidth={2.2} />
                          查询
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="mt-3 rounded-md border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-neutral-100 flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-semibold text-neutral-900">查询结果</h3>
                      {results ? (
                        <span className="text-[11px] text-neutral-400">共 1 条</span>
                      ) : (
                        <span className="text-[11px] text-neutral-300">等待查询</span>
                      )}
                    </div>

                    {loading ? (
                      <div className="px-4 py-10 flex flex-col items-center justify-center gap-2 text-[13px] text-neutral-500">
                        <span className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-[#1677ff] animate-spin" />
                        正在检索订单库…
                      </div>
                    ) : null}

                    {!loading && !results ? (
                      <div className="px-4 py-10 text-center text-[13px] text-neutral-300">
                        请输入订单号后点击查询
                      </div>
                    ) : null}

                    {results ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-[12px]">
                          <thead>
                            <tr className="bg-[#fafafa] text-neutral-500 border-b border-neutral-100">
                              <th className="font-medium px-3.5 py-2.5 whitespace-nowrap">订单号</th>
                              <th className="font-medium px-3.5 py-2.5 whitespace-nowrap">商品</th>
                              <th className="font-medium px-3.5 py-2.5 whitespace-nowrap">状态</th>
                              <th className="font-medium px-3.5 py-2.5 whitespace-nowrap">应付金额</th>
                              <th className="font-medium px-3.5 py-2.5 whitespace-nowrap">渠道</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              ref={resultRowRef}
                              className={cn(
                                'border-b border-neutral-50 transition-colors duration-500',
                                phase >= 7 && 'bg-sky-50/70',
                              )}
                            >
                              <td
                                className={cn(
                                  'px-3.5 py-3 tabular-nums text-neutral-800 transition',
                                  phase >= 7 ? 'opacity-100' : 'opacity-30',
                                )}
                              >
                                {FOOD_SAFETY_DEMO_ORDER.orderNoMasked}
                              </td>
                              <td
                                data-read="product"
                                className={cn(
                                  'px-3.5 py-3 text-neutral-900 font-medium transition',
                                  phase === 7 && 'bg-sky-100/80 ring-2 ring-sky-300/80',
                                  phase >= 7 ? 'opacity-100' : 'opacity-30',
                                )}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {FOOD_SAFETY_DEMO_ORDER.product}
                                  {phase >= 7 ? (
                                    <Check size={13} className="text-emerald-600" strokeWidth={2.5} />
                                  ) : null}
                                </span>
                              </td>
                              <td
                                data-read="status"
                                className={cn(
                                  'px-3.5 py-3 transition',
                                  phase === 8 && 'bg-sky-100/80 ring-2 ring-sky-300/80',
                                  phase >= 8 ? 'opacity-100' : 'opacity-30',
                                )}
                              >
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium border border-emerald-100">
                                  {phase >= 8 ? (
                                    <Check size={11} strokeWidth={2.5} />
                                  ) : null}
                                  {FOOD_SAFETY_DEMO_ORDER.status}
                                </span>
                              </td>
                              <td
                                ref={amountCellRef}
                                data-read="amount"
                                className={cn(
                                  'px-3.5 py-3 tabular-nums font-semibold text-neutral-900 transition',
                                  phase >= 9 && 'bg-sky-100/80 ring-2 ring-sky-300/80',
                                  phase >= 9 ? 'opacity-100' : 'opacity-30',
                                )}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {FOOD_SAFETY_DEMO_ORDER.amount}
                                  {phase >= 9 ? (
                                    <Check size={13} className="text-emerald-600" strokeWidth={2.5} />
                                  ) : null}
                                </span>
                              </td>
                              <td
                                className={cn(
                                  'px-3.5 py-3 text-neutral-500 transition',
                                  phase >= 9 ? 'opacity-100' : 'opacity-30',
                                )}
                              >
                                京东到家
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {phase >= 9 ? (
                          <div className="px-3.5 py-2.5 bg-emerald-50/80 border-t border-emerald-100 text-[12px] text-emerald-800 font-medium flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            已抓取并回填至会话上下文
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>

                  {/* 额外信息区：制造可下滑阅读空间 */}
                  <section className="mt-3 rounded-md border border-neutral-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3.5 py-3 opacity-70">
                    <h4 className="text-[13px] font-semibold text-neutral-800 mb-2">订单明细摘要</h4>
                    <ul className="space-y-1.5 text-[12px] text-neutral-500">
                      <li>投保渠道：京东到家 · 食安险附加</li>
                      <li>履约状态：妥投完成 · 可发起理赔预审</li>
                      <li>材料提示：致病理赔仍需医院诊断与医疗材料</li>
                      <li>系统备注：本页为企业现网页面，经 Browser Use 无侵入调用</li>
                    </ul>
                  </section>

                  <p className="mt-2.5 text-[10px] text-neutral-400 text-center">
                    企业内部现有系统 · 无侵入 Browser Use · 零改造接入
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type BrowseEntry = {
  id: string;
  name: string;
  kind: 'folder' | 'file';
  hit?: boolean;
  score?: string;
  preview?: string;
};

function buildKnowledgeEntries(kbName: string): {
  breadcrumb: string[];
  query: string;
  entries: BrowseEntry[];
  hitPreview: string;
} {
  const hitDoc =
    kbName.includes('意图')
      ? '转人工意图标签_V2.yml'
      : kbName.includes('症状')
        ? '症状-场景映射表.md'
        : kbName.includes('理赔')
          ? '食品安全责任险理赔指引_V3.2.pdf'
          : kbName.includes('理算')
            ? '理算规则-FS-Amount.md'
            : kbName.includes('致病')
              ? '致病非致病判定规则.md'
              : `${kbName}_核心文档.md`;

  const query =
    kbName.includes('意图')
      ? '转人工 请求人工 意图标签'
      : kbName.includes('症状')
        ? '外卖后不适 呕吐 症状场景'
        : kbName.includes('理赔')
          ? '食安险 理赔流程 材料 时效'
          : kbName.includes('理算')
            ? '理算规则 金额核定 FS-Amount'
            : `${kbName} 关键条款`;

  const hitPreview =
    kbName.includes('意图')
      ? '标签「转人工」置信阈值 ≥ 0.90；命中后优先走承接策略，非直接派单。'
      : kbName.includes('理赔')
        ? '食物中毒类理赔适用条款第4.2条。餐品送达后 36 小时内建议就医，需诊断证明、病历和医疗票据等材料。'
        : kbName.includes('理算')
          ? 'FS-Amount：赔付金额 = min(实际损失, 保额剩余) − 免赔额；超额需人工复核。'
          : `来自「${kbName}」的高相关片段，用于本轮回答与策略判断。`;

  return {
    breadcrumb: ['员工挂载库', '知识库', kbName],
    query,
    hitPreview,
    entries: [
      { id: 'f1', name: '00_目录索引.md', kind: 'file' },
      { id: 'f2', name: 'SOP', kind: 'folder' },
      { id: 'f3', name: hitDoc, kind: 'file', hit: true, score: '0.91', preview: hitPreview },
      { id: 'f4', name: 'FAQ补充包.md', kind: 'file' },
      { id: 'f5', name: '历史案例摘要.json', kind: 'file' },
      { id: 'f6', name: '_embeddings', kind: 'folder' },
    ],
  };
}

function buildSkillEntries(skillName: string, meta?: string): {
  breadcrumb: string[];
  query: string;
  entries: BrowseEntry[];
  hitPreview: string;
} {
  return {
    breadcrumb: ['员工挂载库', '技能', skillName],
    query: skillName,
    hitPreview: `读取 SKILL.md 执行说明${meta ? `（${meta}）` : ''}，按技能步骤与边界约束完成本轮动作。`,
    entries: [
      { id: 's1', name: 'SKILL.md', kind: 'file', hit: true, score: meta ?? 'loaded', preview: '技能目标、触发条件、执行步骤与输出约束。' },
      { id: 's2', name: 'scripts', kind: 'folder' },
      { id: 's3', name: 'references', kind: 'folder' },
      { id: 's4', name: 'metadata.yaml', kind: 'file' },
    ],
  };
}

function buildProcessEntries(name: string): {
  breadcrumb: string[];
  query: string;
  entries: BrowseEntry[];
  hitPreview: string;
} {
  return {
    breadcrumb: ['员工挂载库', '流程', name],
    query: name,
    hitPreview: `定位流程节点「${name}」，读取分支条件后继续决策。`,
    entries: [
      { id: 'p1', name: '流程总览.md', kind: 'file' },
      { id: 'p2', name: `${name}.md`, kind: 'file', hit: true, score: 'match' },
      { id: 'p3', name: '分支条件.yml', kind: 'file' },
    ],
  };
}

/**
 * 对齐真实 Agent 路径的可视化（Finder / Browser Use 找文件夹）：
 * 知识库：挂载库 → 进入知识库目录 → 问题改写检索词 → 扫文档命中 → 打开片段
 * 技能：挂载库 → 技能目录 → 打开技能包 → 读取 SKILL.md
 */
function KnowledgeBrowseDemo({
  target,
  active,
}: {
  target: LoopNodeRef | null;
  active: boolean;
}) {
  const isKnowledge = target?.kind === 'knowledge';
  const isSkill = target?.kind === 'skill';
  const pack = useMemo(() => {
    if (!target) return null;
    if (target.kind === 'knowledge') return buildKnowledgeEntries(target.name);
    if (target.kind === 'skill') return buildSkillEntries(target.name, target.meta);
    return buildProcessEntries(target.name);
  }, [target]);

  const [subPhase, setSubPhase] = useState(0);
  const [cursor, setCursor] = useState({ x: 22, y: 28, visible: false, clicking: false });
  const [scanIdx, setScanIdx] = useState(-1);
  const deskRef = useRef<HTMLDivElement>(null);
  const folderRef = useRef<HTMLButtonElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSubPhase(0);
    setScanIdx(-1);
    setCursor({ x: 22, y: 28, visible: false, clicking: false });
    if (!target || !active || !pack) return;

    const timers = [
      window.setTimeout(() => setSubPhase(1), 80), // 打开资源管理器 / 挂载库
      window.setTimeout(() => setSubPhase(2), 520), // 进入目标文件夹
      window.setTimeout(() => setSubPhase(3), 980), // 改写/定位检索词
      window.setTimeout(() => setSubPhase(4), 1500), // 扫文件
      window.setTimeout(() => setSubPhase(5), 2200), // 点击命中
      window.setTimeout(() => setSubPhase(6), 2800), // 打开预览
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [target?.name, target?.kind, target?.meta, active, pack]);

  useEffect(() => {
    if (subPhase !== 4 || !pack) {
      if (subPhase < 4) setScanIdx(-1);
      return;
    }
    let i = 0;
    setScanIdx(0);
    const id = window.setInterval(() => {
      i += 1;
      if (i >= pack.entries.length) {
        window.clearInterval(id);
        return;
      }
      setScanIdx(i);
    }, 160);
    return () => window.clearInterval(id);
  }, [subPhase, pack]);

  useEffect(() => {
    if (!active || !target || !pack) {
      setCursor((c) => ({ ...c, visible: false }));
      return;
    }
    const root = deskRef.current;
    const moveTo = (el: HTMLElement | null, fallback: { x: number; y: number }, click?: boolean) => {
      if (!root || !el) {
        setCursor({ ...fallback, visible: true, clicking: Boolean(click) });
        return;
      }
      const rootBox = root.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const x = ((box.left + box.width * 0.55 - rootBox.left) / rootBox.width) * 100;
      const y = ((box.top + box.height * 0.5 - rootBox.top) / rootBox.height) * 100;
      setCursor({
        x: Math.min(90, Math.max(6, x)),
        y: Math.min(88, Math.max(8, y)),
        visible: true,
        clicking: Boolean(click),
      });
    };

    if (subPhase === 1) {
      moveTo(folderRef.current, { x: 18, y: 42 });
      return;
    }
    if (subPhase === 2) {
      moveTo(folderRef.current, { x: 18, y: 42 }, true);
      const t = window.setTimeout(() => setCursor((c) => ({ ...c, clicking: false })), 320);
      return () => window.clearTimeout(t);
    }
    if (subPhase === 3) {
      moveTo(searchRef.current, { x: 55, y: 16 });
      return;
    }
    if (subPhase === 4) {
      setCursor({ x: 58, y: 36 + Math.min(scanIdx, 4) * 8, visible: true, clicking: false });
      return;
    }
    if (subPhase >= 5) {
      moveTo(hitRef.current, { x: 62, y: 52 }, subPhase === 5);
      if (subPhase === 5) {
        const t = window.setTimeout(() => setCursor((c) => ({ ...c, clicking: false })), 360);
        return () => window.clearTimeout(t);
      }
    }
  }, [subPhase, active, target, pack, scanIdx]);

  const statusLabel =
    !target || !active
      ? '待命'
      : subPhase <= 1
        ? '打开挂载库'
        : subPhase === 2
          ? isKnowledge
            ? '进入知识库文件夹'
            : isSkill
              ? '进入技能包文件夹'
              : '进入流程目录'
          : subPhase === 3
            ? isKnowledge
              ? '改写检索词'
              : '定位技能包'
            : subPhase === 4
              ? isKnowledge
                ? '向量检索扫文件…'
                : '浏览技能包文件…'
              : subPhase === 5
                ? '打开命中文件'
                : isKnowledge
                  ? '读取知识片段'
                  : '读取 SKILL.md';

  const typedQuery =
    pack && subPhase >= 3
      ? pack.query.slice(0, Math.min(pack.query.length, 6 + (subPhase - 2) * 8))
      : '';

  return (
    <div className="h-full min-h-0 flex flex-col p-2 sm:p-3">
      <div
        className={cn(
          'flex-1 min-h-0 flex flex-col rounded-[10px] border border-neutral-300/90 bg-[#c8c8c8] overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-300',
          target && active ? 'opacity-100 scale-100' : 'opacity-90',
        )}
      >
        {/* Finder 标题栏 */}
        <div className="shrink-0 bg-[#e8e8e8] border-b border-neutral-300/90">
          <div className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 min-w-0 text-center">
              <span className="text-[11px] font-semibold text-neutral-700 truncate">
                {!target
                  ? '员工挂载资源'
                  : isSkill
                    ? '技能包资源管理器'
                    : isKnowledge
                      ? '知识库资源管理器'
                      : '流程资源管理器'}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 tabular-nums shrink-0 max-w-[7rem] truncate">
              {statusLabel}
            </span>
          </div>
          {/* 路径面包屑：像进文件夹 */}
          <div className="px-2.5 pb-2">
            <div className="h-7 rounded-md bg-white/90 border border-neutral-300/80 px-2 flex items-center gap-1 overflow-hidden">
              <Folder size={12} className="text-[#1565BF] shrink-0" />
              {(pack?.breadcrumb ?? ['员工挂载库']).map((seg, i, arr) => (
                <React.Fragment key={`${seg}-${i}`}>
                  {i > 0 ? (
                    <ChevronRight size={11} className="text-neutral-300 shrink-0" />
                  ) : null}
                  <span
                    className={cn(
                      'text-[11px] truncate',
                      i === arr.length - 1 && subPhase >= 2
                        ? 'text-neutral-900 font-semibold'
                        : 'text-neutral-500',
                      subPhase < 2 && i > 0 && 'opacity-40',
                    )}
                  >
                    {seg}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div ref={deskRef} className="flex-1 min-h-0 bg-[#f5f5f7] relative overflow-hidden flex">
          {/* 鼠标 */}
          <div
            className={cn(
              'pointer-events-none absolute z-30 transition-all duration-500 ease-out',
              cursor.visible ? 'opacity-100' : 'opacity-0',
              cursor.clicking && 'scale-90',
            )}
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            aria-hidden
          >
            <MousePointer2
              size={18}
              className="text-neutral-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
              strokeWidth={1.8}
            />
            {cursor.clicking ? (
              <span className="absolute left-1 top-1 w-4 h-4 rounded-full border-2 border-sky-400 animate-ping opacity-70" />
            ) : null}
            {subPhase >= 5 && target ? (
              <span className="absolute left-4 top-5 whitespace-nowrap rounded bg-neutral-900/85 text-white text-[10px] font-medium px-1.5 py-0.5 shadow">
                {subPhase >= 6 ? (isKnowledge ? '读取片段' : '读取 SKILL.md') : '双击打开'}
              </span>
            ) : null}
          </div>

          {!target || !pack ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <Folder size={28} className="text-neutral-300" />
              <p className="text-[12px] text-neutral-400 leading-relaxed">
                Agent 调知识 / 技能时
                <br />
                会像在电脑里打开挂载文件夹查找
              </p>
            </div>
          ) : (
            <>
              {/* 左侧：挂载库侧栏 */}
              <aside className="w-[88px] sm:w-[100px] shrink-0 border-r border-neutral-200/90 bg-[#ececef] py-2 px-1.5 space-y-0.5">
                <p className="px-1.5 text-[9px] font-semibold tracking-wider text-neutral-400 mb-1">
                  FAVORITES
                </p>
                {(
                  [
                    { id: 'kb', label: '知识库', on: isKnowledge || (!isSkill && target.kind !== 'process') },
                    { id: 'sk', label: '技能', on: isSkill },
                    { id: 'flow', label: '流程', on: target.kind === 'process' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    ref={item.on ? folderRef : undefined}
                    className={cn(
                      'w-full flex items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors',
                      item.on && subPhase >= 1
                        ? 'bg-[#1565BF]/15 text-[#1565BF]'
                        : 'text-neutral-600',
                      subPhase === 1 && item.on && 'ring-1 ring-[#1565BF]/40',
                    )}
                  >
                    <Folder size={12} className="shrink-0" />
                    <span className="text-[10px] font-medium truncate">{item.label}</span>
                  </button>
                ))}
              </aside>

              {/* 右侧：文件夹内容 */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {/* 检索条：知识库 = RAG 改写词；技能 = 包名定位 */}
                <div ref={searchRef} className="shrink-0 px-2 py-1.5 border-b border-neutral-200/80 bg-white/80">
                  <div className="h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2 flex items-center gap-1.5">
                    <Search size={12} className="text-neutral-400 shrink-0" />
                    <span className="text-[11px] text-neutral-800 truncate flex-1 min-w-0 font-mono">
                      {subPhase < 3
                        ? isKnowledge
                          ? '等待问题改写…'
                          : '定位技能包…'
                        : typedQuery}
                      {active && subPhase === 3 ? (
                        <span className="inline-block w-0.5 h-3 ml-0.5 align-middle bg-[#1565BF] animate-pulse" />
                      ) : null}
                    </span>
                    {subPhase === 4 ? (
                      <span className="w-3 h-3 rounded-full border-2 border-neutral-200 border-t-[#1565BF] animate-spin shrink-0" />
                    ) : null}
                  </div>
                  {subPhase >= 3 && isKnowledge ? (
                    <p className="mt-1 text-[9px] text-neutral-400 px-0.5">
                      RAG：口语问题 → 检索关键词 → 向量扫库
                    </p>
                  ) : null}
                  {subPhase >= 3 && isSkill ? (
                    <p className="mt-1 text-[9px] text-neutral-400 px-0.5">
                      路由：意图匹配技能 → 打开技能包目录 → 读 SKILL.md
                    </p>
                  ) : null}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
                  {pack.entries.map((entry, idx) => {
                    const scanning = subPhase === 4 && scanIdx === idx;
                    const scanned = subPhase === 4 && scanIdx > idx;
                    const selected = subPhase >= 5 && entry.hit;
                    const dim = subPhase < 2;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        ref={entry.hit ? hitRef : undefined}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all duration-150',
                          selected && 'bg-[rgba(21,101,191,0.12)] ring-1 ring-[#1565BF]/40',
                          scanning && 'bg-amber-50 ring-1 ring-amber-200/80',
                          scanned && !entry.hit && 'opacity-45',
                          dim && 'opacity-35',
                        )}
                      >
                        {entry.kind === 'folder' ? (
                          <Folder size={14} className="shrink-0 text-amber-500" />
                        ) : (
                          <FileText
                            size={14}
                            className={cn(
                              'shrink-0',
                              selected ? 'text-[#1565BF]' : 'text-neutral-400',
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            'min-w-0 flex-1 text-[11px] truncate',
                            selected ? 'text-neutral-900 font-semibold' : 'text-neutral-700',
                          )}
                        >
                          {entry.name}
                        </span>
                        {scanning ? (
                          <span className="text-[9px] text-amber-700 shrink-0">扫描</span>
                        ) : null}
                        {selected && entry.score ? (
                          <span className="shrink-0 text-[9px] font-semibold tabular-nums text-[#1565BF]">
                            {isKnowledge ? `相似 ${entry.score}` : entry.score}
                          </span>
                        ) : null}
                        {selected && subPhase >= 6 ? (
                          <Check size={12} className="shrink-0 text-emerald-600" strokeWidth={2.5} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {subPhase >= 6 && pack ? (
                  <div className="shrink-0 border-t border-neutral-200 bg-white px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-semibold text-neutral-500">
                        {isKnowledge ? '命中片段' : isSkill ? '已加载技能说明' : '已定位流程'}
                      </p>
                      {target.meta ? (
                        <span className="text-[10px] tabular-nums text-neutral-400">{target.meta}</span>
                      ) : null}
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-800 line-clamp-3">
                      {pack.hitPreview}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Agent Loop 主面板：左 Thought → 右 Finder（串行：先打完思考，再进库动画） */
function AgentLoopThinkPanel({
  stage,
  phase,
  running,
}: {
  stage: CapabilityDemoStage;
  phase: number;
  running: boolean;
}) {
  const nodes = stage.nodes;
  const revealed = Math.min(Math.max(phase, 0), nodes.length);
  const currentIdx = running && revealed > 0 ? revealed - 1 : -1;
  const activeNode: LoopDemoNode | null = currentIdx >= 0 ? nodes[currentIdx] : null;
  const doneAll = !running && revealed >= nodes.length && nodes.length > 0;

  const browseTarget = useMemo(() => {
    const refs = activeNode?.refs ?? [];
    const preferred =
      refs.find((r) => r.kind === 'knowledge') ??
      refs.find((r) => r.kind === 'skill') ??
      refs.find((r) => r.kind === 'process') ??
      null;
    if (preferred) return preferred;
    if (doneAll) {
      for (let i = nodes.length - 1; i >= 0; i -= 1) {
        const hit = (nodes[i].refs ?? []).find(
          (r) => r.kind === 'knowledge' || r.kind === 'skill' || r.kind === 'process',
        );
        if (hit) return hit;
      }
    }
    return null;
  }, [activeNode, doneAll, nodes]);

  const hasBrowseRefs = Boolean(
    activeNode &&
      (activeNode.refs ?? []).some(
        (r) => r.kind === 'knowledge' || r.kind === 'skill' || r.kind === 'process',
      ),
  );

  const [thoughtShown, setThoughtShown] = useState('');
  const [thoughtDone, setThoughtDone] = useState(false);
  /** Thought 出答案后停顿，再调用系统（进库 / 技能），禁止立刻连着播 */
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    const full = activeNode?.thought ?? '';
    setThoughtDone(false);
    setSystemReady(false);
    if (!full) {
      setThoughtShown(doneAll ? '循环收敛，输出回复' : '');
      setThoughtDone(Boolean(doneAll || !running));
      setSystemReady(Boolean(doneAll || !running));
      return;
    }
    setThoughtShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setThoughtShown(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
        setThoughtDone(true);
      }
    }, 22);
    return () => window.clearInterval(id);
  }, [activeNode?.thought, activeNode?.action, doneAll, stage.turnId, running]);

  useEffect(() => {
    if (!running || !thoughtDone || !hasBrowseRefs) {
      if (!running) setSystemReady(false);
      return;
    }
    setSystemReady(false);
    const t = window.setTimeout(() => setSystemReady(true), 1200);
    return () => window.clearTimeout(t);
  }, [running, thoughtDone, hasBrowseRefs, activeNode?.action, stage.turnId]);

  /** 串行：Thought 打完 → 停顿看答案 → 再启动右侧进库 */
  const browseActive = Boolean(running && systemReady && hasBrowseRefs);
  const waitingToCallSystem = Boolean(running && thoughtDone && !systemReady && hasBrowseRefs);
  const showBrowseIdle = !browseActive && !doneAll;
  const focusRight = browseActive || doneAll;

  return (
    <div className="relative h-full overflow-hidden">
      <div className="relative h-full flex flex-col py-3 sm:py-4 min-h-0 overflow-hidden px-3 sm:px-4">
        <div className="shrink-0 mb-3 px-1">
          <h2
            className={cn(
              'text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] leading-tight truncate',
              SKILL_AOP_GRADIENT_TEXT,
            )}
          >
            {stage.title}
          </h2>
          {activeNode?.action ? (
            <p className="mt-1 text-[12px] font-medium text-neutral-500 truncate">
              当前步骤 · {activeNode.action}
            </p>
          ) : null}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] gap-3 overflow-hidden">
          {/* 左：仅 Thought；进库阶段降噪，避免双区同时抢注意力 */}
          <div
            className={cn(
              'min-h-0 flex flex-col rounded-[12px] border border-neutral-200/80 bg-white/90 overflow-hidden transition-opacity duration-300',
              focusRight && running ? 'opacity-45' : 'opacity-100',
            )}
          >
            <div className="flex-1 min-h-0 px-3 py-3 overflow-y-auto">
              <div className="flex items-start gap-2 min-w-0 h-full">
                <Activity size={15} strokeWidth={2} className="shrink-0 mt-0.5 text-[#1565BF]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold tracking-[0.08em] text-[#1565BF]">
                      THOUGHT
                    </span>
                    {running && !thoughtDone ? (
                      <span
                        className="block w-3 h-3 rounded-full border-2 border-[#1565BF]/20 border-t-[#1565BF] animate-spin"
                        aria-hidden
                      />
                    ) : doneAll || (thoughtDone && !browseActive && !waitingToCallSystem) ? (
                      <Check size={13} className="text-emerald-600" strokeWidth={2.5} />
                    ) : null}
                  </div>
                  <p className="text-[14px] sm:text-[15px] leading-relaxed text-neutral-800">
                    {thoughtShown || (running ? '…' : '等待输入')}
                    {running && !thoughtDone && thoughtShown ? (
                      <span className="inline-block w-0.5 h-[14px] ml-0.5 align-middle bg-[#1565BF] animate-pulse" />
                    ) : null}
                  </p>
                  {waitingToCallSystem ? (
                    <p className="mt-2 text-[11px] font-medium text-neutral-500">
                      已得出结论 · 稍后调用系统…
                    </p>
                  ) : null}
                  {running && systemReady && hasBrowseRefs ? (
                    <p className="mt-2 text-[11px] font-medium text-[#1565BF]">
                      开始进库查找…
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* 右：仅在 Thought 结束后播放 Finder 动画 */}
          <div
            className={cn(
              'min-h-0 min-w-0 rounded-[12px] border border-neutral-200/80 bg-white/70 overflow-hidden flex flex-col transition-opacity duration-300',
              showBrowseIdle ? 'opacity-50' : 'opacity-100',
            )}
          >
            <div className="shrink-0 px-3 py-2 border-b border-neutral-200/70 flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400">
                FINDER
              </span>
              <span className="text-[12px] text-neutral-600 truncate">
                {waitingToCallSystem
                  ? '等待调用系统…'
                  : !thoughtDone && running
                    ? '等待思考结束…'
                    : browseTarget
                      ? browseTarget.kind === 'knowledge'
                        ? '进知识库找文档'
                        : browseTarget.kind === 'skill'
                          ? '进技能包读 SKILL.md'
                          : '进流程目录定位'
                      : '待命 · 挂载库'}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <KnowledgeBrowseDemo
                target={browseTarget}
                active={browseActive || (doneAll && Boolean(browseTarget))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialRejectDemo({
  phase,
  stage,
}: {
  phase: number;
  stage: CapabilityDemoStage;
}) {
  const materials = stage.materials ?? [];
  const nodes = stage.nodes;
  const materialPhases = materials.length;
  const checked = Math.min(phase, materials.length);
  const rejected = phase > materials.length;
  const nodePhase = rejected ? Math.min(phase - materialPhases, nodes.length) : 0;
  const liveNodeIdx =
    rejected && nodePhase > 0 && nodePhase <= nodes.length ? nodePhase - 1 : -1;

  return (
    <div className="relative h-full overflow-hidden">
      <div className={cn('relative h-full flex flex-col py-4 min-h-0 overflow-hidden', LOOP_CONTENT_FRAME)}>
        <div className="shrink-0 mb-3">
          <p className="text-[10px] font-medium tracking-[0.14em] text-neutral-400 mb-0.5">CHECK</p>
          <h2
            className={cn(
              'text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] leading-tight',
              SKILL_AOP_GRADIENT_TEXT,
            )}
          >
            材料完整性
          </h2>
        </div>

        <div className="shrink-0 rounded-[12px] border border-neutral-200/90 overflow-hidden bg-white/80 shadow-sm mb-3">
          {materials.map((m, idx) => {
            const on = idx < checked;
            return (
              <div
                key={m.label}
                className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 last:border-0"
              >
                <span className="text-[14px] text-neutral-800 tracking-[-0.02em]">{m.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[12px] font-semibold transition',
                    on ? 'text-rose-600' : 'text-neutral-300',
                  )}
                >
                  {on ? (
                    <>
                      <X size={13} /> 无
                    </>
                  ) : (
                    '…'
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {rejected ? (
          <div className="shrink-0 mb-3 min-h-0 overflow-hidden">
            <KnowledgeSkillCallStrip
              nodes={nodes}
              revealed={nodePhase}
              currentIdx={liveNodeIdx}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CareDemo({
  accent,
  plain,
}: {
  accent: string;
  plain: string;
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="relative h-full flex flex-col items-center justify-center px-10 text-center gap-3">
        <CapabilityStageHeadline challenge={accent} coreValue={plain} compact />
        <p className="text-[13px] text-neutral-500 max-w-[22rem] leading-relaxed">
          礼貌收尾，并保留后续咨询入口——服务结束，关系不断。
        </p>
      </div>
    </div>
  );
}

/** 解析指标展示值，如 15% / 1.3s */
function parseMetricDisplay(raw: string): { num: number; suffix: string; decimals: number } | null {
  const m = raw.trim().match(/^([\d.]+)(.*)$/);
  if (!m) return null;
  const whole = m[1];
  const num = Number(whole);
  if (!Number.isFinite(num)) return null;
  const decimals = whole.includes('.') ? (whole.split('.')[1]?.length ?? 0) : 0;
  return { num, suffix: m[2] ?? '', decimals };
}

function useCountUp(
  target: number,
  active: boolean,
  durationMs: number,
  decimals: number,
  resetKey: string,
) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    setVal(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs, decimals, resetKey]);

  if (decimals > 0) return val.toFixed(decimals);
  return String(Math.round(val));
}

function ImpactMetricCard({
  label,
  before,
  after,
  unit,
  delayMs,
  visible,
  animKey,
}: {
  label: string;
  before?: string;
  after: string;
  unit?: string;
  delayMs: number;
  visible: boolean;
  animKey: string;
}) {
  const parsed = parseMetricDisplay(after);
  const countActive = visible && Boolean(parsed);
  const counted = useCountUp(
    parsed?.num ?? 0,
    countActive,
    1100,
    parsed?.decimals ?? 0,
    `${animKey}-${after}`,
  );
  const display = parsed ? `${counted}${parsed.suffix}` : after;

  return (
    <div
      className={cn(
        'rounded-[16px] bg-white/90 px-4 py-4 shadow-[0_8px_24px_-16px_rgba(17,17,17,0.2)] transition-all duration-500 ease-out',
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-[0.98]',
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      <p className="text-[12px] text-neutral-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        {before ? (
          <>
            <span
              className={cn(
                'text-[15px] text-neutral-400 tabular-nums transition-all duration-700',
                visible ? 'line-through opacity-100' : 'opacity-0',
              )}
              style={{ transitionDelay: visible ? `${delayMs + 200}ms` : '0ms' }}
            >
              {before}
            </span>
            <span
              className={cn(
                'text-neutral-300 transition-opacity duration-500',
                visible ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transitionDelay: visible ? `${delayMs + 280}ms` : '0ms' }}
            >
              →
            </span>
          </>
        ) : null}
        <span
          className={cn(
            'text-[28px] font-semibold tracking-[-0.03em] tabular-nums',
            SKILL_AOP_GRADIENT_TEXT,
          )}
          style={
            visible
              ? {
                  animation: 'impactPop 700ms ease-out both',
                  animationDelay: `${delayMs + 120}ms`,
                }
              : undefined
          }
        >
          {display}
        </span>
      </div>
      {unit ? <p className="mt-1.5 text-[11px] text-neutral-400">{unit}</p> : null}
    </div>
  );
}

/** 上岗成效：方法 / 效果 */
function ImpactDemo({
  stage,
  running,
}: {
  stage: CapabilityDemoStage;
  running: boolean;
}) {
  const impact = stage.impact;
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    setReveal(0);
    const hasMetrics = Boolean(impact?.metrics?.length);
    const timers = [
      window.setTimeout(() => setReveal(1), 40),
      window.setTimeout(() => setReveal(2), 220),
      window.setTimeout(() => setReveal(3), hasMetrics ? 420 : 360),
      window.setTimeout(() => setReveal(4), hasMetrics ? 1600 : 720),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
    // 仅按幕次启动一次；勿依赖 running，结束后会变 false 导致重播
  }, [stage.turnId, impact?.metrics?.length]);

  if (!impact) return null;

  return (
    <div className="relative h-full overflow-hidden">
      <style>{`
        @keyframes impactPop {
          0% { transform: scale(0.92); opacity: 0.55; filter: blur(2px); }
          60% { transform: scale(1.04); opacity: 1; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes impactGlow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 14%, rgba(21,101,191,0.1) 0%, transparent 55%), radial-gradient(ellipse 70% 45% at 85% 90%, rgba(0,0,0,0.03) 0%, transparent 50%), #FAFAFA',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-[rgba(21,101,191,0.12)] blur-3xl"
        style={{ animation: running ? 'impactGlow 2.4s ease-in-out infinite' : undefined }}
        aria-hidden
      />
      <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 py-10 max-w-2xl mx-auto w-full">
        <div
          className={cn(
            'flex items-center gap-2 mb-3 transition-all duration-500 ease-out',
            reveal >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          )}
        >
          <p className="text-[12px] font-medium tracking-[0.14em] text-neutral-400">
            {impact.eyebrow}
          </p>
        </div>
        <h2
          className={cn(
            'text-[32px] sm:text-[38px] font-semibold tracking-[-0.03em] leading-[1.15] mb-3 transition-all duration-500 ease-out',
            SKILL_AOP_GRADIENT_TEXT,
            reveal >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
          )}
        >
          {impact.title}
        </h2>
        <p
          className={cn(
            'text-[15px] text-neutral-600 leading-snug mb-8 line-clamp-3 transition-all duration-500 ease-out',
            reveal >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
          )}
        >
          {impact.summary}
        </p>

        {impact.metrics?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {impact.metrics.map((m, i) => (
              <ImpactMetricCard
                key={m.label}
                label={m.label}
                before={m.before}
                after={m.after}
                unit={m.unit}
                delayMs={i * 140}
                visible={reveal >= 3}
                animKey={stage.turnId}
              />
            ))}
          </div>
        ) : null}

        {impact.points?.length ? (
          <ul className="space-y-2.5">
            {impact.points.map((point, i) => (
              <li
                key={point}
                className={cn(
                  'flex items-start gap-2.5 rounded-[12px] bg-white/80 px-3.5 py-2.5 text-[14px] text-neutral-700 transition-all duration-500 ease-out',
                  reveal >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                )}
                style={{ transitionDelay: reveal >= 4 ? `${i * 90}ms` : '0ms' }}
              >
                <Check size={14} className="mt-0.5 shrink-0 text-[#1565BF]" strokeWidth={2.5} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function FoodSafetyCapabilityPanel({
  activeTurnId,
  running,
}: {
  activeTurnId: string | null;
  running: boolean;
}) {
  const stage = useMemo(
    () =>
      (activeTurnId && FOOD_SAFETY_CAPABILITY_STAGES.find((s) => s.turnId === activeTurnId)) ||
      null,
    [activeTurnId],
  );

  const phases = useMemo(() => {
    if (!stage) return 0;
    if (stage.mode === 'browser') return 9;
    if (stage.mode === 'path-switch') return Math.max(stage.nodes.length, 2);
    if (stage.mode === 'material-reject')
      return (stage.materials?.length ?? 0) + Math.max(stage.nodes.length, 1);
    if (stage.mode === 'care') return 1;
    if (stage.mode === 'impact') return 1;
    return Math.max(stage.nodes.length, 1);
  }, [stage]);

  const phase = usePhase(Boolean(stage && running), phases, stage?.durationMs ?? 1000, Boolean(stage));

  const headlineAccent = stage?.headlineAccent ?? '请求转人工';
  const headlinePlain = stage?.headlinePlain ?? '主动承接';

  return (
    <aside className="jd-langzheng relative h-full min-h-0 w-full flex flex-col rounded-[16px] border border-neutral-200/80 bg-white overflow-hidden shadow-[0_8px_30px_rgba(17,17,17,0.04)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 48% at 50% 0%, rgba(21,101,191,0.09) 0%, transparent 58%), radial-gradient(ellipse 70% 42% at 88% 92%, rgba(0,0,0,0.03) 0%, transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative flex flex-col h-full min-h-0">
        {stage && stage.mode !== 'care' ? (
          <CapabilityStageHeadline
            challenge={headlineAccent}
            coreValue={headlinePlain}
            className="px-5 pt-8 sm:pt-10 pb-3"
          />
        ) : null}

        {stage && stage.mode !== 'care' && stage.mode !== 'impact' ? (
          <AgentLoopStrip stage={stage} running={running} />
        ) : null}

        <div className="flex-1 min-h-0 overflow-hidden">
          {!stage ? (
            <div className="relative h-full overflow-hidden">
              <div className="relative h-full flex flex-col items-center justify-center px-10 text-center">
                <p className="food-safety-hero-caption text-[28px] sm:text-[34px] leading-none tracking-[-0.02em] select-text whitespace-nowrap">
                  <span className="food-safety-hero-caption-accent">食安险</span>
                  <span className="food-safety-hero-caption-plain">数字员工能力演示</span>
                </p>
              </div>
            </div>
          ) : stage.mode === 'browser' ? (
            <BrowserUseDemo phase={phase} />
          ) : stage.mode === 'path-switch' ? (
            <AgentLoopThinkPanel stage={stage} phase={phase} running={running} />
          ) : stage.mode === 'material-reject' ? (
            <MaterialRejectDemo phase={phase} stage={stage} />
          ) : stage.mode === 'care' ? (
            <CareDemo accent={headlineAccent} plain={headlinePlain} />
          ) : stage.mode === 'impact' ? (
            <ImpactDemo stage={stage} running={running} />
          ) : (
            <AgentLoopThinkPanel stage={stage} phase={phase} running={running} />
          )}
        </div>
      </div>
    </aside>
  );
}
