/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 私有化首次登录强制修改密码弹窗
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from '@/lib/icons';
import { PRIVATE_NEW_PASSWORD_RE } from '@/lib/privateAuth';
import { MODAL_OVERLAY, MODAL_PANEL } from '@/lib/ui';
import { cn } from '@/lib/utils';

type FirstLoginPasswordModalProps = {
  open: boolean;
  tempPassword: string;
  onCancel: () => void;
  onConfirm: () => void;
};

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export const FirstLoginPasswordModal: React.FC<FirstLoginPasswordModalProps> = ({
  open,
  tempPassword,
  onCancel,
  onConfirm,
}) => {
  const [oldPassword, setOldPassword] = useState(tempPassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOldPassword(tempPassword);
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setSubmitting(false);
  }, [open, tempPassword]);

  if (!open) return null;

  const handleSubmit = async () => {
    const next: FieldErrors = {};
    if (!oldPassword.trim()) next.oldPassword = '请输入原临时密码';
    else if (oldPassword !== tempPassword) next.oldPassword = '原临时密码不正确';
    if (!PRIVATE_NEW_PASSWORD_RE.test(newPassword)) {
      next.newPassword = '密码须为 8-20 位，且包含字母和数字';
    }
    if (!confirmPassword.trim()) next.confirmPassword = '请再次输入新密码';
    else if (confirmPassword !== newPassword) next.confirmPassword = '两次输入的新密码不一致';
    if (newPassword && oldPassword === newPassword) {
      next.newPassword = '新密码不能与原临时密码相同';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 700));
    setSubmitting(false);
    onConfirm();
  };

  return createPortal(
    <div className={cn(MODAL_OVERLAY, 'z-[330]')} onClick={onCancel}>
      <div
        className={cn(MODAL_PANEL, 'max-w-[520px] w-full')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="首次登录强制修改密码"
      >
        <h2 className="text-[18px] font-semibold text-neutral-900 leading-snug mb-2">
          首次登录强制修改密码
        </h2>
        <p className="text-[13px] text-neutral-500 leading-relaxed mb-6">
          为保障私有化环境数据安全，管理员创建的初始临时密码必须在首次登录时修改。
        </p>

        <div className="space-y-4 text-[13px]">
          <label className="block">
            <span className="block text-neutral-700 mb-1.5">原临时密码</span>
            <input
              type="password"
              className={cn(
                'w-full h-10 rounded-lg border bg-neutral-50/80 px-3 text-neutral-900 outline-none transition',
                errors.oldPassword ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-900',
              )}
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (errors.oldPassword) setErrors((v) => ({ ...v, oldPassword: undefined }));
              }}
              autoComplete="current-password"
            />
            {errors.oldPassword ? (
              <p className="mt-1 text-[11px] text-red-600">{errors.oldPassword}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="block text-neutral-700 mb-1.5">
              新登录密码 <span className="text-red-500">*</span>
            </span>
            <input
              type="password"
              className={cn(
                'w-full h-10 rounded-lg border bg-neutral-50/80 px-3 text-neutral-900 outline-none transition placeholder:text-neutral-400',
                errors.newPassword ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-900',
              )}
              placeholder="8-20 位，须包含字母和数字"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((v) => ({ ...v, newPassword: undefined }));
              }}
              autoComplete="new-password"
            />
            {errors.newPassword ? (
              <p className="mt-1 text-[11px] text-red-600">{errors.newPassword}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="block text-neutral-700 mb-1.5">
              确认新密码 <span className="text-red-500">*</span>
            </span>
            <input
              type="password"
              className={cn(
                'w-full h-10 rounded-lg border bg-neutral-50/80 px-3 text-neutral-900 outline-none transition placeholder:text-neutral-400',
                errors.confirmPassword ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-900',
              )}
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((v) => ({ ...v, confirmPassword: undefined }));
              }}
              autoComplete="new-password"
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-[11px] text-red-600">{errors.confirmPassword}</p>
            ) : null}
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-neutral-100 text-neutral-700 text-[13px] font-medium hover:bg-neutral-200/80 transition cursor-pointer"
            onClick={onCancel}
            disabled={submitting}
          >
            取消登录
          </button>
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-neutral-900 text-white text-[13px] font-medium hover:opacity-90 transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            确认修改并进入租户
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
