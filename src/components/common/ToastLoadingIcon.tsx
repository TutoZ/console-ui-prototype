/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Toast 加载圈 — 与 Sonner 加载态一致
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TOAST_ICON } from '@/lib/toastAssets';

type ToastLoadingIconProps = {
  size?: number;
  className?: string;
  /** 深色按钮等场景：图标反色为白 */
  onDark?: boolean;
};

export function ToastLoadingIcon({
  size = 16,
  className,
  onDark = false,
}: ToastLoadingIconProps) {
  return (
    <img
      src={TOAST_ICON.loading}
      alt=""
      width={size}
      height={size}
      className={cn(
        'shrink-0 animate-spin object-contain',
        onDark && 'brightness-0 invert',
        className,
      )}
      aria-hidden
    />
  );
}
