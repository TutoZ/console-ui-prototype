/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检计划“查看数据”— 统计卡 + 会话明细表（对齐设计稿）
 */

import React, { useMemo } from 'react';
import { ArrowLeft } from '@/lib/icons';
import { PANEL, badgeClass } from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  formatPlanPeriod,
  type QcAuditTicket,
  type QcAuditTicketStatus,
  type QcPlan,
  type QcPlanStatus,
} from '@/lib/qcWorkspaceMock';

const PLAN_STATUS_LABEL: Record<QcPlanStatus, string> = {
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
};

const TICKET_STATUS_LABEL: Record<QcAuditTicketStatus, string> = {
  warning: '需关注',
  pending: '待处理',
  resolved: '已处理',
};

function statusBadgeTone(status: QcPlanStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'running') return 'success';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

function ticketStatusClass(status: QcAuditTicketStatus) {
  if (status === 'warning') return 'text-amber-600 font-semibold';
  if (status === 'pending') return 'text-live font-semibold';
  return 'text-neutral-500 font-medium';
}

function shortSourceLine(plan: QcPlan) {
  if (plan.source === 'platform_cs_sessions') return '本平台 · 客服数字员工会话';
  return plan.sourceLabel;
}

interface QcPlanDataViewProps {
  plan: QcPlan;
  tickets: QcAuditTicket[];
  agentNameById: Map<string, string>;
  onBack: () => void;
  onViewSession: (ticketId: string) => void;
}

export const QcPlanDataView: React.FC<QcPlanDataViewProps> = ({
  plan,
  tickets,
  agentNameById,
  onBack,
  onViewSession,
}) => {
  const stats = useMemo(() => {
    const warning = tickets.filter((t) => t.status === 'warning').length;
    const pending = tickets.filter((t) => t.status === 'pending').length;
    const avgFromTickets =
      tickets.length > 0
        ? Math.round(
            tickets.reduce((sum, t) => sum + (t.audit.score ?? 0), 0) / tickets.length,
          )
        : plan.averageScore;
    return {
      total: plan.totalVolume,
      inspected: plan.inspectedVolume,
      sessions: tickets.length,
      warning,
      pending,
      avg: avgFromTickets,
    };
  }, [plan, tickets]);

  const metricCards = [
    { label: '质检总量', value: stats.total },
    { label: '已质检', value: stats.inspected },
    { label: '会话单', value: stats.sessions },
    { label: '需关注', value: stats.warning, tone: 'warning' as const },
    { label: '待处理', value: stats.pending, tone: 'live' as const },
    { label: '平均分', value: stats.avg },
  ];

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto p-5 custom-scrollbar bg-white">
      <div className={cn(PANEL, 'p-5 space-y-5')}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[7px] text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 cursor-pointer shrink-0"
          >
            <ArrowLeft size={15} />
            返回
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-semibold text-neutral-900 leading-snug">
                {plan.name}
              </h2>
              <span className={cn(badgeClass(statusBadgeTone(plan.status)), 'text-[11px]')}>
                {PLAN_STATUS_LABEL[plan.status]}
              </span>
            </div>
            <p className="text-[12px] text-neutral-500 mt-1.5">
              {formatPlanPeriod(plan.startAt, plan.endAt, plan.status)} · {shortSourceLine(plan)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metricCards.map((m) => (
            <div
              key={m.label}
              className="rounded-[10px] border border-neutral-200 bg-white px-3 py-3"
            >
              <p className="text-[11px] text-neutral-500">{m.label}</p>
              <p
                className={cn(
                  'text-[22px] font-bold tabular-nums mt-1 leading-none',
                  m.tone === 'warning' && 'text-amber-600',
                  m.tone === 'live' && 'text-live',
                  !m.tone && 'text-neutral-900',
                )}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-[14px] font-semibold text-neutral-900">数据明细</h3>
            <span className="text-[12px] text-neutral-500 tabular-nums">
              共 {tickets.length} 条
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-neutral-200 py-14 text-center text-[13px] text-neutral-500">
              当前计划暂无会话质检单（运行中计划才会入队）
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-neutral-200">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 text-[12px] text-neutral-500">
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">会话ID</th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">
                      数字员工
                    </th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">状态</th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">质检分</th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">命中项</th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200">
                      创建时间
                    </th>
                    <th className="font-medium px-3 py-2.5 border-b border-neutral-200 w-[88px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const agentName =
                      agentNameById.get(t.session.assignedAgentId) ?? t.session.customerName;
                    return (
                      <tr
                        key={t.id}
                        className="text-[12px] text-neutral-800 hover:bg-neutral-50/80 transition-colors"
                      >
                        <td className="px-3 py-2.5 border-b border-neutral-100 font-mono text-[11px] text-neutral-700">
                          {t.session.id}
                        </td>
                        <td className="px-3 py-2.5 border-b border-neutral-100">{agentName}</td>
                        <td
                          className={cn(
                            'px-3 py-2.5 border-b border-neutral-100',
                            ticketStatusClass(t.status),
                          )}
                        >
                          {TICKET_STATUS_LABEL[t.status]}
                        </td>
                        <td className="px-3 py-2.5 border-b border-neutral-100 tabular-nums">
                          {t.audit.score}
                        </td>
                        <td className="px-3 py-2.5 border-b border-neutral-100 tabular-nums">
                          {t.audit.hits?.length ?? 0}
                        </td>
                        <td className="px-3 py-2.5 border-b border-neutral-100 tabular-nums text-neutral-600">
                          {t.createdAt}
                        </td>
                        <td className="px-3 py-2.5 border-b border-neutral-100">
                          <button
                            type="button"
                            className="text-live font-medium hover:underline cursor-pointer"
                            onClick={() => onViewSession(t.id)}
                          >
                            查看会话
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
