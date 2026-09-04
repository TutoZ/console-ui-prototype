/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检运营应用 — 计划看板（对齐设计稿：顶 Tab + 筛选 + 计划卡片）
 */

import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Search } from '@/lib/icons';
import {
  BTN_INK,
  BTN_OUTLINE,
  CARD,
  SEARCH_FIELD,
  SELECT_TRIGGER,
  badgeClass,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QcPlan, QcPlanStatus } from '@/lib/qcWorkspaceMock';
import { OnlinePageHeader, PAGE_HEADER_INSET } from './common/OnlinePageLayout';

const STATUS_FILTERS = [
  { key: 'all' as const, label: '全部状态' },
  { key: 'running' as const, label: '运行中' },
  { key: 'paused' as const, label: '已暂停' },
  { key: 'completed' as const, label: '已完成' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['key'];

const PLAN_STATUS_LABEL: Record<QcPlanStatus, string> = {
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
};

function shortSource(plan: QcPlan) {
  return plan.source === 'platform_cs_sessions' ? '本平台' : '外部';
}

function shortScope(plan: QcPlan) {
  return plan.targetScope === 'all_online_cs' ? '全部员工' : '指定员工';
}

function shortDate(raw: string) {
  return raw.slice(0, 10);
}

function statusBadgeTone(status: QcPlanStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'running') return 'success';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

interface QcPlanBoardProps {
  plans: QcPlan[];
  onCreatePlan: () => void;
  onViewData: (planId: string) => void;
  onToggleRun: (planId: string, next: 'running' | 'paused') => void;
  onDeletePlan: (planId: string) => void;
}

export const QcPlanBoard: React.FC<QcPlanBoardProps> = ({
  plans,
  onCreatePlan,
  onViewData,
  onToggleRun,
  onDeletePlan,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [menuPlanId, setMenuPlanId] = useState<string | null>(null);

  const statusLabel =
    STATUS_FILTERS.find((o) => o.key === statusFilter)?.label ?? '全部状态';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.updatedBy ?? ''} ${p.inspectorName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [plans, statusFilter, search]);

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
      <div className={cn('shrink-0', PAGE_HEADER_INSET)}>
        <OnlinePageHeader title="质检计划">
          <Select
            value={statusFilter}
            onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选计划状态">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_FILTERS.map(({ key, label }) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="relative inline-flex items-center">
            <Search
              size={14}
              className="absolute left-2.5 text-neutral-400 pointer-events-none"
            />
            <input
              className={cn(SEARCH_FIELD, 'pl-8 w-[240px]')}
              type="search"
              placeholder="搜索计划名称 / 修改人"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <button type="button" className={cn(BTN_INK, 'h-8 px-3.5')} onClick={onCreatePlan}>
            + 新建质检计划
          </button>
        </OnlinePageHeader>
      </div>

      {/* 计划卡片栅格 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-3 text-neutral-500">
            <p className="text-sm">暂无匹配的质检计划</p>
            <button type="button" className={cn(BTN_INK, 'h-8 px-3')} onClick={onCreatePlan}>
              + 新建质检计划
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((plan) => {
              const menuOpen = menuPlanId === plan.id;
              return (
                <article
                  key={plan.id}
                  className={cn(CARD, 'flex flex-col p-4 gap-3 relative')}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <h3 className="flex-1 min-w-0 text-[14px] font-semibold text-neutral-900 truncate leading-snug">
                      {plan.name}
                    </h3>
                    <span
                      className={cn(
                        badgeClass(statusBadgeTone(plan.status)),
                        'shrink-0 text-[11px] font-medium',
                      )}
                    >
                      {PLAN_STATUS_LABEL[plan.status]}
                    </span>
                  </div>

                  <p className="text-[12px] text-neutral-500 truncate leading-relaxed">
                    {shortSource(plan)} · {shortScope(plan)} ·{' '}
                    {plan.updatedBy ?? plan.inspectorName} · {shortDate(plan.createdAt)}
                  </p>

                      <p className="text-[12px] text-neutral-600 tabular-nums">
                        已检 {plan.inspectedVolume}/{plan.totalVolume} · 均分{' '}
                        {plan.averageScore} · 预警 {plan.warningCount}
                      </p>

                      <div className="mt-auto pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            BTN_OUTLINE,
                            'h-8 px-3 text-[12px] text-live border-sky-200 hover:bg-sky-50',
                          )}
                          onClick={() => onViewData(plan.id)}
                        >
                          查看数据
                        </button>
                        {plan.status === 'running' ? (
                          <button
                            type="button"
                            className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}
                            onClick={() => onToggleRun(plan.id, 'paused')}
                          >
                            暂停
                          </button>
                        ) : plan.status === 'paused' ? (
                          <button
                            type="button"
                            className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}
                            onClick={() => onToggleRun(plan.id, 'running')}
                          >
                            开始
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}
                            onClick={() => onToggleRun(plan.id, 'running')}
                          >
                            重新开始
                          </button>
                        )}

                        <div className="relative ml-auto">
                          <button
                            type="button"
                            aria-label="更多操作"
                            className={cn(
                              BTN_OUTLINE,
                              'h-8 w-8 px-0',
                              menuOpen && 'bg-neutral-50',
                            )}
                            onClick={() =>
                              setMenuPlanId((id) => (id === plan.id ? null : plan.id))
                            }
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {menuOpen && (
                            <>
                              <button
                                type="button"
                                aria-label="关闭菜单"
                                className="fixed inset-0 z-20 cursor-default bg-transparent"
                                onClick={() => setMenuPlanId(null)}
                              />
                              <div className="absolute right-0 bottom-9 z-30 min-w-[120px] rounded-[10px] border border-neutral-200 bg-white p-1 shadow-[0_2px_10px_rgba(31,35,41,0.08)]">
                                <button
                                  type="button"
                                  className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                  onClick={() => {
                                    setMenuPlanId(null);
                                    onViewData(plan.id);
                                  }}
                                >
                                  查看数据
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  onClick={() => {
                                    setMenuPlanId(null);
                                    onDeletePlan(plan.id);
                                  }}
                                >
                                  删除计划
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
    </div>
  );
};
