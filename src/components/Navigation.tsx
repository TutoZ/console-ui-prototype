/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 二级导航：随一级业务域切换，顶部分段样式
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '@/lib/utils';
import {
  NAV_SECONDARY_TAB_INDICATOR,
  navSecondaryTabClass,
} from '@/lib/ui';
import {
  PRIMARY_NAV,
  HOME_SUB_NAV,
  ONLINE_SUB_NAV,
  MANAGE_SUB_NAV,
  RESOURCES_SUB_NAV,
  QC_APP_MAIN_TABS,
  DOMAIN_OPS_MAIN_TABS,
  OUTBOUND_MAIN_TABS,
  HOTLINE_MAIN_TABS,
  COLLECTION_MAIN_GROUPS,
  collectionTabGroup,
  collectionDefaultTabForGroup,
  type CollectionMainTab,
  navDomainToAppTab,
} from '@/lib/navDomain';

const NavTabIndicator = () => (
  <span className={NAV_SECONDARY_TAB_INDICATOR} aria-hidden />
);

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    navDomain,
    qcRailTab,
    setQcRailTab,
    qcMainTab,
    setQcMainTab,
    domainOpsTab,
    setDomainOpsTab,
  } = useApp();

  const domainMeta = PRIMARY_NAV.find((d) => d.id === navDomain);
  const domainTitle = domainMeta?.title ?? '首页';
  const domainComingSoon = Boolean(domainMeta?.comingSoon);

  const renderHomeSecondary = () =>
    HOME_SUB_NAV.map((item) => {
      const active = activeTab === item.tab;
      return (
        <button
          key={item.id}
          id={item.id}
          type="button"
          title={item.description ?? item.title}
          onClick={() => setActiveTab(item.tab)}
          className={navSecondaryTabClass(active)}
        >
          {item.title}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderOnlineSecondary = () =>
    ONLINE_SUB_NAV.map((item) => {
      const active = activeTab === item.tab;
      return (
        <button
          key={item.id}
          id={item.id}
          type="button"
          title={item.description ?? item.title}
          onClick={() => setActiveTab(item.tab)}
          className={navSecondaryTabClass(active)}
        >
          {item.title}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderResourcesSecondary = () =>
    RESOURCES_SUB_NAV.map((item) => {
      const active = activeTab === item.tab;
      return (
        <button
          key={item.id}
          id={item.id}
          type="button"
          title={item.description ?? item.title}
          disabled={item.comingSoon}
          onClick={() => {
            if (item.comingSoon) return;
            setActiveTab(item.tab);
          }}
          className={cn(
            navSecondaryTabClass(active),
            item.comingSoon && 'opacity-40 cursor-not-allowed hover:text-neutral-500',
          )}
        >
          {item.title}
          {item.comingSoon ? (
            <span className="ml-1 text-[10px] font-medium text-neutral-400">暂无</span>
          ) : null}
          {active && !item.comingSoon ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderManageSecondary = () =>
    MANAGE_SUB_NAV.map((item) => {
      const active = activeTab === item.tab;
      return (
        <button
          key={item.id}
          id={item.id}
          type="button"
          title={item.description ?? item.title}
          onClick={() => setActiveTab(item.tab)}
          className={navSecondaryTabClass(active)}
        >
          {item.title}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderQcSecondary = () =>
    QC_APP_MAIN_TABS.map((tab) => {
      const active =
        activeTab === 'qcWorkspace' &&
        qcRailTab === 'workspace' &&
        qcMainTab === tab.id;
      return (
        <button
          key={tab.id}
          id={`nav_qc_${tab.id}`}
          type="button"
          title={tab.label}
          onClick={() => {
            setActiveTab('qcWorkspace');
            setQcRailTab('workspace');
            setQcMainTab(tab.id);
          }}
          className={navSecondaryTabClass(active)}
        >
          {tab.label}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderOpsSecondary = () =>
    DOMAIN_OPS_MAIN_TABS.map((tab) => {
      const active = domainOpsTab === tab.id;
      return (
        <button
          key={tab.id}
          id={`nav_ops_${tab.id}`}
          type="button"
          title={tab.label}
          onClick={() => {
            const appTab = navDomainToAppTab(navDomain);
            if (appTab) setActiveTab(appTab);
            setDomainOpsTab(tab.id);
          }}
          className={navSecondaryTabClass(active)}
        >
          {tab.label}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderOutboundSecondary = () =>
    OUTBOUND_MAIN_TABS.map((tab) => {
      const active = domainOpsTab === tab.id;
      return (
        <button
          key={tab.id}
          id={`nav_outbound_${tab.id}`}
          type="button"
          title={tab.label}
          onClick={() => {
            setActiveTab('outboundApp');
            setDomainOpsTab(tab.id);
          }}
          className={navSecondaryTabClass(active)}
        >
          {tab.label}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const renderHotlineSecondary = () =>
    HOTLINE_MAIN_TABS.map((tab) => {
      const active = domainOpsTab === tab.id;
      return (
        <button
          key={tab.id}
          id={`nav_hotline_${tab.id}`}
          type="button"
          title={tab.label}
          onClick={() => {
            setActiveTab('hotlineApp');
            setDomainOpsTab(tab.id);
          }}
          className={navSecondaryTabClass(active)}
        >
          {tab.label}
          {active ? <NavTabIndicator /> : null}
        </button>
      );
    });

  const selectCollectionTab = (next: CollectionMainTab) => {
    setActiveTab('collectionApp');
    setDomainOpsTab(next);
  };

  const renderCollectionSecondary = () =>
    COLLECTION_MAIN_GROUPS.map((item) => {
      const hasChildren = 'children' in item && item.children;
      const isActive = hasChildren
        ? collectionTabGroup(domainOpsTab) === item.id
        : domainOpsTab === item.id;
      const nextTab: CollectionMainTab = hasChildren
        ? collectionDefaultTabForGroup(item.id)
        : item.id;

      return (
        <button
          key={item.id}
          id={`nav_collection_${item.id}`}
          type="button"
          title={item.label}
          onClick={() => selectCollectionTab(nextTab)}
          className={navSecondaryTabClass(isActive)}
        >
          {item.label}
          {isActive ? <NavTabIndicator /> : null}
        </button>
      );
    });

  if (domainComingSoon) {
    return (
      <div className="shrink-0 px-4">
        <div className="h-11 flex items-center text-[13px] text-neutral-500">
          <span className="font-semibold text-neutral-800 mr-2">{domainTitle}</span>
          即将上线
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-4">
      <nav
        className={cn(
          'flex items-center gap-1',
          navDomain === 'qc' ? 'flex-wrap min-h-11 py-1' : 'overflow-x-auto',
        )}
        aria-label={`${domainTitle}二级导航`}
      >
        {navDomain === 'home' && renderHomeSecondary()}
        {navDomain === 'online' && renderOnlineSecondary()}
        {navDomain === 'resources' && renderResourcesSecondary()}
        {navDomain === 'qc' && renderQcSecondary()}
        {navDomain === 'manage' && renderManageSecondary()}
        {navDomain === 'outbound' && renderOutboundSecondary()}
        {navDomain === 'hotline' && renderHotlineSecondary()}
        {navDomain === 'collection' && renderCollectionSecondary()}
        {(navDomain === 'telesales' || navDomain === 'followup') && renderOpsSecondary()}
      </nav>
    </div>
  );
};
