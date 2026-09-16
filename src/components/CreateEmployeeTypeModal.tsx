/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 自建数字员工 — 两步弹窗（common/Modal + 设计系统按钮/选中态）
 * 1) 选择员工分类
 * 2) 选择创建方式：AI搭建 / 手动创建 / 工作流编排
 */

import React, { useEffect, useState } from 'react';
import {
  CREATE_METHOD_META,
  type EmployeeCreateMethod,
} from '@/lib/employeeCreateMethod';
import { Check } from '@/lib/icons';
import { JOB_FAMILY_FULL_LABELS } from '@/lib/jobFamily';
import { BTN_INK, BTN_OUTLINE, BTN_SOFT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Modal } from './common/Modal';
import type { JobFamily } from '@/src/types';

export type EmployeeBuildMode = 'autonomous' | 'preset';
export type { EmployeeCreateMethod };

export type CreateEmployeePayload = {
  mode: EmployeeBuildMode;
  createMethod: EmployeeCreateMethod;
  jobFamily: JobFamily;
  name: string;
  description: string;
};

type CreateEmployeeTypeModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: CreateEmployeePayload) => void;
  /** 培训页锁定为在线客服，跳过分类步 */
  lockJobFamily?: JobFamily;
};

const CATEGORY_OPTIONS: { id: JobFamily; label: string }[] = [
  { id: 'customer_service', label: '在线客服' },
  { id: 'outbound', label: '智能外呼' },
  { id: 'hotline', label: '热线客服' },
  { id: 'telesales', label: '电话销售' },
  { id: 'collection', label: '电话催收' },
  { id: 'quality_inspection', label: '智能质检' },
  { id: 'other', label: '业务助理' },
];

const METHOD_OPTIONS: {
  id: EmployeeCreateMethod;
  title: string;
  desc: string;
  Icon: (typeof CREATE_METHOD_META)[EmployeeCreateMethod]['Icon'];
}[] = [
  {
    id: 'ai',
    title: 'AI搭建',
    desc: '对话生成规则与功能草稿。',
    Icon: CREATE_METHOD_META.ai.Icon,
  },
  {
    id: 'manual',
    title: '手动创建',
    desc: '直接进入培训配置页自行搭建。',
    Icon: CREATE_METHOD_META.manual.Icon,
  },
  {
    id: 'workflow',
    title: '工作流编排',
    desc: '在画布上拖拽节点，编排接待与处理流程。',
    Icon: CREATE_METHOD_META.workflow.Icon,
  },
];

function buildModeFor(method: EmployeeCreateMethod): EmployeeBuildMode {
  return method === 'workflow' ? 'preset' : 'autonomous';
}

const OPTION_IDLE =
  'relative text-left rounded-lg border border-neutral-200 bg-white p-3 transition cursor-pointer hover:border-neutral-300 hover:bg-neutral-50';
const OPTION_ACTIVE =
  'relative text-left rounded-lg border border-neutral-800 bg-neutral-50 p-3 transition cursor-pointer ring-1 ring-neutral-800/10';

function defaultNameFor(family: JobFamily): string {
  const label =
    CATEGORY_OPTIONS.find((c) => c.id === family)?.label ?? JOB_FAMILY_FULL_LABELS[family];
  return `${label}助手`;
}

function defaultDescFor(family: JobFamily): string {
  const label =
    CATEGORY_OPTIONS.find((c) => c.id === family)?.label ?? JOB_FAMILY_FULL_LABELS[family];
  return `自主规划的${label}数字员工，可通过对话持续完善岗位边界与技能。`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-medium text-neutral-500 mb-2">{children}</p>;
}

export const CreateEmployeeTypeModal: React.FC<CreateEmployeeTypeModalProps> = ({
  open,
  onClose,
  onConfirm,
  lockJobFamily,
}) => {
  const skipCategory = Boolean(lockJobFamily);
  const [step, setStep] = useState<1 | 2>(skipCategory ? 2 : 1);
  const [jobFamily, setJobFamily] = useState<JobFamily>(
    lockJobFamily ?? 'customer_service',
  );
  const [createMethod, setCreateMethod] = useState<EmployeeCreateMethod>('ai');

  useEffect(() => {
    if (!open) return;
    setStep(skipCategory ? 2 : 1);
    setJobFamily(lockJobFamily ?? 'customer_service');
    setCreateMethod('ai');
  }, [open, lockJobFamily, skipCategory]);

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.id === jobFamily)?.label ??
    JOB_FAMILY_FULL_LABELS[jobFamily];

  const handleConfirmCreate = () => {
    onConfirm({
      mode: buildModeFor(createMethod),
      createMethod,
      jobFamily,
      name: defaultNameFor(jobFamily),
      description: defaultDescFor(jobFamily),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? '创建数字员工' : `创建${categoryLabel}`}
      showClose={false}
      maxWidth="max-w-lg"
      footer={
        <>
          {step === 2 && !skipCategory ? (
            <button
              type="button"
              className={cn(BTN_SOFT, 'mr-auto')}
              onClick={() => setStep(1)}
            >
              上一步
            </button>
          ) : null}
          <button type="button" className={BTN_OUTLINE} onClick={onClose}>
            取消
          </button>
          {step === 1 ? (
            <button type="button" className={BTN_INK} onClick={() => setStep(2)}>
              下一步
            </button>
          ) : (
            <button type="button" className={BTN_INK} onClick={handleConfirmCreate}>
              确认创建
            </button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = jobFamily === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setJobFamily(cat.id)}
                aria-pressed={active}
                className={cn(
                  'relative h-9 rounded-md border text-[12px] font-medium transition cursor-pointer',
                  active
                    ? 'border-neutral-800 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
                )}
              >
                {cat.label}
                {active ? (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white ring-2 ring-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 max-h-[min(56vh,420px)] overflow-y-auto custom-scrollbar">
          <section>
            <SectionLabel>创建方式</SectionLabel>
            <div className="grid grid-cols-1 gap-2">
              {METHOD_OPTIONS.map((opt) => {
                const active = createMethod === opt.id;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCreateMethod(opt.id)}
                    aria-pressed={active}
                    className={active ? OPTION_ACTIVE : OPTION_IDLE}
                  >
                    {active ? (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : null}
                    <div className="pr-5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                            active
                              ? 'bg-neutral-200 text-neutral-700'
                              : 'bg-neutral-100 text-neutral-500',
                          )}
                        >
                          <Icon size={16} strokeWidth={2} className="shrink-0" />
                        </span>
                        <span className="min-w-0 text-[13px] font-semibold leading-8 text-neutral-900">
                          {opt.title}
                        </span>
                      </div>
                      <p className="mt-1 pl-[42px] text-[12px] text-neutral-500 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
};
