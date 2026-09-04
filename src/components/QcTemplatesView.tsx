/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检模板 — 外层模板卡片列表 + 内层规则算子详情
 */

import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Search } from '@/lib/icons';
import {
  BTN_INK,
  BTN_OUTLINE,
  BTN_TABLE,
  CARD,
  SEARCH_FIELD,
  SELECT_TRIGGER,
  badgeClass,
} from '@/lib/ui';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initialCampaigns } from '@/src/modules/qc/mockData';
import { RulesEngineView } from '@/src/modules/qc/RulesEngineView';
import type { QualityTemplate } from '@/src/modules/qc/types';
import { OnlinePageHeader, PAGE_HEADER_INSET } from './common/OnlinePageLayout';

const STATUS_FILTERS = [
  { key: 'all' as const, label: '全部状态' },
  { key: 'active' as const, label: '生效中' },
  { key: 'inactive' as const, label: '未启用' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['key'];

interface QcTemplatesViewProps {
  templates: QualityTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<QualityTemplate[]>>;
  showToast?: (message: string) => void;
}

function templateStats(templateId: string) {
  const linked = initialCampaigns.filter((c) => c.templateId === templateId);
  const running = linked.filter((c) => c.status === 'running').length;
  const avgScore =
    linked.length > 0
      ? Math.round(
          (linked.reduce((sum, c) => sum + c.averageScore, 0) / linked.length) * 10,
        ) / 10
      : null;
  return { linkedCount: linked.length, running, avgScore };
}

function weightSummary(template: QualityTemplate) {
  const { greeting, compliance, accuracy } = template.weights;
  return `礼貌${greeting}%·合规${compliance}%·准确${accuracy}%`;
}

function metaLine(template: QualityTemplate) {
  return `${template.creator} · ${template.updateTime.slice(0, 10)} · ${weightSummary(template)}`;
}

export const QcTemplatesView: React.FC<QcTemplatesViewProps> = ({
  templates,
  setTemplates,
  showToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const [menuTemplateId, setMenuTemplateId] = useState<string | null>(null);

  const statusLabel =
    STATUS_FILTERS.find((o) => o.key === statusFilter)?.label ?? '全部状态';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (statusFilter === 'active' && !t.isActive) return false;
      if (statusFilter === 'inactive' && t.isActive) return false;
      if (!q) return true;
      const hay = `${t.name} ${t.creator} ${t.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, statusFilter, search]);

  const detailTemplate = detailTemplateId
    ? templates.find((t) => t.id === detailTemplateId) ?? null
    : null;

  const handleCreateTemplate = () => {
    showToast?.('新建模板功能即将上线，可先复制现有模板后编辑');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (detailTemplateId === templateId) {
      setDetailTemplateId(null);
    }
    showToast?.(target ? `已删除「${target.name}」` : '模板已删除');
  };

  if (detailTemplate) {
    return (
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
        <div className={cn('shrink-0 border-b border-neutral-200', PAGE_HEADER_INSET, 'pb-4')}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className={cn(BTN_OUTLINE, 'h-8 px-3 shrink-0')}
              onClick={() => setDetailTemplateId(null)}
            >
              返回模板列表
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-neutral-900 tracking-tight truncate">
                {detailTemplate.name}
              </h1>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                {detailTemplate.creator} · 更新于 {detailTemplate.updateTime}
              </p>
            </div>
            {detailTemplate.isActive && (
              <span className={cn(badgeClass('success'), 'shrink-0 text-[11px]')}>
                生效中
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <RulesEngineView
            role="manager"
            templates={templates}
            setTemplates={setTemplates}
            focusTemplateId={detailTemplate.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
      <div className={cn('shrink-0', PAGE_HEADER_INSET)}>
        <OnlinePageHeader title="质检模板">
          <Select
            value={statusFilter}
            onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className={SELECT_TRIGGER} aria-label="筛选模板状态">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_FILTERS.map(({ key, label }) => (
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
              placeholder="搜索模板名称 / 创建人"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <button
            type="button"
            className={cn(BTN_INK, 'h-8 px-3.5')}
            onClick={handleCreateTemplate}
          >
            + 新建模板
          </button>
        </OnlinePageHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-3 text-neutral-500">
            <p className="text-sm">暂无匹配的质检模板</p>
            <button
              type="button"
              className={cn(BTN_INK, 'h-8 px-3')}
              onClick={handleCreateTemplate}
            >
              + 新建模板
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((template) => {
              const stats = templateStats(template.id);
              const menuOpen = menuTemplateId === template.id;
              return (
                <article
                  key={template.id}
                  className={cn(CARD, 'flex flex-col p-3 gap-2 relative min-h-0')}
                >
                  <div className="flex items-start gap-1.5 min-w-0">
                    <h3 className="flex-1 min-w-0 text-[13px] font-semibold text-neutral-900 truncate leading-snug">
                      {template.name}
                    </h3>
                    <span
                      className={cn(
                        badgeClass(template.isActive ? 'success' : 'neutral'),
                        'shrink-0 text-[10px] font-medium px-1.5 py-0',
                      )}
                    >
                      {template.isActive ? '生效中' : '未启用'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 truncate leading-relaxed">
                    {metaLine(template)}
                  </p>

                  <p className="text-[11px] text-neutral-600 tabular-nums truncate">
                    关联 {stats.linkedCount} · 运行 {stats.running}
                    {stats.avgScore != null ? ` · 均分 ${stats.avgScore}` : ''}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      className={cn(
                        BTN_TABLE,
                        'text-live border-sky-200 hover:bg-sky-50',
                      )}
                      onClick={() => setDetailTemplateId(template.id)}
                    >
                      查看详情
                    </button>
                    <button
                      type="button"
                      className={BTN_TABLE}
                      onClick={() =>
                        showToast?.(`已复制「${template.name}」为草稿，可在详情中继续编辑`)
                      }
                    >
                      复制
                    </button>

                    <div className="relative ml-auto">
                      <button
                        type="button"
                        aria-label="更多操作"
                        className={cn(
                          BTN_TABLE,
                          'px-2',
                          menuOpen && 'bg-neutral-50',
                        )}
                        onClick={() =>
                          setMenuTemplateId((id) => (id === template.id ? null : template.id))
                        }
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {menuOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="关闭菜单"
                            className="fixed inset-0 z-20 cursor-default bg-transparent"
                            onClick={() => setMenuTemplateId(null)}
                          />
                          <div className="absolute right-0 bottom-8 z-30 min-w-[120px] rounded-[10px] border border-neutral-200 bg-white p-1 shadow-[0_2px_10px_rgba(31,35,41,0.08)]">
                            <button
                              type="button"
                              className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                              onClick={() => {
                                setMenuTemplateId(null);
                                setDetailTemplateId(template.id);
                              }}
                            >
                              查看详情
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-rose-600 hover:bg-rose-50 cursor-pointer"
                              onClick={() => {
                                setMenuTemplateId(null);
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              删除模板
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
