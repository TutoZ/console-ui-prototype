import React from 'react';

/** 对齐 color-tokens.md §2.3；soft 仅底+字，禁止 border */
const TONES = [
  {
    solid: 'from-blue-500 to-blue-600',
    soft: 'from-blue-50 to-blue-100/80 text-blue-600',
  },
  {
    solid: 'from-violet-500 to-violet-600',
    soft: 'from-violet-50 to-violet-100/80 text-violet-600',
  },
  {
    solid: 'from-emerald-500 to-emerald-600',
    soft: 'from-emerald-50 to-emerald-100/80 text-emerald-600',
  },
  {
    solid: 'from-amber-500 to-orange-500',
    soft: 'from-amber-50 to-amber-100/80 text-amber-600',
  },
  {
    solid: 'from-rose-500 to-pink-600',
    soft: 'from-rose-50 to-rose-100/80 text-rose-500',
  },
  {
    solid: 'from-cyan-500 to-sky-600',
    soft: 'from-cyan-50 to-cyan-100/80 text-cyan-600',
  },
  {
    solid: 'from-indigo-500 to-indigo-600',
    soft: 'from-indigo-50 to-indigo-100/80 text-indigo-600',
  },
  {
    solid: 'from-fuchsia-500 to-purple-600',
    soft: 'from-fuchsia-50 to-purple-100/80 text-fuchsia-600',
  },
] as const;

function toneFromSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const SIZES = {
  sm: 'h-9 w-9 rounded-[7px] text-[15px] leading-none',
  md: 'h-10 w-10 rounded-[7px] text-lg leading-none',
  lg: 'h-11 w-11 rounded-[13px] text-xl leading-none',
  xl: 'h-12 w-12 rounded-[13px] text-2xl leading-none',
} as const;

export interface CardIconProps {
  seed?: string;
  /** 默认 soft，对齐员工知识列表 */
  variant?: 'solid' | 'soft' | 'ai';
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}

export const CardIcon: React.FC<CardIconProps> = ({
  seed = '',
  variant = 'soft',
  size = 'sm',
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
      className={`${SIZES[size]} ${base} flex items-center justify-center font-semibold shrink-0 select-none overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};
