/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 员工岗前工作台顶栏 Tab — 立即雇佣后老板管理该数字员工
 * 员工知识 / 数字员工技能已下沉到「入职培训」左侧 ConfigSection，不再出现在顶栏。
 */

import { LIFECYCLE_TERMS, NAV_TERMS } from './platformTerminology';

/** 含历史 id，便于兼容旧状态；展示时请用 normalizeOnboardingWorkspaceTab */
export type OnboardingWorkspaceTabId = 'build' | 'channels' | 'kb' | 'skills';

export type OnboardingWorkspaceVisibleTabId = 'build' | 'channels';

export interface OnboardingWorkspaceTabDef {
  id: OnboardingWorkspaceVisibleTabId;
  label: string;
}

export const ONBOARDING_WORKSPACE_TABS: readonly OnboardingWorkspaceTabDef[] = [
  { id: 'build', label: LIFECYCLE_TERMS.onboardExam },
  { id: 'channels', label: NAV_TERMS.dispatchChannels },
] as const;

export const DEFAULT_ONBOARDING_WORKSPACE_TAB: OnboardingWorkspaceVisibleTabId = 'build';

export function normalizeOnboardingWorkspaceTab(
  id: string | null | undefined,
): OnboardingWorkspaceVisibleTabId {
  if (id === 'channels') return 'channels';
  return 'build';
}

export function isOnboardingWorkspaceTab(id: string): id is OnboardingWorkspaceTabId {
  return id === 'build' || id === 'channels' || id === 'kb' || id === 'skills';
}
