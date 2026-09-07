/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 任务中心大弹窗 — Portal 到 body；标题固定，内容区滚动。
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { TaskCenterPage } from './TaskCenterPage';
import { X } from '@/lib/icons';
import { MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { TASK_CENTER_COPY } from '@/lib/platformTerminology';
import { cn } from '@/lib/utils';

export const TaskCenterHost: React.FC = () => {
  const { showTaskCenter, setShowTaskCenter } = useApp();

  if (!showTaskCenter) return null;

  return createPortal(
    <div
      className={cn(MODAL_OVERLAY, 'z-[120]')}
      onClick={() => setShowTaskCenter(false)}
      role="presentation"
    >
      <div
        className={cn(
          MODAL_PANEL,
          'w-full max-w-5xl h-[min(88vh,760px)] p-0 overflow-hidden flex flex-col mx-auto',
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-center-title"
      >
        <header className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 pr-2">
            <h2
              id="task-center-title"
              className="text-[16px] font-semibold tracking-tight text-neutral-900 leading-snug"
            >
              {TASK_CENTER_COPY.title}
            </h2>
            <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">
              {TASK_CENTER_COPY.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTaskCenter(false)}
            aria-label="关闭"
            className="shrink-0 -mr-1 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        <TaskCenterPage embedded />
      </div>
    </div>,
    document.body,
  );
};
