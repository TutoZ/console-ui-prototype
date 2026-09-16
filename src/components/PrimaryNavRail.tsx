/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一级导航：窄轨样式（对齐质检应用内原 rail）
 * 上部为业务域；底部为人工工作台 + 资源中心 + 通用配置 + 账号
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';
import { useApp } from '../context/AppContext';
import { cn } from '@/lib/utils';
import { NAV_ACTIVE_GRADIENT_TEXT } from '@/lib/ui';
import {
  BOTTOM_NAV_ITEMS,
  DOMAIN_NAV,
  PRIMARY_NAV,
  type NavDomain,
  type PrimaryNavItem,
} from '@/lib/navDomain';
import { NAV_TERMS } from '@/lib/platformTerminology';
import {
  NAV_RAIL_ICON_SIZE,
  NAV_RAIL_ICON_SIZE_COMPACT,
  NAV_RAIL_MORE_SVG,
  NAV_RAIL_SVG,
  NAV_RAIL_SVG_MARKUP,
  prepareNavRailSvg,
} from '@/lib/navRailAssets';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PROFILE_USER } from '@/lib/profileUser';
import { SUPPORT_EMAIL } from '@/src/lib/siteLinks';
import { requestLogout } from '@/lib/authSession';
import {
  countUnreadNotifications,
  type NavNotification,
  type SubUserJoinApplication,
} from '@/lib/navNotificationsMock';
import {
  buildInviteNavNotifications,
  subscribeInviteStore,
  updateInviteApplicationStatus,
} from '@/lib/subUserInviteStore';
import {
  Bell,
  ClipboardCheck,
  ExternalLink,
  HelpCircle,
  LogOut,
  ShieldCheck,
  User,
} from '@/lib/icons';
import { PictureWebp } from './common/PictureWebp';
import { PersonalCenterModal } from './PersonalCenterModal';
import { NotificationCenterFlyout, NOTIFICATION_FLYOUT_SELECTOR } from './nav/NotificationCenterFlyout';
import { SubUserJoinApprovalBatchModal } from './nav/SubUserJoinApprovalBatchModal';

/** V1：超过 7 个业务域时，第 7 个起收入“更多”（含“更多”本身共 7 个槽） */
const RAIL_VISIBLE_SLOT_COUNT = 7;

addCollection(solarIcons as Parameters<typeof addCollection>[0]);

function solarPair(icon: string, active: boolean) {
  return active ? icon.replace(/-linear$/, '-bold') : icon.replace(/-bold$/, '-linear');
}

function SvgRailIcon({
  markup,
  id,
  active,
  size = NAV_RAIL_ICON_SIZE,
}: {
  markup: string;
  id: string;
  active: boolean;
  size?: number;
}) {
  const gradientId = active ? `rail-asset-grad-${id}` : undefined;
  return (
    <span
      className={cn(
        'shrink-0 inline-flex select-none pointer-events-none [&_svg]:block',
        !active && 'opacity-75',
      )}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: prepareNavRailSvg(markup, { size, active, gradientId }),
      }}
    />
  );
}

function RailNavIcon({
  icon,
  active,
  domain,
  size = NAV_RAIL_ICON_SIZE,
}: {
  icon: string;
  active: boolean;
  domain?: NavDomain;
  size?: number;
}) {
  const markup = domain ? NAV_RAIL_SVG_MARKUP[domain] : undefined;
  if (markup && domain) {
    return <SvgRailIcon markup={markup} id={domain} active={active} size={size} />;
  }

  /** 无自定义稿时仍可能挂 public 路径（兜底） */
  const asset = domain ? NAV_RAIL_SVG[domain] : undefined;
  if (asset) {
    return (
      <img
        src={asset}
        alt=""
        width={size}
        height={size}
        className="shrink-0 select-none pointer-events-none opacity-75"
        draggable={false}
      />
    );
  }

  const paired = solarPair(icon, active);
  if (!active) {
    return <Icon icon={paired} width={size} height={size} className="shrink-0" aria-hidden />;
  }

  const iconKey = paired.replace(/^solar:/, '');
  const iconSet = solarIcons as {
    icons?: Record<string, { body?: string; width?: number; height?: number }>;
  };
  const iconMeta = iconSet.icons?.[iconKey];
  if (!iconMeta?.body) {
    return <Icon icon={paired} width={size} height={size} className="shrink-0" aria-hidden />;
  }

  const gradientId = `rail-grad-${iconKey.replace(/[^a-z0-9_-]/gi, '-')}`;
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

const railNavClass = (active: boolean, compact = false) =>
  cn(
    'group w-full flex flex-col items-center rounded-[10px] border border-transparent transition-all duration-200 cursor-pointer',
    compact ? 'gap-1 py-1 px-1' : 'gap-1.5 py-2 px-1.5',
    active
      ? 'bg-[#F3F5F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-[#E4E6EA]'
      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/70',
  );

const activeRailLabelClass = NAV_ACTIVE_GRADIENT_TEXT;

export const PrimaryNavRail: React.FC<{
  showRightBorder?: boolean;
  /** 仅 V1：业务域超过 7 个时，第 7 个变成“更多” */
  overflowToMore?: boolean;
}> = ({ showRightBorder = false, overflowToMore = false }) => {
  const {
    navDomain,
    setNavDomain,
    setActiveTab,
    setQcRailTab,
    setShowTaskCenter,
    showToast,
    sessions,
    activeTab,
  } = useApp();

  const queuedChatsCount = useMemo(
    () => sessions.filter((s) => s.status === 'queued').length,
    [sessions],
  );
  const isWorkspaceActive = activeTab === 'workspace';

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPersonalCenter, setShowPersonalCenter] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [notifications, setNotifications] = useState<NavNotification[]>(() =>
    buildInviteNavNotifications(),
  );
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
    () => new Set(['n-task-2', 'n-task-4']),
  );
  const [showNotificationFlyout, setShowNotificationFlyout] = useState(false);
  const [notificationFlyoutStyle, setNotificationFlyoutStyle] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [focusApplicationId, setFocusApplicationId] = useState<string | null>(null);
  const profileRef = useRef<HTMLButtonElement>(null);
  const notificationRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const workspaceRef = useRef<HTMLButtonElement>(null);
  const notificationCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileMenuStyle, setProfileMenuStyle] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [moreMenuStyle, setMoreMenuStyle] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [workspaceMenuStyle, setWorkspaceMenuStyle] = useState<{
    left: number;
    top: number;
  } | null>(null);

  /** 一级轨展示全部业务域 */
  const visibleDomainNav = DOMAIN_NAV;

  const unlockedDomainIds = useMemo(
    () => new Set(visibleDomainNav.map((item) => item.id)),
    [visibleDomainNav],
  );

  const pinnedDomainNav = useMemo(() => {
    if (!overflowToMore || visibleDomainNav.length <= RAIL_VISIBLE_SLOT_COUNT) {
      return visibleDomainNav;
    }
    return visibleDomainNav.slice(0, RAIL_VISIBLE_SLOT_COUNT - 1);
  }, [overflowToMore, visibleDomainNav]);

  const overflowDomainNav = useMemo(() => {
    if (!overflowToMore || visibleDomainNav.length <= RAIL_VISIBLE_SLOT_COUNT) {
      return [] as PrimaryNavItem[];
    }
    return visibleDomainNav.slice(RAIL_VISIBLE_SLOT_COUNT - 1);
  }, [overflowToMore, visibleDomainNav]);

  const overflowActive = overflowDomainNav.some((item) => item.id === navDomain);

  /** 当前域因对应员工全部删除被收回时，退回首页 */
  useEffect(() => {
    if (navDomain === 'home' || navDomain === 'resources' || navDomain === 'manage') {
      return;
    }
    if (unlockedDomainIds.has(navDomain)) return;
    setNavDomain('home');
    setActiveTab('platformHome');
  }, [navDomain, unlockedDomainIds, setNavDomain, setActiveTab]);

  const updateProfileMenuPosition = useCallback(() => {
    const anchor = profileRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setProfileMenuStyle({
      left: rect.right + 8,
      bottom: window.innerHeight - rect.bottom,
    });
  }, []);

  const updateMoreMenuPosition = useCallback(() => {
    const anchor = moreRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setMoreMenuStyle({
      left: rect.right + 4,
      top: rect.top,
    });
  }, []);

  const updateWorkspaceMenuPosition = useCallback(() => {
    const anchor = workspaceRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setWorkspaceMenuStyle({
      left: rect.right + 8,
      top: rect.top + rect.height / 2,
    });
  }, []);

  const clearMoreCloseTimer = useCallback(() => {
    if (moreCloseTimerRef.current) {
      clearTimeout(moreCloseTimerRef.current);
      moreCloseTimerRef.current = null;
    }
  }, []);

  const clearWorkspaceCloseTimer = useCallback(() => {
    if (workspaceCloseTimerRef.current) {
      clearTimeout(workspaceCloseTimerRef.current);
      workspaceCloseTimerRef.current = null;
    }
  }, []);

  const clearNotificationCloseTimer = useCallback(() => {
    if (notificationCloseTimerRef.current) {
      clearTimeout(notificationCloseTimerRef.current);
      notificationCloseTimerRef.current = null;
    }
  }, []);

  const unreadNotificationCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications],
  );

  const PROFILE_MENU_WIDTH = 208;

  const updateNotificationFlyoutPosition = useCallback(() => {
    if (profileMenuStyle) {
      setNotificationFlyoutStyle({
        left: profileMenuStyle.left + PROFILE_MENU_WIDTH + 8,
        bottom: profileMenuStyle.bottom,
      });
      return;
    }
    const anchor = notificationRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setNotificationFlyoutStyle({
      left: rect.right + 8,
      bottom: Math.max(12, window.innerHeight - rect.bottom),
    });
  }, [profileMenuStyle]);

  const clearProfileCloseTimer = useCallback(() => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
  }, []);

  const openProfileMenu = useCallback(() => {
    clearProfileCloseTimer();
    setShowProfileMenu(true);
  }, [clearProfileCloseTimer]);

  const scheduleCloseProfileMenu = useCallback(() => {
    clearProfileCloseTimer();
    profileCloseTimerRef.current = setTimeout(() => {
      setShowProfileMenu(false);
      setShowNotificationFlyout(false);
      profileCloseTimerRef.current = null;
    }, 140);
  }, [clearProfileCloseTimer]);

  const handleProfileBlur = useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      const related = event.relatedTarget;
      if (related instanceof Element && related.closest(NOTIFICATION_FLYOUT_SELECTOR)) {
        return;
      }
      scheduleCloseProfileMenu();
    },
    [scheduleCloseProfileMenu],
  );

  const openNotificationFlyout = useCallback(() => {
    clearNotificationCloseTimer();
    clearProfileCloseTimer();
    setShowProfileMenu(true);
    setShowNotificationFlyout(true);
  }, [clearNotificationCloseTimer, clearProfileCloseTimer]);

  const scheduleCloseNotificationFlyout = useCallback(() => {
    clearNotificationCloseTimer();
    notificationCloseTimerRef.current = setTimeout(() => {
      setShowNotificationFlyout(false);
      notificationCloseTimerRef.current = null;
    }, 140);
  }, [clearNotificationCloseTimer]);

  const syncNotifications = useCallback(() => {
    setNotifications(
      buildInviteNavNotifications().map((item) => ({
        ...item,
        read: readNotificationIds.has(item.id) || item.read,
      })),
    );
  }, [readNotificationIds]);

  useEffect(() => {
    syncNotifications();
    return subscribeInviteStore(syncNotifications);
  }, [syncNotifications]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });
  }, []);

  const handleSelectNotification = useCallback(
    (item: NavNotification) => {
      markNotificationRead(item.id);
      if (item.kind === 'invite') {
        setShowNotificationFlyout(false);
        setShowProfileMenu(false);
        setFocusApplicationId(item.application?.id ?? null);
        setApprovalOpen(true);
        return;
      }
      showToast('任务结果已更新，可在对应数字员工中查看');
    },
    [markNotificationRead, showToast],
  );

  const handleClearReadNotifications = useCallback(() => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((item) => {
        if (item.read) next.add(item.id);
      });
      return next;
    });
    setNotifications((prev) => prev.filter((item) => !item.read));
    showToast('已清空已读通知');
  }, [notifications, showToast]);

  const handleApproveApplication = useCallback(
    (application: SubUserJoinApplication) => {
      updateInviteApplicationStatus(application.id, 'approved', { approverName: 'cooper' });
      markNotificationRead(`n-invite-${application.id}`);
      showToast(`已通过 ${application.name} 的加入申请，子用户已创建`);
    },
    [markNotificationRead, showToast],
  );

  const handleRejectApplication = useCallback(
    (application: SubUserJoinApplication) => {
      updateInviteApplicationStatus(application.id, 'rejected', { approverName: 'cooper' });
      markNotificationRead(`n-invite-${application.id}`);
      showToast(`已拒绝 ${application.name} 的加入申请`);
    },
    [markNotificationRead, showToast],
  );

  const openMoreMenu = useCallback(() => {
    clearMoreCloseTimer();
    setShowMoreMenu(true);
  }, [clearMoreCloseTimer]);

  const scheduleCloseMoreMenu = useCallback(() => {
    clearMoreCloseTimer();
    moreCloseTimerRef.current = setTimeout(() => {
      setShowMoreMenu(false);
      moreCloseTimerRef.current = null;
    }, 140);
  }, [clearMoreCloseTimer]);

  const openWorkspaceMenu = useCallback(() => {
    clearWorkspaceCloseTimer();
    setShowWorkspaceMenu(true);
  }, [clearWorkspaceCloseTimer]);

  const scheduleCloseWorkspaceMenu = useCallback(() => {
    clearWorkspaceCloseTimer();
    workspaceCloseTimerRef.current = setTimeout(() => {
      setShowWorkspaceMenu(false);
      workspaceCloseTimerRef.current = null;
    }, 140);
  }, [clearWorkspaceCloseTimer]);

  const openOnlineWorkspace = useCallback(() => {
    setShowWorkspaceMenu(false);
    setActiveTab('workspace');
  }, [setActiveTab]);

  useEffect(() => () => clearMoreCloseTimer(), [clearMoreCloseTimer]);
  useEffect(() => () => clearWorkspaceCloseTimer(), [clearWorkspaceCloseTimer]);
  useEffect(() => () => clearNotificationCloseTimer(), [clearNotificationCloseTimer]);
  useEffect(() => () => clearProfileCloseTimer(), [clearProfileCloseTimer]);

  useLayoutEffect(() => {
    if (!showNotificationFlyout) {
      setNotificationFlyoutStyle(null);
      return;
    }
    updateNotificationFlyoutPosition();
    window.addEventListener('resize', updateNotificationFlyoutPosition);
    window.addEventListener('scroll', updateNotificationFlyoutPosition, true);
    return () => {
      window.removeEventListener('resize', updateNotificationFlyoutPosition);
      window.removeEventListener('scroll', updateNotificationFlyoutPosition, true);
    };
  }, [showNotificationFlyout, profileMenuStyle, updateNotificationFlyoutPosition]);

  useLayoutEffect(() => {
    if (!showMoreMenu) {
      setMoreMenuStyle(null);
      return;
    }
    updateMoreMenuPosition();
    window.addEventListener('resize', updateMoreMenuPosition);
    window.addEventListener('scroll', updateMoreMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMoreMenuPosition);
      window.removeEventListener('scroll', updateMoreMenuPosition, true);
    };
  }, [showMoreMenu, updateMoreMenuPosition]);

  useLayoutEffect(() => {
    if (!showWorkspaceMenu) {
      setWorkspaceMenuStyle(null);
      return;
    }
    updateWorkspaceMenuPosition();
    window.addEventListener('resize', updateWorkspaceMenuPosition);
    window.addEventListener('scroll', updateWorkspaceMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateWorkspaceMenuPosition);
      window.removeEventListener('scroll', updateWorkspaceMenuPosition, true);
    };
  }, [showWorkspaceMenu, updateWorkspaceMenuPosition]);

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

  useEffect(() => {
    if (overflowDomainNav.length === 0) setShowMoreMenu(false);
  }, [overflowDomainNav.length]);

  const selectDomain = (domain: NavDomain, tab: string | null, comingSoon?: boolean) => {
    if (comingSoon || !tab) {
      setNavDomain(domain);
      showToast(`${PRIMARY_NAV.find((d) => d.id === domain)?.title ?? ''}即将上线`);
      return;
    }
    setNavDomain(domain);
    setActiveTab(tab);
    if (domain === 'qc') {
      setQcRailTab('workspace');
    }
  };

  return (
    <div
      className={cn(
        'w-[76px] bg-neutral-50 flex flex-col items-center py-3 shrink-0 z-20 select-none h-full',
        showRightBorder && 'border-r border-neutral-200/70',
      )}
      aria-label="一级导航"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg">
        <PictureWebp
          src={RELAY_HOME_ASSETS.logo}
          alt="京小灵"
          loading="eager"
          fetchPriority="high"
          className="h-11 w-11 object-cover object-left select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* 业务域：全部展示，不收入“更多” */}
      <div className="flex flex-1 flex-col items-center gap-2.5 w-full px-2 overflow-y-auto overflow-x-visible custom-scrollbar">
        {pinnedDomainNav.map((item) => {
          const active = navDomain === item.id;
          return (
            <button
              key={item.id}
              id={`primary_nav_${item.id}`}
              type="button"
              title={item.comingSoon ? `${item.title}（即将上线）` : item.title}
              onClick={() => selectDomain(item.id, item.tab, item.comingSoon)}
              className={railNavClass(active)}
            >
              <RailNavIcon icon={item.icon} active={active} domain={item.id} />
              <span
                className={cn(
                  'text-[11px] leading-tight tracking-tight whitespace-nowrap',
                  active ? cn('font-semibold', activeRailLabelClass) : 'font-medium',
                )}
              >
                {item.railLabel ?? item.title}
              </span>
            </button>
          );
        })}
        {overflowDomainNav.length > 0 ? (
          <button
            ref={moreRef}
            type="button"
            id="primary_nav_more"
            title="更多"
            aria-expanded={showMoreMenu}
            aria-haspopup="menu"
            onMouseEnter={openMoreMenu}
            onMouseLeave={scheduleCloseMoreMenu}
            onFocus={openMoreMenu}
            onBlur={scheduleCloseMoreMenu}
            className={railNavClass(overflowActive || showMoreMenu)}
          >
            <SvgRailIcon
              markup={NAV_RAIL_MORE_SVG}
              id="more"
              active={overflowActive || showMoreMenu}
            />
            <span
              className={cn(
                'text-[11px] leading-tight tracking-tight whitespace-nowrap',
                overflowActive || showMoreMenu
                  ? cn('font-semibold', activeRailLabelClass)
                  : 'font-medium',
              )}
            >
              更多
            </span>
          </button>
        ) : null}
      </div>

      {/* 底部工具区：人工工作台 + 资源中心 + 通用配置 + 账号 */}
      <div className="w-full px-2 pt-1.5 mt-0.5 border-t border-neutral-200/80 flex flex-col items-center gap-1 shrink-0">
        <button
          ref={workspaceRef}
          type="button"
          id="primary_nav_workspace"
          title={NAV_TERMS.workspace}
          aria-expanded={showWorkspaceMenu}
          aria-haspopup="menu"
          onClick={openOnlineWorkspace}
          onMouseEnter={openWorkspaceMenu}
          onMouseLeave={scheduleCloseWorkspaceMenu}
          onFocus={openWorkspaceMenu}
          onBlur={scheduleCloseWorkspaceMenu}
          className={cn(railNavClass(isWorkspaceActive, true), 'relative')}
        >
          <span className="relative inline-flex">
            <RailNavIcon
              icon="solar:headphones-round-linear"
              active={isWorkspaceActive}
              size={NAV_RAIL_ICON_SIZE_COMPACT}
            />
            {queuedChatsCount > 0 ? (
              <span
                className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white inline-flex items-center justify-center tabular-nums ring-2 ring-neutral-50"
                aria-label={`${queuedChatsCount} 条排队会话`}
              >
                {queuedChatsCount > 9 ? '9+' : queuedChatsCount}
              </span>
            ) : null}
          </span>
          <span
            className={cn(
              'text-[11px] leading-tight tracking-tight whitespace-nowrap',
              isWorkspaceActive
                ? cn('font-semibold', activeRailLabelClass)
                : 'font-medium',
            )}
          >
            工作台
          </span>
        </button>

        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = navDomain === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`primary_nav_${item.id}`}
              title={item.title}
              onClick={() => selectDomain(item.id, item.tab, item.comingSoon)}
              className={railNavClass(active, true)}
            >
              <RailNavIcon
                icon={item.icon}
                active={active}
                domain={item.id}
                size={NAV_RAIL_ICON_SIZE_COMPACT}
              />
              <span
                className={cn(
                  'text-[11px] leading-tight tracking-tight whitespace-nowrap',
                  active ? cn('font-semibold', activeRailLabelClass) : 'font-medium',
                )}
              >
                {item.railLabel ?? item.title}
              </span>
            </button>
          );
        })}

        <button
          ref={profileRef}
          type="button"
          title={PROFILE_USER.name}
          aria-expanded={showProfileMenu}
          aria-haspopup="menu"
          onMouseEnter={openProfileMenu}
          onMouseLeave={scheduleCloseProfileMenu}
          onFocus={openProfileMenu}
          onBlur={handleProfileBlur}
          className="relative mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-700 transition cursor-pointer"
        >
          <Avatar className="h-7 w-7 rounded-full overflow-hidden after:hidden shrink-0">
            <AvatarFallback className={PROFILE_USER.fallbackClass}>
              {PROFILE_USER.initial}
            </AvatarFallback>
          </Avatar>
          {unreadNotificationCount > 0 ? (
            <span
              className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-neutral-50"
              aria-label={`${unreadNotificationCount} 条未读通知`}
            />
          ) : null}
        </button>
      </div>

      {showWorkspaceMenu &&
        workspaceMenuStyle &&
        createPortal(
          <div
            className="fixed z-[301] -translate-y-1/2 bg-white text-neutral-800 rounded-[13px] shadow-[0_8px_24px_rgba(17,17,17,0.08)] border border-neutral-200 p-1.5 animate-in fade-in slide-in-from-left-2 duration-150 text-[12px] space-y-0.5 min-w-[176px]"
            style={{
              left: workspaceMenuStyle.left,
              top: workspaceMenuStyle.top,
            }}
            role="menu"
            aria-label="客服工作台"
            onMouseEnter={openWorkspaceMenu}
            onMouseLeave={scheduleCloseWorkspaceMenu}
          >
            <button
              type="button"
              role="menuitem"
              onClick={openOnlineWorkspace}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left font-medium text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900 transition cursor-pointer"
            >
              <span>在线客服工作台</span>
              <ExternalLink size={13} className="shrink-0 text-neutral-400" aria-hidden />
            </button>
          </div>,
          document.body,
        )}

      {showMoreMenu &&
        moreMenuStyle &&
        createPortal(
          <div
            className="fixed z-[301] bg-white text-neutral-800 rounded-[13px] shadow-[0_2px_10px_rgba(31,35,41,0.02)] border border-neutral-200 p-1.5 animate-in fade-in slide-in-from-left-2 duration-150 text-[12px] space-y-0.5 min-w-[168px]"
            style={{
              left: moreMenuStyle.left,
              top: moreMenuStyle.top,
            }}
            role="menu"
            aria-label="更多导航"
            onMouseEnter={openMoreMenu}
            onMouseLeave={scheduleCloseMoreMenu}
          >
            {overflowDomainNav.map((item) => {
              const active = navDomain === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  title={item.comingSoon ? `${item.title}（即将上线）` : item.title}
                  onClick={() => {
                    selectDomain(item.id, item.tab, item.comingSoon);
                    setShowMoreMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition cursor-pointer',
                    active
                      ? 'bg-neutral-100 font-semibold text-neutral-900'
                      : 'font-medium text-neutral-800 hover:bg-neutral-100/50',
                  )}
                >
                  <RailNavIcon icon={item.icon} active={active} domain={item.id} size={18} />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      {showProfileMenu &&
        profileMenuStyle &&
        createPortal(
          <div
            className="fixed z-[301] bg-white text-neutral-800 rounded-[13px] shadow-[0_2px_10px_rgba(31,35,41,0.02)] border border-neutral-200 p-1.5 animate-in fade-in slide-in-from-left-2 duration-150 text-[12px] space-y-0.5 w-52"
            style={{
              left: profileMenuStyle.left,
              bottom: profileMenuStyle.bottom,
            }}
            role="menu"
            aria-label="账号菜单"
            onMouseEnter={openProfileMenu}
            onMouseLeave={scheduleCloseProfileMenu}
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
              <div
                className="relative"
                onMouseEnter={openNotificationFlyout}
                onMouseLeave={scheduleCloseNotificationFlyout}
              >
                <button
                  ref={notificationRef}
                  type="button"
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-neutral-100/50 flex items-center gap-2.5 font-medium text-neutral-800 transition cursor-pointer"
                >
                  <Bell size={14} className="text-neutral-500 shrink-0" />
                  <span className="flex-1">通知中心</span>
                  {unreadNotificationCount > 0 ? (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white inline-flex items-center justify-center tabular-nums">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  ) : null}
                </button>
              </div>
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
          </div>,
          document.body,
        )}

      <NotificationCenterFlyout
        open={showNotificationFlyout && showProfileMenu}
        items={notifications}
        style={notificationFlyoutStyle}
        onEnter={openNotificationFlyout}
        onLeave={() => {
          scheduleCloseNotificationFlyout();
          scheduleCloseProfileMenu();
        }}
        onSelect={handleSelectNotification}
        onClearAll={handleClearReadNotifications}
      />

      <SubUserJoinApprovalBatchModal
        open={approvalOpen}
        focusApplicationId={focusApplicationId}
        onClose={() => {
          setApprovalOpen(false);
          setFocusApplicationId(null);
        }}
        onApprove={handleApproveApplication}
        onReject={handleRejectApplication}
      />

      <PersonalCenterModal
        open={showPersonalCenter}
        onClose={() => setShowPersonalCenter(false)}
        onGoCertify={() => showToast('企业认证流程即将在登录页开放')}
        showToast={showToast}
      />
    </div>
  );
};
