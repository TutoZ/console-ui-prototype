/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 双侧导航版 — 二级侧栏（紧挨一级窄轨右侧）
 */

import React from 'react';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';
import { useApp } from '../context/AppContext';
import { cn } from '@/lib/utils';
import { NAV_ACTIVE_GRADIENT_TEXT } from '@/lib/ui';
import { resolveSecondaryNavIcon, solarPair } from '@/lib/secondaryNavIcons';
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
import { NavCreditsChip } from './common/NavCreditsChip';

addCollection(solarIcons as Parameters<typeof addCollection>[0]);

function SideNavIcon({ icon, active }: { icon: string; active: boolean }) {
  const paired = solarPair(icon, active);
  const size = 16;
  if (!active) {
    return (
      <Icon
        icon={paired}
        width={size}
        height={size}
        className="shrink-0 text-neutral-500"
        aria-hidden
      />
    );
  }

  const iconKey = paired.replace(/^solar:/, '');
  const iconSet = solarIcons as {
    icons?: Record<string, { body?: string; width?: number; height?: number }>;
  };
  const iconMeta = iconSet.icons?.[iconKey];
  if (!iconMeta?.body) {
    return <Icon icon={paired} width={size} height={size} className="shrink-0" aria-hidden />;
  }

  const gradientId = `side-grad-${iconKey.replace(/[^a-z0-9_-]/gi, '-')}`;
  const body = iconMeta.body.replaceAll('currentColor', `url(#${gradientId})`);
  const viewW = iconMeta.width ?? 24;
  const viewH = iconMeta.height ?? 24;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewW} ${viewH}`}
      className="shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#1565BF" />
        </linearGradient>
      </defs>
      <g dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  );
}

const sideItemClass = (active: boolean, soft?: boolean, disabled?: boolean) =>
  cn(
    'group relative w-full text-left px-2.5 h-9 rounded-[10px] text-[13px] leading-none transition-colors duration-200 border border-transparent',
    disabled
      ? 'opacity-45 cursor-not-allowed text-neutral-400'
      : 'cursor-pointer',
    soft
      ? 'font-semibold text-neutral-800 bg-white/70'
      : active
        ? `font-semibold ${NAV_ACTIVE_GRADIENT_TEXT} bg-[#F3F5F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-[#E4E6EA]`
        : 'font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/80',
  );

const iconShellClass = (active: boolean, soft?: boolean) =>
  cn(
    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors duration-200',
    active && !soft
      ? 'bg-transparent'
      : soft
        ? 'bg-white/50'
        : 'bg-transparent group-hover:bg-white/60',
  );

function NavButton({
  id,
  title,
  active,
  soft,
  disabled,
  icon,
  onClick,
  trailing,
}: {
  id: string;
  title: string;
  active: boolean;
  soft?: boolean;
  disabled?: boolean;
  icon?: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  const resolvedIcon = resolveSecondaryNavIcon(id, icon) ?? 'solar:widget-5-linear';

  return (
    <button
      id={id}
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={sideItemClass(active, soft, disabled)}
    >
      <span className="flex h-full items-center gap-2 min-w-0">
        <span className={iconShellClass(active, soft)}>
          <SideNavIcon icon={resolvedIcon} active={active && !soft} />
        </span>
        <span className="flex items-center justify-between gap-1 min-w-0 flex-1">
          <span className="truncate">{title}</span>
          {trailing}
        </span>
      </span>
    </button>
  );
}

export const SecondarySideNav: React.FC = () => {
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

  const selectCollectionTab = (next: CollectionMainTab) => {
    setActiveTab('collectionApp');
    setDomainOpsTab(next);
  };

  const renderItems = () => {
    if (navDomain === 'home') {
      return HOME_SUB_NAV.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          title={item.title}
          icon={item.icon}
          active={activeTab === item.tab}
          onClick={() => setActiveTab(item.tab)}
        />
      ));
    }

    if (navDomain === 'online') {
      return ONLINE_SUB_NAV.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          title={item.title}
          icon={item.icon}
          active={activeTab === item.tab}
          onClick={() => setActiveTab(item.tab)}
        />
      ));
    }

    if (navDomain === 'resources') {
      return RESOURCES_SUB_NAV.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          title={item.comingSoon ? `${item.title}（暂无）` : item.title}
          icon={item.icon}
          active={activeTab === item.tab}
          disabled={item.comingSoon}
          onClick={() => {
            if (item.comingSoon) return;
            setActiveTab(item.tab);
          }}
        />
      ));
    }

    if (navDomain === 'manage') {
      return MANAGE_SUB_NAV.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          title={item.title}
          icon={item.icon}
          active={activeTab === item.tab}
          onClick={() => setActiveTab(item.tab)}
        />
      ));
    }

    if (navDomain === 'qc') {
      return QC_APP_MAIN_TABS.map((tab) => {
        const active =
          activeTab === 'qcWorkspace' &&
          qcRailTab === 'workspace' &&
          qcMainTab === tab.id;
        return (
          <NavButton
            key={tab.id}
            id={`nav_qc_${tab.id}`}
            title={tab.label}
            icon={resolveSecondaryNavIcon(tab.id)}
            active={active}
            onClick={() => {
              setActiveTab('qcWorkspace');
              setQcRailTab('workspace');
              setQcMainTab(tab.id);
            }}
          />
        );
      });
    }

    if (navDomain === 'outbound') {
      return OUTBOUND_MAIN_TABS.map((tab) => (
        <NavButton
          key={tab.id}
          id={`nav_outbound_${tab.id}`}
          title={tab.label}
          icon={resolveSecondaryNavIcon(tab.id)}
          active={domainOpsTab === tab.id}
          onClick={() => {
            setActiveTab('outboundApp');
            setDomainOpsTab(tab.id);
          }}
        />
      ));
    }

    if (navDomain === 'hotline') {
      return HOTLINE_MAIN_TABS.map((tab) => (
        <NavButton
          key={tab.id}
          id={`nav_hotline_${tab.id}`}
          title={tab.label}
          icon={resolveSecondaryNavIcon(tab.id)}
          active={domainOpsTab === tab.id}
          onClick={() => {
            setActiveTab('hotlineApp');
            setDomainOpsTab(tab.id);
          }}
        />
      ));
    }

    if (navDomain === 'telesales' || navDomain === 'followup') {
      return DOMAIN_OPS_MAIN_TABS.map((tab) => (
        <NavButton
          key={tab.id}
          id={`nav_ops_${tab.id}`}
          title={tab.label}
          icon={resolveSecondaryNavIcon(tab.id)}
          active={domainOpsTab === tab.id}
          onClick={() => {
            const appTab = navDomainToAppTab(navDomain);
            if (appTab) setActiveTab(appTab);
            setDomainOpsTab(tab.id);
          }}
        />
      ));
    }

    if (navDomain === 'collection') {
      const activeGroupId = collectionTabGroup(domainOpsTab);
      return COLLECTION_MAIN_GROUPS.map((item) => {
        const hasChildren = 'children' in item && item.children;
        const isActive = hasChildren
          ? activeGroupId === item.id
          : domainOpsTab === item.id;
        const nextTab: CollectionMainTab = hasChildren
          ? collectionDefaultTabForGroup(item.id)
          : item.id;

        return (
          <NavButton
            key={item.id}
            id={`nav_collection_${item.id}`}
            title={item.label}
            icon={resolveSecondaryNavIcon(item.id)}
            active={isActive}
            onClick={() => selectCollectionTab(nextTab)}
          />
        );
      });
    }

    return null;
  };

  return (
    <aside
      className="w-[176px] shrink-0 h-full bg-neutral-50 flex flex-col min-h-0 border-r border-neutral-200/70"
      aria-label={`${domainTitle}二级导航`}
    >
      <div className="h-[60px] px-3 flex items-center shrink-0 border-b border-neutral-200/80">
        <div className="text-[13px] font-semibold text-neutral-900 tracking-tight leading-none truncate">
          {domainTitle}
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 py-2.5 space-y-1">
        {domainComingSoon ? (
          <p className="px-2.5 py-2 text-[12px] text-neutral-500 leading-relaxed">
            即将上线
          </p>
        ) : (
          renderItems()
        )}
      </nav>

      <div className="shrink-0 px-2 pb-3 pt-1">
        <NavCreditsChip className="w-full" />
      </div>
    </aside>
  );
};
