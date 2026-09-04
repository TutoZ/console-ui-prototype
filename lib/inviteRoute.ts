/**
 * 邀请链接路由解析（演示：同域 query 参数）
 */

export function getInviteTokenFromLocation(location: Location = window.location): string | null {
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get('t') ?? params.get('inviteToken');
  if (fromQuery) return fromQuery;

  if (params.get('inviteJoin') === '1') {
    return params.get('t');
  }

  const path = location.pathname.replace(/\/+$/, '');
  if (path.endsWith('/invite/join')) {
    return params.get('t');
  }

  return null;
}

export function isInviteJoinRoute(location: Location = window.location): boolean {
  return getInviteTokenFromLocation(location) !== null;
}

export function buildLocalInviteJoinUrl(token: string): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('inviteJoin', '1');
  url.searchParams.set('t', token);
  return url.toString();
}

export const INVITE_AUTH_KEY = 'js_invite_auth_session';

export type InviteAuthSession = {
  phone: string;
  accountPin: string;
  loggedInAt: string;
};

export function setInviteAuthSession(phone: string, accountPin: string): void {
  const session: InviteAuthSession = { phone, accountPin, loggedInAt: new Date().toISOString() };
  sessionStorage.setItem(INVITE_AUTH_KEY, JSON.stringify(session));
}

export function readInviteAuthSession(): InviteAuthSession | null {
  try {
    const raw = sessionStorage.getItem(INVITE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InviteAuthSession;
  } catch {
    return null;
  }
}

export function clearInviteAuthSession(): void {
  sessionStorage.removeItem(INVITE_AUTH_KEY);
}
