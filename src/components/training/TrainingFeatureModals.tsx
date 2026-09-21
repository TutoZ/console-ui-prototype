/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 员工培训页面右侧能力配置弹窗集合（严格对齐设计图）
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Volume2,
  HelpCircle,
  GripVertical,
  Plus,
  Layers,
  Check,
} from '@/lib/icons';

// ==========================================
// 1. 开场白编辑弹窗 (图片 1)
// ==========================================
export interface OpeningModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { content: string; noInterruptSec: number; silenceSec: number }) => void;
  initialContent?: string;
  initialNoInterruptSec?: number;
  initialSilenceSec?: number;
}

export const OpeningModal: React.FC<OpeningModalProps> = ({
  open,
  onClose,
  onSave,
  initialContent = '您好，这里是京东金融客服助理小崔，请问有什么可以帮您',
  initialNoInterruptSec = 5.0,
  initialSilenceSec = 6.0,
}) => {
  const [content, setContent] = useState(initialContent);
  const [noInterruptSec, setNoInterruptSec] = useState(initialNoInterruptSec);
  const [silenceSec, setSilenceSec] = useState(initialSilenceSec);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  if (!open) return null;

  const handleInsertVar = () => {
    setContent((prev) => `${prev}{{客户姓名}}`);
  };

  const handleTogglePlay = () => {
    setIsPlaying((p) => !p);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">开场白编辑</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* 顶部新增变量条件按钮 */}
          <div>
            <button
              type="button"
              onClick={handleInsertVar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 text-xs font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>新增变量条件</span>
            </button>
          </div>

          {/* 默认开场白卡片 */}
          <div className="border border-neutral-200/90 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-neutral-800">默认开场白</span>
              <span className="text-[11px] text-neutral-400">（当以上所有条件均未满足时使用）</span>
            </div>

            {/* 富文本框结构 */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
              {/* 工具条 */}
              <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-500 text-xs">
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="font-serif font-bold text-xs px-1 hover:bg-neutral-100 rounded cursor-pointer">TT</span>
                  <span className="text-xs px-1 hover:bg-neutral-100 rounded cursor-pointer">🎤</span>
                  <span className="text-xs px-1 hover:bg-neutral-100 rounded cursor-pointer">📺</span>
                  <span className="text-xs px-1 hover:bg-neutral-100 rounded cursor-pointer">A</span>
                  <span className="text-xs px-1 hover:bg-neutral-100 rounded cursor-pointer">↔</span>
                </div>
                <button
                  type="button"
                  onClick={handleInsertVar}
                  className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>插入客户变量</span>
                  <Layers size={13} />
                </button>
              </div>

              {/* 文本内容 */}
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 text-xs text-neutral-800 outline-none resize-none leading-relaxed"
                placeholder="请输入开场白文本..."
              />
              <div className="px-3 pb-2 text-right text-[11px] text-neutral-400">
                {content.length}字
              </div>

              {/* 底部音频试听控制条 */}
              <div className="px-3 py-2 bg-neutral-50/70 border-t border-neutral-100 flex items-center gap-4 text-xs text-blue-600">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="inline-flex items-center gap-1 hover:text-blue-700 cursor-pointer font-medium"
                >
                  <Play size={13} className={isPlaying ? 'fill-blue-600' : ''} />
                  <span>{isPlaying ? '播放中...' : '试听'}</span>
                </button>

                <div className="inline-flex items-center gap-1 hover:text-blue-700 cursor-pointer font-medium">
                  <RotateCcw size={12} />
                  <span>X1</span>
                </div>

                <div className="flex items-center gap-2 text-neutral-400">
                  <Volume2 size={14} className="text-neutral-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 打断与静默时长设置 */}
          <div className="space-y-3 pt-1 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">*</span>
              <span>欢迎语播报的前</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={noInterruptSec}
                onChange={(e) => setNoInterruptSec(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 px-2 border border-neutral-300 rounded text-center text-neutral-800 focus:outline-none focus:border-blue-500"
              />
              <span>秒，不允许用户打断</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">*</span>
              <span>开场白播报完成后，用户沉默</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={silenceSec}
                onChange={(e) => setSilenceSec(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 px-2 border border-neutral-300 rounded text-center text-neutral-800 focus:outline-none focus:border-blue-500"
              />
              <span>秒，触发静默响应策略</span>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ content, noInterruptSec, silenceSec });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. 语音播报设置弹窗 (图片 2)
// ==========================================
export interface TtsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const TtsModal: React.FC<TtsModalProps> = ({ open, onClose, onSave }) => {
  const [timbre, setTimbre] = useState('moses');
  const [speed, setSpeed] = useState(1.2);
  const [volume, setVolume] = useState(5);
  const [interval, setInterval] = useState(2);
  const [pronounceRepair, setPronounceRepair] = useState(false);
  const [customTimbre, setCustomTimbre] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">语音播报设置</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-5 text-xs text-neutral-700">
          {/* 合成音色 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800">合成音色：</span>
            <div className="flex-1">
              <div className="relative">
                <select
                  value={timbre}
                  onChange={(e) => setTimbre(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                >
                  <option value="moses">摩西 (男 · 精品)</option>
                  <option value="zhixia">知夏 (女 · 温和亲切)</option>
                  <option value="zihan">子涵 (女 · 专业客服)</option>
                  <option value="yichen">亦宸 (男 · 沉稳自然)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-600 border border-sky-100">精品</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100">男</span>
                </div>
              </div>
            </div>
          </div>

          {/* 合成语速 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800">合成语速：</span>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[11px] text-neutral-400">0.8</span>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="w-10 text-right font-medium tabular-nums">{speed.toFixed(1)}</span>
            </div>
          </div>

          {/* 合成音量 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800">合成音量：</span>
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-10 text-right font-medium tabular-nums">{volume}</span>
            </div>
          </div>

          {/* 连续播报间隔 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              连续播报间隔
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={interval}
                onChange={(e) => setInterval(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-10 text-right font-medium tabular-nums">{interval} 秒</span>
            </div>
          </div>

          {/* 全局读音修复 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              全局读音修复
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => setPronounceRepair(!pronounceRepair)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  pronounceRepair ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* 个性化音色配置 */}
          <div className="flex items-center gap-4">
            <span className="w-28 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              个性化音色配置
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => setCustomTimbre(!customTimbre)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  customTimbre ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ timbre, speed, volume, interval, pronounceRepair, customTimbre });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. 语音识别设置弹窗 (图片 3)
// ==========================================
export interface AsrModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AsrModal: React.FC<AsrModalProps> = ({ open, onClose, onSave }) => {
  const [ignoreModalParticles, setIgnoreModalParticles] = useState(true);
  const [pickupInterval, setPickupInterval] = useState(0.5);
  const [beepFilter, setBeepFilter] = useState(0);
  const [removeStagger, setRemoveStagger] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">语音识别设置</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-5 text-xs text-neutral-700">
          {/* 忽略语气词 */}
          <div className="flex items-center gap-4">
            <span className="w-24 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              忽略语气词
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIgnoreModalParticles(!ignoreModalParticles)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  ignoreModalParticles ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                编辑语气词
              </button>
            </div>
          </div>

          {/* 收音间隔 */}
          <div className="flex items-center gap-4">
            <span className="w-24 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              收音间隔
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={pickupInterval}
                onChange={(e) => setPickupInterval(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-12 text-right font-medium tabular-nums">{pickupInterval.toFixed(1)}秒</span>
            </div>
          </div>

          {/* 提示音过滤 */}
          <div className="flex items-center gap-4">
            <span className="w-24 text-right font-medium text-neutral-800 flex items-center justify-end gap-1">
              提示音过滤
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={beepFilter}
                onChange={(e) => setBeepFilter(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-12 text-right font-medium tabular-nums">{beepFilter}秒</span>
            </div>
          </div>

          {/* 去除交错 */}
          <div className="flex items-center gap-4">
            <span className="w-24 text-right font-medium text-neutral-800">去除交错：</span>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => setRemoveStagger(!removeStagger)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  removeStagger ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ ignoreModalParticles, pickupInterval, beepFilter, removeStagger });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. 兜底答案编辑弹窗 (图片 4)
// ==========================================
export interface FallbackModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (answer: string) => void;
  initialAnswer?: string;
}

export const FallbackModal: React.FC<FallbackModalProps> = ({
  open,
  onClose,
  onSave,
  initialAnswer = '刚刚没听清，您方便再说一下吗？',
}) => {
  const [answer, setAnswer] = useState(initialAnswer);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[560px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">兜底答案编辑</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <label className="text-xs font-medium text-neutral-800 shrink-0 pt-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              <span>答案内容</span>
            </label>
            <div className="flex-1">
              <div className="border border-neutral-200 rounded-lg p-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all bg-white">
                <textarea
                  rows={4}
                  maxLength={200}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="请输入兜底回复内容..."
                  className="w-full text-xs text-neutral-800 outline-none resize-none leading-relaxed"
                />
                <div className="text-right text-[11px] text-neutral-400 tabular-nums">
                  {answer.length} / 200
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(answer);
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. 按键输入策略设置弹窗 (图片 5)
// ==========================================
export interface DtmfModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const DtmfModal: React.FC<DtmfModalProps> = ({ open, onClose, onSave }) => {
  const [enabled, setEnabled] = useState(true);
  const [triggerCondition, setTriggerCondition] = useState('');
  const [validationType, setValidationType] = useState('custom');
  const [regex, setRegex] = useState('');
  const [passCondition, setPassCondition] = useState('');
  const [failPrompt, setFailPrompt] = useState('');
  const [maxFails, setMaxFails] = useState(3);
  const [failJumpCondition, setFailJumpCondition] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[580px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">按键输入策略设置</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-neutral-700">
          {/* 标题栏与启用按钮 */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
              <span>按键输入应答话术设置</span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                enabled ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {enabled ? '启用' : '已停用'}
            </button>
          </div>

          {/* 触发条件 */}
          <div className="flex items-center gap-3">
            <span className="w-28 text-right font-medium text-neutral-800">
              <span className="text-red-500">*</span> 触发条件：
            </span>
            <div className="flex-1 relative">
              <input
                type="text"
                maxLength={15}
                value={triggerCondition}
                onChange={(e) => setTriggerCondition(e.target.value)}
                placeholder="请输入Prompt的进入状态"
                className="w-full h-8 px-3 pr-12 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 tabular-nums">
                {triggerCondition.length} / 15
              </span>
            </div>
          </div>

          {/* 按键验证 */}
          <div className="flex items-start gap-3">
            <span className="w-28 text-right font-medium text-neutral-800 pt-2 flex items-center justify-end gap-1">
              按键验证
              <HelpCircle size={12} className="text-neutral-400" />：
            </span>
            <div className="flex-1 space-y-2">
              <select
                value={validationType}
                onChange={(e) => setValidationType(e.target.value)}
                className="w-full h-8 px-3 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="custom">自定义验证</option>
                <option value="phone">手机号 (11位数字)</option>
                <option value="idcard">身份证号 (18位)</option>
                <option value="digits">纯数字校验</option>
              </select>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                placeholder="请输入正则表达式"
                className="w-full h-8 px-3 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* 验证通过 */}
          <div className="flex items-center gap-3">
            <span className="w-28 text-right font-medium text-neutral-800">
              <span className="text-red-500">*</span> 验证通过：
            </span>
            <div className="flex-1">
              <input
                type="text"
                value={passCondition}
                onChange={(e) => setPassCondition(e.target.value)}
                placeholder="请输入Prompt配置的跳转条件"
                className="w-full h-8 px-3 rounded-lg border border-blue-500 ring-1 ring-blue-100 text-xs text-neutral-800 focus:outline-none"
              />
            </div>
          </div>

          {/* 验证失败提示语 */}
          <div className="flex items-center gap-3">
            <span className="w-28 text-right font-medium text-neutral-800">
              <span className="text-red-500">*</span> 验证失败提示语：
            </span>
            <div className="flex-1">
              <input
                type="text"
                value={failPrompt}
                onChange={(e) => setFailPrompt(e.target.value)}
                placeholder="请输入验证失败的播报内容"
                className="w-full h-8 px-3 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 验证失败超过 N 次 */}
          <div className="flex items-center gap-2 pl-14">
            <span className="text-neutral-700">验证失败超过</span>
            <input
              type="number"
              value={maxFails}
              onChange={(e) => setMaxFails(parseInt(e.target.value, 10) || 1)}
              className="w-14 h-8 px-2 rounded-lg border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
            <span className="text-neutral-700">次，跳转：</span>
            <input
              type="text"
              value={failJumpCondition}
              onChange={(e) => setFailJumpCondition(e.target.value)}
              placeholder="请输入Prompt的跳转条件"
              className="flex-1 h-8 px-3 rounded-lg border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                enabled,
                triggerCondition,
                validationType,
                regex,
                passCondition,
                failPrompt,
                maxFails,
                failJumpCondition,
              });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. 静默处理策略设置弹窗 (图片 6)
// ==========================================
export interface SilenceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const SilenceModal: React.FC<SilenceModalProps> = ({ open, onClose, onSave }) => {
  const [silenceDetectSec, setSilenceDetectSec] = useState(6);
  const [enableSilenceHangup, setEnableSilenceHangup] = useState(true);
  const [consecutiveCount, setConsecutiveCount] = useState(3);
  const [accumulateCount, setAccumulateCount] = useState(3);
  const [answer, setAnswer] = useState('不好意思，这边就先不打扰您了，再见。');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[580px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">静默处理策略设置</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 text-xs text-neutral-700">
          {/* 单次静音识别时长 */}
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">*</span>
            <span className="font-medium text-neutral-800">静音时单次静音识别时长设置</span>
            <input
              type="number"
              value={silenceDetectSec}
              onChange={(e) => setSilenceDetectSec(parseInt(e.target.value, 10) || 1)}
              className="w-16 h-8 px-2 rounded-lg border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
            <span>秒</span>
          </div>

          {/* 静默挂机策略开关 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="font-medium text-neutral-800">静默挂机策略：</span>
            <button
              type="button"
              onClick={() => setEnableSilenceHangup(!enableSilenceHangup)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                enableSilenceHangup ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 连续与累计条件 */}
          <div className="flex flex-wrap items-center gap-2 text-neutral-700 leading-loose">
            <span>连续静音超过</span>
            <input
              type="number"
              value={consecutiveCount}
              onChange={(e) => setConsecutiveCount(parseInt(e.target.value, 10) || 1)}
              className="w-14 h-7 px-2 rounded border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
            <span>次，或者累计静音超过</span>
            <input
              type="number"
              value={accumulateCount}
              onChange={(e) => setAccumulateCount(parseInt(e.target.value, 10) || 1)}
              className="w-14 h-7 px-2 rounded border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
            <span>次后，使用以下答案结束会话</span>
          </div>

          {/* 答案内容 */}
          <div className="flex items-start gap-3 pt-1">
            <label className="text-xs font-medium text-neutral-800 shrink-0 pt-2 flex items-center gap-1">
              <span className="text-red-500">*</span>
              <span>答案内容：</span>
            </label>
            <div className="flex-1">
              <div className="border border-neutral-200 rounded-lg p-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all bg-white">
                <textarea
                  rows={4}
                  maxLength={200}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full text-xs text-neutral-800 outline-none resize-none leading-relaxed"
                />
                <div className="text-right text-[11px] text-neutral-400 tabular-nums">
                  {answer.length} / 200
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                silenceDetectSec,
                enableSilenceHangup,
                consecutiveCount,
                accumulateCount,
                answer,
              });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. 衔接语设置弹窗 (图片 7)
// ==========================================
export interface BridgeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const BridgeModal: React.FC<BridgeModalProps> = ({ open, onClose, onSave }) => {
  const [enabled, setEnabled] = useState(true);
  const [waitTimeMs, setWaitTimeMs] = useState(300);
  const [phrases, setPhrases] = useState([
    { id: '1', text: '您好' },
    { id: '2', text: '嗯' },
    { id: '3', text: '明白' },
    { id: '4', text: '嗯嗯' },
  ]);
  const [frontRounds, setFrontRounds] = useState(3);
  const [frontProb, setFrontProb] = useState(100);
  const [laterProb, setLaterProb] = useState(50);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!open) return null;

  const handleResetDefault = () => {
    setPhrases([
      { id: '1', text: '您好' },
      { id: '2', text: '嗯' },
      { id: '3', text: '明白' },
      { id: '4', text: '嗯嗯' },
    ]);
  };

  const handleAddPhrase = () => {
    const newId = String(Date.now());
    setPhrases([...phrases, { id: newId, text: '请稍候' }]);
  };

  const handleRemovePhrase = (id: string) => {
    setPhrases(phrases.filter((p) => p.id !== id));
  };

  const handleStartEdit = (p: { id: string; text: string }) => {
    setEditingId(p.id);
    setEditText(p.text);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setPhrases(phrases.map((p) => (p.id === editingId ? { ...p, text: editText.trim() || p.text } : p)));
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-neutral-900">衔接语</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs text-neutral-700">
          {/* 功能开关 */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-2">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
              <span>功能开关</span>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <span className="text-red-500 font-bold">*</span>
              <span>启用状态：</span>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  enabled ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
              <span className="text-neutral-600">{enabled ? '已启用' : '未启用'}</span>
            </div>
          </div>

          {/* 触发时机 */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-2">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
              <span>触发时机</span>
            </div>
            <div className="pl-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span>等待大模型</span>
                <input
                  type="number"
                  value={waitTimeMs}
                  onChange={(e) => setWaitTimeMs(parseInt(e.target.value, 10) || 0)}
                  className="w-16 h-7 px-2 rounded border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
                />
                <span>ms 没有结果，播放衔接语</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                若设定时间内，大模型未返回结果则播放衔接语。推荐 300ms。
              </p>
            </div>
          </div>

          {/* 衔接语列表 */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-2">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
              <span>衔接语列表</span>
            </div>
            <div className="pl-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">已配置 {phrases.length} / 50 条</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  恢复默认
                </button>
              </div>

              {/* 列表条目 */}
              <div className="space-y-1.5">
                {phrases.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 bg-neutral-50/80 rounded-lg border border-neutral-200/70 group hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical size={13} className="text-neutral-400 cursor-grab" />
                      <span className="w-4 text-center font-medium text-blue-600">{idx + 1}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                        文本合成
                      </span>
                      {editingId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="h-6 px-2 text-xs border border-blue-500 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="text-xs text-blue-600 font-medium hover:underline"
                          >
                            保存
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-800">文本: {p.text}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {editingId !== p.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          编辑
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhrase(p.id)}
                        className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title="删除"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 新增按钮 */}
              <button
                type="button"
                onClick={handleAddPhrase}
                className="w-full py-2 border border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>新增衔接语</span>
              </button>
            </div>
          </div>

          {/* 播放概率 */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-2">
              <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
              <span>播放概率</span>
            </div>
            <div className="pl-3 space-y-3">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                播放概率用于判断「本轮是否触发衔接语」。概率未命中时，直接等待 LLM 结果。
              </p>

              <div className="flex items-center gap-3">
                <span className="text-neutral-700">前</span>
                <input
                  type="number"
                  value={frontRounds}
                  onChange={(e) => setFrontRounds(parseInt(e.target.value, 10) || 1)}
                  className="w-12 h-7 px-1.5 rounded border border-neutral-300 text-center text-xs text-neutral-800"
                />
                <span className="text-neutral-700">轮，触发概率</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={frontProb}
                  onChange={(e) => setFrontProb(parseInt(e.target.value, 10))}
                  className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="w-12 text-right font-medium tabular-nums">{frontProb}%</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-neutral-700">后续轮次，触发概率</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={laterProb}
                  onChange={(e) => setLaterProb(parseInt(e.target.value, 10))}
                  className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="w-12 text-right font-medium tabular-nums">{laterProb}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ enabled, waitTimeMs, phrases, frontRounds, frontProb, laterProb });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. 编辑延时挂机时间弹窗 (图片 8)
// ==========================================
export interface DelayHangModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (sec: number) => void;
  initialSec?: number;
}

export const DelayHangModal: React.FC<DelayHangModalProps> = ({
  open,
  onClose,
  onSave,
  initialSec = 2,
}) => {
  const [sec, setSec] = useState(initialSec);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">编辑延时挂机时间</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 text-xs text-neutral-700">
          {/* 黄色提示条 */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-center gap-2 text-amber-800">
            <span className="w-4 h-4 rounded-full border border-amber-600 flex items-center justify-center text-[10px] text-amber-700 font-bold shrink-0">
              i
            </span>
            <span>只支持输入1-10范围内的整数</span>
          </div>

          {/* 输入项 */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-red-500 font-bold">*</span>
            <span className="font-medium text-neutral-800">延时挂机时长</span>
            <input
              type="number"
              min="1"
              max="10"
              value={sec}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setSec(Math.min(10, Math.max(1, val)));
                }
              }}
              className="w-16 h-8 px-2 rounded-lg border border-neutral-300 text-center text-xs text-neutral-800 focus:outline-none focus:border-blue-500"
            />
            <span>秒</span>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(sec);
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. 全局打断/抢话设置弹窗 (图片 9)
// ==========================================
export interface InterruptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const InterruptModal: React.FC<InterruptModalProps> = ({ open, onClose, onSave }) => {
  const [allowInterrupt, setAllowInterrupt] = useState(true);
  const [supportGrabRange, setSupportGrabRange] = useState(true);
  const [grabRangeSec, setGrabRangeSec] = useState(1.0);
  const [supportNoInterrupt, setSupportNoInterrupt] = useState(true);
  const [defaultNoInterruptSec, setDefaultNoInterruptSec] = useState(2.0);
  const [hangupAllowInterrupt, setHangupAllowInterrupt] = useState(true);
  const [minInterruptChars, setMinInterruptChars] = useState(1);
  const [showYellowTip, setShowYellowTip] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[620px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">全局打断/抢话设置</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-neutral-700">
          {/* 全局允许打断 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold">*</span>
              <span className="font-medium text-neutral-800">全局允许用户打断：</span>
              <button
                type="button"
                onClick={() => setAllowInterrupt(!allowInterrupt)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  allowInterrupt ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 pl-4 leading-relaxed">
              若关闭全局打断，则开场白和全局内容全部不允许用户打断；若开启全局打断后，则开场白配置的可打断区间/不可打断区间生效。
            </p>
          </div>

          {/* 支持抢话区间 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="font-medium text-neutral-800 pl-4">支持抢话区间：</span>
            <button
              type="button"
              onClick={() => setSupportGrabRange(!supportGrabRange)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                supportGrabRange ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 抢话区间详情 */}
          <div className="flex items-start gap-2 pl-1">
            <span className="text-red-500 font-bold mt-1">*</span>
            <div className="flex-1 leading-relaxed">
              <span>抢话区间 在调用大模型推理的 </span>
              <input
                type="number"
                step="0.1"
                value={grabRangeSec}
                onChange={(e) => setGrabRangeSec(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 px-1.5 rounded border border-neutral-300 text-center text-xs text-neutral-800 mx-1"
              />
              <span>
                秒内，若用户补充说话，则会取消推理/TTS播报，回退到上一轮次，并在下一次调用大模型推理时增加本轮用户说话内容，使推理信息更完整。
              </span>
            </div>
          </div>

          {/* 支持不可打断区间 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="font-medium text-neutral-800 pl-4">支持不可打断区间：</span>
            <button
              type="button"
              onClick={() => setSupportNoInterrupt(!supportNoInterrupt)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                supportNoInterrupt ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 默认不可打断区间 */}
          <div className="flex items-center gap-2 pl-1">
            <span className="text-red-500 font-bold">*</span>
            <span className="font-medium text-neutral-800">默认不可打断区间：</span>
            <span>单句答案播报的前</span>
            <input
              type="number"
              step="0.1"
              value={defaultNoInterruptSec}
              onChange={(e) => setDefaultNoInterruptSec(parseFloat(e.target.value) || 0)}
              className="w-16 h-7 px-1.5 rounded border border-neutral-300 text-center text-xs text-neutral-800"
            />
            <span>秒不允许打断。</span>
          </div>

          {/* 黄色提示条 */}
          {showYellowTip && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start justify-between gap-2 text-amber-800 text-[11px] leading-relaxed">
              <span>
                按轮次配置不可打断区间：从开场白后的节点开始计算轮次，即开场白后的第一轮至第X轮遵守轮次不可打断区间，从X轮之后遵守兜底不可打断区间。
              </span>
              <button
                type="button"
                onClick={() => setShowYellowTip(false)}
                className="text-amber-600 hover:text-amber-800 shrink-0 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* 增加轮次配置链接 */}
          <div>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              + 按轮次配置不可打断区间
            </button>
          </div>

          {/* 挂机话术支持打断 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="font-medium text-neutral-800 pl-4">挂机话术支持打断：</span>
            <button
              type="button"
              onClick={() => setHangupAllowInterrupt(!hangupAllowInterrupt)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                hangupAllowInterrupt ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 最小打断字数 */}
          <div className="flex items-center gap-2 pl-1">
            <span className="text-red-500 font-bold">*</span>
            <span className="font-medium text-neutral-800">最小打断字数</span>
            <span>当用户说话的字数大于等于</span>
            <input
              type="number"
              min="1"
              value={minInterruptChars}
              onChange={(e) => setMinInterruptChars(parseInt(e.target.value, 10) || 1)}
              className="w-16 h-7 px-1.5 rounded border border-neutral-300 text-center text-xs text-neutral-800"
            />
            <span>个字允许打断TTS播报</span>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                allowInterrupt,
                supportGrabRange,
                grabRangeSec,
                supportNoInterrupt,
                defaultNoInterruptSec,
                hangupAllowInterrupt,
                minInterruptChars,
              });
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 10. 选择背景音频弹窗 (图片 10)
// ==========================================
export interface BgmModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (bgmName: string, enabled: boolean) => void;
  initialSelected?: string;
  initialEnabled?: boolean;
}

const BGM_OPTIONS = [
  '键盘打字',
  '嘈杂办公室',
  'F_szjh_0905_pm2',
  'D_szjh_0905_am',
  'G_hlzx_0907_am',
  '办公室（低音量）',
  '键盘打字6',
  '键盘打字7',
];

export const BgmModal: React.FC<BgmModalProps> = ({
  open,
  onClose,
  onSave,
  initialSelected = '键盘打字',
  initialEnabled = false,
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [selected, setSelected] = useState(initialSelected);
  const [playingItem, setPlayingItem] = useState<string | null>(null);

  if (!open) return null;

  const handleTogglePlay = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingItem === item) {
      setPlayingItem(null);
    } else {
      setPlayingItem(item);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[540px] bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-[16px] font-semibold text-neutral-900">选择背景音频</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 text-xs text-neutral-700">
          {/* 通话背景音开关 */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-800">通话背景音：</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                enabled ? 'bg-blue-600 justify-end' : 'bg-neutral-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 当前选择 */}
          <div className="text-xs text-neutral-700 font-medium pt-1">
            当前已选择：<span className="text-neutral-900 font-semibold">{selected}</span>
          </div>

          {/* 选项网格 (2列) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {BGM_OPTIONS.map((item) => {
              const isSelected = selected === item;
              const isPlaying = playingItem === item;
              return (
                <div
                  key={item}
                  onClick={() => setSelected(item)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-200 text-blue-700 font-medium'
                      : 'bg-neutral-50/80 border-neutral-200/70 text-neutral-700 hover:bg-neutral-100/70 hover:border-neutral-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(item, e)}
                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isPlaying
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'text-blue-600 hover:bg-blue-100'
                        : 'text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    <Play size={11} className={isPlaying ? 'fill-white' : ''} />
                  </button>
                  <span className="truncate flex-1">{item}</span>
                  {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(selected, enabled);
              onClose();
            }}
            className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
