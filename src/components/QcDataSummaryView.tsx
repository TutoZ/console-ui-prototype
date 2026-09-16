/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检应用 — 数据汇总（筛选条 + 会话表，布局对齐接待记录）
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from '@/lib/icons';
import {
  BTN_INK,
  BTN_SOFT,
  FIELD,
  FIELD_CTRL,
  SELECT_TRIGGER,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { ChatSession, HiredAgent } from '@/src/types';
import { isQcAgent } from '@/lib/jobFamily';
import {
  ONLINE_PAGE,
  OnlineEmptyRow,
  OnlineFilterField,
  OnlinePageHeader,
  OnlineSectionHeader,
  onlineTableClass,
} from './common/OnlinePageLayout';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateTimeLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function rangeFor(kind: DatePreset): { from: string; to: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  if (kind === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (kind === 'week') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
  }
  return { from: formatDateTimeLocal(start), to: formatDateTimeLocal(end) };
}

function channelLabel(channel?: ChatSession['channel']) {
  if (channel === 'web') return 'webchat';
  if (channel === 'chat') return 'chat';
  if (channel === 'link') return 'link';
  return 'webchat';
}

function statusLabel(status: ChatSession['status']) {
  if (status === 'completed') return '结束';
  if (status === 'queued') return '排队';
  if (status === 'manual') return '人工中';
  return '接待中';
}

function transferSuccess(s: ChatSession): 'yes' | 'no' | null {
  if (!s.isTransferred) return null;
  return s.assignedStaffId ? 'yes' : 'no';
}

function satisfactionLabel(s: ChatSession) {
  if (!s.satisfaction) return '买家未评';
  if (s.satisfaction === 'very_satisfied') return '非常满意';
  if (s.satisfaction === 'satisfied') return '满意';
  if (s.satisfaction === 'neutral') return '中立';
  return '不满意';
}

function userPin(s: ChatSession) {
  if (s.phoneOrEmail?.startsWith('jd_')) return s.phoneOrEmail;
  const seed = s.id.replace(/[^a-z0-9]/gi, '').slice(-10) || 'user';
  return `jd_${seed}`;
}

function startTimeText(session: ChatSession) {
  return session.createdAt.length <= 16 ? `${session.createdAt}:00` : session.createdAt;
}

type TriFilter = 'all' | 'true' | 'false';
type DatePreset = 'today' | 'week' | 'month';

const inputClass = cn(FIELD, FIELD_CTRL, 'text-[12px] px-2.5 placeholder:text-neutral-500');
const filterSelectClass = cn(SELECT_TRIGGER, 'w-full min-w-0 text-[12px]');

interface QcDataSummaryViewProps {
  sessions: ChatSession[];
  hiredAgents: HiredAgent[];
  onViewSession: (sessionId: string) => void;
  onExport?: () => void;
  showToast: (msg: string) => void;
}

export const QcDataSummaryView: React.FC<QcDataSummaryViewProps> = ({
  sessions,
  hiredAgents,
  onViewSession,
  onExport,
  showToast,
}) => {
  const initialRange = rangeFor('today');
  const [transFilter, setTransFilter] = useState<TriFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [sessionIdQuery, setSessionIdQuery] = useState('');

  const csAgents = useMemo(
    () => hiredAgents.filter((a) => !isQcAgent(a)),
    [hiredAgents],
  );

  const filtered = useMemo(() => {
    const q = sessionIdQuery.trim().toLowerCase();
    return sessions.filter((s) => {
      if (transFilter === 'true' && !s.isTransferred) return false;
      if (transFilter === 'false' && s.isTransferred) return false;
      if (agentFilter !== 'all' && s.assignedAgentId !== agentFilter) return false;
      if (q && !s.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sessions, transFilter, agentFilter, sessionIdQuery]);

  const handleTimeRange = (kind: DatePreset) => {
    setDatePreset(kind);
    const next = rangeFor(kind);
    setDateFrom(next.from);
    setDateTo(next.to);
  };

  const resetFilters = () => {
    const next = rangeFor('today');
    setTransFilter('all');
    setAgentFilter('all');
    setDatePreset('today');
    setDateFrom(next.from);
    setDateTo(next.to);
    setSessionIdQuery('');
  };

  const copyId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('已复制会话ID');
    } catch {
      showToast('复制失败');
    }
  };

  return (
    <div className={ONLINE_PAGE}>
      <OnlinePageHeader title="数据汇总">
        <button type="button" onClick={resetFilters} className={BTN_SOFT}>
          重置
        </button>
        <button type="button" className={BTN_INK}>
          查询
        </button>
      </OnlinePageHeader>

      <section className="mb-5">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(168px,0.85fr)_minmax(132px,0.65fr)] max-md:grid-cols-1 gap-x-4 gap-y-3">
            <OnlineFilterField label="时间范围" required>
              <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-x-auto">
                {(
                  [
                    { id: 'today' as const, label: '今天' },
                    { id: 'week' as const, label: '最近一周' },
                    { id: 'month' as const, label: '最近一月' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTimeRange(item.id)}
                    className={cn(
                      'h-8 px-2.5 rounded-md border text-[12px] transition cursor-pointer shrink-0',
                      datePreset === item.id
                        ? 'border-sky-300 text-sky-700 bg-sky-50'
                        : 'border-neutral-200 text-neutral-500 hover:border-foreground/20 hover:text-neutral-800 bg-white',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                <input
                  type="datetime-local"
                  step={1}
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset('today');
                  }}
                  className={cn(inputClass, 'w-[10.75rem] shrink-0')}
                  aria-label="开始时间"
                />
                <span className="text-neutral-500 text-[12px] shrink-0">~</span>
                <input
                  type="datetime-local"
                  step={1}
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset('today');
                  }}
                  className={cn(inputClass, 'w-[10.75rem] shrink-0')}
                  aria-label="结束时间"
                />
              </div>
            </OnlineFilterField>

            <OnlineFilterField label="会话ID">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={sessionIdQuery}
                  onChange={(e) => setSessionIdQuery(e.target.value)}
                  placeholder="请输入会话ID"
                  className={cn(inputClass, 'pl-8')}
                />
              </div>
            </OnlineFilterField>

            <OnlineFilterField label="是否转人工">
              <Select
                value={transFilter}
                onValueChange={(v) => v && setTransFilter(v as TriFilter)}
              >
                <SelectTrigger className={filterSelectClass}>
                  <SelectValue>
                    {transFilter === 'all' ? '全部' : transFilter === 'true' ? '是' : '否'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </OnlineFilterField>
          </div>

          <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] max-md:grid-cols-1 gap-x-4 gap-y-3">
            <OnlineFilterField label="数字员工">
              <Select value={agentFilter} onValueChange={(v) => v && setAgentFilter(v)}>
                <SelectTrigger className={filterSelectClass}>
                  <SelectValue>
                    {agentFilter === 'all'
                      ? '全部'
                      : csAgents.find((a) => a.id === agentFilter)?.name ?? '全部'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {csAgents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OnlineFilterField>
          </div>
        </div>
      </section>

      <section>
        <OnlineSectionHeader
          title="会话列表"
          description={`共 ${filtered.length} 条记录`}
          actions={
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-[12px] cursor-pointer gap-1"
              onClick={() => onExport?.()}
            >
              导出
              <ChevronDown size={12} />
            </Button>
          }
        />

        <div className={onlineTableClass.wrap}>
          <table className={cn(onlineTableClass.table, 'min-w-[1100px]')}>
            <thead>
              <tr className={onlineTableClass.headRow}>
                <th className={onlineTableClass.thFirst}>数字员工</th>
                <th className={onlineTableClass.th}>会话ID</th>
                <th className={onlineTableClass.th}>会话开始时间</th>
                <th className={onlineTableClass.th}>用户PIN</th>
                <th className={onlineTableClass.th}>渠道</th>
                <th className={onlineTableClass.th}>在线状态</th>
                <th className={onlineTableClass.th}>是否转人工</th>
                <th className={onlineTableClass.th}>转人工是否成功</th>
                <th className={onlineTableClass.th}>满意度</th>
                <th className={onlineTableClass.thLast}>操作</th>
              </tr>
            </thead>
            <tbody className={onlineTableClass.body}>
              {filtered.length === 0 ? (
                <OnlineEmptyRow colSpan={10}>暂无匹配会话</OnlineEmptyRow>
              ) : (
                filtered.map((s) => {
                  const agent = hiredAgents.find((a) => a.id === s.assignedAgentId);
                  const success = transferSuccess(s);
                  return (
                    <tr key={s.id} className={onlineTableClass.row}>
                      <td className={onlineTableClass.tdFirst}>
                        <div className="font-semibold text-neutral-800 leading-tight">
                          {agent?.name ?? '未分配'}
                        </div>
                      </td>
                      <td className={onlineTableClass.td}>
                        <div className="flex items-start gap-1.5 max-w-[180px]">
                          <span className="font-mono text-[11px] text-neutral-800 break-all leading-snug">
                            {s.id}
                          </span>
                          <button
                            type="button"
                            title="复制"
                            onClick={() => void copyId(s.id)}
                            className="shrink-0 mt-0.5 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <rect
                                x="9"
                                y="9"
                                width="11"
                                height="11"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                              <path
                                d="M5 15V7a2 2 0 0 1 2-2h8"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td
                        className={cn(
                          onlineTableClass.td,
                          'whitespace-nowrap font-mono text-[11px] text-neutral-500',
                        )}
                      >
                        {startTimeText(s)}
                      </td>
                      <td
                        className={cn(
                          onlineTableClass.td,
                          'whitespace-nowrap font-mono text-[11px]',
                        )}
                      >
                        {userPin(s)}
                      </td>
                      <td className={cn(onlineTableClass.td, 'whitespace-nowrap')}>
                        {channelLabel(s.channel)}
                      </td>
                      <td className={cn(onlineTableClass.td, 'whitespace-nowrap')}>
                        <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 whitespace-nowrap leading-none h-5">
                          {statusLabel(s.status)}
                        </span>
                      </td>
                      <td className={onlineTableClass.td}>
                        <span
                          className={cn(
                            'inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap leading-none h-5',
                            s.isTransferred
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          )}
                        >
                          {s.isTransferred ? '是' : '否'}
                        </span>
                      </td>
                      <td className={cn(onlineTableClass.td, 'text-neutral-500 whitespace-nowrap')}>
                        {success === null ? (
                          '—'
                        ) : success === 'yes' ? (
                          <span className="text-emerald-600 font-medium">成功</span>
                        ) : (
                          <span className="text-rose-600 font-medium">失败</span>
                        )}
                      </td>
                      <td
                        className={cn(
                          onlineTableClass.td,
                          'text-neutral-500 whitespace-nowrap',
                        )}
                      >
                        {satisfactionLabel(s)}
                      </td>
                      <td className={onlineTableClass.tdLast}>
                        <button
                          type="button"
                          className="text-sky-600 hover:text-sky-700 font-semibold text-[12px] inline-flex items-center cursor-pointer"
                          onClick={() => onViewSession(s.id)}
                        >
                          查看会话
                          <ChevronRight size={12} className="ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
