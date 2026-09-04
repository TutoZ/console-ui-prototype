/**
 * 子用户邀请 · 链接管理（向导内卡片列表 / 宽屏表格）
 */

import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink } from '@/lib/icons';
import { buildLocalInviteJoinUrl } from '@/lib/inviteRoute';
import {
  type InviteCampaign,
  deactivateInviteCampaign,
  formatInviteCampaignDeadline,
  getInviteCampaignStatusLabel,
  getInviteCampaigns,
  subscribeInviteStore,
} from '@/lib/subUserInviteStore';
import { LIST_META, PANEL, TABLE } from '@/lib/ui';
import { cn } from '@/lib/utils';

function truncateLink(link: string, max = 34): string {
  if (link.length <= max) return link;
  return `${link.slice(0, max)}…`;
}

function LoginMethodBadge({ method }: { method: InviteCampaign['loginMethod'] }) {
  const isWechat = method === 'wechat';
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold border whitespace-nowrap',
        isWechat
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-rose-50 text-rose-700 border-rose-100',
      )}
    >
      {isWechat ? '微信邀请' : '京东邀请'}
    </span>
  );
}

type InviteStatusTone = ReturnType<typeof getInviteCampaignStatusLabel>['tone'];

function progressBarClass(tone: InviteStatusTone): string {
  if (tone === 'online') return 'bg-emerald-500';
  if (tone === 'expired') return 'bg-amber-500';
  if (tone === 'full') return 'bg-neutral-400';
  return 'bg-neutral-300';
}

function ProgressCell({
  used,
  total,
  tone = 'online',
  compact = false,
}: {
  used: number;
  total: number;
  tone?: InviteStatusTone;
  compact?: boolean;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className={cn('flex items-center gap-2', compact ? 'min-w-0 w-full' : 'w-[88px]')}>
      <div
        className={cn(
          'h-1.5 rounded-full bg-neutral-100 overflow-hidden',
          compact ? 'flex-1 min-w-0' : 'flex-1 min-w-[48px] max-w-[72px]',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all', progressBarClass(tone))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-neutral-700 tabular-nums shrink-0">
        {used}/{total}
      </span>
    </div>
  );
}

function StatusBadge({ campaign }: { campaign: InviteCampaign }) {
  const { label, tone } = getInviteCampaignStatusLabel(campaign);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-6 rounded-md px-2 text-[11px] font-semibold border whitespace-nowrap',
        tone === 'online' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
        tone === 'offline' && 'bg-neutral-100 text-neutral-600 border-neutral-200',
        tone === 'expired' && 'bg-amber-50 text-amber-700 border-amber-100',
        tone === 'full' && 'bg-neutral-100 text-neutral-600 border-neutral-200',
      )}
    >
      {tone === 'online' ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
      {label}
    </span>
  );
}

function RoleTags({ roles, max = 4 }: { roles: string[]; max?: number }) {
  const visible = roles.slice(0, max);
  const rest = roles.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1 min-w-0">
      {visible.map((role) => (
        <span
          key={role}
          className="inline-flex h-6 items-center rounded-md border border-blue-100 bg-blue-50 px-2 text-[10px] font-semibold text-blue-700"
        >
          {role}
        </span>
      ))}
      {rest > 0 ? (
        <span className="inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold text-neutral-500">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

function InviteLinkActions({
  campaign,
  onSimulate,
  onOffline,
}: {
  campaign: InviteCampaign;
  onSimulate: (token: string) => void;
  onOffline: (campaign: InviteCampaign) => void;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={() => onSimulate(campaign.token)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        模拟申请
        <ExternalLink size={12} />
      </button>
      <button
        type="button"
        onClick={() => onOffline(campaign)}
        disabled={campaign.status === 'offline'}
        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:text-neutral-300 disabled:cursor-not-allowed cursor-pointer"
      >
        删除
      </button>
    </div>
  );
}

function statusTextClass(tone: InviteStatusTone): string {
  if (tone === 'online') return 'text-emerald-700';
  if (tone === 'expired') return 'text-amber-700';
  return 'text-neutral-600';
}

function InviteLinkCard({
  campaign,
  onCopy,
  onSimulate,
  onOffline,
}: {
  campaign: InviteCampaign;
  onCopy: (link: string) => void;
  onSimulate: (token: string) => void;
  onOffline: (campaign: InviteCampaign) => void;
}) {
  const { label, tone } = getInviteCampaignStatusLabel(campaign);
  const deadline = formatInviteCampaignDeadline(campaign);
  const rolesText = campaign.presetRoles.join('、');

  return (
    <article className="rounded-[7px] border border-neutral-200 px-3.5 py-3">
      <div className="flex items-center gap-1.5 min-w-0 text-[11px] leading-none flex-wrap">
        {tone === 'online' ? (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
        ) : null}
        <span className={cn('font-semibold shrink-0', statusTextClass(tone))}>{label}</span>
        <span className="text-neutral-300 shrink-0">·</span>
        <span className="text-neutral-600 tabular-nums shrink-0">
          {campaign.usedCount}/{campaign.userCount}
        </span>
        <span className="text-neutral-300 shrink-0">·</span>
        <span className="text-neutral-400 tabular-nums truncate min-w-0">{deadline}</span>
      </div>

      <div className="relative mt-2.5 rounded-[7px] border border-neutral-200 bg-neutral-50 pl-3 pr-9 py-2">
        <p
          className="font-mono text-[11px] font-medium text-neutral-900 leading-relaxed break-all select-all"
          title={campaign.link}
        >
          {campaign.link}
        </p>
        <button
          type="button"
          onClick={() => onCopy(campaign.link)}
          title="复制链接"
          className="absolute right-1 top-1 h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-white/80 cursor-pointer"
        >
          <Copy size={13} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 min-w-0">
        <p className="text-[11px] text-neutral-500 truncate min-w-0" title={rolesText}>
          {rolesText || '未设置角色'}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSimulate(campaign.token)}
            className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer whitespace-nowrap"
          >
            模拟申请
          </button>
          <button
            type="button"
            onClick={() => onOffline(campaign)}
            disabled={campaign.status === 'offline'}
            className="text-[11px] font-medium text-neutral-500 hover:text-rose-600 disabled:text-neutral-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            删除
          </button>
        </div>
      </div>
    </article>
  );
}

export const InviteLinkManageTable: React.FC<{
  compact?: boolean;
  showToast?: (message: string) => void;
  className?: string;
}> = ({ compact = false, showToast, className }) => {
  const [campaigns, setCampaigns] = useState<InviteCampaign[]>(() => getInviteCampaigns());

  useEffect(() => subscribeInviteStore(() => setCampaigns(getInviteCampaigns())), []);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      showToast?.('邀请链接已复制');
    } catch {
      showToast?.('复制失败，请手动选择链接复制');
    }
  };

  const simulateApply = (token: string) => {
    window.open(buildLocalInviteJoinUrl(token), '_blank', 'noopener,noreferrer');
  };

  const handleOffline = (campaign: InviteCampaign) => {
    if (campaign.status === 'offline') {
      showToast?.('该链接已下线');
      return;
    }
    if (!confirm('删除后邀请链接将立即下线，不再接受新申请，确定吗？')) return;
    deactivateInviteCampaign(campaign.token);
    showToast?.('邀请链接已下线');
  };

  if (campaigns.length === 0) {
    return (
      <div className={cn(compact ? 'py-12 text-center' : cn(PANEL, 'p-8 text-center'), className)}>
        <p className="text-[13px] font-semibold text-neutral-800">暂无邀请链接</p>
        <p className="mt-1 text-[11px] text-neutral-500">创建邀请后将在此统一管理链接状态与申请进度。</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex flex-col min-h-0 h-full', className)}>
        <p className={cn(LIST_META, 'shrink-0 mb-3')}>共 {campaigns.length} 条历史邀请</p>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
          {campaigns.map((campaign) => (
            <InviteLinkCard
              key={campaign.token}
              campaign={campaign}
              onCopy={copyLink}
              onSimulate={simulateApply}
              onOffline={handleOffline}
            />
          ))}
        </div>
      </div>
    );
  }

  const linkTruncate = 40;

  return (
    <div className={cn(PANEL, 'overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-neutral-200/70 flex items-center justify-between gap-3">
        <p className={LIST_META}>共 {campaigns.length} 条历史邀请</p>
      </div>

      <div className={cn(TABLE.wrap, 'custom-scrollbar')}>
        <table className={cn(TABLE.table, 'min-w-[960px]')}>
          <thead>
            <tr className={TABLE.headRow}>
              <th className={cn(TABLE.thFirst, 'min-w-[120px]')}>预设角色</th>
              <th className={cn(TABLE.th, 'min-w-[180px]')}>邀请链接</th>
              <th className={TABLE.th}>联登方式</th>
              <th className={TABLE.th}>申请进度</th>
              <th className={TABLE.th}>创建人</th>
              <th className={cn(TABLE.th, 'whitespace-nowrap')}>有效期至</th>
              <th className={TABLE.th}>链接状态</th>
              <th className={TABLE.thLast}>操作</th>
            </tr>
          </thead>
          <tbody className={TABLE.body}>
            {campaigns.map((campaign) => (
              <tr key={campaign.token} className={TABLE.row}>
                <td className={TABLE.tdFirst}>
                  <RoleTags roles={campaign.presetRoles} />
                </td>
                <td className={TABLE.td}>
                  <div className="flex items-center gap-1 min-w-0 max-w-[220px]">
                    <span
                      className="font-mono text-[11px] text-neutral-700 truncate"
                      title={campaign.link}
                    >
                      {truncateLink(campaign.link, linkTruncate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyLink(campaign.link)}
                      className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      title="复制链接"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </td>
                <td className={TABLE.td}>
                  <LoginMethodBadge method={campaign.loginMethod} />
                </td>
                <td className={TABLE.td}>
                  <ProgressCell
                    used={campaign.usedCount}
                    total={campaign.userCount}
                    tone={getInviteCampaignStatusLabel(campaign).tone}
                  />
                </td>
                <td className={cn(TABLE.td, 'text-neutral-700')}>
                  {campaign.creatorName}
                  <span className="text-neutral-400"> ({campaign.creatorRole})</span>
                </td>
                <td className={cn(TABLE.td, 'text-[11px] text-neutral-600 tabular-nums whitespace-nowrap')}>
                  {formatInviteCampaignDeadline(campaign)}
                </td>
                <td className={TABLE.td}>
                  <StatusBadge campaign={campaign} />
                </td>
                <td className={TABLE.tdLast}>
                  <InviteLinkActions
                    campaign={campaign}
                    onSimulate={simulateApply}
                    onOffline={handleOffline}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
