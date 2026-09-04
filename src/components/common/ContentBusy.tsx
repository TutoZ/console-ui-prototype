/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 区块级加载占位：只盖住需要加载的那一块；中间仅一个小圆环。
 */

import React from 'react';
import { cn } from '@/lib/utils';

/** inline 按钮旁 / slot 列表空位 / panel 主内容区 */
export const LOADER_SIZE = {
  inline: 14,
  slot: 18,
  panel: 20,
} as const;

export type ContentBusySize = number | keyof typeof LOADER_SIZE;

export type ContentBusyProps = {
  busy: boolean;
  children?: React.ReactNode;
  className?: string;
  /** 默认 slot；列表区可用 panel；按钮内用 inline */
  size?: ContentBusySize;
  label?: string;
  /** busy 时半透明保留底层（少用） */
  keepChildren?: boolean;
  /** 列表/表体最小占位高度，避免布局跳动 */
  minHeight?: number | string;
};

function resolveSize(size: ContentBusySize): number {
  if (typeof size === 'number') return size;
  return LOADER_SIZE[size];
}

/** 极简圆环加载 */
function BusyCircle({ size, title }: { size: number; title: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border-2 border-neutral-200 border-t-neutral-500 animate-spin"
      style={{ width: size, height: size }}
      title={title}
      aria-hidden
    />
  );
}

export const ContentBusy: React.FC<ContentBusyProps> = ({
  busy,
  children,
  className,
  size = 'slot',
  label,
  keepChildren = false,
  minHeight,
}) => {
  if (!busy) return <>{children}</>;

  const px = resolveSize(size);
  const loader = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-neutral-500 w-full',
        !minHeight && 'py-8',
        keepChildren && 'absolute inset-0 z-[1] bg-white/75',
        className,
      )}
      style={minHeight != null ? { minHeight } : undefined}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <BusyCircle size={px} title={label || '加载中'} />
      {label ? <p className="text-[12px] leading-none">{label}</p> : null}
    </div>
  );

  if (!keepChildren) return loader;

  return (
    <div className="relative w-full" style={minHeight != null ? { minHeight } : undefined}>
      <div className="opacity-35 pointer-events-none select-none" aria-hidden>
        {children}
      </div>
      {loader}
    </div>
  );
};
