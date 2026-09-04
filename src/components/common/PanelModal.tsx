/**
 * 480px 窄弹窗 · 分区壳（邀请同事 / 链接成功态规范）
 *
 * - header：标题 + 说明 + 关闭
 * - body：px-5 pb-5
 * - footer：右对齐 flex-nowrap，次按钮 BTN_SOFT + 主按钮 BTN_INK
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@/lib/icons';
import { MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';

/** 分区 class，供自定义 footer / 嵌套内容复用 */
export const panelModalClass = {
  shell:
    'w-[480px] max-w-[calc(100vw-32px)] flex flex-col p-0 overflow-hidden ring-1 ring-black/10 shadow-lg',
  header: 'shrink-0 px-5 pt-5 pb-4',
  body: 'px-5 pb-5',
  footer: 'shrink-0 px-5 pb-5 flex items-center justify-end gap-2 flex-nowrap',
} as const;

export interface PanelModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 复写 shell 宽度，默认 480px 窄弹窗 */
  shellClassName?: string;
  bodyClassName?: string;
  overlayClassName?: string;
  zIndexClass?: string;
}

export const PanelModal: React.FC<PanelModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  shellClassName,
  bodyClassName,
  overlayClassName,
  zIndexClass = 'z-[130]',
}) => {
  if (!open) return null;

  return createPortal(
    <div className={cn(MODAL_OVERLAY, zIndexClass, overlayClassName)} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, panelModalClass.shell, shellClassName)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className={panelModalClass.header}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-neutral-900">{title}</h2>
              {description ? (
                <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">{description}</p>
              ) : null}
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
        </header>

        <div className={cn(panelModalClass.body, bodyClassName)}>{children}</div>

        {footer ? <footer className={panelModalClass.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
};
