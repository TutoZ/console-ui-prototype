/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 外呼 / 热线 / 催收 / 电销 / 随访 域应用壳
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PAGE, BTN_INK, TABLE, LIST_DIVIDER } from '@/lib/ui';
import { PRIMARY_NAV } from '@/lib/navDomain';
import { isDomainOpsAgent, resolveJobFamily, supportsDutyToggle } from '@/lib/jobFamily';
import { Plus, Send } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import { CollectionOpsViews, isCollectionMainTab } from './CollectionOpsViews';
import { OutboundOpsViews, isOutboundMainTab } from './OutboundOpsViews';
import { AgentScriptWorkspace } from './OutboundTrainingView';
import { DomainNoAccessState } from './DomainNoAccessState';
import { DomainAccessLeadModal } from './DomainAccessLeadModal';
import { CallRecordsView } from '../modules/records/CallRecordsView';
import { NumberManagementView } from '../modules/hotline/NumberManagementView';

/** Demo：假定电话销售 / 电话催收域当前账号无权限，需留资开通 */
const DOMAIN_ACCESS_LOCKED = new Set(['telesales', 'collection']);

const HOTLINE_CALL_ROWS = [
  {
    id: 'call_001',
    time: '2026-06-11 09:12:34',
    caller: '138****5621',
    agent: '400热线接待专员',
    duration: '03:42',
    status: '已接通',
  },
  {
    id: 'call_002',
    time: '2026-06-11 08:56:08',
    caller: '021****8890',
    agent: '400热线接待专员',
    duration: '01:18',
    status: '未接通',
  },
  {
    id: 'call_003',
    time: '2026-06-10 17:33:51',
    caller: '186****0024',
    agent: '400热线接待专员 #2',
    duration: '05:06',
    status: '已接通',
  },
];

const HOTLINE_PERF_ROWS = [
  {
    id: 'hp_001',
    agent: '400热线接待专员',
    received: 186,
    connected: 142,
    connectRate: '76.3%',
    avgDuration: '03:28',
    transfer: 18,
    csat: '4.6',
  },
  {
    id: 'hp_002',
    agent: '400热线接待专员 #2',
    received: 94,
    connected: 71,
    connectRate: '75.5%',
    avgDuration: '02:51',
    transfer: 9,
    csat: '4.4',
  },
];

const HOTLINE_NUMBERS = [
  { id: 'num_001', number: '400-820-8888', label: '主热线', status: '使用中', boundAgent: '400热线接待专员' },
  { id: 'num_002', number: '021-5566-7788', label: '上海专线', status: '使用中', boundAgent: '400热线接待专员 #2' },
  { id: 'num_003', number: '010-8899-0011', label: '北京备用', status: '空闲', boundAgent: '—' },
];

export const DomainOpsPage: React.FC = () => {
  const { navDomain, hiredAgents, domainOpsTab, setShowTaskCenter, showToast } = useApp();
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const domainMeta = PRIMARY_NAV.find((d) => d.id === navDomain);
  const title = domainMeta?.title ?? '业务域';
  const domainAgents = hiredAgents.filter((a) => {
    if (!isDomainOpsAgent(a)) return false;
    const family = resolveJobFamily(a);
    return (
      (navDomain === 'outbound' && family === 'outbound') ||
      (navDomain === 'hotline' && family === 'hotline') ||
      (navDomain === 'collection' && family === 'collection') ||
      (navDomain === 'telesales' && family === 'telesales') ||
      (navDomain === 'followup' && family === 'followup')
    );
  });

  const pageShell = cn(PAGE, 'overflow-y-auto custom-scrollbar');
  /** 三栏话术工作台：填满主区，避免 PAGE 滚动把布局撑乱 */
  const workspaceShell = 'flex-1 min-h-0 overflow-hidden bg-white flex flex-col';

  if (DOMAIN_ACCESS_LOCKED.has(navDomain)) {
    return (
      <div className={cn(pageShell, 'flex flex-col')}>
        <DomainNoAccessState
          domainTitle={title}
          submitted={leadSubmitted}
          onApply={() => setLeadOpen(true)}
        />
        <DomainAccessLeadModal
          open={leadOpen}
          domainTitle={title}
          onClose={() => setLeadOpen(false)}
          onSubmitted={(payload) => {
            setLeadSubmitted(true);
            showToast(`${payload.domainTitle}开通申请已提交，顾问将尽快联系您`);
          }}
        />
      </div>
    );
  }

  if (navDomain === 'hotline') {
    if (domainOpsTab === 'agents') {
      return (
        <div className={workspaceShell}>
          <AgentScriptWorkspace pageTitle="员工培训" onToast={showToast} />
        </div>
      );
    }

    return (
      <div className={pageShell}>
        {domainOpsTab === 'stats' ? (
          <div className="space-y-4">
            <OnlinePageHeader title="员工业绩" />
            <div className={cn(TABLE.wrap, 'min-w-[860px]')}>
              <table className={TABLE.table}>
                <thead>
                  <tr className={TABLE.headRow}>
                    <th className={TABLE.thFirst}>数字员工</th>
                    <th className={TABLE.th}>来电量</th>
                    <th className={TABLE.th}>接通量</th>
                    <th className={TABLE.th}>接通率</th>
                    <th className={TABLE.th}>平均时长</th>
                    <th className={TABLE.th}>转人工</th>
                    <th className={TABLE.thLast}>满意度</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {HOTLINE_PERF_ROWS.map((row) => (
                    <tr key={row.id} className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'font-medium text-neutral-800')}>{row.agent}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.received}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.connected}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.connectRate}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.avgDuration}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.transfer}</td>
                      <td className={cn(TABLE.tdLast, 'tabular-nums')}>{row.csat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {domainOpsTab === 'calls' ? (
          <div className="space-y-4">
            <CallRecordsView embedded />
          </div>
        ) : null}

        {domainOpsTab === 'numbers' ? (
          <div className="space-y-4">
            <NumberManagementView embedded />
          </div>
        ) : null}
      </div>
    );
  }

  if (navDomain === 'outbound' && isOutboundMainTab(domainOpsTab)) {
    if (domainOpsTab === 'training') {
      return (
        <div className={workspaceShell}>
          <OutboundOpsViews
            tab={domainOpsTab}
            agents={domainAgents}
            onOpenTaskCenter={() => setShowTaskCenter(true)}
            onToast={showToast}
          />
        </div>
      );
    }
    return (
      <div className={pageShell}>
        <OutboundOpsViews
          tab={domainOpsTab}
          agents={domainAgents}
          onOpenTaskCenter={() => setShowTaskCenter(true)}
          onToast={showToast}
        />
      </div>
    );
  }

  if (navDomain === 'collection' && isCollectionMainTab(domainOpsTab)) {
    return (
      <div className={pageShell}>
        <CollectionOpsViews tab={domainOpsTab} agents={domainAgents} />
      </div>
    );
  }

  if (navDomain !== 'telesales' && navDomain !== 'followup') {
    return (
      <div className={pageShell}>
        <p className="text-[13px] text-neutral-500">请选择上方二级导航查看内容。</p>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      {domainOpsTab === 'dispatch' ? (
        <div className="max-w-2xl space-y-4">
          <OnlinePageHeader title={`${title} · 派发任务`} />
          {domainAgents.length === 0 ? (
            <p className="text-[13px] text-neutral-400">
              暂无该类型数字员工，请先前往数字员工市场雇佣。
            </p>
          ) : (
            <ul className="space-y-2">
              {domainAgents.map((a) => (
                <li
                  key={a.id}
                  className={cn('flex items-center justify-between gap-3', LIST_DIVIDER)}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-neutral-800 truncate">{a.name}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {supportsDutyToggle(a)
                        ? a.status === 'online'
                          ? '已上岗'
                          : '待上岗'
                        : '可派发'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={cn(BTN_INK, 'gap-1.5 shrink-0')}
                    onClick={() => {
                      setShowTaskCenter(true);
                    }}
                  >
                    <Send size={13} />
                    派发任务
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={cn(BTN_INK, 'gap-1.5')}
            onClick={() => {
              setShowTaskCenter(true);
            }}
          >
            <Send size={14} />
            打开任务中心
          </button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <OnlinePageHeader title={`${title} · 运行概览`} />
        </div>
      )}
    </div>
  );
};
