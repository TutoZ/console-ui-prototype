/**
 * 全站默认圆环加载 — 墨黑 / 中性色（设计系统 primary #111）。
 */

import React from 'react';
import { cn } from '../cn';

export type LoadingCircleProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onDark?: boolean;
  title?: string;
};

export function LoadingCircle({
  size = 16,
  className,
  style,
  onDark = false,
  title,
}: LoadingCircleProps) {
  return (
    <span
      title={title}
      role={title ? 'status' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn(
        'inline-block shrink-0 rounded-full border-2 animate-spin box-border',
        onDark
          ? 'border-white/25 border-t-white'
          : 'border-neutral-200 border-t-neutral-800',
        className,
      )}
      style={{ width: size, height: size, ...style }}
    />
  );
}

/** @deprecated 保留常量以免外部引用报错；加载态已改为 CSS 圆环 */
export const LOADING_CIRCLE_SRC = '';
