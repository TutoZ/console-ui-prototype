import React from 'react';
import { cn } from '../cn';

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
  size?: ContentBusySize;
  label?: string;
  keepChildren?: boolean;
  minHeight?: number | string;
};

function resolveSize(size: ContentBusySize): number {
  if (typeof size === 'number') return size;
  return LOADER_SIZE[size];
}

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
