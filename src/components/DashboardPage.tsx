/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 办公室 · 员工业绩 — 扁平板式（无卡片壳）
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  Users,
  Cpu,
  Headphones,
  Clock,
  Zap,
  CheckCircle2,
  Smile,
} from '@/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGE, SELECT_TRIGGER } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import { SparklineArea } from './dashboard/ChartPrimitives';
import { ContentBusy } from './common/ContentBusy';
import { useMockLatency } from '@/lib/useMockLatency';

function CompactToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'px-2 py-1 rounded-[5px] text-[10px] font-semibold transition cursor-pointer',
            value === opt.id
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** 演示数据（对齐 joyteam 运营核心指标语义） */
const OPS = {
  inbound: 24821,
  aiReception: 19250,
  transfer: 5571,
  humanReception: 5241,
  transferFailed: 330,
  transferRate: 22.4,
  humanPickupRate: 94.1,
  realtimeAi: 86,
  realtimeHuman: 42,
  aiSaturation: 68,
  humanSaturation: 54,
  avgHandleSec: 222,
  responseMs: 820,
  respond30sRate: 91.6,
  resolve72h: 87.3,
  satisfaction: 94.2,
  goodRate: 71.5,
  recall: 82.4,
  precision: 79.1,
  f1: 80.7,
  parseRate: 96.3,
};

const TOKEN_TREND = [420, 480, 510, 490, 560, 610, 580, 640, 700, 680, 720, 760, 740, 800];
const CORE_TREND_ROWS = [
  { date: '07-16', inbound: 3120, ai: 2410, transfer: 710, human: 668, fail: 42 },
  { date: '07-17', inbound: 2980, ai: 2305, transfer: 675, human: 640, fail: 35 },
  { date: '07-18', inbound: 3410, ai: 2680, transfer: 730, human: 690, fail: 40 },
  { date: '07-19', inbound: 3560, ai: 2750, transfer: 810, human: 762, fail: 48 },
  { date: '07-20', inbound: 3290, ai: 2550, transfer: 740, human: 701, fail: 39 },
  { date: '07-21', inbound: 3820, ai: 2960, transfer: 860, human: 812, fail: 48 },
  { date: '07-22', inbound: 3641, ai: 2595, transfer: 1046, human: 968, fail: 78 },
];

const AI_BIZ = [
  { name: '保障范围咨询', count: 4820 },
  { name: '保费方案测算', count: 3610 },
  { name: '理赔材料指引', count: 2980 },
  { name: '找不到申请入口', count: 1240 },
  { name: '金额争议', count: 860 },
];

const TRANSFER_BIZ = [
  { name: '情绪升级转人工', count: 1680 },
  { name: '拒赔争议', count: 920 },
  { name: '复杂核保', count: 780 },
  { name: '材料错/过保', count: 650 },
  { name: '特殊材料核实', count: 420 },
];

function Tip({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex">
      <HelpCircle size={12} className="text-muted-foreground/50 shrink-0" />
    </span>
  );
}

function SectionTitle({
  title,
  english,
  right,
}: {
  title: string;
  english?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 pb-2 border-b border-border">
      <div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
        {english ? (
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
            {english}
          </p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function MetricCell({
  label,
  value,
  unit,
  tip,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tip?: string;
  sub?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5 min-h-[88px] py-1', className)}>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
        {icon}
        {label}
        {tip ? <Tip text={tip} /> : null}
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-[22px] font-semibold text-foreground tabular-nums leading-none">
          {value}
        </span>
        {unit ? <span className="text-[11px] text-muted-foreground">{unit}</span> : null}
      </div>
      {sub ? <p className="text-[10px] text-muted-foreground leading-snug">{sub}</p> : null}
    </div>
  );
}

function BizBars({
  items,
  scaleCount,
  barClass,
}: {
  items: { name: string; count: number }[];
  scaleCount: (n: number) => number;
  barClass: string;
}) {
  const max = scaleCount(items[0].count);
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const count = scaleCount(item.count);
        return (
          <div key={item.name} className="flex items-center gap-3 text-[11px]">
            <span className="w-28 shrink-0 text-muted-foreground truncate">{item.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full', barClass)}
                style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
              />
            </div>
            <span className="w-12 text-right tabular-nums font-medium text-foreground">
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const { hiredAgents } = useApp();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const metricsBusy = useMockLatency(`dashboard-${selectedEmployeeId}`, 'pageList');
  const [trendRange, setTrendRange] = useState<'today' | 'week'>('week');
  const [trendView, setTrendView] = useState<'table' | 'chart'>('table');

  const selectedLabel = useMemo(() => {
    if (selectedEmployeeId === 'all') return '全部数字员工';
    const agent = hiredAgents.find((a) => a.id === selectedEmployeeId);
    return agent ? agent.name : '选择数字员工';
  }, [selectedEmployeeId, hiredAgents]);

  const scale = selectedEmployeeId === 'all' ? 1 : 0.28;
  const n = (v: number) => Math.max(1, Math.round(v * scale));
  const pct = (v: number) => `${(v * (scale >= 1 ? 1 : 0.98)).toFixed(1)}%`;

  const ai = n(OPS.aiReception);
  const transfer = n(OPS.transfer);
  const human = n(OPS.humanReception);
  const fail = n(OPS.transferFailed);

  const seniorSaved = Math.max(1, Math.round(ai / 9000));
  const yuanSaved = Math.round(ai * 4.8);
  const autoRuns = Math.max(1, n(OPS.inbound - OPS.transfer));
  const smartTasks = Math.max(1, n(Math.round(OPS.aiReception * 0.42)));
  const highlightAgents = hiredAgents.filter((a) => a.status === 'online').slice(0, 2);
  const agentA = highlightAgents[0]?.name ?? '数字员工';
  const agentB = highlightAgents[1]?.name ?? hiredAgents[0]?.name ?? '数字员工';

  return (
    <div className={cn(PAGE, 'overflow-y-auto custom-scrollbar')}>
      <OnlinePageHeader title="员工业绩">
        <Select value={selectedEmployeeId} onValueChange={(v) => v && setSelectedEmployeeId(v)}>
          <SelectTrigger className={cn(SELECT_TRIGGER, 'min-w-[160px]')}>
            <SelectValue placeholder="选择数字员工">{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">全部数字员工</SelectItem>
            {hiredAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OnlinePageHeader>

      <ContentBusy busy={metricsBusy} size="panel" minHeight={280}>
        {/* 运营核心成效 — 全宽指标带 */}
        <section className="mb-8">
          <SectionTitle
            title="运营核心指标"
            english="Core Operating Metrics"
            right={<span className="text-[11px] text-muted-foreground">数据更新于昨天</span>}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-5">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">节约高级客服</p>
              <p className="text-[28px] font-semibold text-foreground tabular-nums leading-none">
                {seniorSaved}
                <span className="text-sm font-medium text-muted-foreground ml-1">人 · 30 天</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">约等于成本</p>
              <p className="text-[28px] font-semibold text-foreground tabular-nums leading-none">
                ¥{yuanSaved.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 truncate" title={agentA}>
                {agentA} · 接待对话
              </p>
              <p className="text-[28px] font-semibold text-live tabular-nums leading-none">
                {ai.toLocaleString()}
                <span className="text-sm font-medium text-muted-foreground ml-1">条</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 truncate" title={agentB}>
                {agentB} · 智能任务
              </p>
              <p className="text-[28px] font-semibold text-live tabular-nums leading-none">
                {smartTasks.toLocaleString()}
                <span className="text-sm font-medium text-muted-foreground ml-1">次</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Zap size={12} /> 自动化运行
              </p>
              <p className="text-[28px] font-semibold text-live tabular-nums leading-none">
                {autoRuns.toLocaleString()}
                <span className="text-sm font-medium text-muted-foreground ml-1">次</span>
              </p>
            </div>
          </div>
        </section>

        {/* TOKEN + 核心趋势 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
          <section className="xl:col-span-4">
            <SectionTitle
              title="TOKEN 消耗趋势"
              english="Token Consumption"
              right={
                <span className="text-[10px] font-mono text-muted-foreground">
                  AVG <span className="text-foreground font-semibold">612</span>
                </span>
              }
            />
            <div className="h-28 w-full overflow-hidden pt-1">
              <SparklineArea data={TOKEN_TREND.map((v) => Math.round(v * scale))} height={96} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">近 14 日 TOKEN 消耗（演示数据）</p>
          </section>

          <section className="xl:col-span-8">
            <SectionTitle
              title="核心指标趋势"
              english="Core Metrics History"
              right={
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <CompactToggle
                    value={trendRange}
                    onChange={setTrendRange}
                    options={[
                      { id: 'today', label: '当日' },
                      { id: 'week', label: '七日' },
                    ]}
                  />
                  <CompactToggle
                    value={trendView}
                    onChange={setTrendView}
                    options={[
                      { id: 'table', label: '表格' },
                      { id: 'chart', label: '图表' },
                    ]}
                  />
                </div>
              }
            />

            {trendView === 'chart' ? (
              <div className="h-40 pt-1">
                <SparklineArea
                  data={CORE_TREND_ROWS.map((r) => Math.round(r.inbound * scale))}
                  height={140}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] text-foreground">
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground font-medium">
                      <th className="px-1 py-2 pr-3">日期</th>
                      <th className="px-3 py-2">进线量</th>
                      <th className="px-3 py-2">数字员工接待</th>
                      <th className="px-3 py-2">转人工</th>
                      <th className="px-3 py-2">人工接待</th>
                      <th className="px-3 py-2 pl-3 pr-1">转人工失败</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {(trendRange === 'today' ? CORE_TREND_ROWS.slice(-1) : CORE_TREND_ROWS).map(
                      (row) => (
                        <tr key={row.date} className="hover:bg-muted/30">
                          <td className="px-1 py-2 pr-3 font-mono text-muted-foreground">
                            {row.date}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {n(row.inbound).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{n(row.ai).toLocaleString()}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {n(row.transfer).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {n(row.human).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 pl-3 pr-1 tabular-nums">
                            {n(row.fail).toLocaleString()}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* 数字员工运营指标 */}
        <section className="mb-8">
          <SectionTitle title="数字员工运营指标" english="Digital Employee Metrics" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-4 mb-6">
            <MetricCell
              label="实时接待量"
              value={n(OPS.realtimeAi)}
              unit="人"
              tip="系统当前窗口内正在进行中的活动会话总数"
              sub={`饱和度 ${pct(OPS.aiSaturation)} · 昨日 ${n(OPS.realtimeAi + 12)}`}
              icon={<Cpu size={12} />}
            />
            <MetricCell
              label="平均处理时长"
              value={OPS.avgHandleSec}
              unit="秒"
              tip="单个会话从开始到挂断的平均持续时间"
              icon={<Clock size={12} />}
            />
            <MetricCell
              label="响应速度"
              value={OPS.responseMs}
              unit="ms"
              tip="系统从接收消息到发出反馈的平均时延（首 token）"
              icon={<Zap size={12} />}
            />
            <MetricCell
              label="30秒响应率"
              value={pct(OPS.respond30sRate)}
              tip="首句回复或关键步骤响应时间在 30 秒内的比例"
            />
            <MetricCell
              label="解决率"
              value={pct(OPS.resolve72h)}
              tip="72H 一解率：1-重复进线 PIN 量/总 PIN 量"
              icon={<CheckCircle2 size={12} />}
            />
            <MetricCell
              label="满意度"
              value={pct(OPS.satisfaction)}
              tip="(满意+非常满意)/总评价数"
              sub={`好评率 ${pct(OPS.goodRate)}`}
              icon={<Smile size={12} />}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-semibold text-foreground">处理业务场景</h3>
              <span className="text-[10px] text-muted-foreground">处理业务量</span>
            </div>
            <BizBars items={AI_BIZ} scaleCount={n} barClass="bg-foreground/75" />
          </div>
        </section>

        {/* 知识库 + 人工 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <section>
            <SectionTitle title="知识库及解析指标" english="Knowledge & Parsing" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
              {[
                {
                  name: '召回率',
                  short: 'Recall',
                  value: pct(OPS.recall),
                  tip: '检索到的相关知识数量/知识库中所有相关知识总数',
                },
                {
                  name: '精准率',
                  short: 'Precision',
                  value: pct(OPS.precision),
                  tip: '检索到的相关知识数量/检索到的总知识数量',
                },
                { name: 'F1分数', short: 'F1 Score', value: pct(OPS.f1), tip: 'F1 分数' },
                { name: '解析率', short: 'Resolution', value: pct(OPS.parseRate), tip: '' },
              ].map((item) => (
                <div key={item.name} className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5">
                    {item.name}
                    {item.tip ? <Tip text={item.tip} /> : null}
                  </span>
                  <span className="text-xl font-semibold tabular-nums text-foreground">
                    {item.value}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">{item.short}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="人工服务全景指标" english="Human Service Metrics" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <MetricCell
                label="实时接待量"
                value={n(OPS.realtimeHuman)}
                unit="人"
                tip="当前人工坐席活动会话快照"
                sub={`饱和度 ${pct(OPS.humanSaturation)}`}
                icon={<Users size={12} />}
              />
              <MetricCell
                label="通接量"
                value={human.toLocaleString()}
                tip="人工坐席成功应答总数"
                icon={<Headphones size={12} />}
              />
              <MetricCell label="转挂量" value={fail.toLocaleString()} tip="转人工失败量" />
            </div>
          </section>
        </div>

        {/* 转人工分流详情 */}
        <section className="mb-2">
          <SectionTitle
            title="转人工分流详情"
            english="Transfer Path Metrics"
            right={<span className="text-[10px] text-muted-foreground font-mono">链路转化指标</span>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 mb-6">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">转人工率</p>
              <p className="text-2xl font-semibold tabular-nums text-emerald-700">
                {pct(OPS.transferRate)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">同比 +1.2%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">人工接起率</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {pct(OPS.humanPickupRate)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">同比 -0.4%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">转人工量</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {transfer.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                成功 {human.toLocaleString()} · 失败 {fail.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-semibold text-foreground">转人工业务场景</h3>
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                刷新
              </button>
            </div>
            <BizBars items={TRANSFER_BIZ} scaleCount={n} barClass="bg-amber-500/80" />
          </div>
        </section>
      </ContentBusy>
    </div>
  );
};
