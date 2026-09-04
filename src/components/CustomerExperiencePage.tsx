/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 客户体验 — iPhone 机框内的客户 ↔ 数字员工对话。
 * 气泡样式对齐技能创建；食安险演示走 40s 脚本问答（无中间思考过程）。
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowUp, Wifi, MousePointer2, Play, Pause } from '@/lib/icons';
import { defaultOpeningLineForAgent } from '@/lib/agentDefaultCopy';
import { mockAgentChatReply } from '../lib/mockAgentChatReply';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AGENT_AVATAR_PRESETS } from '@/lib/agentAvatarDisplay';
import { cn } from '@/lib/utils';
import { ContentBusy } from './common/ContentBusy';
import { useMockLatency } from '@/lib/useMockLatency';
import {
  BTN_OUTLINE,
  PANEL,
  SKILL_AOP_PRIMARY_BTN,
  SKILL_AOP_SEND_BTN,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
} from '@/lib/ui';
import {
  FOOD_SAFETY_DEMO_ORDER,
  FOOD_SAFETY_DEMO_TURNS,
  FOOD_SAFETY_DEMO_STEP_COUNT,
  getFoodSafetyOrderSelectTurn,
  matchFoodSafetyDemoTurn,
  type FoodSafetyDemoTurn,
} from '@/lib/foodSafetyDemoScript';
import { FoodSafetyCapabilityPanel } from './FoodSafetyCapabilityPanel';

type ChatMsg = {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  offerOrder?: boolean;
};

const USER_CHAT_BUBBLE = cn(
  'px-3 py-2.5 text-[15px] leading-[21px] whitespace-pre-line text-[#181D27] rounded-[18px_4px_18px_18px]',
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  'border',
);

const AGENT_CHAT_BUBBLE =
  'px-3 py-2.5 rounded-[4px_18px_18px_18px] text-[15px] leading-[21px] whitespace-pre-line bg-neutral-100 text-neutral-800';

function nowTime(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBarClock(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 客户体验演示默认形象：第三排最后一位白衣女生 → avatar-18 */
const EXPERIENCE_DEFAULT_AVATAR = AGENT_AVATAR_PRESETS[17];

function ExperienceAgentAvatar() {
  return (
    <Avatar className="h-7 w-7 shrink-0 overflow-hidden">
      <AvatarImage src={EXPERIENCE_DEFAULT_AVATAR} alt="" />
      <AvatarFallback className="bg-neutral-100" />
    </Avatar>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start gap-2 items-start">
      <div className="h-7 w-7 shrink-0" aria-hidden />
      <div
        className={cn(AGENT_CHAT_BUBBLE, 'inline-flex items-center gap-1 px-3 py-2.5')}
        aria-label="对方正在输入"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:120ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:240ms]" />
      </div>
    </div>
  );
}

function IPhoneStatusBar({ clock }: { clock: string }) {
  return (
    <div className="relative z-20 flex h-[54px] shrink-0 items-end px-6 pb-2.5 text-black">
      <div className="flex-1">
        <span className="text-[15px] font-semibold tabular-nums tracking-tight">{clock}</span>
      </div>
      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 top-2.5 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        aria-hidden
      />
      <div className="flex flex-1 items-center justify-end gap-1.5 pb-0.5">
        <div className="flex items-end gap-[2px]" aria-hidden>
          <span className="h-[4px] w-[3px] rounded-[1px] bg-black" />
          <span className="h-[6px] w-[3px] rounded-[1px] bg-black" />
          <span className="h-[8px] w-[3px] rounded-[1px] bg-black" />
          <span className="h-[10px] w-[3px] rounded-[1px] bg-black/35" />
        </div>
        <Wifi size={14} strokeWidth={2.5} className="text-black" />
        <div
          className="relative h-[11px] w-[24px] rounded-[3px] border border-black/80 p-[1px]"
          aria-hidden
        >
          <div className="h-full w-[70%] rounded-[1.5px] bg-black" />
          <div className="absolute -right-[3px] top-1/2 h-[5px] w-[1.5px] -translate-y-1/2 rounded-r-[1px] bg-black/80" />
        </div>
      </div>
    </div>
  );
}

export const CustomerExperiencePage: React.FC = () => {
  const {
    experienceAgentId,
    setExperienceAgentId,
    hiredAgents,
    setActiveTab,
    showToast,
  } = useApp();

  const agent = hiredAgents.find((a) => a.id === experienceAgentId);
  const openingLine =
    agent?.openingLine || (agent ? defaultOpeningLineForAgent(agent.name) : '');

  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [completedTurnIds, setCompletedTurnIds] = useState<Set<string>>(() => new Set());
  const [orderPicked, setOrderPicked] = useState(false);
  const [clock, setClock] = useState(statusBarClock);
  const [capabilityTurnId, setCapabilityTurnId] = useState<string | null>(null);
  const [capabilityRunning, setCapabilityRunning] = useState(false);
  /** 脚本分步演示：下一幕索引 */
  const [demoCursor, setDemoCursor] = useState(0);
  const [demoPhase, setDemoPhase] = useState<'idle' | 'typing' | 'clicking' | 'waiting'>('idle');
  const [orderClickPulse, setOrderClickPulse] = useState(false);
  const [orderPointerOn, setOrderPointerOn] = useState(false);
  const [orderPointerSettled, setOrderPointerSettled] = useState(false);
  /** 进页开场：京小灵文案 5s 后淡出，再显示手机与能力卡 */
  const [introPhase, setIntroPhase] = useState<'show' | 'fade' | 'done'>('show');
  /** 自动连播演示（可暂停） */
  const [demoAutoplay, setDemoAutoplay] = useState(false);
  const paneBusy = useMockLatency(experienceAgentId, 'workspaceOpen');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const orderCardRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<number | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const typeTimerRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);
  const playDemoStepAtRef = useRef<(cursor: number, opts?: { fast?: boolean }) => void>(() => {});
  const pendingReplyRef = useRef<{
    text: string;
    turnId?: string;
    offerOrder?: boolean;
  } | null>(null);

  const DEMO_FAST_THINK_MS = 320;
  /** 发送后 → 开卡、卡结束 → 下轮输入，各留白 2s */
  const DEMO_GAP_MS = 2000;
  /** 自动播放：每幕 idle 后等待多久再进下一幕 */
  const AUTOPLAY_STEP_DELAY_MS = 800;

  useEffect(() => {
    const fadeAt = window.setTimeout(() => setIntroPhase('fade'), 5000);
    const doneAt = window.setTimeout(() => setIntroPhase('done'), 5600);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, []);

  const clearDemoTimers = () => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    if (typeTimerRef.current) {
      window.clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }
    if (autoPlayTimerRef.current) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  const resizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, 20), 120);
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    resizeComposer();
  }, [input]);

  useEffect(() => {
    const tick = window.setInterval(() => setClock(statusBarClock()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (agent && agent.status !== 'online') {
      showToast('未上线员工不可预览，请先准予上岗');
      setExperienceAgentId(null);
      setActiveTab('employees');
    }
  }, [agent?.id, agent?.status, setExperienceAgentId, setActiveTab, showToast]);

  useEffect(() => {
    if (!agent) return;
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    if (typeTimerRef.current) {
      window.clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }
    pendingReplyRef.current = null;
    setMsgs([]);
    setInput('');
    setSpinning(false);
    setCompletedTurnIds(new Set());
    setOrderPicked(false);
    setCapabilityTurnId(null);
    setCapabilityRunning(false);
    setDemoCursor(0);
    setDemoPhase('idle');
    setOrderClickPulse(false);
    setOrderPointerOn(false);
    setOrderPointerSettled(false);
    setDemoAutoplay(false);
  }, [agent?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, spinning, capabilityRunning]);

  useEffect(() => {
    if (!orderPointerOn) {
      setOrderPointerSettled(false);
      return;
    }
    orderCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const id = window.setTimeout(() => setOrderPointerSettled(true), 40);
    return () => window.clearTimeout(id);
  }, [orderPointerOn]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
      if (typeTimerRef.current) window.clearTimeout(typeTimerRef.current);
    };
  }, []);

  const handleBack = () => {
    setExperienceAgentId(null);
    setActiveTab('employees');
  };

  const scheduleAgentReply = (
    agentText: string,
    thinkMs: number,
    extras?: { offerOrder?: boolean; turnId?: string },
    opts?: { fast?: boolean },
  ) => {
    const fast = Boolean(opts?.fast);
    const gapMs = fast ? 0 : DEMO_GAP_MS;

    // 串行节奏：左侧不在能力演示期间显示打字点，避免左右双焦点同时跳动
    setSpinning(false);
    setDemoPhase('waiting');
    pendingReplyRef.current = {
      text: agentText,
      turnId: extras?.turnId,
      offerOrder: extras?.offerOrder,
    };
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);

    const deliverReply = () => {
      setMsgs((prev) => [
        ...prev,
        {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: agentText,
          time: nowTime(),
          offerOrder: extras?.offerOrder,
        },
      ]);
      if (extras?.turnId) {
        setCompletedTurnIds((prev) => new Set(prev).add(extras.turnId!));
      }
      pendingReplyRef.current = null;
      setCapabilityRunning(false);
      setSpinning(false);

      if (gapMs <= 0) {
        setDemoPhase('idle');
        replyTimerRef.current = null;
        return;
      }
      // 能力演示结束 → 左侧出回复 → 再留白 2s 进入下一幕
      replyTimerRef.current = window.setTimeout(() => {
        setDemoPhase('idle');
        replyTimerRef.current = null;
      }, gapMs);
    };

    const startCapability = () => {
      if (extras?.turnId) {
        setCapabilityTurnId(extras.turnId);
        setCapabilityRunning(true);
      }
      replyTimerRef.current = window.setTimeout(deliverReply, thinkMs);
    };

    // 用户发送后先留白，再仅启动右侧能力演示；演示结束后再落左侧回复
    if (gapMs <= 0) {
      startCapability();
    } else {
      replyTimerRef.current = window.setTimeout(startCapability, gapMs);
    }
  };

  const flushPendingAgentReply = () => {
    const pending = pendingReplyRef.current;
    if (!pending) {
      setSpinning(false);
      setCapabilityRunning(false);
      setDemoPhase('idle');
      return;
    }
    setMsgs((prev) => [
      ...prev,
      {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: pending.text,
        time: nowTime(),
        offerOrder: pending.offerOrder,
      },
    ]);
    if (pending.turnId) {
      setCompletedTurnIds((prev) => new Set(prev).add(pending.turnId!));
      setCapabilityTurnId(pending.turnId);
    }
    pendingReplyRef.current = null;
    setCapabilityRunning(false);
    setSpinning(false);
    setDemoPhase('idle');
  };

  /** 立刻落盘一轮对话（用户+员工），用于快进时避免定时器互相覆盖 */
  const commitTurnInstant = (userText: string, turn: FoodSafetyDemoTurn) => {
    if (completedTurnIds.has(turn.id)) return;
    clearDemoTimers();
    pendingReplyRef.current = null;
    const nextMsgs: ChatMsg[] = [];
    if (!turn.agentOnly) {
      nextMsgs.push({ id: `user_${Date.now()}`, sender: 'user', text: userText, time: nowTime() });
    }
    nextMsgs.push({
      id: `agent_${Date.now() + 1}`,
      sender: 'agent',
      text: turn.agent,
      time: nowTime(),
      offerOrder: turn.offerOrder,
    });
    setMsgs((prev) => [...prev, ...nextMsgs]);
    setCompletedTurnIds((prev) => new Set(prev).add(turn.id));
    setCapabilityTurnId(turn.id);
    setCapabilityRunning(false);
    setSpinning(false);
    setInput('');
  };

  const pushTurnReply = (
    userText: string,
    turn: FoodSafetyDemoTurn | null,
    opts?: { fast?: boolean; force?: boolean },
  ) => {
    if (!agent) return;
    if (spinning && !opts?.force) return;

    if (turn?.agentOnly) {
      setInput('');
      const thinkMs = opts?.fast ? DEMO_FAST_THINK_MS : turn.thinkMs;
      scheduleAgentReply(
        turn.agent,
        thinkMs,
        {
          offerOrder: turn.offerOrder,
          turnId: turn.id,
        },
        { fast: opts?.fast },
      );
      return;
    }

    setMsgs((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, sender: 'user', text: userText, time: nowTime() },
    ]);
    setInput('');

    if (turn) {
      const thinkMs = opts?.fast ? DEMO_FAST_THINK_MS : turn.thinkMs;
      scheduleAgentReply(
        turn.agent,
        thinkMs,
        {
          offerOrder: turn.offerOrder,
          turnId: turn.id,
        },
        { fast: opts?.fast },
      );
      return;
    }

    const fallback = mockAgentChatReply(userText, agent);
    const thinkMs = opts?.fast
      ? DEMO_FAST_THINK_MS
      : Math.min(2200, Math.max(900, 600 + fallback.length * 18));
    scheduleAgentReply(fallback, thinkMs, undefined, { fast: opts?.fast });
  };

  const sendMessage = () => {
    if (!agent || !input.trim() || spinning) return;
    const userText = input.trim();
    const turn = matchFoodSafetyDemoTurn(userText, completedTurnIds);
    pushTurnReply(userText, turn);
  };

  const handleSelectOrder = () => {
    if (!agent || spinning || orderPicked) return;
    const turn = getFoodSafetyOrderSelectTurn();
    if (completedTurnIds.has(turn.id)) return;
    setOrderPicked(true);
    const label = `已选择订单：${FOOD_SAFETY_DEMO_ORDER.product}（${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}）`;
    pushTurnReply(label, turn);
  };

  const resetDemoSession = () => {
    clearDemoTimers();
    pendingReplyRef.current = null;
    setMsgs([]);
    setInput('');
    setSpinning(false);
    setCompletedTurnIds(new Set());
    setOrderPicked(false);
    setCapabilityTurnId(null);
    setCapabilityRunning(false);
    setDemoCursor(0);
    setDemoPhase('idle');
    setOrderClickPulse(false);
    setOrderPointerOn(false);
    setOrderPointerSettled(false);
  };

  /** 收束当前进行中的打字 / 点击 / 回复 / 成效，返回应收束后的 cursor */
  const settleCurrentDemoStep = (): number => {
    clearDemoTimers();
    setOrderPointerOn(false);
    setOrderClickPulse(false);
    setOrderPointerSettled(false);
    setInput('');

    let nextCursor = demoCursor;

    if (demoPhase === 'typing') {
      const turn = FOOD_SAFETY_DEMO_TURNS[demoCursor];
      if (turn && !turn.isOrderSelect) {
        commitTurnInstant(turn.user, turn);
        nextCursor = demoCursor + 1;
      }
      setDemoCursor(nextCursor);
      setDemoPhase('idle');
      return nextCursor;
    }

    if (demoPhase === 'clicking') {
      const turn = FOOD_SAFETY_DEMO_TURNS[demoCursor];
      if (turn?.isOrderSelect) {
        if (!orderPicked) setOrderPicked(true);
        const label = `已选择订单：${FOOD_SAFETY_DEMO_ORDER.product}（${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}）`;
        commitTurnInstant(label, turn);
        nextCursor = demoCursor + 1;
      }
      setDemoCursor(nextCursor);
      setDemoPhase('idle');
      return nextCursor;
    }

    if (spinning || pendingReplyRef.current) {
      flushPendingAgentReply();
      setDemoPhase('idle');
      return demoCursor;
    }

    if (capabilityRunning && demoCursor >= FOOD_SAFETY_DEMO_TURNS.length) {
      setCapabilityRunning(false);
      setDemoPhase('idle');
      return demoCursor;
    }

    setCapabilityRunning(false);
    setDemoPhase('idle');
    return demoCursor;
  };

  const playDemoStepAt = (cursor: number, opts?: { fast?: boolean }) => {
    if (!agent) return;
    const fast = Boolean(opts?.fast);

    if (cursor >= FOOD_SAFETY_DEMO_STEP_COUNT) {
      setDemoCursor(cursor);
      setDemoPhase('idle');
      return;
    }

    setDemoCursor(cursor);

    const turn = FOOD_SAFETY_DEMO_TURNS[cursor];

    if (turn.isOrderSelect) {
      if (fast) {
        if (!completedTurnIds.has(turn.id)) {
          if (!orderPicked) setOrderPicked(true);
          const label = `已选择订单：${FOOD_SAFETY_DEMO_ORDER.product}（${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}）`;
          commitTurnInstant(label, turn);
        }
        setCapabilityTurnId(turn.id);
        setCapabilityRunning(true);
        typeTimerRef.current = window.setTimeout(() => {
          setCapabilityRunning(false);
          setDemoCursor(cursor + 1);
          setDemoPhase('idle');
          typeTimerRef.current = null;
        }, DEMO_FAST_THINK_MS);
        setDemoPhase('waiting');
        return;
      }
      setDemoPhase('clicking');
      setOrderPointerOn(true);
      typeTimerRef.current = window.setTimeout(() => {
        setOrderClickPulse(true);
        typeTimerRef.current = window.setTimeout(() => {
          setOrderPointerOn(false);
          setOrderClickPulse(false);
          setOrderPointerSettled(false);
          if (!orderPicked) {
            setOrderPicked(true);
            const label = `已选择订单：${FOOD_SAFETY_DEMO_ORDER.product}（${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}）`;
            pushTurnReply(label, turn);
          }
          setDemoCursor((c) => c + 1);
          setDemoPhase('waiting');
        }, 480);
      }, 1100);
      return;
    }

    if (turn.agentOnly) {
      if (fast) {
        if (!completedTurnIds.has(turn.id)) {
          commitTurnInstant('', turn);
        }
        setCapabilityTurnId(turn.id);
        setCapabilityRunning(true);
        typeTimerRef.current = window.setTimeout(() => {
          setCapabilityRunning(false);
          setDemoCursor(cursor + 1);
          setDemoPhase('idle');
          typeTimerRef.current = null;
        }, DEMO_FAST_THINK_MS);
        setDemoPhase('waiting');
        return;
      }
      setDemoPhase('waiting');
      pushTurnReply('', turn);
      setDemoCursor((c) => c + 1);
      return;
    }

    const text = turn.user;

    if (fast) {
      if (!completedTurnIds.has(turn.id)) {
        commitTurnInstant(text, turn);
      }
      setCapabilityTurnId(turn.id);
      setCapabilityRunning(true);
      typeTimerRef.current = window.setTimeout(() => {
        setCapabilityRunning(false);
        setDemoCursor(cursor + 1);
        setDemoPhase('idle');
        typeTimerRef.current = null;
      }, DEMO_FAST_THINK_MS);
      setDemoPhase('waiting');
      return;
    }

    setDemoPhase('typing');
    setInput('');
    let i = 0;

    const finishAndSend = () => {
      setInput('');
      pushTurnReply(text, turn);
      setDemoCursor((c) => c + 1);
      setDemoPhase('waiting');
    };

    const tick = () => {
      i += 1;
      setInput(text.slice(0, i));
      if (i >= text.length) {
        typeTimerRef.current = window.setTimeout(finishAndSend, 520);
        return;
      }
      typeTimerRef.current = window.setTimeout(tick, 82 + Math.floor(Math.random() * 40));
    };
    tick();
  };

  const rebuildDemoToCursor = (targetCursor: number) => {
    clearDemoTimers();
    pendingReplyRef.current = null;
    setSpinning(false);
    setCapabilityRunning(false);
    setDemoPhase('idle');
    setInput('');
    setOrderClickPulse(false);
    setOrderPointerOn(false);
    setOrderPointerSettled(false);

    const capped = Math.max(0, Math.min(targetCursor, FOOD_SAFETY_DEMO_STEP_COUNT));
    setDemoCursor(capped);

    const dialogueDone = Math.min(capped, FOOD_SAFETY_DEMO_TURNS.length);
    const nextMsgs: ChatMsg[] = [];
    const nextIds = new Set<string>();
    let picked = false;

    for (let i = 0; i < dialogueDone; i += 1) {
      const turn = FOOD_SAFETY_DEMO_TURNS[i];
      if (!turn.agentOnly) {
        const userText = turn.isOrderSelect
          ? `已选择订单：${FOOD_SAFETY_DEMO_ORDER.product}（${FOOD_SAFETY_DEMO_ORDER.orderNoMasked}）`
          : turn.user;
        if (turn.isOrderSelect) picked = true;
        nextMsgs.push({
          id: `user_back_${i}`,
          sender: 'user',
          text: userText,
          time: nowTime(),
        });
      }
      nextMsgs.push({
        id: `agent_back_${i}`,
        sender: 'agent',
        text: turn.agent,
        time: nowTime(),
        offerOrder: turn.offerOrder,
      });
      nextIds.add(turn.id);
    }

    setMsgs(nextMsgs);
    setCompletedTurnIds(nextIds);
    setOrderPicked(picked);

    if (capped <= 0) {
      setCapabilityTurnId(null);
      return;
    }

    setCapabilityTurnId(FOOD_SAFETY_DEMO_TURNS[capped - 1].id);
  };

  const handlePreviousStep = () => {
    if (!agent || introPhase !== 'done') return;
    if (demoCursor <= 0 && demoPhase === 'idle' && !spinning && !capabilityRunning) return;
    setDemoAutoplay(false);
    rebuildDemoToCursor(demoCursor - 1);
  };

  const handleDemoControlClick = () => {
    if (!agent || introPhase !== 'done') return;
    setDemoAutoplay(false);
    if (demoCursor >= FOOD_SAFETY_DEMO_STEP_COUNT) {
      resetDemoSession();
      return;
    }

    const busy =
      demoPhase !== 'idle' || spinning || capabilityRunning || Boolean(pendingReplyRef.current);

    if (busy) {
      // 再点一次：跳过当前动画并收束，等下一次点击再进下一幕
      settleCurrentDemoStep();
      return;
    }

    // 首次点击：按正常节奏播放（打字机 + 完整思考 / TRACE）
    playDemoStepAt(demoCursor, { fast: false });
  };

  const demoFinished = demoCursor >= FOOD_SAFETY_DEMO_STEP_COUNT;
  const demoBusy =
    demoPhase !== 'idle' || spinning || capabilityRunning || Boolean(pendingReplyRef.current);
  const canGoPrevious =
    introPhase === 'done' &&
    (demoCursor > 0 || demoPhase !== 'idle' || spinning || capabilityRunning);
  const demoButtonLabel = demoFinished
    ? '重新开始'
    : demoBusy
      ? '跳过'
      : `下一步 ${demoCursor + 1}/${FOOD_SAFETY_DEMO_STEP_COUNT}`;
  const introActive = introPhase !== 'done';

  playDemoStepAtRef.current = playDemoStepAt;

  useEffect(() => {
    if (autoPlayTimerRef.current) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (!demoAutoplay || introActive || !agent) return;
    if (demoCursor >= FOOD_SAFETY_DEMO_STEP_COUNT) {
      setDemoAutoplay(false);
      return;
    }
    if (demoBusy) return;

    autoPlayTimerRef.current = window.setTimeout(() => {
      autoPlayTimerRef.current = null;
      playDemoStepAtRef.current(demoCursor, { fast: false });
    }, AUTOPLAY_STEP_DELAY_MS);

    return () => {
      if (autoPlayTimerRef.current) {
        window.clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [
    demoAutoplay,
    introActive,
    agent,
    demoCursor,
    demoBusy,
    demoFinished,
  ]);

  const handleToggleAutoplay = () => {
    if (!agent || introActive) return;
    if (demoAutoplay) {
      setDemoAutoplay(false);
      return;
    }
    if (demoFinished) {
      resetDemoSession();
    }
    setDemoAutoplay(true);
  };

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-100 text-neutral-500 text-xs/relaxed">
        <button type="button" onClick={handleBack} className={BTN_OUTLINE}>
          返回我的数字员工
        </button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden text-neutral-800 bg-white">
      <div className="shrink-0 flex items-center justify-between gap-3 px-16 pt-4 pb-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-white/80 border border-neutral-200/80 text-[13px] text-neutral-700 hover:bg-white shadow-sm transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          返回
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={!canGoPrevious}
            className={cn(
              'h-8 px-3 text-[12px] rounded-lg border border-neutral-200/90 bg-white/90 text-neutral-700 font-medium hover:bg-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_0_rgba(0,0,0,0.04)]',
            )}
            title="回到上一幕"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={handleToggleAutoplay}
            disabled={introActive}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 text-[12px] rounded-lg border font-medium transition cursor-pointer shadow-[0_1px_0_rgba(0,0,0,0.04)]',
              demoAutoplay
                ? 'border-[#1565BF]/35 bg-[rgba(21,101,191,0.08)] text-[#1565BF] hover:bg-[rgba(21,101,191,0.12)]'
                : 'border-neutral-200/90 bg-white/90 text-neutral-700 hover:bg-white',
              introActive && 'opacity-40 cursor-not-allowed',
            )}
            title={demoAutoplay ? '暂停自动播放' : '自动播放演示'}
          >
            {demoAutoplay ? <Pause size={14} /> : <Play size={14} />}
            {demoAutoplay ? '暂停' : '播放'}
          </button>
          <button
            type="button"
            onClick={handleDemoControlClick}
            disabled={introActive}
            className={cn(
              SKILL_AOP_PRIMARY_BTN,
              'h-8 px-3 text-[12px] shadow-[0_1px_0_rgba(0,0,0,0.05)]',
              introActive && 'opacity-40 cursor-not-allowed',
            )}
            title={
              introActive
                ? '开场介绍中'
                : demoFinished
                  ? '清空对话并重头演示'
                  : demoBusy
                    ? '跳过当前动画，收束本幕'
                    : `播放第 ${demoCursor + 1} 幕（正常节奏）`
            }
          >
            {demoButtonLabel}
          </button>
        </div>
      </div>

      {/* 内容区：开场全屏文案 → 左右分栏 */}
      <div
        className="flex-1 min-h-0 overflow-hidden bg-[#F5FAFF] bg-no-repeat bg-top bg-cover"
        style={{ backgroundImage: "url('/assets/customer-experience-bg.png')" }}
      >
        {introActive ? (
          <div
            className={cn(
              'h-full flex items-center justify-center px-16 pb-8 transition-opacity duration-500',
              introPhase === 'fade' ? 'opacity-0' : 'opacity-100',
            )}
          >
            <p className="food-safety-hero-caption text-[36px] sm:text-[48px] leading-none tracking-[-0.02em] select-text whitespace-nowrap">
              <span className="food-safety-hero-caption-accent">京小灵</span>
              <span className="food-safety-hero-caption-plain">客服数字员工</span>
            </p>
          </div>
        ) : (
          <div className="h-full min-h-0 grid grid-cols-[340px_minmax(0,1fr)] gap-8 px-16 pb-8 overflow-hidden animate-in fade-in duration-500">
            {/* 左侧：手机固定宽高位 */}
            <div className="min-h-0 w-[340px] flex items-center justify-center overflow-hidden">
              <div
                className={cn(
                  'relative w-[320px] h-[min(700px,100%)] shrink-0',
                  'rounded-[48px] bg-[#1c1c1e] p-[10px]',
                )}
              >
            <div className="absolute -left-[2px] top-[118px] h-[28px] w-[3px] rounded-l-sm bg-[#2c2c2e]" aria-hidden />
            <div className="absolute -left-[2px] top-[168px] h-[52px] w-[3px] rounded-l-sm bg-[#2c2c2e]" aria-hidden />
            <div className="absolute -left-[2px] top-[230px] h-[52px] w-[3px] rounded-l-sm bg-[#2c2c2e]" aria-hidden />
            <div className="absolute -right-[2px] top-[190px] h-[90px] w-[3px] rounded-r-sm bg-[#2c2c2e]" aria-hidden />

            <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[40px] bg-white">
              <IPhoneStatusBar clock={clock} />

              <header className="shrink-0 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md px-3 pb-2.5 pt-0.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ExperienceAgentAvatar />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-[15px] font-semibold text-neutral-900 tracking-tight truncate leading-tight">
                      {agent.name}
                    </h1>
                    <p className="text-[11px] text-neutral-500 truncate">在线 · 数字员工</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar min-h-0 bg-white">
                <ContentBusy busy={paneBusy} size="slot" minHeight={120}>
                  <div className="flex justify-start gap-2 items-start">
                    <ExperienceAgentAvatar />
                    <div className={cn(AGENT_CHAT_BUBBLE, 'max-w-[78%]')}>{openingLine}</div>
                  </div>

                  {msgs.map((m) => {
                    if (m.sender === 'user') {
                      return (
                        <div key={m.id} className="flex justify-end">
                          <div className={cn(USER_CHAT_BUBBLE, 'max-w-[78%]')}>{m.text}</div>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className="space-y-2.5">
                        <div className="flex justify-start gap-2 items-start">
                          <ExperienceAgentAvatar />
                          <div className={cn(AGENT_CHAT_BUBBLE, 'max-w-[78%]')}>{m.text}</div>
                        </div>

                        {m.offerOrder && !orderPicked && (
                          <div ref={orderCardRef} className="pl-9 max-w-[88%] relative">
                            <button
                              type="button"
                              onClick={handleSelectOrder}
                              disabled={spinning || demoPhase === 'clicking'}
                              className={cn(
                                PANEL,
                                'relative w-full text-left px-3 py-2.5 rounded-[13px] hover:border-neutral-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white',
                                orderClickPulse &&
                                  'scale-[0.97] border-[#1565BF] ring-2 ring-[rgba(21,101,191,0.35)] bg-[rgba(21,101,191,0.06)]',
                                orderPointerOn && !orderClickPulse && 'border-neutral-300 shadow-md',
                              )}
                            >
                              <p className="text-[11px] font-semibold text-[#1565BF]">选择订单</p>
                              <p className="mt-1 text-[14px] font-medium text-neutral-900">
                                {FOOD_SAFETY_DEMO_ORDER.product}
                              </p>
                              <p className="mt-0.5 text-[11px] text-neutral-500 tabular-nums">
                                {FOOD_SAFETY_DEMO_ORDER.orderNoMasked} ·{' '}
                                {FOOD_SAFETY_DEMO_ORDER.status} · 应付 {FOOD_SAFETY_DEMO_ORDER.amount}
                              </p>
                            </button>
                            {orderPointerOn ? (
                              <div
                                className={cn(
                                  'pointer-events-none absolute z-20 transition-all duration-[700ms] ease-out',
                                  !orderPointerSettled &&
                                    'right-[-6px] -bottom-5 translate-x-3 translate-y-4 opacity-0 scale-110',
                                  orderPointerSettled &&
                                    !orderClickPulse &&
                                    'right-3 bottom-2 translate-x-0 translate-y-0 opacity-100 scale-100',
                                  orderClickPulse &&
                                    'right-7 bottom-4 translate-x-0 translate-y-0 opacity-100 scale-90',
                                )}
                                aria-hidden
                              >
                                <MousePointer2
                                  size={22}
                                  className="text-neutral-900 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                                  strokeWidth={2.25}
                                />
                                {orderClickPulse ? (
                                  <span className="absolute left-0.5 top-0.5 w-4 h-4 -translate-x-1 -translate-y-1 rounded-full border-2 border-[#1565BF] animate-ping opacity-70" />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {spinning ? <TypingDots /> : null}
                </ContentBusy>
                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/70 px-2.5 pt-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 min-w-0 rounded-[20px] bg-neutral-100 px-3.5 py-2.5">
                    <textarea
                      ref={composerRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onInput={resizeComposer}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!spinning && input.trim()) sendMessage();
                        }
                      }}
                      disabled={spinning}
                      placeholder="发消息…（Shift+回车换行）"
                      className="w-full min-h-[20px] max-h-[120px] bg-transparent text-[15px] leading-[20px] outline-none resize-none overflow-y-auto placeholder:text-neutral-400 text-neutral-900 disabled:opacity-60 break-words whitespace-pre-wrap"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={spinning || !input.trim()}
                    onClick={sendMessage}
                    className={cn(SKILL_AOP_SEND_BTN, 'rounded-full w-9 h-9 mb-0.5')}
                    title="发送"
                    aria-label="发送"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
                <div className="mx-auto mt-2.5 h-[5px] w-[120px] rounded-full bg-black/80" aria-hidden />
              </div>
            </div>
          </div>
        </div>

            {/* 右侧：能力演示 — 高度与左侧手机黑框对齐 */}
            <div className="min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
              <div className="h-[min(700px,100%)] w-full min-h-0 overflow-hidden">
                <FoodSafetyCapabilityPanel
                  activeTurnId={capabilityTurnId}
                  running={capabilityRunning}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
