/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 导航布局 A/B/C 版本：供易用性对比测试
 */

export type NavLayoutVersion = 'hybrid' | 'dualSide' | 'collapsibleTree';

export const NAV_LAYOUT_VERSIONS: Array<{
  id: NavLayoutVersion;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'hybrid',
    title: '侧导 + 顶导',
    subtitle: '一级窄轨在左，二级能力在顶部横排（当前默认）',
  },
  {
    id: 'dualSide',
    title: '双侧导航',
    subtitle: '一级窄轨 + 二级侧栏，内容区不再占用顶栏',
  },
  {
    id: 'collapsibleTree',
    title: '可折叠树形侧栏',
    subtitle: '对齐 joypi 工作台：单栏分组展开，可收成图标轨',
  },
];

const STORAGE_KEY = 'js_nav_layout_version';

export function readNavLayoutVersion(): NavLayoutVersion {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'hybrid' || saved === 'dualSide' || saved === 'collapsibleTree') {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return 'hybrid';
}

export function writeNavLayoutVersion(version: NavLayoutVersion) {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    /* ignore */
  }
}
