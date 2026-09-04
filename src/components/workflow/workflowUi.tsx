import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { WorkflowNodeType } from './workflowTypes';

import flowNodeStartIcon from './assets/flow_node_start.png';
import flowNodeEndIcon from './assets/flow_node_end.png';
import flowNodeLlmIcon from './assets/flow_node_llm.png';
import flowNodeKnowledgeIcon from './assets/flow_node_knowledge.png';
import flowNodeAgentIcon from './assets/flow_node_agent.png';
import flowNodeIntentIcon from './assets/flow_node_intent.png';
import flowNodeConditionIcon from './assets/flow_node_condition.png';
import flowNodeAggregateIcon from './assets/flow_node_aggregate_policy.png';
import flowNodeVarUpdateIcon from './assets/flow_node_var_connection.png';
import flowNodeInteractionIcon from './assets/flow_node_interaction.png';
import flowNodePluginIcon from './assets/flow_node_plugin.png';

const NODE_ICON_SRC: Record<WorkflowNodeType, string> = {
  开始: flowNodeStartIcon,
  结束: flowNodeEndIcon,
  LLM: flowNodeLlmIcon,
  知识检索: flowNodeKnowledgeIcon,
  Agent: flowNodeAgentIcon,
  意图识别: flowNodeIntentIcon,
  条件分支: flowNodeConditionIcon,
  变量聚合: flowNodeAggregateIcon,
  变量更新: flowNodeVarUpdateIcon,
  交互澄清: flowNodeInteractionIcon,
  插件工具: flowNodePluginIcon,
};

type WorkflowNodeIconProps = {
  type: WorkflowNodeType;
  className?: string;
};

/** 官方节点图标（自带底色圆角方块） */
export function WorkflowNodeIcon({ type, className }: WorkflowNodeIconProps) {
  const src = NODE_ICON_SRC[type];
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={cn('w-7 h-7 rounded object-contain shrink-0 select-none', className)}
    />
  );
}

type TooltipButtonProps = {
  children: React.ReactNode;
  text: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  placement?: 'top' | 'bottom';
  className?: string;
};

export function TooltipButton({
  children,
  text,
  disabled = false,
  onClick,
  onMouseDown,
  placement = 'top',
  className,
}: TooltipButtonProps) {
  const isTop = placement === 'top';
  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        onMouseDown={onMouseDown}
        disabled={disabled}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          className,
        )}
      >
        {children}
      </button>
      <div
        className={cn(
          'absolute hidden group-hover:flex flex-col items-center z-50 whitespace-nowrap pointer-events-none',
          isTop ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        <div className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">{text}</div>
      </div>
    </div>
  );
}

export function InfoTooltip({ text }: { text: string }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  return (
    <span
      className="relative inline-flex items-center mx-1 align-middle"
      onMouseEnter={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setAnchor(null)}
      onFocus={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onBlur={() => setAnchor(null)}
    >
      <svg
        className="w-3.5 h-3.5 text-gray-400 hover:text-gray-500 cursor-help"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {anchor
        ? createPortal(
            (() => {
              const tipWidth = 240;
              const showBelow = anchor.top < 72;
              const left = Math.min(
                Math.max(tipWidth / 2 + 8, anchor.left + anchor.width / 2),
                window.innerWidth - tipWidth / 2 - 8,
              );
              return (
                <span
                  role="tooltip"
                  className="pointer-events-none fixed z-[300] w-max max-w-[240px] rounded-md bg-neutral-800 px-2 py-1.5 text-[11px] leading-4 text-white shadow-lg"
                  style={{
                    top: showBelow ? anchor.bottom + 6 : anchor.top - 6,
                    left,
                    transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
                  }}
                >
                  {text}
                </span>
              );
            })(),
            document.body,
          )
        : null}
    </span>
  );
}
