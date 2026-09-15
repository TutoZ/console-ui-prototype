/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 侧栏域：一级窄轨（业务域）+ 二级顶部分段（域内能力）
 * 信息架构见 docs/nav-ia.md
 */

export type NavDomain =
  | 'home'
  | 'online'
  | 'qc'
  | 'manage'
  | 'resources'
  | 'outbound'
  | 'hotline'
  | 'collection'
  | 'telesales'
  | 'followup';

export type QcRailTab = 'overview' | 'workspace' | 'templates';

export const QC_APP_MAIN_TABS = [
  { id: 'plans' as const, label: '质检计划' },
  { id: 'summary' as const, label: '数据汇总' },
  { id: 'templates' as const, label: '质检模板' },
  { id: 'standards' as const, label: '质检标准' },
  { id: 'sources' as const, label: '会话来源' },
  { id: 'tickets' as const, label: '质检工单' },
  { id: 'review' as const, label: '人工复检' },
  { id: 'collab' as const, label: '协作配置' },
  { id: 'alerts' as const, label: '监控告警' },
  { id: 'demo' as const, label: '拓展性演示' },
] as const;

export type QcAppMainTab = (typeof QC_APP_MAIN_TABS)[number]['id'];

/** 已实现内容的质检子页；其余展示即将上线占位 */
export const QC_APP_IMPLEMENTED_TABS = new Set<QcAppMainTab>(['plans', 'summary', 'templates']);

export function qcAppTabLabel(id: QcAppMainTab): string {
  return QC_APP_MAIN_TABS.find((t) => t.id === id)?.label ?? id;
}

/** 电销 二级导航（应用内，详见电销 PRD） */
export const DOMAIN_OPS_MAIN_TABS = [
  { id: 'dispatch' as const, label: '派发任务' },
  { id: 'overview' as const, label: '运行概览' },
] as const;

/** 外呼 二级导航 — 对齐智能外呼 5 能力 */
export const OUTBOUND_MAIN_TABS = [
  { id: 'tasks' as const, label: '任务下发' },
  { id: 'monitor' as const, label: '员工监控' },
  { id: 'training' as const, label: '员工培训' },
  { id: 'records' as const, label: '外呼记录' },
  { id: 'stats' as const, label: '员工业绩' },
] as const;

export type OutboundMainTab = (typeof OUTBOUND_MAIN_TABS)[number]['id'];

/** 热线客服 二级导航：智能体管理即员工培训 */
export const HOTLINE_MAIN_TABS = [
  { id: 'agents' as const, label: '员工培训' },
  { id: 'stats' as const, label: '员工业绩' },
  { id: 'calls' as const, label: '接待记录' },
  { id: 'numbers' as const, label: '号码管理' },
] as const;

export type HotlineMainTab = (typeof HOTLINE_MAIN_TABS)[number]['id'];

/** 催收 二级导航（详见电话催收 PRD） */
export const COLLECTION_MAIN_GROUPS = [
  { id: 'monitor' as const, label: '数字员工监控' },
  { id: 'resources' as const, label: '资源中心' },
  {
    id: 'cdr' as const,
    label: '话单管理',
    children: [
      { id: 'outbound_cdr' as const, label: '外呼通话详单' },
      { id: 'case_orders' as const, label: '案件订单' },
    ],
  },
  { id: 'dial_strategy' as const, label: '拨打策略' },
  {
    id: 'reports' as const,
    label: '运营报表',
    children: [
      { id: 'employee_report' as const, label: '数字员工报表' },
      { id: 'agent_report' as const, label: '智能体报表' },
    ],
  },
  { id: 'users' as const, label: '用户管理' },
  { id: 'alert_whitelist' as const, label: '监控告警白名单' },
] as const;

export type CollectionMainTab =
  | 'monitor'
  | 'resources'
  | 'outbound_cdr'
  | 'case_orders'
  | 'dial_strategy'
  | 'employee_report'
  | 'agent_report'
  | 'users'
  | 'alert_whitelist';

export type CollectionNavGroupId = 'cdr' | 'reports';

export function collectionTabGroup(tab: string): CollectionNavGroupId | null {
  if (tab === 'outbound_cdr' || tab === 'case_orders') return 'cdr';
  if (tab === 'employee_report' || tab === 'agent_report') return 'reports';
  return null;
}

export function collectionDefaultTabForGroup(groupId: string): CollectionMainTab {
  if (groupId === 'cdr') return 'outbound_cdr';
  if (groupId === 'reports') return 'employee_report';
  return groupId as CollectionMainTab;
}

export type DomainOpsMainTab =
  | (typeof DOMAIN_OPS_MAIN_TABS)[number]['id']
  | OutboundMainTab
  | HotlineMainTab
  | CollectionMainTab;

export type SubNavItem = {
  id: string;
  title: string;
  tab: string;
  /** Solar 图标（linear；选中态组件内切 bold） */
  icon?: string;
  /** 二级说明（产品 IA） */
  description?: string;
  /** 本期不实现 */
  comingSoon?: boolean;
};

/** 数字员工 · 二级 */
export const HOME_SUB_NAV: SubNavItem[] = [
  {
    id: 'nav_platform_home',
    title: '数字员工创作',
    tab: 'platformHome',
    icon: 'solar:stars-minimalistic-linear',
    description: '一句话创建数字员工、技能与知识',
  },
  {
    id: 'nav_employees',
    title: '我的数字员工',
    tab: 'employees',
    icon: 'solar:ghost-linear',
    description: '进入我的数字员工页面',
  },
  {
    id: 'nav_market',
    title: '数字员工市场',
    tab: 'market',
    icon: 'solar:cart-large-2-linear',
    description: '进入员工市场页面',
  },
  {
    id: 'nav_skills',
    title: '数字员工技能',
    tab: 'skills',
    icon: 'solar:magic-stick-3-linear',
    description: '进入我的已订阅技能页面，可以切换到技能市场',
  },
];

/** 在线客服 · 二级 */
export const ONLINE_SUB_NAV: SubNavItem[] = [
  {
    id: 'nav_training',
    title: '员工培训',
    tab: 'training',
    icon: 'solar:square-academic-cap-linear',
    description: '进入员工配置页面，支持新建 agent 和培训现有 agent',
  },
  {
    id: 'nav_sessions',
    title: '接待记录',
    tab: 'sessions',
    icon: 'solar:chat-round-dots-linear',
    description: '进入数字员工对话记录页面',
  },
  {
    id: 'nav_case_library',
    title: '案例库',
    tab: 'caseLibrary',
    icon: 'solar:notebook-bookmark-linear',
    description: '查看已加入案例库的接待会话',
  },
  {
    id: 'nav_kb',
    title: '员工知识',
    tab: 'kb',
    icon: 'solar:book-2-linear',
    description: '进入数字员工支持配置页面',
  },
  {
    id: 'nav_dashboard',
    title: '员工业绩',
    tab: 'dashboard',
    icon: 'solar:chart-2-linear',
    description: '进入数字员工数据监控页面',
  },
  {
    id: 'nav_ab_test',
    title: '员工比拼',
    tab: 'abTest',
    icon: 'solar:cup-star-linear',
    description: '进入数字员工比拼页面',
  },
];

/** 资源中心 · 二级 */
export const RESOURCES_SUB_NAV: SubNavItem[] = [
  {
    id: 'nav_phone_lines',
    title: '电话线路',
    tab: 'phoneLines',
    icon: 'solar:phone-calling-rounded-linear',
    description: '电话线路资源（详见热线相关 PRD）',
  },
  {
    id: 'nav_sms_resources',
    title: '短信资源',
    tab: 'smsResources',
    icon: 'solar:chat-round-line-linear',
    description: '暂无，本期不实现',
    comingSoon: true,
  },
];

/** 通用配置 · 二级 */
export const MANAGE_SUB_NAV: SubNavItem[] = [
  {
    id: 'nav_staff',
    title: '账号管理',
    tab: 'staff',
    icon: 'solar:user-id-linear',
    description: '原“坐席管理”，现为账号管理',
  },
  {
    id: 'nav_roles',
    title: '角色权限',
    tab: 'roles',
    icon: 'solar:shield-keyhole-linear',
    description: '角色与权限配置',
  },
];

/** 数字员工域二级页 */
export const HOME_TABS = new Set(HOME_SUB_NAV.map((i) => i.tab));

/** 在线客服域二级页 */
export const ONLINE_TABS = new Set(ONLINE_SUB_NAV.map((i) => i.tab));

/** 资源中心 */
export const RESOURCES_TABS = new Set(RESOURCES_SUB_NAV.map((i) => i.tab));

/** 通用配置：账号管理 / 角色权限 */
export const MANAGE_TABS = new Set(MANAGE_SUB_NAV.map((i) => i.tab));

export const DOMAIN_OPS_TABS = new Set([
  'outboundApp',
  'hotlineApp',
  'collectionApp',
  'telesalesApp',
  'followupApp',
]);

export function navDomainFromTab(tab: string): NavDomain | null {
  if (tab === 'qcWorkspace') return 'qc';
  if (tab === 'outboundApp') return 'outbound';
  if (tab === 'hotlineApp') return 'hotline';
  if (tab === 'collectionApp') return 'collection';
  if (tab === 'telesalesApp') return 'telesales';
  if (tab === 'followupApp') return 'followup';
  if (MANAGE_TABS.has(tab)) return 'manage';
  if (RESOURCES_TABS.has(tab)) return 'resources';
  if (ONLINE_TABS.has(tab)) return 'online';
  if (HOME_TABS.has(tab)) return 'home';
  return null;
}

export function navDomainToAppTab(domain: NavDomain): string | null {
  switch (domain) {
    case 'home':
      return 'platformHome';
    case 'online':
      return 'training';
    case 'qc':
      return 'qcWorkspace';
    case 'outbound':
      return 'outboundApp';
    case 'hotline':
      return 'hotlineApp';
    case 'collection':
      return 'collectionApp';
    case 'telesales':
      return 'telesalesApp';
    case 'followup':
      return 'followupApp';
    case 'resources':
      return 'phoneLines';
    case 'manage':
      return 'staff';
    default:
      return null;
  }
}

export type PrimaryNavItem = {
  id: NavDomain;
  title: string;
  /** 一级窄轨展示名（V1）；缺省用 title */
  railLabel?: string;
  icon: string;
  tab: string | null;
  comingSoon?: boolean;
  /** 产品说明 */
  description?: string;
};

export const DOMAIN_NAV: PrimaryNavItem[] = [
  {
    id: 'home',
    title: '数字员工',
    icon: 'solar:ghost-linear',
    tab: 'platformHome',
    description: '数字员工创作 / 我的数字员工 / 市场 / 技能',
  },
  {
    id: 'online',
    title: '在线客服',
    icon: 'solar:headphones-round-linear',
    tab: 'training',
    description: '培训、知识、业绩、接待、比拼',
  },
  {
    id: 'hotline',
    title: '热线客服',
    icon: 'solar:incoming-call-rounded-linear',
    tab: 'hotlineApp',
    description: '员工培训、员工业绩、接待记录、号码管理',
  },
  {
    id: 'outbound',
    title: '智能外呼',
    icon: 'solar:outgoing-call-rounded-linear',
    tab: 'outboundApp',
    description: '见智能外呼应用 PRD',
  },
  {
    id: 'qc',
    title: '智能质检',
    icon: 'solar:shield-check-linear',
    tab: 'qcWorkspace',
    description: '见智能质检应用 PRD',
  },
  {
    id: 'telesales',
    title: '电话销售',
    icon: 'solar:chat-round-call-linear',
    tab: 'telesalesApp',
    description: '见电话销售应用 PRD',
  },
  {
    id: 'collection',
    title: '电话催收',
    icon: 'solar:wallet-money-linear',
    tab: 'collectionApp',
    description: '见电话催收应用 PRD',
  },
];

/** 底部：资源中心 */
export const RESOURCES_NAV_ITEM: PrimaryNavItem = {
  id: 'resources',
  title: '资源中心',
  railLabel: '资源',
  icon: 'solar:archive-minimalistic-linear',
  tab: 'phoneLines',
  description: '电话线路等资源',
};

/** 底部：通用配置（原“管理区”） */
export const MANAGE_NAV_ITEM: PrimaryNavItem = {
  id: 'manage',
  title: '组织管理',
  railLabel: '组织',
  icon: 'solar:widget-5-linear',
  tab: 'staff',
  description: '账号管理 / 角色权限',
};

/** 一级轨底部工具区（资源中心 + 通用配置） */
export const BOTTOM_NAV_ITEMS: PrimaryNavItem[] = [
  RESOURCES_NAV_ITEM,
  MANAGE_NAV_ITEM,
];

/** 含业务域 + 底部工具区，供标题/域查找 */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  ...DOMAIN_NAV,
  ...BOTTOM_NAV_ITEMS,
];

/** 一级轨常驻全部业务域（不再按雇佣解锁） */
export const ALWAYS_VISIBLE_DOMAINS = new Set<NavDomain>(DOMAIN_NAV.map((item) => item.id));
