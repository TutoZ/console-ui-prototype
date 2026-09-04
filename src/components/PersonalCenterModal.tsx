/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 个人中心弹窗
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Building,
  HelpCircle,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  X,
} from '@/lib/icons';
import { MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { readTenantSession, getTenantById } from '@/lib/tenantSession';

type PersonalCenterModalProps = {
  open: boolean;
  onClose: () => void;
  onGoCertify?: () => void;
  showToast?: (msg: string) => void;
};

function maskToken(token: string) {
  if (token.length <= 12) return token;
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export const PersonalCenterModal: React.FC<PersonalCenterModalProps> = ({
  open,
  onClose,
  onGoCertify,
  showToast,
}) => {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const tenantSession = readTenantSession();
  const tenant = tenantSession?.tenantId ? getTenantById(tenantSession.tenantId) : undefined;

  const certVerified = tenant?.status === 'active' || tenant?.status === 'trial';

  const tenantName = tenant?.companyName ?? '暂无';
  const tenantId = tenant?.id ?? '—';

  const handleGenerateToken = async () => {
    if (generating) return;
    setGenerating(true);
    await new Promise((r) => window.setTimeout(r, 600));
    const token = `jsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    setApiToken(token);
    setGenerating(false);
    showToast?.('API 令牌已生成');
  };

  const sectionHead = useMemo(
    () =>
      'flex items-center gap-2 text-[13px] font-semibold text-neutral-900 mb-2',
    [],
  );

  if (!open) return null;

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[320]')} onClick={onClose}>
      <div
        className={cn(MODAL_PANEL, 'max-w-[480px] w-full')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="个人中心"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold text-neutral-900">个人中心</h2>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 text-[12px] text-neutral-800">
          {/* 企业认证 */}
          <section>
            <div className={sectionHead}>
              <Building size={16} className="text-neutral-500 shrink-0" />
              <span>企业认证</span>
              {!certVerified ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  <AlertCircle size={12} aria-hidden />
                  未实名
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  已认证
                </span>
              )}
            </div>
            <div className="rounded-[10px] bg-neutral-100/80 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-[12px] text-neutral-600 leading-relaxed">
                {certVerified
                  ? '企业已完成实名认证，可享受完整服务'
                  : '暂未完成企业认证，无法享受完整服务'}
              </p>
              {!certVerified ? (
                <button
                  type="button"
                  className="shrink-0 h-8 px-4 rounded-lg bg-neutral-900 text-white text-[12px] font-medium hover:opacity-90 transition cursor-pointer"
                  onClick={() => {
                    onGoCertify?.();
                    onClose();
                  }}
                >
                  去认证
                </button>
              ) : null}
            </div>
          </section>

          {/* 租户信息 */}
          <section>
            <div className={sectionHead}>
              <HelpCircle size={16} className="text-neutral-500 shrink-0" />
              <span>租户信息</span>
            </div>
            <div className="rounded-[10px] bg-neutral-100/80 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500 shrink-0">租户名称</span>
                <span className="text-neutral-900 font-medium text-right truncate">
                  {tenantName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500 shrink-0">租户 ID</span>
                <span className="text-neutral-900 font-medium">{tenantId}</span>
              </div>
            </div>
          </section>

          {/* API 令牌 */}
          <section>
            <div className={sectionHead}>
              <KeyRound size={16} className="text-neutral-500 shrink-0" />
              <span>API 令牌</span>
            </div>
            <div className="rounded-[10px] bg-neutral-100/80 px-4 py-4 flex flex-col items-center gap-3">
              {apiToken ? (
                <>
                  <code className="text-[11px] text-neutral-600 bg-white px-3 py-2 rounded-lg border border-neutral-200/80 w-full text-center truncate">
                    {maskToken(apiToken)}
                  </code>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-neutral-700 text-white text-[12px] font-medium hover:bg-neutral-800 transition cursor-pointer"
                    onClick={() => {
                      navigator.clipboard?.writeText(apiToken);
                      showToast?.('令牌已复制到剪贴板');
                    }}
                  >
                    复制令牌
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-neutral-500">暂未生成令牌</p>
                  <button
                    type="button"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-neutral-700 text-white text-[12px] font-medium hover:bg-neutral-800 transition cursor-pointer disabled:opacity-60"
                    onClick={handleGenerateToken}
                  >
                    {generating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    {generating ? '生成中…' : '生成令牌'}
                  </button>
                </>
              )}
            </div>
          </section>

          {/* 第三方账号绑定 */}
          <section>
            <div className={sectionHead}>
              <Link2 size={16} className="text-neutral-500 shrink-0" />
              <span>第三方账号绑定</span>
            </div>
            <div className="rounded-[10px] bg-neutral-100/80 px-4 py-6 text-center text-[12px] text-neutral-400">
              即将开放
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
};
