/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  UploadCloud,
  Sparkles,
  FileText,
  Workflow,
  ShieldAlert,
  Database,
  BookOpen,
  Cpu,
  MessageSquare,
  Activity,
  Zap,
} from '@/lib/icons';
import { ListPagination, LIST_PAGE_SIZE, paginateItems } from './common/ListPagination';
import {
  SkillStudioWorkspace,
  type SkillStudioPublishPayload,
} from './skills/SkillStudioWorkspace';
import { BTN_INK, CARD, CARD_HOVER, SEARCH_FIELD, badgeClass } from '@/lib/ui';
import { OnlinePageHeader } from './common/OnlinePageLayout';
import { cn } from '@/lib/utils';
import { SKILL_PAGE_COPY } from '@/lib/platformTerminology';
import { ContentBusy } from './common/ContentBusy';
import { MatrixLoader } from './common/MatrixLoader';
import { useMockLatency } from '@/lib/useMockLatency';
import { useInlineAction } from '@/lib/useInlineAction';
import type { Skill } from '../types';

type SkillListTab = 'mine' | 'market';

/** 对齐「我的数字员工」卡片底栏按钮（描边 / 主操作蓝） */
const SKILL_CARD_BTN =
  'h-7 min-w-0 px-2 rounded-[6px] border shadow-[0_1px_0_rgba(0,0,0,0.05)] text-[11px] font-medium cursor-pointer transition flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none';
const SKILL_CARD_BTN_OUTLINE = cn(
  SKILL_CARD_BTN,
  'flex-1 border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50',
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

const SKILL_ICON_FALLBACKS = [Sparkles, Cpu, Zap, Activity, BookOpen, MessageSquare] as const;

function SkillListIcon({ skill }: { skill: Skill }) {
  const n = skill.name;
  let Icon = Sparkles;
  if (/理赔|测算|票据|保单|费用/.test(n)) Icon = FileText;
  else if (/CRM|同步|建单|工单|外呼|拨号/.test(n)) Icon = Workflow;
  else if (/情绪|投诉|升级|风险|监测/.test(n)) Icon = ShieldAlert;
  else if (/物流|订单|轨迹|查询/.test(n)) Icon = Activity;
  else if (/知识|召回|润色|FAQ/.test(n)) Icon = BookOpen;
  else if (/对话|消息|客服/.test(n)) Icon = MessageSquare;
  else if (skill.kind === 'kb') Icon = BookOpen;
  else if (skill.kind === 'tool') Icon = Database;
  else {
    let h = 0;
    for (let i = 0; i < skill.id.length; i++) h = (h * 31 + skill.id.charCodeAt(i)) >>> 0;
    Icon = SKILL_ICON_FALLBACKS[h % SKILL_ICON_FALLBACKS.length];
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
      <Icon size={14} strokeWidth={2} />
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
}: {
  skillTab: SkillListTab;
  skill: Skill;
  onEdit: () => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onDelete: () => void;
}) {
  const subscribe = useInlineAction(onSubscribe, { profile: 'save' });
  const unsubscribe = useInlineAction(onUnsubscribe, { profile: 'save', resetAfterMs: 0 });

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
        disabled={unsubscribe.busy}
        onClick={(e) => {
          e.stopPropagation();
          void unsubscribe.run();
        }}
      >
        {unsubscribe.busy ? (
          <MatrixLoader size={14} className="h-3.5 w-3.5" title="处理中" />
        ) : (
          SKILL_PAGE_COPY.unsubscribe
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 w-full min-w-0">
      {skill.type === 'mine' ? (
        <button type="button" className={SKILL_CARD_BTN_DANGER} onClick={onDelete}>
          {SKILL_PAGE_COPY.deleteMine}
        </button>
      ) : null}
      <button type="button" className={SKILL_CARD_BTN_OUTLINE} onClick={onEdit}>
        {skill.status === 'draft' ? '继续编辑' : SKILL_PAGE_COPY.editSkill}
      </button>
    </div>
  );
}

function SkillAppliedAgentTags({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {names.map((name) => (
        <span
          key={name}
          className={cn(badgeClass('neutral'), 'max-w-full truncate font-medium normal-case')}
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
  } = useApp();
  const [skillTab, setSkillTab] = useState<SkillListTab>('mine');
  const [search, setSearch] = useState('');
  const listBusy = useMockLatency(`skills-${skillTab}`, 'pageList');
  const [page, setPage] = useState(1);
  const [studioTarget, setStudioTarget] = useState<'create' | Skill | null>(null);
  const [createMode, setCreateMode] = useState<'interactive' | 'zip'>('interactive');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createSeedPrompt, setCreateSeedPrompt] = useState<string | null>(null);
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
    // 市场：保留已订阅项，便于按钮原地变为「已订阅」
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
    const bound = hiredAgents.filter((a) => a.skills.includes(skill.id)).length;
    if (bound > 0) {
      showToast(SKILL_PAGE_COPY.deleteBlocked);
      return;
    }
    deleteSkill(skill.id);
    showToast(`已删除「${skill.name}」`);
  };

  const openCreate = (mode: 'interactive' | 'zip') => {
    setCreateMode(mode);
    setCreateMenuOpen(false);
    setStudioTarget('create');
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem('js_open_skill_create') === '1') {
        sessionStorage.removeItem('js_open_skill_create');
        const seed = sessionStorage.getItem('js_skill_create_seed_prompt');
        if (seed) {
          sessionStorage.removeItem('js_skill_create_seed_prompt');
          setCreateSeedPrompt(seed);
        } else {
          setCreateSeedPrompt(null);
        }
        openCreate('interactive');
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
                className="absolute right-0 top-full z-50 pt-1 w-[280px] animate-in fade-in zoom-in-95 duration-150"
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

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5">
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
                className={cn(CARD, CARD_HOVER, 'group relative flex h-full flex-col p-3.5')}
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
                    {s.status === 'draft' ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        草稿态
                      </span>
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
                  <SkillAppliedAgentTags names={skillAgentNames.get(s.id) ?? []} />
                ) : null}

                <div className="mt-auto pt-2.5 border-t border-neutral-100/80 relative min-h-7">
                  <p
                    className="text-[11px] text-neutral-400 truncate leading-7 pr-1"
                    title={`${s.author} · ${s.updatedAt}`}
                  >
                    {s.author} · {s.updatedAt}
                  </p>
                  <div
                    className={cn(
                      'absolute inset-x-0 bottom-0 flex items-center bg-white transition-opacity duration-150',
                      skillTab === 'market' && s.type === 'subscribed'
                        ? 'opacity-100 pointer-events-auto'
                        : cn(
                            'opacity-0 pointer-events-none',
                            'group-hover:opacity-100 group-hover:pointer-events-auto',
                            'group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
                            'has-[button:disabled]:opacity-100 has-[button:disabled]:pointer-events-auto',
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
                      onUnsubscribe={() => {
                        unsubscribeSkill(s.id);
                      }}
                      onDelete={() => handleDelete(s)}
                    />
                  </div>
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
    </div>
  );
};
