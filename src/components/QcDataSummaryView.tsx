/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检应用 — 数据汇总（筛选条 + 会话表，对齐设计稿）
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from '@/lib/icons';
import {
  BTN_OUTLINE,
  SEARCH_FIELD,
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
import type { ChatSession, HiredAgent } from '@/src/types';
import { isQcAgent } from '@/lib/jobFamily';
import { OnlinePageHeader, PAGE_HEADER_INSET } from './common/OnlinePageLayout';

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
  const [transFilter, setTransFilter] = useState<TriFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [sessionIdQuery, setSessionIdQuery] = useState('');

  const csAgents = useMemo(
    () => hiredAgents.filter((a) => !isQcAgent(a)),
    [hiredAgents],
  );

  const agentLabel =
    agentFilter === 'all'
      ? '数字员工'
      : csAgents.find((a) => a.id === agentFilter)?.name ?? '数字员工';

  const transLabel =
    transFilter === 'all' ? '是否转人工' : transFilter === 'true' ? '是' : '否';

  const dateLabel =
    datePreset === 'today' ? '今天' : datePreset === 'week' ? '最近一周' : '最近一月';

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

  const resetFilters = () => {
    setTransFilter('all');
    setAgentFilter('all');
    setDatePreset('today');
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
    <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
      <div className={cn('shrink-0', PAGE_HEADER_INSET)}>
        <OnlinePageHeader title="数据汇总">
          <Select
            value={transFilter}
            onValueChange={(v) => v && setTransFilter(v as TriFilter)}
          >
            <SelectTrigger className={SELECT_TRIGGER} aria-label="是否转人工">
              <SelectValue>{transLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">是否转人工</SelectItem>
              <SelectItem value="true">是</SelectItem>
              <SelectItem value="false">否</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={agentFilter}
            onValueChange={(v) => v && setAgentFilter(v)}
          >
            <SelectTrigger className={cn(SELECT_TRIGGER, 'min-w-[8.5rem]')} aria-label="数字员工">
              <SelectValue>{agentLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">数字员工</SelectItem>
              {csAgents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={datePreset}
            onValueChange={(v) => v && setDatePreset(v as DatePreset)}
          >
            <SelectTrigger className={SELECT_TRIGGER} aria-label="时间范围">
              <SelectValue>{dateLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="week">最近一周</SelectItem>
              <SelectItem value="month">最近一月</SelectItem>
            </SelectContent>
          </Select>

          <label className="relative inline-flex items-center">
            <Search
              size={14}
              className="absolute left-2.5 text-neutral-400 pointer-events-none"
            />
            <input
              className={cn(SEARCH_FIELD, 'pl-8 w-[200px]')}
              type="search"
              placeholder="搜索会话ID"
              value={sessionIdQuery}
              onChange={(e) => setSessionIdQuery(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="h-8 px-2.5 text-[12px] font-medium text-neutral-500 hover:text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
          >
            更多
            <ChevronDown size={14} />
          </button>

          <button
            type="button"
            className="h-8 px-2.5 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
            onClick={resetFilters}
          >
            重置
          </button>
          <button
            type="button"
            className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}
            onClick={() => {
              onExport?.();
            }}
          >
            导出
          </button>
        </OnlinePageHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-5 pb-5 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-neutral-200 py-16 text-center text-[13px] text-neutral-500">
            暂无匹配会话
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-neutral-200">
            <table className="w-full min-w-[1100px] text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-500">
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    数字员工
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    会话ID
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    会话开始时间
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    用户PIN
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    渠道
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    在线状态
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    是否转人工
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    转人工是否成功
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap">
                    满意度
                  </th>
                  <th className="font-medium px-3 py-2.5 border-b border-neutral-200 whitespace-nowrap w-[88px]">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const agent = hiredAgents.find((a) => a.id === s.assignedAgentId);
                  const success = transferSuccess(s);
                  return (
                    <tr
                      key={s.id}
                      className="text-neutral-800 hover:bg-neutral-50/80 transition-colors"
                    >
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap">
                        {agent?.name ?? '未分配'}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100">
                        <span className="inline-flex items-center gap-1.5 group/copy">
                          <span className="font-mono text-[11px]">{s.id}</span>
                          <button
                            type="button"
                            title="复制"
                            onClick={() => void copyId(s.id)}
                            className="text-live/70 hover:text-live opacity-70 group-hover/copy:opacity-100 cursor-pointer"
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
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                        {startTimeText(s)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 font-mono text-[11px] whitespace-nowrap">
                        {userPin(s)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap">
                        {channelLabel(s.channel)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap">
                        {statusLabel(s.status)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap">
                        {s.isTransferred ? '是' : '否'}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap">
                        {success === null ? (
                          <span className="text-neutral-400">—</span>
                        ) : success === 'yes' ? (
                          <span className="text-emerald-600 font-medium">成功</span>
                        ) : (
                          <span className="text-rose-600 font-medium">失败</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100 whitespace-nowrap text-neutral-600">
                        {satisfactionLabel(s)}
                      </td>
                      <td className="px-3 py-2.5 border-b border-neutral-100">
                        <button
                          type="button"
                          className="text-live font-medium hover:underline cursor-pointer"
                          onClick={() => onViewSession(s.id)}
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
  );
};
