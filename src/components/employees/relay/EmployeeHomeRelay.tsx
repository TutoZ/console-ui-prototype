/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Relay 高保真 — 我的数字员工首页主内容区
 */

import React from 'react';
import styles from './EmployeeHomeRelay.module.scss';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import { SELECT_TRIGGER } from '@/lib/ui';
import { ContentBusy } from '../../common/ContentBusy';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMPLOYEE_PAGE_COPY } from '@/lib/platformTerminology';
import { JOB_FAMILY_FULL_LABELS } from '@/lib/jobFamily';
import { Pencil } from '@/lib/icons';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { key: 'all' as const, label: '所有状态' },
  { key: 'online' as const, label: '已上岗' },
  { key: 'draft' as const, label: '待上岗 / 培训中' },
] as const;

const TYPE_OPTIONS = [
  { key: 'all' as const, label: '全部类型' },
  { key: 'customer_service' as const, label: JOB_FAMILY_FULL_LABELS.customer_service },
  { key: 'quality_inspection' as const, label: JOB_FAMILY_FULL_LABELS.quality_inspection },
  { key: 'outbound' as const, label: JOB_FAMILY_FULL_LABELS.outbound },
  { key: 'hotline' as const, label: JOB_FAMILY_FULL_LABELS.hotline },
  { key: 'collection' as const, label: JOB_FAMILY_FULL_LABELS.collection },
  { key: 'telesales' as const, label: JOB_FAMILY_FULL_LABELS.telesales },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]['key'];
type TypeFilter = (typeof TYPE_OPTIONS)[number]['key'];

interface EmployeeHomeRelayProps {
  /** 当前页形态：我的员工（含 Banner/筛选）或市场列表 */
  activeSubTab: 'employees' | 'market';
  /** 是否展示顶部 Banner（培训页可关闭） */
  showBanner?: boolean;
  onStartHire: () => void;
  /** 不选市场模板，空白起盘定制（仅“我的数字员工”页） */
  onCreateFromScratch?: () => void;
  /** 页头标题，默认“我的数字员工” */
  pageTitle?: string;
  /** 自建按钮文案（培训页可改为“创建在线客服”） */
  createButtonLabel?: string;
  createButtonTitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  typeFilter?: TypeFilter;
  onTypeFilterChange?: (value: TypeFilter) => void;
  children: React.ReactNode;
  /** 仅卡片列表区加载（Tab/Banner/筛选不挡） */
  listBusy?: boolean;
}

export const EmployeeHomeRelay: React.FC<EmployeeHomeRelayProps> = ({
  activeSubTab,
  showBanner = true,
  onStartHire,
  onCreateFromScratch,
  pageTitle,
  createButtonLabel,
  createButtonTitle,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter = 'all',
  onTypeFilterChange,
  children,
  listBusy = false,
}) => {
  const statusLabel =
    STATUS_OPTIONS.find((o) => o.key === statusFilter)?.label ?? '所有状态';

  return (
    <div className={styles.mainContent}>
      {activeSubTab === 'employees' ? (
        <div className={styles.scrollContent}>
          {showBanner ? (
            <div className={styles.bannerArea}>
              <img className={styles.bannerBg} src={RELAY_HOME_ASSETS.bannerBg} alt="" />
              <div className={styles.bannerContent}>
                <div className={cn(styles.bannerSlide, styles.bannerSlideActive)}>
                  <div className={styles.bannerTextWrap}>
                    <div className={styles.bannerTitle}>雇佣新员工上手向导</div>
                    <div className={styles.bannerDesc}>
                      一键带你雇人、配技能、试岗，几步就能让数字员工上岗。
                    </div>
                    <button type="button" className={styles.startBtn} onClick={onStartHire}>
                      <span className={styles.startBtnText}>立即雇佣开始</span>
                      <img
                        className={styles.startBtnIcon}
                        src={RELAY_HOME_ASSETS.bannerArrow}
                        alt=""
                      />
                    </button>
                  </div>
                </div>
              </div>
              <img className={styles.bannerRightImg} src={RELAY_HOME_ASSETS.bannerRight} alt="" />
              <img className={styles.mouseIcon} src={RELAY_HOME_ASSETS.mouse} alt="" />
            </div>
          ) : null}

          <div className={styles.employeeSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleMain}>
                {pageTitle || EMPLOYEE_PAGE_COPY.pageTitle}
              </div>
              <div className={styles.headerFilters}>
                <label className={styles.searchInputWrap}>
                  <img className={styles.searchIcon} src={RELAY_HOME_ASSETS.search} alt="" />
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={EMPLOYEE_PAGE_COPY.searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => v && onStatusFilterChange(v as StatusFilter)}
                >
                  <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选状态">
                    <SelectValue>{statusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {STATUS_OPTIONS.map(({ key, label }) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                className={styles.createFromScratchBtn}
                onClick={() => onCreateFromScratch?.()}
                title={createButtonTitle || '不选市场模板、也不走平台代做，自己空白起盘'}
                disabled={!onCreateFromScratch}
              >
                <Pencil size={13} className="shrink-0" strokeWidth={2} aria-hidden />
                {createButtonLabel || EMPLOYEE_PAGE_COPY.createFromScratch}
              </button>
            </div>

            {onTypeFilterChange ? (
              <div className={styles.categoryBar} role="tablist" aria-label="数字员工分类">
                {TYPE_OPTIONS.map(({ key, label }) => {
                  const active = typeFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={cn(styles.categoryTag, active && styles.categoryTagActive)}
                      onClick={() => onTypeFilterChange(key)}
                    >
                      <span className={styles.categoryTagLabel}>{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className={styles.cardListWrap}>
              <ContentBusy
                busy={listBusy}
                size="slot"
                minHeight={180}
                className="col-span-full"
              >
                {children}
              </ContentBusy>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.scrollContent}>{children}</div>
      )}
    </div>
  );
};
