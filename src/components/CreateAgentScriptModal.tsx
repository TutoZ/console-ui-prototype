/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 智能体话术 · 新建话术
 */

import React, { useEffect, useState } from 'react';
import { BTN_INK, BTN_OUTLINE, BTN_SOFT, FIELD, FIELD_CTRL, LABEL, badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Modal } from './common/Modal';
import { Pencil } from '@/lib/icons';

export interface CreateAgentScriptPayload {
  name: string;
  industry: string;
  tags: string[];
  model: string;
  voiceId: string;
  voiceLabel: string;
  speechRate: number;
  volume: number;
}

const INDUSTRIES = ['家电', '金融', '零售', '保险', '物流', '教育', '医疗'] as const;

const MODELS = ['DeepSeek-V4-Flash', 'Qwen3.6-35B-A3B', 'DeepSeek-V3'] as const;

const VOICES = [
  { id: 'mengyuan', label: '大模型-mengyuan', premium: true, locale: '未知' },
  { id: 'zhixia', label: '知夏', premium: false, locale: '中文女声' },
  { id: 'zhifei', label: '知飞', premium: true, locale: '中文男声' },
] as const;

const TAG_OPTIONS = ['回访', '催收', '预约', '营销', '通知', '时间确认'] as const;

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export const CreateAgentScriptModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAgentScriptPayload) => void;
}> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [model, setModel] = useState<(typeof MODELS)[number]>('DeepSeek-V4-Flash');
  const [voiceId, setVoiceId] = useState<(typeof VOICES)[number]['id']>('mengyuan');
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setIndustry('');
    setTags([]);
    setTagPickerOpen(false);
    setModel('DeepSeek-V4-Flash');
    setVoiceId('mengyuan');
    setSpeechRate(1);
    setVolume(5);
    setError('');
  }, [open]);

  const selectedVoice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入话术模板名称');
      return;
    }
    if (!industry) {
      setError('请选择所属行业');
      return;
    }
    onSubmit({
      name: trimmed.slice(0, 40),
      industry,
      tags,
      model,
      voiceId: selectedVoice.id,
      voiceLabel: selectedVoice.label,
      speechRate,
      volume,
    });
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建话术"
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            取消
          </button>
          <button type="button" className={BTN_INK} onClick={handleSubmit}>
            确定
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>
            话术模板名称
            <RequiredMark />
          </label>
          <div className="relative">
            <input
              className={cn(FIELD, FIELD_CTRL, 'pr-12')}
              placeholder="输入话术模板名称"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-neutral-400">
              {name.length} / 40
            </span>
          </div>
        </div>

        <div>
          <label className={LABEL}>
            所属行业
            <RequiredMark />
          </label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">请选择行业</option>
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>业务标签</label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={cn(BTN_OUTLINE, 'h-7')}
              onClick={() => setTagPickerOpen((v) => !v)}
            >
              <Pencil size={12} />
              选择标签
            </button>
            {tags.map((tag) => (
              <span key={tag} className={badgeClass('neutral')}>
                {tag}
              </span>
            ))}
          </div>
          {tagPickerOpen ? (
            <div className="mt-2 flex flex-wrap gap-1.5 rounded-[7px] border border-neutral-200 bg-neutral-50 p-2">
              {TAG_OPTIONS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'h-6 px-2 rounded-md text-[11px] font-medium border cursor-pointer',
                      active
                        ? 'bg-neutral-800 text-white border-neutral-800'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400',
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <label className={LABEL}>
            模型选择
            <RequiredMark />
          </label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={model}
            onChange={(e) => setModel(e.target.value as (typeof MODELS)[number])}
          >
            {MODELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>合成音色</label>
          <div className="relative">
            <select
              className={cn(FIELD, FIELD_CTRL, selectedVoice.premium && 'pr-[92px]')}
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value as (typeof VOICES)[number]['id'])}
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            {selectedVoice.premium ? (
              <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className={badgeClass('live')}>精品</span>
                <span className={badgeClass('neutral')}>{selectedVoice.locale}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <label className={LABEL}>合成语速</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.1}
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full accent-neutral-800"
                aria-label="合成语速"
              />
              <div className="flex justify-between text-[10px] tabular-nums text-neutral-400 -mt-0.5">
                <span>0.8</span>
                <span>1.2</span>
              </div>
            </div>
            <span className="w-7 text-right text-[12px] font-semibold tabular-nums text-neutral-800">
              {speechRate}
            </span>
          </div>
        </div>

        <div>
          <label className={LABEL}>合成音量</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 min-w-0 accent-neutral-800"
              aria-label="合成音量"
            />
            <span className="w-7 text-right text-[12px] font-semibold tabular-nums text-neutral-800">
              {volume}
            </span>
          </div>
        </div>

        {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      </div>
    </Modal>
  );
};
