/**
 * 数字员工创建方式：卡片角标与创建弹窗共用。
 * 卡片展示仅两种：自主规划（ai / manual）· 预设流程（workflow）。
 */

import type { LucideIcon } from '@/lib/icons';
import { Pencil, Wand2, Workflow } from '@/lib/icons';
import type { HiredAgent } from '@/src/types';

export type EmployeeCreateMethod = 'ai' | 'manual' | 'workflow';

/** 卡片上的对外展示口径（仅两种） */
export type EmployeeCreateDisplayKind = 'autonomous' | 'preset';

export const CREATE_METHOD_META: Record<
  EmployeeCreateMethod,
  { label: string; tagLabel: string; Icon: LucideIcon }
> = {
  ai: { label: 'AI搭建', tagLabel: '自主规划', Icon: Wand2 },
  manual: { label: 'Loop手动创建', tagLabel: '自主规划', Icon: Pencil },
  workflow: { label: '流程编排', tagLabel: '预设流程', Icon: Workflow },
};

export const CREATE_METHOD_DISPLAY_META: Record<
  EmployeeCreateDisplayKind,
  { tagLabel: string }
> = {
  autonomous: { tagLabel: '自主规划' },
  preset: { tagLabel: '预设流程' },
};

export function resolveCreateMethodDisplay(
  method: EmployeeCreateMethod,
): EmployeeCreateDisplayKind {
  return method === 'workflow' ? 'preset' : 'autonomous';
}

/** 缺省字段时：预设流程 → workflow；其余按自主规划（ai） */
export function resolveEmployeeCreateMethod(
  agent: Pick<HiredAgent, 'createMethod' | 'buildMode'>,
): EmployeeCreateMethod {
  if (agent.createMethod) return agent.createMethod;
  if (agent.buildMode === 'preset') return 'workflow';
  return 'ai';
}
