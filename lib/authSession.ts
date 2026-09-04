/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 登录态（演示）：localStorage 持久化
 */

import { clearTenantSession } from './tenantSession';

export const AUTH_SESSION_KEY = 'js_auth_session';

export type AuthSession = {
  phone: string;
  loggedInAt: string;
};

export function isAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as AuthSession;
    return Boolean(parsed?.phone);
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return false;
  }
}

export function setAuthenticatedSession(phone: string): void {
  const session: AuthSession = {
    phone,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export const LOGIN_REDIRECT_VIEW_KEY = 'js_login_redirect_view';

export function setLoginRedirectView(view: 'enterprise'): void {
  sessionStorage.setItem(LOGIN_REDIRECT_VIEW_KEY, view);
}

export function consumeLoginRedirectView(): 'enterprise' | null {
  const value = sessionStorage.getItem(LOGIN_REDIRECT_VIEW_KEY);
  sessionStorage.removeItem(LOGIN_REDIRECT_VIEW_KEY);
  return value === 'enterprise' ? 'enterprise' : null;
}

export const AUTH_LOGOUT_EVENT = 'joy-auth-logout';

/** 清除登录态并通知应用返回登录页 */
export function requestLogout(): void {
  clearAuthSession();
  clearTenantSession();
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}
