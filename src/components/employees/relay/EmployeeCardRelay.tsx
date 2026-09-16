/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CREATE_METHOD_DISPLAY_META,
  resolveCreateMethodDisplay,
  type EmployeeCreateMethod,
} from '@/lib/employeeCreateMethod';
import { isAvatarImageUrl } from '@/lib/agentAvatarDisplay';
import styles from './EmployeeCardRelay.module.scss';

export interface EmployeeCardRelayProps {
  name: string;
  desc: string;
  avatar: string;
  avatarFallback?: string;
  isOnline: boolean;
  /** 主按钮文案，默认“培训” */
  primaryActionLabel?: string | null;
  onPrimaryAction?: () => void;
  /**
   * 次按钮：仅当没有上下岗时展示“派发任务”。
   * 卡片主区最多两个主按钮：培训 + 上下岗；无上下岗才用派发任务。
   */
  onDispatchTask?: () => void;
  dispatchActionLabel?: string;
  /** 展示“上岗”或“下岗”时，不再同时展示派发任务 */
  showGoOnlineButton?: boolean;
  onGoOnline?: () => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  /** 主按钮旁通知点（如母版升级） */
  hasTrainNotice?: boolean;
  /** 岗位族标签（卡片右上角） */
  jobFamilyLabel?: string;
  /** 创建方式标签（标题下方）：自主规划 / 预设流程 */
  createMethod?: EmployeeCreateMethod;
  moreMenu?: React.ReactNode;
  moreOpen?: boolean;
  /** 头像角标在线状态，首页快捷入口不展示 */
  showStatusDot?: boolean;
}

export const EmployeeCardRelay: React.FC<EmployeeCardRelayProps> = ({
  name,
  desc,
  avatar,
  avatarFallback,
  isOnline,
  primaryActionLabel = '培训',
  onPrimaryAction,
  onDispatchTask,
  dispatchActionLabel = '派发任务',
  showGoOnlineButton = false,
  onGoOnline,
  onMoreClick,
  hasTrainNotice = false,
  jobFamilyLabel,
  createMethod,
  moreMenu,
  moreOpen,
  showStatusDot = true,
}) => {
  const statusColor = isOnline ? '#00AC6B' : '#737373';
  const showImage = isAvatarImageUrl(avatar);
  const showPrimary = Boolean(primaryActionLabel && onPrimaryAction);
  const [hoverOpen, setHoverOpen] = useState(false);
  const menuVisible = Boolean(moreMenu) && (moreOpen || hoverOpen);
  const displayKind = createMethod ? resolveCreateMethodDisplay(createMethod) : null;
  const methodMeta = displayKind ? CREATE_METHOD_DISPLAY_META[displayKind] : null;
  const methodTagClass =
    displayKind === 'preset' ? styles.tagMethodPreset : styles.tagMethodAutonomous;

  return (
    <div className={styles.card}>
      {jobFamilyLabel ? (
        <div className={styles.familyRibbon}>
          <span className={styles.familyBadge} title={jobFamilyLabel}>
            {jobFamilyLabel}
          </span>
        </div>
      ) : null}
      <div className={styles.cardInner}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatarBorder}>
            {showImage ? (
              <img className={styles.avatarImg} src={avatar} alt="" />
            ) : (
              <span>{avatarFallback ?? avatar}</span>
            )}
          </div>
          {showStatusDot ? (
            <div className={styles.statusDot} style={{ backgroundColor: statusColor }} />
          ) : null}
        </div>

        <div className={styles.name}>{name}</div>

        {methodMeta ? (
          <div className={styles.tagWrap}>
            <span className={methodTagClass} title={methodMeta.label}>
              {methodMeta.tagLabel}
            </span>
          </div>
        ) : null}

        <div className={styles.descWrap}>
          <div className={styles.desc}>{desc}</div>
        </div>

        <div className={styles.actionWrap}>
          <div className={styles.actionInner}>
            {showPrimary ? (
              <button
                type="button"
                className={
                  primaryActionLabel === '上岗' ? styles.btnWork : styles.btnTrain
                }
                onClick={onPrimaryAction}
                aria-label={
                  hasTrainNotice ? `${primaryActionLabel}，有待处理通知` : primaryActionLabel!
                }
              >
                <span
                  className={
                    primaryActionLabel === '上岗' ? styles.btnWorkText : styles.btnTrainText
                  }
                >
                  {primaryActionLabel}
                </span>
                {hasTrainNotice ? (
                  <span className={styles.trainNoticeDot} aria-hidden />
                ) : null}
              </button>
            ) : null}
            {showGoOnlineButton && onGoOnline ? (
              <button
                type="button"
                className={isOnline ? styles.btnTrain : styles.btnWork}
                onClick={onGoOnline}
              >
                <span className={isOnline ? styles.btnTrainText : styles.btnWorkText}>
                  {isOnline ? '下岗' : '上岗'}
                </span>
              </button>
            ) : onDispatchTask ? (
              <button type="button" className={styles.btnRest} onClick={onDispatchTask}>
                <span className={styles.btnRestText}>{dispatchActionLabel}</span>
              </button>
            ) : null}
            {moreMenu ? (
            <div
              className={styles.moreWrap}
              onMouseEnter={() => setHoverOpen(true)}
              onMouseLeave={() => setHoverOpen(false)}
            >
              <button
                type="button"
                className={styles.btnMore}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoreClick?.(e);
                }}
                aria-expanded={menuVisible}
                aria-haspopup="menu"
              >
                <span className={styles.btnMoreText}>•••</span>
              </button>
              {menuVisible ? (
                <div className={styles.morePanel} role="menu">
                  {moreMenu}
                </div>
              ) : null}
            </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
