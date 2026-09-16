/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * JoySupport（京小灵）组件库展台 — 唯一真相源：lib/ui.ts + src/components/common/*
 * 入口：?ds=1
 *
 * 信息架构：Token → Atom（全状态）→ Pattern → Recipe → Legacy
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';
import {
  BTN_DANGER,
  BTN_DANGER_SM,
  BTN_INK,
  BTN_INK_SM,
  BTN_OUTLINE,
  BTN_OUTLINE_SM,
  BTN_SOFT,
  BTN_SOFT_SM,
  BTN_AI,
  BTN_AI_TEXT,
  CARD,
  CARD_HOVER,
  FIELD,
  FIELD_CTRL,
  LABEL,
  PANEL,
  SEARCH_FIELD,
  SELECT_TRIGGER,
  badgeClass,
  confirmStatusBadgeClass,
  SKILL_AOP_PRIMARY_BTN_SM,
  NAV_ACTIVE_GRADIENT_TEXT,
  NAV_ACTIVE_GRADIENT_BG,
  SKILL_AOP_TINT_BG,
  SKILL_AOP_TINT_BORDER,
  SKILL_AOP_SEND_BTN,
  CHIP,
  CHIP_ACTIVE,
  FUNCTIONAL_COLORS,
  NAV_SECONDARY_TAB_INDICATOR,
  navSecondaryTabClass,
  segmentedItemClass,
  type BadgeTone,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  Ban,
  Bell,
  BookOpen,
  Bot,
  Box,
  BrainCircuit,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Code,
  Compass,
  Contact,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Folder,
  Gift,
  Globe2,
  GraduationCap,
  Headphones,
  HelpCircle,
  History,
  Home,
  Image,
  Info,
  KeyRound,
  Layers,
  Library,
  Link2,
  Lock,
  LogOut,
  Mail,
  Maximize2,
  MessageSquare,
  Minimize2,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Terminal,
  Trash2,
  TrendingUp,
  Unlock,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  Users,
  Video,
  Wifi,
  Workflow,
  X,
  Zap,
  type IconComponent,
} from '@/lib/icons';
import {
  BOTTOM_NAV_ITEMS,
  DOMAIN_NAV,
} from '@/lib/navDomain';
import {
  NAV_RAIL_ICON_SIZE,
  NAV_RAIL_ICON_SIZE_COMPACT,
  NAV_RAIL_MORE_SVG,
  NAV_RAIL_SVG_MARKUP,
  prepareNavRailSvg,
} from '@/lib/navRailAssets';
import { SECONDARY_NAV_ICON_BY_TAB_ID } from '@/lib/secondaryNavIcons';
import { useApp } from '../context/AppContext';
import { PageHeader } from './common/PageHeader';
import { PrimaryNavRail } from './PrimaryNavRail';
import { SecondarySideNav } from './SecondarySideNav';
import { Modal } from './common/Modal';
import { PanelModal } from './common/PanelModal';
import { SegmentedTabBar } from './common/SegmentedTabs';
import { ListPagination } from './common/ListPagination';
import { ContentBusy } from './common/ContentBusy';
import { MatrixLoader } from './common/MatrixLoader';
import { CardIcon } from './common/CardIcon';
import { QcPlanBoard } from './QcPlanBoard';
import {
  sourceLabelOf,
  scopeLabelOf,
  type QcPlan,
} from '@/lib/qcWorkspaceMock';
import {
  OnlinePageHeader,
  OnlinePageToolbar,
  OnlineSectionHeader,
  onlineTableClass,
  OnlineEmptyRow,
} from './common/OnlinePageLayout';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AppTooltip,
  TooltipProvider,
  type TooltipEffect,
  type TooltipPlacement,
} from '@/components/ui/tooltip';
import { EmployeeCardRelay } from './employees/relay/EmployeeCardRelay';
import { MarketCardRelay } from './employees/relay/MarketCardRelay';
import { HoverActionMenu } from './common/HoverActionMenu';
import { WorkspaceOverlay } from './common/WorkspaceOverlay';
import { SkillThinkingCard } from './skills/SkillThinkingCard';
import { SkillTaskPlanCard } from './skills/SkillTaskPlanCard';
import { SkillCollectCard } from './skills/SkillCollectCard';
import {
  SkillClarifyCard,
  type SkillClarifyPayload,
} from './skills/SkillClarifyCard';
import {
  SkillRoundConfirmCard,
  type SkillConfirmItem,
} from './skills/SkillRoundConfirmCard';
import { GoalComposerGhost } from './GoalComposerGhost';
import {
  ChatReplySkeleton,
  WorkLogSkeleton,
  UploadLoadingPanel,
} from './common/LoadingSkeletons';
import { ResizableSplitPane } from './common/ResizableSplitPane';
import { ExecutionProcessFold } from './common/ExecutionProcessFold';
import { MasterTemplateUpgradeBanner } from './onboarding/MasterTemplateUpgradeBanner';
import type { ThoughtStep } from '../types';
import type { PendingTemplateUpgrade } from '@/lib/masterTemplateUpgrade';
import { buildSkillClarifyQuestions, type SkillThinkStep } from '@/lib/skillStudioMock';
import { SKILL_CREATE_CHAT } from '@/lib/platformTerminology';
import {
  QC_APP_IMPLEMENTED_TABS,
  QC_APP_MAIN_TABS,
  type QcAppMainTab,
} from '@/lib/navDomain';

type NavId =
  | 'token-color'
  | 'token-type'
  | 'token-icon'
  | 'token-space'
  | 'token-radius'
  | 'token-shadow'
  | 'token-border'
  | 'token-motion'
  | 'atom-button'
  | 'atom-field'
  | 'atom-tag'
  | 'atom-segmented'
  | 'atom-underline'
  | 'atom-chip'
  | 'atom-tooltip'
  | 'feedback-toast'
  | 'feedback-busy'
  | 'feedback-empty'
  | 'feedback-status'
  | 'pattern-header'
  | 'pattern-dual-nav'
  | 'pattern-online'
  | 'pattern-banner'
  | 'pattern-card-icon'
  | 'pattern-employee'
  | 'pattern-market'
  | 'pattern-modal'
  | 'pattern-table'
  | 'pattern-ai-bubble'
  | 'pattern-ai-thinking'
  | 'pattern-ai-task-plan'
  | 'pattern-ai-collect'
  | 'pattern-ai-clarify'
  | 'pattern-ai-confirm'
  | 'pattern-goal-composer'
  | 'pattern-hover-menu'
  | 'pattern-workspace'
  | 'pattern-skeleton'
  | 'pattern-exec-fold'
  | 'pattern-split-pane'
  | 'pattern-upgrade-banner'
  | 'tpl-page-header'
  | 'tpl-list'
  | 'tpl-card'
  | 'tpl-modals'
  | 'tpl-layered-tabs'
  | 'tpl-dual-tabs'
  | 'recipe-crud'
  | 'recipe-list'
  | 'recipe-employee-bar'
  | 'recipe-filter'
  | 'legacy-wide-nav';

type PlatformStatus = 'live' | 'single' | 'ab' | 'unused' | 'legacy';

type TocItem = {
  id: NavId;
  zh: string;
  en: string;
  keywords?: string;
  status?: PlatformStatus;
};

/** 各展台在平台中的接入状态（对照全站 import 扫描） */
const PLATFORM_STATUS: Partial<Record<NavId, PlatformStatus>> = {
  'atom-underline': 'live',
  'atom-segmented': 'live',
  'pattern-dual-nav': 'ab',
  'pattern-header': 'single',
  'legacy-wide-nav': 'legacy',
  'pattern-banner': 'single',
  'pattern-ai-bubble': 'live',
  'pattern-ai-thinking': 'live',
  'pattern-ai-task-plan': 'live',
  'pattern-ai-collect': 'live',
  'pattern-ai-clarify': 'live',
  'pattern-ai-confirm': 'live',
  'pattern-goal-composer': 'live',
  'pattern-hover-menu': 'single',
  'pattern-workspace': 'single',
  'pattern-exec-fold': 'live',
  'pattern-split-pane': 'live',
  'pattern-upgrade-banner': 'live',
};

const STATUS_META: Record<
  PlatformStatus,
  { zh: string; en: string; tone: BadgeTone }
> = {
  live: { zh: '已接入', en: 'In prod', tone: 'success' },
  single: { zh: '单点', en: 'Single use', tone: 'warning' },
  ab: { zh: 'A/B 可选', en: 'A/B opt-in', tone: 'live' },
  unused: { zh: '未接入', en: 'Unused', tone: 'neutral' },
  legacy: { zh: '废弃', en: 'Legacy', tone: 'danger' },
};

const DS_EXEC_STEPS: ThoughtStep[] = [
  {
    id: 'ds-1',
    time: '12:00:01',
    type: 'search',
    message: '检索知识库“售后政策”',
    resourceKind: 'kb',
    resourceName: '售后政策库',
  },
  {
    id: 'ds-2',
    time: '12:00:03',
    type: 'tool',
    message: '调用技能 order_lookup',
    resourceKind: 'skill',
    resourceName: 'order_lookup',
  },
];

const DS_THINK_STEPS: SkillThinkStep[] = [
  {
    id: 't1',
    label: '解析岗位意图',
    detail: '识别服务场景与边界',
    status: 'done',
  },
  {
    id: 't2',
    label: '规划主 Agent Prompt',
    detail: '名称 / 性格 / 职责 / 红线',
    status: 'running',
  },
  {
    id: 't3',
    label: '拆解技能边界',
    detail: '技能表单草稿',
    status: 'pending',
  },
];

const DS_CLARIFY_QUESTIONS = buildSkillClarifyQuestions('退换货自助 订单查询 转人工');

const DS_CLARIFY_PAYLOAD: SkillClarifyPayload = {
  questions: DS_CLARIFY_QUESTIONS,
};

const DS_CLARIFY_SUBMITTED: SkillClarifyPayload = {
  questions: DS_CLARIFY_QUESTIONS.map((q) => ({
    ...q,
    selectedId: q.selectedId ?? q.options[0]?.id ?? null,
  })),
  submitted: true,
  collapsed: true,
};

const DS_CONFIRM_ITEMS: SkillConfirmItem[] = [
  {
    id: 'usage',
    label: '使用示例',
    checked: true,
    fieldKey: 'usageExamples',
    fieldLabel: '使用示例',
    value:
      '用户：“帮我查一下延保修到哪了，单号 XB20260301。”→ 确认属进度查询，核验标识通过后进入查询步骤。\n数字员工：确认标识后说明当前环节与寄回预估；若系统无时效则如实说明并给出跟进方式。',
  },
  {
    id: 'notes',
    label: '补充资料',
    checked: true,
    fieldKey: 'customNotes',
    fieldLabel: '补充资料',
    value: '高峰或接口延迟时，3 秒内告知用户稍候。',
  },
];

const DS_CONFIRM_ITEMS_CONFIRMED: SkillConfirmItem[] = DS_CONFIRM_ITEMS.map((item) => ({
  ...item,
  checked: true,
}));

const DS_GOAL_CHIPS = ['延保进度查询', '退换货自助', '高危客诉安抚'] as const;

const DS_TEMPLATE_UPGRADE: PendingTemplateUpgrade = {
  version: '2.4.0',
  releaseNotes: '优化情绪识别\n新增订单查询接口',
  marketName: '标准客服母版',
};

type TocGroup = { groupZh: string; groupEn: string; items: TocItem[] };

const TOC: TocGroup[] = [
  {
    groupZh: '页面模板',
    groupEn: 'Templates',
    items: [
      {
        id: 'tpl-page-header',
        zh: '页头',
        en: 'Page Header',
        keywords: 'QcPlanBoard OnlinePageHeader PAGE_HEADER_INSET 质检计划 筛选 搜索 新建',
      },
      {
        id: 'tpl-list',
        zh: '内容列表',
        en: 'List Layout',
        keywords: '表格 列表 CRUD OnlinePageHeader TABLE',
      },
      {
        id: 'tpl-card',
        zh: '卡片布局',
        en: 'Card Grid',
        keywords: 'CARD 卡片网格 质检计划',
      },
      {
        id: 'tpl-modals',
        zh: '弹窗样式',
        en: 'Modals',
        keywords: 'Modal PanelModal 表单 确认 危险 宽屏 说明 窄弹窗 480',
      },
      {
        id: 'tpl-layered-tabs',
        zh: '分层选项卡',
        en: 'Layered Tabs',
        keywords: '一级导航 二级 Tab 质检 侧栏',
      },
      {
        id: 'tpl-dual-tabs',
        zh: '页内子标签',
        en: 'In-page Tabs',
        keywords: '技能页 我的技能 技能市场 OnlinePageHeader 墨黑底条',
      },
    ],
  },
  {
    groupZh: '设计令牌',
    groupEn: 'Token',
    items: [
      { id: 'token-color', zh: '颜色', en: 'Color', keywords: '颜色 color' },
      { id: 'token-type', zh: '字体', en: 'Font', keywords: '字体 font' },
      { id: 'token-icon', zh: '图标', en: 'Icon', keywords: '图标 icon 导航 PrimaryNavRail Solar' },
      { id: 'token-space', zh: '间距', en: 'Space', keywords: '间距 space' },
      { id: 'token-radius', zh: '圆角', en: 'Radius', keywords: '圆角 radius' },
      { id: 'token-shadow', zh: '阴影', en: 'Shadow', keywords: '阴影 shadow' },
      { id: 'token-border', zh: '描边', en: 'Border', keywords: '描边 border' },
      { id: 'token-motion', zh: '动效', en: 'Motion', keywords: '动效 motion' },
    ],
  },
  {
    groupZh: '原子',
    groupEn: 'Atom',
    items: [
      {
        id: 'atom-button',
        zh: '按钮',
        en: 'Button',
        keywords: 'BTN_INK SOFT OUTLINE DANGER BTN_*_SM SKILL_AOP_PRIMARY_BTN_SM BTN_AI AI色 按钮 Loading 加载 MatrixLoader',
      },
      { id: 'atom-field', zh: '表单字段', en: 'Field / Form', keywords: 'FIELD LABEL 表单 输入' },
      { id: 'atom-tag', zh: '标签', en: 'Tag', keywords: 'badge badgeClass 标签' },
      { id: 'atom-chip', zh: '筛选条', en: 'Filter Chip', keywords: 'chip 筛选' },
      {
        id: 'atom-tooltip',
        zh: '文字提示',
        en: 'Tooltip',
        keywords: 'tooltip jd-tooltip 提示 placement dark light',
      },
    ],
  },
  {
    groupZh: '导航',
    groupEn: 'Navigation',
    items: [
      {
        id: 'atom-underline',
        zh: '顶栏下划线 Tab',
        en: 'Navigation',
        keywords: 'Navigation.tsx hybrid 顶栏 默认',
        status: 'live',
      },
      {
        id: 'atom-segmented',
        zh: '分段控件',
        en: 'Segmented',
        keywords: 'SEGMENTED 分段 SegmentedTabBar',
        status: 'live',
      },
      {
        id: 'pattern-dual-nav',
        zh: '双侧导航',
        en: 'Dual Nav',
        keywords: 'PrimaryNavRail SecondarySideNav dualSide',
        status: 'ab',
      },
      {
        id: 'pattern-header',
        zh: '页面头',
        en: 'PageHeader',
        keywords: 'PageHeader Dashboard 角色',
        status: 'single',
      },
      {
        id: 'legacy-wide-nav',
        zh: '宽侧栏（废弃）',
        en: 'Wide Sidebar',
        keywords: 'legacy Sidebar 232',
        status: 'legacy',
      },
    ],
  },
  {
    groupZh: '反馈',
    groupEn: 'Feedback',
    items: [
      { id: 'feedback-toast', zh: '轻提示', en: 'Toast', keywords: 'toast sonner' },
      { id: 'feedback-busy', zh: '加载态', en: 'Busy / Loader', keywords: 'ContentBusy MatrixLoader' },
      { id: 'feedback-empty', zh: '空状态', en: 'Empty', keywords: '空状态 empty' },
      { id: 'feedback-status', zh: '状态点', en: 'Status', keywords: '在线 状态' },
    ],
  },
  {
    groupZh: '模式',
    groupEn: 'Pattern',
    items: [
      { id: 'pattern-online', zh: '在线列表页', en: 'Online Layout', keywords: 'OnlinePageLayout' },
      {
        id: 'pattern-banner',
        zh: '营销轮播（内联）',
        en: 'Home Banner',
        keywords: 'EmployeeHomeRelay 轮播 非独立组件',
        status: 'single',
      },
      { id: 'pattern-card-icon', zh: '卡片图标', en: 'CardIcon', keywords: 'CardIcon' },
      { id: 'pattern-employee', zh: '员工卡', en: 'Employee Card', keywords: 'EmployeeCardRelay' },
      { id: 'pattern-market', zh: '市场卡', en: 'Market Card', keywords: 'MarketCardRelay' },
      { id: 'pattern-modal', zh: '弹窗', en: 'Modal', keywords: 'Modal MODAL' },
      { id: 'pattern-table', zh: '表格 / 分页', en: 'Table / Pagination', keywords: 'ListPagination table' },
      {
        id: 'pattern-split-pane',
        zh: '可拖拽分栏',
        en: 'ResizableSplitPane',
        keywords: 'ResizableSplitPane 分栏',
        status: 'live',
      },
      {
        id: 'pattern-upgrade-banner',
        zh: '母版升级提示',
        en: 'Upgrade Banner',
        keywords: 'MasterTemplateUpgradeBanner 上岗',
        status: 'live',
      },
      {
        id: 'pattern-hover-menu',
        zh: '悬停菜单',
        en: 'HoverActionMenu',
        keywords: 'HoverActionMenu 上岗',
        status: 'single',
      },
      {
        id: 'pattern-workspace',
        zh: '工作台层',
        en: 'WorkspaceOverlay',
        keywords: 'WorkspaceOverlay 知识库',
        status: 'single',
      },
      {
        id: 'pattern-skeleton',
        zh: '骨架屏',
        en: 'Loading Skeletons',
        keywords: 'Skeleton 骨架',
      },
    ],
  },
  {
    groupZh: '配方',
    groupEn: 'Recipe',
    items: [
      { id: 'recipe-crud', zh: '弹窗增删改', en: 'Modal CRUD', keywords: 'CRUD Modal' },
      { id: 'recipe-list', zh: '在线列表增删改', en: 'List CRUD', keywords: '列表 Online' },
      {
        id: 'recipe-employee-bar',
        zh: '员工卡操作条',
        en: 'Employee Actions',
        keywords: '培训 上岗 派发',
      },
      { id: 'recipe-filter', zh: '筛选条', en: 'Filter Bar', keywords: '搜索 Select Chip' },
    ],
  },
];

/** AI / dongDesign 对话与技能过程组件（独立展台 ?ds=ai） */
const TOC_AI: TocGroup[] = [
  {
    groupZh: '创作输入',
    groupEn: 'Composer',
    items: [
      {
        id: 'pattern-goal-composer',
        zh: '创作 Sender',
        en: 'GoalComposer',
        keywords: 'GoalComposerGhost skill-ai-composer Agent Builder dongDesign Sender',
        status: 'live',
      },
    ],
  },
  {
    groupZh: '对话过程',
    groupEn: 'Dialogue',
    items: [
      {
        id: 'pattern-ai-bubble',
        zh: '对话气泡字阶',
        en: 'AI Bubble',
        keywords: 'dongDesign Bubble 气泡 标题 正文',
        status: 'live',
      },
      {
        id: 'pattern-ai-thinking',
        zh: '深度思考卡',
        en: 'SkillThinkingCard',
        keywords: 'SkillThinkingCard Think Cot 思考中',
        status: 'live',
      },
      {
        id: 'pattern-ai-task-plan',
        zh: '任务规划卡',
        en: 'SkillTaskPlanCard',
        keywords: 'SkillTaskPlanCard 任务规划 Step',
        status: 'live',
      },
      {
        id: 'pattern-ai-collect',
        zh: '数据收集卡',
        en: 'SkillCollectCard',
        keywords: 'SkillCollectCard Collect 搜索和分析资料',
        status: 'live',
      },
      {
        id: 'pattern-ai-clarify',
        zh: '补充信息卡',
        en: 'SkillClarifyCard',
        keywords:
          'SkillClarifyCard 补充信息 提交 跳过 SKILL_CREATE_CHAT SKILL_AOP_PRIMARY_BTN BTN_SOFT',
        status: 'live',
      },
      {
        id: 'pattern-ai-confirm',
        zh: '确认信息卡',
        en: 'SkillRoundConfirmCard',
        keywords:
          'SkillRoundConfirmCard 确认信息 确认执行 批量编辑 confirmStatusBadge SKILL_AOP_PRIMARY_BTN_SM BTN_SOFT_SM',
        status: 'live',
      },
      {
        id: 'pattern-exec-fold',
        zh: '处理过程折叠',
        en: 'ExecutionProcessFold',
        keywords: 'ExecutionProcessFold 对话 推理',
        status: 'live',
      },
    ],
  },
];

/** AI 展台锚点（用于分区显隐） */
const AI_SECTION_IDS = new Set<NavId>(
  TOC_AI.flatMap((g) => g.items.map((i) => i.id)),
);

type LibraryKind = 'base' | 'ai';

function readLibraryKind(): LibraryKind {
  return new URLSearchParams(window.location.search).get('ds') === 'ai' ? 'ai' : 'base';
}

function defaultTocId(kind: LibraryKind): NavId {
  return kind === 'ai' ? 'pattern-goal-composer' : 'tpl-page-header';
}
type ColorSwatch = {
  zh: string;
  en: string;
  hex: string;
  note: string;
  /** 深色块上显示浅色字 */
  dark?: boolean;
};

type ColorGroup = {
  groupZh: string;
  groupEn: string;
  items: ColorSwatch[];
  /** functional = DongDesign 功能色族卡片 */
  kind?: 'neutral' | 'grid' | 'functional' | 'badge-preview';
};

/** 设计系统色板 — 对齐 color-tokens.md / DongDesign 功能色 */
const COLOR_GROUPS: ColorGroup[] = [
  {
    groupZh: '中性灰阶',
    groupEn: 'Neutral scale',
    kind: 'neutral',
    items: [
      { zh: '50', en: 'neutral-50', hex: '#FAFAFA', note: '侧栏底 / bg-neutral-50' },
      { zh: '100', en: 'neutral-100', hex: '#F5F5F5', note: '浅填充 / 分段底' },
      { zh: '150', en: 'neutral-150', hex: '#F0F0F0', note: '自定义补齐灰' },
      { zh: '200', en: 'neutral-200', hex: '#E5E5E5', note: '描边 border-neutral-200' },
      { zh: '250', en: 'neutral-250', hex: '#E0E0E0', note: '自定义描边' },
      { zh: '300', en: 'neutral-300', hex: '#D4D4D4', note: '滚动条 thumb' },
      { zh: '350', en: 'neutral-350', hex: '#C4C4C4', note: 'Beta 标描边' },
      { zh: '400', en: 'neutral-400', hex: '#A3A3A3', note: '表头 / 最弱字' },
      { zh: '500', en: 'neutral-500', hex: '#737373', note: '次要 / LABEL' },
      { zh: '550', en: 'neutral-550', hex: '#737373', note: '侧栏图标' },
      { zh: '600', en: 'neutral-600', hex: '#525252', note: '次级正文' },
      { zh: '700', en: 'neutral-700', hex: '#404040', note: '表格正文' },
      { zh: '800', en: 'neutral-800', hex: '#262626', note: '主按钮' },
      { zh: '850', en: 'neutral-850', hex: '#262626', note: 'hover:bg-neutral-850' },
      { zh: '900', en: 'neutral-900', hex: '#171717', note: '标题 / 进度条' },
      { zh: '950', en: 'neutral-950', hex: '#0A0A0A', note: '深色命令区', dark: true },
    ],
  },
  {
    groupZh: '语义 Token',
    groupEn: 'Semantic CSS',
    kind: 'grid',
    items: [
      { zh: '画布', en: 'background', hex: '#FFFFFF', note: 'bg-background / PAGE' },
      { zh: '主文本', en: 'foreground', hex: '#111111', note: 'text-foreground', dark: true },
      { zh: '主色', en: 'primary', hex: '#111111', note: 'bg-primary / ink', dark: true },
      { zh: '主色字', en: 'primary-fg', hex: '#FAFAFA', note: 'text-primary-foreground' },
      { zh: '次级底', en: 'secondary', hex: '#F5F5F5', note: 'bg-secondary / muted' },
      { zh: '次要字', en: 'muted-fg', hex: '#737373', note: 'text-muted-foreground' },
      { zh: '默认描边', en: 'border', hex: '#E8E8E8', note: 'border-border / input' },
      { zh: '聚焦环', en: 'ring', hex: '#A3A3A3', note: 'ring-ring /30' },
      { zh: '危险', en: 'destructive', hex: '#F33B50', note: '对齐功能色 Error', dark: true },
      { zh: '遮罩', en: 'overlay', hex: '#000000', note: 'bg-black/40 Modal', dark: true },
    ],
  },
  {
    groupZh: '功能色',
    groupEn: 'Functional colors',
    kind: 'functional',
    items: [],
  },
];

const FUNCTIONAL_COLOR_FAMILIES: Array<{
  key: keyof typeof FUNCTIONAL_COLORS;
  zh: string;
  en: string;
  badgeTone?: BadgeTone;
}> = [
  { key: 'success', zh: '成功', en: 'Success', badgeTone: 'success' },
  { key: 'warning', zh: '警告', en: 'Warning', badgeTone: 'warning' },
  { key: 'error', zh: '错误', en: 'Error', badgeTone: 'danger' },
  { key: 'info', zh: '信息', en: 'Info', badgeTone: 'live' },
];

function ColorSwatchCard({ swatch }: { swatch: ColorSwatch }) {
  const isDark = swatch.dark ?? ['#111111', '#262626', '#171717', '#0A0A0A', '#000000'].includes(
    swatch.hex.toUpperCase(),
  );
  return (
    <div className="rounded-[10px] border border-neutral-200 bg-white overflow-hidden shadow-[0_1px_4px_rgba(31,35,41,0.03)]">
      <div
        className="h-12 border-b border-neutral-100 flex items-end px-2 pb-1.5"
        style={{ background: swatch.hex }}
      >
        <span
          className={cn(
            'font-mono text-[9px] font-bold tabular-nums',
            isDark ? 'text-white/90' : 'text-neutral-600/80',
          )}
        >
          {swatch.hex}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[11px] font-semibold text-neutral-900 leading-tight">{swatch.zh}</div>
        <div className="text-[9px] text-neutral-500 mt-0.5 leading-snug line-clamp-2">{swatch.note}</div>
      </div>
    </div>
  );
}

/** DongDesign 功能色族卡片：主色 + 四档变体 */
function FunctionalColorFamilyCard({
  zh,
  en,
  palette,
  badgeTone,
}: {
  zh: string;
  en: string;
  palette: (typeof FUNCTIONAL_COLORS)[keyof typeof FUNCTIONAL_COLORS];
  badgeTone?: BadgeTone;
}) {
  const variants = [palette.light, palette.dark, palette.soft, palette.bg];
  return (
    <div className="rounded-[12px] border border-neutral-200/80 bg-white overflow-hidden shadow-[0_1px_4px_rgba(31,35,41,0.03)]">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-neutral-900">{en}</div>
          <div className="text-[11px] text-neutral-500">{zh}</div>
        </div>
        {badgeTone ? <span className={badgeClass(badgeTone)}>{zh}</span> : null}
      </div>
      <div
        className="mx-3 h-[72px] rounded-[8px] flex items-end px-2.5 pb-2"
        style={{ background: palette.color }}
      >
        <span className="font-mono text-[11px] font-bold text-white/95 tabular-nums">
          {palette.color}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-3 pt-2.5">
        {variants.map((hex) => (
          <div key={hex} className="min-w-0">
            <div
              className="h-8 rounded-[6px] border border-black/5"
              style={{ background: hex }}
              title={hex}
            />
            <div className="mt-1 font-mono text-[8px] text-neutral-400 truncate tabular-nums">
              {hex}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NeutralScaleStrip({ items }: { items: ColorSwatch[] }) {
  return (
    <div className="rounded-[13px] border border-neutral-200 bg-white overflow-hidden shadow-[0_2px_10px_rgba(31,35,41,0.02)]">
      <div className="flex h-14">
        {items.map((c) => (
          <div
            key={c.en}
            className="flex-1 min-w-0 border-r border-white/20 last:border-r-0"
            style={{ background: c.hex }}
            title={`${c.zh} ${c.hex} · ${c.note}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap border-t border-neutral-100">
        {items.map((c) => (
          <div
            key={`${c.en}-label`}
            className="flex-1 min-w-[52px] max-w-[72px] px-1 py-1.5 text-center border-r border-neutral-100 last:border-r-0"
          >
            <div className="text-[9px] font-bold text-neutral-700 tabular-nums">{c.zh}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ICON_GROUPS: { titleZh: string; titleEn: string; items: [IconComponent, string][] }[] = [
  { titleZh: '通用操作', titleEn: 'General', items: [
      [Search, 'Search'],
      [Plus, 'Plus'],
      [Minus, 'Minus'],
      [X, 'Close'],
      [Check, 'Check'],
      [CheckCircle2, 'CheckCircle'],
      [CheckSquare, 'CheckSquare'],
      [Trash2, 'Trash'],
      [Pencil, 'Edit'],
      [Copy, 'Copy'],
      [Save, 'Save'],
      [Filter, 'Filter'],
      [MoreHorizontal, 'MoreH'],
      [MoreVertical, 'MoreV'],
    ],
  },
  { titleZh: '导航与箭头', titleEn: 'Navigation', items: [
      [Home, 'Home'],
      [ArrowLeft, 'ArrowLeft'],
      [ArrowRight, 'ArrowRight'],
      [ArrowUp, 'ArrowUp'],
      [ArrowUpRight, 'UpRight'],
      [ArrowDownRight, 'DownRight'],
      [ChevronLeft, 'ChevronL'],
      [ChevronRight, 'ChevronR'],
      [ChevronUp, 'ChevronU'],
      [ChevronDown, 'ChevronD'],
      [ExternalLink, 'External'],
      [Maximize2, 'Maximize'],
      [Minimize2, 'Minimize'],
    ],
  },
  { titleZh: '人与组织', titleEn: 'People', items: [
      [User, 'User'],
      [Users, 'Users'],
      [UserCheck, 'UserCheck'],
      [Contact, 'Contact'],
      [Building, 'Building'],
      [GraduationCap, 'Graduate'],
      [Bot, 'Bot'],
      [Headphones, 'Headphone'],
    ],
  },
  { titleZh: '内容与知识', titleEn: 'Content', items: [
      [BookOpen, 'Book'],
      [Library, 'Library'],
      [FileText, 'File'],
      [Folder, 'Folder'],
      [MessageSquare, 'Message'],
      [Mail, 'Mail'],
      [Image, 'Image'],
      [Video, 'Video'],
      [Link2, 'Link'],
      [ClipboardCheck, 'Clipboard'],
    ],
  },
  { titleZh: '状态与反馈', titleEn: 'Status', items: [
      [AlertCircle, 'Alert'],
      [AlertTriangle, 'Warning'],
      [Info, 'Info'],
      [HelpCircle, 'Help'],
      [Bell, 'Bell'],
      [Ban, 'Ban'],
      [Eye, 'Eye'],
      [EyeOff, 'EyeOff'],
      [Star, 'Star'],
      [Gift, 'Gift'],
    ],
  },
  { titleZh: '系统与安全', titleEn: 'System', items: [
      [SlidersHorizontal, 'Sliders'],
      [Lock, 'Lock'],
      [Unlock, 'Unlock'],
      [KeyRound, 'Key'],
      [ShieldCheck, 'ShieldOk'],
      [LogOut, 'LogOut'],
      [Power, 'Power'],
      [Wifi, 'Wifi'],
      [Globe2, 'Globe'],
    ],
  },
  { titleZh: '媒体与传输', titleEn: 'Media', items: [
      [Play, 'Play'],
      [Pause, 'Pause'],
      [Upload, 'Upload'],
      [UploadCloud, 'UploadCloud'],
      [Download, 'Download'],
      [Share2, 'Share'],
      [RefreshCw, 'Refresh'],
      [RotateCcw, 'Undo'],
      [Send, 'Send'],
      [Calendar, 'Calendar'],
      [Clock, 'Clock'],
      [History, 'History'],
    ],
  },
  { titleZh: '数据与智能', titleEn: 'Data & AI', items: [
      [Activity, 'Activity'],
      [TrendingUp, 'Trending'],
      [Database, 'Database'],
      [BrainCircuit, 'Brain'],
      [Sparkles, 'Sparkles'],
      [Zap, 'Zap'],
      [Layers, 'Layers'],
      [Workflow, 'Workflow'],
      [Compass, 'Compass'],
      [Award, 'Award'],
      [Box, 'Box'],
      [Code, 'Code'],
      [Terminal, 'Terminal'],
    ],
  },
];

addCollection(solarIcons as Parameters<typeof addCollection>[0]);

/** 产品一级窄轨图标（自定义 SVG + Solar 兜底） */
const PRODUCT_PRIMARY_NAV_ICONS = [
  ...DOMAIN_NAV.map((item) => ({
    id: item.id,
    label: item.railLabel ?? item.title,
    icon: item.icon,
    markup: NAV_RAIL_SVG_MARKUP[item.id],
    size: NAV_RAIL_ICON_SIZE,
  })),
  {
    id: 'more',
    label: '更多',
    icon: 'solar:menu-dots-linear',
    markup: NAV_RAIL_MORE_SVG,
    size: NAV_RAIL_ICON_SIZE,
  },
  ...BOTTOM_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.railLabel ?? item.title,
    icon: item.icon,
    markup: NAV_RAIL_SVG_MARKUP[item.id],
    size: NAV_RAIL_ICON_SIZE_COMPACT,
  })),
] as const;

const SECONDARY_NAV_ICON_LABELS: Record<string, string> = {
  plans: '质检计划',
  templates: '模板',
  standards: '标准',
  sources: '数据源',
  tickets: '工单',
  review: '复核',
  collab: '协作',
  alerts: '告警',
  demo: '演示',
  tasks: '任务',
  training: '培训',
  records: '接待记录',
  stats: '业绩',
  numbers: '号码',
  dispatch: '派发',
  overview: '总览',
  monitor: '监控',
  resources: '资源',
  outbound_cdr: '外呼话单',
  case_orders: '案件工单',
  dial_strategy: '拨打策略',
  employee_report: '员工业绩',
  agent_report: 'Agent 报表',
  alert_whitelist: '告警白名单',
  cdr: '话单',
};

/** 展台不展示的二级图标（重复 / 弱相关） */
const SECONDARY_NAV_ICON_SHOWCASE_EXCLUDE = new Set([
  'summary',
  'agents',
  'calls',
  'users',
  'reports',
]);

const PRODUCT_SECONDARY_NAV_ICONS = Object.entries(SECONDARY_NAV_ICON_BY_TAB_ID)
  .filter(([id]) => !SECONDARY_NAV_ICON_SHOWCASE_EXCLUDE.has(id))
  .map(([id, icon]) => ({
    id,
    label: SECONDARY_NAV_ICON_LABELS[id] ?? id,
    icon,
  }));

const TAG_TONES: BadgeTone[] = ['neutral', 'ink', 'success', 'warning', 'danger', 'live'];
const TONE_ZH: Record<BadgeTone, string> = {
  neutral: '中性',
  ink: '墨黑',
  success: '成功',
  warning: '警告',
  danger: '危险',
  live: '信息',
};

/** DongDesign jd-tooltip 方位展台 */
const TOOLTIP_DEMO_ROWS: Array<{
  center?: boolean;
  items: Array<{ placement: TooltipPlacement; content: string; trigger?: 'hover' | 'click'; size?: 'small' | 'default' }>;
}> = [
  {
    center: true,
    items: [
      {
        placement: 'top-start',
        content: 'Top Left prompts info',
        size: 'small',
        trigger: 'click',
      },
      { placement: 'top', content: 'Top Center prompts info' },
      { placement: 'top-end', content: 'Top Right prompts info' },
    ],
  },
  {
    items: [
      { placement: 'left-start', content: 'Left Top prompts info' },
      { placement: 'right-start', content: 'Right Top prompts info' },
    ],
  },
  {
    items: [
      { placement: 'left', content: 'Left Center prompts info' },
      { placement: 'right', content: 'Right Center prompts info' },
    ],
  },
  {
    items: [
      { placement: 'left-end', content: 'Left Bottom prompts info' },
      { placement: 'right-end', content: 'Right Bottom prompts info' },
    ],
  },
  {
    center: true,
    items: [
      { placement: 'bottom-start', content: 'Bottom Left prompts info' },
      { placement: 'bottom', content: 'Bottom Center prompts info' },
      { placement: 'bottom-end', content: 'Bottom Right prompts info' },
    ],
  },
];

function TooltipPlacementDemo({ effect }: { effect: TooltipEffect }) {
  return (
    <div className="w-full max-w-[600px]">
      <div className="mb-2 text-[11px] font-semibold text-neutral-500">
        {effect === 'dark' ? '暗色 Dark' : '亮色 Light'}
      </div>
      {TOOLTIP_DEMO_ROWS.map((row, rowIdx) => (
        <div
          key={`${effect}-${rowIdx}`}
          className={cn(
            'flex items-center',
            row.center ? 'justify-center gap-3' : 'justify-between',
          )}
        >
          {row.items.map((item) => (
            <div key={`${effect}-${item.placement}`} className="mt-2.5 w-[110px]">
              <AppTooltip
                effect={effect}
                content={item.content}
                placement={item.placement}
                size={item.size ?? 'default'}
                trigger={item.trigger ?? 'hover'}
                strategy="fixed"
              >
                <button type="button" className={cn(BTN_OUTLINE, 'w-full')}>
                  {item.placement}
                </button>
              </AppTooltip>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const TPL_STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'running', label: '运行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
] as const;

type TplStatusKey = (typeof TPL_STATUS_FILTERS)[number]['key'];

/** 展台用质检计划样例（与 QcPlanBoard / buildDefaultQcPlans 同构） */
const TPL_QC_DEMO_PLANS: QcPlan[] = [
  {
    id: 'plan-daily-cs',
    name: '本平台客服会话 · 日常抽检',
    status: 'running',
    inspectorId: 'qc-demo-1',
    inspectorName: '质检员-京京',
    source: 'platform_cs_sessions',
    sourceLabel: sourceLabelOf('platform_cs_sessions'),
    targetScope: 'all_online_cs',
    scopeLabel: scopeLabelOf('all_online_cs'),
    targetAgentIds: [],
    standardSummary: '4 类 / 12 项 · 及格线 80',
    progress: 62,
    totalVolume: 48,
    inspectedVolume: 30,
    warningCount: 7,
    averageScore: 81,
    createdAt: '2026-04-12 09:00',
    updatedBy: '李敏',
    startAt: '2026-04-12 09:00',
  },
  {
    id: 'plan-external-recheck',
    name: '外部导入会话 · 专项复检',
    status: 'paused',
    inspectorId: 'qc-demo-1',
    inspectorName: '质检员-京京',
    source: 'external',
    sourceLabel: sourceLabelOf('external'),
    targetScope: 'specified',
    scopeLabel: scopeLabelOf('specified'),
    targetAgentIds: [],
    standardSummary: '4 类 / 12 项 · 及格线 80',
    progress: 28,
    totalVolume: 20,
    inspectedVolume: 12,
    warningCount: 3,
    averageScore: 74,
    createdAt: '2026-04-08 14:20',
    updatedBy: '王倩',
    startAt: '2026-04-08 14:20',
    endAt: '2026-04-15 18:00',
  },
  {
    id: 'plan-hotline-weekly',
    name: '热线通话质检 · 周报计划',
    status: 'completed',
    inspectorId: 'qc-demo-1',
    inspectorName: '质检员-京京',
    source: 'platform_cs_sessions',
    sourceLabel: sourceLabelOf('platform_cs_sessions'),
    targetScope: 'all_online_cs',
    scopeLabel: scopeLabelOf('all_online_cs'),
    targetAgentIds: [],
    standardSummary: '3 类 / 9 项 · 及格线 75',
    progress: 100,
    totalVolume: 36,
    inspectedVolume: 36,
    warningCount: 2,
    averageScore: 88,
    createdAt: '2026-03-28 10:00',
    updatedBy: '赵磊',
    startAt: '2026-03-28 10:00',
    endAt: '2026-04-04 18:00',
  },
];

const TPL_CARDS: {
  id: string;
  name: string;
  status: Exclude<TplStatusKey, 'all'>;
  meta: string;
  stats: string;
}[] = [
  {
    id: 'p1',
    name: '本平台客服会话 · 日常抽检',
    status: 'running',
    meta: '本平台 · 全部员工 · 李敏 · 2026-04-12',
    stats: '已检 30/48 · 均分 81 · 预警 7',
  },
  {
    id: 'p2',
    name: '外部导入会话 · 专项复检',
    status: 'paused',
    meta: '外部 · 指定员工 · 王倩 · 2026-04-08',
    stats: '已检 12/20 · 均分 74 · 预警 3',
  },
  {
    id: 'p3',
    name: '热线通话质检 · 周报计划',
    status: 'completed',
    meta: '本平台 · 指定员工 · 赵磊 · 2026-03-30',
    stats: '已检 96/96 · 均分 88 · 预警 2',
  },
];

const TPL_LIST_ROWS = [
  {
    id: 'kb1',
    name: '售后政策库',
    firstChar: '售',
    docs: 24,
    words: 18240,
    updatedAt: '2026-06-10 11:30',
  },
  {
    id: 'kb2',
    name: '催收话术库',
    firstChar: '催',
    docs: 12,
    words: 8600,
    updatedAt: '2026-06-09 14:20',
  },
  {
    id: 'kb3',
    name: '质检标准库',
    firstChar: '质',
    docs: 8,
    words: 4500,
    updatedAt: '2026-06-03 16:40',
  },
];

const TPL_LAYER_TABS = QC_APP_MAIN_TABS;

const TPL_SKILL_SUB_TABS = [
  { id: 'mine' as const, label: '我的技能' },
  { id: 'market' as const, label: '技能市场' },
];

/** 页内子 Tab（对齐 SkillPage：h-9 + 墨黑底条，不是顶栏渐变条） */
function skillPageSubTabClass(active: boolean) {
  return cn(
    'relative h-9 px-3 text-[13px] transition cursor-pointer shrink-0',
    active
      ? 'font-semibold text-neutral-900'
      : 'font-medium text-neutral-500 hover:text-neutral-800',
  );
}

type TplModalKind = 'form' | 'confirm' | 'danger' | 'large' | 'info';


const TOC_BY_ID: Record<NavId, TocItem> = Object.fromEntries(
  [...TOC, ...TOC_AI].flatMap((g) => g.items.map((item) => [item.id, item])),
) as Record<NavId, TocItem>;

const LibraryKindContext = React.createContext<LibraryKind>('base');

function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  const meta = STATUS_META[status];
  return <span className={badgeClass(meta.tone)}>{meta.zh}</span>;
}

/** 分区标题：与侧栏 TOC 同源；按基础 / AI 展台显隐 */
function Section({
  id,
  source: _source,
  desc,
  status,
  dos,
  donts,
  children,
}: {
  id: NavId;
  source?: string;
  desc?: string;
  /** 覆盖 TOC 默认状态 */
  status?: PlatformStatus;
  dos?: string[];
  donts?: string[];
  children: React.ReactNode;
}) {
  const libraryKind = React.useContext(LibraryKindContext);
  const isAiSection = AI_SECTION_IDS.has(id);
  if (libraryKind === 'ai' ? !isAiSection : isAiSection) return null;

  const toc = TOC_BY_ID[id];
  const platformStatus = status ?? toc?.status ?? PLATFORM_STATUS[id];
  return (
    <section id={id} className="scroll-mt-8 mb-14 last:mb-6">
      <header className="mb-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-[17px] font-semibold text-neutral-900 tracking-tight">{toc?.zh ?? id}</h2>
          {platformStatus ? <PlatformStatusBadge status={platformStatus} /> : null}
        </div>
        {desc ? (
          <p className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed">{desc}</p>
        ) : null}
        {(dos?.length || donts?.length) ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
            {dos?.length ? (
              <div className="rounded-[10px] border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                <div className="text-[10px] font-bold text-emerald-700 mb-1">推荐</div>
                <ul className="space-y-1">
                  {dos.map((d) => (
                    <li key={d} className="text-[11px] text-emerald-800/90 leading-snug">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {donts?.length ? (
              <div className="rounded-[10px] border border-rose-100 bg-rose-50/50 px-3 py-2">
                <div className="text-[10px] font-bold text-rose-600 mb-1">避免</div>
                <ul className="space-y-1">
                  {donts.map((d) => (
                    <li key={d} className="text-[11px] text-rose-700/90 leading-snug">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** 展台底：中性纸底，给原子/模式提供对照环境（不是业务 CARD） */
function SpecStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[13px] border border-neutral-200/90 bg-neutral-50 p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 展台内白面板：仅用于表格/色板等需要纸面对照的展品 */
function SpecPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[13px] border border-neutral-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(31,35,41,0.02)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 页面模板外框：模拟产品主内容画布 */
function PageMock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[13px] border border-neutral-200 bg-white overflow-hidden shadow-[0_2px_10px_rgba(31,35,41,0.02)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 表头 / 状态标签：中文展示（en 仅保留给调用方兼容，不渲染） */
function BiLabel({ zh, en: _en, className }: { zh: string; en: string; className?: string }) {
  return <span className={className}>{zh}</span>;
}

function StateCell({
  zh,
  en,
  children,
}: {
  zh: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[88px]">
      <div className="text-[10px] font-semibold text-neutral-400">
        <BiLabel zh={zh} en={en} />
      </div>
      {children}
    </div>
  );
}

/** 展台强制态：只模拟产品真实 hover（opacity / bg），不发明 translateY */
function ForcedBtn({
  className,
  force,
  children,
}: {
  className: string;
  force?: 'hover' | 'disabled';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={force === 'disabled'}
      tabIndex={force ? -1 : 0}
      className={cn(
        className,
        force === 'hover' && className.includes('bg-neutral-800') && 'opacity-90',
        force === 'hover' && className.includes('1565BF') && 'opacity-90',
        force === 'hover' && className.includes('bg-neutral-100') && 'bg-neutral-200',
        force === 'hover' &&
          className.includes('bg-white') &&
          className.includes('border-neutral-200') &&
          !className.includes('text-rose') &&
          'bg-neutral-50',
        force === 'hover' && className.includes('text-rose') && 'bg-rose-50',
      )}
    >
      {children}
    </button>
  );
}

/** 按钮内加载：MatrixLoader；深色底需 invert 才可见 */
function BtnLoading({
  label,
  onDark,
}: {
  label?: string;
  /** BTN_INK 等深色底 */
  onDark?: boolean;
}) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <MatrixLoader
        size={14}
        className={cn('h-3.5 w-3.5', onDark && 'brightness-0 invert')}
        title={label || '加载中'}
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export const ComponentLibraryPage: React.FC = () => {
  const { showToast } = useApp();
  const [libraryKind, setLibraryKind] = useState<LibraryKind>(() => readLibraryKind());
  const [seg, setSeg] = useState('employees');
  const [chip, setChip] = useState('24h');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [busyDemo, setBusyDemo] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [fieldDemoState, setFieldDemoState] = useState<'default' | 'focus' | 'error' | 'disabled'>(
    'default',
  );
  const [fieldDemoValue, setFieldDemoValue] = useState('售后政策库');
  const fieldDemoRef = React.useRef<HTMLInputElement>(null);
  const [activeToc, setActiveToc] = useState<NavId>(() => defaultTocId(readLibraryKind()));
  const [tocQuery, setTocQuery] = useState('');
  const [goalGhostTip, setGoalGhostTip] = useState(0);
  const [dsConfirmItems, setDsConfirmItems] = useState(DS_CONFIRM_ITEMS);
  const [dsConfirmEditingIds, setDsConfirmEditingIds] = useState<string[]>([]);
  const [dsConfirmConfirmed, setDsConfirmConfirmed] = useState(false);
  const [dsClarifyPayload, setDsClarifyPayload] = useState<SkillClarifyPayload>(DS_CLARIFY_PAYLOAD);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [permOn, setPermOn] = useState(true);
  const [tplStatus, setTplStatus] = useState<TplStatusKey>('all');
  const [tplSearch, setTplSearch] = useState('');
  const [tplQcPlans, setTplQcPlans] = useState<QcPlan[]>(TPL_QC_DEMO_PLANS);
  const [tplLayerTab, setTplLayerTab] = useState<QcAppMainTab>('plans');
  const [tplSkillTab, setTplSkillTab] = useState<(typeof TPL_SKILL_SUB_TABS)[number]['id']>('mine');
  const [tplModal, setTplModal] = useState<TplModalKind | null>(null);
  const [panelModalOpen, setPanelModalOpen] = useState(false);

  const activeTocGroups = libraryKind === 'ai' ? TOC_AI : TOC;

  const switchLibrary = (kind: LibraryKind) => {
    if (kind === libraryKind) return;
    const url = new URL(window.location.href);
    url.searchParams.set('ds', kind === 'ai' ? 'ai' : '1');
    const nextId = defaultTocId(kind);
    url.hash = nextId;
    window.history.pushState(null, '', url.toString());
    setLibraryKind(kind);
    setActiveToc(nextId);
    setTocQuery('');
  };

  useEffect(() => {
    const onPopState = () => {
      const next = readLibraryKind();
      setLibraryKind(next);
      setActiveToc(defaultTocId(next));
      setTocQuery('');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** 错库 hash（如 ?ds=1#pattern-ai-confirm）纠正到当前库首页 */
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '') as NavId;
    if (!hash) return;
    const isAiHash = AI_SECTION_IDS.has(hash);
    if (libraryKind === 'ai' ? !isAiHash : isAiHash) {
      const nextId = defaultTocId(libraryKind);
      const url = new URL(window.location.href);
      url.hash = nextId;
      window.history.replaceState(null, '', url.toString());
      setActiveToc(nextId);
    }
  }, [libraryKind]);

  const filteredToc = useMemo(() => {
    const q = tocQuery.trim().toLowerCase();
    if (!q) return activeTocGroups;
    return activeTocGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const hay =
            `${item.zh} ${item.en} ${group.groupZh} ${group.groupEn} ${item.keywords ?? ''} ${item.id}`.toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [tocQuery, activeTocGroups]);

  useEffect(() => {
    const ids = activeTocGroups.flatMap((g) => g.items.map((i) => i.id));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit?.target.id) setActiveToc(hit.target.id as NavId);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [activeTocGroups]);

  const pageItems = useMemo(() => Array.from({ length: 36 }, (_, i) => i + 1), []);

  const tplStatusLabel =
    TPL_STATUS_FILTERS.find((o) => o.key === tplStatus)?.label ?? '全部状态';
  const tplFilteredCards = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return TPL_CARDS.filter((card) => {
      if (tplStatus !== 'all' && card.status !== tplStatus) return false;
      if (!q) return true;
      return `${card.name} ${card.meta}`.toLowerCase().includes(q);
    });
  }, [tplStatus, tplSearch]);

  return (
    <LibraryKindContext.Provider value={libraryKind}>
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-800 font-sans text-xs antialiased">
      <aside className="w-[220px] shrink-0 border-r border-neutral-200 bg-white overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-neutral-200/80 space-y-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'h-7 w-7 rounded-[7px] text-white text-[11px] font-bold grid place-items-center shrink-0',
                libraryKind === 'ai'
                  ? 'bg-[linear-gradient(135deg,#000000_0%,#1565BF_100%)]'
                  : 'bg-neutral-800',
              )}
            >
              {libraryKind === 'ai' ? 'AI' : '京'}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-neutral-900 tracking-tight truncate">
                JoySupport
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {libraryKind === 'ai' ? 'AI 组件库 · ?ds=ai' : '基础组件库 · ?ds=1'}
              </p>
              <a
                href="/"
                className="inline-block mt-1 text-[10px] font-medium text-live hover:underline"
              >
                返回产品
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-[10px] bg-neutral-100">
            <button
              type="button"
              onClick={() => switchLibrary('base')}
              className={cn(
                'h-7 rounded-[8px] text-[11px] font-medium transition cursor-pointer',
                libraryKind === 'base'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              基础
            </button>
            <button
              type="button"
              onClick={() => switchLibrary('ai')}
              className={cn(
                'h-7 rounded-[8px] text-[11px] font-medium transition cursor-pointer',
                libraryKind === 'ai'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700',
              )}
            >
              AI
            </button>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={tocQuery}
              onChange={(e) => setTocQuery(e.target.value)}
              placeholder={libraryKind === 'ai' ? '搜索 AI 组件…' : '搜索…'}
              className={cn(FIELD, FIELD_CTRL, 'pl-8 text-[11px] h-7')}
            />
          </div>
        </div>
        <nav className="px-2.5 py-3 pb-12">
          {filteredToc.length === 0 ? (
            <p className="px-2.5 text-[11px] text-neutral-400">无匹配项</p>
          ) : null}
          {filteredToc.map((group) => (
            <div key={group.groupEn} className="mb-3.5">
              <div className="px-2.5 py-1 flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold text-neutral-400 tracking-wide">
                  {group.groupZh}
                </span>
              </div>
              {group.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    'relative block px-2.5 py-[6px] rounded-[10px] transition-all duration-200',
                    activeToc === item.id
                      ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-sky-100'
                      : 'hover:bg-neutral-50',
                  )}
                >
                  {activeToc === item.id ? (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-[3px] rounded-full bg-live" />
                  ) : null}
                  <span
                    className={cn(
                      'block text-[12px] leading-snug',
                      activeToc === item.id
                        ? 'font-semibold text-live'
                        : 'font-medium text-neutral-700',
                    )}
                  >
                    {item.zh}
                    {item.status ?? PLATFORM_STATUS[item.id] ? (
                      <span
                        className={cn(
                          'ml-1.5 text-[10px] font-medium',
                          activeToc === item.id ? 'text-live/70' : 'text-neutral-400',
                        )}
                      >
                        · {STATUS_META[(item.status ?? PLATFORM_STATUS[item.id])!].zh}
                      </span>
                    ) : null}
                  </span>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1040px] mx-auto px-6 sm:px-8 py-7 sm:py-9">
          <header className="mb-10 pb-7 border-b border-neutral-200/80">
            <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight leading-tight">
              {libraryKind === 'ai' ? 'JoySupport AI 组件库' : 'JoySupport 基础组件库'}
            </h1>
          </header>

        {/* ── Page templates ── */}
        <Section
          id="tpl-page-header"
          source="QcPlanBoard · OnlinePageHeader + PAGE_HEADER_INSET"
          desc="真实质检计划页头版式：PAGE_HEADER_INSET（px-5 pt-5）内 OnlinePageHeader，右侧「状态 Select + 搜索 240px + 新建」。下列为产品组件 QcPlanBoard。"
          dos={[
            '外层 PAGE_HEADER_INSET，不要手写不一致的 padding',
            '筛选 SelectContent align=start',
            '搜索 placeholder：搜索计划名称 / 修改人',
            '主 CTA：BTN_INK h-8「+ 新建质检计划」',
          ]}
          donts={['不要用 PageHeader 再叠一层大标题', '筛选条不要包进 CARD', 'Select 不要 align=end']}
        >
          <PageMock className="h-[440px] flex flex-col bg-white">
            <QcPlanBoard
              plans={tplQcPlans}
              onCreatePlan={() => setTplModal('form')}
              onViewData={(id) => showToast(`查看数据 · ${id}`, 'info')}
              onToggleRun={(id, next) => {
                setTplQcPlans((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, status: next } : p)),
                );
              }}
              onDeletePlan={(id) => {
                setTplQcPlans((prev) => prev.filter((p) => p.id !== id));
                showToast('已删除计划', 'success');
              }}
            />
          </PageMock>
        </Section>

        <Section
          id="tpl-list"
          source="KnowledgeBasePage · OnlinePageHeader + TABLE + ListPagination"
          desc="对齐产品「员工知识」列表：页头（搜索 + 新建）→ ContentBusy 扁平表（知识库 / 文档数 / 字符数 / 操作）→ 底部分页。不要再套 CARD，也不要在表前加区块头。"
          dos={[
            '标题 OnlinePageHeader（如「员工知识」）',
            'CardIcon neutral + sm + 首字；名称 semibold，hover 变 sky',
            '行内操作：重命名 / 删除图标钮（无「上传」文字链）',
            '超过 10 条再出 ListPagination（底栏 border-t）',
          ]}
          donts={['表不要包进 CARD', '不要用 soft 色块做行首', '不要再套 OnlineSectionHeader 在表上方', '不要加「更新时间」列']}
        >
          <PageMock>
            <div className="px-5 pt-5">
              <OnlinePageHeader title="员工知识">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="搜索知识库名..."
                    className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
                  />
                </div>
                <button
                  type="button"
                  className={BTN_INK}
                  onClick={() => setTplModal('form')}
                >
                  <Plus size={14} />
                  <span>新建知识库</span>
                </button>
              </OnlinePageHeader>
            </div>
            <div className="px-5 pb-5">
              <div className={onlineTableClass.wrap}>
                <table className={onlineTableClass.table}>
                  <thead>
                    <tr className={onlineTableClass.headRow}>
                      <th className={onlineTableClass.thFirst}>知识库</th>
                      <th className={onlineTableClass.th}>文档数</th>
                      <th className={onlineTableClass.th}>字符数</th>
                      <th className={onlineTableClass.thLast}>操作</th>
                    </tr>
                  </thead>
                  <tbody className={onlineTableClass.body}>
                    {TPL_LIST_ROWS.map((row) => (
                      <tr key={row.id} className={cn(onlineTableClass.row, 'cursor-pointer')}>
                        <td className={onlineTableClass.tdFirst}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CardIcon seed={row.id} size="sm" variant="neutral">
                              {row.firstChar}
                            </CardIcon>
                            <span className="font-semibold text-neutral-900 truncate hover:text-sky-700 transition-colors">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className={onlineTableClass.td}>{row.docs} 个</td>
                        <td className={cn(onlineTableClass.td, 'font-mono tabular-nums')}>
                          {row.words.toLocaleString()}
                        </td>
                        <td className={onlineTableClass.tdLast}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                              title="重命名"
                              onClick={() => showToast('演示：重命名', 'info')}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="删除知识库"
                              onClick={() => showToast('演示：删除', 'error')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-200">
                <ListPagination total={36} page={page} onPageChange={setPage} />
              </div>
            </div>
          </PageMock>
        </Section>

        <Section
          id="tpl-card"
          source="CARD + CARD_HOVER"
          desc="运营看板卡片网格：标题 + 状态徽章 + 两行元信息 + 底栏次操作。用于质检计划、任务看板等。"
          dos={['grid 1 / 2 / 3 列', '状态用 badgeClass', '主操作在页头，卡内只放次操作']}
          donts={['不要 rounded-3xl 大胶囊卡', '不要大阴影或渐变底']}
        >
          <PageMock>
            <div className="px-5 pt-5">
              <OnlinePageHeader title="质检计划">
                <Select
                  value={tplStatus}
                  onValueChange={(v) => v && setTplStatus(v as TplStatusKey)}
                >
                  <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选计划状态">
                    <SelectValue>{tplStatusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {TPL_STATUS_FILTERS.map(({ key, label }) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="relative inline-flex items-center">
                  <Search
                    size={14}
                    className="absolute left-2.5 text-neutral-400 pointer-events-none"
                  />
                  <input
                    className={cn(SEARCH_FIELD, 'pl-8 w-[240px]')}
                    type="search"
                    placeholder="搜索计划名称 / 修改人"
                    value={tplSearch}
                    onChange={(e) => setTplSearch(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={cn(BTN_INK, 'h-8 px-3.5')}
                  onClick={() => setTplModal('form')}
                >
                  + 新建质检计划
                </button>
              </OnlinePageHeader>
            </div>
            <div className="px-5 pb-5">
              {tplFilteredCards.length === 0 ? (
                <div className="min-h-[160px] flex flex-col items-center justify-center gap-2 text-neutral-500">
                  <p className="text-[13px]">暂无匹配的质检计划</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tplFilteredCards.map((card) => (
                    <article
                      key={card.id}
                      className={cn(CARD, CARD_HOVER, 'flex flex-col p-4 gap-3')}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <h3 className="flex-1 min-w-0 text-[14px] font-semibold text-neutral-900 truncate leading-snug">
                          {card.name}
                        </h3>
                        <span
                          className={cn(
                            badgeClass(
                              card.status === 'running'
                                ? 'success'
                                : card.status === 'paused'
                                  ? 'warning'
                                  : 'neutral',
                            ),
                            'shrink-0',
                          )}
                        >
                          {card.status === 'running'
                            ? '运行中'
                            : card.status === 'paused'
                              ? '已暂停'
                              : '已完成'}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500 truncate leading-relaxed">
                        {card.meta}
                      </p>
                      <p className="text-[12px] text-neutral-600 tabular-nums">{card.stats}</p>
                      <div className="mt-auto pt-1 flex items-center gap-2">
                        <button type="button" className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}>
                          查看数据
                        </button>
                        <button type="button" className={cn(BTN_OUTLINE, 'h-8 px-3 text-[12px]')}>
                          {card.status === 'running' ? '暂停' : card.status === 'paused' ? '开始' : '归档'}
                        </button>
                        <button
                          type="button"
                          className="ml-auto h-8 w-8 inline-flex items-center justify-center rounded-[7px] text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 cursor-pointer"
                          aria-label="更多"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </PageMock>
        </Section>

        <Section
          id="tpl-modals"
          source="common/Modal · common/PanelModal"
          desc="Modal：通用 CRUD；PanelModal：480px 分区壳（header / body / footer），邀请同事成功态为规范样例。"
          dos={['PanelModal footer 右对齐 flex-nowrap', '取消 BTN_SOFT + 主操作 BTN_INK', '危险操作用 BTN_DANGER']}
          donts={['PanelModal 不要 header Tab', '表单再套一层 CARD', '不要蓝主按钮']}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {(
              [
                { id: 'form' as const, zh: '表单弹窗', en: 'Modal · 新建 / 编辑', hint: 'space-y-4 字段' },
                { id: 'confirm' as const, zh: '确认弹窗', en: 'Modal · 次要确认', hint: '短说明 + 取消/确定' },
                { id: 'danger' as const, zh: '危险确认', en: 'Modal · 删除 / 辞退', hint: 'BTN_DANGER' },
                { id: 'large' as const, zh: '宽屏弹窗', en: 'Modal · 多字段', hint: 'max-w-2xl' },
                { id: 'info' as const, zh: '说明弹窗', en: 'Modal · 只读提示', hint: '单按钮关闭' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTplModal(item.id)}
                className={cn(
                  CARD,
                  CARD_HOVER,
                  'p-4 text-left cursor-pointer',
                )}
              >
                <div className="text-[13px] font-semibold text-neutral-900">{item.zh}</div>
                <div className="mt-0.5 text-[11px] text-neutral-500">{item.en}</div>
                <div className="mt-2 text-[11px] text-neutral-400">{item.hint} · 点击打开</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPanelModalOpen(true)}
              className={cn(CARD, CARD_HOVER, 'p-4 text-left cursor-pointer ring-1 ring-neutral-900/10')}
            >
              <div className="text-[13px] font-semibold text-neutral-900">窄弹窗 PanelModal</div>
              <div className="mt-0.5 text-[11px] text-neutral-500">480px · 邀请同事规范</div>
              <div className="mt-2 text-[11px] text-neutral-400">链接成功态 · 点击打开</div>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceOpen(true)}
              className={cn(CARD, CARD_HOVER, 'p-4 text-left cursor-pointer')}
            >
              <div className="text-[13px] font-semibold text-neutral-900">全屏工作台</div>
              <div className="mt-0.5 text-[11px] text-neutral-500">WorkspaceOverlay</div>
              <div className="mt-2 text-[11px] text-neutral-400">宽屏配置，不用 Modal</div>
            </button>
          </div>
          <SpecPanel className="max-w-sm">
            <div className="text-[12px] font-semibold text-neutral-900 mb-1">PanelModal 结构</div>
            <ol className="list-decimal pl-4 space-y-1 text-[12px] text-neutral-600 leading-relaxed mb-3">
              <li>遮罩 + 480px 面板（ring-1 shadow-lg，p-0 分区）</li>
              <li>header：16px 标题 + 12px 说明 + 关闭</li>
              <li>body：px-5 pb-5 内容区</li>
              <li>footer：右对齐 flex-nowrap，BTN_SOFT + BTN_INK</li>
            </ol>
            <div className="text-[11px] text-neutral-400 font-mono leading-relaxed space-y-0.5">
              <div>{'import { PanelModal, panelModalClass } from \'@/components/common/PanelModal\';'}</div>
              <div>panelModalClass.header / .body / .footer</div>
            </div>
          </SpecPanel>
        </Section>

        <Section
          id="tpl-layered-tabs"
          source="PrimaryNavRail + Navigation · QC_APP_MAIN_TABS"
          desc="对齐产品「智能质检」：左侧窄轨一级域 + 顶栏二级能力 Tab（质检计划 / 数据汇总 / 质检模板…）。激活态为渐变字 + 底部胶囊条。"
          dos={[
            '二级 Tab 用 QC_APP_MAIN_TABS / navSecondaryTabClass',
            '窄轨激活：灰底描边 + NAV_ACTIVE_GRADIENT 字色',
            '内容区按子页换 OnlinePageHeader（与 QcPlanBoard 等同构）',
          ]}
          donts={['不要用 text-live 实色代替渐变激活', '不要和下划线 Tab 再叠一层同级分段']}
        >
          <PageMock className="flex min-h-[280px]">
            <aside className="w-[56px] shrink-0 border-r border-neutral-200 bg-white p-1.5 flex flex-col items-center gap-1">
              {(
                [
                  { id: 'home', label: '数字员工', Icon: Home, active: false },
                  { id: 'online', label: '在线客服', Icon: Headphones, active: false },
                  { id: 'qc', label: '智能质检', Icon: ClipboardCheck, active: true },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'w-full flex flex-col items-center gap-1 py-2 px-1 rounded-[10px] border transition-all duration-200',
                    item.active
                      ? 'bg-[#F3F5F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-[#E4E6EA]'
                      : 'border-transparent text-neutral-500',
                  )}
                  title={item.label}
                >
                  <item.Icon
                    size={18}
                    className={item.active ? 'text-neutral-800' : undefined}
                    strokeWidth={1.75}
                  />
                  <span
                    className={cn(
                      'text-[9px] leading-none font-medium',
                      item.active ? NAV_ACTIVE_GRADIENT_TEXT : 'text-neutral-500',
                    )}
                  >
                    {item.label.slice(0, 2)}
                  </span>
                </button>
              ))}
            </aside>
            <div className="flex-1 min-w-0 flex flex-col bg-white">
              <div className="px-3 border-b border-neutral-200">
                <nav className="flex items-center gap-1 overflow-x-auto" aria-label="智能质检二级能力">
                  {TPL_LAYER_TABS.map((tab) => {
                    const active = tplLayerTab === tab.id;
                    const implemented = QC_APP_IMPLEMENTED_TABS.has(tab.id);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTplLayerTab(tab.id)}
                        className={navSecondaryTabClass(active)}
                        title={implemented ? tab.label : `${tab.label}（即将上线）`}
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
              <div className="flex-1 min-h-0 px-5 pt-5 pb-6">
                {tplLayerTab === 'plans' ? (
                  <>
                    <OnlinePageHeader title="质检计划">
                      <button type="button" className={cn(BTN_INK, 'h-8 px-3.5')}>
                        + 新建质检计划
                      </button>
                    </OnlinePageHeader>
                    <p className="text-[12px] text-neutral-500">
                      卡片列表区 · 与 QcPlanBoard 同构
                    </p>
                  </>
                ) : tplLayerTab === 'summary' ? (
                  <>
                    <OnlinePageHeader title="数据汇总">
                      <label className="relative inline-flex items-center">
                        <Search
                          size={14}
                          className="absolute left-2.5 text-neutral-400 pointer-events-none"
                        />
                        <input
                          className={cn(SEARCH_FIELD, 'pl-8 w-[200px]')}
                          type="search"
                          placeholder="搜索会话…"
                          readOnly
                        />
                      </label>
                    </OnlinePageHeader>
                    <p className="text-[12px] text-neutral-500">
                      筛选条 + 会话表 · 与 QcDataSummaryView 同构
                    </p>
                  </>
                ) : tplLayerTab === 'templates' ? (
                  <>
                    <OnlinePageHeader title="质检模板">
                      <button type="button" className={cn(BTN_INK, 'h-8 px-3.5')}>
                        + 新建模板
                      </button>
                    </OnlinePageHeader>
                    <p className="text-[12px] text-neutral-500">
                      模板卡片列表 · 与 QcTemplatesView 同构
                    </p>
                  </>
                ) : (
                  <>
                    <OnlinePageHeader
                      title={TPL_LAYER_TABS.find((t) => t.id === tplLayerTab)?.label ?? ''}
                    />
                    <p className="text-[12px] text-neutral-500">
                      即将上线占位 · 见 QC_APP_IMPLEMENTED_TABS
                    </p>
                  </>
                )}
              </div>
            </div>
          </PageMock>
        </Section>

        <Section
          id="tpl-dual-tabs"
          source="SkillPage · OnlinePageHeader + 页内子 Tab"
          desc="对齐「数字员工技能」：页头（标题 + 搜索 + 新建）下方再挂页内子 Tab（我的技能 / 技能市场）。激活为墨黑字 + 墨黑底条，不是顶栏渐变胶囊。"
          dos={[
            '页头与子 Tab 同在 shrink-0 顶区',
            '子 Tab：h-9 / 13px，底条 absolute left-3 right-3 h-0.5 bg-neutral-900',
            '市场 Tab 可隐藏「新建」',
          ]}
          donts={[
            '不要用 navSecondaryTabClass 渐变条做页内子 Tab',
            '不要把页内子 Tab 做成 Segmented 叠在页头上',
          ]}
        >
          <PageMock>
            <div className="px-5 pt-5">
              <OnlinePageHeader title="数字员工技能">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder={
                      tplSkillTab === 'market' ? '搜索技能市场...' : '搜索技能...'
                    }
                    className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
                    readOnly
                  />
                </div>
                {tplSkillTab !== 'market' ? (
                  <button type="button" className={BTN_INK}>
                    <Plus size={14} />
                    <span>新建技能</span>
                  </button>
                ) : null}
              </OnlinePageHeader>
              <nav
                className="flex items-center gap-1 mb-5 -mt-1 overflow-x-auto"
                aria-label="技能子页"
              >
                {TPL_SKILL_SUB_TABS.map((tab) => {
                  const active = tplSkillTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTplSkillTab(tab.id)}
                      className={skillPageSubTabClass(active)}
                    >
                      {tab.label}
                      {active ? (
                        <span
                          className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-neutral-900"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="px-5 pb-5">
              <p className="text-[12px] text-neutral-500">
                {tplSkillTab === 'market'
                  ? '技能市场卡片列表 · 与 SkillPage market 同构'
                  : '我的技能 / 已订阅列表 · 与 SkillPage mine 同构'}
              </p>
            </div>
          </PageMock>
        </Section>

        {/* ── Token ── */}
        <Section
          id="token-color"
          source="DongDesign 功能色 · color-tokens.md · badgeTones"
          desc="除主色外，场景用功能色（成功 / 警告 / 错误 / 信息）。标签与状态强调统一映射 FUNCTIONAL_COLORS。"
        >
          <div className="space-y-6">
            {COLOR_GROUPS.map((group) => (
              <div key={group.groupEn}>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <h3 className="text-[13px] font-semibold text-neutral-900">{group.groupZh}</h3>
                  <span className="text-[10px] text-neutral-300 tabular-nums">
                    {group.kind === 'functional' ? 4 : group.items.length}
                  </span>
                </div>
                {group.kind === 'neutral' || group.groupEn === 'Neutral scale' ? (
                  <NeutralScaleStrip items={group.items} />
                ) : group.kind === 'functional' ? (
                  <div className="space-y-3">
                    <p className="text-[12px] text-neutral-500 leading-relaxed max-w-2xl">
                      除了主颜色外，您需要在不同的场景中使用不同的场景颜色（例如，危险的颜色表示危险的操作）。
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {FUNCTIONAL_COLOR_FAMILIES.map((fam) => (
                        <FunctionalColorFamilyCard
                          key={fam.key}
                          zh={fam.zh}
                          en={fam.en}
                          palette={FUNCTIONAL_COLORS[fam.key]}
                          badgeTone={fam.badgeTone}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {TAG_TONES.map((tone) => (
                        <span key={tone} className={badgeClass(tone)}>
                          {TONE_ZH[tone]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {group.items.map((c) => (
                      <ColorSwatchCard key={c.en} swatch={c} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section id="token-type" source="Inter + PingFang SC · DESIGN.md §10" desc="全站字阶只使用下列档位；AI 气泡另有 dongDesign regular-14 字阶。">
          <SpecPanel className="p-0 overflow-hidden max-w-2xl">
            {[
              { sample: 'Banner 大标题', className: 'text-2xl font-bold text-neutral-800', meta: '24 · bold' },
              {
                sample: '页面标题',
                className: 'text-xl font-semibold text-neutral-900 tracking-tight',
                meta: '20 · semibold',
              },
              { sample: '卡片 / 弹窗标题', className: 'text-sm font-semibold text-neutral-900', meta: '14 · semibold' },
              { sample: '正文 · 分段 Tab', className: 'text-[13px] text-neutral-800', meta: '13 · regular' },
              { sample: '按钮 / 输入', className: 'text-xs font-semibold text-neutral-800', meta: '12 · semibold' },
              {
                sample: '描述与辅助说明',
                className: 'text-[11px] text-neutral-500 leading-relaxed',
                meta: '11 · #737373',
              },
              { sample: 'TAG / 分页', className: 'text-[10px] font-semibold text-neutral-500', meta: '10 · semibold' },
              {
                sample: 'AI 气泡一级标题',
                className: 'text-[18px] leading-[28px] font-semibold text-[#262626]',
                meta: '18/28 · #262626',
              },
              {
                sample: 'AI 气泡正文',
                className: 'text-[14px] leading-[22px] text-[#595959]',
                meta: '14/22 · #595959',
              },
            ].map((row) => (
              <div
                key={row.meta}
                className="flex items-baseline justify-between gap-4 px-4 sm:px-5 py-3 border-b border-neutral-100 last:border-0"
              >
                <div className={row.className}>{row.sample}</div>
                <code className="shrink-0 text-[10px] font-mono text-neutral-400">{row.meta}</code>
              </div>
            ))}
          </SpecPanel>
        </Section>

        <Section
          id="token-icon"
          source="PrimaryNavRail · SecondarySideNav · lib/icons"
        >
          <SpecStage>
            <div className="space-y-5 mb-6 pb-6 border-b border-neutral-200/70">
              <div>
                <div className="mb-2 text-[11px] font-semibold text-neutral-500">
                  一级导航（窄轨）
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {PRODUCT_PRIMARY_NAV_ICONS.map((item) => (
                    <div
                      key={`primary-${item.id}`}
                      className="flex flex-col items-center gap-2 py-3 rounded-[10px] bg-white border border-neutral-200/80"
                      title={item.label}
                    >
                      {item.markup ? (
                        <span
                          className="shrink-0 inline-flex [&_svg]:block opacity-80"
                          aria-hidden
                          dangerouslySetInnerHTML={{
                            __html: prepareNavRailSvg(item.markup, {
                              size: item.size,
                              active: false,
                            }),
                          }}
                        />
                      ) : (
                        <Icon
                          icon={item.icon}
                          width={item.size}
                          height={item.size}
                          className="shrink-0 text-neutral-800"
                          aria-hidden
                        />
                      )}
                      <span className="text-[10px] text-neutral-500 truncate max-w-full px-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold text-neutral-500">
                  二级侧栏（Solar）
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {PRODUCT_SECONDARY_NAV_ICONS.map((item) => (
                    <div
                      key={`secondary-${item.id}`}
                      className="flex flex-col items-center gap-2 py-3 rounded-[10px] bg-white border border-neutral-200/80"
                      title={`${item.label} · ${item.icon}`}
                    >
                      <Icon
                        icon={item.icon}
                        width={18}
                        height={18}
                        className="shrink-0 text-neutral-800"
                        aria-hidden
                      />
                      <span className="text-[10px] text-neutral-500 truncate max-w-full px-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {ICON_GROUPS.map((group) => (
                <div key={group.titleEn}>
                  <div className="mb-2 text-[11px] font-semibold text-neutral-500">
                    {group.titleZh}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {group.items.map(([IconCmp, name]) => (
                      <div
                        key={`${group.titleEn}-${name}`}
                        className="flex flex-col items-center gap-2 py-3 rounded-[10px] bg-white border border-neutral-200/80"
                        title={name}
                      >
                        <IconCmp size={16} className="text-neutral-800" />
                        <span className="text-[10px] text-neutral-500 truncate max-w-full px-1">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SpecStage>
        </Section>

        <Section
          id="token-space"
          source="H5=20 · V4=16 · V1=4 · h-8=32"
          desc="用真实页面片段展示间距：外壳 H5、表单栈 V4、标签→输入 V1、页脚 gap-2；不再用抽象短条。"
        >
          <SpecStage className="p-0 overflow-hidden">
            {/* 嵌套实物：外框 = H5，内部表单 = V4 / V1，页脚 = gap-2 */}
            <div className="relative bg-neutral-100/80 p-4 sm:p-6">
              <div className="pointer-events-none absolute left-4 top-3 z-[2] sm:left-6">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-neutral-700 shadow-sm border border-neutral-200/80">
                  <span className="font-mono text-live">H5</span>
                  外框内边距 20px · p-5
                </span>
              </div>

              <div className="mx-auto max-w-md rounded-[13px] border border-neutral-200 bg-white p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
                <div className="border-b border-neutral-100 pb-3 mb-4">
                  <div className="text-[14px] font-semibold text-neutral-900 leading-[22px]">
                    新建技能
                  </div>
                  <p className="mt-1 text-[12px] text-neutral-500 leading-[18px]">
                    示意：标题区与表单之间也走模块节奏
                  </p>
                </div>

                <div className="relative space-y-4">
                  <div className="pointer-events-none absolute -right-1 top-0 z-[2] translate-x-full sm:translate-x-[calc(100%+4px)] hidden md:block">
                    <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-neutral-700 shadow-sm border border-neutral-200/80">
                      <span className="font-mono text-live">V4</span>
                      16px · space-y-4
                    </span>
                  </div>

                  <div>
                    <label className={cn(LABEL, 'relative')}>
                      技能名称
                      <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-600 shadow-sm border border-neutral-200/80 lg:inline-flex">
                        <span className="font-mono text-live mr-1">V1</span>
                        4px · mb-1
                      </span>
                    </label>
                    <input
                      className={cn(FIELD, FIELD_CTRL)}
                      defaultValue="理赔资料预审"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>一句话介绍</label>
                    <input
                      className={cn(FIELD, FIELD_CTRL)}
                      defaultValue="帮用户核验理赔材料是否齐全"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>触发场景</label>
                    <input
                      className={cn(FIELD, FIELD_CTRL)}
                      defaultValue="用户咨询理赔怎么报"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
                  <span className="mr-auto hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-[10px] font-semibold text-neutral-600 border border-neutral-200/70">
                    <span className="font-mono text-live">gap-2</span>
                    8px · 取消 / 确定
                  </span>
                  <button type="button" className={BTN_OUTLINE} tabIndex={-1}>
                    取消
                  </button>
                  <button type="button" className={BTN_INK} tabIndex={-1}>
                    确定
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-neutral-500 md:hidden">
                V4 = 字段间距 16px · V1 = 标签下 4px · gap-2 = 页脚按钮 8px
              </p>
            </div>

            {/* 底部刻度：真实方块边长 = px，一眼比大小 */}
            <div className="border-t border-neutral-200/80 bg-white px-4 py-4 sm:px-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-[11px] font-semibold text-neutral-500">间距刻度（方块边长 = px）</div>
                <div className="text-[11px] text-neutral-400">
                  控件高度 <code className="font-mono text-neutral-600">h-8 = 32</code>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-5">
                {(
                  [
                    { token: 'V1', px: 4, note: '标签→输入' },
                    { token: 'gap-2', px: 8, note: '页脚按钮' },
                    { token: 'gap-3', px: 12, note: '卡片流' },
                    { token: 'V4', px: 16, note: '表单栈' },
                    { token: 'H5', px: 20, note: '页面外壳' },
                    { token: 'h-8', px: 32, note: '控件高度' },
                  ] as const
                ).map((item) => (
                  <div key={item.token} className="flex flex-col items-center gap-2">
                    <div
                      className="rounded-[4px] bg-neutral-800"
                      style={{ width: item.px, height: item.px }}
                      title={`${item.token} · ${item.px}px`}
                    />
                    <div className="text-center">
                      <div className="font-mono text-[11px] font-semibold text-neutral-800">
                        {item.token}
                      </div>
                      <div className="text-[10px] tabular-nums text-neutral-500">{item.px}px</div>
                      <div className="text-[10px] text-neutral-400">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="token-radius"
          source="控件 7 · 卡片/弹窗 13 · 头像 20"
          desc="表单字段只有 7px 控件圆角，禁止再套 13px CARD。"
        >
          <SpecStage className="flex flex-wrap gap-4 items-end">
            <div className="h-8 w-16 border border-neutral-200 rounded bg-white grid place-items-center text-neutral-500">
              4 标签
            </div>
            <div className="h-8 w-20 border border-neutral-200 rounded-[7px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight text-[11px]">7 控件</span>
            </div>
            <div className="h-10 w-24 border border-neutral-200 rounded-[10px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight text-[11px]">10 主操作</span>
            </div>
            <div className="h-16 w-28 border border-neutral-200 rounded-[13px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight text-[11px]">13 卡片</span>
            </div>
            <div className="h-[66px] w-[66px] rounded-[20px] border-[1.5px] border-[rgba(198,210,255,0.6)] bg-[#F8FAFC] grid place-items-center text-neutral-500">
              <span className="text-center leading-tight text-[11px]">20 头像</span>
            </div>
          </SpecStage>
        </Section>

        <Section id="token-shadow" source="CARD · MODAL · Toast" desc="同尺寸同圆角同底色，仅阴影不同。">
          <SpecStage className="flex flex-wrap gap-4">
            {(
              [
                {
                  label: '卡片静态',
                  shadow: 'shadow-[0_2px_10px_rgba(31,35,41,0.02)]',
                  note: 'CARD',
                },
                {
                  label: '卡片悬停',
                  shadow: 'shadow-[0_4px_12px_rgba(31,35,41,0.08)]',
                  note: 'CARD_HOVER',
                },
                {
                  label: '弹窗',
                  shadow: 'shadow-lg',
                  note: 'MODAL_PANEL',
                },
                {
                  label: '轻提示',
                  shadow: 'shadow-[0_10px_30px_rgba(0,0,0,0.15)]',
                  note: 'Toast',
                },
              ] as const
            ).map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-36 h-20 rounded-[13px] bg-white grid place-items-center text-neutral-500',
                    item.shadow,
                  )}
                >
                  <span className="text-center leading-tight text-[12px]">{item.label}</span>
                </div>
                <code className="text-[10px] font-mono text-neutral-400">{item.note}</code>
              </div>
            ))}
          </SpecStage>
        </Section>

        <Section id="token-border" source="#E5E5E5 /60 · ring">
          <SpecStage className="flex flex-wrap gap-3">
            <div className="w-32 h-16 border border-neutral-200 rounded-[13px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight">卡片</span>
            </div>
            <div className="w-32 h-16 border border-neutral-200/60 rounded-[7px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight">字段</span>
            </div>
            <div className="w-32 h-16 ring-1 ring-foreground/10 rounded-[13px] bg-white grid place-items-center text-neutral-500">
              <span className="text-center leading-tight">聚焦环</span>
            </div>
            <div className="w-40 h-16 border-b border-neutral-200/60 bg-white grid place-items-center text-neutral-500 rounded-t-[10px]">
              <span className="text-center leading-tight">页头分割线</span>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="token-motion"
          source="duration-200"
          desc="悬停下列卡片 / 按钮验证 200ms（产品真实 transition）。"
        >
          <SpecStage className="flex flex-wrap gap-3 items-center">
            <div className={cn(CARD, CARD_HOVER, 'w-40 h-20 grid place-items-center')}>
              <span className="text-center leading-tight text-neutral-600">卡片抬起</span>
            </div>
            <button type="button" className={BTN_INK}>
              主按钮透明度
            </button>
            <button type="button" className={BTN_OUTLINE}>
              OUTLINE 浅底
            </button>
          </SpecStage>
        </Section>

        {/* ── Atom ── */}
        <Section
          id="atom-button"
          source="主按钮 / 次级 / 描边 / 危险 / 小号 / AI色 · 加载=禁用+圆环"
          desc="默认 h-8；小号 *_SM 为 h-6 / 11px，用于对话卡内 CTA（如确认执行）。悬停态按源码模拟。AI 色为黑→#1565BF 渐变。"
          dos={[
            '主操作：主按钮（墨黑）',
            '取消：次级或描边',
            '危险操作：危险按钮',
            '对话卡内 CTA：小号（BTN_*_SM / SKILL_AOP_PRIMARY_BTN_SM）',
            'AI 创作/发送：AI 色按钮（BTN_AI）',
            '加载中必须禁用，用圆环加载动画',
          ]}
          donts={[
            '业务主 CTA 不要用蓝色实心（用墨黑）',
            '不要自造圆角/高度（保持 h-8 / 7px；小号 h-6；AI 发送为 36×36）',
            '不要用 CSS border 圆环替代加载组件',
          ]}
        >
          <SpecPanel className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-400">
                  <th className="py-2.5 px-4 font-semibold"><BiLabel zh="变体" en="Variant" /></th>
                  <th className="py-2.5 px-2 font-semibold text-center"><BiLabel zh="默认" en="Default" /></th>
                  <th className="py-2.5 px-2 font-semibold text-center"><BiLabel zh="悬停" en="Hover" /></th>
                  <th className="py-2.5 px-2 font-semibold text-center"><BiLabel zh="禁用" en="Disabled" /></th>
                  <th className="py-2.5 px-2 font-semibold text-center"><BiLabel zh="加载" en="Loading" /></th>
                  <th className="py-2.5 px-2 font-semibold text-center"><BiLabel zh="可点" en="Live" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(
                  [
                    ['主按钮', 'BTN_INK', BTN_INK, '确定', true, false],
                    ['次级按钮', 'BTN_SOFT', BTN_SOFT, '取消', false, false],
                    ['描边按钮', 'BTN_OUTLINE', BTN_OUTLINE, '培训', false, false],
                    ['危险按钮', 'BTN_DANGER', BTN_DANGER, '删除', false, false],
                    ['主按钮 · 小号', 'BTN_INK_SM', BTN_INK_SM, '确定', true, false],
                    ['次级 · 小号', 'BTN_SOFT_SM', BTN_SOFT_SM, '取消', false, false],
                    ['描边 · 小号', 'BTN_OUTLINE_SM', BTN_OUTLINE_SM, '培训', false, false],
                    ['危险 · 小号', 'BTN_DANGER_SM', BTN_DANGER_SM, '删除', false, false],
                    ['AI 主 CTA · 小号', 'SKILL_AOP_PRIMARY_BTN_SM', SKILL_AOP_PRIMARY_BTN_SM, '确认执行', true, false],
                    ['AI 发送', 'BTN_AI', BTN_AI, null, true, true],
                    ['AI 文案', 'BTN_AI_TEXT', BTN_AI_TEXT, '开始创作', true, false],
                  ] as const
                ).map(([zh, token, cls, label, onDark, isIcon]) => (
                  <tr key={token} className="hover:bg-neutral-50/60">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[13px] font-semibold text-neutral-800">{zh}</div>
                      <code className="mt-0.5 block font-mono text-[10px] font-medium text-neutral-400">
                        {token}
                      </code>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls}>
                        {isIcon ? <ArrowUp size={18} /> : label}
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="hover">
                        {isIcon ? <ArrowUp size={18} /> : label}
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="disabled">
                        {isIcon ? <ArrowUp size={18} /> : label}
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="disabled">
                        <BtnLoading onDark={onDark} />
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button type="button" className={cls} aria-label={zh}>
                        {isIcon ? <ArrowUp size={18} /> : label}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SpecPanel>

          <div className="mt-4">
            <p className="text-[11px] font-semibold text-neutral-500 mb-2">
              加载配方 · 禁用 + 加载动画
            </p>
            <SpecStage className="flex flex-wrap items-center gap-3">
              <button type="button" className={BTN_INK} disabled>
                <BtnLoading onDark label="提交中…" />
              </button>
              <button type="button" className={BTN_SOFT} disabled>
                <BtnLoading label="保存中…" />
              </button>
              <button type="button" className={BTN_OUTLINE} disabled>
                <BtnLoading />
              </button>
              <button
                type="button"
                className={BTN_INK}
                disabled={btnLoading}
                onClick={() => {
                  setBtnLoading(true);
                  window.setTimeout(() => {
                    setBtnLoading(false);
                    showToast('已提交', 'success');
                  }, 1600);
                }}
              >
                {btnLoading ? <BtnLoading onDark label="提交中…" /> : '点我试加载'}
              </button>
            </SpecStage>
            <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed max-w-2xl">
              主按钮深色底对加载圈加{' '}
              <code className="px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px]">
                brightness-0 invert
              </code>
              或传 <code className="px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px]">onDark</code>
              ；浅色底保持默认。与知识库调试、AB 仿真等业务按钮一致。
            </p>
          </div>
        </Section>

        <Section
          id="atom-field"
          source="FIELD · LABEL · 无 CARD 壳"
          desc="LABEL + FIELD 上下排布。切换状态查看真实交互；聚焦请点选「聚焦」或直接点输入框。"
          dos={['Label→输入 4px（LABEL）', '表单项间距 space-y-4', '错误用 destructive 描边 + 文案']}
          donts={['禁止 rounded-[13px] 卡片包裹整块表单', '不要用蓝色 focus ring', '不要用静态假聚焦替代真实 :focus']}
        >
          <div className="mb-4 px-3.5 py-2.5 rounded-[10px] bg-neutral-100/80 border-l-[3px] border-neutral-800 text-neutral-600 max-w-xl text-[12px] leading-relaxed">
            硬规则：禁止用 rounded-[13px] 卡片包裹整块表单。
          </div>

          <SpecStage className="max-w-lg bg-white">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'default', label: '默认' },
                  { id: 'focus', label: '聚焦' },
                  { id: 'error', label: '错误' },
                  { id: 'disabled', label: '禁用' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFieldDemoState(opt.id);
                    if (opt.id === 'focus') {
                      requestAnimationFrame(() => fieldDemoRef.current?.focus());
                    } else {
                      fieldDemoRef.current?.blur();
                    }
                  }}
                  className={cn(
                    'h-7 px-2.5 rounded-[7px] text-[12px] font-medium transition cursor-pointer',
                    fieldDemoState === opt.id
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="max-w-md">
              <label className={LABEL}>
                知识库名称 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fieldDemoRef}
                  className={cn(
                    FIELD,
                    FIELD_CTRL,
                    fieldDemoState === 'error' && 'border-destructive ring-2 ring-destructive/20',
                  )}
                  placeholder="请输入知识库名称"
                  value={fieldDemoState === 'disabled' ? '不可编辑' : fieldDemoValue}
                  disabled={fieldDemoState === 'disabled'}
                  readOnly={fieldDemoState === 'error'}
                  onChange={(e) => setFieldDemoValue(e.target.value)}
                  onFocus={() => {
                    if (fieldDemoState !== 'error' && fieldDemoState !== 'disabled') {
                      setFieldDemoState('focus');
                    }
                  }}
                  onBlur={() => {
                    if (fieldDemoState === 'focus') setFieldDemoState('default');
                  }}
                />
              </div>
              {fieldDemoState === 'error' ? (
                <p className="text-[10px] text-destructive mt-1">请填写知识库名称</p>
              ) : (
                <p className="text-[10px] text-neutral-400 mt-1.5">
                  {fieldDemoState === 'focus'
                    ? '当前为真实 :focus（ring-ring/30），非静态描边'
                    : fieldDemoState === 'disabled'
                      ? 'disabled 态：opacity-50，不可编辑'
                      : '点输入框或上方「聚焦」查看焦点环'}
                </p>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-100 max-w-md">
              <label className={LABEL}>搜索</label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="按工号或姓名查找…" />
              </div>
            </div>
          </SpecStage>

          <div className="mt-4 max-w-md">
            <p className="text-[11px] font-semibold text-rose-600 mb-2">
              反例 · 不要这样
            </p>
            <div className={cn(CARD, 'p-4 space-y-3 opacity-55 pointer-events-none')}>
              <div>
                <label className={LABEL}>名称</label>
                <input className={cn(FIELD, FIELD_CTRL)} disabled placeholder="套了 CARD 的表单" />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="atom-tag"
          source="badgeClass · DongDesign 功能色"
          desc="对齐 DongDesign 功能色：Success #00B26F · Warning #F08433 · Error #F33B50 · Info #376BFA。语义：成功=开箱即用 · 警告=定制 · 信息=AI/休息 · 危险=异常。"
          dos={['状态语义全站固定', '用 badgeClass(tone)', '底浅色 + 字功能色本体，无描边']}
          donts={['不要把标签当主按钮', '不要自造紫色/靛蓝色标签', '不要加 border / ring']}
        >
          <SpecStage>
            <div className="flex flex-wrap gap-2 mb-5">
              {TAG_TONES.map((tone) => (
                <span key={tone} className={badgeClass(tone)}>
                  {TONE_ZH[tone]}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto pt-4 border-t border-neutral-200/70">
              <table className="w-full min-w-[520px] text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-neutral-400">
                    <th className="py-2 pr-3 font-semibold">
                      <BiLabel zh="色调" en="Tone" />
                    </th>
                    <th className="py-2 px-2 font-semibold text-center">
                      <BiLabel zh="默认" en="Default" />
                    </th>
                    <th className="py-2 px-2 font-semibold text-center">
                      <BiLabel zh="弱化" en="Muted" />
                    </th>
                    <th className="py-2 pl-2 font-semibold text-center">
                      <BiLabel zh="带图标" en="With icon" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(['success', 'warning', 'live', 'danger', 'neutral', 'ink'] as BadgeTone[]).map(
                    (tone) => (
                      <tr key={tone}>
                        <td className="py-3 pr-3 text-[11px] font-semibold">
                          {TONE_ZH[tone]}
                          <code className="ml-1.5 font-mono text-[10px] font-medium text-neutral-400">
                            {tone}
                          </code>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={badgeClass(tone)}>{TONE_ZH[tone]}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn(badgeClass(tone), 'opacity-60')}>{TONE_ZH[tone]}</span>
                        </td>
                        <td className="py-3 pl-2 text-center">
                          <span className={badgeClass(tone)}>
                            <Check size={10} /> {TONE_ZH[tone]}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="atom-chip"
          source="CHIP / CHIP_ACTIVE"
          desc="时间/快捷筛选；选中态 Info 功能色底+字，无描边。"
          dos={['用于互斥快捷筛选', '选中用 Info 浅底，无描边', '用 CHIP / CHIP_ACTIVE']}
          donts={['不要替代主 CTA', '不要做成全圆大胶囊堆', '不要加 border / ring']}
        >
          <SpecStage>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: '24h', label: '近 24 小时' },
                { id: '7d', label: '近 7 天' },
                { id: '30d', label: '近 30 天' },
                { id: 'custom', label: '自定义' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChip(c.id)}
                  className={chip === c.id ? CHIP_ACTIVE : CHIP}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-neutral-200/70">
              <StateCell zh="选中" en="Selected">
                <span className={CHIP_ACTIVE}>近 24 小时</span>
              </StateCell>
              <StateCell zh="默认" en="Default">
                <span className={CHIP}>近 7 天</span>
              </StateCell>
              <StateCell zh="悬停" en="Hover">
                <span className={cn(CHIP, 'text-neutral-800 bg-neutral-50')}>近 30 天</span>
              </StateCell>
              <StateCell zh="禁用" en="Disabled">
                <span className={cn(CHIP, 'opacity-40 pointer-events-none')}>自定义</span>
              </StateCell>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="atom-tooltip"
          source="AppTooltip · DongDesign jd-tooltip"
          desc="对齐 DongDesign Tooltip：dark / light、十二方位、small、click / hover。"
          dos={['提示文案简短', '用 AppTooltip 而非手写绝对定位', '优先 hover，点击场景再开 trigger=click']}
          donts={['不要把复杂表单塞进 Tooltip', '不要遮挡主操作', '不要自造第二套浮层色']}
        >
          <SpecStage>
            <TooltipProvider delay={200}>
              <div className="space-y-10 overflow-x-auto">
                <TooltipPlacementDemo effect="dark" />
                <TooltipPlacementDemo effect="light" />
              </div>
            </TooltipProvider>
          </SpecStage>
        </Section>

        {/* ── Feedback ── */}
        <Section id="feedback-toast" source="showAppToast · Sonner · 1.6s" desc="点击触发真实 Toast（非静态壳）。">
          <SpecStage className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN_INK}
              onClick={() => showToast('已创建知识库', 'success')}
            >
              成功 success
            </button>
            <button
              type="button"
              className={BTN_OUTLINE}
              onClick={() => showToast('保存失败，请稍后重试', 'error')}
            >
              错误 error
            </button>
            <button
              type="button"
              className={BTN_SOFT}
              onClick={() => showToast('母版有可用升级', 'warning')}
            >
              警告 warning
            </button>
            <button
              type="button"
              className={BTN_OUTLINE}
              onClick={() => showToast('已复制分享链接', 'info')}
            >
              信息 info
            </button>
          </SpecStage>
        </Section>

        <Section id="feedback-busy" source="ContentBusy · LoadingCircle">
          <div className="flex flex-wrap gap-3 mb-3">
            <button type="button" className={BTN_SOFT} onClick={() => setBusyDemo((v) => !v)}>
              {busyDemo ? '关闭加载' : '打开加载'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={cn(PANEL, 'p-4 flex flex-col items-center gap-2')}>
              <MatrixLoader size={16} />
              <span className="text-neutral-500">行内 LoadingCircle 16</span>
            </div>
            <div className={cn(PANEL, 'min-h-[120px]')}>
              <ContentBusy busy={busyDemo} size="slot" label="加载中">
                <div className="p-4 text-neutral-500">插槽内容 Slot</div>
              </ContentBusy>
            </div>
            <div className={cn(PANEL, 'min-h-[120px]')}>
              <ContentBusy busy={busyDemo} size="panel">
                <div className="p-4 text-neutral-500">面板内容 Panel</div>
              </ContentBusy>
            </div>
          </div>
        </Section>

        <Section
          id="feedback-empty"
          source="首页空态 · OnlineEmptyRow · 无结果"
          desc="三种空态不可混用：插画引导、表格空行、搜索无结果。"
          dos={['首页无数据用插画+主 CTA', '表格无数据用 OnlineEmptyRow']}
          donts={['不要在表格里放大插画', '无搜索结果不要假装“系统错误”']}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SpecPanel className="flex flex-col items-center py-10 text-center">
              <img
                src={RELAY_HOME_ASSETS.employeesEmpty}
                alt=""
                className="w-[120px] h-[90px] object-contain mb-3"
              />
              <div className="text-[15px] font-semibold text-neutral-900">还没有数字员工</div>
              <div className="text-[12px] text-neutral-500 mt-1">去市场雇佣一位</div>
              <button type="button" className={cn(BTN_INK, 'mt-3')}>
                去雇佣
              </button>
              <span className="mt-3 text-[10px] text-neutral-400">首页插画空态 Home Empty</span>
            </SpecPanel>
            <SpecPanel className="p-0 overflow-hidden">
              <table className={onlineTableClass.table}>
                <thead>
                  <tr className={onlineTableClass.headRow}>
                    <th className={onlineTableClass.thFirst}>名称 Name</th>
                    <th className={onlineTableClass.thLast}>状态 Status</th>
                  </tr>
                </thead>
                <tbody>
                  <OnlineEmptyRow colSpan={2}>暂无数据 No data</OnlineEmptyRow>
                </tbody>
              </table>
              <div className="px-3 py-2 text-[10px] text-neutral-400 border-t border-neutral-100">
                表格空行 Table Empty
              </div>
            </SpecPanel>
            <SpecPanel className="flex flex-col items-center justify-center py-10 text-center">
              <Search size={20} className="text-neutral-300 mb-2" />
              <div className="text-[13px] font-semibold text-neutral-800">无匹配结果</div>
              <div className="text-[11px] text-neutral-500 mt-1 px-4">
                试试调整关键词或清空筛选
              </div>
              <span className="mt-3 text-[10px] text-neutral-400">搜索无结果 No Results</span>
            </SpecPanel>
          </div>
        </Section>

        <Section id="feedback-status" source="在线点 · badge · 角标">
          <div className="flex flex-wrap gap-5 items-center">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00B26F] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
              在线
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-neutral-500 border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
              离线
            </span>
            <span className={badgeClass('success')}>已上岗</span>
            <span className={badgeClass('neutral')}>待上岗</span>
            <span className={badgeClass('live')}>解析中</span>
            <span className="relative inline-flex">
              <button type="button" className={cn(BTN_OUTLINE, 'w-[75px]')}>
                培训
              </button>
              <span className="absolute -top-[3px] -right-[3px] w-[9px] h-[9px] rounded-full bg-amber-400 border-[1.5px] border-white" />
            </span>
          </div>
        </Section>

        {/* ── Navigation ── */}
        <Section
          id="atom-underline"
          source="Navigation.tsx · hybrid 默认"
          desc="默认布局：PrimaryNavRail + 顶栏 Tab（非 QcAppMainTabs，后者已无引用）。"
          dos={['二级能力在顶栏横排', '激活态渐变字 + 底部胶囊条（navSecondaryTabClass）']}
          donts={['不要引用已废弃的顶栏组件', '双侧导航模式下顶栏由侧栏承担']}
        >
          <SpecPanel className="p-0 overflow-hidden max-w-2xl">
            <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/80 text-[10px] text-neutral-500">
              示意 · 真实逻辑见 <code className="font-mono">Navigation.tsx</code>
            </div>
            <div className="flex border-b border-neutral-200 px-1 overflow-x-auto">
              {['我的数字员工', '数字员工市场', '接待记录', '员工知识'].map((label, i) => {
                const active = i === 0;
                return (
                  <button
                    key={label}
                    type="button"
                    className={navSecondaryTabClass(active)}
                  >
                    {label}
                    {active ? (
                      <span className={NAV_SECONDARY_TAB_INDICATOR} aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </SpecPanel>
        </Section>

        <Section
          id="atom-segmented"
          source="SegmentedTabBar · 38px"
          desc="页内一级切换（员工页 / 技能页 / 任务中心 / 上岗配置等）。"
          dos={['用于同级 2–5 个视图切换', '总高 38px / 选中片 30px']}
          donts={['不要和下划线 Tabs 混用在同一层级', '选项过多时改用侧栏或顶栏 Tab']}
        >
          <SpecStage>
            <SegmentedTabBar
              value={seg}
              onChange={setSeg}
              items={[
                { id: 'employees', label: '我的数字员工' },
                { id: 'market', label: '数字员工市场' },
                { id: 'office', label: '办公室' },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-6 pt-4 border-t border-neutral-200/70">
              <StateCell zh="选中" en="Selected">
                <button type="button" className={segmentedItemClass(true)}>
                  选中
                </button>
              </StateCell>
              <StateCell zh="默认" en="Default">
                <button type="button" className={segmentedItemClass(false)}>
                  默认
                </button>
              </StateCell>
              <StateCell zh="悬停" en="Hover">
                <button
                  type="button"
                  className={cn(segmentedItemClass(false), 'text-neutral-950')}
                  tabIndex={-1}
                >
                  悬停
                </button>
              </StateCell>
              <StateCell zh="禁用" en="Disabled">
                <button type="button" className={segmentedItemClass(false)} disabled>
                  禁用
                </button>
              </StateCell>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="pattern-dual-nav"
          source="PrimaryNavRail + SecondarySideNav"
          desc="VersionSwitcher 选「双侧导航」时启用；下列为真实组件（非示意）。默认 hybrid 仍走顶栏二级导航。"
          dos={['A/B 对比测试用', '一级域在窄轨，二级在侧栏', '展台可直接点选切换']}
          donts={['不要当作默认权威方案', '不要与顶栏 Navigation 同时全开']}
        >
          <div className="h-[440px] rounded-[13px] border border-neutral-200 overflow-hidden bg-neutral-50 shadow-[0_2px_10px_rgba(31,35,41,0.02)]">
            <div className="flex h-full min-h-0">
              <PrimaryNavRail showRightBorder overflowToMore={false} />
              <SecondarySideNav />
              <div className="flex-1 min-w-0 min-h-0 bg-white rounded-tl-2xl flex flex-col">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-[12px] font-semibold text-neutral-800">内容区占位</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    左侧为真实 PrimaryNavRail + SecondarySideNav，与产品双侧布局同构。
                  </p>
                </div>
                <div className="flex-1 p-4 text-[12px] text-neutral-400">
                  切换一级域后，二级侧栏会跟真实产品一样换菜单。
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="pattern-header"
          source="common/PageHeader"
          desc="仅仪表盘、角色权限 2 页使用；列表域普遍用工具栏，标题由顶栏导航承担。"
          dos={['仪表盘 / 设置类页可用', '带图标 + 说明 + 右侧操作']}
          donts={['在线列表页不要重复大标题', '不要替代顶栏二级 Tab']}
        >
          <PageHeader title="我的数字员工" description="管理已雇佣的数字员工，培训技能并派发任务。">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="按工号或姓名查找…" />
            </div>
            <button type="button" className={BTN_INK}>
              新建员工
            </button>
          </PageHeader>
        </Section>

        <Section
          id="legacy-wide-nav"
          source="遗留宽侧栏示意"
          desc="232px 宽侧栏方案已废弃。现行默认混合布局，可选双侧导航。"
          donts={['新页面禁止采用', '勿复制此结构']}
        >
          <div className="mb-2 inline-flex items-center gap-1.5">
            <span className={badgeClass('warning')}>遗留 Legacy</span>
            <span className="text-neutral-500 text-[11px]">
              宽侧栏结构仅作展台示意，请勿引用
            </span>
          </div>
          <div className="w-[232px] bg-neutral-50 border border-neutral-200 rounded-[13px] p-3 opacity-70">
            <div className="text-[13px] font-bold mb-2">京小灵</div>
            <div className="h-[38px] rounded-xl bg-[rgb(243,245,248)] border border-[#E4E6EA] grid place-items-center mb-2">
              雇佣数字员工
            </div>
            <div className="h-[38px] rounded-lg bg-[rgb(235,237,241)] px-2 flex items-center font-semibold">
              数字员工
            </div>
          </div>
        </Section>

        {/* ── Pattern ── */}
        <Section
          id="pattern-online"
          source="OnlinePageLayout · KnowledgeBasePage"
          desc="在线域列表壳：OnlinePageHeader（标题 + 搜索 + 新建）+ 扁平 TABLE；列：知识库 / 文档数 / 字符数 / 操作。区块头仅用于表下详情区，不要压在表上方。"
        >
          <OnlinePageHeader title="员工知识">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
                placeholder="搜索知识库名..."
              />
            </div>
            <button type="button" className={BTN_INK} onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              <span>新建知识库</span>
            </button>
          </OnlinePageHeader>
          <div className={onlineTableClass.wrap}>
            <table className={onlineTableClass.table}>
              <thead>
                <tr className={onlineTableClass.headRow}>
                  <th className={onlineTableClass.thFirst}>知识库</th>
                  <th className={onlineTableClass.th}>文档数</th>
                  <th className={onlineTableClass.th}>字符数</th>
                  <th className={onlineTableClass.thLast}>操作</th>
                </tr>
              </thead>
              <tbody className={onlineTableClass.body}>
                {TPL_LIST_ROWS.slice(0, 2).map((row) => (
                  <tr key={row.id} className={cn(onlineTableClass.row, 'cursor-pointer')}>
                    <td className={onlineTableClass.tdFirst}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CardIcon seed={row.id} size="sm" variant="neutral">
                          {row.firstChar}
                        </CardIcon>
                        <span className="font-semibold text-neutral-900 truncate hover:text-sky-700 transition-colors">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className={onlineTableClass.td}>{row.docs} 个</td>
                    <td className={cn(onlineTableClass.td, 'font-mono tabular-nums')}>
                      {row.words.toLocaleString()}
                    </td>
                    <td className={onlineTableClass.tdLast}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                          title="重命名"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="pattern-banner"
          source="EmployeeHomeRelay 内联 · 非独立组件"
          desc="员工首页轮播 Banner 写在 EmployeeHomeRelay 内，无共享 Banner 组件。母版升级请用 MasterTemplateUpgradeBanner。"
          donts={['不要抽成通用 Banner 组件', '不要把升级提示与营销轮播混为一谈']}
        >
          <div className="relative h-[182px] rounded-[13px] overflow-hidden border border-neutral-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.01)] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center px-[26px] max-w-xl">
            <div className="ml-3">
              <div className="text-2xl font-bold text-neutral-800 mb-2">雇佣新员工上手向导</div>
              <div className="text-xs text-neutral-800/60 mb-5">
                一键带你雇人、配技能、试岗，几步就能让数字员工上岗。
              </div>
              <button
                type="button"
                className="w-[150px] h-10 bg-neutral-800 text-white text-sm rounded-[10px] hover:opacity-90 transition cursor-pointer"
              >
                立即雇佣开始
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            升级类提示见下方“母版升级提示 MasterTemplateUpgradeBanner”。
          </p>
        </Section>

        <Section
          id="pattern-card-icon"
          source="common/CardIcon · KnowledgeBasePage"
          desc="列表行首彩色圆角方块；颜色由 seed 稳定派生（ai / neutral 除外）。产品默认：size=sm + variant=neutral + 首字，与「员工知识」行首同构。"
          dos={[
            '知识列表用 neutral + sm + 首字',
            '同一对象固定传同一 seed（neutral 时仅作 key 习惯）',
            '仅底色+字色，无描边',
          ]}
          donts={[
            '不要手写渐变方块替代 CardIcon',
            '不要给列表行首用 soft / ring',
            '技能卡图标走 SkillListIcon 中性灰底，不混用 CardIcon',
          ]}
        >
          <SpecStage>
            <p className="text-[11px] font-semibold text-neutral-500 mb-2.5">产品 · 知识列表行首</p>
            <div className="space-y-2 mb-5 max-w-md">
              {[
                { id: 'kb-售后', name: '售后政策库', char: '售' },
                { id: 'kb-催收', name: '催收话术库', char: '催' },
                { id: 'kb-质检', name: '质检标准库', char: '质' },
              ].map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-neutral-200/80 bg-white"
                >
                  <CardIcon seed={row.id} size="sm" variant="neutral">
                    {row.char}
                  </CardIcon>
                  <span className="font-semibold text-neutral-900 text-[13px] truncate hover:text-sky-700 transition-colors">
                    {row.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-200/70 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-neutral-500 mb-2.5">尺寸</p>
                <div className="flex flex-wrap gap-3 items-end">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                    <div key={size} className="flex flex-col items-center gap-1.5">
                      <CardIcon seed={`size-${size}`} size={size} variant="neutral">
                        知
                      </CardIcon>
                      <code className="text-[10px] font-mono text-neutral-400">{size}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-500 mb-2.5">变体</p>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col items-center gap-1.5">
                    <CardIcon seed="var-neutral" size="md" variant="neutral">
                      知
                    </CardIcon>
                    <code className="text-[10px] font-mono text-neutral-400">neutral</code>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <CardIcon seed="var-soft" size="md" variant="soft">
                      知
                    </CardIcon>
                    <code className="text-[10px] font-mono text-neutral-400">soft</code>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <CardIcon seed="var-solid" size="md" variant="solid">
                      知
                    </CardIcon>
                    <code className="text-[10px] font-mono text-neutral-400">solid</code>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <CardIcon seed="var-ai" size="md" variant="ai">
                      AI
                    </CardIcon>
                    <code className="text-[10px] font-mono text-neutral-400">ai</code>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <CardIcon seed="var-icon" size="lg" variant="soft">
                      <Cpu size={22} className="text-neutral-800/80" />
                    </CardIcon>
                    <code className="text-[10px] font-mono text-neutral-400">soft + icon</code>
                  </div>
                </div>
              </div>
            </div>
          </SpecStage>
        </Section>

        <Section id="pattern-employee" source="EmployeeCardRelay">
          <SpecStage>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
              <EmployeeCardRelay
                name="京京-售后专家"
                desc="擅长退换货政策解读与安抚话术，覆盖售后全链路。"
                avatar="客"
                avatarFallback="客"
                isOnline
                createMethod="ai"
                jobFamilyLabel="在线客服"
                primaryActionLabel="培训"
                onPrimaryAction={() => showToast('打开培训', 'info')}
                onDispatchTask={() => showToast('派发任务', 'success')}
                onMoreClick={() => undefined}
              />
              <EmployeeCardRelay
                name="灵灵-催收专员"
                desc="合规催收话术与分期方案推荐，降低投诉风险。"
                avatar="催"
                avatarFallback="催"
                isOnline={false}
                createMethod="manual"
                jobFamilyLabel="电话催收"
                primaryActionLabel="培训"
                onPrimaryAction={() => showToast('打开培训', 'info')}
                showGoOnlineButton
                onGoOnline={() => showToast('上岗', 'success')}
                onMoreClick={() => undefined}
              />
              <EmployeeCardRelay
                name="流程编排客服"
                desc="按画布节点处理咨询分流与澄清追问。"
                avatar="流"
                avatarFallback="流"
                isOnline
                createMethod="workflow"
                jobFamilyLabel="在线客服"
                primaryActionLabel="培训"
                onPrimaryAction={() => showToast('打开培训', 'info')}
                onDispatchTask={() => showToast('派出渠道', 'success')}
                dispatchActionLabel="派出渠道"
                onMoreClick={() => undefined}
              />
            </div>
          </SpecStage>
        </Section>

        <Section id="pattern-market" source="MarketCardRelay">
          <SpecStage>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
              <MarketCardRelay
                name="金牌客服助手"
                desc="预置售后 / 物流 / 发票知识，雇佣即可上岗。"
                avatarEmoji="客"
                category="ready"
                jobFamilyLabel="客服"
                isHiredAlready={false}
                onHire={() => showToast('已雇佣', 'success')}
              />
              <MarketCardRelay
                name="催收质检官"
                desc="按业务线定制质检规则与违规话术拦截。"
                avatarEmoji="质"
                category="custom"
                jobFamilyLabel="质检"
                isHiredAlready={false}
                onHire={() => undefined}
                onCustomRequest={() => showToast('已提交定制', 'info')}
              />
            </div>
          </SpecStage>
        </Section>

        <Section id="pattern-modal" source="common/Modal · common/PanelModal">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BTN_INK} onClick={() => setModalOpen(true)}>
              打开 Modal（表单）
            </button>
            <button type="button" className={BTN_SOFT} onClick={() => setPanelModalOpen(true)}>
              打开 PanelModal（窄弹窗）
            </button>
          </div>
          <p className="mt-2 text-neutral-500">Modal 通用 CRUD；PanelModal 480px 分区壳，见 tpl-modals。</p>
        </Section>

        <Section
          id="pattern-table"
          source="ListPagination（真实控件）"
          desc="行 hover 浅底；分页为“上一页 · 当前/总页 · 下一页”。"
          dos={['超过 10 条再出分页', '状态列用 badgeClass']}
          donts={['不要做成 1 2 3 页码条（非本产品）', '行内不要堆过多按钮']}
        >
          <div className={cn(PANEL, 'overflow-hidden')}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] text-neutral-400 border-b border-neutral-100">
                  <th className="px-4 py-2.5 font-semibold">
                    <BiLabel zh="员工" en="Employee" />
                  </th>
                  <th className="px-4 py-2.5 font-semibold">
                    <BiLabel zh="业务域" en="Domain" />
                  </th>
                  <th className="px-4 py-2.5 font-semibold">
                    <BiLabel zh="状态" en="Status" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.slice((page - 1) * 10, page * 10).map((n) => (
                  <tr key={n} className="hover:bg-neutral-50/80 transition duration-150">
                    <td className="px-4 py-2.5 text-[11px] text-neutral-700">示例员工 {n}</td>
                    <td className="px-4 py-2.5 text-[11px] text-neutral-700">客服</td>
                    <td className="px-4 py-2.5">
                      <span className={badgeClass(n % 3 === 0 ? 'neutral' : 'success')}>
                        {n % 3 === 0 ? '离线' : '在岗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-neutral-100">
              <div className="flex flex-wrap gap-4 mb-3 text-[10px] text-neutral-400 font-semibold">
                <span>行默认</span>
                <span>行悬停 = bg-neutral-50/80</span>
              </div>
              <ListPagination total={36} page={page} onPageChange={setPage} />
            </div>
          </div>
        </Section>

        <Section
          id="pattern-exec-fold"
          source="common/ExecutionProcessFold"
          desc="对话气泡内“处理过程”折叠；员工管理、客户体验页在用。"
          dos={['running 时默认展开 + LoadingCircle', 'done 后显示步数 + CheckCircle']}
          donts={['不要用灰色 pulse 替代圆环加载']}
        >
          <SpecStage className="max-w-md">
            <ExecutionProcessFold
              steps={DS_EXEC_STEPS}
              status="done"
              userQuery="用户咨询退换货政策"
              runId="run_ds_demo"
              onCopyRunId={() => showToast('已复制 runId', 'info')}
            />
          </SpecStage>
        </Section>

        <Section
          id="pattern-split-pane"
          source="common/ResizableSplitPane"
          desc="员工管理页左右分栏 + 拖拽分隔条；支持 localStorage 持久化宽度。"
          dos={['左侧列表 / 右侧详情', '设置 minLeftPx / minRightPx']}
          donts={['不要用于简单单列页']}
        >
          <SpecStage className="p-0 overflow-hidden h-[200px]">
            <ResizableSplitPane
              className="h-full"
              defaultRatio={0.42}
              minLeftPx={160}
              minRightPx={160}
              left={
                <div className="h-full p-3 bg-neutral-50 border-r border-neutral-200 text-[11px] text-neutral-600">
                  左侧列表区
                </div>
              }
              right={
                <div className="h-full p-3 text-[11px] text-neutral-600">右侧详情区</div>
              }
            />
          </SpecStage>
        </Section>

        <Section
          id="pattern-upgrade-banner"
          source="onboarding/MasterTemplateUpgradeBanner"
          desc="上岗配置页：母版能力变更升级提示（与员工首页营销轮播不同）。"
          dos={['可折叠 release notes', '同步前二次确认 Modal']}
          donts={['不要与员工首页轮播混用']}
        >
          <div className="max-w-xl">
            <MasterTemplateUpgradeBanner
              upgrade={DS_TEMPLATE_UPGRADE}
              onSync={() => showToast('已同步母版', 'success')}
              onDismiss={() => showToast('已忽略本次升级', 'info')}
            />
          </div>
        </Section>

        <Section
          id="pattern-goal-composer"
          source="GoalComposerGhost · skill-ai-composer · PlatformHomePage"
          desc="dongDesign-AI Sender：Agent Builder 与技能落地页创作输入。Ghost 打字机 + Tab 补全；发送钮用 SKILL_AOP_SEND_BTN / NAV_ACTIVE_GRADIENT_BG。"
          dos={['芯片只填入输入框，不直接跳转', '发送后进入创建流程并带入文案', '复用 SKILL_AOP_* 色系']}
          donts={['不要平行造第二套创作输入壳', '禁止直角引号「」']}
        >
          <SpecStage className="max-w-[640px] space-y-3">
            <div
              className={cn(
                'relative flex flex-col gap-0 rounded-[16px] border border-white/90 bg-white/92 p-[13px]',
                'shadow-[0_4px_24px_rgba(21,101,191,0.06),0_1px_0_rgba(255,255,255,0.8)_inset]',
              )}
            >
              <div className="relative min-h-[80px]">
                <GoalComposerGhost
                  labels={DS_GOAL_CHIPS}
                  tipIndex={goalGhostTip}
                  onTipIndexChange={setGoalGhostTip}
                  onAcceptTab={() => showToast('已 Tab 补全示例文案', 'info')}
                  variant="skill"
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 px-1">
                <span className="text-[12px] text-neutral-400">索引知识</span>
                <button
                  type="button"
                  className={SKILL_AOP_SEND_BTN}
                  title="发送"
                  onClick={() => showToast('演示：进入技能创建流程', 'success')}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {DS_GOAL_CHIPS.map((label) => (
                <button key={label} type="button" className={CHIP}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 text-center">
              渐变发送：
              <span className={cn('ml-1 font-semibold', NAV_ACTIVE_GRADIENT_TEXT)}>
                NAV_ACTIVE_GRADIENT
              </span>
            </p>
          </SpecStage>
        </Section>

        <Section
          id="pattern-ai-bubble"
          source="DESIGN.md §10 · ai-product-dongdesign.mdc"
          desc="dongDesign-AI Bubble 字阶：仅用于 AI 对话气泡正文排版；全站暖灰墨黑底盘不变。"
          dos={['正文 14/22 #595959', '一/二/三级标题按表', '用户气泡可用 SKILL_AOP_TINT']}
          donts={['不要用页面标题字阶套气泡', '不要引入第二套 CSS 变量前缀']}
        >
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
            <SpecStage className="space-y-2">
              <div className="text-[10px] font-semibold text-neutral-400 mb-1">AI 气泡</div>
              <div className="rounded-2xl bg-neutral-100 px-3.5 py-3 space-y-2">
                <p className="text-[18px] leading-[28px] font-semibold text-[#262626]">一级标题</p>
                <p className="text-[16px] leading-[24px] font-semibold text-[#262626]">二级标题</p>
                <p className="text-[14px] leading-[22px] font-semibold text-[#1c1d1f]">三级标题</p>
                <p className="text-[14px] leading-[22px] text-[#595959]">
                  正文 regular-14：草案要点已同步到右侧配置区。
                </p>
                <p className="text-[14px] leading-[22px] text-[#8c8c8c]">次要说明 / 系统引导</p>
              </div>
            </SpecStage>
            <SpecStage className="space-y-2">
              <div className="text-[10px] font-semibold text-neutral-400 mb-1">用户气泡</div>
              <div
                className={cn(
                  'ml-auto max-w-[88%] px-3 py-3 text-[14px] leading-[22px] text-[#181D27]',
                  'rounded-[20px_4px_20px_20px] border',
                  SKILL_AOP_TINT_BG,
                  SKILL_AOP_TINT_BORDER,
                )}
              >
                帮我做一个“延保进度查询”技能
              </div>
            </SpecStage>
          </div>
        </Section>

        <Section
          id="pattern-ai-thinking"
          source="skills/SkillThinkingCard · jd-think"
          desc="dongDesign-AI Cot / 思考：加载扫光 → 生成中正文打字机 + 标题随段落切换 → 完成「已完成思考 · Ns」。与任务规划卡分离。"
          dos={['生成中打字机露出正文', '标题随段落摘要切换', '完成态「已完成思考 · Ns」']}
          donts={['不要用本卡做任务 Step 列表', '不要用 Collect 卡替代 Cot', '不要混用“深度思考/思考过程”等多套叫法']}
        >
          <SpecStage className="max-w-[720px] space-y-3">
            <SkillThinkingCard
              title="思考中"
              steps={[
                {
                  id: 'd0',
                  label: '先总结用户想做成的能力',
                  detail: '把场景边界、触发条件与产出格式想清楚。',
                  status: 'pending',
                  children: [
                    { id: 'd0-a', label: '已读取用户目标表述', kind: 'read' },
                    { id: 'd0-b', label: '已对齐技能创建规范边界', kind: 'run' },
                  ],
                },
                {
                  id: 'd1',
                  label: '再看写入四张表单前还缺什么',
                  detail: '优先看触发边界是否要收紧。',
                  status: 'pending',
                  children: [
                    { id: 'd1-a', label: '已扫描四张表单必填缺口', kind: 'run' },
                  ],
                },
                {
                  id: 'd2',
                  label: '思路收束',
                  detail: '先澄清关键信息，再进入任务规划。',
                  status: 'pending',
                  children: [
                    { id: 'd2-a', label: '已整理待澄清关键问题', kind: 'run' },
                    { id: 'd2-b', label: '准备进入任务规划生成可点选卡片', kind: 'note' },
                  ],
                },
              ]}
              isComplete={false}
              generating
            />
            <SkillThinkingCard
              title="已完成思考"
              steps={[
                {
                  id: 'd1',
                  label: '先总结用户想做成的能力',
                  detail:
                    '用户要配一项可复用的客服技能。需要把场景边界、触发条件与产出格式想清楚，再落到可确认草案。',
                  status: 'done',
                  children: [
                    { id: 'c1', label: '已读取用户目标表述', kind: 'read' },
                    { id: 'c2', label: '已对齐 `SKILL.md` 规范边界', kind: 'run' },
                  ],
                },
                {
                  id: 'd2',
                  label: '思路收束',
                  detail:
                    '先澄清关键信息，再生成规格与下一步建议；想清楚后进入任务规划，而不是直接写死表单。',
                  status: 'done',
                  children: [
                    { id: 'c3', label: '已整理待澄清关键问题', kind: 'run' },
                    { id: 'c4', label: '准备进入任务规划生成可点选卡片', kind: 'note' },
                  ],
                },
              ]}
              durationSec={3}
              isComplete
              defaultExpanded
            />
          </SpecStage>
        </Section>

        <Section
          id="pattern-ai-task-plan"
          source="skills/SkillTaskPlanCard"
          desc="任务规划卡：进行中仅扫光「任务规划中」；完成「已完成任务规划 · Ns」。出现在思考之后。"
          dos={['与思考分卡展示', '进行中仅扫光', '完成可展开 Step']}
          donts={['不要用思考段落代替 Step', '不要一上来就任务规划（先 Collect / 思考）']}
        >
          <SpecStage className="max-w-[720px] space-y-3">
            <SkillTaskPlanCard
              title="任务规划"
              steps={DS_THINK_STEPS}
              isComplete={false}
              generating={false}
              mode="executing"
            />
            <SkillTaskPlanCard
              title="任务规划"
              steps={DS_THINK_STEPS.map((s) => ({ ...s, status: 'done' as const }))}
              durationSec={3}
              isComplete
              defaultExpanded={false}
            />
          </SpecStage>
        </Section>

        <Section
          id="pattern-ai-collect"
          source="skills/SkillCollectCard"
          desc="dongDesign-AI Collect：先「搜索和分析资料中」加载态，再进入深度思考与任务规划。完成/停止自动收起。"
          dos={['三态文案固定', '正文扫光仅 searching 末行', '内容区 max-h 300']}
          donts={['不要一上来就任务规划', '不要用灰色 pulse 代替圆环']}
        >
          <SpecStage className="max-w-xl space-y-3">
            <SkillCollectCard
              status="searching"
              nodes={[
                {
                  id: 'c1',
                  kind: 'search',
                  text: '梳理本轮技能目标与可用上下文',
                  queries: ['延保进度查询', '触发条件'],
                },
                {
                  id: 'c2',
                  kind: 'read',
                  text: '阅读并归纳可写入草案的关键信息',
                  statusPill: '已阅读相关资料',
                },
              ]}
            />
            <SkillCollectCard
              status="done"
              summaryLabel="3篇资料"
              defaultOpen={false}
              nodes={[
                {
                  id: 'd1',
                  kind: 'done',
                  text: '已搜集和分析资料',
                },
              ]}
            />
          </SpecStage>
        </Section>

        <Section
          id="pattern-ai-clarify"
          source="skills/SkillClarifyCard · SKILL_CREATE_CHAT · buildSkillClarifyQuestions"
          desc="技能创建首轮「补充信息」卡：多题单选、可添加自定义项；提交或跳过后折叠。文案走 SKILL_CREATE_CHAT（补充信息 / 已提交 / 已跳过）。"
          dos={[
            '标题用「补充信息」',
            '主按钮「提交」用 SKILL_AOP_PRIMARY_BTN',
            '「跳过」用 BTN_SOFT',
            '必填题未选齐时提交禁用',
          ]}
          donts={['不要与确认信息卡混用', '跳过不要做成危险色']}
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-[960px]">
            <SpecStage className="max-w-none">
              <p className="mb-2 text-[11px] text-neutral-500">
                待填写 · 引导语：「{SKILL_CREATE_CHAT.clarifyLead}」
              </p>
              <SkillClarifyCard
                payload={dsClarifyPayload}
                onChange={setDsClarifyPayload}
                onSubmit={(next) => {
                  setDsClarifyPayload(next);
                  showToast('演示：已提交补充信息', 'success');
                }}
                onSkip={() => {
                  setDsClarifyPayload({
                    ...dsClarifyPayload,
                    skipped: true,
                    submitted: false,
                    collapsed: true,
                  });
                  showToast('演示：已跳过补充信息', 'info');
                }}
              />
              {dsClarifyPayload.submitted || dsClarifyPayload.skipped ? (
                <button
                  type="button"
                  className={cn(BTN_SOFT, 'mt-2 h-7 px-3 text-[13px]')}
                  onClick={() => setDsClarifyPayload(DS_CLARIFY_PAYLOAD)}
                >
                  重置为待填写
                </button>
              ) : null}
            </SpecStage>
            <SpecStage className="max-w-none">
              <p className="mb-2 text-[11px] text-neutral-500">已提交 · 默认折叠可展开回看</p>
              <SkillClarifyCard
                payload={DS_CLARIFY_SUBMITTED}
                onChange={() => undefined}
                onSubmit={() => undefined}
                onSkip={() => undefined}
              />
            </SpecStage>
          </div>
        </Section>

        <Section
          id="pattern-ai-confirm"
          source="skills/SkillRoundConfirmCard · confirmStatusBadgeClass · SKILL_CREATE_CHAT"
          desc="技能创建对话「确认信息」卡：要点勾选 / 原位编辑 / 批量编辑改写 / 确认执行。卡内 CTA 用小号：主=SKILL_AOP_PRIMARY_BTN_SM，次级=BTN_SOFT_SM，危险=BTN_DANGER_SM（h-6 / 11px）。"
          dos={[
            '标题用「确认信息」，完成角标「已确认」',
            '主按钮「确认执行」用 SKILL_AOP_PRIMARY_BTN_SM',
            '「批量编辑」用 BTN_SOFT_SM；删除用 BTN_DANGER_SM',
            '角标用 confirmStatusBadgeClass，不用 badgeClass',
          ]}
          donts={[
            '主按钮不要用 BTN_INK 纯黑替代渐变 PRIMARY',
            '不要用 badgeClass 代替确认角标',
            '员工孵化不要再挂确认卡（规划后直接写入）',
          ]}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={confirmStatusBadgeClass('pending')}>待确认</span>
            <span className={confirmStatusBadgeClass('confirmedSoft')}>已确认</span>
            <span className={confirmStatusBadgeClass('confirmed')}>已确认</span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-[960px]">
            <SpecStage className="max-w-none">
              <p className="mb-2 text-[11px] text-neutral-500">待确认 · 可点「确认执行 / 批量编辑」</p>
              <SkillRoundConfirmCard
                title="请确认本轮变更要点"
                items={dsConfirmItems}
                confirmed={dsConfirmConfirmed}
                editingItemIds={dsConfirmEditingIds}
                onConfirm={(items) => {
                  setDsConfirmItems(items);
                  setDsConfirmConfirmed(true);
                  setDsConfirmEditingIds([]);
                  showToast('演示：已确认要点', 'success');
                }}
                onEditItem={(item) => {
                  setDsConfirmEditingIds((prev) =>
                    prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                  );
                }}
                onBatchModeChange={(active) => {
                  if (!active) setDsConfirmEditingIds([]);
                }}
                onItemsChange={setDsConfirmItems}
                onDelete={() => {
                  setDsConfirmItems(DS_CONFIRM_ITEMS);
                  setDsConfirmConfirmed(false);
                  setDsConfirmEditingIds([]);
                  showToast('演示：已重置确认卡', 'info');
                }}
              />
              {dsConfirmConfirmed ? (
                <button
                  type="button"
                  className={cn(BTN_SOFT, 'mt-2 h-7 px-3 text-[13px]')}
                  onClick={() => {
                    setDsConfirmItems(DS_CONFIRM_ITEMS);
                    setDsConfirmConfirmed(false);
                    setDsConfirmEditingIds([]);
                  }}
                >
                  重置为待确认
                </button>
              ) : null}
            </SpecStage>
            <SpecStage className="max-w-none">
              <p className="mb-2 text-[11px] text-neutral-500">已确认 · 默认折叠可展开回看</p>
              <SkillRoundConfirmCard
                title="请确认本轮变更要点"
                items={DS_CONFIRM_ITEMS_CONFIRMED}
                confirmed
                collapsed
                onConfirm={() => undefined}
              />
            </SpecStage>
          </div>
        </Section>

        <Section
          id="pattern-hover-menu"
          source="common/HoverActionMenu · OnboardingWorkspacePanels"
          desc="仅上岗配置面板 1 处；悬停展开轻量菜单。"
          dos={['选项少（2–5）', '带简短 description']}
          donts={['复杂操作请用 Modal / Overlay']}
        >
          <SpecStage>
            <HoverActionMenu
              trigger={<button type="button" className={BTN_OUTLINE}>更多操作</button>}
              items={[
                {
                  id: 'rename',
                  label: '重命名',
                  description: '修改展示名称',
                  onSelect: () => showToast('重命名', 'info'),
                },
                {
                  id: 'archive',
                  label: '归档',
                  description: '移出常用列表',
                  onSelect: () => showToast('已归档', 'success'),
                },
                {
                  id: 'delete',
                  label: '删除',
                  description: '不可恢复',
                  onSelect: () => showToast('已删除', 'error'),
                },
              ]}
            />
            <p className="mt-3 text-[11px] text-neutral-500">将鼠标移到按钮上展开菜单。</p>
          </SpecStage>
        </Section>

        <Section
          id="pattern-workspace"
          source="common/WorkspaceOverlay · KnowledgeBaseWorkspaceModal"
          desc="仅知识库全屏工作台 1 处；Esc 关闭。"
          dos={['宽屏多 Tab / 复杂配置', '内容区自带关闭入口']}
          donts={['简单表单请用 Modal，不要上 Overlay']}
        >
          <SpecStage>
            <button type="button" className={BTN_INK} onClick={() => setWorkspaceOpen(true)}>
              打开工作台 Overlay
            </button>
          </SpecStage>
        </Section>

        <Section
          id="pattern-skeleton"
          source="LoadingSkeletons · 线上在用子集"
          desc="未就绪区块用 LoadingCircle / 骨架；已就绪不显示。DocumentRowSkeleton / UploadZoneSkeleton / CardListSkeleton 全站无引用。"
          dos={['对话用 ChatReplySkeleton', '工作日志用 WorkLogSkeleton', '上传用 UploadLoadingPanel']}
          donts={[
            '不要用灰色脉冲块替代 LoadingCircle',
            '勿使用 DocumentRow / UploadZone / CardList 骨架（未接入）',
          ]}
        >
          <SpecStage className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className={cn(PANEL, 'p-4')}>
              <ChatReplySkeleton />
              <p className="mt-2 text-[10px] text-neutral-400">对话骨架 · 员工页</p>
            </div>
            <div className={cn(PANEL, 'p-4')}>
              <WorkLogSkeleton rows={2} className="py-2" />
              <p className="mt-2 text-[10px] text-neutral-400">工作日志骨架 · 员工页</p>
            </div>
            <div className={cn(PANEL, 'p-4 text-center')}>
              <UploadLoadingPanel title="正在上传并创建知识库…" fileName="policy.pdf" />
              <p className="mt-2 text-[10px] text-neutral-400">上传加载 · 上岗</p>
            </div>
          </SpecStage>
        </Section>

        <Section
          id="recipe-crud"
          source="OnlinePageToolbar + Modal + FIELD"
          desc="列表域标准 CRUD：Toolbar 放搜索 + 主 CTA，弹窗内平铺表单。PageHeader 仅 Dashboard / 角色权限。"
          dos={['主 CTA 在 OnlinePageToolbar（BTN_INK）', 'footer：SOFT 取消 + INK 确定']}
          donts={['表单再套一层 CARD', '列表页不要用 PageHeader 重复标题']}
        >
          <ol className="list-decimal pl-4 space-y-1.5 text-neutral-600 max-w-xl text-[12px] leading-relaxed">
            <li>列表页用 OnlinePageToolbar 放搜索 + 主 CTA（BTN_INK）。</li>
            <li>点击打开 Modal；标题 + space-y-4 表单 + footer。</li>
            <li>校验失败：FIELD 错误描边 + text-destructive；成功：showToast success。</li>
            <li>
              PageHeader 仅用于 Dashboard / 角色权限等非列表页。
            </li>
            <li>
              <button type="button" className={cn(BTN_INK, 'mt-1')} onClick={() => setModalOpen(true)}>
                试运行：打开创建弹窗
              </button>
            </li>
          </ol>
        </Section>

        <Section
          id="recipe-list"
          source="KnowledgeBasePage 配方"
          desc="对齐产品列表：OnlinePageHeader（标题 + 搜索 + 新建）→ 扁平表（知识库 / 文档数 / 操作）→ 底部分页。区块头留给表下详情区，不要压在表上方。"
          dos={['页头右对齐工具', '行首 CardIcon neutral', '行内：重命名 / 删除图标']}
          donts={['不要再放大 PageHeader', '不要用 soft 行首', '表上方不要 OnlineSectionHeader', '不要加上传文字链 / 更新时间列']}
        >
          <SpecPanel>
            <OnlinePageHeader title="员工知识">
              <div className="relative w-full sm:w-64 shrink-0">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')} placeholder="搜索知识库名..." />
              </div>
              <button type="button" className={BTN_INK} onClick={() => setModalOpen(true)}>
                <Plus size={14} />
                <span>新建知识库</span>
              </button>
            </OnlinePageHeader>
            <table className={onlineTableClass.table}>
              <thead>
                <tr className={onlineTableClass.headRow}>
                  <th className={onlineTableClass.thFirst}>知识库</th>
                  <th className={onlineTableClass.th}>文档数</th>
                  <th className={onlineTableClass.thLast}>操作</th>
                </tr>
              </thead>
              <tbody className={onlineTableClass.body}>
                <tr className={cn(onlineTableClass.row, 'cursor-pointer')}>
                  <td className={onlineTableClass.tdFirst}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CardIcon seed="demo" size="sm" variant="neutral">
                        示
                      </CardIcon>
                      <span className="font-semibold text-neutral-900 truncate hover:text-sky-700 transition-colors">
                        示例知识库
                      </span>
                    </div>
                  </td>
                  <td className={onlineTableClass.td}>3 个</td>
                  <td className={onlineTableClass.tdLast}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                        title="重命名"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="删除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </SpecPanel>
        </Section>

        <Section
          id="recipe-employee-bar"
          source="培训 / 上岗 / 派发 / 更多"
          desc="按在岗状态切换按钮组合；通知角标仅在有待办时出现。"
          dos={['在线：培训 + 派发/休息 + 更多', '离线：培训 + 上岗 + 更多']}
          donts={['不要一次放三个同权主按钮']}
        >
          <SpecStage>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <EmployeeCardRelay
                name="在岗组合"
                desc="培训 + 派发任务 + 更多"
                avatar="在"
                isOnline
                primaryActionLabel="培训"
                onPrimaryAction={() => undefined}
                onDispatchTask={() => showToast('派发', 'success')}
                onMoreClick={() => undefined}
              />
              <EmployeeCardRelay
                name="离线组合"
                desc="培训 + 上岗 + 更多（含通知点）"
                avatar="离"
                isOnline={false}
                primaryActionLabel="培训"
                onPrimaryAction={() => undefined}
                showGoOnlineButton
                onGoOnline={() => showToast('上岗', 'success')}
                onMoreClick={() => undefined}
                hasTrainNotice
              />
            </div>
          </SpecStage>
        </Section>

        <Section
          id="recipe-filter"
          source="SEARCH + Select + Chip"
          desc="页头筛选平铺，不套卡片。"
          dos={['搜索 + 下拉 + 时间 Chip 可组合', '查询可用 BTN_INK']}
          donts={['筛选条不要包进 CARD']}
        >
          <SpecStage className="bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="搜索会话…" />
              </div>
              <select className={cn(FIELD, FIELD_CTRL, 'w-auto min-w-[7.5rem]')}>
                <option>全部业务域</option>
                <option>客服</option>
              </select>
              <button type="button" className={CHIP_ACTIVE}>
                近 24 小时
              </button>
              <button type="button" className={BTN_INK}>
                查询
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <label className={LABEL}>权限开关（角色页示意）</label>
              <button
                type="button"
                onClick={() => setPermOn((v) => !v)}
                className={cn(
                  'h-8 px-3 rounded-[7px] border text-[12px] font-semibold transition cursor-pointer',
                  permOn
                    ? 'border-neutral-800/30 bg-neutral-800/5 text-neutral-900'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
                )}
              >
                {permOn ? '已开启 · 质检查看' : '已关闭 · 质检查看'}
              </button>
            </div>
          </SpecStage>
        </Section>

        <footer className="pt-7 pb-4 border-t border-neutral-200/80 text-[11px] text-neutral-400">
          JoySupport · 京小灵 · 真相源{' '}
          <code className="text-neutral-500">lib/ui.ts</code> ·{' '}
          <code className="text-neutral-500">src/components/common/*</code>
        </footer>
        </div>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="创建知识库"
        maxWidth="max-w-md"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setModalOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className={BTN_INK}
              disabled={!formName.trim()}
              onClick={() => {
                showToast(`已创建“${formName.trim()}”`, 'success');
                setModalOpen(false);
                setFormName('');
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={LABEL}>
              知识库名称 <span className="text-rose-500">*</span>
            </label>
            <input
              className={cn(FIELD, FIELD_CTRL)}
              value={formName}
              maxLength={30}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入知识库名称"
            />
          </div>
          <div>
            <label className={LABEL}>描述</label>
            <textarea
              className={cn(FIELD, 'min-h-[72px] resize-none')}
              placeholder="补充说明（选填）"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={tplModal === 'form'}
        onClose={() => setTplModal(null)}
        title="新建质检计划"
        description="填写名称与范围后即可创建，稍后可在卡片上开始运行。"
        maxWidth="max-w-md"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setTplModal(null)}>
              取消
            </button>
            <button type="button" className={BTN_INK} onClick={() => setTplModal(null)}>
              确定
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={LABEL}>
              计划名称 <span className="text-rose-500">*</span>
            </label>
            <input className={cn(FIELD, FIELD_CTRL)} placeholder="例如：本平台客服会话 · 日常抽检" />
          </div>
          <div>
            <label className={LABEL}>质检范围</label>
            <select className={cn(FIELD, FIELD_CTRL)}>
              <option>本平台客服会话</option>
              <option>外部导入会话</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={tplModal === 'confirm'}
        onClose={() => setTplModal(null)}
        title="暂停该计划？"
        description="暂停后不再抽检新会话，已检数据保留。可随时重新开始。"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setTplModal(null)}>
              取消
            </button>
            <button type="button" className={BTN_INK} onClick={() => setTplModal(null)}>
              确定暂停
            </button>
          </>
        }
      >
        {null}
      </Modal>

      <Modal
        open={tplModal === 'danger'}
        onClose={() => setTplModal(null)}
        title="删除质检计划"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setTplModal(null)}>
              取消
            </button>
            <button type="button" className={BTN_DANGER} onClick={() => setTplModal(null)}>
              删除
            </button>
          </>
        }
      >
        <p className="text-[12px] text-neutral-600">
          确认删除“本平台客服会话 · 日常抽检”？
        </p>
      </Modal>

      <Modal
        open={tplModal === 'large'}
        onClose={() => setTplModal(null)}
        title="编辑质检计划"
        description="宽屏用于多字段或对照预览，结构仍与小弹窗一致。"
        maxWidth="max-w-2xl"
        footer={
          <>
            <button type="button" className={BTN_SOFT} onClick={() => setTplModal(null)}>
              取消
            </button>
            <button type="button" className={BTN_INK} onClick={() => setTplModal(null)}>
              保存
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>计划名称</label>
            <input className={cn(FIELD, FIELD_CTRL)} defaultValue="本平台客服会话 · 日常抽检" />
          </div>
          <div>
            <label className={LABEL}>负责人</label>
            <input className={cn(FIELD, FIELD_CTRL)} defaultValue="李敏" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>说明</label>
            <textarea
              className={cn(FIELD, 'min-h-[80px] resize-none py-2')}
              placeholder="选填"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={tplModal === 'info'}
        onClose={() => setTplModal(null)}
        title="如何派发质检任务"
        description="先雇佣质检数字员工并上岗，再新建计划；创建后默认暂停，点「开始」才会抽检。"
        footer={
          <button type="button" className={BTN_INK} onClick={() => setTplModal(null)}>
            知道了
          </button>
        }
      >
        {null}
      </Modal>

      <PanelModal
        open={panelModalOpen}
        onClose={() => setPanelModalOpen(false)}
        title="邀请同事"
        description="链接已生成，复制后发送给同事，审批通过后即可加入"
        footer={
          <>
            <button
              type="button"
              className={cn(BTN_SOFT, 'shrink-0 whitespace-nowrap')}
              onClick={() => showToast('再建一条（展台演示）', 'info')}
            >
              再建一条
            </button>
            <button
              type="button"
              className={cn(BTN_INK, 'shrink-0 whitespace-nowrap h-8')}
              onClick={() => showToast('邀请链接已复制', 'success')}
            >
              <Copy size={14} />
              复制邀请链接
            </button>
          </>
        }
      >
        <div className="relative rounded-[7px] border border-neutral-200 bg-neutral-50 pl-3 pr-10 py-3">
          <p className="font-mono text-[11px] font-medium text-neutral-900 leading-relaxed break-all">
            https://jingxiaoling.jd.com/invite/join?t=demo-panel-modal
          </p>
          <button
            type="button"
            title="复制链接"
            onClick={() => showToast('邀请链接已复制', 'success')}
            className="absolute right-1 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-white/80 cursor-pointer"
          >
            <Copy size={14} />
          </button>
        </div>
      </PanelModal>

      <WorkspaceOverlay
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        ariaLabel="组件库工作台示例"
      >
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900">知识库工作台（示例）</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">WorkspaceOverlay · Esc 或点遮罩关闭</p>
          </div>
          <div className="flex-1 p-5 overflow-y-auto text-[12px] text-neutral-600 leading-relaxed">
            这里放置宽屏配置、多 Tab、文档列表等内容。简单表单请继续用 Modal。
          </div>
        </div>
      </WorkspaceOverlay>
    </div>
    </LibraryKindContext.Provider>
  );
};
