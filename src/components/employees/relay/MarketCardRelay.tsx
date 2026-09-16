/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import styles from './MarketCardRelay.module.scss';

export interface MarketCardRelayProps {
  name: string;
  desc: string;
  avatarSrc?: string;
  avatarEmoji?: string;
  category: 'ready' | 'custom';
  /** 员工类型（卡片右上角，对齐我的数字员工） */
  jobFamilyLabel?: string;
  isHiredAlready: boolean;
  onHire: () => void;
  onCustomRequest?: () => void;
}

const HIRE_COPY = {
  hireReady: '立即雇佣',
  hireAgain: '再次雇佣',
  customApply: '帮我定制一位',
} as const;

export const MarketCardRelay: React.FC<MarketCardRelayProps> = ({
  name,
  desc,
  avatarSrc,
  avatarEmoji,
  category,
  jobFamilyLabel,
  isHiredAlready,
  onHire,
  onCustomRequest,
}) => {
  return (
    <article className={styles.card}>
      {jobFamilyLabel ? (
        <div className={styles.familyRibbon}>
          <span className={styles.familyBadge} title={jobFamilyLabel}>
            {jobFamilyLabel}
          </span>
        </div>
      ) : null}

      <div className={styles.avatarWrap}>
        {avatarSrc ? (
          <img className={styles.avatarImg} src={avatarSrc} alt="" />
        ) : (
          <span className={styles.avatarEmoji}>{avatarEmoji}</span>
        )}
      </div>

      <h3 className={styles.title}>{name}</h3>

      <div className={styles.tagWrap}>
        {category === 'ready' ? (
          <span className={styles.tagReady}>开箱即用</span>
        ) : (
          <span className={styles.tagCustom}>专属定制</span>
        )}
      </div>

      <p className={styles.desc}>{desc}</p>

      {category === 'ready' ? (
        isHiredAlready ? (
          <button type="button" className={styles.btnSecondary} onClick={onHire}>
            {HIRE_COPY.hireAgain}
          </button>
        ) : (
          <button type="button" className={styles.btnPrimary} onClick={onHire}>
            {HIRE_COPY.hireReady}
          </button>
        )
      ) : (
        <button
          type="button"
          className={styles.btnOutline}
          onClick={isHiredAlready ? onHire : onCustomRequest ?? onHire}
        >
          {isHiredAlready ? HIRE_COPY.hireAgain : HIRE_COPY.customApply}
        </button>
      )}
    </article>
  );
};
