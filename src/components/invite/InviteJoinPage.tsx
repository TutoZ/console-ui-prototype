/**
 * 被邀请人 · 统一登录页 + 申请加入
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from '@/lib/icons';
import { showAppToast } from '@/lib/appToast';
import { assetWebp } from '@/lib/assetWebp';
import {
  clearInviteAuthSession,
  readInviteAuthSession,
  setInviteAuthSession,
} from '@/lib/inviteRoute';
import {
  getInviteCampaignByToken,
  isInviteCampaignAvailable,
  submitInviteApplication,
  subscribeInviteStore,
  type InviteCampaign,
} from '@/lib/subUserInviteStore';
import { PROFILE_USER } from '@/lib/profileUser';
import { cn } from '@/lib/utils';
import { ToastLoadingIcon } from '../common/ToastLoadingIcon';
import styles from '../LoginPage.module.scss';

const PHONE_RE = /^1\d{10}$/;
const CODE_RE = /^\d{6}$/;

const LOGIN_BG = '/assets/login-left-panel.png';
const LOGIN_BG_WEBP = assetWebp(LOGIN_BG);
const LOGIN_BRAND_LOGO = '/assets/login-brand-logo.png';
const LOGIN_QR_IMAGE =
  'https://img30.360buyimg.com/ling/jfs/t1/503802/3/10816/27522/6a8af089F37c52423/0276168168ab3ab6.jpg';
const SCAN_METHOD_JD =
  'https://img11.360buyimg.com/ling/jfs/t1/511063/37/2712/2410/6a8af089F310fa0ed/02760240247cc968.png';
const SCAN_METHOD_WECHAT =
  'https://img14.360buyimg.com/ling/jfs/t1/506728/22/8518/2493/6a8af089F2e365744/0276024024d254a0.png';

type Step = 'login' | 'apply' | 'success';
type LoginTab = 'phone' | 'password' | 'scan';

function LoginPanelBackground({ className }: { className: string }) {
  return (
    <picture>
      <source srcSet={LOGIN_BG_WEBP} type="image/webp" />
      <img className={className} src={LOGIN_BG} alt="" decoding="async" fetchPriority="high" />
    </picture>
  );
}

function getInviteStripPhaseHint(campaign: InviteCampaign, phase: Step): string {
  if (phase === 'success') return '申请已提交，等待审批';

  if (campaign.usedCount >= campaign.userCount) {
    return '申请名额已满，请联系管理员重新生成邀请链接';
  }
  if (campaign.status === 'offline') {
    return '邀请链接已下线，请联系管理员';
  }
  const deadline = Date.parse(campaign.deadline.replace(' ', 'T'));
  if (!Number.isNaN(deadline) && Date.now() > deadline) {
    return '邀请链接已过期，请联系管理员重新生成';
  }
  if (phase === 'login') return '登录后申请加入';
  if (phase === 'apply') return '请填写下方申请信息';
  return '申请已提交，等待审批';
}

function InviteContextStrip({
  campaign,
  phase,
}: {
  campaign: InviteCampaign;
  phase: Step;
}) {
  const quotaFull = campaign.usedCount >= campaign.userCount;
  const unavailable = phase !== 'success' && !isInviteCampaignAvailable(campaign);
  const phaseHint = getInviteStripPhaseHint(campaign, phase);

  return (
    <div
      className={cn(
        styles.inviteContextStrip,
        unavailable && styles.inviteContextStripWarning,
      )}
      role="status"
    >
      <div className={styles.inviteContextStripInner}>
        <span
          className={cn(
            styles.inviteContextStripMark,
            unavailable && styles.inviteContextStripMarkWarning,
          )}
          aria-hidden
        />
        <p className={styles.inviteContextStripText}>
          <span className={styles.inviteContextStripTitle}>{campaign.companyName}员工申请</span>
          <span className={styles.inviteContextStripSep} aria-hidden>
            ·
          </span>
          <span className={styles.inviteContextStripMeta}>
            目标主账号：
            <span className={styles.inviteContextMetaStrong}>{campaign.masterAccount}</span>
            ({campaign.masterAccountId})
          </span>
          <span className={styles.inviteContextStripSep} aria-hidden>
            ·
          </span>
          <span className={styles.inviteContextStripMeta}>
            名额：
            <span
              className={cn(
                styles.inviteContextMetaStrong,
                quotaFull && phase !== 'success' && styles.inviteContextMetaWarning,
              )}
            >
              {campaign.usedCount}/{campaign.userCount}
            </span>
          </span>
          <span className={styles.inviteContextStripSep} aria-hidden>
            ·
          </span>
          <span
            className={cn(
              styles.inviteContextStripMeta,
              unavailable && styles.inviteContextStripHintWarning,
            )}
          >
            {phaseHint}
          </span>
        </p>
      </div>
    </div>
  );
}

function InvitePageShell({
  campaign,
  phase = 'login',
  children,
}: {
  campaign: InviteCampaign | null;
  phase?: Step;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.pageContainer} ${styles.pageContainerInvite}`}>
      {campaign ? <InviteContextStrip campaign={campaign} phase={phase} /> : null}
      <div className={styles.pageMain}>
        <div className={styles.leftPanel}>
          <LoginPanelBackground className={styles.bgImage} />
          <div className={styles.mainTitle}>
            <span className={styles.mainTitleLine1}>您的数字员工团队</span>
            <span className={styles.mainTitleLine2}>随时待命</span>
          </div>
          <div className={styles.subTitle}>
            开箱即用，一键上岗，服务提质增效、客户体验升级，释放团队创造力
          </div>
          <img className={styles.brandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formShell}>
            <div className={styles.formContainer}>
              <div className={`${styles.formTopBar} ${styles.mobilePageHeader}`}>
                <img className={styles.formBrandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteLoginForm({
  campaign,
  onSuccess,
}: {
  campaign: InviteCampaign;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<LoginTab>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    code?: string;
    account?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setCodeCountdown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeCountdown]);

  const completeLogin = (loginPhone: string, accountPin: string) => {
    setInviteAuthSession(loginPhone, accountPin);
    showAppToast('登录成功，请继续填写申请信息', 'success');
    onSuccess();
  };

  const handleSendCode = async () => {
    if (codeCountdown > 0 || codeSending) return;
    if (!PHONE_RE.test(phone.trim())) {
      setErrors((prev) => ({ ...prev, phone: '请输入有效的 11 位手机号' }));
      return;
    }
    setErrors((prev) => ({ ...prev, phone: undefined }));
    setCodeSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setCodeSending(false);
    setCodeCountdown(60);
    showAppToast('验证码已发送', 'success');
  };

  const handlePhoneLogin = async () => {
    const next: typeof errors = {};
    if (!PHONE_RE.test(phone.trim())) next.phone = '请输入有效的 11 位手机号';
    if (!CODE_RE.test(code.trim())) next.code = '请输入 6 位验证码';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSubmitting(false);
    completeLogin(phone.trim(), `jd_${phone.trim().slice(-4)}`);
  };

  const handleAccountLogin = async () => {
    const next: typeof errors = {};
    if (!account.trim()) next.account = '请输入账号';
    if (!password.trim()) next.password = '请输入密码';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSubmitting(false);
    completeLogin(account.trim(), `acct_${account.trim().slice(0, 8)}`);
  };

  const handleScanLogin = async () => {
    if (scanning) return;
    setScanning(true);
    showAppToast(
      campaign.loginMethod === 'wechat' ? '请使用微信扫码确认登录' : '请使用京东 App 扫码确认登录',
      'info',
    );
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    setScanning(false);
    const demoPhone = '13800138000';
    completeLogin(demoPhone, campaign.loginMethod === 'wechat' ? 'wx_demo_user' : 'jd_demo_user');
  };

  return (
    <div className={styles.formMain}>
      <div className={styles.header}>
        <div className={styles.title}>登录并申请加入</div>
        <div className={styles.desc}>请选择手机号、账号密码或扫码登录</div>
      </div>

      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={activeTab === 'phone' ? styles.tabActive : styles.tabNormal}
            onClick={() => setActiveTab('phone')}
          >
            <span className={activeTab === 'phone' ? styles.tabTextActive : styles.tabTextNormal}>
              手机号登录
            </span>
          </button>
          <button
            type="button"
            className={activeTab === 'password' ? styles.tabActive : styles.tabNormal}
            onClick={() => setActiveTab('password')}
          >
            <span className={activeTab === 'password' ? styles.tabTextActive : styles.tabTextNormal}>
              账号密码
            </span>
          </button>
          <button
            type="button"
            className={activeTab === 'scan' ? styles.tabActive : styles.tabNormal}
            onClick={() => setActiveTab('scan')}
          >
            <span className={activeTab === 'scan' ? styles.tabTextActive : styles.tabTextNormal}>
              扫码登录
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'phone' ? (
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <input
              className={styles.inputField}
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              inputMode="numeric"
              autoComplete="tel"
              aria-label="手机号"
            />
          </div>
          {errors.phone ? <p className={styles.fieldError}>{errors.phone}</p> : null}

          <div className={styles.inputRow}>
            <input
              className={styles.inputFieldShort}
              type="text"
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
              }}
              inputMode="numeric"
              aria-label="验证码"
            />
            <div className={styles.divider} aria-hidden />
            <button
              type="button"
              className={styles.getVcodeBtn}
              onClick={handleSendCode}
              disabled={codeCountdown > 0 || codeSending}
            >
              {codeSending ? (
                <ToastLoadingIcon size={16} />
              ) : codeCountdown > 0 ? (
                `${codeCountdown}s 后重发`
              ) : (
                '获取验证码'
              )}
            </button>
          </div>
          {errors.code ? <p className={styles.fieldError}>{errors.code}</p> : null}

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handlePhoneLogin}
            disabled={submitting}
          >
            {submitting ? <ToastLoadingIcon size={18} onDark /> : '登录并继续申请'}
          </button>
        </div>
      ) : activeTab === 'password' ? (
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <input
              className={styles.inputField}
              type="text"
              placeholder="请输入账号"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }));
              }}
              autoComplete="username"
              aria-label="账号"
            />
          </div>
          {errors.account ? <p className={styles.fieldError}>{errors.account}</p> : null}

          <div className={styles.inputRow}>
            <input
              className={styles.inputField}
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="current-password"
              aria-label="密码"
            />
          </div>
          {errors.password ? <p className={styles.fieldError}>{errors.password}</p> : null}

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleAccountLogin}
            disabled={submitting}
          >
            {submitting ? <ToastLoadingIcon size={18} onDark /> : '登录并继续申请'}
          </button>

          <div className={styles.createAccountRow}>
            <span className={styles.noAccountText}>忘记密码？</span>
            <button
              type="button"
              className={styles.goCreateText}
              onClick={() =>
                showAppToast('请通过手机号验证码登录，登录后可在账号设置中找回或重置密码', 'info')
              }
            >
              去找回
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.qrcodeArea}>
          <button
            type="button"
            className={styles.qrcodeWrapper}
            onClick={handleScanLogin}
            disabled={scanning}
            aria-label="点击模拟扫码登录"
            style={{ cursor: scanning ? 'wait' : 'pointer', border: 'none', padding: 0, background: 'transparent' }}
          >
            <img className={styles.qrcodeImg} src={LOGIN_QR_IMAGE} alt="登录二维码" />
          </button>
          {scanning ? <p className={styles.supportLabel}>扫码确认中…</p> : null}
          <div className={styles.supportMethods}>
            <span className={styles.supportLabel}>支持扫码方式</span>
            <div className={styles.methodItem}>
              <img className={styles.methodIcon} src={SCAN_METHOD_JD} alt="" />
              <span className={styles.methodText}>京东扫码登录</span>
            </div>
            <div className={styles.methodItem}>
              <img className={styles.methodIcon} src={SCAN_METHOD_WECHAT} alt="" />
              <span className={styles.methodText}>微信扫码登录</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteApplyForm({
  applicantName,
  account,
  seatId,
  email,
  applyError,
  submitting,
  available,
  onNameChange,
  onAccountChange,
  onSeatIdChange,
  onEmailChange,
  onSubmit,
  onSwitchAccount,
}: {
  applicantName: string;
  account: string;
  seatId: string;
  email: string;
  applyError: string;
  submitting: boolean;
  available: boolean;
  onNameChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onSeatIdChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onSwitchAccount: () => void;
}) {
  return (
    <div className={styles.formMain}>
      <div className={styles.header}>
        <div className={styles.title}>填写员工申请信息</div>
        <div className={styles.descBlock}>
          审批通过后将继承预设角色，并绑定您的登录账号
        </div>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inviteFieldBlock}>
          <label className={styles.inviteFieldLabel} htmlFor="invite-name">
            坐席姓名<span className={styles.inviteFieldRequired}>*</span>
          </label>
          <div className={styles.inputRow}>
            <input
              id="invite-name"
              className={styles.inputField}
              type="text"
              placeholder="请输入真实姓名"
              value={applicantName}
              onChange={(e) => onNameChange(e.target.value)}
              autoComplete="name"
            />
          </div>
        </div>

        <div className={styles.inviteFieldBlock}>
          <label className={styles.inviteFieldLabel} htmlFor="invite-account">
            登录账号<span className={styles.inviteFieldRequired}>*</span>
          </label>
          <div className={styles.inputRow}>
            <input
              id="invite-account"
              className={styles.inputField}
              type="text"
              placeholder="如：zhanghao.1355"
              value={account}
              onChange={(e) => onAccountChange(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className={styles.inviteFieldBlock}>
          <label className={styles.inviteFieldLabel} htmlFor="invite-seat-id">
            坐席工号（选填）
          </label>
          <div className={styles.inputRow}>
            <input
              id="invite-seat-id"
              className={styles.inputField}
              type="text"
              placeholder="如：ZH001"
              value={seatId}
              onChange={(e) => onSeatIdChange(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.inviteFieldBlock}>
          <label className={styles.inviteFieldLabel} htmlFor="invite-email">
            注册邮箱（选填）
          </label>
          <div className={styles.inputRow}>
            <input
              id="invite-email"
              className={styles.inputField}
              type="email"
              placeholder="如：zhanghao.1355@jd.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        {applyError ? <p className={styles.fieldError}>{applyError}</p> : null}

        <button
          type="button"
          disabled={submitting || !available}
          onClick={onSubmit}
          className={styles.submitBtn}
        >
          {submitting ? <ToastLoadingIcon size={18} onDark /> : '申请加入'}
        </button>
      </div>

      <div className={styles.createAccountRow}>
        <button type="button" className={styles.goCreateText} onClick={onSwitchAccount}>
          切换登录账号
        </button>
      </div>
    </div>
  );
}

function InviteSuccessView({
  name,
  account,
  seatId,
  email,
  submittedAt,
}: {
  name: string;
  account: string;
  seatId: string;
  email: string;
  submittedAt: string;
}) {
  const resolvedSeatId = seatId || `${account.slice(0, 3).toUpperCase()}001`;
  const resolvedEmail = email || `${account}@jd.com`;

  return (
    <div className={styles.formMain}>
      <CheckCircle2 size={52} className={styles.inviteSuccessIcon} strokeWidth={1.75} />
      <div className={styles.header}>
        <div className={styles.title}>申请已成功提交</div>
        <div className={styles.descBlock}>
          系统已生成待审批申请记录，等待主账号管理员审核通过后即可激活子用户账号
        </div>
      </div>

      <div className={styles.inviteSuccessPanel}>
        {[
          ['申请坐席', name],
          ['登录账号', account],
          ['坐席工号', resolvedSeatId],
          ['注册邮箱', resolvedEmail],
          ['申请时间', submittedAt],
          ['当前状态', '待审批'],
        ].map(([label, value]) => (
          <div key={label} className={styles.inviteSuccessRow}>
            <span className={styles.inviteSuccessLabel}>{label}</span>
            {label === '当前状态' ? (
              <span className={styles.inviteSuccessStatus}>{value}</span>
            ) : (
              <span className={styles.inviteSuccessValue} title={value}>
                {value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const InviteJoinPage: React.FC<{ token: string }> = ({ token }) => {
  const [campaign, setCampaign] = useState<InviteCampaign | null>(() => getInviteCampaignByToken(token));

  useEffect(() => {
    setCampaign(getInviteCampaignByToken(token));
    return subscribeInviteStore(() => {
      setCampaign(getInviteCampaignByToken(token));
    });
  }, [token]);

  const [step, setStep] = useState<Step>(() => (readInviteAuthSession() ? 'apply' : 'login'));

  const [applicantName, setApplicantName] = useState(PROFILE_USER.name);
  const [account, setAccount] = useState('');
  const [seatId, setSeatId] = useState('');
  const [email, setEmail] = useState('');
  const [applyError, setApplyError] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [submittedAt, setSubmittedAt] = useState('');

  const available = campaign ? isInviteCampaignAvailable(campaign) : false;

  useEffect(() => {
    if (!campaign) return;
    if (!available && step !== 'success') {
      const quotaFull = campaign.usedCount >= campaign.userCount;
      setApplyError(
        quotaFull
          ? '申请名额已满，请联系管理员重新生成邀请链接。'
          : '邀请链接已失效，请联系管理员重新生成。',
      );
    }
  }, [available, campaign, step]);

  const handleApply = () => {
    setApplyError('');
    if (!applicantName.trim()) {
      setApplyError('请填写坐席姓名');
      return;
    }
    if (!account.trim()) {
      setApplyError('请填写登录账号');
      return;
    }
    if (!campaign || !available) {
      setApplyError('邀请链接已失效或名额已满');
      return;
    }

    const auth = readInviteAuthSession();
    if (!auth) {
      setStep('login');
      return;
    }

    setSubmittingApply(true);
    window.setTimeout(() => {
      const result = submitInviteApplication({
        inviteToken: token,
        name: applicantName.trim(),
        account,
        seatId,
        email,
        phone: auth.phone,
        accountPin: auth.accountPin,
        inviteTone: campaign.loginMethod === 'wechat' ? 'wechat' : 'jd',
      });
      setSubmittingApply(false);
      if (!result) {
        setApplyError('提交失败，邀请链接可能已失效或名额已满');
        return;
      }
      setSubmittedAt(result.appliedAt);
      setStep('success');
    }, 600);
  };

  if (!campaign) {
    return (
      <InvitePageShell campaign={null}>
        <div className={styles.formMain}>
          <div className={styles.header}>
            <div className={styles.title}>邀请链接无效</div>
            <div className={styles.desc}>未找到对应邀请配置，请向管理员索取最新链接。</div>
          </div>
        </div>
      </InvitePageShell>
    );
  }

  if (step === 'login') {
    return (
      <InvitePageShell campaign={campaign} phase={step}>
        <InviteLoginForm campaign={campaign} onSuccess={() => setStep('apply')} />
      </InvitePageShell>
    );
  }

  if (step === 'apply') {
    return (
      <InvitePageShell campaign={campaign} phase={step}>
        <InviteApplyForm
          applicantName={applicantName}
          account={account}
          seatId={seatId}
          email={email}
          applyError={applyError}
          submitting={submittingApply}
          available={available}
          onNameChange={setApplicantName}
          onAccountChange={setAccount}
          onSeatIdChange={setSeatId}
          onEmailChange={setEmail}
          onSubmit={handleApply}
          onSwitchAccount={() => {
            clearInviteAuthSession();
            setStep('login');
          }}
        />
      </InvitePageShell>
    );
  }

  return (
    <InvitePageShell campaign={campaign} phase={step}>
      <InviteSuccessView
        name={applicantName}
        account={account}
        seatId={seatId}
        email={email}
        submittedAt={submittedAt}
      />
    </InvitePageShell>
  );
};
