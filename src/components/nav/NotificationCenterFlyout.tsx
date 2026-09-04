/**
 * 通知中心 · 悬停面板（对齐产品通知列表样式）
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from '@/lib/icons';
import { assetWebp } from '@/lib/assetWebp';
import {
  countApprovalNotifications,
  countByCategory,
  filterNotifications,
  groupNotificationsByDate,
  type NavNotification,
  type NavNotificationTab,
} from '@/lib/navNotificationsMock';
import { cn } from '@/lib/utils';

const JOY_LOGO = '/assets/joy-support-logo.png';
const JOY_LOGO_WEBP = assetWebp(JOY_LOGO);

/** 供账号菜单 blur 判断：焦点移入通知面板时不应关闭菜单 */
export const NOTIFICATION_FLYOUT_SELECTOR = '[data-notification-flyout]';

const preventFocusSteal = (event: React.MouseEvent) => {
  event.preventDefault();
};

const TABS: Array<{
  id: NavNotificationTab;
  label: string;
  badge?: 'official' | 'approval';
}> = [
  { id: 'all', label: '全部' },
  { id: 'official', label: '官方', badge: 'official' },
  { id: 'approval', label: '审批', badge: 'approval' },
];

function NotificationAvatar({ item }: { item: NavNotification }) {
  if (item.application) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-semibold">
        {item.application.avatarInitial}
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 overflow-hidden">
      <picture>
        <source srcSet={JOY_LOGO_WEBP} type="image/webp" />
        <img src={JOY_LOGO} alt="京小灵" className="h-5 w-5 object-contain" decoding="async" />
      </picture>
    </span>
  );
}

export const NotificationCenterFlyout: React.FC<{
  open: boolean;
  items: NavNotification[];
  style: { left: number; bottom: number } | null;
  onEnter: () => void;
  onLeave: () => void;
  onSelect: (item: NavNotification) => void;
  onClearAll?: () => void;
}> = ({ open, items, style, onEnter, onLeave, onSelect, onClearAll }) => {
  const [tab, setTab] = useState<NavNotificationTab>('all');

  const filtered = useMemo(() => filterNotifications(items, tab), [items, tab]);
  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  const badgeCount = (entry: (typeof TABS)[number]) => {
    if (entry.badge === 'official') return countByCategory(items, 'official');
    if (entry.badge === 'approval') return countApprovalNotifications(items);
    return 0;
  };

  const showBadge = (entry: (typeof TABS)[number]) => {
    if (!entry.badge) return false;
    return badgeCount(entry) > 0;
  };

  if (!open || !style) return null;

  const PANEL_HEIGHT = 'min(560px, calc(100vh - 48px))';
  const PANEL_X = 'px-4';

  return createPortal(
    <div
      className="fixed z-[302] w-[min(480px,calc(100vw-120px))] rounded-[14px] border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(31,35,41,0.10)] animate-in fade-in slide-in-from-left-2 duration-150 flex flex-col overflow-hidden"
      style={{ left: style.left, bottom: style.bottom, height: PANEL_HEIGHT }}
      data-notification-flyout=""
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="dialog"
      aria-label="通知中心"
    >
      <div className={cn('shrink-0 border-b border-neutral-200/70', PANEL_X, 'pt-3 pb-0')}>
        <div className="flex items-center justify-between gap-3 min-h-9">
          <div className="flex items-end gap-5 min-w-0 overflow-x-auto no-scrollbar">
            {TABS.map((entry) => {
              const active = tab === entry.id;
              const count = badgeCount(entry);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseDown={preventFocusSteal}
                  onClick={() => setTab(entry.id)}
                  className={cn(
                    'relative shrink-0 pb-3 text-[13px] transition cursor-pointer inline-flex items-center gap-1.5',
                    active
                      ? 'font-semibold text-neutral-900 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-neutral-900 after:rounded-full'
                      : 'font-medium text-neutral-500 hover:text-neutral-800',
                  )}
                >
                  <span>{entry.label}</span>
                  {showBadge(entry) ? (
                    <span className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none tabular-nums">
                      {count > 9 ? '9+' : count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            title="清空已读"
            onMouseDown={preventFocusSteal}
            onClick={onClearAll}
            className="shrink-0 h-8 w-8 -mr-1 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar py-3', PANEL_X)}>
        {grouped.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-neutral-500">
            暂无通知
          </div>
        ) : (
          <>
            {grouped.map(([date, groupItems]) => (
              <div key={date} className="mb-4 last:mb-0">
                <div className="text-[12px] text-neutral-400 mb-2 tabular-nums leading-none">{date}</div>
                <div className="space-y-px">
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className="w-full flex items-center gap-2.5 text-left rounded-lg px-1 py-1.5 min-h-9 hover:bg-neutral-50 transition cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <NotificationAvatar item={item} />
                        {!item.read ? (
                          <span className="absolute -top-px -right-px h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
                        ) : null}
                      </div>
                      <p className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-800 line-clamp-2">
                        {item.message}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="py-4 text-center text-[12px] text-neutral-400">没有更多了</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
