/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一级窄轨自定义 SVG（来自设计 icon 集合，放 public/nav-icons）
 */

import type { NavDomain } from './navDomain';
import digitalEmployeeSvg from '../assets/nav-icons/digital-employee.svg?raw';
import onlineCsSvg from '../assets/nav-icons/online-cs.svg?raw';
import hotlineSvg from '../assets/nav-icons/hotline.svg?raw';
import outboundSvg from '../assets/nav-icons/outbound.svg?raw';
import qcSvg from '../assets/nav-icons/qc.svg?raw';
import telesalesSvg from '../assets/nav-icons/telesales.svg?raw';
import collectionSvg from '../assets/nav-icons/collection.svg?raw';
import followupSvg from '../assets/nav-icons/followup.svg?raw';
import moreSvg from '../assets/nav-icons/more.svg?raw';

/** 业务域图标尺寸 */
export const NAV_RAIL_ICON_SIZE = 24;

/** 底部工具区图标尺寸（更小） */
export const NAV_RAIL_ICON_SIZE_COMPACT = 18;

/** 有自定义稿时优先用 SVG；其余域仍走 Iconify Solar */
export const NAV_RAIL_SVG: Partial<Record<NavDomain, string>> = {
  home: '/nav-icons/digital-employee.svg',
  online: '/nav-icons/online-cs.svg',
  hotline: '/nav-icons/hotline.svg',
  outbound: '/nav-icons/outbound.svg',
  qc: '/nav-icons/qc.svg',
  telesales: '/nav-icons/telesales.svg',
  collection: '/nav-icons/collection.svg',
  followup: '/nav-icons/followup.svg',
};

/** 与 public 同源的 SVG 原文，用于激活态把黑色路径换成文字同款渐变 */
export const NAV_RAIL_SVG_MARKUP: Partial<Record<NavDomain, string>> = {
  home: digitalEmployeeSvg,
  online: onlineCsSvg,
  hotline: hotlineSvg,
  outbound: outboundSvg,
  qc: qcSvg,
  telesales: telesalesSvg,
  collection: collectionSvg,
  followup: followupSvg,
};

/** 「更多」入口（非业务域） */
export const NAV_RAIL_MORE_SVG = moreSvg;

/** 主墨色路径（激活态套渐变） */
const NAV_INK = /#202124/gi;
/** 原稿蓝色强调 → 黑色 50% 透明 */
const NAV_BLUE = /#0255FF/gi;
const NAV_BLUE_MUTED = 'rgba(0,0,0,0.5)';

/**
 * 准备窄轨 SVG：
 * - 蓝色强调统一为黑色 50% 透明
 * - 激活态：黑色路径套用与文案相同的渐变
 * - 极短描边圆点（如「更多」三点）先转成实心圆，避免悬停渐变后消失
 */
export function prepareNavRailSvg(
  markup: string,
  {
    size = NAV_RAIL_ICON_SIZE,
    active = false,
    gradientId,
  }: {
    size?: number;
    active?: boolean;
    gradientId?: string;
  } = {},
): string {
  let out = markup.replace(
    /<path d="M([\d.]+) ([\d.]+)V[\d.]+" stroke="([^"]+)" stroke-width="4" stroke-linecap="round"\s*\/>/g,
    (_m, x, y, color) => {
      const cx = Number(x);
      const cy = Number(y);
      const r = 2;
      return `<path d="M${cx + r} ${cy}a${r} ${r} 0 1 1 ${-2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0" fill="${color}"/>`;
    },
  );

  out = out.replace(NAV_BLUE, NAV_BLUE_MUTED);

  if (active && gradientId) {
    out = out.replace(NAV_INK, `url(#${gradientId})`);
    out = out.replace(
      /<svg([^>]*)>/,
      `<svg$1><defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#000000"/><stop offset="100%" stop-color="#1565BF"/></linearGradient></defs>`,
    );
  }

  return out
    .replace(/\swidth="48"/, ` width="${size}"`)
    .replace(/\sheight="48"/, ` height="${size}"`);
}

/** @deprecated 使用 prepareNavRailSvg */
export function navRailSvgWithActiveGradient(
  markup: string,
  gradientId: string,
  size: number = NAV_RAIL_ICON_SIZE,
): string {
  return prepareNavRailSvg(markup, { size, active: true, gradientId });
}
