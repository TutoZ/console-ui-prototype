/**
 * 数字员工创建方式：卡片角标与创建弹窗共用。
 */

import type { LucideIcon } from '@/lib/icons';
import { Pencil, Wand2, Workflow } from '@/lib/icons';
import type { HiredAgent } from '@/src/types';

export type EmployeeCreateMethod = 'ai' | 'manual' | 'workflow';

export const CREATE_METHOD_META: Record<
  EmployeeCreateMethod,
  { label: string; tagLabel: string; Icon: LucideIcon }
> = {
  ai: { label: 'AI搭建', tagLabel: 'AI搭建', Icon: Wand2 },
  manual: { label: 'Loop手动创建', tagLabel: '手动创建', Icon: Pencil },
  workflow: { label: '流程编排', tagLabel: '流程编排', Icon: Workflow },
};

/** 缺省字段时：预设流程 → 流程编排；其余按 AI搭建（市场雇佣等） */
export function resolveEmployeeCreateMethod(
  agent: Pick<HiredAgent, 'createMethod' | 'buildMode'>,
): EmployeeCreateMethod {
  if (agent.createMethod) return agent.createMethod;
  if (agent.buildMode === 'preset') return 'workflow';
  return 'ai';
}
