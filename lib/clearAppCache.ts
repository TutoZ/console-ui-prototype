/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 清除京小灵演示态本地缓存（js_*），恢复默认导航与页面配置
 */

/** 清除所有 js_ 前缀的 localStorage 项 */
export function clearJoyServingAppCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('js_')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
