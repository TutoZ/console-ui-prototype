/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 质检模块轻量通知 — 复用全局 Sonner Toast
 */

import { showAppToast } from '@/lib/appToast';

export function qcNotify(message: string): void {
  const isError =
    message.includes('❌') ||
    message.includes('失败') ||
    message.includes('错误') ||
    message.includes('受限') ||
    message.includes('权限不足');
  const isSuccess =
    message.includes('✅') ||
    message.includes('成功') ||
    message.includes('✨') ||
    message.includes('🚀');

  showAppToast(message, isError ? 'error' : isSuccess ? 'success' : 'info');
}
