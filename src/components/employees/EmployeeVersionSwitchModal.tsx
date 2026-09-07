/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 员工卡「版本切换」快捷弹窗 — 列表内一键应用培训存档。
 */

import React, { useMemo } from 'react';
import { Check, RotateCcw } from '@/lib/icons';
import { LIFECYCLE_TERMS } from '@/lib/platformTerminology';
import { BTN_SOFT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import type { HiredAgent } from '../../types';
import {
  buildAgentConfigVersions,
  ensureAgentSnapshots,
  getPublishedSnapshot,
  snapshotToAgentUpdates,
  VERSION_STATUS_META,
} from '../../lib/agentVersions';
import { Modal } from '../common/Modal';

type EmployeeVersionSwitchModalProps = {
  open: boolean;
  agent: HiredAgent | null;
  onClose: () => void;
  onApply: (agentId: string, snapshotId: string) => void;
  onOpenFullManager?: (agentId: string) => void;
};

export const EmployeeVersionSwitchModal: React.FC<EmployeeVersionSwitchModalProps> = ({
  open,
  agent,
  onClose,
  onApply,
  onOpenFullManager,
}) => {
  const switchable = useMemo(() => {
    if (!agent) return [];
    return buildAgentConfigVersions(agent, [], [], {}).filter((v) => Boolean(v.snapshotId));
  }, [agent]);

  if (!agent) return null;

  const snapshots = ensureAgentSnapshots(agent);
  const published = getPublishedSnapshot(agent, snapshots);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={LIFECYCLE_TERMS.switchVersion}
      description={`为「${agent.name}」选择要上岗的培训存档`}
      maxWidth="max-w-md"
      footer={
        <>
          {onOpenFullManager ? (
            <button
              type="button"
              className={cn(BTN_SOFT, 'mr-auto')}
              onClick={() => {
                onOpenFullManager(agent.id);
                onClose();
              }}
            >
              在培训中管理
            </button>
          ) : null}
          <button type="button" className={BTN_SOFT} onClick={onClose}>
            关闭
          </button>
        </>
      }
    >
      {switchable.length === 0 ? (
        <p className="text-[12px] text-neutral-500 py-6 text-center">
          暂无培训存档。进入培训并保存后，可在此快捷切换。
        </p>
      ) : (
        <div className="space-y-2 max-h-[min(48vh,360px)] overflow-y-auto custom-scrollbar -mx-1 px-1">
          {switchable.map((ver) => {
            const isCurrent = published?.id === ver.snapshotId;
            const meta = VERSION_STATUS_META[ver.status];
            return (
              <div
                key={ver.id}
                className={cn(
                  'rounded-lg border px-3 py-2.5 flex items-start gap-2.5',
                  isCurrent
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-neutral-200 bg-white',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold text-neutral-900 truncate">
                      {ver.title}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-semibold',
                        meta.badge,
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                      {isCurrent ? '当前运行' : meta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono mt-1 truncate">{ver.code}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{ver.time}</p>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 inline-flex items-center gap-0.5 h-7 px-2 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                    <Check size={12} strokeWidth={2.5} />
                    已应用
                  </span>
                ) : (
                  <button
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium text-neutral-800 bg-white border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition"
                    onClick={() => {
                      if (!ver.snapshotId) return;
                      onApply(agent.id, ver.snapshotId);
                    }}
                  >
                    <RotateCcw size={12} />
                    应用
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export function applyAgentVersionSnapshot(
  agent: HiredAgent,
  snapshotId: string,
): Partial<HiredAgent> | null {
  const snapshots = ensureAgentSnapshots(agent);
  const snap = snapshots.find((s) => s.id === snapshotId);
  if (!snap) return null;
  return {
    ...snapshotToAgentUpdates(snap),
    publishedSnapshotId: snapshotId,
    configSnapshots: snapshots,
  };
}
