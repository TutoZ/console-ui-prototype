/**
 * 子用户申请卡片 · 审批弹窗复用
 */

import React from 'react';
import { Ban, Check, Clock } from '@/lib/icons';
import type { SubUserJoinApplication } from '@/lib/navNotificationsMock';
import { BTN_DANGER, BTN_INK, PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';

function DetailRow({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 min-w-0', className)}>
      <dt className="w-[4.75rem] shrink-0 pt-px text-[11px] font-medium text-neutral-500 leading-snug">
        {label}
      </dt>
      <dd
        className={cn(
          'min-w-0 flex-1 text-[13px] leading-snug text-neutral-900 break-all',
          mono && 'font-mono text-[11px] text-neutral-700',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export const SubUserApplicationCard: React.FC<{
  application: SubUserJoinApplication;
  onApprove?: (application: SubUserJoinApplication) => void;
  onReject?: (application: SubUserJoinApplication) => void;
  compactFooter?: boolean;
  highlighted?: boolean;
  borderless?: boolean;
  id?: string;
}> = ({
  application,
  onApprove,
  onReject,
  compactFooter = false,
  highlighted = false,
  borderless = false,
  id,
}) => {
  const pending = application.status === 'pending';
  const thirdPartyLabel = application.accountPin ? '京东 PIN' : '微信昵称';
  const thirdPartyValue = application.accountPin ?? application.wechatNickname ?? '—';
  const showAccountMeta = application.account !== application.seatId;

  return (
    <article
      id={id}
      className={cn(
        borderless
          ? 'pb-5 border-b border-neutral-200/70 last:border-b-0 last:pb-0'
          : cn('overflow-hidden rounded-[13px] bg-white', PANEL, highlighted && 'border-neutral-400'),
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-4',
          borderless ? 'pb-4' : 'px-5 py-4 border-b border-neutral-200/70',
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-800 text-sm font-semibold">
            {application.avatarInitial}
          </span>
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-neutral-900">{application.name}</h3>
              {!pending ? (
                <span
                  className={cn(
                    'inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold',
                    application.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100',
                  )}
                >
                  {application.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12px] text-neutral-500 leading-snug">
              工号 {application.seatId}
              {showAccountMeta ? (
                <>
                  <span className="mx-1.5 text-neutral-300">·</span>
                  账号 {application.account}
                </>
              ) : null}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 tabular-nums shrink-0 pt-1">
          <Clock size={13} />
          {application.appliedAt}
        </span>
      </div>

      <div className={cn(borderless ? 'pt-1' : 'px-5 py-4')}>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
          <DetailRow label="注册邮箱" value={application.email} />
          <DetailRow label="关联手机号" value={application.phone} />
          <DetailRow label={thirdPartyLabel} value={thirdPartyValue} mono />
          <DetailRow
            label="预设角色"
            value={
              <span className="inline-flex h-7 items-center rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-[11px] font-semibold text-neutral-800">
                {application.presetRole}
              </span>
            }
          />
        </dl>

        <div className="mt-4 pt-4 border-t border-neutral-200/70">
          <p className="text-[11px] font-medium text-neutral-500 mb-1.5">来源链接</p>
          <div className="rounded-[7px] border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p
              className="font-mono text-[11px] font-medium text-neutral-800 leading-relaxed break-all select-all"
              title={application.inviteLink}
            >
              {application.inviteLink}
            </p>
          </div>
        </div>
      </div>

      {pending ? (
        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
            borderless ? 'pt-4' : 'px-5 py-3.5 border-t border-neutral-200/70',
          )}
        >
          <p className="text-[11px] text-neutral-500">
            {compactFooter
              ? '审批后将自动创建子用户'
              : '提示：点击“通过”将自动创建子用户并绑定相关账号'}
          </p>
          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <button
              type="button"
              onClick={() => onReject?.(application)}
              className={cn(BTN_DANGER, 'h-8')}
            >
              <Ban size={14} />
              拒绝
            </button>
            <button
              type="button"
              onClick={() => onApprove?.(application)}
              className={cn(BTN_INK, 'h-8')}
            >
              <Check size={14} />
              通过并创建子用户
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};
