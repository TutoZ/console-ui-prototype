/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tooltip — 对齐 DongDesign jd-tooltip（effect / placement / size / trigger）
 * https://dongdesign.jd.com/vue/zh-CN/component/basic/tooltip.html
 * 实现基于 @base-ui/react/tooltip
 */

'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

export type TooltipEffect = 'dark' | 'light';
export type TooltipSize = 'small' | 'default';
export type TooltipTriggerMode = 'hover' | 'click' | 'focus';
export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

function placementToSideAlign(placement: TooltipPlacement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const [side, alignPart] = placement.split('-') as [
    'top' | 'bottom' | 'left' | 'right',
    'start' | 'end' | undefined,
  ];
  return { side, align: alignPart ?? 'center' };
}

const popupByEffect: Record<TooltipEffect, string> = {
  dark: 'bg-neutral-800 text-white border border-neutral-800',
  light: 'bg-white text-neutral-800 border border-neutral-200 shadow-[0_2px_8px_rgba(17,17,17,0.08)]',
};

const sizeClass: Record<TooltipSize, string> = {
  small: 'px-2 py-1 text-[11px] leading-[16px] rounded',
  default: 'px-2.5 py-1.5 text-[12px] leading-[18px] rounded-md',
};

function TooltipProvider({ delay = 200, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function TooltipRoot(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipPortal(props: TooltipPrimitive.Portal.Props) {
  return <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />;
}

function TooltipPositioner({
  className,
  ...props
}: TooltipPrimitive.Positioner.Props) {
  return (
    <TooltipPrimitive.Positioner
      data-slot="tooltip-positioner"
      className={cn('z-[260] outline-none', className)}
      {...props}
    />
  );
}

function TooltipPopup({
  className,
  effect = 'dark',
  size = 'default',
  ...props
}: TooltipPrimitive.Popup.Props & { effect?: TooltipEffect; size?: TooltipSize }) {
  return (
    <TooltipPrimitive.Popup
      data-slot="tooltip-popup"
      className={cn(
        'max-w-[240px] font-sans whitespace-normal break-words outline-none',
        'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
        'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        popupByEffect[effect],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({
  className,
  effect = 'dark',
  ...props
}: TooltipPrimitive.Arrow.Props & { effect?: TooltipEffect }) {
  return (
    <TooltipPrimitive.Arrow
      data-slot="tooltip-arrow"
      className={cn(
        'size-2.5 rotate-45 rounded-[1px]',
        effect === 'dark' ? 'bg-neutral-800' : 'bg-white border border-neutral-200',
        'data-[side=bottom]:-top-1 data-[side=top]:-bottom-1 data-[side=left]:-right-1 data-[side=right]:-left-1',
        className,
      )}
      {...props}
    />
  );
}

export type AppTooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  effect?: TooltipEffect;
  placement?: TooltipPlacement;
  size?: TooltipSize;
  /** hover 默认；click 时受控开关（对齐 jd-tooltip trigger） */
  trigger?: TooltipTriggerMode;
  /** 对齐 jd-tooltip strategy */
  strategy?: 'absolute' | 'fixed';
  className?: string;
  disabled?: boolean;
};

/**
 * 便捷封装 — 映射 jd-tooltip：effect / placement / size / trigger / strategy
 */
export function AppTooltip({
  content,
  children,
  effect = 'dark',
  placement = 'top',
  size = 'default',
  trigger = 'hover',
  strategy = 'absolute',
  className,
  disabled = false,
}: AppTooltipProps) {
  const { side, align } = placementToSideAlign(placement);
  const [open, setOpen] = React.useState(false);
  const isClick = trigger === 'click';

  return (
    <TooltipRoot
      disabled={disabled}
      open={isClick ? open : undefined}
      onOpenChange={isClick ? setOpen : undefined}
    >
      <TooltipTrigger
        delay={isClick ? 0 : undefined}
        closeOnClick={!isClick}
        className={cn('inline-flex', className)}
        render={children}
        onClick={
          isClick
            ? (e) => {
                e.preventDefault();
                setOpen((v) => !v);
              }
            : undefined
        }
      />
      <TooltipPortal>
        <TooltipPositioner
          side={side}
          align={align}
          sideOffset={8}
          positionMethod={strategy}
        >
          <TooltipPopup effect={effect} size={size}>
            <TooltipArrow effect={effect} />
            {content}
          </TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </TooltipRoot>
  );
}

export {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
};
