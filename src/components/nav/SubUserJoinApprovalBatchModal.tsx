/**
 * 子用户加入申请 · 批量审批弹窗（通知中心多条申请一次处理）
 * 布局对齐在线客服列表页：扁平表格 + 可展开详情行
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, Check, ChevronDown, Copy, Search, X } from '@/lib/icons';
import type { SubUserJoinApplication } from '@/lib/navNotificationsMock';
import {
  countPendingInviteApplications,
  countProcessedInviteApplications,
  getInviteApplications,
} from '@/lib/subUserInviteStore';
import { BTN_DANGER, BTN_INK, LIST_META, MODAL_OVERLAY, MODAL_PANEL, MODAL_SHELL_FIXED_MD, SEARCH_FIELD } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { OnlineEmptyRow, onlineTableClass } from '../common/OnlinePageLayout';

type ApprovalTab = 'pending' | 'processed';

const MODAL_SHELL = cn(
  MODAL_SHELL_FIXED_MD,
  'w-[920px] max-w-[calc(100vw-32px)] p-0',
);

function ApprovalStatusTabs({
  tab,
  pendingCount,
  processedCount,
  onChange,
}: {
  tab: ApprovalTab;
  pendingCount: number;
  processedCount: number;
  onChange: (next: ApprovalTab) => void;
}) {
  const tabs: Array<{ id: ApprovalTab; label: string; count: number; countTone: 'danger' | 'neutral' }> = [
    { id: 'pending', label: '待审批', count: pendingCount, countTone: 'danger' },
    { id: 'processed', label: '已审批', count: processedCount, countTone: 'neutral' },
  ];

  return (
    <nav className="flex items-center gap-1" role="tablist" aria-label="审批状态">
      {tabs.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative h-9 px-3 text-[13px] transition cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              active
                ? 'font-semibold text-neutral-900'
                : 'font-medium text-neutral-500 hover:text-neutral-800',
            )}
          >
            <span>{item.label}</span>
            {item.count > 0 ? (
              <span
                className={cn(
                  'inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none',
                  item.countTone === 'danger'
                    ? 'bg-red-500 text-white'
                    : 'bg-neutral-200 text-neutral-600',
                )}
              >
                {item.count > 9 ? '9+' : item.count}
              </span>
            ) : null}
            {active ? (
              <span
                className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-neutral-900"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function ApplicantCell({ application }: { application: SubUserJoinApplication }) {
  const showAccount = application.account !== application.seatId;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-bold">
        {application.avatarInitial}
      </span>
      <div className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-neutral-900">{application.name}</span>
        <span className="block truncate text-[11px] text-neutral-500">
          工号 {application.seatId}
          {showAccount ? ` · ${application.account}` : ''}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ application }: { application: SubUserJoinApplication }) {
  const approved = application.status === 'approved';
  const auditText = application.approverName
    ? `${application.approverName}${application.processedAt ? ` · ${application.processedAt}` : ''}`
    : null;

  return (
    <div className="inline-flex flex-col items-end gap-0.5 min-w-0 max-w-full">
      <span
        className={cn(
          'inline-flex h-7 items-center rounded-md px-2 text-[10px] font-semibold whitespace-nowrap',
          approved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-rose-50 text-rose-700 border border-rose-100',
        )}
      >
        {approved ? '已通过' : '已拒绝'}
      </span>
      {auditText ? (
        <span
          className="truncate max-w-full text-[10px] text-neutral-500 tabular-nums"
          title={auditText}
        >
          {auditText}
        </span>
      ) : null}
    </div>
  );
}

function ApplicationExpandedDetail({
  application,
  pending,
  onCopyLink,
}: {
  application: SubUserJoinApplication;
  pending: boolean;
  onCopyLink: (link: string) => void;
}) {
  const thirdPartyLabel = application.accountPin ? '京东 PIN' : '微信昵称';
  const thirdPartyValue = application.accountPin ?? application.wechatNickname ?? '—';

  return (
    <div className="pl-6 pr-1 mt-1.5">
      <div className="overflow-hidden rounded-[10px] border border-neutral-200/90 bg-white">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2 min-w-0">
          <span className="shrink-0 text-[11px] font-medium text-neutral-500">第三方账号</span>
          <span
            className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium text-neutral-800"
            title={thirdPartyValue}
          >
            {thirdPartyValue}
          </span>
          <span className="shrink-0 text-[10px] text-neutral-400">{thirdPartyLabel}</span>
        </div>

        <div className="relative bg-neutral-50/60 px-3 py-2">
          <p
            className="min-w-0 pr-8 font-mono text-[11px] font-medium leading-relaxed text-neutral-800 break-all select-all"
            title={application.inviteLink}
          >
            {application.inviteLink}
          </p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopyLink(application.inviteLink);
            }}
            title="复制链接"
            className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/90 hover:text-neutral-800"
          >
            <Copy size={13} />
          </button>
        </div>

        {pending ? (
          <p className="border-t border-neutral-100 px-3 py-2 text-[11px] leading-relaxed text-neutral-400">
            审批通过后将自动创建子用户并绑定账号
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-neutral-100 px-3 py-2 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-neutral-500">审批结果</span>
              {application.status === 'approved' ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <Check size={12} className="shrink-0" />
                  已通过（子用户已生成）
                </span>
              ) : (
                <span className="font-medium text-rose-700">已拒绝</span>
              )}
            </div>
            {application.approverName && application.processedAt ? (
              <div className="flex items-center gap-1.5 shrink-0 text-neutral-500">
                <span>审批人</span>
                <span className="text-neutral-800 tabular-nums">
                  {application.approverName} · {application.processedAt}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function TableMetaCell({
  primary,
  secondary,
  mono = false,
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className={cn('truncate text-[12px] text-neutral-800', mono && 'font-mono text-[11px]')}>
        {primary}
      </p>
      <p className="truncate text-[11px] text-neutral-500 tabular-nums">{secondary}</p>
    </div>
  );
}

function ApplicationTableRow({
  application,
  tab,
  expanded,
  onToggle,
  onApprove,
  onReject,
  onCopyLink,
}: {
  application: SubUserJoinApplication;
  tab: ApprovalTab;
  expanded: boolean;
  onToggle: () => void;
  onApprove?: (application: SubUserJoinApplication) => void;
  onReject?: (application: SubUserJoinApplication) => void;
  onCopyLink: (link: string) => void;
}) {
  const pending = application.status === 'pending';

  return (
    <>
      <tr
        className={cn(
          onlineTableClass.row,
          expanded && 'bg-neutral-50/60 [&>td]:pb-2',
          'cursor-pointer',
        )}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <td className={cn(onlineTableClass.tdFirst, 'align-middle')}>
          <div className="flex items-center gap-2 min-w-0 w-full">
            <ChevronDown
              size={14}
              className={cn(
                'shrink-0 text-neutral-400 transition-transform',
                expanded && 'rotate-180',
              )}
            />
            <ApplicantCell application={application} />
          </div>
        </td>
        <td className={cn(onlineTableClass.td, 'align-middle')}>
          <TableMetaCell primary={application.email} secondary={application.phone} />
        </td>
        <td className={cn(onlineTableClass.td, 'align-middle')}>
          <span className="inline-flex h-7 items-center rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-semibold text-neutral-800 whitespace-nowrap">
            {application.presetRole}
          </span>
        </td>
        <td className={cn(onlineTableClass.td, 'align-middle text-[12px] text-neutral-800 tabular-nums whitespace-nowrap')}>
          {application.appliedAt}
        </td>
        <td
          className={cn(onlineTableClass.tdLast, 'align-middle pl-2 pr-1')}
          onClick={(event) => event.stopPropagation()}
        >
          {tab === 'pending' && pending ? (
            <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onReject?.(application)}
                className={cn(BTN_DANGER, 'shrink-0 whitespace-nowrap min-w-[4.5rem]')}
              >
                <Ban size={13} className="shrink-0" />
                拒绝
              </button>
              <button
                type="button"
                onClick={() => onApprove?.(application)}
                className={cn(BTN_INK, 'shrink-0 whitespace-nowrap min-w-[4.5rem]')}
              >
                <Check size={13} className="shrink-0" />
                通过
              </button>
            </div>
          ) : (
            <StatusPill application={application} />
          )}
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-neutral-50/40">
          <td colSpan={5} className="px-1 pb-2 pt-1">
            <ApplicationExpandedDetail
              application={application}
              pending={pending}
              onCopyLink={onCopyLink}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

export const SubUserJoinApprovalBatchModal: React.FC<{
  open: boolean;
  onClose: () => void;
  focusApplicationId?: string | null;
  onApprove?: (application: SubUserJoinApplication) => void;
  onReject?: (application: SubUserJoinApplication) => void;
}> = ({ open, onClose, focusApplicationId, onApprove, onReject }) => {
  const [tab, setTab] = useState<ApprovalTab>('pending');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState(getInviteApplications);

  React.useEffect(() => {
    if (!open) return;
    const next = getInviteApplications();
    setApplications(next);
    if (focusApplicationId) {
      const target = next.find((item) => item.id === focusApplicationId);
      setTab(target?.status === 'pending' ? 'pending' : 'processed');
      setExpandedId(focusApplicationId);
    } else {
      setTab('pending');
      setExpandedId(null);
    }
    setSearch('');
  }, [open, focusApplicationId]);

  const pendingCount = countPendingInviteApplications();
  const processedCount = countProcessedInviteApplications();

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return applications.filter((item) => {
      const matchTab = tab === 'pending' ? item.status === 'pending' : item.status !== 'pending';
      if (!matchTab) return false;
      if (!keyword) return true;
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.account.toLowerCase().includes(keyword) ||
        item.phone.includes(keyword) ||
        item.email.toLowerCase().includes(keyword)
      );
    });
  }, [applications, search, tab]);

  const refresh = () => setApplications(getInviteApplications());

  const handleApprove = (application: SubUserJoinApplication) => {
    onApprove?.(application);
    refresh();
  };

  const handleReject = (application: SubUserJoinApplication) => {
    onReject?.(application);
    refresh();
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[320]')} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, MODAL_SHELL)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="审批详情"
      >
        <header className="shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-neutral-900">审批详情</h2>
              <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">
                审批通过后，系统将自动创建子用户、绑定账号并配置权限
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <ApprovalStatusTabs
              tab={tab}
              pendingCount={pendingCount}
              processedCount={processedCount}
              onChange={(next) => {
                setTab(next);
                setExpandedId(null);
              }}
            />

            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索姓名、账号或手机号"
                className={cn(SEARCH_FIELD, 'w-full pl-9 pr-3')}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 pb-4">
          <div className={onlineTableClass.wrap}>
            <table className={cn(onlineTableClass.table, 'w-full table-fixed')}>
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead>
                <tr className={onlineTableClass.headRow}>
                  <th className={cn(onlineTableClass.thFirst, 'align-middle')}>申请人</th>
                  <th className={cn(onlineTableClass.th, 'align-middle')}>联系信息</th>
                  <th className={cn(onlineTableClass.th, 'align-middle')}>预设角色</th>
                  <th className={cn(onlineTableClass.th, 'align-middle whitespace-nowrap')}>申请时间</th>
                  <th className={cn(onlineTableClass.thLast, 'align-middle pl-2 pr-1')}>
                    {tab === 'pending' ? '操作' : '状态'}
                  </th>
                </tr>
              </thead>
              <tbody className={onlineTableClass.body}>
                {filtered.length === 0 ? (
                  <OnlineEmptyRow colSpan={5}>
                    {tab === 'pending' ? '暂无待审批申请' : '暂无已审批记录'}
                  </OnlineEmptyRow>
                ) : (
                  filtered.map((application) => (
                    <ApplicationTableRow
                      key={application.id}
                      application={application}
                      tab={tab}
                      expanded={expandedId === application.id}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === application.id ? null : application.id,
                        )
                      }
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onCopyLink={copyLink}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="shrink-0 px-5 pb-5">
          <p className={LIST_META}>
            共 {applications.length} 条申请（待审批 {pendingCount}）
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
