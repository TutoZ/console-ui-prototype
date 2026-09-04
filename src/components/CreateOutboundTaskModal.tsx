/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 智能外呼 · 新建外呼任务
 */

import React, { useEffect, useMemo, useState } from 'react';
import { BTN_INK, BTN_OUTLINE, BTN_SOFT, FIELD, FIELD_CTRL, LABEL, segmentedItemClass } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Modal } from './common/Modal';
import { Clock, Plus, Trash2 } from '@/lib/icons';

export type OutboundTaskKind = 'formal' | 'test';
export type OutboundStartMode = 'manual' | 'scheduled' | 'loop';
export type OutboundSlotMode = 'simple' | 'workday' | 'custom' | 'unlimited';

export interface CreateOutboundTaskPayload {
  kind: OutboundTaskKind;
  name: string;
  scriptId: string;
  scriptLabel: string;
  customerGroupId: string;
  customerGroupLabel: string;
  taskGroupId: string;
  startMode: OutboundStartMode;
  slotMode: OutboundSlotMode;
  slots: { start: string; end: string }[];
  lineId: string;
  lineLabel: string;
  numberId: string;
  numberLabel: string;
}

const SCRIPTS = [
  { id: '10006', label: 'daihou_test01' },
  { id: '10008', label: '会员回访话术' },
  { id: '10009', label: '沉默激活话术' },
  { id: '10012', label: '华道测试话术' },
] as const;

const CUSTOMER_GROUPS = [
  { id: 'cg_summer', label: '夏季会员回访名单' },
  { id: 'cg_silent', label: '沉默用户激活' },
  { id: 'cg_intent', label: '高意向待二次触达' },
  { id: 'cg_trial', label: '测试客户组-0606' },
] as const;

const TASK_GROUPS = [
  { id: 'tg_default', label: '默认分组' },
  { id: 'tg_member', label: '会员运营' },
  { id: 'tg_test', label: '测试组' },
] as const;

const LINES = [
  { id: 'line_demo', label: '演示线路' },
  { id: 'line_a', label: '线路池 A' },
] as const;

const NUMBERS = [
  { id: 'num_400', label: '400-820-8888' },
  { id: 'num_021', label: '021-5566-7788' },
] as const;

const DEFAULT_SLOTS = [
  { start: '09:00', end: '12:00' },
  { start: '14:00', end: '20:00' },
];

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

export const CreateOutboundTaskModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOutboundTaskPayload) => void;
}> = ({ open, onClose, onSubmit }) => {
  const [kind, setKind] = useState<OutboundTaskKind>('formal');
  const [name, setName] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [customerGroupId, setCustomerGroupId] = useState('');
  const [taskGroupId, setTaskGroupId] = useState('');
  const [startMode, setStartMode] = useState<OutboundStartMode>('manual');
  const [slotMode, setSlotMode] = useState<OutboundSlotMode>('simple');
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [lineId, setLineId] = useState('');
  const [numberId, setNumberId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setKind('formal');
    setName('');
    setScriptId('');
    setGroupQuery('');
    setCustomerGroupId('');
    setTaskGroupId('');
    setStartMode('manual');
    setSlotMode('simple');
    setSlots(DEFAULT_SLOTS);
    setLineId('');
    setNumberId('');
    setError('');
  }, [open]);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    if (!q) return CUSTOMER_GROUPS;
    return CUSTOMER_GROUPS.filter((g) => g.label.toLowerCase().includes(q));
  }, [groupQuery]);

  const handleSubmit = () => {
    const group = CUSTOMER_GROUPS.find((g) => g.id === customerGroupId);
    const script = SCRIPTS.find((s) => s.id === scriptId);
    const line = LINES.find((l) => l.id === lineId);
    const number = NUMBERS.find((n) => n.id === numberId);
    if (!script) {
      setError('请选择外呼话术');
      return;
    }
    if (!group) {
      setError('请选择客户组');
      return;
    }
    if (!line || !number) {
      setError('请选择外呼线路与外呼号码');
      return;
    }
    const resolvedName = name.trim() || group.label;
    onSubmit({
      kind,
      name: resolvedName.slice(0, 80),
      scriptId: script.id,
      scriptLabel: script.label,
      customerGroupId: group.id,
      customerGroupLabel: group.label,
      taskGroupId,
      startMode,
      slotMode,
      slots: slotMode === 'unlimited' ? [] : slots,
      lineId: line.id,
      lineLabel: line.label,
      numberId: number.id,
      numberLabel: number.label,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建外呼任务"
      maxWidth="max-w-lg"
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
      <div className="max-h-[min(68vh,640px)] overflow-y-auto custom-scrollbar space-y-4 pr-0.5">
        <div className="inline-flex h-8 items-center rounded-[7px] border border-neutral-200 bg-neutral-100 p-0.5">
          {(
            [
              { id: 'formal' as const, label: '正式任务' },
              { id: 'test' as const, label: '测试任务' },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={cn(segmentedItemClass(kind === item.id), 'h-7 px-3 text-[12px]')}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <label className={LABEL}>任务名称</label>
          <div className="relative">
            <input
              className={cn(FIELD, FIELD_CTRL, 'pr-12')}
              placeholder="请输入任务名称"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-neutral-400">
              {name.length}/80
            </span>
          </div>
        </div>

        <div>
          <label className={LABEL}>
            外呼话术
            <RequiredMark />
          </label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={scriptId}
            onChange={(e) => setScriptId(e.target.value)}
          >
            <option value="">请选择外呼话术</option>
            {SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>
            选择客户组
            <RequiredMark />
          </label>
          <input
            className={cn(FIELD, FIELD_CTRL, 'mb-1.5')}
            placeholder="选择客户组，单次呈现前50条，可通过搜索快速查找"
            value={groupQuery}
            onChange={(e) => setGroupQuery(e.target.value)}
          />
          <div className="max-h-[120px] overflow-y-auto custom-scrollbar rounded-[7px] border border-neutral-200">
            {filteredGroups.length === 0 ? (
              <p className="px-2.5 py-2 text-[11px] text-neutral-400">无匹配客户组</p>
            ) : (
              filteredGroups.map((g) => {
                const active = customerGroupId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setCustomerGroupId(g.id);
                      if (!name.trim()) setName(g.label.slice(0, 80));
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 text-[12px] cursor-pointer',
                      active
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-800 hover:bg-neutral-50',
                    )}
                  >
                    {g.label}
                  </button>
                );
              })
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed">
            ① 若任务名称为空，客户组名称将自动填充至任务名称
          </p>
        </div>

        <div>
          <label className={LABEL}>任务组</label>
          <select
            className={cn(FIELD, FIELD_CTRL)}
            value={taskGroupId}
            onChange={(e) => setTaskGroupId(e.target.value)}
          >
            <option value="">请选择任务组，非必填</option>
            {TASK_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 rounded-[7px] border border-neutral-200 bg-neutral-50/60 p-3">
          <div>
            <div className="text-[12px] font-semibold text-neutral-800 mb-2">启动模式</div>
            <RadioRow
              value={startMode}
              onChange={setStartMode}
              options={[
                { id: 'manual', label: '手动' },
                { id: 'scheduled', label: '定时' },
                { id: 'loop', label: '循环' },
              ]}
            />
            {startMode === 'scheduled' ? (
              <input
                type="datetime-local"
                className={cn(FIELD, FIELD_CTRL, 'mt-2')}
                defaultValue="2026-08-14T09:00"
              />
            ) : null}
            {startMode === 'loop' ? (
              <p className="mt-2 text-[11px] text-neutral-500">按拨打时段循环外呼，任务完成前持续执行。</p>
            ) : null}
          </div>

          <div>
            <div className="text-[12px] font-semibold text-neutral-800 mb-2">拨打时段</div>
            <RadioRow
              value={slotMode}
              onChange={setSlotMode}
              options={[
                { id: 'simple', label: '简易' },
                { id: 'workday', label: '工作日' },
                { id: 'custom', label: '自定义' },
                { id: 'unlimited', label: '不限制' },
              ]}
            />
            {slotMode !== 'unlimited' ? (
              <div className="mt-2 space-y-2">
                {slots.map((slot, index) => (
                  <div key={`${slot.start}-${index}`} className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0 text-neutral-400" />
                    <input
                      type="time"
                      className={cn(FIELD, FIELD_CTRL, 'w-[108px]')}
                      value={slot.start}
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s, i) => (i === index ? { ...s, start: e.target.value } : s)),
                        )
                      }
                    />
                    <span className="text-neutral-400">—</span>
                    <input
                      type="time"
                      className={cn(FIELD, FIELD_CTRL, 'w-[108px]')}
                      value={slot.end}
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s, i) => (i === index ? { ...s, end: e.target.value } : s)),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="shrink-0 text-rose-500 hover:text-rose-600 cursor-pointer"
                      aria-label="删除时段"
                      onClick={() => setSlots((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={cn(BTN_OUTLINE, 'h-7')}
                  onClick={() => setSlots((prev) => [...prev, { start: '09:00', end: '18:00' }])}
                >
                  <Plus size={12} />
                  添加
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-[12px] font-semibold text-neutral-800 mb-2">线路与并发</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>
                  外呼线路
                  <RequiredMark />
                </label>
                <select
                  className={cn(FIELD, FIELD_CTRL)}
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {LINES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>
                  外呼号码
                  <RequiredMark />
                </label>
                <select
                  className={cn(FIELD, FIELD_CTRL)}
                  value={numberId}
                  onChange={(e) => setNumberId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {NUMBERS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      </div>
    </Modal>
  );
};
