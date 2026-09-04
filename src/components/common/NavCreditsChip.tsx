/**
 * 导航底栏 / 顶栏：资源积分入口（各布局版本共用）
 */

import React from 'react';
import { cn } from '@/lib/utils';

/** 演示用资源积分 */
export const DEMO_CREDITS = 5200;

type NavCreditsChipProps = {
  /** full：宽侧栏/顶栏；compact：窄轨折叠态 */
  variant?: 'full' | 'compact';
  className?: string;
  onClick?: () => void;
};

export const NavCreditsChip: React.FC<NavCreditsChipProps> = ({
  variant = 'full',
  className,
  onClick,
}) => {
  if (variant === 'compact') {
    return (
      <button
        type="button"
        title={`积分：${DEMO_CREDITS}`}
        onClick={onClick}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-[10px] border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer',
          className,
        )}
      >
        分
      </button>
    );
  }

  return (
    <button
      type="button"
      title="资源消耗"
      onClick={onClick}
      className={cn(
        'flex items-center rounded-xl border border-neutral-200 bg-white px-3 h-9 hover:bg-neutral-50/80 transition cursor-pointer',
        className,
      )}
    >
      <span className="text-[12px] font-medium text-neutral-800 tabular-nums whitespace-nowrap">
        积分：{DEMO_CREDITS.toLocaleString('zh-CN')}
      </span>
    </button>
  );
};
