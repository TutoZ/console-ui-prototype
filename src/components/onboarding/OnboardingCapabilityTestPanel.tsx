/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 入职培训 / 孵化共用 — 右侧“预览和调试”对话能力测试
 */

import React, { useState } from 'react';
import { Copy, Send, Trash2 } from '@/lib/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { agentAvatarForEditor } from '@/lib/agentAvatarDisplay';
import { pickMockLatencyMs } from '@/lib/mockLatency';
import { EMPLOYEE_PAGE_COPY, LIFECYCLE_TERMS } from '@/lib/platformTerminology';
import { PROFILE_USER } from '@/lib/profileUser';
import { defaultOpeningLineForAgent } from '@/lib/agentDefaultCopy';
import { cn } from '@/lib/utils';
import { buildAgentReplyPlan, planToThoughtSteps } from '../../lib/agentReplyPlan';
import { mockAgentChatReply } from '../../lib/mockAgentChatReply';
import type { HiredAgent, KnowledgeBase, Skill, ThoughtStep } from '../../types';
import { ExecutionProcessFold } from '../common/ExecutionProcessFold';

type ChatMsg = {
  id?: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  time: string;
  triggerMsgId?: string;
};

type ExecutionState = {
  runId: string;
  steps: ThoughtStep[];
  status: 'running' | 'done';
};

function OnboardChatAgentAvatar({
  agent,
  relayAvatarIndex,
  className,
}: {
  agent: HiredAgent;
  relayAvatarIndex: number;
  className?: string;
}) {
  const display = agentAvatarForEditor(agent.avatar, relayAvatarIndex, agent.avatarCustomized);

  return (
    <Avatar className={cn('h-8 w-8 shrink-0 overflow-hidden', className)}>
      {display.kind === 'image' ? (
        <>
          <AvatarImage src={display.src} alt="" />
          <AvatarFallback className="bg-neutral-100" />
        </>
      ) : (
        <AvatarFallback className="bg-neutral-800 text-white text-sm select-none">
          {display.emoji}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

const ONBOARD_CHAT_BUBBLE =
  'px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs leading-relaxed text-neutral-800';

function createHexId(length = 32): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export type OnboardingCapabilityTestPanelProps = {
  agent: HiredAgent;
  relayAvatarIndex?: number;
  knowledgeBases: KnowledgeBase[];
  skills: Skill[];
  showToast: (message: string) => void;
  /** 锁定输入（需先保存 / 预览模式等） */
  locked?: boolean;
  lockPlaceholder?: string;
  lockToast?: string;
  /** 顶栏标题，默认“能力测试”；孵化侧可传“预览和调试” */
  title?: string;
  /** 顶部提示条（如“请先保存”） */
  hintBanner?: React.ReactNode;
  className?: string;
  /** 是否显示顶栏工具（会话 ID / 重置）；默认 true */
  showToolbar?: boolean;
  /** 顶栏左侧（默认显示 title 文案；传入后可替换为 Tab 等） */
  headerLeft?: React.ReactNode;
  /** 隐藏整条顶栏（由外层自行提供 Tab / 工具） */
  hideChrome?: boolean;
};

export function OnboardingCapabilityTestPanel({
  agent,
  relayAvatarIndex = 0,
  knowledgeBases,
  skills,
  showToast,
  locked = false,
  lockPlaceholder,
  lockToast,
  title = LIFECYCLE_TERMS.onboardTest,
  hintBanner,
  className,
  showToolbar = true,
  headerLeft,
  hideChrome = false,
}: OnboardingCapabilityTestPanelProps) {
  const [sessionId, setSessionId] = useState(() => createHexId());
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [executions, setExecutions] = useState<Record<string, ExecutionState>>({});
  const [chatInput, setChatInput] = useState('');
  const [spinning, setSpinning] = useState(false);

  const handleSend = (textToSend?: string) => {
    if (locked) {
      showToast(lockToast || `请先完成左侧配置后再进行${title}。`);
      return;
    }
    const rawText = textToSend || chatInput;
    if (!rawText.trim() || spinning) return;

    const msgId = `msg_${Date.now()}`;
    const replyId = `${msgId}_reply`;
    const runId = createHexId();
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setChatMsgs((prev) => [
      ...prev,
      { id: msgId, sender: 'user', text: rawText, time },
      { id: replyId, triggerMsgId: msgId, sender: 'agent', text: '', time },
    ]);
    if (!textToSend) setChatInput('');

    setSpinning(true);
    setExecutions((prev) => ({
      ...prev,
      [msgId]: { runId, steps: [], status: 'running' },
    }));

    const replyMs = pickMockLatencyMs('aiReply');
    const plan = buildAgentReplyPlan(
      agent,
      rawText,
      '测试访客',
      title,
      knowledgeBases,
      skills,
    );
    const allSteps = planToThoughtSteps(plan, msgId, time);
    const processSteps = allSteps.filter((s) => s.type !== 'output');
    const agentText = mockAgentChatReply(rawText, agent);

    const stepInterval = Math.max(280, Math.floor(replyMs / Math.max(processSteps.length + 1, 2)));
    let accumulated = 0;

    processSteps.forEach((step) => {
      accumulated += stepInterval;
      window.setTimeout(() => {
        setExecutions((prev) => {
          const current = prev[msgId];
          if (!current || current.status === 'done') return prev;
          return {
            ...prev,
            [msgId]: { ...current, steps: [...current.steps, step] },
          };
        });
      }, accumulated);
    });

    window.setTimeout(() => {
      const agentTime = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setExecutions((prev) => ({
        ...prev,
        [msgId]: { runId, steps: allSteps, status: 'done' },
      }));
      setChatMsgs((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, text: agentText, time: agentTime } : m)),
      );
      setSpinning(false);
    }, replyMs);
  };

  const resetChat = () => {
    setChatMsgs([
      {
        sender: 'system',
        text: `已重置${title}，清空对话记录。`,
        time: '现在',
      },
    ]);
    setExecutions({});
    setSessionId(createHexId());
  };

  return (
    <div
      data-tour-id="test-panel"
      className={cn(
        'flex flex-col h-full bg-paper overflow-hidden text-neutral-800 text-left',
        className,
      )}
    >
      {!hideChrome ? (
        <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 gap-2 min-h-[54px]">
          {headerLeft ?? (
            <p className="text-[13px] font-semibold text-neutral-900 tracking-tight truncate">
              {title}
            </p>
          )}
          {showToolbar ? (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(sessionId).then(
                    () => showToast('会话 ID 已复制'),
                    () => showToast('复制失败'),
                  );
                }}
                className="text-neutral-500 hover:text-neutral-800 h-7 px-2 text-xs gap-1 cursor-pointer shrink-0"
                title={sessionId}
              >
                <Copy size={12} />
                会话ID复制
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetChat}
                className="text-neutral-500 hover:text-neutral-800 h-7 px-2 text-xs gap-1 cursor-pointer shrink-0"
                title="重置对话"
              >
                <Trash2 size={12} />
                重置对话
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {hintBanner}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0 bg-paper">
        <div className="flex gap-2.5 items-start">
          <OnboardChatAgentAvatar agent={agent} relayAvatarIndex={relayAvatarIndex} />
          <div className="space-y-2 max-w-[85%]">
            <div className={cn(ONBOARD_CHAT_BUBBLE, 'rounded-tl-sm')}>
              {agent.openingLine || defaultOpeningLineForAgent(agent.name)}
            </div>
          </div>
        </div>

        {chatMsgs.map((m, idx) => {
          if (m.sender === 'system') {
            return (
              <div key={m.id ?? idx} className="flex justify-center my-2 select-none">
                <span className="bg-white text-neutral-500 text-[10.5px] px-3.5 py-1.5 rounded-full text-center border border-neutral-200 max-w-sm leading-relaxed block shadow-xs font-mono font-medium">
                  {m.text}
                </span>
              </div>
            );
          }

          const isUser = m.sender === 'user';
          const execution =
            !isUser && m.triggerMsgId ? executions[m.triggerMsgId] : undefined;
          const userQuery = m.triggerMsgId
            ? chatMsgs.find((msg) => msg.id === m.triggerMsgId)?.text
            : undefined;
          const hasReplyText = Boolean(m.text.trim());

          return (
            <div
              key={m.id ?? idx}
              className={cn(
                'flex gap-2.5 items-start py-0.5',
                isUser ? 'justify-end' : 'justify-start',
              )}
            >
              {!isUser ? (
                <OnboardChatAgentAvatar agent={agent} relayAvatarIndex={relayAvatarIndex} />
              ) : null}

              <div
                className={cn(
                  'flex flex-col max-w-[85%] gap-1',
                  isUser ? 'items-end' : 'items-start',
                )}
              >
                {execution ? (
                  <ExecutionProcessFold
                    steps={execution.steps}
                    status={execution.status}
                    userQuery={userQuery}
                    runId={execution.runId}
                    onCopyRunId={(id) => {
                      void navigator.clipboard.writeText(id).then(
                        () => showToast('runId 已复制'),
                        () => showToast('复制失败'),
                      );
                    }}
                  />
                ) : null}

                {hasReplyText ? (
                  <div
                    className={cn(
                      ONBOARD_CHAT_BUBBLE,
                      isUser ? 'rounded-tr-sm' : 'rounded-tl-sm',
                    )}
                  >
                    {m.text}
                  </div>
                ) : null}

                {(hasReplyText || isUser) && (
                  <span className="text-[9px] text-neutral-400 font-mono tracking-wider px-1 font-bold">
                    {m.time}
                  </span>
                )}
              </div>

              {isUser ? (
                <Avatar className="h-8 w-8 rounded-full overflow-hidden after:hidden shrink-0 ring-2 ring-white shadow-sm">
                  <AvatarFallback
                    className={cn(PROFILE_USER.fallbackClass, 'select-none text-[12px]')}
                  >
                    {PROFILE_USER.initial}
                  </AvatarFallback>
                </Avatar>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !spinning && chatInput.trim()) {
                handleSend();
              }
            }}
            disabled={spinning || locked}
            placeholder={
              locked
                ? lockPlaceholder || `请先完成配置后再${title}`
                : EMPLOYEE_PAGE_COPY.testPlaceholder
            }
            className="flex-1 bg-paper border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-xs h-10 rounded-[7px] focus-visible:ring-neutral-400 focus-visible:border-neutral-500"
          />
          <Button
            size="sm"
            disabled={spinning || locked || !chatInput.trim()}
            onClick={() => handleSend()}
            className="bg-neutral-800 hover:opacity-90 text-white font-bold h-10 px-3 rounded-[7px] flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 shadow-sm"
          >
            <Send size={13} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
