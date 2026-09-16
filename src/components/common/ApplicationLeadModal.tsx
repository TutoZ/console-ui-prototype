/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一申请留资弹窗（域权限开通 / 认证加急等）
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, X } from '@/lib/icons';
import { MODAL_OVERLAY, MODAL_PANEL, SELECT_TRIGGER } from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PHONE_RE = /^1\d{10}$/;

const LEAD_LABEL = 'block text-[12px] font-semibold text-neutral-900 mb-1';
const LEAD_FIELD =
  'w-full h-9 rounded-[7px] border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-neutral-300 disabled:opacity-50';

export const COMPANY_SCALE_OPTIONS = [
  { value: '1-50', label: '1-50 人' },
  { value: '51-200', label: '51-200 人' },
  { value: '201-500', label: '201-500 人' },
  { value: '500+', label: '500 人以上' },
] as const;

export const BUSINESS_SCENARIO_OPTIONS = [
  { value: 'customer_service', label: '客服' },
  { value: 'telesales', label: '电销' },
  { value: 'acquisition', label: '获客' },
  { value: 'enterprise', label: '企业管理' },
  { value: 'other', label: '其他' },
] as const;

export const URGENCY_OPTIONS = [
  { value: 'high', label: '非常紧急' },
  { value: 'medium', label: '一般' },
  { value: 'low', label: '暂不紧急' },
] as const;

export type ApplicationLeadForm = {
  name: string;
  company: string;
  jobTitle: string;
  companyScale: string;
  businessScenario: string;
  urgency: string;
  phone: string;
  /** @deprecated 已取消短信验证，保留字段兼容旧调用方 */
  verifyCode: string;
  message: string;
};

export type ApplicationLeadPayload = ApplicationLeadForm & {
  businessScenarioLabel: string;
  companyScaleLabel: string;
  urgencyLabel: string;
};

type FormKey = keyof ApplicationLeadForm;

const emptyForm = (): ApplicationLeadForm => ({
  name: '',
  company: '',
  jobTitle: '',
  companyScale: '',
  businessScenario: '',
  urgency: '',
  phone: '',
  verifyCode: '',
  message: '',
});

function optionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

function LeadField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LEAD_LABEL} htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}

export const ApplicationLeadModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmitted?: (payload: ApplicationLeadPayload) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  successTitle?: string;
  successDescription?: string;
  defaults?: Partial<ApplicationLeadForm>;
  defaultBusinessScenario?: string;
}> = ({
  open,
  onClose,
  onSubmitted,
  title,
  description,
  submitLabel = '提交申请',
  successTitle = '申请已提交',
  successDescription = '顾问将在 1 个工作日内联系您，协助完成后续配置。',
  defaults,
  defaultBusinessScenario,
}) => {
  const [form, setForm] = useState<ApplicationLeadForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm(),
      ...defaults,
      businessScenario: defaults?.businessScenario ?? defaultBusinessScenario ?? '',
      verifyCode: '',
    });
    setErrors({});
    setSubmitting(false);
    setDone(false);
  }, [open, defaults, defaultBusinessScenario]);

  const updateField = (key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const next: Partial<Record<FormKey, string>> = {};
    if (!form.name.trim()) next.name = '请填写姓名';
    if (!form.company.trim()) next.company = '请填写公司';
    if (!form.jobTitle.trim()) next.jobTitle = '请填写岗位';
    if (!form.companyScale) next.companyScale = '请选择企业规模';
    if (!form.businessScenario) next.businessScenario = '请选择业务场景';
    if (!form.urgency) next.urgency = '请选择紧急程度';
    if (!PHONE_RE.test(form.phone.trim())) next.phone = '请填写有效的 11 位手机号';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    window.setTimeout(() => {
      const payload: ApplicationLeadPayload = {
        ...form,
        name: form.name.trim(),
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        phone: form.phone.trim(),
        verifyCode: '',
        message: form.message.trim(),
        businessScenarioLabel: optionLabel(BUSINESS_SCENARIO_OPTIONS, form.businessScenario),
        companyScaleLabel: optionLabel(COMPANY_SCALE_OPTIONS, form.companyScale),
        urgencyLabel: optionLabel(URGENCY_OPTIONS, form.urgency),
      };
      setSubmitting(false);
      setDone(true);
      onSubmitted?.(payload);
    }, 700);
  };

  if (!open) return null;

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[130]')} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, 'max-w-[440px] p-4 sm:p-5 max-h-[min(720px,calc(100vh-2rem))] overflow-y-auto')}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={done ? successTitle : title}
      >
        <div className="mb-3.5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-[16px] font-semibold tracking-tight text-neutral-900 leading-snug">
              {done ? successTitle : title}
            </h2>
            <button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="shrink-0 -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
          {description && !done ? (
            <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed pr-6">{description}</p>
          ) : null}
          {done && successDescription ? (
            <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed pr-6">{successDescription}</p>
          ) : null}
        </div>

        {done ? (
          <div className="rounded-[10px] border border-emerald-100 bg-emerald-50 px-3.5 py-4 flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white text-emerald-600 border border-emerald-100">
              <Check size={15} />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] font-semibold text-neutral-900">留资成功</p>
              <p className="text-[12px] text-neutral-600 leading-relaxed">
                已登记 {form.company || '企业'} · {form.phone}，顾问将尽快与您联系。
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LeadField id="lead-name" label="姓名" error={errors.name}>
                <input
                  id="lead-name"
                  className={LEAD_FIELD}
                  placeholder="您的称呼"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  maxLength={20}
                  autoComplete="name"
                />
              </LeadField>
              <LeadField id="lead-company" label="公司" error={errors.company}>
                <input
                  id="lead-company"
                  className={LEAD_FIELD}
                  placeholder="所在公司"
                  value={form.company}
                  onChange={(event) => updateField('company', event.target.value)}
                  maxLength={40}
                  autoComplete="organization"
                />
              </LeadField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LeadField id="lead-job" label="岗位" error={errors.jobTitle}>
                <input
                  id="lead-job"
                  className={LEAD_FIELD}
                  placeholder="您的职位"
                  value={form.jobTitle}
                  onChange={(event) => updateField('jobTitle', event.target.value)}
                  maxLength={30}
                />
              </LeadField>
              <LeadField id="lead-urgency" label="紧急程度" error={errors.urgency}>
                <Select
                  value={form.urgency || null}
                  onValueChange={(value) => value && updateField('urgency', value)}
                >
                  <SelectTrigger
                    id="lead-urgency"
                    className={cn(SELECT_TRIGGER, 'w-full h-9 justify-between text-[13px]')}
                    aria-label="紧急程度"
                  >
                    <SelectValue placeholder="请选择紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LeadField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LeadField id="lead-scale" label="企业规模" error={errors.companyScale}>
                <Select
                  value={form.companyScale || null}
                  onValueChange={(value) => value && updateField('companyScale', value)}
                >
                  <SelectTrigger
                    id="lead-scale"
                    className={cn(SELECT_TRIGGER, 'w-full h-9 justify-between text-[13px]')}
                    aria-label="企业规模"
                  >
                    <SelectValue placeholder="请选择企业规模" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SCALE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LeadField>

              <LeadField id="lead-scenario" label="业务场景" error={errors.businessScenario}>
                <Select
                  value={form.businessScenario || null}
                  onValueChange={(value) => value && updateField('businessScenario', value)}
                >
                  <SelectTrigger
                    id="lead-scenario"
                    className={cn(SELECT_TRIGGER, 'w-full h-9 justify-between text-[13px]')}
                    aria-label="业务场景"
                  >
                    <SelectValue placeholder="请选择业务场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_SCENARIO_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LeadField>
            </div>

            <LeadField id="lead-phone" label="手机号" error={errors.phone}>
              <input
                id="lead-phone"
                className={LEAD_FIELD}
                placeholder="11 位手机号"
                value={form.phone}
                onChange={(event) =>
                  updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 11))
                }
                inputMode="numeric"
                autoComplete="tel"
              />
            </LeadField>

            <LeadField id="lead-message" label="留言（选填）">
              <textarea
                id="lead-message"
                className={cn(LEAD_FIELD, 'min-h-[64px] h-auto resize-y py-2')}
                placeholder="简要描述您的业务场景或问题"
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                maxLength={200}
              />
            </LeadField>

            <div className="pt-0.5">
              <button
                type="button"
                className="w-full h-10 inline-flex items-center justify-center gap-2.5 rounded-full bg-neutral-900 text-white text-[14px] font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <span>{submitting ? '提交中…' : submitLabel}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-900">
                  <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              </button>
              <p className="mt-2 text-center text-[11px] text-neutral-400 leading-relaxed">
                提交即代表您同意我们的隐私政策与服务协议
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
