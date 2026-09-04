/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 电话催收 · 派发催收任务（演示 mock）
 */

import React, { useEffect, useState } from 'react';
import type { HiredAgent } from '../types';
import { BTN_INK, BTN_SOFT, FIELD, FIELD_CTRL, LABEL } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Modal } from './common/Modal';

const CASE_BATCHES = [
  { id: 'batch_m2_jun', label: '6 月 M2 逾期批次 · 128 件' },
  { id: 'batch_m1_jun', label: '6 月 M1 提醒批次 · 86 件' },
  { id: 'batch_m3_may', label: '5 月 M3 升级批次 · 42 件' },
] as const;

const STAGES = ['M1', 'M2', 'M3', 'M4+'] as const;

const STRATEGIES = [
  { id: 'workday', label: '工作日 09:00–20:00' },
  { id: 'resource', label: '沿用资源中心拨打策略' },
] as const;

function RadioRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (id: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="inline-flex items-center gap-1.5 text-[12px] text-neutral-800 cursor-pointer"
          >
            <span
              className={cn(
                'h-3.5 w-3.5 rounded-full border box-border',
                active ? 'border-neutral-800 border-[4px]' : 'border-neutral-300',
              )}
              aria-hidden
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export const CreateCollectionTaskModal: React.FC<{
  open: boolean;
  onClose: () => void;
  agents: HiredAgent[];
  defaultAgentId?: string | null;
  onSubmit?: (payload: {
    name: string;
    batchId: string;
    stage: (typeof STAGES)[number];
    agentId: string;
  }) => void;
}> = ({ open, onClose, agents, defaultAgentId, onSubmit }) => {
  const [name, setName] = useState('');
  const [batchId, setBatchId] = useState<(typeof CASE_BATCHES)[number]['id']>('batch_m2_jun');
  const [stage, setStage] = useState<(typeof STAGES)[number]>('M2');
  const [agentId, setAgentId] = useState('');
  const [strategy, setStrategy] = useState<(typeof STRATEGIES)[number]['id']>('workday');
  const [dailyCap, setDailyCap] = useState('3');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setBatchId('batch_m2_jun');
    setStage('M2');
    setAgentId(defaultAgentId && agents.some((a) => a.id === defaultAgentId) ? defaultAgentId : agents[0]?.id ?? '');
    setStrategy('workday');
    setDailyCap('3');
    setError('');
  }, [open, defaultAgentId, agents]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写任务名称');
      return;
    }
    if (!agentId) {
      setError('请选择催收数字员工');
      return;
    }
    onSubmit?.({ name: trimmed, batchId, stage, agentId });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="派发催收任务"
      description="将案件批次派给催收数字员工，按账龄与拨打策略执行（演示）。"
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            取消
          </button>
          <button type="button" className={BTN_INK} onClick={handleSubmit}>
            派发
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>
            任务名称
            <RequiredMark />
          </label>
          <input
            className={cn(FIELD, FIELD_CTRL)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：6 月 M2 逾期催收"
          />
        </div>
        <div>
          <label className={LABEL}>
            案件批次
            <RequiredMark />
          </label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value as (typeof CASE_BATCHES)[number]['id'])}
          >
            {CASE_BATCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>账龄阶段</label>
          <RadioRow
            value={stage}
            onChange={setStage}
            options={STAGES.map((s) => ({ id: s, label: s }))}
          />
        </div>
        <div>
          <label className={LABEL}>
            催收数字员工
            <RequiredMark />
          </label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            {agents.length === 0 ? (
              <option value="">暂无催收数字员工</option>
            ) : (
              agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className={LABEL}>拨打策略</label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as (typeof STRATEGIES)[number]['id'])}
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>单号日拨上限</label>
          <input
            className={cn(FIELD, FIELD_CTRL)}
            inputMode="numeric"
            value={dailyCap}
            onChange={(e) => setDailyCap(e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
        {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
      </div>
    </Modal>
  );
};
