import React from 'react';
import { SEGMENTED_BAR, segmentedItemClass } from '../ui';
import { cn } from '../cn';

/** @deprecated 请优先用 SEGMENTED_BAR */
export const SEGMENTED_TAB_BAR_CLASS = SEGMENTED_BAR;

export function segmentedTabButtonClass(active: boolean, className?: string) {
  return cn(segmentedItemClass(active), className);
}

export interface SegmentedTabOption {
  id: string;
  label: React.ReactNode;
  onSelect?: () => void;
}

export interface SegmentedTabBarProps {
  items: SegmentedTabOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  stretch?: boolean;
  ariaLabel?: string;
}

/** 受控分段切换（无业务 Context 依赖） */
export const SegmentedTabBar: React.FC<SegmentedTabBarProps> = ({
  items,
  value,
  onChange,
  className,
  stretch,
  ariaLabel,
}) => (
  <nav
    className={cn(SEGMENTED_BAR, stretch && 'w-full', className)}
    aria-label={ariaLabel}
  >
    {items.map((item) => {
      const isActive = value === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onChange(item.id);
            item.onSelect?.();
          }}
          className={segmentedTabButtonClass(isActive, stretch ? 'flex-1' : undefined)}
        >
          {item.label}
        </button>
      );
    })}
  </nav>
);
