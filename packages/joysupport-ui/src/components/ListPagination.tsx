import React from 'react';
import { cn } from '../cn';

export const LIST_PAGE_SIZE = 10;

export function paginateItems<T>(items: T[], page: number, pageSize = LIST_PAGE_SIZE): T[] {
  if (items.length <= pageSize) return items;
  return items.slice((page - 1) * pageSize, page * pageSize);
}

export function getTotalPages(count: number, pageSize = LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

export interface ListPaginationProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const ListPagination: React.FC<ListPaginationProps> = ({
  total,
  page,
  pageSize = LIST_PAGE_SIZE,
  onPageChange,
  className,
}) => {
  if (total <= pageSize) return null;

  const totalPages = getTotalPages(total, pageSize);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-500',
        className,
      )}
    >
      <span>共 {total} 条</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-2 py-1 rounded-md border border-neutral-200 disabled:opacity-40 cursor-pointer hover:bg-neutral-100 transition"
        >
          上一页
        </button>
        <span className="px-2 py-1 rounded-md bg-ink text-white font-bold tabular-nums">
          {page}
        </span>
        <span className="text-neutral-500/70 tabular-nums">/ {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="px-2 py-1 rounded-md border border-neutral-200 disabled:opacity-40 cursor-pointer hover:bg-neutral-100 transition"
        >
          下一页
        </button>
        <span className="ml-1">{pageSize} 条/页</span>
      </div>
    </div>
  );
};
