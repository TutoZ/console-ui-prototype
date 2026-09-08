/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 雇佣员工向导 — 4 步流程（市场 → 培训 → 配置 → 派发/上线）
 */

export const ONBOARDING_STEP_COUNT = 4;

/** A5 仅作“向导已完成”内部态，不在步骤列表展示 */
export type OnboardingDemoStep = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export const ONBOARDING_DEMO_STEPS: OnboardingDemoStep[] = [
  'A1',
  'A2',
  'A3',
  'A4',
];

export interface OnboardingStepDef {
  n: number;
  title: string;
  demoStep: OnboardingDemoStep;
  tab: 'market' | 'employees' | 'staff';
  /** 跳转时打开最近雇佣员工的入职培训页 */
  openOnboarding?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    n: 1,
    title: '在市场挑一个数字员工并雇佣',
    demoStep: 'A1',
    tab: 'market',
  },
  {
    n: 2,
    title: '在我的数字员工点击培训',
    demoStep: 'A2',
    tab: 'employees',
  },
  {
    n: 3,
    title: '填写员工信息并保存配置',
    demoStep: 'A3',
    tab: 'employees',
    openOnboarding: true,
  },
  {
    n: 4,
    title: '在我的数字员工点击派发任务或上线',
    demoStep: 'A4',
    tab: 'employees',
  },
];

export function isOnboardingDemoStep(step: string | null | undefined): step is OnboardingDemoStep {
  return (
    step === 'A1' ||
    step === 'A2' ||
    step === 'A3' ||
    step === 'A4' ||
    step === 'A5'
  );
}

/** 当前 demoStep 下已完成步数（A2 → 已完成 1 步；A5 → 全部完成） */
export function onboardingCompletedCount(demoStep: string | null, hasOnlineAgent = false): number {
  if (demoStep === 'A5') return ONBOARDING_STEP_COUNT;
  if (demoStep === 'A1' || demoStep === 'A2' || demoStep === 'A3' || demoStep === 'A4') {
    return ONBOARDING_DEMO_STEPS.indexOf(demoStep);
  }
  if (hasOnlineAgent) return ONBOARDING_STEP_COUNT;
  return 0;
}

export function onboardingProgressPercent(demoStep: string | null, hasOnlineAgent = false): number {
  const completed = onboardingCompletedCount(demoStep, hasOnlineAgent);
  return Math.round((completed / ONBOARDING_STEP_COUNT) * 100);
}

export function resolveOnboardingStepState(
  demoStep: string | null,
  stepDemoKey: OnboardingDemoStep,
  hasOnlineAgent = false,
): { done: boolean; active: boolean } {
  if (demoStep === 'A5' || (hasOnlineAgent && !isOnboardingDemoStep(demoStep))) {
    return { done: true, active: false };
  }
  if (demoStep !== 'A1' && demoStep !== 'A2' && demoStep !== 'A3' && demoStep !== 'A4') {
    return { done: false, active: false };
  }
  const currentIdx = ONBOARDING_DEMO_STEPS.indexOf(demoStep);
  const stepIdx = ONBOARDING_DEMO_STEPS.indexOf(stepDemoKey);
  if (stepIdx < 0) {
    return { done: false, active: false };
  }
  return {
    done: currentIdx > stepIdx,
    active: currentIdx === stepIdx,
  };
}
