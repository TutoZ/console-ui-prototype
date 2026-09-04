/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 导航左侧版本管理助手 — 导航布局 A/B 切换
 */

import React, { useEffect, useState } from 'react';
import { Layers, User, RefreshCw, Home, X, Check } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { clearJoyServingAppCache } from '@/lib/clearAppCache';
import {
  NAV_LAYOUT_VERSIONS,
  writeNavLayoutVersion,
  type NavLayoutVersion,
} from '@/lib/navLayoutVersion';

interface VersionSwitcherProps {
  version: NavLayoutVersion;
  onChange: (next: NavLayoutVersion) => void;
  screen?: 'login' | 'home';
  onGoLogin?: () => void;
  onGoHome?: () => void;
}

export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  version,
  onChange,
  screen = 'home',
  onGoLogin,
  onGoHome,
}) => {
  const [open, setOpen] = useState(false);
  const activeMeta = NAV_LAYOUT_VERSIONS.find((v) => v.id === version);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const select = (next: NavLayoutVersion) => {
    if (next === version) {
      setOpen(false);
      return;
    }
    writeNavLayoutVersion(next);
    onChange(next);
    setOpen(false);
  };

  const handleClearCache = () => {
    if (
      !window.confirm(
        '将清除本地导航、演示数据与页面配置，并刷新页面恢复默认。确定继续？',
      )
    ) {
      return;
    }
    clearJoyServingAppCache();
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'fixed bottom-3 z-[280] flex flex-col items-start gap-1.5 pointer-events-none',
        /* 首页贴在左侧主导航右侧，避免压住 76px 导航轨 */
        screen === 'home' ? 'left-[88px]' : 'left-3',
      )}
    >
      {open && (
        <div
          className="pointer-events-auto w-[300px] rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(31,35,41,0.14)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="dialog"
          aria-label="导航版本切换"
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-neutral-100">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-neutral-900">版本管理助手</div>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                对比三种导航结构的易用性，切换后立即生效
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              aria-label="关闭"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-2 space-y-1.5">
            {NAV_LAYOUT_VERSIONS.map((item, index) => {
              const active = item.id === version;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className={cn(
                    'w-full text-left rounded-xl px-3 py-2.5 border transition cursor-pointer',
                    active
                      ? 'border-sky-200 bg-sky-50/80 ring-1 ring-sky-100'
                      : 'border-transparent hover:bg-neutral-50 hover:border-neutral-200',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-md text-[10px] font-bold',
                        active
                          ? 'bg-live text-white'
                          : 'bg-neutral-100 text-neutral-500',
                      )}
                    >
                      V{index + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-neutral-900">
                      {item.title}
                    </span>
                    {active ? (
                      <Check size={14} className="ml-auto text-live shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed pl-[28px]">
                    {item.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400">
            当前：{activeMeta?.title ?? version} · 选择会写入本地缓存
          </div>
          {onGoLogin || onGoHome ? (
            <div className="px-3 py-2 border-t border-neutral-100">
              <div className="text-[10px] font-semibold text-neutral-500 mb-1.5 px-1">
                页面导航
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onGoLogin?.();
                    setOpen(false);
                  }}
                  disabled={screen === 'login'}
                  className={cn(
                    'flex items-center justify-center gap-1 h-8 rounded-lg text-[11px] font-semibold border transition cursor-pointer disabled:cursor-default',
                    screen === 'login'
                      ? 'border-sky-200 bg-sky-50 text-live'
                      : 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
                  )}
                >
                  <User size={12} className="shrink-0" />
                  登录页
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onGoHome?.();
                    setOpen(false);
                  }}
                  disabled={screen === 'home'}
                  className={cn(
                    'flex items-center justify-center gap-1 h-8 rounded-lg text-[11px] font-semibold border transition cursor-pointer disabled:cursor-default',
                    screen === 'home'
                      ? 'border-sky-200 bg-sky-50 text-live'
                      : 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
                  )}
                >
                  <Home size={12} className="shrink-0" />
                  首页
                </button>
              </div>
            </div>
          ) : null}
          <div className="px-3 py-2 border-t border-neutral-100 space-y-1.5">
            <a
              href="/?ds=1"
              className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-[11px] font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition"
            >
              打开组件库
            </a>
            <button
              type="button"
              onClick={handleClearCache}
              className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg text-[11px] font-semibold text-neutral-600 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition cursor-pointer"
            >
              <RefreshCw size={12} className="shrink-0" />
              清理缓存并重新配置
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 pointer-events-auto">
        {onGoLogin || onGoHome ? (
          <div
            className="inline-flex items-center gap-0.5 h-7 p-0.5 rounded-full border border-neutral-200 bg-white/90 shadow-[0_3px_10px_rgba(31,35,41,0.08)]"
            role="group"
            aria-label="页面导航"
          >
            <button
              type="button"
              onClick={() => onGoLogin?.()}
              disabled={screen === 'login'}
              title="登录页"
              className={cn(
                'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-semibold transition cursor-pointer disabled:cursor-default',
                screen === 'login'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <User size={11} className="shrink-0" />
              登录
            </button>
            <button
              type="button"
              onClick={() => onGoHome?.()}
              disabled={screen === 'home'}
              title="首页"
              className={cn(
                'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-semibold transition cursor-pointer disabled:cursor-default',
                screen === 'home'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              <Home size={11} className="shrink-0" />
              首页
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1 h-7 pl-2 pr-1.5 rounded-full border shadow-[0_3px_10px_rgba(31,35,41,0.08)] transition cursor-pointer',
            open
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white/90 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-white',
          )}
          title="版本管理助手"
          aria-expanded={open}
        >
          <Layers size={12} className="shrink-0 opacity-70" />
          <span
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none',
              open ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500',
            )}
          >
            {version === 'hybrid' ? 'V1' : version === 'dualSide' ? 'V2' : 'V3'}
          </span>
        </button>
      </div>
    </div>
  );
};
