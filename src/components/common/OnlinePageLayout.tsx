/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * “在线客服”域及通用配置列表页统一布局（接待记录 / 员工知识 / 账号管理等）
 */

import React from 'react';
import { PAGE, TABLE } from '@/lib/ui';
import { cn } from '@/lib/utils';

export const ONLINE_PAGE = cn(PAGE, 'overflow-y-auto custom-scrollbar');

/**
 * 非 PAGE 壳时页头外层顶边距，与“数字员工技能”等 ONLINE_PAGE（p-5）对齐。
 */
export const PAGE_HEADER_INSET = 'px-5 pt-5';

/** @deprecated 使用 lib/ui 的 TABLE；保留别名兼容旧 import */
export const onlineTableClass = TABLE;

/** 在线域页头：左标题 + 右搜索/筛选/主操作（对齐员工知识截图排版） */
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

/** 顶栏：仅右侧操作区（无页面标题，旧页兼容） */
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

/** 区块标题（筛选区、列表区等） */
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

export function OnlineEmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-[13px] text-neutral-500">
        {children}
      </td>
    </tr>
  );
}
