import React from 'react';
import { PAGE } from '../ui';
import { cn } from '../cn';

export const ONLINE_PAGE = cn(PAGE, 'overflow-y-auto custom-scrollbar');

/** 非 PAGE 壳时页头外层顶边距，与 ONLINE_PAGE（p-5）对齐 */
export const PAGE_HEADER_INSET = 'px-5 pt-5';

/** 页头：左标题 + 右搜索/筛选/主操作 */
export function OnlinePageHeader({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-5', className)}>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight shrink-0">
        {title}
      </h1>
      {children ? (
        <div className="flex flex-wrap items-center justify-end gap-3 min-w-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated 优先使用 OnlinePageHeader；仅右侧操作区兼容旧用法 */
export function OnlinePageToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
        {children}
      </div>
    </div>
  );
}

export function OnlineSectionHeader({
  title,
  description,
  icon,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {description ? (
          <p className="text-[13px] text-neutral-500 mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export const onlineTableClass = {
  wrap: 'overflow-x-auto',
  table: 'w-full text-left border-collapse text-[12px] text-neutral-800',
  headRow: 'border-b border-neutral-200 text-[10px] text-neutral-500 font-medium',
  thFirst: 'px-1 py-2.5 pr-4 whitespace-nowrap',
  th: 'px-4 py-2.5 whitespace-nowrap',
  thLast: 'px-4 py-2.5 pl-4 pr-1 whitespace-nowrap text-right',
  body: 'divide-y divide-neutral-100',
  row: 'hover:bg-neutral-50/80 transition duration-150',
  tdFirst: 'px-1 py-3 pr-4 align-top',
  td: 'px-4 py-3 align-top',
  tdLast: 'px-4 py-3 pl-4 pr-1 align-top text-right',
};

export function OnlineEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-[13px] text-neutral-500">
        {children}
      </td>
    </tr>
  );
}
