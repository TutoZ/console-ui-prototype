/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 催收域各二级页内容
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  COLLECTION_MAIN_GROUPS,
  type CollectionMainTab,
  type CollectionNavGroupId,
} from '@/lib/navDomain';
import type { HiredAgent } from '../types';
import { BTN_INK, LIST_DIVIDER, TABLE } from '@/lib/ui';
import { Plus } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useApp } from '../context/AppContext';
import { CreateCollectionTaskModal } from './CreateCollectionTaskModal';
import { OnlinePageHeader } from './common/OnlinePageLayout';

const OUTBOUND_CDR_ROWS = [
  {
    id: 'cdr_001',
    time: '2026-06-11 10:22:15',
    callee: '139****8821',
    agent: '智能催收专员',
    duration: '02:18',
    result: '承诺还款',
  },
  {
    id: 'cdr_002',
    time: '2026-06-11 09:45:03',
    callee: '186****0042',
    agent: '智能催收专员 #2',
    duration: '00:42',
    result: '未接通',
  },
];

const CASE_ORDER_ROWS = [
  {
    id: 'case_001',
    orderNo: 'COL-20260611001',
    customer: '张**',
    amount: '¥ 12,800',
    stage: 'M2',
    agent: '智能催收专员',
  },
  {
    id: 'case_002',
    orderNo: 'COL-20260611002',
    customer: '李**',
    amount: '¥ 6,420',
    stage: 'M1',
    agent: '智能催收专员 #2',
  },
];

type CaseOrderRow = {
  id: string;
  orderNo: string;
  customer: string;
  amount: string;
  stage: string;
  agent: string;
};

function collectionGroupMeta(groupId: CollectionNavGroupId) {
  const group = COLLECTION_MAIN_GROUPS.find((item) => item.id === groupId);
  const children =
    group && 'children' in group && group.children ? group.children : [];
  return {
    title: group && 'label' in group ? group.label : groupId,
    tabs: children.map((child) => ({ id: child.id, label: child.label })),
  };
}

/** 对齐「数字员工技能」页内子 Tab */
function CollectionPageSubTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: CollectionMainTab) => void;
  ariaLabel: string;
}) {
  return (
    <nav
      className="flex items-center gap-1 border-b border-neutral-200 mb-5 -mt-1"
      aria-label={ariaLabel}
    >
      {tabs.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id as CollectionMainTab)}
            className={cn(
              'relative h-9 px-3 text-[13px] transition cursor-pointer shrink-0',
              active
                ? 'font-semibold text-neutral-900'
                : 'font-medium text-neutral-500 hover:text-neutral-800',
            )}
          >
            {item.label}
            {active ? (
              <span
                className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-live"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export const CollectionOpsViews: React.FC<{
  tab: CollectionMainTab;
  agents: HiredAgent[];
}> = ({ tab, agents }) => {
  const {
    pendingOpsAction,
    setPendingOpsAction,
    pendingOpsAgentId,
    setPendingOpsAgentId,
    setDomainOpsTab,
  } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAgentId, setPrefillAgentId] = useState<string | null>(null);
  const [createdOrders, setCreatedOrders] = useState<CaseOrderRow[]>([]);
  const caseOrders = useMemo(
    () => [...createdOrders, ...CASE_ORDER_ROWS],
    [createdOrders],
  );

  useEffect(() => {
    if (pendingOpsAction !== 'create-collection-task') return;
    setPrefillAgentId(pendingOpsAgentId);
    setCreateOpen(true);
    setPendingOpsAction(null);
    setPendingOpsAgentId(null);
  }, [pendingOpsAction, pendingOpsAgentId, setPendingOpsAction, setPendingOpsAgentId]);

  let body: React.ReactNode;
  switch (tab) {
    case 'monitor':
      body = (
        <div className="space-y-4">
          <OnlinePageHeader title="数字员工监控" />
          {agents.length === 0 ? (
            <p className="text-[13px] text-neutral-400">暂无催收数字员工。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((a) => (
                <div key={a.id} className={cn('py-3 md:border-b-0', LIST_DIVIDER, 'md:border-b-0')}>
                  <div className="text-[13px] font-semibold text-neutral-900">{a.name}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    运行中 · 队列 128 · 接通率 62%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      break;

    case 'resources':
      body = (
        <div className="space-y-4">
          <OnlinePageHeader title="资源中心" />
          <ul className="text-[13px] text-neutral-600 space-y-2">
            <li>· 标准话术包 v3.2（已启用）</li>
            <li>· 外呼线路池 A（可用 24 条）</li>
            <li>· 合规禁语规则集（2026-Q2）</li>
          </ul>
        </div>
      );
      break;

    case 'outbound_cdr':
    case 'case_orders': {
      const cdrMeta = collectionGroupMeta('cdr');
      body = (
        <div>
          <OnlinePageHeader title={cdrMeta.title}>
            {tab === 'case_orders' ? (
              <button type="button" className={BTN_INK} onClick={() => setCreateOpen(true)}>
                <Plus size={14} />
                新建催收任务
              </button>
            ) : null}
          </OnlinePageHeader>
          <CollectionPageSubTabs
            tabs={cdrMeta.tabs}
            value={tab}
            onChange={setDomainOpsTab}
            ariaLabel="话单管理子页"
          />
          {tab === 'outbound_cdr' ? (
            <div className={cn(TABLE.wrap, 'min-w-[720px]')}>
              <table className={TABLE.table}>
                <thead>
                  <tr className={TABLE.headRow}>
                    <th className={TABLE.thFirst}>通话时间</th>
                    <th className={TABLE.th}>被叫号码</th>
                    <th className={TABLE.th}>数字员工</th>
                    <th className={TABLE.th}>时长</th>
                    <th className={TABLE.thLast}>结果</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {OUTBOUND_CDR_ROWS.map((row) => (
                    <tr key={row.id} className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'font-mono text-[11px]')}>{row.time}</td>
                      <td className={cn(TABLE.td, 'font-mono')}>{row.callee}</td>
                      <td className={TABLE.td}>{row.agent}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.duration}</td>
                      <td className={TABLE.tdLast}>{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={cn(TABLE.wrap, 'min-w-[720px]')}>
              <table className={TABLE.table}>
                <thead>
                  <tr className={TABLE.headRow}>
                    <th className={TABLE.thFirst}>案件号</th>
                    <th className={TABLE.th}>客户</th>
                    <th className={TABLE.th}>金额</th>
                    <th className={TABLE.th}>账龄</th>
                    <th className={TABLE.thLast}>负责智能体</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {caseOrders.map((row) => (
                    <tr key={row.id} className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'font-mono text-[11px]')}>{row.orderNo}</td>
                      <td className={TABLE.td}>{row.customer}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>{row.amount}</td>
                      <td className={TABLE.td}>{row.stage}</td>
                      <td className={TABLE.tdLast}>{row.agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
      break;
    }

    case 'dial_strategy':
      body = (
        <div className="space-y-4">
          <OnlinePageHeader title="拨打策略" />
          <div className="text-[13px] text-neutral-600 space-y-2">
            <p>· 工作日 09:00–20:00 可外呼</p>
            <p>· 单号码日拨打上限 3 次</p>
            <p>· 未接通 4 小时后自动重拨</p>
          </div>
        </div>
      );
      break;

    case 'employee_report':
    case 'agent_report': {
      const reportMeta = collectionGroupMeta('reports');
      body = (
        <div>
          <OnlinePageHeader title={reportMeta.title} />
          <CollectionPageSubTabs
            tabs={reportMeta.tabs}
            value={tab}
            onChange={setDomainOpsTab}
            ariaLabel="运营报表子页"
          />
          {tab === 'employee_report' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '外呼总量', value: '18,420' },
                { label: '接通率', value: '58.6%' },
                { label: '承诺还款', value: '1,286' },
                { label: '回款金额', value: '¥ 892万' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-neutral-500">{item.label}</p>
                  <p className="text-xl font-semibold tabular-nums text-neutral-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={TABLE.wrap}>
              <table className={TABLE.table}>
                <thead>
                  <tr className={TABLE.headRow}>
                    <th className={TABLE.thFirst}>智能体</th>
                    <th className={TABLE.th}>外呼量</th>
                    <th className={TABLE.th}>接通率</th>
                    <th className={TABLE.thLast}>承诺还款率</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {(agents.length ? agents : [{ id: 'demo', name: '智能催收专员' }]).map((a) => (
                    <tr key={a.id} className={TABLE.row}>
                      <td className={cn(TABLE.tdFirst, 'font-medium')}>{a.name}</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>9,210</td>
                      <td className={cn(TABLE.td, 'tabular-nums')}>59.2%</td>
                      <td className={cn(TABLE.tdLast, 'tabular-nums')}>12.8%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
      break;
    }

    case 'users':
      body = (
        <div className="space-y-4">
          <OnlinePageHeader title="用户管理" />
          <p className="text-[13px] text-neutral-500">共 12 名业务用户 · 3 个角色组（演示数据）</p>
        </div>
      );
      break;

    case 'alert_whitelist':
      body = (
        <div className="space-y-4">
          <OnlinePageHeader title="监控告警白名单" />
          <p className="text-[13px] text-neutral-500">当前白名单 86 条 · 最近更新 2026-06-10</p>
        </div>
      );
      break;

    default:
      body = null;
  }

  return (
    <>
      {body}
      <CreateCollectionTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        agents={agents}
        defaultAgentId={prefillAgentId}
        onSubmit={(payload) => {
          const agentName = agents.find((a) => a.id === payload.agentId)?.name ?? '智能催收专员';
          const stamp = Date.now().toString().slice(-8);
          setCreatedOrders((prev) => [
            {
              id: `case_${stamp}`,
              orderNo: `COL-${stamp}`,
              customer: payload.name,
              amount: '待核算',
              stage: payload.stage,
              agent: agentName,
            },
            ...prev,
          ]);
        }}
      />
    </>
  );
};

export function isCollectionMainTab(tab: string): tab is CollectionMainTab {
  return (
    tab === 'monitor' ||
    tab === 'resources' ||
    tab === 'outbound_cdr' ||
    tab === 'case_orders' ||
    tab === 'dial_strategy' ||
    tab === 'employee_report' ||
    tab === 'agent_report' ||
    tab === 'users' ||
    tab === 'alert_whitelist'
  );
}
