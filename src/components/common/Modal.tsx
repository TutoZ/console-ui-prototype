/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一弹窗：遮罩 + 面板 + 标题区 + 底部操作区。
 * 分区用间距，不用横线分割。
 * 含 Tab / 可切换内容时请用 MODAL_SHELL_FIXED（固定 h），禁止因切 Tab 改变弹窗尺寸。
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/lib/icons';
import { MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** @deprecated 优先使用纯文字标题；仅遗留场景保留 */
  icon?: React.ReactNode;
  /** 覆盖默认图标容器样式（如警告确认：圆形琥珀底） */
  iconClassName?: string;
  title: string;
  /** 标题下方说明 */
  description?: string;
  /** 右上角关闭按钮，默认开启 */
  showClose?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  overlayClassName?: string;
  className?: string;
  /** footer 顶部分隔线，确认类弹窗可用 */
  footerDivider?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  icon,
  iconClassName,
  title,
  description,
  showClose = true,
  children,
  footer,
  maxWidth = 'max-w-sm',
  overlayClassName,
  className,
  footerDivider = false,
}) => {
  if (!open) return null;

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[130]', overlayClassName)} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, maxWidth, className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {icon ? (
          <div className="flex items-start gap-3 mb-3">
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-neutral-100 text-neutral-700',
                iconClassName,
              )}
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 leading-snug">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">{description}</p>
              ) : null}
            </div>
            {showClose ? (
              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="shrink-0 -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 text-[16px] font-semibold tracking-tight text-neutral-900 leading-snug">
                {title}
              </h2>
              {showClose ? (
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={onClose}
                  className="shrink-0 -mr-1 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            {description ? (
              <p className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed pr-6">{description}</p>
            ) : null}
          </div>
        )}

        {children != null && children !== false ? (
          <div className="text-xs text-neutral-800 leading-relaxed">{children}</div>
        ) : null}

        {footer ? (
          <div
            className={cn(
              'flex gap-2 justify-end',
              footerDivider ? 'mt-5 pt-4 border-t border-neutral-100' : 'mt-6 pt-3',
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
