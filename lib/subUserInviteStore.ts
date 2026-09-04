/**
 * 子用户邀请 · 本地演示存储（邀请链接 / 申请 / 通知联动）
 */

import type { NavNotification, SubUserJoinApplication } from '@/lib/navNotificationsMock';
import { SUB_USER_JOIN_APPLICATIONS, PROCESSED_SUB_USER_JOIN_APPLICATIONS } from '@/lib/navNotificationsMock';

export const INVITE_STORE_KEY = 'js_sub_user_invite_store_v1';
export const INVITE_STORE_EVENT = 'js-sub-user-invite-changed';

export type InviteLoginMethod = 'jd' | 'wechat';
export type InviteCampaignStatus = 'online' | 'offline';

export type InviteCampaign = {
  token: string;
  companyName: string;
  masterAccount: string;
  masterAccountId: string;
  userCount: number;
  validityHours: number;
  presetRoles: string[];
  roleIds: string[];
  link: string;
  createdAt: string;
  deadline: string;
  usedCount: number;
  loginMethod: InviteLoginMethod;
  status: InviteCampaignStatus;
  creatorName: string;
  creatorRole: '主账号' | '子用户';
};

function formatStoreDateTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatInviteCampaignValidity(campaign: InviteCampaign): string {
  return `${formatStoreDateTime(campaign.createdAt)} 至 ${campaign.deadline}`;
}

/** 链接管理表格 · 仅展示截止时刻 */
export function formatInviteCampaignDeadline(campaign: InviteCampaign): string {
  return campaign.deadline;
}

export function getInviteCampaignStatusLabel(campaign: InviteCampaign): {
  label: string;
  tone: 'online' | 'offline' | 'expired' | 'full';
} {
  if (campaign.status === 'offline') {
    return { label: '已下线', tone: 'offline' };
  }
  if (campaign.usedCount >= campaign.userCount) {
    return { label: '名额已满', tone: 'full' };
  }
  const deadline = Date.parse(campaign.deadline.replace(' ', 'T'));
  if (!Number.isNaN(deadline) && Date.now() > deadline) {
    return { label: '已过期', tone: 'expired' };
  }
  return { label: '在线', tone: 'online' };
}

export type StoredSubUserApplication = SubUserJoinApplication & {
  inviteToken?: string;
};

type InviteStore = {
  campaigns: InviteCampaign[];
  applications: StoredSubUserApplication[];
};

const DEFAULT_COMPANY = '京小灵演示企业';

function normalizeCampaign(raw: Partial<InviteCampaign> & Pick<InviteCampaign, 'token'>): InviteCampaign {
  return {
    token: raw.token,
    companyName: raw.companyName ?? DEFAULT_COMPANY,
    masterAccount: raw.masterAccount ?? 'jd_corp_master***',
    masterAccountId: raw.masterAccountId ?? 'ACC-89219842',
    userCount: raw.userCount ?? 1,
    validityHours: raw.validityHours ?? 24,
    presetRoles: raw.presetRoles ?? ['坐席'],
    roleIds: raw.roleIds ?? ['r_agent'],
    link: raw.link ?? buildInviteLinkFallback(raw.token),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    deadline: raw.deadline ?? formatStoreDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    usedCount: raw.usedCount ?? 0,
    loginMethod: raw.loginMethod ?? 'jd',
    status: raw.status ?? 'online',
    creatorName: raw.creatorName ?? 'cooper',
    creatorRole: raw.creatorRole ?? '主账号',
  };
}

function buildInviteLinkFallback(token: string): string {
  return `https://jingxiaoling.jd.com/invite/join?t=${token}`;
}

function readStore(): InviteStore {
  try {
    const raw = localStorage.getItem(INVITE_STORE_KEY);
    if (!raw) return seedStore();
    const parsed = JSON.parse(raw) as InviteStore;
    if (!parsed?.applications || !parsed?.campaigns) return seedStore();
    return {
      applications: parsed.applications,
      campaigns: parsed.campaigns.map((item) => normalizeCampaign(item)),
    };
  } catch {
    return seedStore();
  }
}

function writeStore(store: InviteStore) {
  localStorage.setItem(INVITE_STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(INVITE_STORE_EVENT));
}

function seedStore(): InviteStore {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const mkDeadline = (hours: number) => formatStoreDateTime(new Date(now + hours * hour));

  const demoCampaigns: InviteCampaign[] = [
    {
      token: 'demo-jd-001',
      companyName: DEFAULT_COMPANY,
      masterAccount: 'jd_corp_master***',
      masterAccountId: 'ACC-89219842',
      userCount: 1,
      validityHours: 1,
      presetRoles: ['坐席'],
      roleIds: ['r_agent'],
      link: 'https://jingxiaoling.jd.com/invite/join?t=demo-jd-001',
      createdAt: new Date(now - 2 * hour).toISOString(),
      deadline: mkDeadline(1),
      usedCount: 0,
      loginMethod: 'jd',
      status: 'online',
      creatorName: 'cooper',
      creatorRole: '主账号',
    },
    {
      token: 'demo-jd-002',
      companyName: DEFAULT_COMPANY,
      masterAccount: 'jd_corp_master***',
      masterAccountId: 'ACC-89219842',
      userCount: 3,
      validityHours: 24,
      presetRoles: ['语音坐席', '超级管理员'],
      roleIds: ['r_voice_agent', 'r_admin'],
      link: 'https://jingxiaoling.jd.com/invite/join?t=demo-jd-002',
      createdAt: new Date(now - 6 * hour).toISOString(),
      deadline: mkDeadline(24),
      usedCount: 2,
      loginMethod: 'jd',
      status: 'online',
      creatorName: 'cooper',
      creatorRole: '主账号',
    },
    {
      token: 'demo-wx-001',
      companyName: DEFAULT_COMPANY,
      masterAccount: 'jd_corp_master***',
      masterAccountId: 'ACC-89219842',
      userCount: 1,
      validityHours: 12,
      presetRoles: ['超级管理员'],
      roleIds: ['r_admin'],
      link: 'https://jingxiaoling.jd.com/invite/join?t=demo-wx-001',
      createdAt: new Date(now - 3 * hour).toISOString(),
      deadline: mkDeadline(12),
      usedCount: 0,
      loginMethod: 'wechat',
      status: 'online',
      creatorName: 'cooper',
      creatorRole: '主账号',
    },
    {
      token: 'demo-jd-003',
      companyName: DEFAULT_COMPANY,
      masterAccount: 'jd_corp_master***',
      masterAccountId: 'ACC-89219842',
      userCount: 2,
      validityHours: 48,
      presetRoles: ['语音坐席', '超级管理员'],
      roleIds: ['r_voice_agent', 'r_admin'],
      link: 'https://jingxiaoling.jd.com/invite/join?t=demo-jd-003',
      createdAt: new Date(now - 12 * hour).toISOString(),
      deadline: mkDeadline(48),
      usedCount: 2,
      loginMethod: 'jd',
      status: 'online',
      creatorName: 'cooper',
      creatorRole: '主账号',
    },
    {
      token: 'demo-wx-002',
      companyName: DEFAULT_COMPANY,
      masterAccount: 'jd_corp_master***',
      masterAccountId: 'ACC-89219842',
      userCount: 1,
      validityHours: 6,
      presetRoles: ['坐席'],
      roleIds: ['r_agent'],
      link: 'https://jingxiaoling.jd.com/invite/join?t=demo-wx-002',
      createdAt: new Date(now - 1 * hour).toISOString(),
      deadline: mkDeadline(6),
      usedCount: 1,
      loginMethod: 'wechat',
      status: 'online',
      creatorName: 'cooper',
      creatorRole: '主账号',
    },
  ];

  const store: InviteStore = {
    campaigns: demoCampaigns,
    applications: [
      ...SUB_USER_JOIN_APPLICATIONS,
      ...PROCESSED_SUB_USER_JOIN_APPLICATIONS,
    ].map((app) => ({
      ...app,
      inviteToken: app.inviteLink.split('t=')[1],
    })),
  };
  writeStore(store);
  return store;
}

export function subscribeInviteStore(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(INVITE_STORE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(INVITE_STORE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function getInviteApplications(): StoredSubUserApplication[] {
  return readStore().applications;
}

export function getInviteCampaigns(): InviteCampaign[] {
  return readStore().campaigns;
}

export function getInviteCampaignByToken(token: string): InviteCampaign | null {
  return readStore().campaigns.find((item) => item.token === token) ?? null;
}

export function registerInviteCampaign(input: {
  token: string;
  link: string;
  userCount: number;
  validityHours: number;
  roleIds: string[];
  presetRoles: string[];
  companyName?: string;
  loginMethod?: InviteLoginMethod;
  creatorName?: string;
  creatorRole?: InviteCampaign['creatorRole'];
}): InviteCampaign {
  const store = readStore();
  const createdAt = new Date();
  const deadline = new Date(createdAt.getTime() + input.validityHours * 60 * 60 * 1000);
  const deadlineLabel = formatStoreDateTime(deadline);

  const campaign: InviteCampaign = {
    token: input.token,
    companyName: input.companyName ?? DEFAULT_COMPANY,
    masterAccount: 'jd_corp_master***',
    masterAccountId: 'ACC-89219842',
    userCount: input.userCount,
    validityHours: input.validityHours,
    presetRoles: input.presetRoles,
    roleIds: input.roleIds,
    link: input.link,
    createdAt: createdAt.toISOString(),
    deadline: deadlineLabel,
    usedCount: 0,
    loginMethod: input.loginMethod ?? 'jd',
    status: 'online',
    creatorName: input.creatorName ?? 'cooper',
    creatorRole: input.creatorRole ?? '主账号',
  };

  store.campaigns = [campaign, ...store.campaigns.filter((item) => item.token !== input.token)];
  writeStore(store);
  return campaign;
}

export function submitInviteApplication(input: {
  inviteToken: string;
  name: string;
  account: string;
  seatId?: string;
  email?: string;
  phone: string;
  accountPin?: string;
  wechatNickname?: string;
  inviteTone?: SubUserJoinApplication['inviteTone'];
}): StoredSubUserApplication | null {
  const store = readStore();
  const campaign = store.campaigns.find((item) => item.token === input.inviteToken);
  if (!campaign) return null;
  if (campaign.usedCount >= campaign.userCount) return null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const appliedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const inviteTone = input.inviteTone ?? 'jd';

  const application: StoredSubUserApplication = {
    id: `app-${Date.now().toString(36)}`,
    name: input.name.trim(),
    account: input.account.trim(),
    avatarInitial: input.name.trim().charAt(0) || '新',
    inviteLabel: inviteTone === 'wechat' ? '微信邀请' : '京东邀请',
    inviteTone,
    seatId: input.seatId?.trim() || `${input.account.trim().slice(0, 3).toUpperCase()}001`,
    email: input.email?.trim() || `${input.account.trim()}@jd.com`,
    accountPin: inviteTone === 'jd' ? input.accountPin ?? `jd_${input.account.trim()}` : undefined,
    wechatNickname: inviteTone === 'wechat' ? input.wechatNickname ?? `wx_${input.account.trim()}` : undefined,
    phone: input.phone,
    presetRole: campaign.presetRoles[0] ?? '坐席',
    inviteLink: campaign.link,
    status: 'pending',
    appliedAt,
    inviteToken: input.inviteToken,
  };

  store.applications = [application, ...store.applications];
  campaign.usedCount += 1;
  writeStore(store);
  return application;
}

export function updateInviteApplicationStatus(
  applicationId: string,
  status: SubUserJoinApplication['status'],
  meta?: { approverName?: string; processedAt?: string },
): StoredSubUserApplication | null {
  const store = readStore();
  let updated: StoredSubUserApplication | null = null;
  store.applications = store.applications.map((item) => {
    if (item.id !== applicationId) return item;
    if (status === 'pending') {
      updated = { ...item, status, approverName: undefined, processedAt: undefined };
      return updated;
    }
    updated = {
      ...item,
      status,
      approverName: meta?.approverName ?? item.approverName ?? 'cooper',
      processedAt: meta?.processedAt ?? formatStoreDateTime(new Date()),
    };
    return updated;
  });
  if (updated) writeStore(store);
  return updated;
}

export function buildInviteNavNotifications(): NavNotification[] {
  const applications = getInviteApplications();
  const taskNotifications: NavNotification[] = [
    {
      id: 'n-task-1',
      kind: 'task',
      category: 'service',
      tag: '数字员工',
      message: '您委托的任务 室内设计小红书文案创作 已完成，请查看结果',
      dateGroup: '2026-05-08',
      read: false,
    },
    {
      id: 'n-task-2',
      kind: 'task',
      category: 'service',
      tag: '数字员工',
      message: '您委托的任务 阿里巴巴服务器营销文案 已完成，请查看结果',
      dateGroup: '2026-05-08',
      read: true,
    },
    {
      id: 'n-task-3',
      kind: 'task',
      category: 'feature',
      tag: '数字员工',
      message: '您委托的任务 阿里巴巴服务器推广文案 已完成，请查看结果',
      dateGroup: '2026-05-03',
      read: false,
    },
    {
      id: 'n-task-4',
      kind: 'task',
      category: 'feature',
      tag: '数字员工',
      message: '技能创建流程已更新，支持确认写入与专家视图 Diff',
      dateGroup: '2026-05-03',
      read: true,
    },
  ];

  const inviteNotifications = applications.map((app) => ({
    id: `n-invite-${app.id}`,
    kind: 'invite' as const,
    category: 'official' as const,
    tag: '子用户邀请',
    message:
      app.status === 'approved'
        ? `已通过 ${app.name} 的加入申请`
        : app.status === 'rejected'
          ? `已拒绝 ${app.name} 的加入申请`
          : `${app.name} 申请加入团队，预设角色：${app.presetRole}`,
    dateGroup: app.appliedAt.slice(0, 10),
    read: app.status !== 'pending',
    application: app,
  }));

  return [...inviteNotifications, ...taskNotifications];
}

export function countPendingInviteApplications(): number {
  return getInviteApplications().filter((item) => item.status === 'pending').length;
}

export function countProcessedInviteApplications(): number {
  return getInviteApplications().filter((item) => item.status !== 'pending').length;
}

export function deactivateInviteCampaign(token: string): InviteCampaign | null {
  const store = readStore();
  let updated: InviteCampaign | null = null;
  store.campaigns = store.campaigns.map((item) => {
    if (item.token !== token) return item;
    updated = { ...item, status: 'offline' };
    return updated;
  });
  if (updated) writeStore(store);
  return updated;
}

export function deleteInviteCampaign(token: string): boolean {
  const store = readStore();
  const next = store.campaigns.filter((item) => item.token !== token);
  if (next.length === store.campaigns.length) return false;
  store.campaigns = next;
  writeStore(store);
  return true;
}

export function isInviteCampaignAvailable(campaign: InviteCampaign): boolean {
  if (campaign.status === 'offline') return false;
  if (campaign.usedCount >= campaign.userCount) return false;
  const deadline = Date.parse(campaign.deadline.replace(' ', 'T'));
  if (Number.isNaN(deadline)) return true;
  return Date.now() <= deadline;
}

export function extractInviteTokenFromLink(link: string): string | null {
  try {
    const url = new URL(link, window.location.origin);
    return url.searchParams.get('t');
  } catch {
    const match = link.match(/[?&]t=([^&]+)/);
    return match?.[1] ?? null;
  }
}
