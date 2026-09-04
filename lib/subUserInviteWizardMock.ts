/**
 * 子用户邀请向导 · 演示数据与工具
 */

export type InviteWizardRole = {
  id: string;
  name: string;
  tag: '系统预设' | '自定义';
  description: string;
};

export const INVITE_USER_COUNT_PRESETS = [1, 3, 5, 10, 20] as const;
export const INVITE_VALIDITY_PRESETS = [1, 6, 12, 24, 48] as const;

export const INVITE_WIZARD_ROLES: InviteWizardRole[] = [
  {
    id: 'r_admin',
    name: '超级管理员',
    tag: '系统预设',
    description: '拥有系统全部功能权限，可管理组织与配置。',
  },
  {
    id: 'r_voice_agent',
    name: '语音坐席',
    tag: '系统预设',
    description: '负责语音热线接待，可查看通话记录与质检结果。',
  },
  {
    id: 'r_agent',
    name: '坐席',
    tag: '自定义',
    description: '在线客服工作台接待，可协同数字员工处理会话。',
  },
  {
    id: 'r_voice_ops',
    name: '语音客服运营',
    tag: '自定义',
    description: '管理语音队列、排班与话术，不可直接接待客户。',
  },
  {
    id: 'r_qc',
    name: '质检员',
    tag: '自定义',
    description: '查看质检任务与申诉，不可修改系统配置。',
  },
  {
    id: 'r_skill_agent',
    name: '人工 Skill 联动接待员',
    tag: '自定义',
    description: '侧重技能与知识库联动，适合专项接待场景。',
  },
];

export const MAX_INVITE_ROLES = 10;
export const MAX_INVITE_USERS = 20;
export const MAX_INVITE_HOURS = 48;

export function clampInviteUserCount(value: number): number {
  return Math.min(MAX_INVITE_USERS, Math.max(1, Math.round(value)));
}

export function clampInviteValidityHours(value: number): number {
  return Math.min(MAX_INVITE_HOURS, Math.max(1, Math.round(value)));
}

export function buildInviteLink(token: string): string {
  return `https://jingxiaoling.jd.com/invite/join?t=${token}`;
}

export function formatInviteDeadline(hours: number): string {
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${deadline.getFullYear()}-${pad(deadline.getMonth() + 1)}-${pad(deadline.getDate())} ${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
}

export function createInviteToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
