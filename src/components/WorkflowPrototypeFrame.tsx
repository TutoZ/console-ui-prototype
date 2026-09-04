/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 预设流程数字员工 — 全屏 workflow 画布（React 版）
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WorkflowCanvasPage } from './workflow/WorkflowCanvasPage';

type WorkflowPrototypeFrameProps = {
  open: boolean;
  agentName: string;
  agentId: string;
  agentAvatar?: string;
  onClose: () => void;
};

export const WorkflowPrototypeFrame: React.FC<WorkflowPrototypeFrameProps> = ({
  open,
  agentName,
  agentId,
  agentAvatar,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] bg-white animate-in fade-in duration-200">
      <WorkflowCanvasPage
        agentName={agentName}
        agentId={agentId}
        agentAvatar={agentAvatar}
        onBack={onClose}
      />
    </div>,
    document.body,
  );
};
