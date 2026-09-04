/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 自建数字员工 — 两步弹窗
 * 1) 选择员工分类
 * 2) 选择员工类型（自主规划 / 预设流程）+ 创建方式（AI 帮写 / 手动创建）
 */

import React, { useEffect, useState } from 'react';
import {
  Check,
  GitBranch,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  X,
} from '@/lib/icons';
import { JOB_FAMILY_FULL_LABELS } from '@/lib/jobFamily';
import { BTN_SOFT, SKILL_AOP_ACCENT_BG, SKILL_AOP_ACCENT_TEXT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import type { JobFamily } from '@/src/types';

export type EmployeeBuildMode = 'autonomous' | 'preset';
export type EmployeeCreateMethod = 'ai' | 'manual';

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

const BUILD_OPTIONS: {
  id: EmployeeBuildMode;
  title: string;
  subtitle: string;
  desc: string;
  recommended?: boolean;
  Icon: typeof Share2;
}[] = [
  {
    id: 'autonomous',
    title: '自主规划数字员工',
    subtitle: 'OpenClaw 智能架构',
    desc: '基于大模型具备自主思考和自我规划行为能力，可通过 AI 智能对话自动梳理业务边界，实时生成岗位属性与技能配置。',
    recommended: true,
    Icon: Sparkles,
  },
  {
    id: 'preset',
    title: '预设流程数字员工',
    subtitle: '标准流程编排',
    desc: '基于预设固定的业务节点图，判断分支与标准知识库规则，支持在详情画布中手动精细化自定义编排业务流程。',
    Icon: GitBranch,
  },
];

const METHOD_OPTIONS: {
  id: EmployeeCreateMethod;
  title: string;
  subtitle: string;
  desc: string;
  Icon: typeof Sparkles;
}[] = [
  {
    id: 'ai',
    title: 'AI 帮写',
    subtitle: '智能对话驯化',
    desc: '通过与 AI 助手对话，分析业务需求，自动生成数字员工规则与功能草稿。',
    Icon: Sparkles,
  },
  {
    id: 'manual',
    title: '手动创建',
    subtitle: '自定义画布配置',
    desc: '跳过 AI 对话，直接进入详细培训与配置页，自行搭建业务流程。',
    Icon: Pencil,
  },
];

function defaultNameFor(family: JobFamily): string {
  const label = CATEGORY_OPTIONS.find((c) => c.id === family)?.label
    ?? JOB_FAMILY_FULL_LABELS[family];
  return `${label}助手`;
}

function defaultDescFor(family: JobFamily, mode: EmployeeBuildMode): string {
  const label = CATEGORY_OPTIONS.find((c) => c.id === family)?.label
    ?? JOB_FAMILY_FULL_LABELS[family];
  return mode === 'autonomous'
    ? `自主规划的${label}数字员工，可通过对话持续完善岗位边界与技能。`
    : `基于预设流程编排的${label}数字员工，可在画布中调整节点与规则。`;
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
  const [mode, setMode] = useState<EmployeeBuildMode>('autonomous');
  const [createMethod, setCreateMethod] = useState<EmployeeCreateMethod>('ai');

  useEffect(() => {
    if (!open) return;
    setStep(skipCategory ? 2 : 1);
    setJobFamily(lockJobFamily ?? 'customer_service');
    setMode('autonomous');
    setCreateMethod('ai');
  }, [open, lockJobFamily, skipCategory]);

  if (!open) return null;

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.id === jobFamily)?.label
    ?? JOB_FAMILY_FULL_LABELS[jobFamily];

  const handleConfirmStep1 = () => setStep(2);

  const handleConfirmCreate = () => {
    onConfirm({
      mode,
      createMethod,
      jobFamily,
      name: defaultNameFor(jobFamily),
      description: defaultDescFor(jobFamily, mode),
    });
  };

  const title =
    step === 1 ? '创建数字员工' : `创建${categoryLabel}数字员工`;
  const description =
    step === 1 ? '根据业务场景选择员工分类与能力架构' : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-[560px] rounded-[13px] bg-white shadow-[0_16px_48px_rgba(17,17,17,0.12)]',
          'flex flex-col max-h-[min(90vh,720px)] overflow-hidden',
        )}
      >
        {/* Header */}
        <header className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-neutral-100 shrink-0">
          <span
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white',
              SKILL_AOP_ACCENT_BG,
            )}
          >
            <Plus size={18} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold tracking-tight text-neutral-900 leading-snug">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-4">
          {step === 1 ? (
            <section>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white',
                      SKILL_AOP_ACCENT_BG,
                    )}
                  >
                    1
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    选择员工分类
                  </span>
                </div>
                <span className={cn('text-[12px] font-medium', SKILL_AOP_ACCENT_TEXT)}>
                  已选：{categoryLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = jobFamily === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setJobFamily(cat.id)}
                      aria-pressed={active}
                      className={cn(
                        'relative h-11 rounded-lg border text-[13px] font-medium transition cursor-pointer',
                        active
                          ? 'border-[#1565BF] bg-[rgba(21,101,191,0.04)] text-neutral-900'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
                      )}
                    >
                      {cat.label}
                      {active ? (
                        <span
                          className={cn(
                            'absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white',
                            SKILL_AOP_ACCENT_BG,
                          )}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="space-y-5">
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white',
                      SKILL_AOP_ACCENT_BG,
                    )}
                  >
                    1
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    选择员工类型
                  </span>
                </div>
                <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed">
                  请选择适合您业务场景的{categoryLabel}数字员工类型与构建模式
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUILD_OPTIONS.map((opt) => {
                    const active = mode === opt.id;
                    const Icon = opt.Icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMode(opt.id)}
                        aria-pressed={active}
                        className={cn(
                          'relative text-left rounded-[10px] border p-3.5 transition cursor-pointer',
                          active
                            ? 'border-[#1565BF] bg-[rgba(21,101,191,0.03)]'
                            : 'border-neutral-200 bg-white hover:border-neutral-300',
                        )}
                      >
                        {active ? (
                          <span
                            className={cn(
                              'absolute top-2.5 right-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white',
                              SKILL_AOP_ACCENT_BG,
                            )}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : null}
                        <div className="flex items-start gap-2.5 pr-5">
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              active
                                ? 'bg-[rgba(21,101,191,0.1)] text-[#1565BF]'
                                : 'bg-neutral-100 text-neutral-500',
                            )}
                          >
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13px] font-semibold text-neutral-900">
                                {opt.title}
                              </span>
                              {opt.recommended ? (
                                <span className="inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-semibold bg-[rgba(124,58,237,0.1)] text-[#7C3AED]">
                                  推荐
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
                              {opt.subtitle}
                            </p>
                            <p className="mt-1.5 text-[12px] text-neutral-600 leading-5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white',
                      SKILL_AOP_ACCENT_BG,
                    )}
                  >
                    2
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    选择创建方式
                  </span>
                </div>
                <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed">
                  选择通过 AI 智能引导对话生成基础资料，或直接手动在画布中配置
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {METHOD_OPTIONS.map((opt) => {
                    const active = createMethod === opt.id;
                    const Icon = opt.Icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCreateMethod(opt.id)}
                        aria-pressed={active}
                        className={cn(
                          'relative text-left rounded-[10px] border p-3.5 transition cursor-pointer',
                          active
                            ? 'border-[#1565BF] bg-[rgba(21,101,191,0.03)]'
                            : 'border-neutral-200 bg-white hover:border-neutral-300',
                        )}
                      >
                        {active ? (
                          <span
                            className={cn(
                              'absolute top-2.5 right-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white',
                              SKILL_AOP_ACCENT_BG,
                            )}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : null}
                        <div className="flex items-start gap-2.5 pr-5">
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              active
                                ? 'bg-[rgba(21,101,191,0.1)] text-[#1565BF]'
                                : 'bg-neutral-100 text-neutral-500',
                            )}
                          >
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[13px] font-semibold text-neutral-900">
                              {opt.title}
                            </span>
                            <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
                              {opt.subtitle}
                            </p>
                            <p className="mt-1.5 text-[12px] text-neutral-600 leading-5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100 shrink-0">
          {step === 2 && !skipCategory ? (
            <button
              type="button"
              className={cn(BTN_SOFT, 'mr-auto')}
              onClick={() => setStep(1)}
            >
              上一步
            </button>
          ) : null}
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            取消
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleConfirmStep1}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 px-3 rounded-[7px]',
                'text-xs font-semibold text-white cursor-pointer transition hover:opacity-90',
                SKILL_AOP_ACCENT_BG,
              )}
            >
              <Check size={14} strokeWidth={2.5} />
              确认创建
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmCreate}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 px-3 rounded-[7px]',
                'text-xs font-semibold text-white cursor-pointer transition hover:opacity-90',
                SKILL_AOP_ACCENT_BG,
              )}
            >
              <Check size={14} strokeWidth={2.5} />
              确认创建
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
};
