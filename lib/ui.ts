/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * JoySupport（京小灵）共享样式 — 以“我的数字员工”首页（ui.md / EmployeeHomeRelay）为唯一标准。
 *
 * 约定：
 * - 画布白底；描边 #ECECEC（Tailwind: border-neutral-200）
 * - 卡片 / 弹窗圆角 13px；按钮 / 输入 7px
 * - 控件默认高 32px（h-8）；分段 Tab 总高 38px
 * - 主操作墨黑 neutral-800；语义色只用于状态
 * - 动效 200ms；卡片 hover 轻抬起
 * - 业务页禁止裸 Hex；颜色走本文件 / Tailwind neutral + 语义色
 */

import { cn } from '@/lib/utils';

/** 页面外壳：主内容区滚动画布 */
export const PAGE =
  'flex-1 min-h-0 overflow-y-auto p-5 bg-white text-neutral-800 font-sans text-xs antialiased';

/** 内容卡片（员工卡 / 内容块） */
export const CARD =
  'bg-white border border-neutral-200 rounded-[13px] shadow-[0_2px_10px_rgba(31,35,41,0.02)] transition-all duration-200';
export const CARD_HOVER =
  'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(31,35,41,0.08)]';

/** 面板 / 表格容器（静态，无 hover 抬起） */
export const PANEL = 'bg-white border border-neutral-200 rounded-[13px]';

const BTN_BASE =
  'inline-flex items-center justify-center gap-1 font-semibold rounded-[7px] text-xs transition cursor-pointer outline-none select-none disabled:opacity-50 disabled:pointer-events-none';

/** 主操作（墨黑） */
export const BTN_INK = `${BTN_BASE} h-8 px-3 bg-neutral-800 text-white hover:opacity-90`;

/** 次级（柔灰） */
export const BTN_SOFT = `${BTN_BASE} h-8 px-3 bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200`;

/** 描边（白底） */
export const BTN_OUTLINE = `${BTN_BASE} h-8 px-3 bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 shadow-[0_1px_0_rgba(0,0,0,0.05)]`;

/** 页头 / Banner 主 CTA（与 BTN_INK 同高；保留别名） */
export const BTN_MD = BTN_INK;

/** 危险描边 */
export const BTN_DANGER = `${BTN_BASE} h-8 px-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:text-rose-600`;

/** 输入框 / 下拉 / 文本域（多行勿加 FIELD_CTRL） */
export const FIELD =
  'w-full bg-white border border-neutral-200/50 rounded-[7px] text-xs text-neutral-800 placeholder:text-neutral-800/50 px-2.5 outline-none transition duration-200 focus:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed';

/** 单行控件高度（与 FIELD 组合：cn(FIELD, FIELD_CTRL)） */
export const FIELD_CTRL = 'h-8';

/** 页头 / 列表顶栏搜索框宽度（与 FIELD、FIELD_CTRL 组合：cn(FIELD, FIELD_CTRL, SEARCH_WIDTH, 'pl-9')） */
export const SEARCH_WIDTH = 'w-64 shrink-0';

/** 页头搜索框整包样式（已含高度与宽度；用 cn() 叠加 pl-9 等） */
export const SEARCH_FIELD = `${FIELD_CTRL} ${SEARCH_WIDTH} bg-white border border-neutral-200/50 rounded-[7px] text-xs text-neutral-800 placeholder:text-neutral-800/50 px-2.5 outline-none transition duration-200 focus:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed`;

/** 筛选下拉 Trigger（市场 / 我的员工等页头筛选，对齐 shadcn Select） */
export const SELECT_TRIGGER =
  'h-8 w-auto min-w-[7.5rem] bg-white border-neutral-200/50 rounded-[7px] text-xs text-neutral-800 shadow-none';

/** 表格行内操作按钮 */
export const BTN_TABLE = `${BTN_BASE} h-6 px-2.5 text-[11px] bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 shadow-[0_1px_0_rgba(0,0,0,0.05)]`;

/** 列表 / 表格统一样式（与 OnlinePageLayout 一致） */
export const TABLE = {
  wrap: 'overflow-x-auto',
  table: 'w-full text-left border-collapse text-[12px] text-neutral-800',
  headRow: 'border-b border-neutral-200 text-[10px] text-neutral-500 font-medium',
  thFirst: 'px-1 py-2.5 pr-4 whitespace-nowrap',
  th: 'px-4 py-2.5 whitespace-nowrap',
  thLast: 'px-4 py-2.5 pl-4 pr-1 whitespace-nowrap text-right',
  body: 'divide-y divide-neutral-100',
  row: 'hover:bg-neutral-50/80 transition duration-150',
  tdFirst: 'px-1 py-3 pr-4 align-top',
  td: 'px-4 py-3 align-top',
  tdLast: 'px-4 py-3 pl-4 pr-1 align-top text-right',
} as const;

/** 列表顶栏辅助文案（共 N 条等） */
export const LIST_META = 'text-[12px] text-neutral-500';

/** 列表分隔行 */
export const LIST_DIVIDER = 'border-b border-neutral-200/70 pb-2.5 last:border-b-0';

/** 表单标签 */
export const LABEL = 'block text-xs font-medium text-neutral-500 mb-1';

/** 分段 Tab 容器（总高 38px） */
export const SEGMENTED_BAR =
  'inline-flex h-[38px] items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit shrink-0';

/** 分段 Tab 项 */
export function segmentedItemClass(active: boolean): string {
  return [
    'h-[30px] px-3 rounded-md text-[13px] font-medium leading-none transition-all duration-200 cursor-pointer whitespace-nowrap',
    'flex items-center justify-center gap-1.5 border-0 outline-none',
    active
      ? 'bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      : 'bg-transparent text-neutral-500 hover:text-neutral-950',
  ].join(' ');
}

/** 一级导航图标 / 激活文字渐变（黑 → 蓝，135deg） */
export const NAV_ACTIVE_GRADIENT_TEXT =
  'text-transparent bg-clip-text bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)]';

export const NAV_ACTIVE_GRADIENT_BG =
  'bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)]';

/** AOP 技能创建中间态 — 与顶栏“数字员工技能”激活渐变一致 */
export const SKILL_AOP_GRADIENT_TEXT = NAV_ACTIVE_GRADIENT_TEXT;
export const SKILL_AOP_GRADIENT_BG = NAV_ACTIVE_GRADIENT_BG;
export const SKILL_AOP_TINT_BG = 'bg-[rgba(21,101,191,0.08)]';
export const SKILL_AOP_TINT_BORDER = 'border-[rgba(21,101,191,0.05)]';
export const SKILL_AOP_CHIP =
  'inline-flex items-center gap-1 text-[10px] font-medium bg-[rgba(21,101,191,0.08)] text-[#1565BF] border border-[rgba(21,101,191,0.12)] px-2 py-0.5 rounded-md';
export const SKILL_AOP_ACCENT_TEXT = 'text-[#1565BF]';
export const SKILL_AOP_ACCENT_BG = 'bg-[#1565BF]';
export const SKILL_AOP_HOVER_TINT = 'hover:bg-[rgba(21,101,191,0.08)]';
export const SKILL_AOP_SELECTED_ROW = 'border-[rgba(21,101,191,0.25)] bg-[rgba(21,101,191,0.08)]';
export const SKILL_AOP_SEND_BTN =
  'w-9 h-9 rounded-[7px] bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)] text-white hover:opacity-90 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.05)]';
export const SKILL_AOP_PRIMARY_BTN =
  'rounded-lg bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)] text-white font-medium hover:opacity-90 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed';

/** “改写”等 AI 轻按钮：与顶栏/发送钮同色系（黑 → #1565BF） */
export const AI_LIGHT_BTN_BG = 'bg-[rgba(21,101,191,0.08)]';
export const AI_GRADIENT_TEXT = NAV_ACTIVE_GRADIENT_TEXT;
export const AI_GRADIENT_BTN_BG = NAV_ACTIVE_GRADIENT_BG;
export const AI_ACCENT_TEXT = SKILL_AOP_ACCENT_TEXT;

/** 表单内嵌“改写”小按钮 */
export const AI_REWRITE_CHIP =
  'inline-flex items-center justify-center gap-1 h-6 px-2.5 rounded-[7px] text-[12px] leading-none font-normal border-0 cursor-pointer transition';

/** 顶栏二级 Tab 底部胶囊指示条（渐变，配合激活文字） */
export const NAV_SECONDARY_TAB_INDICATOR =
  'absolute left-1/2 bottom-[3px] -translate-x-1/2 h-[3px] w-9 max-w-[55%] rounded-full bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)] pointer-events-none';

/** 顶栏二级子 Tab 底部胶囊指示条 */
export const NAV_SECONDARY_SUBTAB_INDICATOR =
  'absolute left-1/2 bottom-[2px] -translate-x-1/2 h-[3px] w-8 max-w-[50%] rounded-full bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)] pointer-events-none';

/** 顶栏二级 Tab（h-11）— 激活态渐变文字 + 底部胶囊条 */
export function navSecondaryTabClass(active: boolean): string {
  return [
    'relative h-11 px-3 text-[13px] whitespace-nowrap transition cursor-pointer shrink-0',
    active
      ? `font-semibold ${NAV_ACTIVE_GRADIENT_TEXT}`
      : 'font-medium text-neutral-500 hover:text-neutral-800',
  ].join(' ');
}

/** 顶栏二级子 Tab（h-9）— 激活态渐变文字 + 底部胶囊条 */
export function navSecondarySubTabClass(active: boolean): string {
  return [
    'relative h-9 px-3 text-[12px] whitespace-nowrap transition cursor-pointer shrink-0',
    active
      ? `font-semibold ${NAV_ACTIVE_GRADIENT_TEXT}`
      : 'font-medium text-neutral-500 hover:text-neutral-800',
  ].join(' ');
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** 弹窗遮罩 + 面板 */
export const MODAL_OVERLAY =
  'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200';
export const MODAL_PANEL =
  'bg-white text-neutral-900 rounded-[13px] w-full shadow-lg ring-1 ring-black/10 p-5 animate-in fade-in zoom-in-95 duration-200';

/** 筛选 / 快捷指令 Chip（#atom-chip）— 可点；不是 Badge */
export const CHIP =
  'inline-flex items-center h-7 px-2.5 rounded-full border text-[12px] cursor-pointer transition whitespace-nowrap bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50';
export const CHIP_ACTIVE =
  'inline-flex items-center h-7 px-2.5 rounded-full border text-[12px] cursor-pointer transition whitespace-nowrap bg-sky-50 border-sky-300 text-live font-semibold';

/** 语义徽章（首页 Tag 风格） */
export const badgeTones = {
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  ink: 'bg-neutral-800 text-white border-transparent',
  success: 'bg-[#ECFDF5] text-[#009966] border-[#A4F4CF]/60',
  warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]/60',
  danger: 'bg-rose-50 text-rose-600 border-rose-100',
  live: 'bg-[#F0F7FF] text-[#0050D2] border-[#91C5FF]/60',
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function badgeClass(tone: BadgeTone = 'neutral') {
  return `inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-px rounded border ${badgeTones[tone]}`;
}

/**
 * 确认流状态角标 — SkillRoundConfirmCard / SkillChatConfirmDock
 * - confirmed：确认卡标题“已确认”— emerald-100 / emerald-800 · 18px 高
 * - confirmedSoft：草案卡内联“已确认”— emerald-50 / emerald-700 · 10px
 * - pending：配对“待确认”— amber-50 / amber-700
 */
export const confirmStatusBadgeTones = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  confirmedSoft: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
} as const;

export type ConfirmStatusBadgeTone = keyof typeof confirmStatusBadgeTones;

export const CONFIRM_STATUS_BADGE_BASE = 'inline-flex items-center font-semibold shrink-0';

/** 确认卡标题旁 — h-[18px] · 11px · rounded */
export const CONFIRM_STATUS_BADGE_MD = cn(
  CONFIRM_STATUS_BADGE_BASE,
  'h-[18px] px-1.5 rounded text-[11px]',
);

/** 草案 / 内联状态 — 10px · rounded-md */
export const CONFIRM_STATUS_BADGE_SM = cn(
  CONFIRM_STATUS_BADGE_BASE,
  'text-[10px] px-1.5 py-0.5 rounded-md',
);

export function confirmStatusBadgeClass(tone: ConfirmStatusBadgeTone) {
  const shell =
    tone === 'confirmed' ? CONFIRM_STATUS_BADGE_MD : CONFIRM_STATUS_BADGE_SM;
  return cn(shell, confirmStatusBadgeTones[tone]);
}
