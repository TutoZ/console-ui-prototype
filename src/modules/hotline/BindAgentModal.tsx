/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 更换绑定智能体 / 绑定智能体弹窗（对齐设计图 Image 2）
 */

import React, { useState, useEffect } from 'react';
import { Phone, X } from '@/lib/icons';
import { HotlinePhoneNumberItem, VoiceAgentOption } from './numberManagementTypes';
import { VOICE_AGENT_OPTIONS } from './numberManagementMockData';

interface BindAgentModalProps {
  open: boolean;
  onClose: () => void;
  targetItems: HotlinePhoneNumberItem[];
  onConfirm: (itemIds: string[], agentName: string | null, remark?: string) => void;
  availableAgents?: VoiceAgentOption[];
}

export const BindAgentModal: React.FC<BindAgentModalProps> = ({
  open,
  onClose,
  targetItems,
  onConfirm,
  availableAgents = VOICE_AGENT_OPTIONS,
}) => {
  const isBatch = targetItems.length > 1;
  const singleItem = targetItems[0];
  const isCurrentlyBound = Boolean(singleItem?.boundAgent);

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [remarkInput, setRemarkInput] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (!isBatch && singleItem) {
        setSelectedAgent(singleItem.boundAgent || '');
        setRemarkInput(singleItem.remark || '');
      } else {
        setSelectedAgent('');
        setRemarkInput('');
      }
    }
  }, [open, isBatch, singleItem]);

  if (!open || targetItems.length === 0) return null;

  const handleConfirm = () => {
    const agentValue = selectedAgent.trim() === '' ? null : selectedAgent;
    const ids = targetItems.map((item) => item.id);
    onConfirm(ids, agentValue, !isBatch ? remarkInput : undefined);
    onClose();
  };

  const titleText = isBatch
    ? '批量绑定智能体'
    : isCurrentlyBound
    ? '更换绑定智能体'
    : '绑定智能体';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-base">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600">
              <Phone size={16} />
            </span>
            <span>{titleText}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-4">
          {/* 当前号码 */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              {isBatch ? '已选号码' : '当前号码'}
            </label>
            {isBatch ? (
              <div className="w-full min-h-[42px] max-h-24 overflow-y-auto px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 leading-relaxed font-mono">
                {targetItems.map((item) => item.phoneNumber).join(', ')}
                <span className="ml-1.5 text-neutral-400 font-sans">
                  (共 {targetItems.length} 个)
                </span>
              </div>
            ) : (
              <input
                type="text"
                disabled
                value={singleItem.phoneNumber}
                className="w-full h-10 px-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 font-mono select-all disabled:opacity-90 cursor-not-allowed"
              />
            )}
          </div>

          {/* 目标语音智能体 */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              <span className="text-red-500 mr-1">*</span>
              目标语音智能体
            </label>
            <div className="relative">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full h-10 px-3.5 pr-9 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
              >
                <option value="">-- 未绑定智能体 (不选择) --</option>
                {availableAgents.map((ag) => (
                  <option key={ag.id} value={ag.name}>
                    {ag.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              选择后，该号码的所有呼入将直接接入所选语音智能体。若选择“未绑定智能体”，则解除绑定。
            </p>
          </div>

          {/* 备注（单选时支持同时修改备注） */}
          {!isBatch && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                线路备注
              </label>
              <input
                type="text"
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                placeholder="请输入线路备注（如：华东配送热线、售后专线等）"
                className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-neutral-400"
              />
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50/70 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
