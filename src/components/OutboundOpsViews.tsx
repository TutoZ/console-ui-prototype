/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 外呼域各二级页 — 对齐智能外呼 5 能力：
 * 员工监控 / 员工培训 / 任务下发 / 外呼记录 / 员工业绩
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { OutboundMainTab } from '@/lib/navDomain';
import type { HiredAgent } from '../types';
import { BTN_INK, BTN_SOFT, FIELD, LIST_META, SEARCH_FIELD, SELECT_TRIGGER, TABLE } from '@/lib/ui';
import { Info, Plus, Search, Upload } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useApp } from '../context/AppContext';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import { OutboundTrainingView } from './OutboundTrainingView';
import {
  CreateOutboundTaskModal,
  type CreateOutboundTaskPayload,
} from './CreateOutboundTaskModal';
import { DonutChart } from './dashboard/ChartPrimitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONITOR_KPIS = [
  {
    label: '外呼用户量 (不含已拦截)',
    value: '1,286',
    sub: '接通用户数: 472',
    tone: 'border-neutral-200 bg-neutral-50',
    valueClass: 'text-neutral-900',
  },
  {
    label: '整体接通率 (不含已拦截)',
    value: '36.7%',
    sub: '首呼接通率 (不含已拦截): 31.5%',
    tone: 'border-neutral-200 bg-neutral-50',
    valueClass: 'text-neutral-900',
  },
  {
    label: '意向率',
    value: '12.9%',
    sub: '意向用户数: 61',
    tone: 'border-neutral-200 bg-neutral-50',
    valueClass: 'text-neutral-900',
  },
  {
    label: '首句挂断率',
    value: '7.4%',
    sub: '首句挂断用户数: 35',
    tone: 'border-neutral-200 bg-neutral-50',
    valueClass: 'text-neutral-900',
  },
  {
    label: '平均通话时长',
    value: '96S',
    sub: '累计通话时长: 12小时36分',
    tone: 'border-neutral-200 bg-neutral-50',
    valueClass: 'text-neutral-900',
  },
];

const INTENT_CONNECT_BARS = [
  { label: '高意向', value: 61, tone: 'bg-neutral-800', track: 'bg-neutral-100' },
  { label: '普通意向', value: 103, tone: 'bg-neutral-500', track: 'bg-neutral-100' },
  { label: '无意向', value: 214, tone: 'bg-neutral-300', track: 'bg-neutral-100' },
  { label: '待二次触达', value: 94, tone: 'bg-neutral-200', track: 'bg-neutral-100' },
];

const INTENT_LIST_BARS = [
  { label: '高意向', value: 88, tone: 'bg-neutral-800', track: 'bg-neutral-100' },
  { label: '普通意向', value: 156, tone: 'bg-neutral-500', track: 'bg-neutral-100' },
  { label: '无意向', value: 402, tone: 'bg-neutral-300', track: 'bg-neutral-100' },
  { label: '待二次触达', value: 210, tone: 'bg-neutral-200', track: 'bg-neutral-100' },
];

const SPEED_METRICS = [
  { label: '每分钟外呼数', value: '36', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '每分钟接通数', value: '14', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '每分钟防骚扰拦截数', value: '2', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '每分钟呼出拦截数', value: '1', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
];

const TALK_STATUS_METRICS = [
  { label: '通话中', value: '28', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '振铃中', value: '12', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '排队等待', value: '6', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '已挂断(近1分钟)', value: '41', tone: 'bg-neutral-50 text-neutral-700 border-neutral-200' },
];

const CALL_STATUS_METRICS = [
  { label: '呼叫成功', value: '31', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '无人接听', value: '9', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '忙线/拒接', value: '5', tone: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  { label: '空号/关机', value: '3', tone: 'bg-neutral-50 text-neutral-700 border-neutral-200' },
];

const SPEED_RANK = [
  { name: '复制IT3品牌酒类付款8011785554562765', count: 36 },
  { name: '二次调试测试', count: 24 },
  { name: '斑马202608100317862819099961', count: 18 },
];

const FRIEND_METRICS = [
  { label: '触发申请数', value: '38' },
  { label: '通过申请数', value: '23' },
  { label: '申请通过率', value: '60.5%' },
  { label: '接通加微率', value: '4.9%' },
];

function MonitorSectionTitle({
  title,
  tip,
  right,
  className,
}: {
  title: string;
  tip?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2 mb-3', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-0.5 h-3.5 rounded-full bg-neutral-800 shrink-0" aria-hidden />
        <h2 className="text-[13px] font-semibold text-neutral-900">{title}</h2>
        {tip ? (
          <span title={tip} className="text-neutral-400 hover:text-neutral-600 cursor-help shrink-0">
            <Info size={13} />
          </span>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function LabelWithTip({ label, tip }: { label: string; tip?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 min-w-0">
      <span className="truncate" title={label}>
        {label}
      </span>
      {tip ? (
        <span title={tip} className="text-neutral-400 shrink-0 cursor-help">
          <Info size={11} />
        </span>
      ) : null}
    </span>
  );
}

const MONITOR_TASK_ROWS = [
  {
    name: '夏季会员回访',
    status: '执行中',
    listSize: 520,
    connected: 198,
    outbound: 520,
    firstConnect: '34.2%',
    overallConnect: '38.1%',
    intent: '13.6%',
    wechat: '5.2%',
    avgDuration: 102,
  },
  {
    name: '沉默用户激活',
    status: '执行中',
    listSize: 800,
    connected: 246,
    outbound: 640,
    firstConnect: '29.8%',
    overallConnect: '38.4%',
    intent: '10.2%',
    wechat: '3.8%',
    avgDuration: 88,
  },
  {
    name: '正常客户测试',
    status: '已完成',
    listSize: 2,
    connected: 2,
    outbound: 2,
    firstConnect: '100%',
    overallConnect: '100%',
    intent: '0%',
    wechat: '0%',
    avgDuration: 104,
  },
];

const OUTBOUND_TASK_ROWS = [
  {
    id: 'task_002',
    name: '正常客户测试',
    status: '已完成' as const,
    listSize: 2,
    done: 2,
    connected: 2,
    scriptId: '10006',
    createdAt: '08/06 22:34',
    startAt: '2026-08-07 00:00:00',
    endAt: '2026-08-10 00:00:00',
    taskNo: '1661806',
    line: '演示线路',
    connectRate: '100%',
    firstConnectRate: '100%',
    avgDuration: '104.3s',
    intentRate: '0%',
    smsRate: '0%',
    uncalled: 0,
    called: 3,
    blocked: 0,
    callUsers: 3,
    sessions: 3,
    agent: '商机挖掘专员 #2',
  },
  {
    id: 'task_004',
    name: '测试-0606-2',
    status: '已完成' as const,
    listSize: 3,
    done: 3,
    connected: 2,
    scriptId: '10006',
    createdAt: '08/06 16:12',
    startAt: '2026-08-06 00:00:00',
    endAt: '2026-08-08 00:00:00',
    taskNo: '1661798',
    line: '演示线路',
    connectRate: '66.7%',
    firstConnectRate: '66.7%',
    avgDuration: '88.0s',
    intentRate: '0%',
    smsRate: '0%',
    uncalled: 0,
    called: 3,
    blocked: 0,
    callUsers: 3,
    sessions: 3,
    agent: '商机挖掘专员',
  },
  {
    id: 'task_005',
    name: '测试-华道',
    status: '已完成' as const,
    listSize: 5,
    done: 5,
    connected: 4,
    scriptId: '10012',
    createdAt: '08/05 11:08',
    startAt: '2026-08-05 00:00:00',
    endAt: '2026-08-07 00:00:00',
    taskNo: '1661710',
    line: '演示线路',
    connectRate: '80%',
    firstConnectRate: '80%',
    avgDuration: '96.2s',
    intentRate: '20%',
    smsRate: '0%',
    uncalled: 0,
    called: 5,
    blocked: 0,
    callUsers: 5,
    sessions: 5,
    agent: '商机挖掘专员',
  },
  {
    id: 'task_001',
    name: '夏季会员回访',
    status: '执行中' as const,
    listSize: 1200,
    done: 486,
    connected: 186,
    scriptId: '10008',
    createdAt: '08/04 09:20',
    startAt: '2026-08-04 00:00:00',
    endAt: '2026-08-20 00:00:00',
    taskNo: '1661602',
    line: '演示线路',
    connectRate: '38.2%',
    firstConnectRate: '31.5%',
    avgDuration: '96S',
    intentRate: '11.4%',
    smsRate: '4.2%',
    uncalled: 714,
    called: 486,
    blocked: 12,
    callUsers: 474,
    sessions: 512,
    agent: '商机挖掘专员',
  },
  {
    id: 'task_003',
    name: '沉默用户激活',
    status: '待启动' as const,
    listSize: 800,
    done: 0,
    connected: 0,
    scriptId: '10009',
    createdAt: '08/11 14:02',
    startAt: '2026-08-12 00:00:00',
    endAt: '2026-08-25 00:00:00',
    taskNo: '1661901',
    line: '演示线路',
    connectRate: '—',
    firstConnectRate: '—',
    avgDuration: '—',
    intentRate: '—',
    smsRate: '—',
    uncalled: 800,
    called: 0,
    blocked: 0,
    callUsers: 0,
    sessions: 0,
    agent: '商机挖掘专员',
  },
];

type OutboundTaskRow = (typeof OUTBOUND_TASK_ROWS)[number];

function formatTaskStamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildCreatedOutboundTask(payload: CreateOutboundTaskPayload): OutboundTaskRow {
  const stamp = formatTaskStamp();
  return {
    id: `task_${Date.now()}`,
    name: payload.kind === 'test' ? `测试-${payload.name}` : payload.name,
    status: '待启动',
    listSize: 0,
    done: 0,
    connected: 0,
    scriptId: payload.scriptId,
    createdAt: stamp,
    startAt: '—',
    endAt: '—',
    taskNo: String(1662000 + (Date.now() % 9000)),
    line: payload.lineLabel,
    connectRate: '—',
    firstConnectRate: '—',
    avgDuration: '—',
    intentRate: '—',
    smsRate: '—',
    uncalled: 0,
    called: 0,
    blocked: 0,
    callUsers: 0,
    sessions: 0,
    agent: '商机挖掘专员',
  };
}

function taskStatusClass(status: OutboundTaskRow['status']) {
  if (status === '已完成') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === '执行中') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-neutral-100 text-neutral-600 border-neutral-200';
}

const OUTBOUND_RECORD_ROWS = [
  {
    id: 'rec_001',
    name: 'Experiencer_2',
    phone: '138****6610',
    script: '商机挖掘标准话术',
    callType: '预测外呼',
    status: '已接通',
    duration: '03:05',
    turns: 8,
  },
  {
    id: 'rec_002',
    name: '星',
    phone: '159****2208',
    script: '沉默激活话术',
    callType: '预览外呼',
    status: '无法接通',
    duration: '00:00',
    turns: 0,
  },
  {
    id: 'rec_003',
    name: 'mc',
    phone: '186****0042',
    script: '商机挖掘标准话术',
    callType: '预测外呼',
    status: '已接通',
    duration: '01:42',
    turns: 4,
  },
];

const PERF_ROWS = [
  {
    id: 'p1',
    task: 'Ozwtest3832 夏季回访',
    script: 'daihou_test01',
    imported: 1200,
    outboundEx: 986,
    outbound: 1024,
    calls: 1450,
    durationMin: 612,
    connected: 372,
  },
  {
    id: 'p2',
    task: 'zwtest1287 沉默激活',
    script: 'daihou_test01',
    imported: 800,
    outboundEx: 640,
    outbound: 680,
    calls: 920,
    durationMin: 288,
    connected: 198,
  },
];

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export const OutboundOpsViews: React.FC<{
  tab: OutboundMainTab;
  agents: HiredAgent[];
  onOpenTaskCenter: () => void;
  onToast: (msg: string) => void;
}> = ({ tab, onToast }) => {
  const { pendingOpsAction, setPendingOpsAction } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<OutboundTaskRow[]>([]);
  const taskRows = useMemo(
    () => [...createdTasks, ...OUTBOUND_TASK_ROWS],
    [createdTasks],
  );
  const [selectedTaskId, setSelectedTaskId] = useState(OUTBOUND_TASK_ROWS[0]?.id ?? '');
  const [intentTab, setIntentTab] = useState<'connect' | 'list'>('connect');
  const [speedTab, setSpeedTab] = useState<'speed' | 'talk' | 'call'>('speed');
  const [demoData, setDemoData] = useState(true);
  const [taskDetailTab, setTaskDetailTab] = useState<
    'status' | 'uncalled' | 'called' | 'blocked' | 'detail'
  >('status');
  const [taskIntentFilter, setTaskIntentFilter] = useState<
    'all' | 'connect' | 'list' | 'key'
  >('all');
  const [callChartMode, setCallChartMode] = useState<'call' | 'talk'>('call');

  useEffect(() => {
    if (pendingOpsAction !== 'create-task') return;
    setCreateOpen(true);
    setPendingOpsAction(null);
  }, [pendingOpsAction, setPendingOpsAction]);

  const selectedTask = useMemo(
    () => taskRows.find((t) => t.id === selectedTaskId) ?? taskRows[0],
    [selectedTaskId, taskRows],
  );

  switch (tab) {
    /** ① 员工监控 — 对齐产品截图全量信息点 */
    case 'monitor': {
      const intentBars = intentTab === 'connect' ? INTENT_CONNECT_BARS : INTENT_LIST_BARS;
      const intentTotal = intentBars.reduce((sum, b) => sum + b.value, 0);
      const intentCenterLabel = intentTab === 'connect' ? '已接通用户' : '名单用户';
      const barMax = Math.max(...intentBars.map((b) => b.value), 1);
      const speedPanelMetrics =
        speedTab === 'talk' ? TALK_STATUS_METRICS : speedTab === 'call' ? CALL_STATUS_METRICS : SPEED_METRICS;

      return (
        <div className="space-y-5">
          <OnlinePageHeader title="员工监控">
            <label className="inline-flex items-center gap-2 text-[12px] text-neutral-600 cursor-pointer select-none">
              <span
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
                  demoData ? 'bg-neutral-800' : 'bg-neutral-300',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={demoData}
                  onChange={(e) => setDemoData(e.target.checked)}
                  aria-label="演示数据"
                />
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    demoData && 'translate-x-4',
                  )}
                />
              </span>
              演示数据
            </label>
            <button
              type="button"
              className={BTN_INK}
            >
              外呼日报
            </button>
            <button
              type="button"
              className="h-8 px-2 text-[12px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              全局监控配置
            </button>
            <button
              type="button"
              className="h-8 px-2 text-[12px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              会话自动巡检
            </button>
            <button
              type="button"
              className="h-8 px-2 text-[12px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              全部 &gt;
            </button>
          </OnlinePageHeader>

          {/* 今日核心数据 */}
          <section>
            <MonitorSectionTitle
              title="今日核心数据"
              tip="今日实时汇总，不含已拦截号码；演示数据开关可切换样例。"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {MONITOR_KPIS.map((k) => (
                <div
                  key={k.label}
                  className={cn('rounded-[13px] border px-3.5 py-3 min-w-0', k.tone)}
                >
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    <LabelWithTip label={k.label} tip={k.label} />
                  </p>
                  <p className={cn('text-[26px] font-semibold tabular-nums mt-1.5 leading-none', k.valueClass)}>
                    {demoData ? k.value : '—'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-2">{demoData ? k.sub : '—'}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* 意向情况 */}
            <section className="rounded-[13px] border border-neutral-200 bg-white p-4">
              <MonitorSectionTitle
                title="意向情况"
                tip="按接通用户或名单口径统计意向分层"
                right={
                  <div className="inline-flex rounded-md border border-neutral-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setIntentTab('connect')}
                      className={cn(
                        'h-7 px-2.5 text-[11px] rounded-[5px] cursor-pointer',
                        intentTab === 'connect'
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-500 hover:text-neutral-800',
                      )}
                    >
                      接通意向
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntentTab('list')}
                      className={cn(
                        'h-7 px-2.5 text-[11px] rounded-[5px] cursor-pointer',
                        intentTab === 'list'
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-500 hover:text-neutral-800',
                      )}
                    >
                      名单意向
                    </button>
                  </div>
                }
              />

              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="relative h-[132px] w-[132px] shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
                    <circle cx="60" cy="60" r="46" fill="none" stroke="#E5E5E5" strokeWidth="12" />
                    {intentBars.map((b, i) => {
                      const circ = 2 * Math.PI * 46;
                      const prev = intentBars.slice(0, i).reduce((s, x) => s + x.value, 0);
                      const colors = ['#38BDF8', '#7DD3FC', '#A3A3A3', '#D4D4D4'];
                      return (
                        <circle
                          key={b.label}
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke={colors[i] ?? '#D4D4D4'}
                          strokeWidth="12"
                          strokeDasharray={`${(b.value / intentTotal) * circ} ${circ}`}
                          strokeDashoffset={-((prev / intentTotal) * circ)}
                          strokeLinecap="butt"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-semibold tabular-nums text-neutral-900 leading-none">
                      {demoData ? intentTotal : '—'}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">{intentCenterLabel}</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2.5 min-w-0">
                  {intentBars.map((b) => (
                    <div key={b.label} className="flex items-center gap-2.5">
                      <span className="w-[4.5rem] shrink-0 text-[11px] text-neutral-600">{b.label}</span>
                      <div className={cn('flex-1 h-2 rounded-full overflow-hidden', b.track)}>
                        <div
                          className={cn('h-full rounded-full', b.tone)}
                          style={{ width: demoData ? `${Math.min(100, (b.value / barMax) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="w-12 text-right text-[11px] tabular-nums text-neutral-700 shrink-0">
                        {demoData ? `${b.value}人` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 呼叫速度 */}
            <section className="rounded-[13px] border border-neutral-200 bg-white p-4">
              <MonitorSectionTitle
                title="呼叫速度"
                tip="近 1 分钟实时呼叫速度与状态分布"
                right={
                  <div className="inline-flex rounded-md border border-neutral-200 p-0.5">
                    {(
                      [
                        { id: 'speed' as const, label: '呼叫速度' },
                        { id: 'talk' as const, label: '通话状态' },
                        { id: 'call' as const, label: '呼叫状态' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSpeedTab(t.id)}
                        className={cn(
                          'h-7 px-2 text-[11px] rounded-[5px] cursor-pointer',
                          speedTab === t.id
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-500 hover:text-neutral-800',
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4">
                <div className="flex flex-col gap-2">
                  {speedPanelMetrics.map((m) => (
                    <div
                      key={m.label}
                      className={cn('rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2', m.tone)}
                    >
                      <p className="text-[10px] opacity-80 leading-snug">
                        <LabelWithTip label={m.label} tip={m.label} />
                      </p>
                      <p className="text-[20px] font-semibold tabular-nums leading-none shrink-0">
                        {demoData ? m.value : '—'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] font-semibold text-neutral-800 inline-flex items-center gap-1">
                      最近1分钟任务呼叫速度排名
                      <span title="按近 1 分钟呼叫次数排序" className="text-neutral-400 cursor-help">
                        <Info size={11} />
                      </span>
                    </p>
                    <p className="text-[10px] text-neutral-400 tabular-nums">更新于 12:54</p>
                  </div>
                  <div className={TABLE.wrap}>
                    <table className={TABLE.table}>
                      <thead>
                        <tr className={TABLE.headRow}>
                          <th className={TABLE.thFirst}>排名</th>
                          <th className={TABLE.th}>任务名称</th>
                          <th className={TABLE.thLast}>呼叫次数</th>
                        </tr>
                      </thead>
                      <tbody className={TABLE.body}>
                        {(demoData ? SPEED_RANK : []).map((row, i) => (
                          <tr key={row.name} className={TABLE.row}>
                            <td className={cn(TABLE.tdFirst, 'tabular-nums')}>{i + 1}</td>
                            <td className={cn(TABLE.td, 'max-w-[180px] truncate')} title={row.name}>
                              {row.name}
                            </td>
                            <td className={cn(TABLE.tdLast, 'tabular-nums font-semibold')}>
                              {row.count}
                            </td>
                          </tr>
                        ))}
                        {!demoData ? (
                          <tr className={TABLE.row}>
                            <td className={cn(TABLE.tdFirst, 'text-neutral-400')} colSpan={3}>
                              已关闭演示数据
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 加粉情况 */}
          <section className="rounded-[13px] border border-neutral-200 bg-white px-4 py-3.5">
            <MonitorSectionTitle title="加粉情况" tip="外呼过程中触发的加微申请与通过情况" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FRIEND_METRICS.map((m) => (
                <div key={m.label} className="min-w-0">
                  <p className="text-[11px] text-neutral-500">
                    <LabelWithTip label={m.label} tip={m.label} />
                  </p>
                  <p className="text-[22px] font-semibold tabular-nums text-neutral-900 mt-1 leading-none">
                    {demoData ? m.value : '—'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 任务明细表 */}
          <section>
            <div className={cn(TABLE.wrap, 'overflow-x-auto')}>
              <table className={cn(TABLE.table, 'min-w-[1100px]')}>
                <thead>
                  <tr className={TABLE.headRow}>
                    <th className={TABLE.thFirst}>任务名称</th>
                    <th className={TABLE.th}>任务状态</th>
                    <th className={TABLE.th}>外呼名单量</th>
                    <th className={TABLE.th}>接通用户数/外呼用户数</th>
                    <th className={TABLE.th}>首呼接通率 (不含已拦截)</th>
                    <th className={TABLE.th}>整体接通率 (不含已拦截)</th>
                    <th className={TABLE.th}>意向率</th>
                    <th className={TABLE.th}>接通加微率</th>
                    <th className={TABLE.thLast}>平均通话时长 (秒)</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {(demoData ? MONITOR_TASK_ROWS : []).map((row) => (
                    <tr key={row.name} className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'font-medium')}>{row.name}</td>
                      <td className={TABLE.td}>{row.status}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.listSize}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>
                        {row.connected} / {row.outbound}
                      </td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.firstConnect}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.overallConnect}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.intent}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.wechat}</td>
                      <td className={cn(TABLE.tdLast, 'tabular-nums')}>{row.avgDuration}</td>
                    </tr>
                  ))}
                  {!demoData ? (
                    <tr className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'text-neutral-400')} colSpan={9}>
                        已关闭演示数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }

    /** ② 员工培训 — 三栏话术工作台（对齐产品截图） */
    case 'training':
      return <OutboundTrainingView onToast={onToast} />;

    /** ③ 任务下发 — 对齐产品截图：筛选条 + 任务列表 + 详情看板 */
    case 'tasks': {
      const progress = selectedTask?.listSize
        ? Math.round((selectedTask.done / selectedTask.listSize) * 100)
        : 0;
      const detailTabs = [
        { id: 'status' as const, label: '任务状态' },
        { id: 'uncalled' as const, label: `未呼客户(${selectedTask?.uncalled ?? 0})` },
        { id: 'called' as const, label: `已呼客户(${selectedTask?.called ?? 0})` },
        { id: 'blocked' as const, label: `拦截客户(${selectedTask?.blocked ?? 0})` },
        { id: 'detail' as const, label: '任务详情' },
      ];
      const kpiItems = selectedTask
        ? [
            { label: '接通率', value: selectedTask.connectRate },
            { label: '首呼接通率', value: selectedTask.firstConnectRate },
            { label: '平均通话时长', value: selectedTask.avgDuration },
            { label: '意向率', value: selectedTask.intentRate },
            { label: '短信发送成功率', value: selectedTask.smsRate },
          ]
        : [];
      const callSegments =
        callChartMode === 'call'
          ? [
              { label: '已接通', value: Math.max(selectedTask?.connected ?? 0, 1), color: '#525252' },
              { label: '未接通', value: Math.max((selectedTask?.called ?? 0) - (selectedTask?.connected ?? 0), 0), color: '#D4D4D4' },
            ]
          : [
              { label: '通话中', value: 1, color: '#525252' },
              { label: '已挂断', value: Math.max((selectedTask?.sessions ?? 1) - 1, 0), color: '#D4D4D4' },
            ];
      const turnSegments = [
        { label: '1-3轮', value: Math.max(Math.round((selectedTask?.sessions ?? 1) * 0.4), 1), color: '#737373' },
        { label: '4-6轮', value: Math.max(Math.round((selectedTask?.sessions ?? 1) * 0.35), 0), color: '#A3A3A3' },
        { label: '7轮+', value: Math.max(Math.round((selectedTask?.sessions ?? 1) * 0.25), 0), color: '#D4D4D4' },
      ];

      return (
        <>
        <div className="space-y-4">
          <OnlinePageHeader title="任务下发">
            <button
              type="button"
              className={BTN_INK}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} />
              新建任务
            </button>
          </OnlinePageHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-[88px]')}>
                <SelectValue>全部</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="mine">我的任务</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-44 shrink-0">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                className={cn(SEARCH_FIELD, 'pl-8')}
                placeholder="任务名称或ID"
              />
            </div>
            <input className={cn(FIELD, 'h-8 w-full sm:w-36 text-[12px]')} placeholder="话术" />
            <Select defaultValue="all">
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-[100px]')}>
                <SelectValue>状态</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">状态</SelectItem>
                <SelectItem value="running">执行中</SelectItem>
                <SelectItem value="done">已完成</SelectItem>
                <SelectItem value="pending">待启动</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-[110px]')}>
                <SelectValue>呼叫类型</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">呼叫类型</SelectItem>
                <SelectItem value="predict">预测外呼</SelectItem>
                <SelectItem value="preview">预览外呼</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-[110px]')}>
                <SelectValue>创建时间</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">创建时间</SelectItem>
                <SelectItem value="7d">近 7 天</SelectItem>
                <SelectItem value="30d">近 30 天</SelectItem>
              </SelectContent>
            </Select>
            <button type="button" className={BTN_INK}>
              搜索
            </button>
            <button type="button" className={BTN_SOFT}>
              重置
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-3 min-h-[520px]">
            <aside className="border border-neutral-200 rounded-[13px] overflow-hidden flex flex-col bg-white min-h-[320px]">
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {taskRows.map((row) => {
                  const active = row.id === selectedTask?.id;
                  const pct = row.listSize ? Math.round((row.done / row.listSize) * 100) : 0;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => {
                        setSelectedTaskId(row.id);
                        setTaskDetailTab('status');
                      }}
                      className={cn(
                        'w-full text-left rounded-[10px] border px-3 py-2.5 cursor-pointer transition',
                        active
                          ? 'border-neutral-800 bg-neutral-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold text-neutral-900 truncate leading-snug">
                          {row.name}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 inline-flex items-center h-5 px-1.5 rounded-md border text-[10px] font-semibold',
                            taskStatusClass(row.status),
                          )}
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-neutral-500 tabular-nums truncate">
                        {row.scriptId} · {row.createdAt} · {row.connected}/{row.listSize}
                      </p>
                      <div className="mt-2 h-1 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            row.status === '已完成' ? 'bg-emerald-500' : 'bg-neutral-800',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="border border-neutral-200 rounded-[13px] bg-white p-4 min-w-0 flex flex-col gap-4">
              {selectedTask ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-[16px] font-semibold text-neutral-900 truncate">
                          {selectedTask.name}
                        </h2>
                        <span
                          className={cn(
                            'shrink-0 inline-flex items-center h-5 px-1.5 rounded-md border text-[10px] font-semibold',
                            taskStatusClass(selectedTask.status),
                          )}
                        >
                          {selectedTask.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                        {selectedTask.startAt} — {selectedTask.endAt}
                        <span className="mx-1.5 text-neutral-300">|</span>
                        任务ID {selectedTask.taskNo}
                        <span className="mx-1.5 text-neutral-300">|</span>
                        外呼线路：{selectedTask.line}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={BTN_SOFT}
                    >
                      <Upload size={14} className="shrink-0" />
                      上传客户名单
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto custom-scrollbar">
                    {detailTabs.map((t) => {
                      const active = taskDetailTab === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTaskDetailTab(t.id)}
                          className={cn(
                            'shrink-0 h-9 px-3 text-[12px] font-medium border-b-2 -mb-px transition cursor-pointer',
                            active
                              ? 'border-neutral-900 text-neutral-900'
                              : 'border-transparent text-neutral-500 hover:text-neutral-800',
                          )}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {taskDetailTab === 'status' ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {kpiItems.map((m) => (
                          <div
                            key={m.label}
                            className="rounded-[10px] border border-neutral-200 bg-neutral-50/70 px-3 py-2.5"
                          >
                            <p className="text-[11px] text-neutral-500">{m.label}</p>
                            <p className="text-[18px] font-semibold tabular-nums mt-1 text-neutral-900">
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[13px] border border-neutral-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h3 className="text-[13px] font-semibold text-neutral-900">意向情况</h3>
                          <div className="inline-flex rounded-md border border-neutral-200 p-0.5 bg-white">
                            {(
                              [
                                { id: 'all' as const, label: '全部' },
                                { id: 'connect' as const, label: '接通意向' },
                                { id: 'list' as const, label: '名单意向' },
                                { id: 'key' as const, label: '触发关键点' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setTaskIntentFilter(opt.id)}
                                className={cn(
                                  'h-7 px-2.5 rounded text-[11px] font-medium transition cursor-pointer',
                                  taskIntentFilter === opt.id
                                    ? 'bg-neutral-900 text-white'
                                    : 'text-neutral-600 hover:bg-neutral-50',
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                          <div className="h-14 w-14 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 mb-3" />
                          <p className="text-[12px]">暂无数据</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-[13px] border border-neutral-200 p-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className="text-[13px] font-semibold text-neutral-900">通话状态</h3>
                            <div className="inline-flex rounded-md border border-neutral-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => setCallChartMode('call')}
                                className={cn(
                                  'h-7 px-2 rounded text-[11px] font-medium cursor-pointer',
                                  callChartMode === 'call'
                                    ? 'bg-neutral-900 text-white'
                                    : 'text-neutral-600',
                                )}
                              >
                                呼叫状态
                              </button>
                              <button
                                type="button"
                                onClick={() => setCallChartMode('talk')}
                                className={cn(
                                  'h-7 px-2 rounded text-[11px] font-medium cursor-pointer',
                                  callChartMode === 'talk'
                                    ? 'bg-neutral-900 text-white'
                                    : 'text-neutral-600',
                                )}
                              >
                                通话状态
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-center py-2">
                            <DonutChart
                              segments={callSegments}
                              size={148}
                              strokeWidth={18}
                              centerValue={`${selectedTask.callUsers}`}
                              centerLabel="位用户"
                            />
                          </div>
                        </div>

                        <div className="rounded-[13px] border border-neutral-200 p-4">
                          <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">对话轮次</h3>
                          <div className="flex justify-center py-2">
                            <DonutChart
                              segments={turnSegments}
                              size={148}
                              strokeWidth={18}
                              centerValue={`${selectedTask.sessions}`}
                              centerLabel="通会话数量"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-neutral-400">
                      <p className="text-[13px] font-medium text-neutral-600">
                        {detailTabs.find((t) => t.id === taskDetailTab)?.label}
                      </p>
                      <p className="text-[12px] mt-1">明细列表演示占位 · 进度 {progress}%</p>
                    </div>
                  )}
                </>
              ) : null}
            </section>
          </div>
        </div>
        <CreateOutboundTaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={(payload) => {
            const row = buildCreatedOutboundTask(payload);
            setCreatedTasks((prev) => [row, ...prev]);
            setSelectedTaskId(row.id);
            setCreateOpen(false);
            onToast(`已创建外呼任务“${row.name}”`);
          }}
        />
        </>
      );
    }

    /** ④ 外呼记录 */
    case 'records':
      return (
        <div className="space-y-4">
          <OnlinePageHeader title="外呼记录">
            <button type="button" className={BTN_SOFT}>
              导出文件
            </button>
            <button type="button" className={BTN_INK}>
              搜索
            </button>
          </OnlinePageHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterField label="客户名称">
              <input className={cn(FIELD, 'h-8 text-[12px]')} placeholder="请输入" />
            </FilterField>
            <FilterField label="客户号码">
              <input className={cn(FIELD, 'h-8 text-[12px]')} placeholder="请输入" />
            </FilterField>
            <FilterField label="通话状态">
              <Select defaultValue="all">
                <SelectTrigger className={cn(SELECT_TRIGGER, 'w-full')}>
                  <SelectValue>全部</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="ok">已接通</SelectItem>
                  <SelectItem value="fail">无法接通</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="呼叫类型">
              <Select defaultValue="all">
                <SelectTrigger className={cn(SELECT_TRIGGER, 'w-full')}>
                  <SelectValue>全部</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="predict">预测外呼</SelectItem>
                  <SelectItem value="preview">预览外呼</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </div>

          <div className={cn(TABLE.wrap, 'min-w-[960px]')}>
            <table className={TABLE.table}>
              <thead>
                <tr className={TABLE.headRow}>
                  <th className={TABLE.thFirst}>客户名称</th>
                  <th className={TABLE.th}>客户号码</th>
                  <th className={TABLE.th}>话术模板</th>
                  <th className={TABLE.th}>呼叫类型</th>
                  <th className={TABLE.th}>通话状态</th>
                  <th className={TABLE.th}>通话时长</th>
                  <th className={TABLE.thLast}>对话轮次</th>
                </tr>
              </thead>
              <tbody className={TABLE.body}>
                {OUTBOUND_RECORD_ROWS.map((row) => (
                  <tr key={row.id} className={TABLE.row}>
                    <td className={cn(TABLE.tdFirst, 'font-medium')}>{row.name}</td>
                    <td className={cn(TABLE.td, 'font-mono text-[11px]')}>{row.phone}</td>
                    <td className={TABLE.td}>{row.script}</td>
                    <td className={TABLE.td}>{row.callType}</td>
                    <td className={TABLE.td}>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[11px]',
                          row.status === '已接通' ? 'text-neutral-800' : 'text-neutral-500',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            row.status === '已接通' ? 'bg-neutral-800' : 'bg-neutral-300',
                          )}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.duration}</td>
                    <td className={cn(TABLE.tdLast, 'tabular-nums')}>{row.turns}轮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    /** ⑤ 员工业绩 */
    case 'stats':
      return (
        <div className="space-y-4">
          <OnlinePageHeader title="员工业绩">
            <button type="button" className={BTN_SOFT}>
              导出
            </button>
            <button type="button" className={BTN_INK}>
              查询
            </button>
          </OnlinePageHeader>

          <div className="flex flex-wrap items-end gap-3">
            <FilterField label="数据维度">
              <div className="inline-flex rounded-md border border-neutral-200 p-0.5">
                <button type="button" className={cn(BTN_INK, 'h-7')}>
                  任务
                </button>
                <button type="button" className={cn(BTN_SOFT, 'h-7 border-0')}>
                  日期
                </button>
              </div>
            </FilterField>
            <FilterField label="外呼日期">
              <input type="date" className={cn(FIELD, 'h-8 text-[12px]')} defaultValue="2026-08-11" />
            </FilterField>
            <FilterField label="话术模板">
              <Select defaultValue="all">
                <SelectTrigger className={cn(SELECT_TRIGGER, 'min-w-[140px]')}>
                  <SelectValue>全部</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="t1">daihou_test01</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </div>

          <p className="text-[12px] font-semibold text-neutral-800">
            语音外呼数据报告（2026/08/11–2026/08/11）
          </p>
          <div className={cn(TABLE.wrap, 'min-w-[960px]')}>
            <table className={TABLE.table}>
              <thead>
                <tr className={TABLE.headRow}>
                  <th className={TABLE.thFirst}>任务名称</th>
                  <th className={TABLE.th}>话术模板</th>
                  <th className={TABLE.th}>导入名单量</th>
                  <th className={TABLE.th}>外呼用户数（不含已拦截）</th>
                  <th className={TABLE.th}>外呼用户数</th>
                  <th className={TABLE.th}>外呼数量（通）</th>
                  <th className={TABLE.th}>通话时长（分钟）</th>
                  <th className={TABLE.thLast}>接通用户数</th>
                </tr>
              </thead>
              <tbody className={TABLE.body}>
                {PERF_ROWS.map((row) => (
                  <tr key={row.id} className={TABLE.row}>
                    <td className={cn(TABLE.tdFirst, 'font-medium max-w-[180px] truncate')} title={row.task}>
                      {row.task}
                    </td>
                    <td className={TABLE.td}>{row.script}</td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.imported}</td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.outboundEx}</td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.outbound}</td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.calls}</td>
                    <td className={cn(TABLE.td, 'tabular-nums')}>{row.durationMin}</td>
                    <td className={cn(TABLE.tdLast, 'tabular-nums')}>{row.connected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export function isOutboundMainTab(tab: string): tab is OutboundMainTab {
  return (
    tab === 'monitor' ||
    tab === 'training' ||
    tab === 'tasks' ||
    tab === 'records' ||
    tab === 'stats'
  );
}
