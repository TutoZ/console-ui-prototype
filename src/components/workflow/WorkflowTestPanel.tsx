import React from 'react';
import {
  CheckCircle,
  Clock,
  Copy,
  Image,
  RefreshCw,
  Send,
  X,
  Zap,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import type {
  ChatMessage,
  ExecutionLog,
  LogKeyValue,
  TestPhase,
} from './workflowTypes';
import { WorkflowNodeIcon } from './workflowUi';

function StructuredJsonView({ dataArray }: { dataArray: LogKeyValue[] }) {
  if (!dataArray || dataArray.length === 0) {
    return <div className="text-gray-400 text-xs py-2">无数据</div>;
  }
  return (
    <div className="relative bg-[#fafafa] border border-gray-200 rounded-lg py-4 pl-4 pr-16 font-mono text-[13px] shadow-sm overflow-x-auto">
      <button
        type="button"
        className="absolute top-2 right-2 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-colors"
      >
        <Copy className="w-3 h-3" /> Copy
      </button>
      <div className="text-[#06b6d4]">[</div>
      {dataArray.map((item, i) => (
        <div key={i}>
          <div className="pl-4 text-[#06b6d4]">{'{'}</div>
          <div className="pl-8 flex whitespace-nowrap">
            <span className="text-[#06b6d4]">&quot;value&quot;</span>
            <span className="text-[#06b6d4] mr-2">:</span>
            <span className={typeof item.value === 'number' ? 'text-[#ef4444]' : 'text-[#f97316]'}>
              {typeof item.value === 'number' ? item.value : `"${item.value}"`}
            </span>
            <span className="text-[#06b6d4]">,</span>
          </div>
          <div className="pl-8 flex whitespace-nowrap">
            <span className="text-[#06b6d4]">&quot;key&quot;</span>
            <span className="text-[#06b6d4] mr-2">:</span>
            <span className="text-[#f97316]">&quot;{item.key}&quot;</span>
          </div>
          <div className="pl-4 text-[#06b6d4]">
            {'}'}
            {i < dataArray.length - 1 ? ',' : ''}
          </div>
        </div>
      ))}
      <div className="text-[#06b6d4]">]</div>
    </div>
  );
}

type WorkflowTestPanelProps = {
  open: boolean;
  phase: TestPhase;
  configInput: string;
  chatMessages: ChatMessage[];
  chatInput: string;
  executionLog: ExecutionLog | null;
  activeLogStepId: string;
  onClose: () => void;
  onConfigInputChange: (v: string) => void;
  onStartTesting: () => void;
  onChatInputChange: (v: string) => void;
  onSendMessage: () => void;
  onResetConfig: () => void;
  onActiveLogStepChange: (id: string) => void;
};

export function WorkflowTestPanel({
  open,
  phase,
  configInput,
  chatMessages,
  chatInput,
  executionLog,
  activeLogStepId,
  onClose,
  onConfigInputChange,
  onStartTesting,
  onChatInputChange,
  onSendMessage,
  onResetConfig,
  onActiveLogStepChange,
}: WorkflowTestPanelProps) {
  if (!open) return null;

  const activeStep = executionLog?.steps.find((s) => s.id === activeLogStepId);

  return (
    <div
      className="absolute right-0 top-14 bottom-0 w-[850px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.1)] border-l border-neutral-200 z-[60] flex flex-col animate-in slide-in-from-right duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-800">试运行</span>
          {phase === 'testing' && (
            <span className="text-sm text-gray-500">
              会话ID: <span className="font-mono text-gray-600">10b58541-232e-4de0...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {phase === 'testing' && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
              onClick={onResetConfig}
            >
              <RefreshCw className="w-3.5 h-3.5" /> 重新配置
            </button>
          )}
          <div className="w-px h-4 bg-gray-200" />
          <button type="button" className="p-1 hover:bg-gray-200 rounded text-gray-500" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {phase === 'config' ? (
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-50/50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-[500px] shadow-sm flex flex-col gap-6 h-fit mt-10">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                <WorkflowNodeIcon type="开始" className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-[15px]">开始节点配置</h3>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-800">
                user_input <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none transition-shadow"
                placeholder="请输入试运行的初始输入文本..."
                value={configInput}
                onChange={(e) => onConfigInputChange(e.target.value)}
              />
              <span className="text-[11px] text-gray-400">作为工作流的初始输入参数参与验证。</span>
            </div>
            <button
              type="button"
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-medium transition-colors mt-2',
                configInput.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              )}
              onClick={onStartTesting}
              disabled={!configInput.trim()}
            >
              开始测试
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[45%] flex flex-col border-r border-gray-100 bg-white">
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {chatMessages.length === 0 ? (
                <div className="m-auto flex flex-col items-center justify-center text-gray-400 gap-2">
                  <span className="text-base text-gray-500">暂无消息</span>
                  <span className="text-xs">发送第一条消息开始聊天</span>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-indigo-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-50 bg-white shrink-0">
              <div className="relative border border-gray-200 rounded-xl bg-gray-50/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm transition-all overflow-hidden flex flex-col">
                <textarea
                  className="w-full h-20 p-3 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400"
                  placeholder="跟员工练几轮，看看上岗准备得怎么样..."
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                />
                <div className="flex items-center justify-between p-2 bg-transparent">
                  <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onSendMessage}
                    className={cn(
                      'p-1.5 rounded-lg flex items-center justify-center transition-colors',
                      chatInput.trim()
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                        : 'bg-gray-200 text-gray-400',
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[55%] flex flex-col bg-[#fbfbfb]">
            <div className="px-4 py-3 text-[13px] font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 shrink-0 bg-white">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 9l3 3-3 3m5 0h3M4 6h16v12H4z"
                />
              </svg>
              工作日志
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {!executionLog ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Zap className="w-12 h-12 text-gray-300" />
                  <span className="text-base text-gray-500 font-medium">暂无执行记录</span>
                  <span className="text-xs">发送消息后开始执行</span>
                </div>
              ) : (
                <div className="flex flex-col animate-in fade-in duration-300">
                  <div className="flex flex-col gap-2 relative pb-6 border-b border-gray-200 mb-6">
                    <div className="absolute left-[20px] top-6 bottom-4 w-px bg-gray-200" />
                    {executionLog.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        onClick={() => onActiveLogStepChange(step.id)}
                        className={cn(
                          'flex items-center gap-3 relative z-10 p-2 rounded-lg cursor-pointer transition-all',
                          idx === 1 ? 'pl-8' : idx === 2 ? 'pl-4' : 'pl-2',
                          activeLogStepId === step.id
                            ? 'bg-indigo-50 ring-1 ring-indigo-200'
                            : 'hover:bg-gray-100',
                        )}
                      >
                        {idx === 1 && <div className="w-4 h-px bg-gray-200 absolute left-3 top-1/2" />}
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          <WorkflowNodeIcon
                            type={
                              step.id === 'start' ? '开始' : step.id === 'end' ? '结束' : 'LLM'
                            }
                            className="w-8 h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-[13px] font-medium',
                              activeLogStepId === step.id ? 'text-indigo-800' : 'text-gray-800',
                            )}
                          >
                            {step.name}
                          </span>
                          {step.subInfo && (
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {step.subInfo}
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {step.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeStep && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-[15px] font-bold text-gray-900">
                          节点详情: {activeStep.name}
                        </span>
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> {activeStep.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-[80px_1fr] gap-y-3 text-[13px]">
                        <div className="text-gray-400">消息ID：</div>
                        <div className="text-gray-800 font-mono">{executionLog.id}</div>
                        <div className="text-gray-400">耗时：</div>
                        <div className="text-gray-800">{activeStep.time}</div>
                        {activeStep.id === 'llm' && (
                          <>
                            <div className="text-gray-400">消耗：</div>
                            <div className="text-gray-800">
                              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[11px]">
                                Token
                              </span>
                            </div>
                          </>
                        )}
                        <div className="text-gray-400">时间：</div>
                        <div className="text-gray-800">2026-08-12 {executionLog.time}</div>
                      </div>

                      <div className="mt-2 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-bold text-[14px] text-gray-900">输入:</span>
                          <StructuredJsonView dataArray={activeStep.details.input} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="font-bold text-[14px] text-gray-900">输出:</span>
                          <StructuredJsonView dataArray={activeStep.details.output} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
