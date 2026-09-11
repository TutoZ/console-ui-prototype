/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 左侧表单扫描态 — 居中渐变扫描线上下往复
 */

import React from 'react';
import { Info } from '@/lib/icons';
import { cn } from '@/lib/utils';

export type SkillFormScanOverlayProps = {
  title?: string;
  message?: string;
  hint?: string;
  className?: string;
};

export const SkillFormScanOverlay: React.FC<SkillFormScanOverlayProps> = ({
  title = '选择主体',
  message = '主体检测中',
  hint = 'AI 正在分析并写入表单内容，请稍候…',
  className,
}) => {
  return (
    <div
      className={cn('relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-md bg-white', className)}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h3 className="text-[16px] font-medium leading-[22px] text-[#191B1E]">{title}</h3>
      </div>

      <div className="relative flex-1 min-h-[280px] overflow-hidden mx-4 mb-4 rounded-md border border-[#E9EAEB] bg-white">
        <div className="skill-form-scan-stage absolute inset-0" aria-hidden>
          <div className="skill-form-scan-line" />
        </div>

        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <p className="text-[14px] leading-5 text-[#717680] whitespace-nowrap">{message}</p>
        </div>
      </div>

      {hint ? (
        <div className="px-4 pb-4 shrink-0 flex items-start gap-2.5">
          <Info size={14} className="text-[#848B99] shrink-0 mt-0.5" aria-hidden />
          <p className="text-[12px] leading-4 text-[#848B99]">{hint}</p>
        </div>
      ) : null}
    </div>
  );
};
