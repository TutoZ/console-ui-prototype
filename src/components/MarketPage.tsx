/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { agentAvatarForCard } from '@/lib/agentAvatarDisplay';
import {
  JOB_FAMILY_FULL_LABELS,
  JOB_FAMILY_LABELS,
  resolveJobFamily,
} from '@/lib/jobFamily';
import { SELECT_TRIGGER } from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeHomeRelay } from './employees/relay/EmployeeHomeRelay';
import { MarketCardRelay } from './employees/relay/MarketCardRelay';
import homeStyles from './employees/relay/EmployeeHomeRelay.module.scss';
import { ContentBusy } from './common/ContentBusy';
import { useMockLatency } from '@/lib/useMockLatency';
import type { AgentMarketInfo } from '../types';

const FILTER_OPTIONS = [
  { key: 'all' as const, label: '全部' },
  { key: 'ready' as const, label: '开箱即用' },
  { key: 'custom' as const, label: '联系定制' },
] as const;

/** 与「我的数字员工」分类栏一致 */
const TYPE_OPTIONS = [
  { key: 'all' as const, label: '全部类型' },
  { key: 'customer_service' as const, label: JOB_FAMILY_FULL_LABELS.customer_service },
  { key: 'quality_inspection' as const, label: JOB_FAMILY_FULL_LABELS.quality_inspection },
  { key: 'outbound' as const, label: JOB_FAMILY_FULL_LABELS.outbound },
  { key: 'hotline' as const, label: JOB_FAMILY_FULL_LABELS.hotline },
  { key: 'collection' as const, label: JOB_FAMILY_FULL_LABELS.collection },
  { key: 'telesales' as const, label: JOB_FAMILY_FULL_LABELS.telesales },
] as const;

type CategoryFilter = (typeof FILTER_OPTIONS)[number]['key'];
type TypeFilter = (typeof TYPE_OPTIONS)[number]['key'];

export const MarketPage: React.FC = () => {
  const {
    marketAgents,
    hiredAgents,
    hireAgent,
    showToast,
    setActiveTab,
  } = useApp();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const listBusy = useMockLatency('market-cards', 'pageList');

  const handleHire = (id: string) => {
    hireAgent(id);
  };

  const filteredAgents = useMemo(() => {
    const list = marketAgents.filter((a) => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (typeFilter !== 'all' && resolveJobFamily(a) !== typeFilter) return false;
      return true;
    });

    /** 未雇佣开箱即用（立即雇佣）→ 专属定制（帮我定制一位）→ 已雇佣开箱即用（再次雇佣） */
    const sortRank = (agent: AgentMarketInfo) => {
      const isHired = hiredAgents.some((h) => h.marketId === agent.id);
      if (agent.category === 'custom') return 1;
      if (!isHired) return 0;
      return 2;
    };

    return [...list].sort((a, b) => sortRank(a) - sortRank(b));
  }, [marketAgents, filter, typeFilter, hiredAgents]);

  const filterLabel = FILTER_OPTIONS.find((o) => o.key === filter)?.label ?? '全部';

  const renderCard = (agent: AgentMarketInfo, index: number) => {
    const isHiredAlready = hiredAgents.some((h) => h.marketId === agent.id);
    const cardAvatar = agentAvatarForCard(agent.avatar, index, false);
    const family = resolveJobFamily(agent);

    return (
      <MarketCardRelay
        key={agent.id}
        name={agent.name}
        desc={agent.description}
        avatarSrc={cardAvatar.kind === 'image' ? cardAvatar.src : undefined}
        avatarEmoji={cardAvatar.kind === 'emoji' ? cardAvatar.emoji : agent.avatar}
        category={agent.category}
        jobFamilyLabel={JOB_FAMILY_LABELS[family]}
        isHiredAlready={isHiredAlready}
        onHire={() => handleHire(agent.id)}
        onCustomRequest={() => {
          showToast(
            `已收到您的定制需求。专属顾问将尽快联系您，为「${agent.name}」出具整合方案。`,
          );
          handleHire(agent.id);
        }}
      />
    );
  };

  return (
    <EmployeeHomeRelay
      activeSubTab="market"
      onStartHire={() => setActiveTab('market')}
      search=""
      onSearchChange={() => {}}
      statusFilter="all"
      onStatusFilterChange={() => {}}
    >
      <div className={homeStyles.employeeSection}>
        <div className={homeStyles.sectionHeader}>
          <div className={homeStyles.sectionTitleMain}>数字员工市场</div>
          <div className={cn(homeStyles.headerFilters, 'ml-auto items-center')}>
            <Select
              value={filter}
              onValueChange={(v) => v && setFilter(v as CategoryFilter)}
            >
              <SelectTrigger className={SELECT_TRIGGER} aria-label="按类型筛选">
                <SelectValue>{filterLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {FILTER_OPTIONS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={homeStyles.categoryBar} role="tablist" aria-label="数字员工分类">
          {TYPE_OPTIONS.map(({ key, label }) => {
            const active = typeFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(homeStyles.categoryTag, active && homeStyles.categoryTagActive)}
                onClick={() => setTypeFilter(key)}
              >
                <span className={homeStyles.categoryTagLabel}>{label}</span>
              </button>
            );
          })}
        </div>

        {listBusy ? (
          <ContentBusy busy size="panel" minHeight={220} />
        ) : filteredAgents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-500">
            当前筛选下暂无数字员工
          </div>
        ) : (
          <div className={homeStyles.cardList}>
            {filteredAgents.map((agent, index) => renderCard(agent, index))}
          </div>
        )}
      </div>
    </EmployeeHomeRelay>
  );
};
