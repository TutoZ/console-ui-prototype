/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 全局 Toast — Sonner 封装，供 AppContext / 各页面统一调用。
 * 轻量成功反馈优先用按钮原地态（lib/useInlineAction），勿动辄 toast。
 * 非 error 默认节流 + 同文案去重。
 */

import { toast } from 'sonner';
import type { ToastType } from '@/lib/ui';

const TOAST_DURATION_MS = 1600;
const TOAST_ID = 'js-app-toast';

/** 两条非 error Toast 的最小间隔 */
const TOAST_COOLDOWN_MS = 4500;
/** 相同文案在窗口内只出一次 */
const TOAST_DEDUP_MS = 8000;

/** Sonner 在 hover/expanded 时会暂停计时；强制到时关闭避免「粘住」 */
let forceDismissTimer: ReturnType<typeof setTimeout> | null = null;
let lastShownAt = 0;
let lastMessage = '';

function normalizeMessage(message: string): string {
  return message.replace(/\s*\n+\s*/g, ' ').trim();
}

export function showAppToast(message: string, type: ToastType = 'info'): void {
  const text = normalizeMessage(message);
  if (!text) return;

  const now = Date.now();
  const isCritical = type === 'error';

  if (!isCritical) {
    if (text === lastMessage && now - lastShownAt < TOAST_DEDUP_MS) return;
    if (now - lastShownAt < TOAST_COOLDOWN_MS) return;
  }

  lastShownAt = now;
  lastMessage = text;

  const options = { duration: TOAST_DURATION_MS, id: TOAST_ID };

  switch (type) {
    case 'success':
      toast.success(text, options);
      break;
    case 'error':
      toast.error(text, options);
      break;
    case 'warning':
      toast.warning(text, options);
      break;
    default:
      toast.info(text, options);
      break;
  }

  if (forceDismissTimer) clearTimeout(forceDismissTimer);
  forceDismissTimer = setTimeout(() => {
    toast.dismiss(TOAST_ID);
    forceDismissTimer = null;
  }, TOAST_DURATION_MS);
}
