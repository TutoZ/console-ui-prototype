/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检应用顶部分段（常量已上收至 lib/navDomain；二级导航优先走 Navigation）
 */

import React from 'react';
import {
  NAV_SECONDARY_TAB_INDICATOR,
  navSecondaryTabClass,
} from '@/lib/ui';
import { QC_APP_MAIN_TABS, type QcAppMainTab } from '@/lib/navDomain';

export { QC_APP_MAIN_TABS, type QcAppMainTab };

interface QcAppMainTabsProps {
  value: QcAppMainTab;
  onChange: (id: QcAppMainTab) => void;
}

export const QcAppMainTabs: React.FC<QcAppMainTabsProps> = ({
  value,
  onChange,
}) => (
  <div className="shrink-0 px-4">
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="质检应用子页">
      {QC_APP_MAIN_TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={navSecondaryTabClass(active)}
          >
            {tab.label}
            {active ? (
              <span className={NAV_SECONDARY_TAB_INDICATOR} aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  </div>
);
