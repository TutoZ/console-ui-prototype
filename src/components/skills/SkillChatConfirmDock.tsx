/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 会话内确认卡：对齐参考稿交互——白卡片 + 待确认角标 + 全宽墨黑 CTA 桥接右侧配置台。
 */

import React from 'react';
import { Check, ChevronRight } from '@/lib/icons';
import { confirmStatusBadgeClass, FIELD, FIELD_CTRL } from '@/lib/ui';
import { cn } from '@/lib/utils';
import type { SkillThinkStep } from '@/lib/skillStudioMock';
import { SkillThinkingCard } from './SkillThinkingCard';
import {
  SkillInterviewConfirm,
  type SkillInterviewConfirmProps,
} from './SkillInterviewConfirm';

/** 左坞轻量可编辑的 Skill 摘要（与右栏表单同源字段） */
export type SkillDockDraft = {
  nameCn: string;
  nameEn: string;
  purpose: string;
  triggerWhen: string;
  triggerForbidden: string;
  outputs: string;
};

export type SkillChatConfirmDockProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thinking?: boolean;
  thinkSteps?: SkillThinkStep[];
  draft: SkillDockDraft;
  onDraftChange: (patch: Partial<SkillDockDraft>) => void;
  onConfirmDraft?: () => void;
  /** 去右侧配置台核对（展开右栏），不立刻确认 */
  onGoSceneConfirm?: () => void;
  draftConfirmed?: boolean;
  onGoTest?: () => void;
  onGoPublish?: () => void;
  interview?: Omit<SkillInterviewConfirmProps, 'className'> | null;
  className?: string;
  collapsedLabel?: string;
};

const DEFAULT_THINK_STEPS: SkillThinkStep[] = [
  {
    id: 't1',
    label: '理解业务意图',
    detail: '解析用户描述与触发边界',
    status: 'done',
  },
  {
    id: 't2',
    label: '拆解技能要素',
    detail: '对齐定义 / 主体 / 规范',
    status: 'running',
  },
  {
    id: 't3',
    label: '生成可确认草案',
    detail: '写入确认卡片',
    status: 'pending',
  },
];

export const SkillChatConfirmDock: React.FC<SkillChatConfirmDockProps> = ({
  open,
  onOpenChange,
  thinking = false,
  thinkSteps = DEFAULT_THINK_STEPS,
  draft,
  onDraftChange,
  onConfirmDraft,
  onGoSceneConfirm,
  draftConfirmed = false,
  onGoTest,
  onGoPublish,
  interview = null,
  className,
}) => {
  const hasDraft = Boolean(draft.nameCn.trim() || draft.purpose.trim() || draft.triggerWhen.trim());
  const showBar = thinking || hasDraft || Boolean(interview && interview.mode !== 'idle');

  if (!showBar) return null;

  const metaParts = [draft.nameEn, draft.purpose, draft.triggerWhen].filter((p) => p.trim());

  return (
    <div className={cn('space-y-2.5', className)}>
      {thinking && (
        <SkillThinkingCard
          title="思考过程"
          steps={thinkSteps}
          isComplete={false}
          className="!ml-0 mr-0"
        />
      )}

      {!thinking && hasDraft && (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <h4 className="text-[13px] font-semibold text-neutral-900 leading-snug flex-1 min-w-0">
                {draft.nameCn || '未命名技能'}
              </h4>
              <span
                className={confirmStatusBadgeClass(
                  draftConfirmed ? 'confirmedSoft' : 'pending',
                )}
              >
                {draftConfirmed ? '已确认' : '待确认'}
              </span>
            </div>

            {metaParts.length > 0 && (
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {metaParts.join(' · ')}
              </p>
            )}

            {open && (
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">技能名称</p>
                  <input
                    className={cn(FIELD, FIELD_CTRL)}
                    value={draft.nameCn}
                    maxLength={30}
                    placeholder="京东延保进度查询助手"
                    onChange={(e) => onDraftChange({ nameCn: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">能力简介</p>
                  <input
                    className={cn(FIELD, FIELD_CTRL)}
                    value={draft.purpose}
                    maxLength={50}
                    placeholder="查询京东延保服务单状态与处理进度"
                    onChange={(e) => onDraftChange({ purpose: e.target.value })}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">触发条件</p>
                  <input
                    className={cn(FIELD, FIELD_CTRL)}
                    value={draft.triggerWhen}
                    maxLength={50}
                    placeholder="用户问延保进度时"
                    onChange={(e) => onDraftChange({ triggerWhen: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="text-[10px] text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  onClick={() => onOpenChange(false)}
                >
                  收起轻量编辑
                </button>
              </div>
            )}

            {!open && !draftConfirmed && (
              <button
                type="button"
                className="text-[10px] text-neutral-400 hover:text-neutral-700 cursor-pointer"
                onClick={() => onOpenChange(true)}
              >
                轻量改关键句
              </button>
            )}
          </div>

          {!draftConfirmed && (onGoSceneConfirm || onConfirmDraft) && (
            <div className="px-4 pb-4 space-y-2">
              {onGoSceneConfirm && (
                <button
                  type="button"
                  onClick={onGoSceneConfirm}
                  className="w-full h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  去配置台确认草案
                  <ChevronRight size={15} />
                </button>
              )}
              {onConfirmDraft && (
                <button
                  type="button"
                  onClick={onConfirmDraft}
                  className={cn(
                    'w-full rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition',
                    onGoSceneConfirm
                      ? 'h-9 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-[12px]'
                      : 'h-10 bg-neutral-900 hover:bg-neutral-800 text-white text-[13px]',
                  )}
                >
                  <Check size={13} />
                  {onGoSceneConfirm ? '直接确认' : '确认草案'}
                </button>
              )}
            </div>
          )}

          {draftConfirmed && (
            <div className="px-4 pb-4 flex gap-2">
              {onGoTest && (
                <button
                  type="button"
                  className="flex-1 h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] font-semibold cursor-pointer transition"
                  onClick={onGoTest}
                >
                  测一条用例
                </button>
              )}
              {onGoPublish && (
                <button
                  type="button"
                  className="flex-1 h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-[12px] font-semibold cursor-pointer transition"
                  onClick={onGoPublish}
                >
                  校验发布
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {interview && interview.mode !== 'idle' && interview.card && (
        <SkillInterviewConfirm {...interview} className="!mx-0 mb-0" />
      )}
    </div>
  );
};
