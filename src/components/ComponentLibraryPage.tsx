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
import {
  BTN_DANGER,
  BTN_INK,
  BTN_OUTLINE,
  BTN_SOFT,
  CARD,
  CARD_HOVER,
  FIELD,
  FIELD_CTRL,
  LABEL,
  PANEL,
  SEARCH_FIELD,
  SELECT_TRIGGER,
  badgeClass,
  NAV_SECONDARY_TAB_INDICATOR,
  NAV_SECONDARY_SUBTAB_INDICATOR,
  navSecondaryTabClass,
  navSecondarySubTabClass,
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
  BarChart3,
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
  Lightbulb,
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
  Settings,
  Settings2,
  Share2,
  Shield,
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
import { useApp } from '../context/AppContext';
import { PageHeader } from './common/PageHeader';
import { Modal } from './common/Modal';
import { PanelModal } from './common/PanelModal';
import { SegmentedTabBar } from './common/SegmentedTabs';
import { ListPagination } from './common/ListPagination';
import { ContentBusy } from './common/ContentBusy';
import { MatrixLoader } from './common/MatrixLoader';
import { CardIcon } from './common/CardIcon';
import {
  OnlinePageHeader,
  OnlinePageToolbar,
  OnlineSectionHeader,
  onlineTableClass,
  OnlineEmptyRow,
} from './common/OnlinePageLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeCardRelay } from './employees/relay/EmployeeCardRelay';
import { MarketCardRelay } from './employees/relay/MarketCardRelay';
import { PromptComposer } from './common/PromptComposer';
import { HoverActionMenu } from './common/HoverActionMenu';
import { WorkspaceOverlay } from './common/WorkspaceOverlay';
import {
  ChatReplySkeleton,
  WorkLogSkeleton,
  ParsingStatusCell,
  UploadLoadingPanel,
} from './common/LoadingSkeletons';
import { ResizableSplitPane } from './common/ResizableSplitPane';
import { ExecutionProcessFold } from './common/ExecutionProcessFold';
import { MasterTemplateUpgradeBanner } from './onboarding/MasterTemplateUpgradeBanner';
import type { ThoughtStep } from '../types';
import type { PendingTemplateUpgrade } from '@/lib/masterTemplateUpgrade';

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
  | 'pattern-composer'
  | 'pattern-hover-menu'
  | 'pattern-workspace'
  | 'pattern-skeleton'
  | 'pattern-exec-fold'
  | 'pattern-split-pane'
  | 'pattern-upgrade-banner'
  | 'index'
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
  'pattern-composer': 'single',
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
    message: '检索知识库「售后政策」',
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

const DS_TEMPLATE_UPGRADE: PendingTemplateUpgrade = {
  version: '2.4.0',
  releaseNotes: '优化情绪识别\n新增订单查询接口',
  marketName: '标准客服母版',
};

type TocGroup = { groupZh: string; groupEn: string; items: TocItem[] };

const TOC: TocGroup[] = [
  {
    groupZh: '概览',
    groupEn: 'Overview',
    items: [
      { id: 'index', zh: '常量索引', en: 'Constant Index', keywords: 'BTN FIELD INDEX 索引' },
    ],
  },
  {
    groupZh: '页面模板',
    groupEn: 'Templates',
    items: [
      {
        id: 'tpl-page-header',
        zh: '页头',
        en: 'Page Header',
        keywords: 'OnlinePageHeader 名称 筛选 搜索 新建 主按钮',
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
        zh: '双层标签页',
        en: 'Dual Tabs',
        keywords: '双层 Tab 子 Tab navSecondarySubTab',
      },
    ],
  },
  {
    groupZh: '设计令牌',
    groupEn: 'Token',
    items: [
      { id: 'token-color', zh: '颜色', en: 'Color', keywords: '颜色 color' },
      { id: 'token-type', zh: '字体', en: 'Font', keywords: '字体 font' },
      { id: 'token-icon', zh: '图标', en: 'Icon', keywords: '图标 icon' },
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
        keywords: 'BTN_INK SOFT OUTLINE DANGER 按钮 Loading 加载 MatrixLoader',
      },
      { id: 'atom-field', zh: '表单字段', en: 'Field / Form', keywords: 'FIELD LABEL 表单 输入' },
      { id: 'atom-tag', zh: '标签', en: 'Tag', keywords: 'badge badgeClass 标签' },
      { id: 'atom-chip', zh: '筛选条', en: 'Filter Chip', keywords: 'chip 筛选' },
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
        id: 'pattern-exec-fold',
        zh: '处理过程折叠',
        en: 'ExecutionProcessFold',
        keywords: 'ExecutionProcessFold 对话 推理',
        status: 'live',
      },
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
      { id: 'pattern-composer', zh: '提示输入', en: 'PromptComposer', keywords: 'PromptComposer 技能', status: 'single' },
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

/** 常量 → 锚点索引（P0） */
const CONSTANT_INDEX: { name: string; href: NavId; note: string }[] = [
  { name: 'BTN_INK', href: 'atom-button', note: '主操作墨黑' },
  { name: 'BTN_SOFT', href: 'atom-button', note: '次级柔灰' },
  { name: 'BTN_OUTLINE', href: 'atom-button', note: '描边白底' },
  { name: 'BTN_DANGER', href: 'atom-button', note: '危险描边' },
  { name: 'BTN + MatrixLoader', href: 'atom-button', note: '按钮加载态' },
  { name: 'FIELD / LABEL', href: 'atom-field', note: '表单控件' },
  { name: 'SEARCH_FIELD', href: 'atom-field', note: '页头搜索' },
  { name: 'badgeClass', href: 'atom-tag', note: '语义标签' },
  { name: 'SEGMENTED_BAR', href: 'atom-segmented', note: '分段切换' },
  { name: 'CARD / PANEL', href: 'token-shadow', note: '卡片 / 静态面板' },
  { name: 'Navigation', href: 'atom-underline', note: '默认 hybrid 顶栏' },
  { name: 'PageHeader', href: 'pattern-header', note: 'Dashboard / 角色' },
  { name: 'Modal', href: 'pattern-modal', note: '弹窗 CRUD' },
  { name: 'PanelModal', href: 'tpl-modals', note: '480px 分区窄弹窗' },
  { name: 'ListPagination', href: 'pattern-table', note: '列表分页' },
  { name: 'ContentBusy', href: 'feedback-busy', note: '区块加载' },
  { name: 'OnlinePageHeader', href: 'tpl-page-header', note: '页头：标题 + 筛选搜索 + 主按钮' },
  { name: '列表布局', href: 'tpl-list', note: '页头 + 扁平表 + 分页' },
  { name: '卡片布局', href: 'tpl-card', note: '页头 + CARD 网格' },
  { name: '弹窗样式', href: 'tpl-modals', note: '表单 / 确认 / 危险 / 宽屏' },
  { name: '分层选项卡', href: 'tpl-layered-tabs', note: '窄轨 + 顶栏二级 Tab' },
  { name: '双层标签页', href: 'tpl-dual-tabs', note: '一级 Tab + 子 Tab' },
  { name: 'OnlinePageLayout', href: 'pattern-online', note: '在线列表壳' },
  { name: 'EmployeeCardRelay', href: 'pattern-employee', note: '员工卡' },
  { name: 'MarketCardRelay', href: 'pattern-market', note: '市场卡' },
  { name: 'PromptComposer', href: 'pattern-composer', note: '提示输入' },
  { name: 'HoverActionMenu', href: 'pattern-hover-menu', note: '悬停菜单' },
  { name: 'WorkspaceOverlay', href: 'pattern-workspace', note: '知识库全屏层' },
  { name: 'ExecutionProcessFold', href: 'pattern-exec-fold', note: '对话处理过程' },
  { name: 'ResizableSplitPane', href: 'pattern-split-pane', note: '员工页分栏' },
  { name: 'MasterTemplateUpgradeBanner', href: 'pattern-upgrade-banner', note: '母版升级' },
];

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
};

/** 设计系统色板 — 对齐 color-tokens.md / tokens-full.md / lib/ui.ts badgeTones */
const COLOR_GROUPS: ColorGroup[] = [
  {
    groupZh: '中性灰阶',
    groupEn: 'Neutral scale',
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
      { zh: '600', en: 'neutral-600', hex: '#525252', note: '徽章 neutral 字' },
      { zh: '700', en: 'neutral-700', hex: '#404040', note: '表格正文' },
      { zh: '800', en: 'neutral-800', hex: '#262626', note: 'BTN_INK 主操作' },
      { zh: '850', en: 'neutral-850', hex: '#262626', note: 'hover:bg-neutral-850' },
      { zh: '900', en: 'neutral-900', hex: '#171717', note: '标题 / 进度条' },
      { zh: '950', en: 'neutral-950', hex: '#0A0A0A', note: '深色命令区', dark: true },
    ],
  },
  {
    groupZh: '语义 Token',
    groupEn: 'Semantic CSS',
    items: [
      { zh: '画布', en: 'background', hex: '#FFFFFF', note: 'bg-background / PAGE' },
      { zh: '主文本', en: 'foreground', hex: '#111111', note: 'text-foreground', dark: true },
      { zh: '主色', en: 'primary', hex: '#111111', note: 'bg-primary / ink', dark: true },
      { zh: '主色字', en: 'primary-fg', hex: '#FAFAFA', note: 'text-primary-foreground' },
      { zh: '次级底', en: 'secondary', hex: '#F5F5F5', note: 'bg-secondary / muted' },
      { zh: '次要字', en: 'muted-fg', hex: '#737373', note: 'text-muted-foreground' },
      { zh: '默认描边', en: 'border', hex: '#E8E8E8', note: 'border-border / input' },
      { zh: '聚焦环', en: 'ring', hex: '#A3A3A3', note: 'ring-ring /30' },
      { zh: '危险', en: 'destructive', hex: '#DC2626', note: 'text-destructive', dark: true },
    ],
  },
  {
    groupZh: '标签色调',
    groupEn: 'badgeClass tones',
    items: [
      { zh: '中性底', en: 'neutral bg', hex: '#F5F5F5', note: 'badgeClass neutral' },
      { zh: '墨黑底', en: 'ink bg', hex: '#262626', note: 'badgeClass ink', dark: true },
      { zh: '成功底', en: 'success bg', hex: '#ECFDF5', note: '开箱即用 / 上岗' },
      { zh: '成功字', en: 'success text', hex: '#009966', note: 'text success' },
      { zh: '警告底', en: 'warning bg', hex: '#FFFBEB', note: '专属定制' },
      { zh: '警告字', en: 'warning text', hex: '#B45309', note: 'text warning' },
      { zh: '危险底', en: 'danger bg', hex: '#FFF1F2', note: 'bg-rose-50' },
      { zh: '危险字', en: 'danger text', hex: '#E11D48', note: 'text-rose-600' },
      { zh: '信息底', en: 'live bg', hex: '#F0F7FF', note: '休息 / AI 标签' },
      { zh: '信息字', en: 'live text', hex: '#0050D2', note: 'text live 文案' },
    ],
  },
  {
    groupZh: '状态与强调',
    groupEn: 'Status & accent',
    items: [
      { zh: '在线点', en: 'online dot', hex: '#00AC6B', note: 'statusDot 上岗' },
      { zh: '成功强调', en: 'emerald-600', hex: '#059669', note: 'bg-emerald-600' },
      { zh: '警告强调', en: 'amber-700', hex: '#B45309', note: '排队 / 定制' },
      { zh: '信息浅蓝', en: 'sky-50', hex: '#F0F9FF', note: '映射稿 #F2F7FF' },
      { zh: '信息强调', en: 'sky-600', hex: '#0284C7', note: '实时 / 组 A' },
      { zh: '对比紫', en: 'violet-50', hex: '#F5F3FF', note: '组 B 对比' },
      { zh: '通知红', en: 'red-600', hex: '#DC2626', note: '角标 / 红点', dark: true },
      { zh: '遮罩', en: 'overlay', hex: '#000000', note: 'bg-black/40 Modal', dark: true },
    ],
  },
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
      [Settings, 'Settings'],
      [Settings2, 'Settings2'],
      [SlidersHorizontal, 'Sliders'],
      [Lock, 'Lock'],
      [Unlock, 'Unlock'],
      [KeyRound, 'Key'],
      [Shield, 'Shield'],
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
      [BarChart3, 'Chart'],
      [Activity, 'Activity'],
      [TrendingUp, 'Trending'],
      [Database, 'Database'],
      [Cpu, 'Cpu'],
      [BrainCircuit, 'Brain'],
      [Sparkles, 'Sparkles'],
      [Zap, 'Zap'],
      [Lightbulb, 'Idea'],
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

const TAG_TONES: BadgeTone[] = ['neutral', 'ink', 'success', 'warning', 'danger', 'live'];
const TONE_ZH: Record<BadgeTone, string> = {
  neutral: '中性',
  ink: '墨黑',
  success: '成功',
  warning: '警告',
  danger: '危险',
  live: '信息',
};

const TPL_STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'running', label: '运行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
] as const;

type TplStatusKey = (typeof TPL_STATUS_FILTERS)[number]['key'];

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
  { name: '售后政策库', docs: 24, status: 'live' as const, statusZh: '解析完成' },
  { name: '催收话术库', docs: 12, status: 'success' as const, statusZh: '已启用' },
  { name: '质检标准库', docs: 8, status: 'warning' as const, statusZh: '待同步' },
];

const TPL_LAYER_TABS = [
  { id: 'summary', label: '数据汇总' },
  { id: 'templates', label: '质检模板' },
  { id: 'plans', label: '质检计划' },
  { id: 'board', label: '数据看板' },
] as const;

const TPL_DUAL_GROUPS = [
  {
    id: 'ops',
    label: '运营监控',
    children: [
      { id: 'live', label: '实时监控' },
      { id: 'alert', label: '预警中心' },
      { id: 'inspect', label: '自动巡检' },
    ],
  },
  {
    id: 'task',
    label: '任务管理',
    children: [
      { id: 'running', label: '进行中' },
      { id: 'done', label: '已完成' },
    ],
  },
  { id: 'report', label: '报表', children: [] as { id: string; label: string }[] },
];

type TplModalKind = 'form' | 'confirm' | 'danger' | 'large' | 'info';


const TOC_BY_ID: Record<NavId, TocItem> = Object.fromEntries(
  TOC.flatMap((g) => g.items.map((item) => [item.id, item])),
) as Record<NavId, TocItem>;

function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  const meta = STATUS_META[status];
  return <span className={badgeClass(meta.tone)}>{meta.zh}</span>;
}

/** 分区标题：与侧栏 TOC 同源 */
function Section({
  id,
  source,
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
  const toc = TOC_BY_ID[id];
  const platformStatus = status ?? toc.status ?? PLATFORM_STATUS[id];
  return (
    <section id={id} className="scroll-mt-8 mb-14 last:mb-6">
      <header className="mb-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-[17px] font-semibold text-neutral-900 tracking-tight">{toc.zh}</h2>
          {platformStatus ? <PlatformStatusBadge status={platformStatus} /> : null}
          {source ? (
            <code className="text-[10px] leading-none px-1.5 py-1 rounded-md bg-neutral-100 text-neutral-500 font-mono">
              {source}
            </code>
          ) : null}
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
  const [seg, setSeg] = useState('employees');
  const [chip, setChip] = useState('24h');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [busyDemo, setBusyDemo] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeToc, setActiveToc] = useState<NavId>('index');
  const [tocQuery, setTocQuery] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [permOn, setPermOn] = useState(true);
  const [tplStatus, setTplStatus] = useState<TplStatusKey>('all');
  const [tplSearch, setTplSearch] = useState('');
  const [tplLayerTab, setTplLayerTab] = useState<(typeof TPL_LAYER_TABS)[number]['id']>('plans');
  const [tplDualGroup, setTplDualGroup] = useState(TPL_DUAL_GROUPS[0].id);
  const [tplDualChild, setTplDualChild] = useState(TPL_DUAL_GROUPS[0].children[0].id);
  const [tplModal, setTplModal] = useState<TplModalKind | null>(null);
  const [panelModalOpen, setPanelModalOpen] = useState(false);

  const filteredToc = useMemo(() => {
    const q = tocQuery.trim().toLowerCase();
    if (!q) return TOC;
    return TOC.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const hay =
          `${item.zh} ${item.en} ${group.groupZh} ${group.groupEn} ${item.keywords ?? ''} ${item.id}`.toLowerCase();
        return hay.includes(q);
      }),
    })).filter((g) => g.items.length > 0);
  }, [tocQuery]);

  useEffect(() => {
    const ids = TOC.flatMap((g) => g.items.map((i) => i.id));
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
  }, []);

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
  const tplDualActive = TPL_DUAL_GROUPS.find((g) => g.id === tplDualGroup);
  const tplDualChildren = tplDualActive?.children ?? [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-800 font-sans text-xs antialiased">
      <aside className="w-[220px] shrink-0 border-r border-neutral-200 bg-white overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-5 pb-3 border-b border-neutral-200/80 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-[7px] bg-neutral-800 text-white text-[11px] font-bold grid place-items-center shrink-0">
              京
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-neutral-900 tracking-tight truncate">
                JoySupport
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">组件库 · ?ds=1</p>
              <a
                href="/"
                className="inline-block mt-1 text-[10px] font-medium text-live hover:underline"
              >
                返回产品
              </a>
            </div>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={tocQuery}
              onChange={(e) => setTocQuery(e.target.value)}
              placeholder="搜索…"
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={badgeClass('ink')}>权威源</span>
              <span className={badgeClass('neutral')}>lib/ui.ts</span>
              <span className={badgeClass('live')}>真组件展台</span>
            </div>
            <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight leading-tight">
              JoySupport 组件库
            </h1>
            <p className="mt-2.5 max-w-2xl text-[13px] text-neutral-500 leading-relaxed">
              京小灵设计系统展台。展品来自生产代码，裁定顺序为
              <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[11px]">
                lib/ui.ts
              </code>
              →
              <code className="mx-1 px-1 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[11px]">
                common/*
              </code>
              → 业务页。与 skill 文档冲突时，以本页与源码为准。
            </p>
            <div className="mt-3 rounded-[10px] border border-neutral-200 bg-neutral-50/80 px-3.5 py-3 max-w-2xl space-y-1.5">
              <div className="text-[12px] font-semibold text-neutral-800">
                其他项目引用{' '}
                <code className="font-mono text-[11px] font-semibold text-neutral-700">
                  @joysupport/ui
                </code>
                {' · 文档 '}
                <code className="font-mono text-[11px] font-semibold text-neutral-700">
                  docs/component-library.md
                </code>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                风格转换用 <code className="text-neutral-700">BTN_INK / FIELD / CARD</code>；
                组件直接{' '}
                <code className="text-neutral-700">import {'{'} Modal, PageHeader {'}'} from &apos;@joysupport/ui&apos;</code>
                。文档镜像便于 JoySpace / 评审分享。安装：根目录{' '}
                <code className="text-neutral-700">npm run pack:ui</code>。详见包说明与组件库文档。
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(STATUS_META) as PlatformStatus[]).map((s) => (
                <PlatformStatusBadge key={s} status={s} />
              ))}
            </div>
          </header>

        <Section
          id="index"
          source="lib/ui.ts → 锚点"
          desc="从常量名跳到对应展台。侧栏也可搜索。"
        >
          <SpecPanel className="p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-400">
                  <th className="px-4 py-2.5 font-semibold"><BiLabel zh="常量 / 组件" en="Token" /></th>
                  <th className="px-4 py-2.5 font-semibold"><BiLabel zh="用途" en="Usage" /></th>
                  <th className="px-4 py-2.5 font-semibold text-right"><BiLabel zh="跳转" en="Go" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {CONSTANT_INDEX.map((row) => (
                  <tr key={row.name} className="hover:bg-neutral-50/70">
                    <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-neutral-800">
                      {row.name}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-neutral-500">{row.note}</td>
                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={`#${row.href}`}
                        className="text-[11px] font-medium text-live hover:underline"
                      >
                        查看
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SpecPanel>
        </Section>

        {/* ── Page templates ── */}
        <Section
          id="tpl-page-header"
          source="OnlinePageHeader"
          desc="列表 / 看板页标准页头：左标题，右筛选 + 搜索 + 主操作。对齐质检计划等运营页。"
          dos={['标题与工具同一行', '筛选 Select + SEARCH_FIELD + BTN_INK', '控件高 32px']}
          donts={['不要用 PageHeader 再叠一层大标题', '筛选条不要包进 CARD']}
        >
          <PageMock className="bg-white">
            <div className="px-5 pt-5">
              <OnlinePageHeader title="质检计划">
                <Select
                  value={tplStatus}
                  onValueChange={(v) => v && setTplStatus(v as TplStatusKey)}
                >
                  <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选状态">
                    <SelectValue>{tplStatusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
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
          </PageMock>
        </Section>

        <Section
          id="tpl-list"
          source="OnlinePageHeader + TABLE + ListPagination"
          desc="内容列表：页头工具行 + 扁平表 + 底部分页。标题由页头承担，不要再套卡片包表。"
          dos={['表头 10px 次要色', '行 hover 浅底', '超过 10 条再出分页']}
          donts={['表不要包进 CARD', '行内不要堆过多按钮']}
        >
          <PageMock>
            <div className="px-5 pt-5">
              <OnlinePageHeader title="知识库">
                <label className="relative inline-flex items-center">
                  <Search
                    size={14}
                    className="absolute left-2.5 text-neutral-400 pointer-events-none"
                  />
                  <input
                    className={cn(SEARCH_FIELD, 'pl-8')}
                    type="search"
                    placeholder="搜索知识库"
                  />
                </label>
                <button
                  type="button"
                  className={BTN_INK}
                  onClick={() => setTplModal('form')}
                >
                  新建
                </button>
              </OnlinePageHeader>
              <OnlineSectionHeader title="全部知识库" description="文档解析完成后可用于员工检索" />
            </div>
            <div className="px-5 pb-5">
              <div className={onlineTableClass.wrap}>
                <table className={onlineTableClass.table}>
                  <thead>
                    <tr className={onlineTableClass.headRow}>
                      <th className={onlineTableClass.thFirst}>名称</th>
                      <th className={onlineTableClass.th}>文档数</th>
                      <th className={onlineTableClass.th}>状态</th>
                      <th className={onlineTableClass.thLast}>操作</th>
                    </tr>
                  </thead>
                  <tbody className={onlineTableClass.body}>
                    {TPL_LIST_ROWS.map((row) => (
                      <tr key={row.name} className={onlineTableClass.row}>
                        <td className={onlineTableClass.tdFirst}>
                          <div className="flex items-center gap-2.5">
                            <CardIcon seed={row.name} size="sm">
                              {row.name.slice(0, 1)}
                            </CardIcon>
                            {row.name}
                          </div>
                        </td>
                        <td className={onlineTableClass.td}>{row.docs}</td>
                        <td className={onlineTableClass.td}>
                          <span className={badgeClass(row.status)}>{row.statusZh}</span>
                        </td>
                        <td className={onlineTableClass.tdLast}>
                          <button type="button" className={cn(BTN_OUTLINE, 'h-6 text-[11px]')}>
                            管理
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-3">
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
                  <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选状态">
                    <SelectValue>{tplStatusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
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
          source="PrimaryNavRail + navSecondaryTabClass"
          desc="分层导航：左侧一级域 + 顶栏二级能力 Tab。二级激活为渐变字 + 底部胶囊条。"
          dos={['一级在窄轨，二级在顶栏横排', '当前域高亮，其余弱化']}
          donts={['不要和下划线 Tab 再叠一层同级分段', '不要把二级做成侧栏树（默认布局）']}
        >
          <PageMock className="flex min-h-[280px]">
            <aside className="w-[52px] shrink-0 border-r border-neutral-200 bg-neutral-50 p-2 flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-[10px] bg-white text-live grid place-items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-sky-100">
                <ClipboardCheck size={16} />
              </div>
              <div className="w-9 h-9 rounded-[10px] text-neutral-400 grid place-items-center">
                <Headphones size={16} />
              </div>
              <div className="w-9 h-9 rounded-[10px] text-neutral-400 grid place-items-center">
                <Home size={16} />
              </div>
            </aside>
            <div className="flex-1 min-w-0 flex flex-col bg-white">
              <div className="px-3 border-b border-neutral-200">
                <nav className="flex items-center gap-1 overflow-x-auto" aria-label="二级能力">
                  {TPL_LAYER_TABS.map((tab) => {
                    const active = tplLayerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTplLayerTab(tab.id)}
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
              <div className="px-5 pt-5 pb-6">
                <OnlinePageHeader
                  title={TPL_LAYER_TABS.find((t) => t.id === tplLayerTab)?.label ?? ''}
                >
                  <button type="button" className={BTN_INK}>
                    主操作
                  </button>
                </OnlinePageHeader>
                <p className="text-[12px] text-neutral-500">
                  当前层：智能质检 / {TPL_LAYER_TABS.find((t) => t.id === tplLayerTab)?.label}
                </p>
              </div>
            </div>
          </PageMock>
        </Section>

        <Section
          id="tpl-dual-tabs"
          source="navSecondaryTabClass + navSecondarySubTabClass"
          desc="双层标签：第一行能力分组，第二行子页。无子项时收起第二行。催收等域的真实写法。"
          dos={['子 Tab 用 h-9 / 12px', '两组之间用发丝线分隔', '点分组时落到该组默认子页']}
          donts={['不要用两行同级下划线抢权重', '不要把子页做成 Segmented 叠在下划线上']}
        >
          <PageMock>
            <div className="px-4 pt-1">
              <nav className="min-w-0" aria-label="双层标签示例">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {TPL_DUAL_GROUPS.map((group) => {
                    const active = tplDualGroup === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setTplDualGroup(group.id);
                          if (group.children[0]) setTplDualChild(group.children[0].id);
                        }}
                        className={navSecondaryTabClass(active)}
                      >
                        {group.label}
                        {active ? (
                          <span className={NAV_SECONDARY_TAB_INDICATOR} aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {tplDualChildren.length > 0 ? (
                  <div className="flex items-center gap-1 overflow-x-auto border-t border-neutral-200/80 pl-1">
                    {tplDualChildren.map((child) => {
                      const active = tplDualChild === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setTplDualChild(child.id)}
                          className={navSecondarySubTabClass(active)}
                        >
                          {child.label}
                          {active ? (
                            <span className={NAV_SECONDARY_SUBTAB_INDICATOR} aria-hidden />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </nav>
            </div>
            <div className="px-5 py-5 border-t border-neutral-100">
              <p className="text-[13px] font-semibold text-neutral-900">
                {tplDualActive?.label}
                {tplDualChildren.length > 0
                  ? ` · ${tplDualChildren.find((c) => c.id === tplDualChild)?.label ?? ''}`
                  : ''}
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                {tplDualChildren.length > 0
                  ? '第二行切换子页，内容区只渲染当前子页。'
                  : '该分组无子页，第二行隐藏。'}
              </p>
            </div>
          </PageMock>
        </Section>

        {/* ── Token ── */}
        <Section
          id="token-color"
          source="index.css · color-tokens.md · badgeTones"
          desc="骨架用 neutral 灰阶；彩色只用于语义状态。代码禁止裸 Hex，对照设计稿用下表 Tailwind class。"
        >
          <div className="space-y-6">
            {COLOR_GROUPS.map((group) => (
              <div key={group.groupEn}>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <h3 className="text-[13px] font-semibold text-neutral-900">{group.groupZh}</h3>
                  <span className="text-[10px] text-neutral-300 tabular-nums">{group.items.length}</span>
                </div>
                {group.groupEn === 'Neutral scale' ? (
                  <NeutralScaleStrip items={group.items} />
                ) : group.groupEn === 'badgeClass tones' ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {TAG_TONES.map((tone) => (
                        <span key={tone} className={badgeClass(tone)}>
                          {TONE_ZH[tone]}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {group.items.map((c) => (
                        <ColorSwatchCard key={c.en} swatch={c} />
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

        <Section id="token-type" source="Inter + PingFang SC" desc="全站字阶只使用下列档位。">
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
          source="lib/icons.tsx · Hugeicons"
          desc="尺寸：表内 13 · 控件 14 · 导航 16。下列为 lib/icons 常用包装组件（按场景分组）。"
        >
          <SpecStage>
            <div className="flex flex-wrap gap-5 items-end mb-4 pb-4 border-b border-neutral-200/70">
              <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                <Search size={13} className="text-neutral-800" />
                <span className="text-[10px]">13</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                <Search size={14} className="text-neutral-800" />
                <span className="text-[10px]">14</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                <Search size={16} className="text-neutral-800" />
                <span className="text-[10px]">16</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                <Search size={14} className="text-neutral-400" />
                <span className="text-[10px]">弱色</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                <Search size={14} className="text-live" />
                <span className="text-[10px]">主色</span>
              </div>
            </div>
            <div className="space-y-5">
              {ICON_GROUPS.map((group) => (
                <div key={group.titleEn}>
                  <div className="mb-2 text-[11px] font-semibold text-neutral-500">
                    {group.titleZh}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {group.items.map(([Icon, name]) => (
                      <div
                        key={`${group.titleEn}-${name}`}
                        className="flex flex-col items-center gap-2 py-3 rounded-[10px] bg-white border border-neutral-200/80"
                        title={name}
                      >
                        <Icon size={16} className="text-neutral-800" />
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
          desc="紧凑密度：用真实空隙示意，不用抽象短条。页面 20 · 表单项 16 · 标签→输入 4。"
        >
          {/* 等比刻度：相对最长档对齐，一眼比出大小 */}
          <SpecPanel className="mb-4 p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-neutral-500 mb-3">
              等比对照
            </div>
            <div className="space-y-2.5">
              {(
                [
                  { token: 'H5', px: 20, zh: '页面 / 弹窗内边距', en: 'PAGE / Modal' },
                  { token: 'V4', px: 16, zh: '表单项 / 网格', en: 'Form / Grid' },
                  { token: 'gap-3', px: 12, zh: '卡片流', en: 'Card flow' },
                  { token: 'gap-2', px: 8, zh: '页脚按钮距', en: 'Footer gap' },
                  { token: 'V1', px: 4, zh: '标签 → 输入', en: 'Label → Field' },
                ] as const
              ).map((row) => (
                <div key={row.token} className="flex items-center gap-3">
                  <code className="w-12 shrink-0 text-[10px] font-mono font-semibold text-neutral-700">
                    {row.token}
                  </code>
                  <div className="flex-1 h-6 rounded-md bg-neutral-100 overflow-hidden relative">
                    <div
                      className="h-full bg-neutral-800 rounded-md flex items-center justify-end pr-2"
                      style={{ width: `${(row.px / 20) * 100}%`, minWidth: row.px <= 4 ? 28 : undefined }}
                    >
                      <span className="text-[10px] font-bold text-white tabular-nums">{row.px}</span>
                    </div>
                  </div>
                  <span className="w-[140px] shrink-0 text-[11px] text-neutral-500 truncate text-right">
                    {row.zh}
                  </span>
                </div>
              ))}
            </div>
          </SpecPanel>

          {/* 实物空隙：两块之间就是真实 px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                {
                  token: 'H5',
                  px: 20,
                  zh: '页面内边距',
                  en: 'PAGE padding',
                  cls: 'p-5',
                  note: 'PAGE / Modal 外壳',
                },
                {
                  token: 'V4',
                  px: 16,
                  zh: '表单项间距',
                  en: 'Form stack',
                  cls: 'space-y-4',
                  note: '字段与字段之间',
                },
                {
                  token: 'gap-3',
                  px: 12,
                  zh: '卡片流',
                  en: 'Card gap',
                  cls: 'gap-3',
                  note: '网格 / 卡片列表',
                },
                {
                  token: 'gap-2',
                  px: 8,
                  zh: '页脚间距',
                  en: 'Footer gap',
                  cls: 'gap-2',
                  note: '取消 · 确定',
                },
                {
                  token: 'V1',
                  px: 4,
                  zh: '标签 → 输入',
                  en: 'Label → Field',
                  cls: 'mb-1 / LABEL',
                  note: 'Label 下方',
                },
              ] as const
            ).map((item) => (
              <div
                key={item.token}
                className="rounded-[13px] border border-neutral-200 bg-white p-3.5 shadow-[0_2px_10px_rgba(31,35,41,0.02)]"
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <div>
                    <div className="text-[12px] font-semibold text-neutral-900">
                      {item.zh}
                    </div>
                    <code className="text-[10px] font-mono text-neutral-400">{item.cls}</code>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-bold tabular-nums text-neutral-900 leading-none">
                      {item.px}
                      <span className="text-[11px] font-semibold text-neutral-400 ml-0.5">px</span>
                    </div>
                    <code className="text-[10px] font-mono font-semibold text-live">{item.token}</code>
                  </div>
                </div>
                <div className="rounded-[10px] bg-neutral-50 border border-neutral-100 p-2.5">
                  <div className="h-7 rounded-md bg-white border border-neutral-200" />
                  <div
                    className="relative flex items-center justify-center"
                    style={{ height: item.px }}
                  >
                    <div className="absolute inset-x-3 top-1/2 h-px bg-live/40" />
                    <span className="relative z-[1] px-1.5 rounded bg-neutral-50 text-[9px] font-bold tabular-nums text-live">
                      {item.px}px
                    </span>
                  </div>
                  <div className="h-7 rounded-md bg-white border border-neutral-200" />
                </div>
                <p className="mt-2 text-[10px] text-neutral-400 leading-snug">{item.note}</p>
              </div>
            ))}

            {/* 控件高度单独一张 */}
            <div className="rounded-[13px] border border-neutral-200 bg-white p-3.5 shadow-[0_2px_10px_rgba(31,35,41,0.02)]">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div>
                  <div className="text-[12px] font-semibold text-neutral-900">
                    控件高度
                  </div>
                  <code className="text-[10px] font-mono text-neutral-400">h-8</code>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[18px] font-bold tabular-nums text-neutral-900 leading-none">
                    32
                    <span className="text-[11px] font-semibold text-neutral-400 ml-0.5">px</span>
                  </div>
                  <code className="text-[10px] font-mono font-semibold text-live">h-8</code>
                </div>
              </div>
              <div className="rounded-[10px] bg-neutral-50 border border-neutral-100 p-3 flex items-center justify-center">
                <button type="button" className={BTN_INK} tabIndex={-1}>
                  确定 32px
                </button>
              </div>
              <p className="mt-2 text-[10px] text-neutral-400 leading-snug">主按钮 / 输入框统一高度</p>
            </div>
          </div>
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

        <Section id="token-shadow" source="CARD · MODAL · Toast">
          <SpecStage className="flex flex-wrap gap-4">
            <div className={cn(CARD, 'w-36 h-20 grid place-items-center text-neutral-500')}>
              <span className="text-center leading-tight">卡片静态</span>
            </div>
            <div
              className={cn(
                CARD,
                CARD_HOVER,
                'w-36 h-20 grid place-items-center text-neutral-500 -translate-y-0.5 shadow-[0_4px_12px_rgba(31,35,41,0.08)]',
              )}
            >
              <span className="text-center leading-tight">卡片悬停</span>
            </div>
            <div className="w-36 h-20 rounded-[13px] bg-white shadow-lg ring-1 ring-black/10 grid place-items-center text-neutral-500">
              <span className="text-center leading-tight">弹窗</span>
            </div>
            <div className="w-36 h-20 rounded-[7px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] grid place-items-center text-neutral-500">
              <span className="text-center leading-tight">轻提示</span>
            </div>
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
          source="BTN_INK / SOFT / OUTLINE / DANGER · Loading=disabled+MatrixLoader"
          desc="悬停态按源码模拟（主按钮 opacity-90 等）。加载态：禁用 + 内嵌加载动画（14），可选文案「提交中…」。"
          dos={[
            '主 CTA 用 BTN_INK',
            '取消用 BTN_SOFT 或 OUTLINE',
            '危险操作用 BTN_DANGER',
            '加载中必须 disabled，用 MatrixLoader（Loader2 别名）',
          ]}
          donts={[
            '主色不要用蓝色',
            '不要自造圆角/高度（保持 h-8 / 7px）',
            '不要用 CSS animate-spin 圆环替代点阵',
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
                  <th className="py-2.5 px-4 font-semibold text-center"><BiLabel zh="可点" en="Live" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(
                  [
                    ['BTN_INK', BTN_INK, '确定', true],
                    ['BTN_SOFT', BTN_SOFT, '取消', false],
                    ['BTN_OUTLINE', BTN_OUTLINE, '培训', false],
                    ['BTN_DANGER', BTN_DANGER, '删除', false],
                  ] as const
                ).map(([name, cls, label, onDark]) => (
                  <tr key={name} className="hover:bg-neutral-50/60">
                    <td className="py-3.5 px-4 font-semibold text-neutral-800 whitespace-nowrap font-mono text-[11px]">
                      {name}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls}>{label}</ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="hover">
                        {label}
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="disabled">
                        {label}
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <ForcedBtn className={cls} force="disabled">
                        <BtnLoading onDark={onDark} />
                      </ForcedBtn>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button type="button" className={cls}>
                        {label}
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
              深色底（BTN_INK）对点阵加{' '}
              <code className="px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px]">
                brightness-0 invert
              </code>
              ；浅色底保持默认。与知识库调试、AB 仿真等业务按钮一致。
            </p>
          </div>
        </Section>

        <Section
          id="atom-field"
          source="FIELD · LABEL · 无 CARD 壳"
          desc="LABEL + FIELD 上下排布，直接铺在白底或 Modal 内容区。"
          dos={['Label→输入 4px（LABEL）', '表单项间距 space-y-4', '错误用 destructive 描边 + 文案']}
          donts={['禁止 rounded-[13px] 卡片包裹整块表单', '不要用蓝色 focus ring']}
        >
          <div className="mb-4 px-3.5 py-2.5 rounded-[10px] bg-neutral-100/80 border-l-[3px] border-neutral-800 text-neutral-600 max-w-xl text-[12px] leading-relaxed">
            硬规则：禁止用 rounded-[13px] 卡片包裹整块表单。
          </div>
          <SpecStage className="max-w-lg bg-white">
            <div className="space-y-4 max-w-md">
              <div>
                <label className={LABEL}>
                  知识库名称 <span className="text-rose-500">*</span>
                </label>
                <input className={cn(FIELD, FIELD_CTRL)} placeholder="请输入知识库名称" />
              </div>
              <div>
                <label className={LABEL}>聚焦（示意）</label>
                <input
                  className={cn(FIELD, FIELD_CTRL, 'border-neutral-400 ring-2 ring-ring/30')}
                  defaultValue="售后政策库"
                  readOnly
                />
              </div>
              <div>
                <label className={LABEL}>错误</label>
                <input
                  className={cn(FIELD, FIELD_CTRL, 'border-destructive ring-2 ring-destructive/20')}
                  placeholder="名称不能为空"
                  readOnly
                />
                <p className="text-[10px] text-destructive mt-1">请填写知识库名称</p>
              </div>
              <div>
                <label className={LABEL}>禁用</label>
                <input className={cn(FIELD, FIELD_CTRL)} defaultValue="不可编辑" disabled />
              </div>
              <div>
                <label className={LABEL}>搜索</label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="按工号或姓名查找…" />
                </div>
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
          source="badgeClass / badgeTones"
          desc="语义固定：成功=开箱即用 · 警告=定制 · 信息=AI/休息 · 危险=异常。"
          dos={['状态语义全站固定', '用 badgeClass(tone) 而非手写色']}
          donts={['不要把标签当主按钮', '不要自造紫色/靛蓝色标签']}
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
          source="SessionRecords 时间片"
          desc="时间/快捷筛选；选中态 info 蓝底，非主色墨黑。"
          dos={['用于互斥快捷筛选', '选中用 info 底+描边']}
          donts={['不要替代主 CTA', '不要做成全圆大胶囊堆']}
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
                  className={cn(
                    'h-7 px-2.5 rounded-full border text-[12px] cursor-pointer transition',
                    chip === c.id
                      ? 'bg-[#F0F7FF] border-[#91C5FF] text-[#0050D2] font-semibold'
                      : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-neutral-200/70">
              <StateCell zh="选中" en="Selected">
                <span className="h-7 px-2.5 rounded-full border text-[12px] inline-flex items-center bg-[#F0F7FF] border-[#91C5FF] text-[#0050D2] font-semibold">
                  近 24 小时
                </span>
              </StateCell>
              <StateCell zh="默认" en="Default">
                <span className="h-7 px-2.5 rounded-full border text-[12px] inline-flex items-center bg-white border-neutral-200 text-neutral-500">
                  近 7 天
                </span>
              </StateCell>
              <StateCell zh="悬停" en="Hover">
                <span className="h-7 px-2.5 rounded-full border text-[12px] inline-flex items-center bg-neutral-50 border-neutral-200 text-neutral-800">
                  近 30 天
                </span>
              </StateCell>
              <StateCell zh="禁用" en="Disabled">
                <span className="h-7 px-2.5 rounded-full border text-[12px] inline-flex items-center bg-white border-neutral-200 text-neutral-500 opacity-40">
                  自定义
                </span>
              </StateCell>
            </div>
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

        <Section id="feedback-busy" source="ContentBusy · MatrixLoader">
          <div className="flex flex-wrap gap-3 mb-3">
            <button type="button" className={BTN_SOFT} onClick={() => setBusyDemo((v) => !v)}>
              {busyDemo ? '关闭加载' : '打开加载'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={cn(PANEL, 'p-4 flex flex-col items-center gap-2')}>
              <MatrixLoader size={16} />
              <span className="text-neutral-500">行内 inline 16</span>
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
          donts={['不要在表格里放大插画', '无搜索结果不要假装「系统错误」']}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SpecPanel className="flex flex-col items-center py-10 text-center">
              <div className="w-[120px] h-[90px] rounded-xl bg-neutral-50 border border-neutral-200 mb-3" />
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
              <span className="w-3 h-3 rounded-full bg-[#00AC6B] border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]" />
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
          dos={['二级能力在顶栏横排', '激活态 text-live + 底部蓝色胶囊条']}
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
          desc="VersionSwitcher 选「双侧导航」时启用；默认混合布局仍走顶栏二级导航。"
          dos={['A/B 对比测试用', '一级域在窄轨，二级在侧栏']}
          donts={['不要当作默认权威方案', '不要与顶栏导航同时出现']}
        >
          <div className="inline-flex border border-neutral-200 rounded-[13px] overflow-hidden max-w-sm">
            <div className="w-[52px] bg-neutral-50 border-r border-neutral-200 p-2 flex flex-col gap-1.5 items-center">
              <div className="w-9 h-9 rounded-[10px] bg-white text-live grid place-items-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-sky-100">
                <Home size={16} />
              </div>
              <div className="w-9 h-9 rounded-[10px] text-neutral-500 grid place-items-center hover:bg-white/70">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="w-48 bg-[#f7f8fa] p-2 space-y-1">
              <button
                type="button"
                className="relative w-full text-left pl-3 pr-2.5 py-[7px] rounded-[10px] text-[13px] font-semibold text-live bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-sky-100"
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-[3px] rounded-full bg-live" />
                我的数字员工
              </button>
              <button
                type="button"
                className="w-full text-left pl-3 pr-2.5 py-[7px] rounded-[10px] text-[13px] font-medium text-neutral-600 hover:bg-white/70"
              >
                数字员工市场
              </button>
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
          source="Sidebar.tsx · 无引用"
          desc="232px 宽侧栏方案已废弃；Sidebar.tsx 在全站无引用。现行默认混合布局，可选双侧导航。"
          donts={['新页面禁止采用', '勿复制此结构']}
        >
          <div className="mb-2 inline-flex items-center gap-1.5">
            <span className={badgeClass('warning')}>遗留 Legacy</span>
            <span className="text-neutral-500 text-[11px]">
              QcAppMainTabs.tsx 同为死代码，请勿引用
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
        <Section id="pattern-online" source="OnlinePageLayout">
          <OnlinePageToolbar>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="搜索知识库…" />
            </div>
            <button type="button" className={BTN_INK} onClick={() => setModalOpen(true)}>
              创建知识库
            </button>
          </OnlinePageToolbar>
          <OnlineSectionHeader title="知识库列表" description="管理企业知识并用于员工培训" />
          <div className={onlineTableClass.wrap}>
            <table className={onlineTableClass.table}>
              <thead>
                <tr className={onlineTableClass.headRow}>
                  <th className={onlineTableClass.thFirst}>名称</th>
                  <th className={onlineTableClass.th}>文档数</th>
                  <th className={onlineTableClass.thLast}>操作</th>
                </tr>
              </thead>
              <tbody className={onlineTableClass.body}>
                <tr className={onlineTableClass.row}>
                  <td className={onlineTableClass.tdFirst}>
                    <div className="flex items-center gap-2.5">
                      <CardIcon seed="售后政策库" size="sm">
                        售
                      </CardIcon>
                      售后政策库
                    </div>
                  </td>
                  <td className={onlineTableClass.td}>24</td>
                  <td className={onlineTableClass.tdLast}>
                    <button type="button" className={cn(BTN_OUTLINE, 'h-6 text-[11px]')}>
                      管理
                    </button>
                  </td>
                </tr>
                <tr className={onlineTableClass.row}>
                  <td className={onlineTableClass.tdFirst}>
                    <div className="flex items-center gap-2.5">
                      <CardIcon seed="催收话术库" size="sm">
                        催
                      </CardIcon>
                      催收话术库
                    </div>
                  </td>
                  <td className={onlineTableClass.td}>12</td>
                  <td className={onlineTableClass.tdLast}>
                    <button type="button" className={cn(BTN_OUTLINE, 'h-6 text-[11px]')}>
                      管理
                    </button>
                  </td>
                </tr>
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
            升级类提示见下方「母版升级提示 MasterTemplateUpgradeBanner」。
          </p>
        </Section>

        <Section id="pattern-card-icon" source="common/CardIcon">
          <div className="flex flex-wrap gap-3 items-end">
            <CardIcon seed="a" size="sm">
              知
            </CardIcon>
            <CardIcon seed="b" size="md">
              技
            </CardIcon>
            <CardIcon seed="c" size="lg">
              质
            </CardIcon>
            <CardIcon seed="d" size="md" variant="soft">
              KB
            </CardIcon>
          </div>
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
                primaryActionLabel="培训"
                onPrimaryAction={() => undefined}
                showGoOnlineButton
                onGoOnline={() => showToast('已上岗', 'success')}
                onMoreClick={() => undefined}
                hasTrainNotice
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
          desc="行 hover 浅底；分页为「上一页 · 当前/总页 · 下一页」。"
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
          desc="对话气泡内「处理过程」折叠；员工管理、客户体验页在用。"
          dos={['running 时默认展开 + MatrixLoader', 'done 后显示步数 + CheckCircle']}
          donts={['不要用灰色 pulse 替代点阵加载']}
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
          id="pattern-composer"
          source="common/PromptComposer · SkillCreateWorkspace"
          desc="仅技能创建工作台 1 处；大模型提示输入 PANEL + textarea + 发送。"
          dos={['用于技能创建对话输入', '空内容禁用发送']}
          donts={['不要用普通 FIELD 代替整块 Composer']}
        >
          <SpecStage className="max-w-xl">
            <PromptComposer
              value={promptValue}
              onChange={setPromptValue}
              onSubmit={() => {
                showToast('已发送提示', 'success');
                setPromptValue('');
              }}
              placeholder="描述你希望数字员工掌握的技能…"
            />
          </SpecStage>
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
          desc="未就绪区块用点阵 / 骨架；已就绪不显示。DocumentRowSkeleton / UploadZoneSkeleton / CardListSkeleton 全站无引用。"
          dos={['对话用 ChatReplySkeleton', '工作日志用 WorkLogSkeleton', '解析态用 ParsingStatusCell']}
          donts={[
            '不要用灰色脉冲块替代 MatrixLoader',
            '勿使用 DocumentRow / UploadZone / CardList 骨架（未接入）',
          ]}
        >
          <SpecStage className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={cn(PANEL, 'p-4')}>
              <ChatReplySkeleton />
              <p className="mt-2 text-[10px] text-neutral-400">对话骨架 · 员工页</p>
            </div>
            <div className={cn(PANEL, 'p-4')}>
              <WorkLogSkeleton rows={2} className="py-2" />
              <p className="mt-2 text-[10px] text-neutral-400">工作日志骨架 · 员工页</p>
            </div>
            <div className={cn(PANEL, 'p-4 flex flex-col items-start gap-2')}>
              <ParsingStatusCell progress={65} />
              <p className="text-[10px] text-neutral-400">解析状态 · 知识库</p>
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
          source="OnlinePageLayout 配方"
          desc="标题由二级导航承担；内容区只有工具栏 + 区块头 + 扁平表。"
          dos={['右对齐 Toolbar', '行首可用 CardIcon']}
          donts={['不要再放一个大 PageHeader 标题重复导航']}
        >
          <SpecPanel>
            <OnlinePageToolbar>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input className={cn(SEARCH_FIELD, 'pl-9')} placeholder="搜索…" />
              </div>
              <button type="button" className={BTN_INK} onClick={() => setModalOpen(true)}>
                新建
              </button>
            </OnlinePageToolbar>
            <OnlineSectionHeader title="资源列表" description="示例配方 · 与线上知识库页同构" />
            <table className={onlineTableClass.table}>
              <thead>
                <tr className={onlineTableClass.headRow}>
                  <th className={onlineTableClass.thFirst}>名称</th>
                  <th className={onlineTableClass.thLast}>操作</th>
                </tr>
              </thead>
              <tbody className={onlineTableClass.body}>
                <tr className={onlineTableClass.row}>
                  <td className={onlineTableClass.tdFirst}>
                    <div className="flex items-center gap-2.5">
                      <CardIcon seed="demo" size="sm">
                        示
                      </CardIcon>
                      示例资源
                    </div>
                  </td>
                  <td className={onlineTableClass.tdLast}>
                    <button type="button" className={cn(BTN_OUTLINE, 'h-6 text-[11px]')}>
                      管理
                    </button>
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
              <button
                type="button"
                className="h-7 px-2.5 rounded-full border text-[12px] bg-[#F0F7FF] border-[#91C5FF] text-[#0050D2] font-semibold"
              >
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
                showToast(`已创建「${formName.trim()}」`, 'success');
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
        <p className="text-[12px] text-neutral-600">适用于运行中的计划，不会删除历史结果。</p>
      </Modal>

      <Modal
        open={tplModal === 'danger'}
        onClose={() => setTplModal(null)}
        icon={<Trash2 size={16} />}
        title="删除质检计划"
        description="删除后不可恢复，关联的抽检结果将一并移除。"
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
          确认删除「本平台客服会话 · 日常抽检」？
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
        icon={<Info size={16} />}
        title="如何派发质检任务"
        description="先雇佣质检数字员工并上岗，再在本页新建计划。"
        footer={
          <button type="button" className={BTN_INK} onClick={() => setTplModal(null)}>
            知道了
          </button>
        }
      >
        <p className="text-[12px] text-neutral-600 leading-relaxed">
          计划创建后默认为暂停。点击卡片「开始」才会抽检。数据可在「查看数据」中核对。
        </p>
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
        showCloseButton
      >
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">知识库工作台（示例）</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">WorkspaceOverlay · Esc 关闭</p>
            </div>
            <button type="button" className={BTN_SOFT} onClick={() => setWorkspaceOpen(false)}>
              关闭
            </button>
          </div>
          <div className="flex-1 p-5 overflow-y-auto text-[12px] text-neutral-600 leading-relaxed">
            这里放置宽屏配置、多 Tab、文档列表等内容。简单表单请继续用 Modal。
          </div>
        </div>
      </WorkspaceOverlay>
    </div>
  );
};
