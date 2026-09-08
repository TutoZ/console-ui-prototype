/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 数字员工岗位族工具
 */

import type { HiredAgent, JobFamily, QcProfile, QcScoreGrade } from '@/src/types';
import {
  navDomainToAppTab,
  type DomainOpsMainTab,
  type NavDomain,
  type QcAppMainTab,
  type QcRailTab,
} from '@/lib/navDomain';
import {
  areAllQcStandardItemsComplete,
  createEmptyStandardTree,
  isQcStandardConfigured,
} from '@/lib/qcStandards';

export const JOB_FAMILY_LABELS: Record<JobFamily, string> = {
  customer_service: '客服',
  quality_inspection: '质检',
  outbound: '外呼',
  hotline: '热线',
  collection: '催收',
  telesales: '电销',
  followup: '随访',
  other: '其他',
};

/** 分类筛选 / 列表展示用完整名称（对齐一级导航域标题） */
export const JOB_FAMILY_FULL_LABELS: Record<JobFamily, string> = {
  customer_service: '在线客服',
  quality_inspection: '智能质检',
  outbound: '智能外呼',
  hotline: '热线客服',
  collection: '电话催收',
  telesales: '电话销售',
  followup: '智能随访',
  other: '其他',
};

/** 我的数字员工页 — 显性分类展示顺序 */
export const EMPLOYEE_CATEGORY_ORDER: readonly JobFamily[] = [
  'customer_service',
  'quality_inspection',
  'outbound',
  'hotline',
  'collection',
  'telesales',
  'other',
] as const;

export function resolveEmployeeCategory(
  agent: Pick<HiredAgent, 'jobFamily' | 'marketId'> | null | undefined,
): JobFamily {
  if (!agent) return 'customer_service';
  if (agent.jobFamily) return agent.jobFamily;
  if (agent.marketId === 'm_custom_gen') return 'other';
  return 'customer_service';
}

/** 业务域型岗位（雇佣后启用左侧对应域导航，主按钮含派发任务） */
export const DOMAIN_OPS_FAMILIES: readonly JobFamily[] = [
  'quality_inspection',
  'outbound',
  'hotline',
  'collection',
  'telesales',
  'followup',
] as const;

/** 不支持上岗/下岗：雇佣即可用，卡片不展示上岗/下岗 */
export const NO_DUTY_TOGGLE_FAMILIES: readonly JobFamily[] = [
  'quality_inspection',
  'outbound',
  'hotline',
  'collection',
  'telesales',
] as const;

export function resolveJobFamily(
  agent: Pick<HiredAgent, 'jobFamily'> | { jobFamily?: JobFamily } | null | undefined,
): JobFamily {
  return agent?.jobFamily ?? 'customer_service';
}

export function isQcAgent(agent: Pick<HiredAgent, 'jobFamily'> | null | undefined): boolean {
  return resolveJobFamily(agent) === 'quality_inspection';
}

export function isDomainOpsAgent(
  agent: Pick<HiredAgent, 'jobFamily'> | { jobFamily?: JobFamily } | null | undefined,
): boolean {
  return DOMAIN_OPS_FAMILIES.includes(resolveJobFamily(agent));
}

/** 在线客服 / 其他 / 智能随访支持上岗、下岗；其余业务域不支持 */
export function supportsDutyToggle(
  agent: Pick<HiredAgent, 'jobFamily'> | { jobFamily?: JobFamily } | null | undefined,
): boolean {
  return !NO_DUTY_TOGGLE_FAMILIES.includes(resolveJobFamily(agent));
}

/** 不支持上岗的岗位视为始终可用；其余看 status */
export function isAgentOnDuty(
  agent: Pick<HiredAgent, 'jobFamily' | 'status'> | null | undefined,
): boolean {
  if (!agent) return false;
  if (!supportsDutyToggle(agent)) return true;
  return agent.status === 'online';
}

export function jobFamilyToNavDomain(family: JobFamily): NavDomain | null {
  switch (family) {
    case 'customer_service':
      return 'online';
    case 'quality_inspection':
      return 'qc';
    case 'outbound':
      return 'outbound';
    case 'hotline':
      return 'hotline';
    case 'collection':
      return 'collection';
    case 'telesales':
      return 'telesales';
    case 'followup':
      return 'followup';
    default:
      return null;
  }
}

/** 从员工卡跳进业务域后自动打开的弹窗 */
export type PendingOpsAction =
  | 'create-script'
  | 'create-task'
  | 'create-plan'
  | 'create-collection-task'
  | 'open-task-center'
  | null;

export type JobFamilyCapability = 'training' | 'dispatch';

type JobFamilyNavApi = {
  setNavDomain: (domain: NavDomain) => void;
  setActiveTab: (tab: string) => void;
  setDomainOpsTab: (tab: DomainOpsMainTab) => void;
  setQcRailTab?: (tab: QcRailTab) => void;
  setQcMainTab?: (tab: QcAppMainTab) => void;
};

function applyDomainNavigation(domain: NavDomain, api: JobFamilyNavApi, opsTab: DomainOpsMainTab) {
  const tab = navDomainToAppTab(domain);
  if (tab) api.setActiveTab(tab);
  else api.setNavDomain(domain);
  // setActiveTab 会按域重置二级 Tab，必须在其后覆盖到目标页
  api.setDomainOpsTab(opsTab);
}

export function pendingOpsActionFor(
  family: JobFamily,
  capability: JobFamilyCapability,
): PendingOpsAction {
  if (capability === 'training') {
    if (family === 'outbound' || family === 'hotline') return 'create-script';
    return null;
  }
  if (family === 'outbound') return 'create-task';
  if (family === 'quality_inspection') return 'create-plan';
  if (family === 'collection') return 'create-collection-task';
  if (family === 'hotline' || family === 'telesales' || family === 'followup') {
    return 'open-task-center';
  }
  return null;
}

/** 培训 / 派发任务：跳到岗位对应一级导航下的员工培训或任务下发 */
export function navigateToJobFamilyCapability(
  family: JobFamily,
  capability: JobFamilyCapability,
  api: JobFamilyNavApi,
): NavDomain | 'staff' {
  const domain = jobFamilyToNavDomain(family);
  if (!domain) {
    api.setActiveTab('staff');
    return 'staff';
  }

  if (domain === 'online') {
    api.setActiveTab(capability === 'training' ? 'training' : 'employees');
    return domain;
  }

  if (domain === 'qc') {
    api.setActiveTab('qcWorkspace');
    api.setQcRailTab?.('workspace');
    api.setQcMainTab?.(capability === 'training' ? 'templates' : 'plans');
    return domain;
  }

  const opsTab: DomainOpsMainTab =
    capability === 'training'
      ? domain === 'outbound'
        ? 'training'
        : domain === 'hotline'
          ? 'agents'
          : domain === 'collection'
            ? 'monitor'
            : 'overview'
      : domain === 'outbound'
        ? 'tasks'
        : domain === 'hotline'
          ? 'agents'
          : domain === 'collection'
            ? 'case_orders'
            : 'dispatch';

  applyDomainNavigation(domain, api, opsTab);
  return domain;
}

/** “派发任务”：跳到岗位对应左侧业务域（客服进管理区·员工分配） */
export function navigateToJobFamilyApp(
  family: JobFamily,
  api: JobFamilyNavApi,
): NavDomain | 'staff' {
  return navigateToJobFamilyCapability(family, 'dispatch', api);
}

export function createDefaultScoreGrades(): QcScoreGrade[] {
  return [];
}

export function createDefaultQcProfile(): QcProfile {
  return {
    standardConfigured: false,
    standard: createEmptyStandardTree(),
    passScore: 80,
    templateName: '质检模板配置',
    baseScore: 100,
    scoreGrades: createDefaultScoreGrades(),
    scoringLogic: 'deduction',
    scoreMax: 100,
    scoreMin: 0,
    defaultSource: 'platform_cs_sessions',
    defaultTargetScope: 'all_online_cs',
    defaultTargetAgentIds: [],
    trainingTestPassed: false,
  };
}

/** 兼容旧雇佣数据（去掉权重/禁语模板字段，补齐标准树） */
export function normalizeQcProfile(profile?: QcProfile | null): QcProfile {
  const base = createDefaultQcProfile();
  if (!profile) return base;
  const standard = profile.standard?.categories
    ? profile.standard
    : createEmptyStandardTree();
  const grades = Array.isArray(profile.scoreGrades)
    ? profile.scoreGrades.map((g, i) => ({
        id: g.id || `grade_${i}`,
        min: typeof g.min === 'number' && Number.isFinite(g.min) ? g.min : undefined,
        max: typeof g.max === 'number' && Number.isFinite(g.max) ? g.max : undefined,
        label: g.label ?? '',
      }))
    : [];
  const next: QcProfile = {
    ...base,
    ...profile,
    standard,
    passScore: profile.passScore ?? base.passScore,
    templateName: profile.templateName?.trim() || base.templateName,
    baseScore: Number.isFinite(profile.baseScore as number)
      ? Number(profile.baseScore)
      : base.baseScore,
    scoreGrades: grades,
    scoringLogic: 'deduction',
    scoreMax: Number.isFinite(profile.scoreMax as number)
      ? Number(profile.scoreMax)
      : base.scoreMax,
    scoreMin: Number.isFinite(profile.scoreMin as number)
      ? Number(profile.scoreMin)
      : base.scoreMin,
  };
  next.standardConfigured = isQcStandardConfigured(next.standard);
  return next;
}

/** 完成培训闸门：全部标准字段配齐 + 能力测试通过 */
export function isQcTrainingComplete(profile?: QcProfile | null): boolean {
  if (!profile) return false;
  const p = normalizeQcProfile(profile);
  return (
    areAllQcStandardItemsComplete(p.standard) &&
    isQcStandardConfigured(p.standard) &&
    p.trainingTestPassed
  );
}
