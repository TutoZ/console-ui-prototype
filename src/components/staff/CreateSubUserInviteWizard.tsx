/**
 * 邀请同事 · 基于 PanelModal（common/PanelModal）
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Minus, Plus } from '@/lib/icons';
import {
  BTN_INK,
  BTN_SOFT,
  FIELD,
  FIELD_CTRL,
  LABEL,
} from '@/lib/ui';
import { PanelModal } from '../common/PanelModal';
import {
  INVITE_USER_COUNT_PRESETS,
  INVITE_VALIDITY_PRESETS,
  INVITE_WIZARD_ROLES,
  MAX_INVITE_ROLES,
  MAX_INVITE_HOURS,
  MAX_INVITE_USERS,
  clampInviteUserCount,
  clampInviteValidityHours,
  createInviteToken,
  type InviteWizardRole,
} from '@/lib/subUserInviteWizardMock';
import { buildLocalInviteJoinUrl } from '@/lib/inviteRoute';
import { registerInviteCampaign } from '@/lib/subUserInviteStore';
import { cn } from '@/lib/utils';
import { InviteLinkManageTable } from './InviteLinkManageTable';

type View = 'form' | 'success' | 'history';

function ChipRow({
  label,
  value,
  onChange,
  presets,
  suffix,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  presets: readonly number[];
  suffix: string;
  min: number;
  max: number;
}) {
  const clamp = (next: number) => {
    if (!Number.isFinite(next)) return min;
    return Math.min(max, Math.max(min, Math.round(next)));
  };

  return (
    <div>
      <label className={LABEL}>
        {label} <span className="text-destructive">*</span>
      </label>
      <div className="mt-1 flex items-center gap-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChange(clamp(value - 1))}
            disabled={value <= min}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[7px] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Minus size={14} />
          </button>
          <div className="inline-flex h-8 items-center rounded-[7px] border border-neutral-200 bg-white overflow-hidden shrink-0">
            <input
              type="number"
              min={min}
              max={max}
              value={value}
              onChange={(e) => onChange(clamp(Number(e.target.value)))}
              className={cn(
                FIELD,
                FIELD_CTRL,
                'w-11 border-0 rounded-none px-1 text-center tabular-nums shadow-none focus:border-transparent',
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(clamp(value + 1))}
            disabled={value >= max}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[7px] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-1 min-w-0 items-center gap-1">
          {presets.map((preset) => {
            const active = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={cn(
                  'flex-1 min-w-0 h-8 px-1 rounded-[7px] text-[11px] font-semibold border transition cursor-pointer truncate text-center',
                  active
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
                )}
              >
                {preset}
                {suffix}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoleRow({
  role,
  checked,
  disabled,
  onToggle,
}: {
  role: InviteWizardRole;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'w-full flex items-start gap-3 rounded-[10px] border px-3 py-2.5 text-left transition cursor-pointer',
        checked
          ? 'border-neutral-900 bg-neutral-50'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80',
        disabled && 'opacity-45 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
          checked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 bg-white',
        )}
      >
        {checked ? <Check size={10} strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-neutral-900">{role.name}</span>
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-px rounded border',
              role.tag === '系统预设'
                ? 'bg-neutral-100 text-neutral-500 border-neutral-200'
                : 'bg-sky-50 text-live border-sky-200/60',
            )}
          >
            {role.tag}
          </span>
        </span>
        <span className="mt-0.5 block text-[11px] text-neutral-500 leading-relaxed">{role.description}</span>
      </span>
    </button>
  );
}

function InviteFormBody({
  userCount,
  validityHours,
  onUserCountChange,
  onValidityChange,
  selectedIds,
  onRolesChange,
}: {
  userCount: number;
  validityHours: number;
  onUserCountChange: (value: number) => void;
  onValidityChange: (value: number) => void;
  selectedIds: string[];
  onRolesChange: (ids: string[]) => void;
}) {
  const toggleRole = (role: InviteWizardRole) => {
    if (selectedIds.includes(role.id)) {
      onRolesChange(selectedIds.filter((id) => id !== role.id));
      return;
    }
    if (selectedIds.length >= MAX_INVITE_ROLES) return;
    onRolesChange([...selectedIds, role.id]);
  };

  return (
    <div className="space-y-4">
      <ChipRow
        label="邀请人数"
        value={userCount}
        onChange={(next) => onUserCountChange(clampInviteUserCount(next))}
        presets={INVITE_USER_COUNT_PRESETS}
        suffix="人"
        min={1}
        max={MAX_INVITE_USERS}
      />
      <ChipRow
        label="有效时长"
        value={validityHours}
        onChange={(next) => onValidityChange(clampInviteValidityHours(next))}
        presets={INVITE_VALIDITY_PRESETS}
        suffix="小时"
        min={1}
        max={MAX_INVITE_HOURS}
      />
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className={cn(LABEL, 'mb-0')}>
            预设角色 <span className="text-destructive">*</span>
          </label>
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {selectedIds.length}/{MAX_INVITE_ROLES}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-2">审批通过后自动授予所选角色</p>
        <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar -mr-1 pr-1">
          {INVITE_WIZARD_ROLES.map((role) => {
            const checked = selectedIds.includes(role.id);
            const disabled = !checked && selectedIds.length >= MAX_INVITE_ROLES;
            return (
              <RoleRow
                key={role.id}
                role={role}
                checked={checked}
                disabled={disabled}
                onToggle={() => toggleRole(role)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InviteSuccessBody({
  inviteLink,
  onCopy,
}: {
  inviteLink: string;
  onCopy: () => void;
}) {
  return (
    <div className="relative rounded-[7px] border border-neutral-200 bg-neutral-50 pl-3 pr-10 py-3">
      <p
        className="font-mono text-[11px] font-medium text-neutral-900 leading-relaxed break-all select-all"
        title={inviteLink}
      >
        {inviteLink}
      </p>
      <button
        type="button"
        onClick={onCopy}
        title="复制链接"
        className="absolute right-1 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-white/80 cursor-pointer"
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

export const CreateSubUserInviteWizard: React.FC<{
  open: boolean;
  onClose: () => void;
  onComplete?: (payload: {
    link: string;
    userCount: number;
    validityHours: number;
    roleIds: string[];
  }) => void;
  showToast?: (message: string) => void;
}> = ({ open, onClose, onComplete, showToast }) => {
  const [view, setView] = useState<View>('form');
  const [userCount, setUserCount] = useState(1);
  const [validityHours, setValidityHours] = useState(24);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(['r_agent']);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!open) return;
    setView('form');
    setUserCount(1);
    setValidityHours(24);
    setSelectedRoleIds(['r_agent']);
    setInviteLink('');
  }, [open]);

  const selectedRoleNames = useMemo(
    () =>
      INVITE_WIZARD_ROLES.filter((role) => selectedRoleIds.includes(role.id)).map(
        (role) => role.name,
      ),
    [selectedRoleIds],
  );

  const generateLink = () => {
    if (selectedRoleIds.length === 0) {
      showToast?.('请至少选择一个预设角色。');
      return;
    }
    const token = createInviteToken();
    const link = buildLocalInviteJoinUrl(token);
    registerInviteCampaign({
      token,
      link,
      userCount,
      validityHours,
      roleIds: selectedRoleIds,
      presetRoles: selectedRoleNames,
    });
    setInviteLink(link);
    setView('success');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast?.('邀请链接已复制');
    } catch {
      showToast?.('复制失败，请手动选择链接复制');
    }
  };

  const resetForm = () => {
    setUserCount(1);
    setValidityHours(24);
    setSelectedRoleIds(['r_agent']);
    setInviteLink('');
    setView('form');
  };

  if (!open) return null;

  const modalTitle = view === 'history' ? '邀请历史' : '邀请同事';

  const description =
    view === 'history'
      ? '查看已生成的链接与申请进度'
      : view === 'success'
        ? '链接已生成，复制后发送给同事，审批通过后即可加入'
        : '设置名额与权限，生成链接发送给同事';

  const footer =
    view === 'form' ? (
      <>
        <button
          type="button"
          onClick={() => setView('history')}
          className="mr-auto shrink-0 text-[12px] font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
        >
          邀请历史
        </button>
        <button type="button" onClick={onClose} className={cn(BTN_SOFT, 'shrink-0 whitespace-nowrap')}>
          取消
        </button>
        <button
          type="button"
          onClick={generateLink}
          className={cn(BTN_INK, 'shrink-0 whitespace-nowrap h-8')}
        >
          生成邀请链接
        </button>
      </>
    ) : view === 'success' ? (
      <>
        <button
          type="button"
          onClick={() => setView('history')}
          className="mr-auto shrink-0 text-[12px] font-medium text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
        >
          邀请历史
        </button>
        <button
          type="button"
          onClick={resetForm}
          className={cn(BTN_SOFT, 'shrink-0 whitespace-nowrap')}
        >
          再建一条
        </button>
        <button
          type="button"
          onClick={copyLink}
          className={cn(BTN_INK, 'shrink-0 whitespace-nowrap h-8')}
        >
          <Copy size={14} />
          复制邀请链接
        </button>
      </>
    ) : view === 'history' ? (
      <button
        type="button"
        onClick={() => setView('form')}
        className={cn(BTN_SOFT, 'shrink-0 whitespace-nowrap')}
      >
        返回
      </button>
    ) : null;

  return (
    <PanelModal
      open={open}
      onClose={onClose}
      title={modalTitle}
      description={description}
      footer={footer}
      bodyClassName={
        view === 'history'
          ? 'flex-1 min-h-0 max-h-[min(480px,calc(100vh-200px))] overflow-hidden flex flex-col'
          : undefined
      }
    >
      {view === 'form' ? (
        <InviteFormBody
          userCount={userCount}
          validityHours={validityHours}
          onUserCountChange={(next) => setUserCount(clampInviteUserCount(next))}
          onValidityChange={(next) => setValidityHours(clampInviteValidityHours(next))}
          selectedIds={selectedRoleIds}
          onRolesChange={setSelectedRoleIds}
        />
      ) : null}
      {view === 'success' ? (
        <InviteSuccessBody inviteLink={inviteLink} onCopy={copyLink} />
      ) : null}
      {view === 'history' ? (
        <InviteLinkManageTable compact showToast={showToast} className="flex-1 min-h-0" />
      ) : null}
    </PanelModal>
  );
};
