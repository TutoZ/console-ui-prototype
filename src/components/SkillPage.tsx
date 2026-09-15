/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';
import { useApp } from '../context/AppContext';
import { History, Pencil, Plus, Search, Sparkles, Trash2, UploadCloud } from '@/lib/icons';
import { ListPagination, LIST_PAGE_SIZE, paginateItems } from './common/ListPagination';
import {
  SkillStudioWorkspace,
  type SkillStudioPublishPayload,
} from './skills/SkillStudioWorkspace';
import { BTN_DANGER, BTN_INK, BTN_SOFT, CARD, SEARCH_FIELD, badgeClass } from '@/lib/ui';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import { cn } from '@/lib/utils';
import { SKILL_PAGE_COPY } from '@/lib/platformTerminology';
import { ContentBusy } from './common/ContentBusy';
import { MatrixLoader } from './common/MatrixLoader';
import { Modal } from './common/Modal';
import { useMockLatency } from '@/lib/useMockLatency';
import { useInlineAction } from '@/lib/useInlineAction';
import type { Skill } from '../types';

addCollection(solarIcons as Parameters<typeof addCollection>[0]);

type SkillListTab = 'mine' | 'market';

type SkillVersionItem = {
  id: string;
  label: string;
  note: string;
  time: string;
  current?: boolean;
};

/** 已发布自建技能：底栏为「编辑 / 版本历史 / 删除」三等分操作 */
function isManagedMineSkill(skill: Skill): boolean {
  return skill.type === 'mine' && skill.status !== 'draft';
}

/** 原型假数据：按当前版本与更新时间生成可浏览的历史列表 */
function buildSkillVersionHistory(skill: Skill): SkillVersionItem[] {
  const raw = skill.version?.trim() || 'v1.0.0';
  const currentLabel = /^v/i.test(raw) ? raw : `v${raw}`;

  return [
    {
      id: `${skill.id}-cur`,
      label: currentLabel,
      note: '当前线上运行版本',
      time: skill.updatedAt,
      current: true,
    },
    {
      id: `${skill.id}-prev`,
      label: currentLabel === 'v1.1.0' ? 'v1.0.1' : 'v1.1.0',
      note: '调整意图识别与办理链路',
      time: skill.updatedAt.replace(/\d{2}:\d{2}$/, '10:20') || skill.updatedAt,
    },
    {
      id: `${skill.id}-old`,
      label: 'v1.0.0',
      note: '首次发布',
      time: skill.updatedAt.replace(/-\d{2} /, '-01 ').replace(/\d{2}:\d{2}$/, '09:00') || skill.updatedAt,
    },
  ];
}

/** 对齐“我的数字员工”卡片底栏按钮（描边 / 主操作蓝） */
const SKILL_CARD_BTN =
  'h-7 min-w-0 px-2 rounded-[6px] border shadow-[0_1px_0_rgba(0,0,0,0.05)] text-[11px] font-medium cursor-pointer transition flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none';
const SKILL_CARD_BTN_OUTLINE = cn(
  SKILL_CARD_BTN,
  'flex-1 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50',
);
/** 已发布技能三操作：图标+文案，中性描边 */
const SKILL_CARD_BTN_MANAGED = cn(
  SKILL_CARD_BTN,
  'flex-1 gap-1 border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
);
const SKILL_CARD_BTN_PRIMARY = cn(
  SKILL_CARD_BTN,
  'w-full border-[#91C5FF] bg-[#F0F7FF] text-[#0050D2] hover:bg-[#e6f1fc]',
);
const SKILL_CARD_BTN_DONE = cn(
  SKILL_CARD_BTN,
  'w-full border-neutral-200 bg-neutral-50 text-neutral-500 cursor-default',
);
const SKILL_CARD_BTN_DANGER = cn(
  SKILL_CARD_BTN,
  'shrink-0 border-neutral-200 bg-white text-neutral-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50',
);

const SUB_TABS: { key: SkillListTab; label: string }[] = [
  { key: 'mine', label: '我的技能' },
  { key: 'market', label: SKILL_PAGE_COPY.tabMarket },
];

const SKILL_ICON_FALLBACKS = [
  'solar:stars-bold',
  'solar:cpu-bolt-bold',
  'solar:bolt-bold',
  'solar:graph-up-bold',
  'solar:book-bold',
  'solar:chat-round-bold',
] as const;

function SkillListIcon({ skill }: { skill: Skill }) {
  const n = skill.name;
  let icon: string = 'solar:stars-bold';
  if (/理赔|测算|票据|保单|费用/.test(n)) icon = 'solar:document-text-bold';
  else if (/CRM|同步|建单|工单|外呼|拨号/.test(n)) icon = 'solar:routing-2-bold';
  else if (/情绪|投诉|升级|风险|监测/.test(n)) icon = 'solar:shield-warning-bold';
  else if (/物流|订单|轨迹|查询/.test(n)) icon = 'solar:graph-up-bold';
  else if (/知识|召回|润色|FAQ/.test(n)) icon = 'solar:book-bold';
  else if (/对话|消息|客服/.test(n)) icon = 'solar:chat-round-bold';
  else if (skill.kind === 'kb') icon = 'solar:book-bold';
  else if (skill.kind === 'tool') icon = 'solar:database-bold';
  else {
    let h = 0;
    for (let i = 0; i < skill.id.length; i++) h = (h * 31 + skill.id.charCodeAt(i)) >>> 0;
    icon = SKILL_ICON_FALLBACKS[h % SKILL_ICON_FALLBACKS.length];
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
      <Icon icon={icon} width={14} height={14} className="shrink-0" aria-hidden />
    </span>
  );
}

function SkillCardAction({
  skillTab,
  skill,
  onEdit,
  onSubscribe,
  onUnsubscribe,
  onDelete,
  onVersionHistory,
}: {
  skillTab: SkillListTab;
  skill: Skill;
  onEdit: () => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onDelete: () => void;
  onVersionHistory: () => void;
}) {
  const subscribe = useInlineAction(onSubscribe, { profile: 'save' });

  if (skillTab === 'market') {
    if (skill.type === 'subscribed' || subscribe.phase === 'done') {
      return (
        <button type="button" className={SKILL_CARD_BTN_DONE} disabled>
          {SKILL_PAGE_COPY.subscribed}
        </button>
      );
    }
    return (
      <button
        type="button"
        className={SKILL_CARD_BTN_PRIMARY}
        disabled={subscribe.busy}
        onClick={(e) => {
          e.stopPropagation();
          void subscribe.run();
        }}
      >
        {subscribe.busy ? (
          <MatrixLoader size={14} className="h-3.5 w-3.5" title="订阅中" />
        ) : (
          SKILL_PAGE_COPY.subscribe
        )}
      </button>
    );
  }

  if (skill.type === 'subscribed') {
    return (
      <button
        type="button"
        className={cn(SKILL_CARD_BTN_OUTLINE, 'w-full')}
        onClick={(e) => {
          e.stopPropagation();
          onUnsubscribe();
        }}
      >
        {SKILL_PAGE_COPY.unsubscribe}
      </button>
    );
  }

  /** 已发布自建：编辑 / 版本历史 / 删除 */
  if (isManagedMineSkill(skill)) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-0">
        <button
          type="button"
          className={SKILL_CARD_BTN_MANAGED}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={12} className="shrink-0" aria-hidden />
          <span className="truncate">{SKILL_PAGE_COPY.editSkill}</span>
        </button>
        <button
          type="button"
          className={SKILL_CARD_BTN_MANAGED}
          onClick={(e) => {
            e.stopPropagation();
            onVersionHistory();
          }}
        >
          <History size={12} className="shrink-0" aria-hidden />
          <span className="truncate">{SKILL_PAGE_COPY.versionHistory}</span>
        </button>
        <button
          type="button"
          className={SKILL_CARD_BTN_MANAGED}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={12} className="shrink-0" aria-hidden />
          <span className="truncate">{SKILL_PAGE_COPY.deleteMine}</span>
        </button>
      </div>
    );
  }

  /** 草稿：删除 + 继续编辑 */
  return (
    <div className="flex items-center gap-1.5 w-full min-w-0">
      {skill.type === 'mine' ? (
        <button
          type="button"
          className={SKILL_CARD_BTN_DANGER}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          {SKILL_PAGE_COPY.deleteMine}
        </button>
      ) : null}
      <button type="button" className={SKILL_CARD_BTN_OUTLINE} onClick={onEdit}>
        {skill.status === 'draft' ? '继续编辑' : SKILL_PAGE_COPY.editSkill}
      </button>
    </div>
  );
}

function isAiCreatedSkill(skill: Skill): boolean {
  return skill.source === 'nl';
}

function SkillAppliedAgentTags({
  names,
  className,
  aiCreated = false,
}: {
  names: string[];
  className?: string;
  aiCreated?: boolean;
}) {
  if (!aiCreated && names.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {aiCreated ? (
        <span
          className={cn(badgeClass('live'), 'font-medium normal-case')}
          title="由 AI 对话创建"
        >
          AI创建
        </span>
      ) : null}
      {names.map((name) => (
        <span
          key={name}
          className={cn(
            badgeClass('neutral'),
            'max-w-full truncate font-medium normal-case',
          )}
          title={`已应用于 ${name}`}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export const SkillPage: React.FC = () => {
  const {
    skills,
    deleteSkill,
    subscribeSkill,
    unsubscribeSkill,
    hiredAgents,
    showToast,
    setActiveTab,
  } = useApp();
  const [skillTab, setSkillTab] = useState<SkillListTab>('mine');
  const [search, setSearch] = useState('');
  const listBusy = useMockLatency(`skills-${skillTab}`, 'pageList');
  const [page, setPage] = useState(1);
  const [studioTarget, setStudioTarget] = useState<'create' | Skill | null>(null);
  const [createMode, setCreateMode] = useState<'interactive' | 'zip'>('interactive');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createSeedPrompt, setCreateSeedPrompt] = useState<string | null>(null);
  const [boundConfirm, setBoundConfirm] = useState<{
    skill: Skill;
    kind: 'delete' | 'unsubscribe';
  } | null>(null);
  const [versionHistorySkill, setVersionHistorySkill] = useState<Skill | null>(null);
  const createMenuCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCreateMenu = () => {
    if (createMenuCloseTimer.current) {
      clearTimeout(createMenuCloseTimer.current);
      createMenuCloseTimer.current = null;
    }
    setCreateMenuOpen(true);
  };

  const scheduleCloseCreateMenu = () => {
    if (createMenuCloseTimer.current) clearTimeout(createMenuCloseTimer.current);
    createMenuCloseTimer.current = setTimeout(() => setCreateMenuOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (createMenuCloseTimer.current) clearTimeout(createMenuCloseTimer.current);
    };
  }, []);

  const filtered = skills.filter((s) => {
    const km = s.name.toLowerCase().includes(search.toLowerCase());
    if (!km) return false;
    if (skillTab === 'mine') {
      return s.type === 'mine' || s.type === 'subscribed';
    }
    // 市场：保留已订阅项，便于按钮原地变为“已订阅”
    return s.type === 'market' || s.type === 'subscribed';
  });

  useEffect(() => {
    setPage(1);
  }, [search, skillTab]);

  const skillAgentNames = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const agent of hiredAgents) {
      for (const skillId of agent.skills ?? []) {
        const list = map.get(skillId) ?? [];
        if (!list.includes(agent.name)) list.push(agent.name);
        map.set(skillId, list);
      }
    }
    return map;
  }, [hiredAgents]);

  const pagedFiltered = paginateItems(filtered, page, LIST_PAGE_SIZE);

  const handlePublishSkill = (payload: SkillStudioPublishPayload) => {
    // 保存草稿：工作台内 Toast 已提示，留在本页；正式发布才关闭
    if (payload.draftOnly) return;
    showToast(
      payload.versionNote
        ? `${payload.name} · ${payload.versionNote}`
        : SKILL_PAGE_COPY.createSuccess,
    );
    setStudioTarget(null);
    setSkillTab('mine');
  };

  const handleDelete = (skill: Skill) => {
    const boundNames = skillAgentNames.get(skill.id) ?? [];
    if (boundNames.length > 0) {
      setBoundConfirm({ skill, kind: 'delete' });
      return;
    }
    deleteSkill(skill.id);
    showToast(SKILL_PAGE_COPY.deleteSuccess, 'error');
  };

  const handleUnsubscribe = (skill: Skill) => {
    const boundNames = skillAgentNames.get(skill.id) ?? [];
    if (boundNames.length > 0) {
      setBoundConfirm({ skill, kind: 'unsubscribe' });
      return;
    }
    unsubscribeSkill(skill.id);
    showToast(SKILL_PAGE_COPY.unsubscribeSuccess);
  };

  const confirmBoundAction = () => {
    if (!boundConfirm) return;
    const { skill, kind } = boundConfirm;
    if (kind === 'delete') {
      deleteSkill(skill.id);
      showToast(SKILL_PAGE_COPY.deleteSuccess, 'error');
    } else {
      unsubscribeSkill(skill.id);
      showToast(SKILL_PAGE_COPY.unsubscribeSuccess);
    }
    setBoundConfirm(null);
  };

  const boundConfirmNames = boundConfirm
    ? skillAgentNames.get(boundConfirm.skill.id) ?? []
    : [];

  const openCreate = (mode: 'interactive' | 'zip') => {
    setCreateMenuOpen(false);
    if (mode === 'interactive') {
      try {
        sessionStorage.setItem('js_home_create_mode', 'skill');
      } catch {
        /* ignore */
      }
      setActiveTab('platformHome');
      return;
    }
    setCreateMode(mode);
    setStudioTarget('create');
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem('js_open_skill_create') === '1') {
        sessionStorage.removeItem('js_open_skill_create');
        const seed = sessionStorage.getItem('js_skill_create_seed_prompt');
        if (seed) {
          sessionStorage.removeItem('js_skill_create_seed_prompt');
          sessionStorage.setItem('js_home_create_seed', seed);
        }
        sessionStorage.setItem('js_home_create_mode', 'skill');
        setActiveTab('platformHome');
      }
    } catch {
      /* ignore */
    }
    // 仅进入技能页时消费一次入口标记
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (studioTarget) {
    return (
      <SkillStudioWorkspace
        key={
          studioTarget === 'create'
            ? `create-${createMode}-${createSeedPrompt ?? 'blank'}`
            : studioTarget.id
        }
        editingSkill={studioTarget === 'create' ? null : studioTarget}
        onBack={() => {
          setStudioTarget(null);
          setCreateSeedPrompt(null);
        }}
        onPublish={handlePublishSkill}
        showToast={showToast}
        initialMode={studioTarget === 'create' ? createMode : 'interactive'}
        initialPrompt={studioTarget === 'create' ? createSeedPrompt : null}
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white text-neutral-800 font-sans text-xs antialiased">
      <div className="shrink-0 px-5 pt-5">
      <OnlinePageHeader title="数字员工技能">
        <div className="relative w-full sm:w-64 shrink-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder={
              skillTab === 'market' ? '搜索技能市场...' : '搜索技能...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(SEARCH_FIELD, 'w-full pl-9 pr-4')}
          />
        </div>

        {skillTab !== 'market' ? (
          <div
            className="relative shrink-0"
            onMouseEnter={openCreateMenu}
            onMouseLeave={scheduleCloseCreateMenu}
          >
            <button
              type="button"
              className={BTN_INK}
              aria-haspopup="menu"
              aria-expanded={createMenuOpen}
              onClick={() => setCreateMenuOpen((v) => !v)}
            >
              <Plus size={14} />
              <span>{SKILL_PAGE_COPY.createSkill}</span>
            </button>
            {createMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-20 pt-1 w-[280px] animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="rounded-[13px] border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(17,17,17,0.1)] overflow-hidden py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openCreate('interactive')}
                    className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 cursor-pointer flex items-start gap-2.5"
                  >
                    <Sparkles size={15} className="text-neutral-700 shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-neutral-900">
                        对话式创建
                      </span>
                      <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">
                        AI 引导生成要素，支持测试、草稿与发布
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openCreate('zip')}
                    className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 cursor-pointer flex items-start gap-2.5"
                  >
                    <UploadCloud size={15} className="text-neutral-700 shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-neutral-900">
                        上传 ZIP 压缩包
                      </span>
                      <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">
                        上传标准 .zip 资源包直接部署发布
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </OnlinePageHeader>

      <nav
        className="flex items-center gap-1 mb-5 -mt-1 overflow-x-auto"
        aria-label="技能子页"
      >
        {SUB_TABS.map((tab) => {
          const active = skillTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSkillTab(tab.key)}
              className={cn(
                'relative h-9 px-3 text-[13px] transition cursor-pointer shrink-0',
                active
                  ? 'font-semibold text-neutral-900'
                  : 'font-medium text-neutral-500 hover:text-neutral-800',
              )}
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

      <div
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5"
        onScroll={() => {
          if (createMenuOpen) setCreateMenuOpen(false);
        }}
      >
      <ContentBusy busy={listBusy} size="panel" minHeight={240}>
        {pagedFiltered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-neutral-500">
            {skillTab === 'market'
              ? SKILL_PAGE_COPY.emptyMarket
              : SKILL_PAGE_COPY.emptyList}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {pagedFiltered.map((s) => (
              <article
                key={s.id}
                className={cn(
                  CARD,
                  'hover:shadow-[0_4px_12px_rgba(31,35,41,0.08)]',
                  'group relative flex h-full flex-col p-3.5',
                )}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <SkillListIcon skill={s} />
                  <div className="min-w-0">
                    <h3
                      className="text-[13px] font-semibold text-neutral-900 leading-snug line-clamp-1"
                      title={s.name}
                    >
                      {s.name}
                    </h3>
                    {isAiCreatedSkill(s) || s.status === 'draft' ? (
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {isAiCreatedSkill(s) ? (
                          <span
                            className={cn(
                              badgeClass('live'),
                              'font-medium normal-case',
                            )}
                            title="由 AI 对话创建"
                          >
                            AI创建
                          </span>
                        ) : null}
                        {s.status === 'draft' ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                            草稿态
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <p
                  className="mt-2 text-[12px] text-neutral-500 leading-relaxed line-clamp-2 min-h-[36px]"
                  title={s.description}
                >
                  {s.description}
                </p>

                {!(skillTab === 'market' && s.type === 'subscribed') ? (
                  <SkillAppliedAgentTags
                    names={skillAgentNames.get(s.id) ?? []}
                    className="mt-2"
                  />
                ) : null}

                <div className="mt-auto pt-2.5 border-t border-neutral-100/80">
                  {(() => {
                    const actionsAlwaysOn =
                      skillTab === 'market' && s.type === 'subscribed';
                    return (
                      <>
                        {!actionsAlwaysOn ? (
                          <p
                            className={cn(
                              'text-[11px] text-neutral-400 truncate leading-7',
                              'group-hover:hidden group-focus-within:hidden',
                              'group-has-[button:disabled]:hidden',
                            )}
                            title={`${s.author} · ${s.updatedAt}`}
                          >
                            {s.author} · {s.updatedAt}
                          </p>
                        ) : null}
                        <div
                          className={cn(
                            'flex items-center min-h-7',
                            actionsAlwaysOn
                              ? 'opacity-100'
                              : cn(
                                  'hidden',
                                  'group-hover:flex group-focus-within:flex',
                                  'group-has-[button:disabled]:flex',
                                ),
                          )}
                        >
                          <SkillCardAction
                            skillTab={skillTab}
                            skill={s}
                            onEdit={() => setStudioTarget(s)}
                            onSubscribe={() => {
                              subscribeSkill(s.id);
                            }}
                            onUnsubscribe={() => handleUnsubscribe(s)}
                            onDelete={() => handleDelete(s)}
                            onVersionHistory={() => setVersionHistorySkill(s)}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </article>
            ))}
          </div>
        )}
      </ContentBusy>
      </div>

      {filtered.length > LIST_PAGE_SIZE ? (
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-neutral-200">
          <ListPagination
            page={page}
            pageSize={LIST_PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      <Modal
        open={Boolean(boundConfirm)}
        onClose={() => setBoundConfirm(null)}
        title={
          boundConfirm?.kind === 'unsubscribe'
            ? SKILL_PAGE_COPY.unsubscribeConfirmTitle
            : SKILL_PAGE_COPY.deleteConfirmTitle
        }
        description={
          boundConfirm?.kind === 'unsubscribe'
            ? SKILL_PAGE_COPY.unsubscribeConfirmDesc
            : SKILL_PAGE_COPY.deleteConfirmDesc
        }
        footer={
          <>
            <button
              type="button"
              className={BTN_SOFT}
              onClick={() => setBoundConfirm(null)}
            >
              {SKILL_PAGE_COPY.deleteCancel}
            </button>
            <button
              type="button"
              className={BTN_DANGER}
              onClick={confirmBoundAction}
            >
              {boundConfirm?.kind === 'unsubscribe'
                ? SKILL_PAGE_COPY.unsubscribeConfirmAction
                : SKILL_PAGE_COPY.deleteConfirmAction}
            </button>
          </>
        }
      >
        {boundConfirm ? (
          <SkillAppliedAgentTags
            names={boundConfirmNames}
            aiCreated={isAiCreatedSkill(boundConfirm.skill)}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(versionHistorySkill)}
        onClose={() => setVersionHistorySkill(null)}
        title={SKILL_PAGE_COPY.versionHistoryTitle}
        description={versionHistorySkill?.name}
        maxWidth="max-w-md"
      >
        {versionHistorySkill ? (
          <ul className="flex flex-col gap-2">
            {buildSkillVersionHistory(versionHistorySkill).map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-[10px] border border-neutral-200 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-semibold text-neutral-900 truncate">
                      {item.label}
                    </span>
                    {item.current ? (
                      <span className="shrink-0 text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        {SKILL_PAGE_COPY.versionHistoryCurrent}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] text-neutral-500 leading-snug">
                    {item.note}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">{item.time}</p>
                </div>
                {!item.current ? (
                  <button
                    type="button"
                    className={cn(BTN_SOFT, 'shrink-0 h-7 px-2.5 text-[11px]')}
                    onClick={() => {
                      showToast(
                        `${item.label} · ${SKILL_PAGE_COPY.versionHistoryRestored}`,
                      );
                      setVersionHistorySkill(null);
                    }}
                  >
                    {SKILL_PAGE_COPY.versionHistoryRestore}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-neutral-500">{SKILL_PAGE_COPY.versionHistoryEmpty}</p>
        )}
      </Modal>
    </div>
  );
};
