/**
 * 子用户加入申请 · 审批弹窗（通知中心邀请进入）
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/lib/icons';
import type { SubUserJoinApplication } from '@/lib/navNotificationsMock';
import { BTN_SOFT, MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { SubUserApplicationCard } from './SubUserApplicationCard';

const MODAL_SHELL =
  'w-[920px] max-w-[calc(100vw-32px)] flex flex-col p-0 overflow-hidden';

export const SubUserJoinApprovalModal: React.FC<{
  open: boolean;
  application: SubUserJoinApplication | null;
  onClose: () => void;
  onApprove?: (application: SubUserJoinApplication) => void;
  onReject?: (application: SubUserJoinApplication) => void;
}> = ({ open, application, onClose, onApprove, onReject }) => {
  if (!open || !application) return null;

  const pending = application.status === 'pending';

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[320]')} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, MODAL_SHELL)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="审批详情"
      >
        <header className="shrink-0 px-5 pt-5 pb-4 flex items-start justify-between gap-3">
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
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 pb-5">
          <SubUserApplicationCard
            application={application}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>

        {!pending ? (
          <footer className="shrink-0 px-5 pb-5 flex justify-end">
            <button type="button" onClick={onClose} className={BTN_SOFT}>
              关闭
            </button>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
