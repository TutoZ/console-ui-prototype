/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 私有化首次登录强制改密（演示）
 */

const PRIVATE_PWD_CHANGED_KEY = 'js_private_pwd_changed';

function readChangedAccounts(): Set<string> {
  try {
    const raw = localStorage.getItem(PRIVATE_PWD_CHANGED_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw) as string[];
    return new Set(list);
  } catch {
    return new Set();
  }
}

export function needsPrivatePasswordChange(account: string): boolean {
  const normalized = account.trim();
  if (!normalized) return false;
  return !readChangedAccounts().has(normalized);
}

export function markPrivatePasswordChanged(account: string): void {
  const normalized = account.trim();
  if (!normalized) return;
  const set = readChangedAccounts();
  set.add(normalized);
  localStorage.setItem(PRIVATE_PWD_CHANGED_KEY, JSON.stringify([...set]));
}

export function clearPrivatePasswordChanged(account: string): void {
  const normalized = account.trim();
  if (!normalized) return;
  const set = readChangedAccounts();
  set.delete(normalized);
  localStorage.setItem(PRIVATE_PWD_CHANGED_KEY, JSON.stringify([...set]));
}

export const PRIVATE_NEW_PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
