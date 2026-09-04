/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 多租户选择内容区（嵌入登录页右侧）
 */

import React, { useState } from 'react';
import type { TenantItem } from '@/lib/tenantSession';
import styles from './LoginPage.module.scss';

export type TenantSelectContentProps = {
  tenants: TenantItem[];
  onSelect: (tenantId: string) => void;
  onCreateTenant: () => void;
  onSwitchAccount: () => void;
};

const STATUS_CLASS: Record<TenantItem['status'], string> = {
  trial: styles.tenantStatusTrial,
  pending: styles.tenantStatusPending,
  active: styles.tenantStatusActive,
  reviewing: styles.tenantStatusReviewing,
};

export const TenantSelectContent: React.FC<TenantSelectContentProps> = ({
  tenants,
  onSelect,
  onCreateTenant,
  onSwitchAccount,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const handleCardClick = (tenantId: string) => {
    if (entering) return;
    setSelectedId(tenantId);
    setEntering(true);
    window.setTimeout(() => onSelect(tenantId), 220);
  };

  return (
    <div className={styles.formMain}>
      <div className={styles.header}>
        <div className={styles.title}>选择要进入的企业</div>
        <div className={styles.descBlock}>
          您当前关联了多个企业租户，请选择要进入的工作空间。
        </div>
      </div>

      <div className={styles.tenantList}>
        {tenants.map((tenant) => {
          const isSelected = selectedId === tenant.id;
          return (
            <button
              key={tenant.id}
              type="button"
              className={`${styles.tenantCard} ${isSelected ? styles.tenantCardSelected : ''}`}
              onClick={() => handleCardClick(tenant.id)}
              disabled={entering}
              aria-pressed={isSelected}
            >
              <div className={styles.tenantCompany}>{tenant.companyName}</div>
              <div className={styles.tenantMeta}>
                <span className={styles.tenantUser}>{tenant.displayName}</span>
                <span className={styles.tenantId}>{tenant.id}</span>
              </div>
              <div className={styles.tenantBottom}>
                <div className={styles.tenantTags}>
                  <span
                    className={
                      tenant.role === 'owner' ? styles.tenantRoleOwner : styles.tenantRoleSeat
                    }
                  >
                    {tenant.roleLabel}
                  </span>
                  <span className={STATUS_CLASS[tenant.status]}>{tenant.statusLabel}</span>
                </div>
                <span className={styles.tenantLastAccess}>最近进入: {tenant.lastAccess}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.tenantCreateBtn} onClick={onCreateTenant}>
        创建新的企业租户
      </button>
      <button type="button" className={styles.tenantSwitchBtn} onClick={onSwitchAccount}>
        切换其他账号登录
      </button>
    </div>
  );
};
