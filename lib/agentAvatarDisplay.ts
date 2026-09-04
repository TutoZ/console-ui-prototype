/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 数字员工头像展示 — 统一解析 emoji / Relay 插画 / 本地形象 / 自定义 URL
 */

import { RELAY_CARD_AVATARS, relayAvatarForAgent } from './relayHomeAssets';

/** 官方形象预设（optimize-assets 生成 WebP + 256px 缩略 PNG） */
export const AGENT_AVATAR_PRESETS = Array.from(
  { length: 23 },
  (_, i) => `/assets/agent-avatars/avatar-${String(i + 1).padStart(2, '0')}.webp`,
) as readonly string[];

/** PNG 兜底（旧缓存 / WebP 未生成时） */
export const AGENT_AVATAR_PRESETS_PNG = Array.from(
  { length: 23 },
  (_, i) => `/assets/agent-avatars/avatar-${String(i + 1).padStart(2, '0')}.png`,
) as readonly string[];

export function isAvatarImageUrl(avatar: string): boolean {
  return (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('data:') ||
    avatar.startsWith('/assets/') ||
    avatar.startsWith('/nav-icons/') ||
    avatar.endsWith('.webp')
  );
}

/** 头像加载失败时回退 PNG */
export function agentAvatarFallbackSrc(src: string): string | undefined {
  if (!src.endsWith('.webp')) return undefined;
  return src.replace(/\.webp$/i, '.png');
}

/** 卡片 / 列表：自定义 URL 直接用；emoji 回退 Relay 插画 */
export function agentAvatarSrc(avatar: string, relayIndex: number): string {
  return relayAvatarForAgent(avatar, relayIndex);
}

export { RELAY_CARD_AVATARS };

export type AgentAvatarRender =
  | { kind: 'image'; src: string }
  | { kind: 'emoji'; emoji: string };

/** 非图片头像（旧版 emoji 等）→ 稳定映射到官方形象预设 */
function presetFallback(relayIndex: number): string {
  return AGENT_AVATAR_PRESETS[relayIndex % AGENT_AVATAR_PRESETS.length];
}

/** 入职考核页头像按钮：未自定义用 Relay；自定义用所选形象 / 图片；旧 emoji 回落预设 */
export function agentAvatarForEditor(
  avatar: string,
  relayIndex: number,
  avatarCustomized = false,
): AgentAvatarRender {
  if (isAvatarImageUrl(avatar)) {
    return { kind: 'image', src: avatar };
  }
  if (!avatarCustomized) {
    return {
      kind: 'image',
      src: RELAY_CARD_AVATARS[relayIndex % RELAY_CARD_AVATARS.length],
    };
  }
  return { kind: 'image', src: presetFallback(relayIndex) };
}

/** 员工卡片：URL / 本地形象直接用；旧 emoji 不再露表情，回落官方形象；否则 Relay 插画 */
export function agentAvatarForCard(
  avatar: string,
  relayIndex: number,
  avatarCustomized = false,
): AgentAvatarRender {
  if (isAvatarImageUrl(avatar)) {
    return { kind: 'image', src: avatar };
  }
  if (avatarCustomized) {
    return { kind: 'image', src: presetFallback(relayIndex) };
  }
  return {
    kind: 'image',
    src: RELAY_CARD_AVATARS[relayIndex % RELAY_CARD_AVATARS.length],
  };
}

export function isRelayAvatarUrl(avatar: string): boolean {
  return (RELAY_CARD_AVATARS as readonly string[]).includes(avatar);
}

export function isAgentAvatarPreset(avatar: string): boolean {
  return (AGENT_AVATAR_PRESETS as readonly string[]).includes(avatar);
}
