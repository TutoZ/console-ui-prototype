/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 对话附件 FileCard — 对齐 dongDesign-AI Attachments / FileCard 语义。
 */

import React from 'react';
import { FileText } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  fileExtLabel,
  type ChatAttachmentRef,
} from '@/lib/chatAttachments';

type ChatAttachmentCardsProps = {
  attachments: ChatAttachmentRef[];
  /** 用户气泡侧右对齐；AI 侧左对齐 */
  align?: 'start' | 'end';
  className?: string;
};

export const ChatAttachmentCards: React.FC<ChatAttachmentCardsProps> = ({
  attachments,
  align = 'end',
  className,
}) => {
  if (!attachments.length) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 w-full max-w-[min(280px,100%)]',
        align === 'end' ? 'items-end' : 'items-start',
        className,
      )}
    >
      {attachments.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-[12px] border border-neutral-200 bg-white',
            'px-2.5 py-2 shadow-[0_1px_2px_rgba(17,17,17,0.04)]',
          )}
          title={file.name}
        >
          <span
            className={cn(
              'w-9 h-9 rounded-[8px] shrink-0 flex flex-col items-center justify-center',
              'bg-[rgba(21,101,191,0.08)] text-[#1565BF]',
            )}
            aria-hidden
          >
            <FileText size={14} strokeWidth={1.75} />
            <span className="text-[8px] font-semibold leading-none mt-0.5 tracking-tight">
              {fileExtLabel(file.name)}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#1c1d1f] truncate leading-5">
              {file.name}
            </p>
            {file.sizeLabel ? (
              <p className="text-[11px] text-neutral-400 leading-4 tabular-nums mt-0.5">
                {file.sizeLabel}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};
