/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一返回导航：ArrowLeft + 文案。
 * - text：弹窗 / 子视图内联链接（SkillCreateWorkspace、KnowledgeBaseWorkspace modal）
 * - soft：工作区顶栏 BTN_SOFT 风格（OnboardingWorkspaceHeader、BuildSkillModal）
 */

import React from 'react';
import { ArrowLeft } from '@/lib/icons';
import { BTN_SOFT } from '@/lib/ui';
import { cn } from '@/lib/utils';

export interface NavBackButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'text' | 'soft';
  className?: string;
}

export const NavBackButton: React.FC<NavBackButtonProps> = ({
  onClick,
  label = '返回',
  variant = 'text',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        variant === 'soft'
          ? cn(BTN_SOFT, 'shrink-0 gap-1.5 text-neutral-500 hover:text-neutral-800')
          : 'inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 cursor-pointer transition',
        className,
      )}
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
};
