/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V3 导航：对齐 joypi-uat-workbench 可折叠树形侧栏
 * — 展开 200px / 收起 64px；分组可展开；底栏工作台 + 账号
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';
import { useApp } from '../context/AppContext';
import { cn } from '@/lib/utils';
import {
  BOTTOM_NAV_ITEMS,
  COLLECTION_MAIN_GROUPS,
  DOMAIN_NAV,
  DOMAIN_OPS_MAIN_TABS,
  HOME_SUB_NAV,
  HOTLINE_MAIN_TABS,
  MANAGE_SUB_NAV,
  ONLINE_SUB_NAV,
  OUTBOUND_MAIN_TABS,
  QC_APP_MAIN_TABS,
  RESOURCES_SUB_NAV,
  collectionDefaultTabForGroup,
  collectionTabGroup,
  navDomainToAppTab,
  type CollectionMainTab,
  type NavDomain,
  type SubNavItem,
} from '@/lib/navDomain';
import {
  NAV_RAIL_SVG_MARKUP,
  prepareNavRailSvg,
} from '@/lib/navRailAssets';
import { resolveSecondaryNavIcon, solarPair as solarIconPair } from '@/lib/secondaryNavIcons';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PROFILE_USER } from '@/lib/profileUser';
import { SUPPORT_EMAIL } from '@/src/lib/siteLinks';
import { requestLogout } from '@/lib/authSession';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  ShieldCheck,
  User,
} from '@/lib/icons';
import { NavCreditsChip } from './common/NavCreditsChip';
import { PictureWebp } from './common/PictureWebp';
import { PersonalCenterModal } from './PersonalCenterModal';

addCollection(solarIcons as Parameters<typeof addCollection>[0]);

const COLLAPSE_KEY = 'js_nav_tree_v3_collapsed';
const WORDMARK = '/assets/joy-support-logo-wordmark.png';
/** 演示用未读数，后续可接真实通知 */
const DEMO_UNREAD = 3;

type TreeChild = {
  id: string;
  label: string;
  icon?: string;
  comingSoon?: boolean;
  onSelect: () => void;
  isActive: () => boolean;
};

type TreeGroup = {
  id: NavDomain;
  label: string;
  icon: string;
  comingSoon?: boolean;
  children: TreeChild[];
};

type FlyoutState = {
  groupId: string;
  label: string;
  children: TreeChild[];
  top: number;
  left: number;
};

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function solarPair(icon: string, active: boolean) {
  return solarIconPair(icon, active);
}

function GroupIcon({
  domain,
  icon,
  size = 20,
}: {
  domain: NavDomain;
  icon: string;
  size?: number;
}) {
  const markup = NAV_RAIL_SVG_MARKUP[domain];
  if (markup) {
    return (
      <span
        className="shrink-0 inline-flex select-none pointer-events-none [&_svg]:block"
        aria-hidden
        dangerouslySetInnerHTML={{
          __html: prepareNavRailSvg(markup, { size, active: false }),
        }}
      />
    );
  }
  return (
    <Icon
      icon={solarPair(icon, false)}
      width={size}
      height={size}
      className="shrink-0 text-neutral-700"
      aria-hidden
    />
  );
}

function FlyoutItemIcon({ icon, active }: { icon?: string; active: boolean }) {
  const fallback = 'solar:widget-5-linear';
  const resolved = icon || fallback;
  const filledName = solarPair(resolved, true).replace(/^solar:/, '');
  const linearName = solarPair(resolved, false).replace(/^solar:/, '');
  const iconSet = solarIcons as {
    icons?: Record<string, { body?: string; width?: number; height?: number }>;
  };
  const meta =
    iconSet.icons?.[filledName] ??
    iconSet.icons?.[linearName] ??
    iconSet.icons?.['widget-5-bold'] ??
    iconSet.icons?.['widget-5-linear'];
  if (!meta?.body) {
    return (
      <Icon
        icon="solar:widget-5-bold"
        width={18}
        height={18}
        className="shrink-0 text-neutral-800"
        aria-hidden
      />
    );
  }
  const viewW = meta.width ?? 24;
  const viewH = meta.height ?? 24;
  return (
    <svg
      width={18}
      height={18}
      viewBox={`0 0 ${viewW} ${viewH}`}
      className={cn('shrink-0', active ? 'text-neutral-900' : 'text-neutral-800')}
      fill="currentColor"
      aria-hidden
    >
      <g dangerouslySetInnerHTML={{ __html: meta.body }} />
    </svg>
  );
}

function SubnavFlyout({
  flyout,
  onClose,
  onEnter,
}: {
  flyout: FlyoutState;
  onClose: () => void;
  onEnter: () => void;
}) {
  return createPortal(
    <div
      className="fixed z-[260] pl-2"
      style={{ top: flyout.top, left: flyout.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onClose}
    >
      <div className="min-w-[168px] rounded-2xl border border-neutral-200/90 bg-white shadow-[0_10px_32px_rgba(31,35,41,0.12)] py-1.5 animate-in fade-in slide-in-from-left-1 duration-150">
        <div className="px-4 h-8 flex items-center text-[12px] font-semibold text-neutral-500">
          {flyout.label}
        </div>
        {flyout.children.map((child) => {
          const active = child.isActive();
          return (
            <button
              key={child.id}
              type="button"
              title={child.comingSoon ? `${child.label}（暂无）` : child.label}
              disabled={child.comingSoon}
              onClick={() => {
                if (child.comingSoon) return;
                child.onSelect();
                onClose();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 h-10 text-[14px] transition-colors duration-150',
                child.comingSoon
                  ? 'opacity-40 cursor-not-allowed text-neutral-400'
                  : active
                    ? 'bg-neutral-100 text-neutral-900 font-medium cursor-pointer'
                    : 'text-neutral-800 font-normal hover:bg-neutral-50 cursor-pointer',
              )}
            >
              <FlyoutItemIcon icon={child.icon} active={active && !child.comingSoon} />
              <span className="truncate leading-none">{child.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

const groupBtnClass = (active: boolean, collapsed: boolean, disabled?: boolean) =>
  cn(
    'flex items-center border border-transparent transition-colors duration-200',
    collapsed
      ? 'justify-center p-1.5 rounded-lg h-8 w-8 mx-auto shrink-0'
      : 'w-full justify-between px-2 h-[38px] rounded-lg',
    disabled
      ? 'opacity-40 cursor-not-allowed text-[rgb(38,38,38)]'
      : active
        ? 'bg-[rgb(235,237,241)] text-[rgb(38,38,38)] font-semibold cursor-pointer'
        : 'text-[rgb(38,38,38)] font-semibold hover:bg-[rgba(235,237,241,0.5)] cursor-pointer',
  );

const childBtnClass = (active: boolean, disabled?: boolean) =>
  cn(
    'w-full flex items-center h-8 pl-8 pr-2 rounded-md text-[13px] transition-colors duration-200',
    disabled
      ? 'opacity-40 cursor-not-allowed text-[rgb(89,89,89)] font-normal'
      : active
        ? 'bg-[rgba(235,237,241,0.5)] text-[rgb(38,38,38)] font-semibold cursor-pointer'
        : 'text-[rgb(89,89,89)] font-normal hover:bg-[rgba(235,237,241,0.3)] cursor-pointer',
  );

function subItemsToChildren(
  items: SubNavItem[],
  opts: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setNavDomain: (d: NavDomain) => void;
    domain: NavDomain;
    showToast: (msg: string) => void;
  },
): TreeChild[] {
  return items.map((item) => ({
    id: item.id,
    label: item.title,
    icon: item.icon ?? resolveSecondaryNavIcon(item.id),
    comingSoon: item.comingSoon,
    isActive: () => opts.activeTab === item.tab,
    onSelect: () => {
      if (item.comingSoon) {
        opts.showToast(`${item.title}暂无，本期不实现`);
        return;
      }
      opts.setNavDomain(opts.domain);
      opts.setActiveTab(item.tab);
    },
  }));
}

export const PrimaryNavTreeV3: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    navDomain,
    setNavDomain,
    setQcRailTab,
    setQcMainTab,
    qcMainTab,
    qcRailTab,
    domainOpsTab,
    setDomainOpsTab,
    setShowTaskCenter,
    showToast,
  } = useApp();

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['home']));
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPersonalCenter, setShowPersonalCenter] = useState(false);
  const profileRef = useRef<HTMLButtonElement>(null);
  const [profileMenuStyle, setProfileMenuStyle] = useState<{
    left: number;
    bottom: number;
    width: number;
  } | null>(null);

  const clearFlyoutTimer = useCallback(() => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  }, []);

  const scheduleCloseFlyout = useCallback(() => {
    clearFlyoutTimer();
    flyoutCloseTimer.current = setTimeout(() => setFlyout(null), 120);
  }, [clearFlyoutTimer]);

  const openFlyout = useCallback(
    (group: TreeGroup, anchor: HTMLElement) => {
      clearFlyoutTimer();
      const rect = anchor.getBoundingClientRect();
      const approxHeight = 48 + group.children.length * 40;
      const maxTop = window.innerHeight - approxHeight - 12;
      setFlyout({
        groupId: group.id,
        label: group.label,
        children: group.children,
        top: Math.max(8, Math.min(rect.top, maxTop)),
        left: rect.right,
      });
    },
    [clearFlyoutTimer],
  );

  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);

  useEffect(
    () => () => {
      clearFlyoutTimer();
    },
    [clearFlyoutTimer],
  );

  /** 一级树展示全部业务域 */
  const visibleDomainNav = DOMAIN_NAV;

  const unlockedDomainIds = useMemo(
    () => new Set(visibleDomainNav.map((item) => item.id)),
    [visibleDomainNav],
  );

  useEffect(() => {
    if (navDomain === 'home' || navDomain === 'resources' || navDomain === 'manage') {
      return;
    }
    if (unlockedDomainIds.has(navDomain)) return;
    setNavDomain('home');
    setActiveTab('platformHome');
  }, [navDomain, unlockedDomainIds, setNavDomain, setActiveTab]);

  const treeGroups: TreeGroup[] = useMemo(() => {
    const domainGroups: TreeGroup[] = visibleDomainNav.map((item) => {
      const domain = item.id;
      let children: TreeChild[] = [];

      if (domain === 'home') {
        children = subItemsToChildren(HOME_SUB_NAV, {
          activeTab,
          setActiveTab,
          setNavDomain,
          domain,
          showToast,
        });
      } else if (domain === 'online') {
        children = subItemsToChildren(ONLINE_SUB_NAV, {
          activeTab,
          setActiveTab,
          setNavDomain,
          domain,
          showToast,
        });
      } else if (domain === 'qc') {
        children = QC_APP_MAIN_TABS.map((tab) => ({
          id: `qc_${tab.id}`,
          label: tab.label,
          icon: resolveSecondaryNavIcon(tab.id),
          isActive: () =>
            activeTab === 'qcWorkspace' &&
            qcRailTab === 'workspace' &&
            qcMainTab === tab.id,
          onSelect: () => {
            setNavDomain('qc');
            setActiveTab('qcWorkspace');
            setQcRailTab('workspace');
            setQcMainTab(tab.id);
          },
        }));
      } else if (domain === 'outbound') {
        children = OUTBOUND_MAIN_TABS.map((tab) => ({
          id: `outbound_${tab.id}`,
          label: tab.label,
          icon: resolveSecondaryNavIcon(tab.id),
          isActive: () => activeTab === 'outboundApp' && domainOpsTab === tab.id,
          onSelect: () => {
            setNavDomain('outbound');
            setActiveTab('outboundApp');
            setDomainOpsTab(tab.id);
          },
        }));
      } else if (domain === 'hotline') {
        children = HOTLINE_MAIN_TABS.map((tab) => ({
          id: `hotline_${tab.id}`,
          label: tab.label,
          icon: resolveSecondaryNavIcon(tab.id),
          isActive: () => activeTab === 'hotlineApp' && domainOpsTab === tab.id,
          onSelect: () => {
            setNavDomain('hotline');
            setActiveTab('hotlineApp');
            setDomainOpsTab(tab.id);
          },
        }));
      } else if (domain === 'telesales' || domain === 'followup') {
        const appTab = domain === 'followup' ? 'followupApp' : 'telesalesApp';
        children = DOMAIN_OPS_MAIN_TABS.map((tab) => ({
          id: `${domain}_${tab.id}`,
          label: tab.label,
          icon: resolveSecondaryNavIcon(tab.id),
          isActive: () => activeTab === appTab && domainOpsTab === tab.id,
          onSelect: () => {
            setNavDomain(domain);
            setActiveTab(appTab);
            setDomainOpsTab(tab.id);
          },
        }));
      } else if (domain === 'collection') {
        children = COLLECTION_MAIN_GROUPS.map((group) => {
          const hasChildren = 'children' in group && group.children;
          return {
            id: `collection_${group.id}`,
            label: group.label,
            icon: resolveSecondaryNavIcon(group.id),
            isActive: () =>
              activeTab === 'collectionApp' &&
              (domainOpsTab === group.id ||
                collectionTabGroup(domainOpsTab) === group.id),
            onSelect: () => {
              setNavDomain('collection');
              setActiveTab('collectionApp');
              setDomainOpsTab(
                hasChildren
                  ? collectionDefaultTabForGroup(group.id)
                  : (group.id as CollectionMainTab),
              );
            },
          };
        });
      }

      return {
        id: domain,
        label: item.title,
        icon: item.icon,
        comingSoon: item.comingSoon,
        children,
      };
    });

    const bottomGroups: TreeGroup[] = BOTTOM_NAV_ITEMS.map((item) => {
      const domain = item.id;
      const items =
        domain === 'resources'
          ? RESOURCES_SUB_NAV
          : domain === 'manage'
            ? MANAGE_SUB_NAV
            : [];
      return {
        id: domain,
        label: item.title,
        icon: item.icon,
        children: subItemsToChildren(items, {
          activeTab,
          setActiveTab,
          setNavDomain,
          domain,
          showToast,
        }),
      };
    });

    return [...domainGroups, ...bottomGroups];
  }, [
    visibleDomainNav,
    activeTab,
    setActiveTab,
    setNavDomain,
    showToast,
    qcMainTab,
    qcRailTab,
    domainOpsTab,
    setQcRailTab,
    setQcMainTab,
    setDomainOpsTab,
  ]);

  const sections = useMemo(
    () => [
      {
        label: '项目',
        groups: treeGroups.filter((g) => g.id !== 'resources' && g.id !== 'manage'),
      },
      {
        label: '组织',
        groups: treeGroups.filter((g) => g.id === 'resources' || g.id === 'manage'),
      },
    ],
    [treeGroups],
  );

  /** 当前域自动展开对应分组 */
  useEffect(() => {
    setOpenGroups((prev) => {
      if (prev.has(navDomain)) return prev;
      const next = new Set(prev);
      next.add(navDomain);
      return next;
    });
  }, [navDomain]);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      writeCollapsed(next);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupHasActiveChild = (group: TreeGroup) =>
    group.children.some((c) => c.isActive());

  const updateProfileMenuPosition = useCallback(() => {
    const anchor = profileRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const inset = collapsed ? 4 : 16;
    setProfileMenuStyle({
      left: rect.left + inset,
      bottom: window.innerHeight - rect.top + 8,
      width: collapsed ? 192 : Math.max(rect.width - 2 * inset, 160),
    });
  }, [collapsed]);

  useLayoutEffect(() => {
    if (!showProfileMenu) {
      setProfileMenuStyle(null);
      return;
    }
    updateProfileMenuPosition();
    window.addEventListener('resize', updateProfileMenuPosition);
    window.addEventListener('scroll', updateProfileMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateProfileMenuPosition);
      window.removeEventListener('scroll', updateProfileMenuPosition, true);
    };
  }, [showProfileMenu, updateProfileMenuPosition]);

  const renderGroup = (group: TreeGroup) => {
    const open = openGroups.has(group.id);
    const active = groupHasActiveChild(group) || navDomain === group.id;
    const tip = group.comingSoon ? `${group.label}（即将上线）` : group.label;

    if (collapsed) {
      const first = group.children.find((c) => !c.comingSoon);
      const flyoutOpen = flyout?.groupId === group.id;
      return (
        <div
          key={group.id}
          className="relative"
          onMouseEnter={(e) => {
            if (group.children.length === 0) return;
            openFlyout(group, e.currentTarget);
          }}
          onMouseLeave={scheduleCloseFlyout}
        >
          <button
            type="button"
            title={tip}
            disabled={group.comingSoon && !first}
            onClick={() => {
              if (group.comingSoon) {
                showToast(`${group.label}即将上线`);
                return;
              }
              if (first) first.onSelect();
              else {
                const tab = navDomainToAppTab(group.id);
                setNavDomain(group.id);
                if (tab) setActiveTab(tab);
              }
            }}
            className={cn(
              groupBtnClass(active || flyoutOpen, true, group.comingSoon),
            )}
          >
            <GroupIcon domain={group.id} icon={group.icon} />
          </button>
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-2">
        <button
          type="button"
          title={group.comingSoon ? '即将上线：可展开查看子项' : group.label}
          onClick={() => {
            if (group.comingSoon) {
              showToast(`${group.label}即将上线`);
            }
            toggleGroup(group.id);
          }}
          className={cn(groupBtnClass(false, false), group.comingSoon && 'opacity-60')}
        >
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <GroupIcon domain={group.id} icon={group.icon} />
            <span className="text-[14px] font-semibold text-[rgb(38,38,38)] truncate">
              {group.label}
            </span>
          </div>
          {open ? (
            <ChevronDown size={14} className="text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-neutral-500 shrink-0" />
          )}
        </button>
        {open ? (
          <div className="space-y-2">
            {group.children.map((child) => {
              const childActive = child.isActive();
              return (
                <button
                  key={child.id}
                  type="button"
                  title={child.comingSoon ? `${child.label}（暂无）` : child.label}
                  disabled={child.comingSoon}
                  onClick={child.onSelect}
                  className={childBtnClass(childActive, child.comingSoon)}
                >
                  {child.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'h-full bg-[rgb(250,250,250)] text-neutral-800 flex flex-col shrink-0 select-none font-sans overflow-hidden transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-[200px]',
      )}
      aria-label="一级导航"
    >
      {/* Logo + 折叠：收起态默认 logo，悬停显示展开 */}
      <div
        className={cn(
          'h-[60px] flex items-center shrink-0',
          collapsed ? 'justify-center px-1.5' : 'justify-between px-3',
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            title="展开导航栏"
            className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg cursor-pointer transition-colors duration-200 hover:bg-neutral-200/40"
          >
            <PictureWebp
              src={RELAY_HOME_ASSETS.logo}
              alt="京小灵"
              loading="eager"
              fetchPriority="high"
              className="h-11 w-11 object-cover object-left select-none pointer-events-none transition-opacity duration-150 group-hover:opacity-0"
              draggable={false}
            />
            <span className="absolute inset-0 flex items-center justify-center text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[rgb(250,250,250)]">
              <PanelLeftClose size={15} className="transform rotate-180" />
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <PictureWebp
              src={WORDMARK}
              alt="京小灵"
              width={108}
              height={36}
              loading="eager"
              fetchPriority="high"
              className="w-[108px] h-9 object-contain select-none pointer-events-none"
              draggable={false}
            />
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-7 h-7 flex items-center justify-center rounded-[10px] text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/40 cursor-pointer transition-colors duration-200"
              title="折叠导航栏"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 分组菜单 */}
      <div
        className={cn(
          'flex-1 overflow-y-auto custom-scrollbar',
          collapsed ? 'px-1.5 py-1.5 space-y-2' : 'px-3 pt-1 space-y-2',
        )}
      >
        {sections.map((section, sectionIndex) =>
          section.groups.length === 0 ? null : (
            <div key={section.label} className="space-y-2">
              {collapsed && sectionIndex > 0 ? (
                <div
                  className="mx-auto w-6 h-px bg-neutral-200/90"
                  role="separator"
                  aria-hidden
                />
              ) : null}
              {!collapsed ? (
                <div className="flex items-center h-8 px-2 rounded-[10px] text-[12px] font-medium text-[rgba(12,10,9,0.7)] leading-none">
                  {section.label}
                </div>
              ) : null}
              {section.groups.map(renderGroup)}
            </div>
          ),
        )}
      </div>

      {/* 底栏：资源消耗 + 账号 + 通知 */}
      <div
        className={cn(
          collapsed ? 'px-1.5 pb-1.5 space-y-1.5' : 'px-3 pb-3 space-y-2',
        )}
      >
        <NavCreditsChip
          variant={collapsed ? 'compact' : 'full'}
          className={collapsed ? 'mx-auto' : 'w-full'}
        />

        {collapsed ? (
          <>
            <button
              type="button"
              title="通知中心"
              onClick={() =>
                showToast(
                  DEMO_UNREAD > 0
                    ? `你有 ${DEMO_UNREAD} 条未读通知（演示）。`
                    : '暂无新通知。',
                )
              }
              className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition cursor-pointer"
            >
              <Bell size={16} />
              {DEMO_UNREAD > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                  {DEMO_UNREAD > 9 ? '9+' : DEMO_UNREAD}
                </span>
              ) : null}
            </button>
            <button
              ref={profileRef}
              type="button"
              title={PROFILE_USER.name}
              onClick={() => setShowProfileMenu((open) => !open)}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] transition cursor-pointer"
            >
              <Avatar className="h-7 w-7 rounded-full overflow-hidden after:hidden shrink-0">
                <AvatarFallback className={PROFILE_USER.fallbackClass}>
                  {PROFILE_USER.initial}
                </AvatarFallback>
              </Avatar>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <button
              ref={profileRef}
              type="button"
              title={PROFILE_USER.name}
              onClick={() => setShowProfileMenu((open) => !open)}
              className="min-w-0 flex-1 flex items-center gap-2 h-10 px-2 rounded-[10px] hover:bg-[rgba(235,237,241,0.5)] transition cursor-pointer"
            >
              <Avatar className="h-7 w-7 rounded-full overflow-hidden after:hidden shrink-0">
                <AvatarFallback className={PROFILE_USER.fallbackClass}>
                  {PROFILE_USER.initial}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-[rgb(38,38,38)] truncate min-w-0 flex-1 text-left">
                {PROFILE_USER.name}
              </span>
            </button>
            <button
              type="button"
              title="通知中心"
              onClick={() =>
                showToast(
                  DEMO_UNREAD > 0
                    ? `你有 ${DEMO_UNREAD} 条未读通知（演示）。`
                    : '暂无新通知。',
                )
              }
              className="relative shrink-0 w-7 h-7 flex items-center justify-center rounded-[10px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition cursor-pointer"
            >
              <Bell size={16} />
              {DEMO_UNREAD > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                  {DEMO_UNREAD > 9 ? '9+' : DEMO_UNREAD}
                </span>
              ) : null}
            </button>
          </div>
        )}
      </div>

      {collapsed && flyout ? (
        <SubnavFlyout
          flyout={flyout}
          onClose={scheduleCloseFlyout}
          onEnter={clearFlyoutTimer}
        />
      ) : null}

      {showProfileMenu &&
        profileMenuStyle &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="关闭菜单"
              className="fixed inset-0 z-[300] cursor-default bg-transparent"
              onClick={() => setShowProfileMenu(false)}
            />
            <div
              className="fixed z-[301] bg-white text-neutral-800 rounded-[13px] shadow-[0_2px_10px_rgba(31,35,41,0.02)] border border-neutral-200 p-1.5 animate-in fade-in slide-in-from-left-2 duration-150 text-[12px] space-y-0.5"
              style={{
                left: profileMenuStyle.left,
                bottom: profileMenuStyle.bottom,
                width: profileMenuStyle.width,
              }}
            >
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 min-w-0">
                <span className="text-[12px] font-semibold text-neutral-900 truncate min-w-0">
                  {PROFILE_USER.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                  }}
                  className="shrink-0 inline-flex items-center gap-0.5 h-6 px-2 rounded-md border border-sky-200 bg-sky-50 text-[10px] font-semibold text-sky-700 hover:bg-sky-100 transition cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck size={11} className="shrink-0" aria-hidden />
                  企业认证
                </button>
              </div>
              <div className="my-1 border-t border-neutral-200/60" />
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowPersonalCenter(true);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-100/50 flex items-center gap-2.5 font-medium text-neutral-800 transition cursor-pointer"
              >
                <User size={14} className="text-neutral-500 shrink-0" />
                <span>个人中心</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowTaskCenter(true);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-100/50 flex items-center gap-2.5 font-medium text-neutral-800 transition cursor-pointer"
              >
                <ClipboardCheck size={14} className="text-neutral-500 shrink-0" />
                <span>任务中心</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('暂无新通知。');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-100/50 flex items-center gap-2.5 font-medium text-neutral-800 transition cursor-pointer"
              >
                <Bell size={14} className="text-neutral-500 shrink-0" />
                <span>通知中心</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (SUPPORT_EMAIL) {
                    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=帮助中心`;
                  }
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-100/50 flex items-center gap-2.5 font-medium text-neutral-800 transition cursor-pointer"
              >
                <HelpCircle size={14} className="text-neutral-500 shrink-0" />
                <span>帮助中心</span>
              </button>
              <div className="my-1 border-t border-neutral-200/60" />
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  requestLogout();
                  showToast('已退出登录');
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-destructive/10 flex items-center gap-2.5 text-destructive font-medium transition cursor-pointer"
              >
                <LogOut size={14} className="shrink-0" />
                <span>退出登录</span>
              </button>
            </div>
          </>,
          document.body,
        )}

      <PersonalCenterModal
        open={showPersonalCenter}
        onClose={() => setShowPersonalCenter(false)}
        onGoCertify={() => showToast('企业认证流程即将在登录页开放')}
        showToast={showToast}
      />
    </aside>
  );
};
