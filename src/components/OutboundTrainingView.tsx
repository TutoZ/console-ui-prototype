/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 智能体话术工作台 — 三栏：列表 / 主控提示词编辑 / 能力配置
 * 对齐产品截图全量信息点（演示态）；外呼培训 / 热线员工培训共用
 */

import React, { useEffect, useMemo, useState } from 'react';
import { BTN_INK, BTN_SOFT, BTN_OUTLINE, SEARCH_FIELD, SELECT_TRIGGER, badgeClass } from '@/lib/ui';
import {
  Check,
  ChevronDown,
  Clock,
  HelpCircle,
  Info,
  ListTree,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Undo2,
  Redo2,
  Upload,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useApp } from '../context/AppContext';
import { resolveJobFamily } from '@/lib/jobFamily';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import {
  CreateAgentScriptModal,
  type CreateAgentScriptPayload,
} from './CreateAgentScriptModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ScriptStatus = 'unused' | 'in_use';

export type AgentScript = {
  id: string;
  scriptId: string;
  name: string;
  llmTag: string;
  status: ScriptStatus;
  createdAt: string;
  previewAt: string;
  ttsVoice: string;
  updatedAt: string;
  prompt: string;
};

const DELIVERY_PROMPT = `# 配送预约客服

## 角色定位
你是京东家电“配送预约”客服，语气友好、专业、简洁，负责与刚下单用户确认配送时间。

## 业务信息
- 所属行业：家电
- 外呼场景：时间确认
- 外呼对象：刚下单用户
- 配送策略：优先用户方便时段，支持改约

## 执行策略
1. 用户表示方便：确认具体时段并复述预约结果
2. 用户表示不方便：询问可改约日期与时段
3. 用户提出改期：核对库存与运力后给出可选窗口
4. 用户暂不确定：约定回访时间并记录标签
5. 用户拒绝沟通：礼貌结束并标记“拒访”
`;

const DEFAULT_SCRIPTS: AgentScript[] = [
  {
    id: 's_delivery',
    scriptId: '700418',
    name: '配送预约客服',
    llmTag: '大模型',
    status: 'in_use',
    createdAt: '08/01 14:22',
    previewAt: '08/04 09:10',
    ttsVoice: '知夏',
    updatedAt: '08/04 09:18',
    prompt: DELIVERY_PROMPT,
  },
  {
    id: 's1',
    scriptId: '10046',
    name: '富民银行安逸花平台鑫心贷 M4+协商催收话术',
    llmTag: '大模型',
    status: 'unused',
    createdAt: '08/03 17:27',
    previewAt: '—',
    ttsVoice: '知夏',
    updatedAt: '08/03 17:27',
    prompt: `# 诉前调解\n\n## 角色定位\n合规催收沟通与还款协商。\n`,
  },
  {
    id: 's2',
    scriptId: '10012',
    name: '商机挖掘标准话术',
    llmTag: '大模型',
    status: 'unused',
    createdAt: '07/28 11:02',
    previewAt: '07/30 16:40',
    ttsVoice: '知夏',
    updatedAt: '07/30 16:40',
    prompt: `# 商机挖掘\n\n## 角色定位\n回访与意向确认。\n`,
  },
];

type ConfigItem = { id: string; label: string; tip: string };
type ConfigGroup = { id: string; title: string; items: ConfigItem[] };

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'voice',
    title: '语音',
    items: [
      { id: 'tts', label: '语音播报设置', tip: '音色、语速、音量与播报策略' },
      { id: 'asr', label: '语音识别设置', tip: '识别模型、热词与静音检测' },
    ],
  },
  {
    id: 'ux',
    title: '对话交互体验',
    items: [
      { id: 'opening', label: '开场白', tip: '接通后首句话术与变量插值' },
      { id: 'fallback', label: '兜底答案', tip: '无法理解时的兜底回复' },
      { id: 'dtmf', label: '按键输入', tip: 'DTMF 按键采集与确认' },
      { id: 'silence', label: '静默响应', tip: '客户长时间静默时的追问策略' },
      { id: 'secretary', label: '电话秘书', tip: '秘书代接场景的识别与话术' },
      { id: 'delayHang', label: '延时挂机', tip: '挂机前等待与告别语' },
      { id: 'longHang', label: '超长挂机', tip: '超长通话强制结束策略' },
      { id: 'virtual', label: '虚拟号识别', tip: '虚拟号拦截与提示' },
      { id: 'interrupt', label: '全局打断', tip: '允许用户随时打断播报' },
      { id: 'bgm', label: '通话背景音', tip: '通话过程中的环境音配置' },
    ],
  },
  {
    id: 'other',
    title: '其他',
    items: [
      { id: 'kb', label: '知识库', tip: '绑定可检索的员工知识' },
      { id: 'lexicon', label: '词库', tip: '热词、同义词与纠错词表' },
      { id: 'tags', label: '标签', tip: '通话过程可打标的业务标签' },
    ],
  },
  {
    id: 'advanced',
    title: '高级功能',
    items: [
      { id: 'intent', label: '意图分类 Agent', tip: '独立意图识别与路由' },
    ],
  },
];

/** 智能外呼员工培训 · 右侧能力（对齐产品截图功能点） */
const OUTBOUND_CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'voice',
    title: '语音',
    items: [
      { id: 'tts', label: '语音播报设置', tip: '音色、语速、音量与播报策略' },
      { id: 'asr', label: '语音识别设置', tip: '识别模型、热词与静音检测' },
    ],
  },
  {
    id: 'ux',
    title: '对话交互体验',
    items: [
      { id: 'opening', label: '开场白', tip: '接通后首句话术与变量插值' },
      { id: 'reject', label: '拒绝答案', tip: '用户明确拒绝时的收口话术' },
      { id: 'silence', label: '静默响应', tip: '客户长时间静默时的追问策略' },
      { id: 'secretary', label: '电话秘书', tip: '秘书代接场景的识别与话术' },
      { id: 'delayHang', label: '延时挂机', tip: '挂机前等待与告别语' },
      { id: 'longHang', label: '超长挂机', tip: '超长通话强制结束策略' },
      { id: 'virtual', label: '虚拟号识别', tip: '虚拟号拦截与提示' },
      { id: 'interrupt', label: '全局打断', tip: '允许用户随时打断播报' },
      { id: 'bgm', label: '通话背景音', tip: '通话过程中的环境音配置' },
    ],
  },
  {
    id: 'other',
    title: '其他',
    items: [
      { id: 'vars', label: '客户变量', tip: '插入 {{客户姓名}} 等外呼变量' },
      { id: 'realtime', label: '实时策略', tip: '通话中动态改写与转人工策略' },
    ],
  },
];

const EDITOR_TABS = [
  { id: 'main', label: '主控提示词' },
  { id: 'skill', label: 'Skill' },
  { id: 'flow', label: '流程编排' },
] as const;

const STATUS_LABEL: Record<ScriptStatus, string> = {
  unused: '未使用',
  in_use: '使用中',
};

const TOOLBAR_ACTIONS = [
  { id: 'undo', label: '撤销', Icon: Undo2 },
  { id: 'redo', label: '重做', Icon: Redo2 },
] as const;

export const AgentScriptWorkspace: React.FC<{
  onToast: (msg: string) => void;
  /** 页头标题 */
  pageTitle?: string;
  /** 默认演示话术；不传则用内置配送预约样例 */
  initialScripts?: AgentScript[];
  /** 智能外呼员工培训：列表/工具条按产品截图功能点 */
  variant?: 'default' | 'outbound';
}> = ({ onToast, pageTitle = '智能体管理', initialScripts, variant = 'default' }) => {
  const isOutbound = variant === 'outbound';
  const {
    pendingOpsAction,
    setPendingOpsAction,
    hiredAgents,
    setExperienceAgentId,
    setActiveTab,
  } = useApp();
  const [scripts, setScripts] = useState(() => initialScripts ?? DEFAULT_SCRIPTS);
  const [selectedId, setSelectedId] = useState(() => (initialScripts ?? DEFAULT_SCRIPTS)[0]?.id ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [promptMode, setPromptMode] = useState('basic');
  const [model, setModel] = useState(isOutbound ? 'qwen' : 'deepseek');
  const [editorTab, setEditorTab] = useState<(typeof EDITOR_TABS)[number]['id']>('main');
  const [openConfigId, setOpenConfigId] = useState<string | null>(null);

  useEffect(() => {
    if (pendingOpsAction !== 'create-script') return;
    setCreateOpen(true);
    setPendingOpsAction(null);
  }, [pendingOpsAction, setPendingOpsAction]);

  const selected = useMemo(
    () => scripts.find((s) => s.id === selectedId) ?? scripts[0],
    [scripts, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.scriptId.includes(q),
    );
  }, [scripts, query]);

  const configGroups = isOutbound ? OUTBOUND_CONFIG_GROUPS : CONFIG_GROUPS;
  const charCount = selected?.prompt.length ?? 0;

  const updatePrompt = (value: string) => {
    if (!selected) return;
    setScripts((prev) =>
      prev.map((s) =>
        s.id === selected.id
          ? { ...s, prompt: value, updatedAt: '刚刚' }
          : s,
      ),
    );
  };

  const insertCustomerVariable = () => {
    if (!selected) return;
    const token = '{{客户姓名}}';
    updatePrompt(`${selected.prompt}${selected.prompt.endsWith('\n') ? '' : '\n'}${token}`);
  };

  const openCustomerPreview = () => {
    const outboundHired = hiredAgents.find((a) => resolveJobFamily(a) === 'outbound');
    if (outboundHired) setExperienceAgentId(outboundHired.id);
    setActiveTab('customerExperience');
  };

  const createScript = (payload?: CreateAgentScriptPayload) => {
    const nextNo = 700000 + scripts.length + 1;
    const id = `s${Date.now()}`;
    const name = payload?.name?.trim() || (isOutbound ? `新建外呼数字员工 ${nextNo}` : `新建智能体话术 ${nextNo}`);
    const industryLine = payload?.industry ? `- 所属行业：${payload.industry}\n` : '';
    const tagLine = payload?.tags?.length ? `- 业务标签：${payload.tags.join('、')}\n` : '';
    const item: AgentScript = {
      id,
      scriptId: String(nextNo),
      name,
      llmTag: '大模型',
      status: 'unused',
      createdAt: '刚刚',
      previewAt: '—',
      ttsVoice: payload?.voiceLabel ?? '知夏',
      updatedAt: '刚刚',
      prompt: `# ${name}\n\n## 角色定位\n请补充角色定位与执行策略。\n${industryLine || tagLine ? `\n## 业务信息\n${industryLine}${tagLine}` : ''}`,
    };
    setScripts((prev) => [item, ...prev]);
    setSelectedId(id);
    if (payload?.model === 'DeepSeek-V4-Flash') setModel('deepseek');
    onToast(`已创建话术“${name}”`);
  };

  const removeScript = (id: string) => {
    setScripts((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? '');
      return next;
    });
    onToast('已删除话术');
  };

  return (
    <>
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-5">
      {isOutbound ? (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight truncate">
              {selected?.name ?? '员工培训'}
            </h1>
            <p className="mt-1 text-[11px] text-neutral-500 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
              <span>员工 ID {selected?.scriptId ?? '—'}</span>
              <span>TTS {selected?.ttsVoice ?? '—'}</span>
              <span>创建 {selected?.createdAt ?? '—'}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                className={cn(SEARCH_FIELD, 'pl-8 w-[200px]')}
                placeholder="搜索员工名称或 ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="button" className={BTN_INK} onClick={openCustomerPreview}>
              客户体验预览
            </button>
          </div>
        </div>
      ) : (
      <OnlinePageHeader title={pageTitle} className="mb-5">
        <button type="button" className={BTN_OUTLINE}>
          批量替换
        </button>
        <button type="button" className={BTN_OUTLINE}>
          测试窗
        </button>
        <button
          type="button"
          className={BTN_INK}
        >
          <ShieldCheck size={14} />
          智能体检
        </button>
        <button type="button" className={BTN_INK} onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          新建智能体话术
        </button>
      </OnlinePageHeader>
      )}
      </div>

      <div className="flex-1 min-h-0 px-5 pb-5">
      <div className="h-full min-h-0 grid grid-cols-[220px_minmax(0,1fr)_220px] max-lg:grid-cols-[200px_minmax(0,1fr)] max-md:grid-cols-1 rounded-[13px] border border-neutral-200 overflow-hidden bg-white shadow-[0_2px_10px_rgba(31,35,41,0.02)]">
        {/* 左：话术列表 */}
        <aside className="border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col min-h-0 max-md:max-h-[240px] bg-neutral-50/70">
          <div className="shrink-0 px-3 py-2.5 border-b border-neutral-200/80 flex items-center gap-2">
            <ListTree size={14} className="text-neutral-500 shrink-0" />
            <h2 className="text-[12px] font-semibold text-neutral-800 flex-1">
              {isOutbound ? '外呼数字员工' : '话术列表'}
              <span className="ml-1 text-neutral-400 font-medium tabular-nums">({scripts.length})</span>
            </h2>
            {isOutbound ? null : (
            <button
              type="button"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:bg-white hover:text-neutral-700 cursor-pointer"
              title="收藏筛选"
            >
              <Star size={13} />
            </button>
            )}
            <button
              type="button"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:bg-white hover:text-neutral-700 cursor-pointer"
              title="刷新"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {isOutbound ? (
            <div className="shrink-0 p-2.5 border-b border-neutral-200/80">
              <button
                type="button"
                className={cn(BTN_INK, 'w-full')}
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={14} />
                新建外呼数字员工
              </button>
            </div>
          ) : (
          <div className="shrink-0 p-2.5 border-b border-neutral-200/80">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                className="w-full h-8 pl-8 pr-2.5 rounded-[7px] border border-neutral-200 bg-white text-[12px] outline-none focus:border-neutral-400"
                placeholder="搜索名称 / ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {filtered.map((s) => {
              const active = s.id === selected?.id;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedId(s.id);
                  }}
                  className={cn(
                    'w-full text-left rounded-[10px] px-2.5 py-2 cursor-pointer transition relative group border',
                    active
                      ? 'bg-white border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                      : 'bg-transparent border-transparent hover:bg-white/80 hover:border-neutral-200',
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {active ? (
                      <Check size={14} className="mt-0.5 shrink-0 text-neutral-800" />
                    ) : null}
                    <p className="flex-1 min-w-0 text-[12px] font-semibold text-neutral-900 leading-snug line-clamp-2">
                      {s.name}
                    </p>
                    <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        className="h-6 w-6 inline-flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScript(s.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="h-6 w-6 inline-flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        title="更多"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-neutral-400 tabular-nums">#{s.scriptId}</span>
                    <span className={badgeClass('neutral')}>{s.llmTag}</span>
                    <span className={badgeClass(s.status === 'in_use' ? 'ink' : 'neutral')}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 pr-6 text-[10px] text-neutral-400 tabular-nums">
                    <span>{s.createdAt}</span>
                    <span>预览 {s.previewAt}</span>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'absolute bottom-1.5 right-1.5 h-6 w-6 inline-flex items-center justify-center rounded cursor-pointer',
                      starred[s.id] ? 'text-neutral-800' : 'text-neutral-300 hover:text-neutral-500',
                    )}
                    title="收藏"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStarred((prev) => ({ ...prev, [s.id]: !prev[s.id] }));
                    }}
                  >
                    <Star size={12} />
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <p className="text-[12px] text-neutral-400 text-center py-8">
                {isOutbound ? '无匹配外呼数字员工' : '无匹配话术'}
              </p>
            ) : null}
          </div>
        </aside>

        {/* 中：编辑主区 */}
        <section className="min-w-0 min-h-0 flex flex-col bg-white max-md:min-h-[360px]">
          {isOutbound ? (
            <div className="shrink-0 px-4 py-2.5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={promptMode} onValueChange={(v) => v && setPromptMode(v)}>
                  <SelectTrigger className={cn(SELECT_TRIGGER, 'h-8 w-[148px]')} aria-label="提示词模式">
                    <SelectValue>
                      {promptMode === 'basic' ? '基础提示词模式' : 'skill · 生成式'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">基础提示词模式</SelectItem>
                    <SelectItem value="skill">skill · 生成式模式</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className={BTN_OUTLINE}
                >
                  <Upload size={13} />
                  上传模板
                </button>
                <button
                  type="button"
                  className={BTN_OUTLINE}
                  onClick={() => onToast('培训内容已保存')}
                >
                  保存培训内容
                </button>
              </div>
              <Select value={model} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger className={cn(SELECT_TRIGGER, 'h-8 w-[158px]')} aria-label="选择模型">
                  <SelectValue>
                    {model === 'deepseek' ? 'DeepSeek-V4-Flash' : 'Qwen3.7-flash'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qwen">Qwen3.7-flash</SelectItem>
                  <SelectItem value="deepseek">DeepSeek-V4-Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
          <>
          <div className="shrink-0 px-4 py-3 border-b border-neutral-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-neutral-900 truncate">
                  {selected?.name ?? '未选择话术'}
                </h3>
                <p className="mt-1 text-[11px] text-neutral-500 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>话术 ID {selected?.scriptId ?? '—'}</span>
                  <span>TTS {selected?.ttsVoice ?? '—'}</span>
                  <span>更新于 {selected?.updatedAt ?? '—'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select value={promptMode} onValueChange={(v) => v && setPromptMode(v)}>
                  <SelectTrigger className={cn(SELECT_TRIGGER, 'h-8 w-[158px]')} aria-label="提示词模式">
                    <SelectValue>
                      {promptMode === 'skill' ? 'skill · 生成式' : '基础提示词'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">skill · 生成式模式</SelectItem>
                    <SelectItem value="basic">基础提示词模式</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={model} onValueChange={(v) => v && setModel(v)}>
                  <SelectTrigger className={cn(SELECT_TRIGGER, 'h-8 w-[168px]')} aria-label="选择模型">
                    <Clock size={13} className="text-neutral-400 shrink-0" />
                    <SelectValue>
                      {model === 'deepseek' ? 'DeepSeek-V4-Flash' : 'Qwen3.7-flash'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek">DeepSeek-V4-Flash</SelectItem>
                    <SelectItem value="qwen">Qwen3.7-flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-4 border-b border-neutral-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {EDITOR_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id)}
                  className={cn(
                    'h-10 px-3 text-[12px] font-medium border-b-2 -mb-px cursor-pointer transition whitespace-nowrap',
                    editorTab === tab.id
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-0.5 shrink-0 pb-px">
              {TOOLBAR_ACTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 cursor-pointer"
                >
                  <Icon size={14} />
                </button>
              ))}
              <span className="w-px h-4 bg-neutral-200 mx-1" />
              <button
                type="button"
                className="h-7 px-2 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-md cursor-pointer"
              >
                + Skill
              </button>
              <button
                type="button"
                className="h-7 px-2 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-md cursor-pointer"
              >
                变量条件
              </button>
              <button
                type="button"
                className="h-7 px-2 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-md cursor-pointer"
              >
                客户变量
              </button>
            </div>
          </div>
          </>
          )}

          {isOutbound || editorTab === 'main' ? (
            <>
              <textarea
                value={selected?.prompt ?? ''}
                onChange={(e) => updatePrompt(e.target.value)}
                className="flex-1 min-h-[240px] resize-none px-4 py-3.5 font-mono text-[12px] leading-relaxed outline-none text-neutral-800 bg-white"
                spellCheck={false}
                aria-label="培训内容"
              />
              <div className="shrink-0 h-9 px-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                <button
                  type="button"
                  className="text-neutral-600 hover:text-neutral-800 cursor-pointer"
                  onClick={insertCustomerVariable}
                >
                  插入客户变量
                </button>
                <span className="tabular-nums">{charCount} / 20000</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50/40">
              <div className="text-center max-w-sm space-y-3">
                <p className="text-[13px] font-semibold text-neutral-800">
                  {editorTab === 'skill' ? 'Skill 编排' : '流程编排'}
                </p>
                <p className="text-[12px] text-neutral-500 leading-relaxed">
                  {editorTab === 'skill'
                    ? '在此挂载可复用 Skill，并配置触发条件与输出变量（演示）。'
                    : '节点式流程编排画布即将接入，当前可先在主控提示词中编写策略（演示）。'}
                </p>
                <button
                  type="button"
                  className={BTN_SOFT}
                >
                  打开编辑器
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 右：能力配置 */}
        <aside className="border-t lg:border-t-0 lg:border-l border-neutral-200 flex flex-col min-h-0 max-lg:hidden bg-neutral-50/40">
          <div className="shrink-0 h-11 px-3 border-b border-neutral-200/80 flex items-center">
            <h2 className="text-[12px] font-semibold text-neutral-800">通话与能力配置</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {configGroups.map((group) => (
              <div key={group.id} className="border-b border-neutral-200/70">
                <div className="sticky top-0 z-[1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/95 backdrop-blur-sm">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const open = openConfigId === item.id;
                  return (
                    <div key={item.id} className="bg-white/60">
                      <button
                        type="button"
                        className="w-full h-9 px-3 flex items-center gap-1 text-left cursor-pointer hover:bg-white"
                        onClick={() =>
                          setOpenConfigId((id) => (id === item.id ? null : item.id))
                        }
                        aria-expanded={open}
                      >
                        <span className="flex-1 min-w-0 text-[12px] font-medium text-neutral-800 truncate">
                          {item.label}
                        </span>
                        <span
                          title={item.tip}
                          className="text-neutral-400 hover:text-neutral-600 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HelpCircle size={12} />
                        </span>
                        <span
                          className="text-neutral-400 shrink-0 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-neutral-100"
                          title="添加配置"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Plus size={13} />
                        </span>
                        <ChevronDown
                          size={13}
                          className={cn(
                            'text-neutral-400 shrink-0 transition',
                            open && 'rotate-180',
                          )}
                        />
                      </button>
                      {open ? (
                        <div className="px-3 pb-3 space-y-2 bg-white border-t border-neutral-100">
                          <p className="pt-2 text-[11px] text-neutral-500 leading-relaxed flex gap-1.5">
                            <Info size={12} className="shrink-0 mt-0.5 text-neutral-400" />
                            {item.tip}
                          </p>
                          <label className="block space-y-1">
                            <span className="text-[11px] text-neutral-500">开关</span>
                            <Select defaultValue="on">
                              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-full h-8')}>
                                <SelectValue>已开启</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="on">已开启</SelectItem>
                                <SelectItem value="off">已关闭</SelectItem>
                              </SelectContent>
                            </Select>
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[11px] text-neutral-500">备注</span>
                            <input
                              className="w-full h-8 px-2.5 rounded-[7px] border border-neutral-200 text-[12px] outline-none focus:border-neutral-400"
                              placeholder="可选配置说明"
                              defaultValue=""
                            />
                          </label>
                          <button
                            type="button"
                            className={cn(BTN_INK, 'h-7 px-2.5 text-[11px]')}
                            onClick={() => onToast(`已保存“${item.label}”`)}
                          >
                            保存
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
      </div>
    </div>
    <CreateAgentScriptModal
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onSubmit={(payload) => {
        createScript(payload);
        setCreateOpen(false);
      }}
    />
    </>
  );
};

/** 外呼 · 员工培训入口（保持原导出名） */
export const OutboundTrainingView: React.FC<{
  onToast: (msg: string) => void;
}> = ({ onToast }) => (
  <AgentScriptWorkspace variant="outbound" pageTitle="员工培训" onToast={onToast} />
);