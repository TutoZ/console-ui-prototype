/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 企业租户选择（演示）
 */

export const TENANT_SESSION_KEY = 'js_tenant_session';

export type TenantRole = 'owner' | 'seat';

export type TenantStatus = 'trial' | 'pending' | 'active' | 'reviewing';

export type TenantItem = {
  id: string;
  displayName: string;
  companyName: string;
  description: string;
  role: TenantRole;
  roleLabel: string;
  status: TenantStatus;
  statusLabel: string;
  lastAccess: string;
};

export type TenantSession = {
  tenantId: string;
  selectedAt: string;
};

const MOCK_TENANTS: TenantItem[] = [
  {
    id: 'T2026080901',
    displayName: '李明辉',
    companyName: '北京京小灵智能科技有限公司',
    description: '主营智能客服与数字员工对接',
    role: 'owner',
    roleLabel: '主账号',
    status: 'trial',
    statusLabel: '体验中（剩余24天）',
    lastAccess: '今天 09:42',
  },
  {
    id: 'T2026080902',
    displayName: 'east_ops_admin',
    companyName: '华东电商客服运营中心',
    description: '电商大促客服与质检协同',
    role: 'owner',
    roleLabel: '主账号',
    status: 'pending',
    statusLabel: '待认证',
    lastAccess: '昨天 18:20',
  },
  {
    id: 'T2026080903',
    displayName: '陈佩栋',
    companyName: '宝通全国保险经纪有限公司',
    description: '保险理赔与回访外呼业务',
    role: 'seat',
    roleLabel: '普通坐席',
    status: 'active',
    statusLabel: '正式服务中',
    lastAccess: '2026-08-01',
  },
];

/** 演示：登录后始终展示多租户选择（不因账号自动跳过） */
export function getTenantsForPhone(_phone: string): TenantItem[] {
  return MOCK_TENANTS;
}

export function getTenantById(tenantId: string): TenantItem | undefined {
  return MOCK_TENANTS.find((t) => t.id === tenantId);
}

export function readTenantSession(): TenantSession | null {
  try {
    const raw = localStorage.getItem(TENANT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenantSession;
  } catch {
    return null;
  }
}

export function setSelectedTenant(tenantId: string): void {
  const session: TenantSession = {
    tenantId,
    selectedAt: new Date().toISOString(),
  };
  localStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(session));
}

export function clearTenantSession(): void {
  localStorage.removeItem(TENANT_SESSION_KEY);
}

export function hasSelectedTenant(): boolean {
  const session = readTenantSession();
  return Boolean(session?.tenantId);
}
