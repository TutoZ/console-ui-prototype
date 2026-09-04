/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 当前登录演示账号（侧栏底部 / 对话「我」头像共用）
 * 产品无法获取真实头像，统一用首字 + 低对比中性底，避免侧栏视觉抢戏。
 */

export const PROFILE_USER = {
  name: '朱子涛',
  initial: '朱',
  fallbackClass:
    'bg-neutral-200 text-neutral-700 text-[12px] font-medium tracking-tight',
} as const;
