/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 二级侧栏图标（Solar linear；选中态在组件内切 bold）
 */

/** 非 SubNavItem 结构（质检/外呼等 tab id） */
export const SECONDARY_NAV_ICON_BY_TAB_ID: Record<string, string> = {
  plans: 'solar:calendar-mark-linear',
  summary: 'solar:chart-2-linear',
  templates: 'solar:document-text-linear',
  standards: 'solar:clipboard-check-linear',
  sources: 'solar:chat-round-linear',
  tickets: 'solar:ticket-linear',
  review: 'solar:eye-linear',
  collab: 'solar:users-group-two-rounded-linear',
  alerts: 'solar:bell-linear',
  demo: 'solar:test-tube-linear',
  tasks: 'solar:list-check-linear',
  training: 'solar:square-academic-cap-linear',
  records: 'solar:call-chat-linear',
  stats: 'solar:graph-up-linear',
  agents: 'solar:cpu-bolt-linear',
  calls: 'solar:call-chat-rounded-linear',
  numbers: 'solar:hashtag-circle-linear',
  dispatch: 'solar:plain-2-linear',
  overview: 'solar:monitor-linear',
  monitor: 'solar:pulse-2-linear',
  resources: 'solar:archive-minimalistic-linear',
  outbound_cdr: 'solar:document-medicine-linear',
  case_orders: 'solar:clipboard-list-linear',
  dial_strategy: 'solar:tuning-2-linear',
  employee_report: 'solar:chart-square-linear',
  agent_report: 'solar:graph-new-linear',
  users: 'solar:user-id-linear',
  alert_whitelist: 'solar:shield-warning-linear',
  cdr: 'solar:folder-with-files-linear',
  reports: 'solar:chart-2-linear',
};

export function resolveSecondaryNavIcon(
  navId: string,
  explicitIcon?: string,
): string | undefined {
  if (explicitIcon) return explicitIcon;
  if (navId.startsWith('nav_')) {
    const key = navId.replace(/^nav_/, '');
    return SECONDARY_NAV_ICON_BY_TAB_ID[key];
  }
  return SECONDARY_NAV_ICON_BY_TAB_ID[navId];
}

function solarPair(icon: string, active: boolean) {
  return active ? icon.replace(/-linear$/, '-bold') : icon.replace(/-bold$/, '-linear');
}

export { solarPair };
