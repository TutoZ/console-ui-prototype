/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 底部单一胶囊入口；登录 / 首页 / 版本等选项收进展开面板
 */

import React, { useEffect, useRef, useState } from 'react';
import { Layers, User, RefreshCw, Home, X, Check, ChevronUp } from '@/lib/icons';
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

function versionLabel(version: NavLayoutVersion): string {
  if (version === 'hybrid') return 'V1';
  if (version === 'dualSide') return 'V2';
  return 'V3';
}

export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  version,
  onChange,
  screen = 'home',
  onGoLogin,
  onGoHome,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeMeta = NAV_LAYOUT_VERSIONS.find((v) => v.id === version);
  const screenLabel = screen === 'login' ? '登录' : '首页';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
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
      ref={rootRef}
      className="fixed bottom-3 left-1/2 z-[280] flex -translate-x-1/2 flex-col items-center gap-1.5 pointer-events-none"
    >
      {open ? (
        <div
          className="pointer-events-auto w-[300px] rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(31,35,41,0.14)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="dialog"
          aria-label="页面与版本切换"
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-neutral-100">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-neutral-900">版本管理助手</div>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                切换页面与导航结构，选择后立即生效
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

          {onGoLogin || onGoHome ? (
            <div className="px-3 py-2.5 border-b border-neutral-100">
              <div className="text-[10px] font-semibold text-neutral-500 mb-1.5 px-1">页面</div>
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
                      ? 'border-neutral-800 bg-neutral-900 text-white'
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
                      ? 'border-neutral-800 bg-neutral-900 text-white'
                      : 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
                  )}
                >
                  <Home size={12} className="shrink-0" />
                  首页
                </button>
              </div>
            </div>
          ) : null}

          <div className="p-2 space-y-1.5">
            <div className="text-[10px] font-semibold text-neutral-500 px-2 pt-1 pb-0.5">
              导航版本
            </div>
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
                      ? 'border-neutral-300 bg-neutral-50 ring-1 ring-neutral-200'
                      : 'border-transparent hover:bg-neutral-50 hover:border-neutral-200',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-md text-[10px] font-bold',
                        active
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-500',
                      )}
                    >
                      V{index + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-neutral-900">
                      {item.title}
                    </span>
                    {active ? (
                      <Check size={14} className="ml-auto text-neutral-800 shrink-0" />
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
            当前：{screenLabel} · {activeMeta?.title ?? version}
          </div>
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
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'pointer-events-auto inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-full border shadow-[0_3px_10px_rgba(31,35,41,0.08)] transition cursor-pointer',
          open
            ? 'border-neutral-900 bg-neutral-900 text-white'
            : 'border-neutral-200 bg-white/90 text-neutral-800 hover:border-neutral-300 hover:bg-white',
        )}
        title="页面与版本切换"
        aria-expanded={open}
        aria-label="页面与版本切换"
      >
        <Layers size={12} className={cn('shrink-0', open ? 'opacity-90' : 'opacity-60')} />
        <span className="text-[11px] font-semibold leading-none">{screenLabel}</span>
        <span
          className={cn(
            'text-[10px] font-bold leading-none px-1.5 py-0.5 rounded-md',
            open ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500',
          )}
        >
          {versionLabel(version)}
        </span>
        <ChevronUp
          size={12}
          className={cn(
            'shrink-0 transition-transform',
            open ? 'rotate-0 opacity-80' : 'rotate-180 opacity-45',
          )}
        />
      </button>
    </div>
  );
};
