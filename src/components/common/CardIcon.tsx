/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一的卡片图标：参考清言/智谱技能市场的「彩色圆角方块」App 图标风格。
 * - variant="solid"：饱和渐变底 + 白色字形（用于字母 / IconPark 图标）
 * - variant="soft" ：浅色渐变底（用于 emoji 头像，保证 emoji 可读且整体有彩色感）
 * - variant="ai"   ：统一墨色底板 + 白字形，不按 seed 上色（技能等 AI 能力入口）
 * 颜色按 seed 稳定派生，使同一对象始终是同一颜色（ai 除外）。
 */

import React from 'react';

const TONES = [
  { solid: 'from-sky-500 to-sky-600', soft: 'from-sky-50 to-sky-100/80 text-sky-600' },
  { solid: 'from-sky-500 to-sky-600', soft: 'from-sky-50 to-sky-100/80 text-sky-600' },
  { solid: 'from-emerald-500 to-emerald-600', soft: 'from-emerald-50 to-emerald-100/80 text-emerald-600' },
  { solid: 'from-amber-500 to-orange-500', soft: 'from-amber-50 to-amber-100/80 text-amber-600' },
  { solid: 'from-rose-500 to-pink-600', soft: 'from-rose-50 to-rose-100/80 text-rose-500' },
  { solid: 'from-cyan-500 to-sky-600', soft: 'from-cyan-50 to-cyan-100/80 text-cyan-600' },
  { solid: 'from-sky-500 to-neutral-800', soft: 'from-neutral-50 to-neutral-100/80 text-neutral-600' },
  { solid: 'from-fuchsia-500 to-sky-600', soft: 'from-violet-50 to-sky-50 text-violet-500' },
];

function toneFromSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const SIZES = {
  sm: 'h-9 w-9 rounded-[7px] text-base',
  md: 'h-10 w-10 rounded-[7px] text-lg',
  lg: 'h-11 w-11 rounded-[13px] text-xl',
  xl: 'h-12 w-12 rounded-[13px] text-2xl',
} as const;

interface CardIconProps {
  /** 用于稳定派生颜色的种子（如 id / 名称）；variant="ai" 时不参与上色 */
  seed?: string;
  variant?: 'solid' | 'soft' | 'ai';
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}

export const CardIcon: React.FC<CardIconProps> = ({
  seed = '',
  variant = 'solid',
  size = 'md',
  className = '',
  children,
}) => {
  const tone = toneFromSeed(seed);
  const base =
    variant === 'ai'
      ? 'bg-gradient-to-br from-neutral-800 to-neutral-950 text-white shadow-sm'
      : variant === 'solid'
        ? `bg-gradient-to-br ${tone.solid} text-white shadow-sm`
        : `bg-gradient-to-br ${tone.soft} shadow-none`;

  return (
    <div
      className={`${SIZES[size]} ${base} flex items-center justify-center font-bold shrink-0 select-none overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};
