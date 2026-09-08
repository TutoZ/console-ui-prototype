/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 数据收集卡 — 对齐 Figma B端 AI「Collect / 收集」：
 * 状态：搜索和分析资料中 / 已完成搜索和分析资料 / 已停止搜索和分析资料
 * 构成：状态头 + 展开收起 + 时间线内容（节点说明 / 检索词 / 来源）
 */

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronUp, Search } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { LoadingCircle } from '../common/ToastLoadingIcon';

export type SkillCollectStatus = 'searching' | 'done' | 'stopped';

export type SkillCollectNode = {
  id: string;
  kind: 'search' | 'read' | 'done';
  text: string;
  /** 检索词 / 文档名 pills */
  queries?: string[];
  /** 来源域名或资源名 */
  sources?: string[];
  /** 阅读完成等状态 pill */
  statusPill?: string;
};

export type SkillCollectCardProps = {
  status: SkillCollectStatus;
  nodes?: SkillCollectNode[];
  /** 收起态旁展示的资料数量文案，如「9篇资料」 */
  summaryLabel?: string;
  className?: string;
  /** 未传时：searching 默认展开，done/stopped 默认收起 */
  defaultOpen?: boolean;
};

const STATUS_LABEL: Record<SkillCollectStatus, string> = {
  searching: '搜索和分析资料中',
  done: '已完成搜索和分析资料',
  stopped: '已停止搜索和分析资料',
};

function NodeIcon({ kind }: { kind: SkillCollectNode['kind'] }) {
  if (kind === 'done') {
    return <CheckCircle2 size={14} className="shrink-0 text-[#52C41A]" strokeWidth={2} />;
  }
  if (kind === 'read') {
    return <BookOpen size={14} className="shrink-0 text-[#8C8C8C]" strokeWidth={2} />;
  }
  return <Search size={14} className="shrink-0 text-[#8C8C8C]" strokeWidth={2} />;
}

function CollectPill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded px-2 py-1 bg-[#F7F8FA] text-[12px] leading-[18px] text-[#515357]">
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

export const SkillCollectCard: React.FC<SkillCollectCardProps> = ({
  status,
  nodes = [],
  summaryLabel,
  className,
  defaultOpen,
}) => {
  const [open, setOpen] = useState(() => defaultOpen ?? status === 'searching');

  useEffect(() => {
    if (status === 'searching') setOpen(true);
    else if (status === 'done' || status === 'stopped') setOpen(false);
  }, [status]);

  const headerLabel = STATUS_LABEL[status];
  const showSummary = !open && Boolean(summaryLabel) && status !== 'searching';

  const visibleNodes = useMemo(() => nodes, [nodes]);

  return (
    <div className={cn('w-full min-w-0 font-sans', className)}>
      <div className="overflow-hidden rounded-lg border border-[#E6E7EB] bg-white">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer select-none"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {status === 'searching' ? (
              <span className="skill-thinking-generating-title text-[14px] font-semibold leading-[22px]">
                {headerLabel}
              </span>
            ) : (
              <span className="text-[14px] font-semibold leading-[22px] text-[#515357]">
                {headerLabel}
              </span>
            )}
            {showSummary ? (
              <span className="inline-flex items-center gap-1 text-[14px] leading-[22px] text-[#515357] shrink-0">
                {summaryLabel}
              </span>
            ) : null}
            {status === 'searching' ? (
              <LoadingCircle size={12} className="shrink-0" title="收集中" />
            ) : null}
          </div>
          <ChevronUp
            size={14}
            className={cn(
              'shrink-0 text-[#8C8C8C] transition-transform duration-200',
              !open && 'rotate-180',
            )}
          />
        </button>

        {open && visibleNodes.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar-thin px-3 pb-3">
            <div className="flex flex-col">
              {visibleNodes.map((node, idx) => {
                const isLast = idx === visibleNodes.length - 1;
                return (
                  <div key={node.id} className="flex gap-3 items-stretch">
                    <div className="flex w-3.5 shrink-0 flex-col items-center">
                      <span className="flex h-[22px] items-center justify-center">
                        <NodeIcon kind={node.kind} />
                      </span>
                      {!isLast ? (
                        <span
                          className="w-px flex-1 min-h-[12px] border-l border-dashed border-[#D9D9D9]"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <div className={cn('min-w-0 flex-1 pb-6', isLast && 'pb-0')}>
                      <p
                        className={cn(
                          'text-[14px] leading-[22px] text-[#1C1D1F]',
                          status === 'searching' && isLast && 'skill-collect-body-shimmer',
                        )}
                      >
                        {node.text}
                      </p>
                      {(node.queries?.length || node.sources?.length || node.statusPill) && (
                        <div className="mt-2 flex flex-col gap-2">
                          {node.queries && node.queries.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {node.queries.map((q) => (
                                <CollectPill
                                  key={q}
                                  icon={<Search size={12} className="shrink-0 text-[#8C8C8C]" />}
                                >
                                  {q}
                                </CollectPill>
                              ))}
                            </div>
                          ) : null}
                          {node.sources && node.sources.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {node.sources.map((s) => (
                                <CollectPill key={s}>{s}</CollectPill>
                              ))}
                            </div>
                          ) : null}
                          {node.statusPill ? (
                            <div className="flex flex-wrap gap-2">
                              <CollectPill
                                icon={<BookOpen size={12} className="shrink-0 text-[#8C8C8C]" />}
                              >
                                {node.statusPill}
                              </CollectPill>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
