/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 京小灵平台登录页 — 版式对齐 Relay chatId=2091507502989455362
 */

import React, { useEffect, useState } from 'react';
import { showAppToast } from '@/lib/appToast';
import { Headphones } from '@/lib/icons';
import { BTN_SOFT } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { ToastLoadingIcon } from './common/ToastLoadingIcon';
import { CertExpediteLeadModal } from './CertExpediteLeadModal';
import { EnterpriseCertificationView } from './EnterpriseCertificationView';
import { FirstLoginPasswordModal } from './FirstLoginPasswordModal';
import { TenantSelectContent, type TenantSelectContentProps } from './TenantSelectContent';
import styles from './LoginPage.module.scss';
import {
  markPrivatePasswordChanged,
  needsPrivatePasswordChange,
} from '@/lib/privateAuth';
import { assetWebp } from '@/lib/assetWebp';

const PHONE_RE = /^1\d{10}$/;
const CODE_RE = /^\d{6}$/;
const LOGIN_BG = '/assets/login-left-panel.png';
const LOGIN_BG_WEBP = assetWebp(LOGIN_BG);
const LOGIN_BRAND_LOGO = '/assets/login-brand-logo.png';
const PRIVATE_LOGIN_ARROW =
  'https://img30.360buyimg.com/ling/jfs/t1/496276/17/14819/298/6a865c9aF4662ace3/027601c01c52b38e.png';

function LoginPanelBackground({ className }: { className: string }) {
  return (
    <picture>
      <source srcSet={LOGIN_BG_WEBP} type="image/webp" />
      <img className={className} src={LOGIN_BG} alt="" decoding="async" fetchPriority="high" />
    </picture>
  );
}
const LOGIN_QR_IMAGE =
  'https://img30.360buyimg.com/ling/jfs/t1/503802/3/10816/27522/6a8af089F37c52423/0276168168ab3ab6.jpg';
const SCAN_METHOD_JD =
  'https://img11.360buyimg.com/ling/jfs/t1/511063/37/2712/2410/6a8af089F310fa0ed/02760240247cc968.png';
const SCAN_METHOD_WECHAT =
  'https://img14.360buyimg.com/ling/jfs/t1/506728/22/8518/2493/6a8af089F2e365744/0276024024d254a0.png';

type LoginTab = 'phone' | 'password' | 'scan';
type LoginView = 'login' | 'enterprise' | 'certification';
type LoginMode = 'saas' | 'private';

type LoginPageProps = {
  onSuccess: (phone: string) => void;
  initialView?: LoginView;
  tenantSelect?: TenantSelectContentProps;
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  initialView = 'login',
  tenantSelect,
}) => {
  const [view, setView] = useState<LoginView>(initialView);
  const [loginMode, setLoginMode] = useState<LoginMode>('saas');
  const [activeTab, setActiveTab] = useState<LoginTab>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    code?: string;
    account?: string;
    password?: string;
  }>({});

  const [entContact, setEntContact] = useState('');
  const [entPhone, setEntPhone] = useState('');
  const [entAgreed, setEntAgreed] = useState(false);
  const [entErrors, setEntErrors] = useState<Partial<Record<'contact' | 'phone' | 'agree', string>>>({});
  const [entSubmitting, setEntSubmitting] = useState(false);
  const [certExpediteOpen, setCertExpediteOpen] = useState(false);

  const [privateAccount, setPrivateAccount] = useState('');
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateErrors, setPrivateErrors] = useState<{
    account?: string;
    password?: string;
  }>({});
  const [privateSubmitting, setPrivateSubmitting] = useState(false);
  const [showFirstLoginPwdModal, setShowFirstLoginPwdModal] = useState(false);
  const [pendingPrivateAccount, setPendingPrivateAccount] = useState('');
  const [pendingTempPassword, setPendingTempPassword] = useState('');

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setCodeCountdown((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeCountdown]);

  useEffect(() => {
    if (view !== 'enterprise') return;
    const pendingPhone = sessionStorage.getItem('js_pending_enterprise_phone');
    if (!pendingPhone) return;
    setEntPhone(pendingPhone);
    sessionStorage.removeItem('js_pending_enterprise_phone');
  }, [view]);

  const handleSendCode = async () => {
    if (codeCountdown > 0 || codeSending) return;
    if (!PHONE_RE.test(phone.trim())) {
      setErrors((e) => ({ ...e, phone: '请输入有效的 11 位手机号' }));
      return;
    }
    setErrors((e) => ({ ...e, phone: undefined }));
    setCodeSending(true);
    await new Promise((r) => window.setTimeout(r, 600));
    setCodeSending(false);
    setCodeCountdown(60);
    showAppToast('验证码已发送', 'success');
  };

  const handleLogin = async () => {
    const next: typeof errors = {};
    if (!PHONE_RE.test(phone.trim())) next.phone = '请输入有效的 11 位手机号';
    if (!CODE_RE.test(code.trim())) next.code = '请输入 6 位验证码';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 800));
    setSubmitting(false);
    // 演示流程：登录/注册 → 创建企业 → 企业实名认证 → 租户选择
    setEntPhone(phone.trim());
    setEntContact('');
    setEntAgreed(false);
    setEntErrors({});
    setView('enterprise');
  };

  const handleAccountLogin = async () => {
    const next: typeof errors = {};
    if (!account.trim()) next.account = '请输入账号';
    if (!password.trim()) next.password = '请输入密码';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 800));
    setSubmitting(false);
    onSuccess(account.trim());
  };

  const handleEnterpriseSubmit = async () => {
    const next: typeof entErrors = {};
    if (!entContact.trim()) next.contact = '请填写联系人姓名';
    if (!PHONE_RE.test(entPhone.trim())) next.phone = '请填写有效的手机号';
    if (!entAgreed) next.agree = '请先阅读并同意服务协议与隐私政策';
    setEntErrors(next);
    if (Object.keys(next).length > 0) return;

    setEntSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 500));
    setEntSubmitting(false);
    setView('certification');
  };

  const handlePrivateLogin = async () => {
    const next: typeof privateErrors = {};
    if (!privateAccount.trim()) next.account = '请输入账号';
    if (!privatePassword.trim()) next.password = '请输入密码';
    setPrivateErrors(next);
    if (Object.keys(next).length > 0) return;

    setPrivateSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 800));
    setPrivateSubmitting(false);

    const account = privateAccount.trim();
    if (needsPrivatePasswordChange(account)) {
      setPendingPrivateAccount(account);
      setPendingTempPassword(privatePassword);
      setShowFirstLoginPwdModal(true);
      return;
    }

    onSuccess(account);
  };

  const completePrivateLogin = (account: string) => {
    markPrivatePasswordChanged(account);
    setShowFirstLoginPwdModal(false);
    setPendingPrivateAccount('');
    setPendingTempPassword('');
    setPrivatePassword('');
    onSuccess(account);
  };

  const isCertView = view === 'certification';

  // 认证完成后 App 会传入 tenantSelect；须优先于本地 certification 状态，否则会卡在认证成功页
  if (tenantSelect) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.leftPanel}>
          <LoginPanelBackground className={styles.bgImage} />
          <img className={styles.brandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
          <div className={styles.mainTitle}>
            <span className={styles.mainTitleLine1}>您的数字员工团队</span>
            <span className={styles.mainTitleLine2}>随时待命</span>
          </div>
          <div className={styles.subTitle}>
            开箱即用，一键上岗，服务提质增效、客户体验升级，释放团队创造力
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formShell}>
            <div className={styles.formContainer}>
              <div className={`${styles.formTopBar} ${styles.mobilePageHeader} ${styles.mobileOnlyTopBar}`}>
                <img className={styles.formBrandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
              </div>
              <TenantSelectContent {...tenantSelect} />
            </div>
          </div>

          <div className={styles.footer}>
            <p className={styles.copyright}>
              Copyright © 2026 京小灵客户服务数字员工平台
            </p>
            <div className={styles.icpInfo}>
              <span className={styles.icpText}>京公网安备 11011502040511号</span>
              <span className={styles.icpLink}>京ICP备18016634号-46</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCertView) {
    return (
      <div className={styles.certPageRoot}>
        <header className={styles.certBrandBar}>
          <button
            type="button"
            className={styles.certBrandLogoBtn}
            onClick={() => setView('login')}
            aria-label="返回首页"
            title="返回首页"
          >
            <img className={styles.certBrandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
          </button>
          <span className={styles.certBrandDivider} aria-hidden>
            丨
          </span>
          <h1 className={styles.certBrandTitle}>企业实名认证</h1>
          <div className={styles.certBrandActions}>
            <button
              type="button"
              className={cn(BTN_SOFT, 'gap-1.5 shrink-0')}
              onClick={() => setCertExpediteOpen(true)}
            >
              <Headphones size={14} strokeWidth={2} aria-hidden />
              联系京小灵加急
            </button>
          </div>
        </header>
        <main className={styles.certMain}>
          <EnterpriseCertificationView
            contactName={entContact}
            contactPhone={entPhone}
            onBack={() => setView('login')}
            onEnterPlatform={onSuccess}
            showToast={showAppToast}
          />
        </main>
        <CertExpediteLeadModal
          open={certExpediteOpen}
          certStatusLabel="企业实名认证"
          defaultName={entContact}
          defaultPhone={entPhone}
          defaultCompany=""
          onClose={() => setCertExpediteOpen(false)}
          onSubmitted={() => {
            showAppToast('加急申请已提交，京小灵顾问将优先与您联系');
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 左侧宣传区 */}
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

      {/* 右侧登录表单区 */}
      <div className={styles.rightPanel}>
        <div className={styles.formShell}>
          <div className={styles.formContainer}>
            <div className={`${styles.formTopBar} ${styles.mobilePageHeader}`}>
              <img className={styles.formBrandLogo} src={LOGIN_BRAND_LOGO} alt="京小灵" />
              <button
                type="button"
                className={styles.privateLogin}
                onClick={() => {
                  if (loginMode === 'saas') {
                    setLoginMode('private');
                    setView('login');
                  } else {
                    setLoginMode('saas');
                  }
                }}
              >
                <span className={styles.privateLoginText}>
                  {loginMode === 'saas' ? '私有化登录' : 'Saas公有云登录'}
                </span>
                <img className={styles.privateLoginIcon} src={PRIVATE_LOGIN_ARROW} alt="" />
              </button>
            </div>

            {view === 'login' ? (
              loginMode === 'private' ? (
                <div className={styles.formMain}>
                  <div className={styles.header}>
                    <div className={styles.title}>欢迎登录京小灵平台</div>
                    <div className={styles.desc}>使用企业私有化部署实例内账号密码登录</div>
                  </div>

                  <div className={styles.inputArea}>
                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputField}
                        type="text"
                        placeholder="请输入账号"
                        value={privateAccount}
                        onChange={(e) => {
                          setPrivateAccount(e.target.value);
                          if (privateErrors.account) {
                            setPrivateErrors((v) => ({ ...v, account: undefined }));
                          }
                        }}
                        autoComplete="username"
                        aria-label="账号"
                      />
                    </div>
                    {privateErrors.account ? (
                      <p className={styles.fieldError}>{privateErrors.account}</p>
                    ) : null}

                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputField}
                        type="password"
                        placeholder="请输入密码"
                        value={privatePassword}
                        onChange={(e) => {
                          setPrivatePassword(e.target.value);
                          if (privateErrors.password) {
                            setPrivateErrors((v) => ({ ...v, password: undefined }));
                          }
                        }}
                        autoComplete="current-password"
                        aria-label="密码"
                      />
                    </div>
                    {privateErrors.password ? (
                      <p className={styles.fieldError}>{privateErrors.password}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={handlePrivateLogin}
                    disabled={privateSubmitting}
                  >
                    {privateSubmitting ? <ToastLoadingIcon size={18} onDark /> : '登录'}
                  </button>

                  <div className={styles.helpLinks}>
                    <span className={styles.helpText}>无法登录？</span>
                    <button
                      type="button"
                      className={styles.resetLink}
                      onClick={() => showAppToast('请联系企业私有化管理员重置密码', 'info')}
                    >
                      请联系企业私有化管理员重置
                    </button>
                  </div>
                </div>
              ) : (
              <div className={styles.formMain}>
                <div className={styles.header}>
                  <div className={styles.title}>欢迎登录京小灵平台</div>
                  <div className={styles.desc}>请选择手机号、账号密码或扫码登录</div>
                </div>

                <div className={styles.tabsWrapper}>
                  <div className={styles.tabs}>
                    <button
                      type="button"
                      className={activeTab === 'phone' ? styles.tabActive : styles.tabNormal}
                      onClick={() => setActiveTab('phone')}
                    >
                      <span
                        className={
                          activeTab === 'phone' ? styles.tabTextActive : styles.tabTextNormal
                        }
                      >
                        手机号登录
                      </span>
                    </button>
                    <button
                      type="button"
                      className={activeTab === 'password' ? styles.tabActive : styles.tabNormal}
                      onClick={() => setActiveTab('password')}
                    >
                      <span
                        className={
                          activeTab === 'password' ? styles.tabTextActive : styles.tabTextNormal
                        }
                      >
                        账号密码
                      </span>
                    </button>
                    <button
                      type="button"
                      className={activeTab === 'scan' ? styles.tabActive : styles.tabNormal}
                      onClick={() => setActiveTab('scan')}
                    >
                      <span
                        className={
                          activeTab === 'scan' ? styles.tabTextActive : styles.tabTextNormal
                        }
                      >
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
                          if (errors.phone) setErrors((v) => ({ ...v, phone: undefined }));
                        }}
                        inputMode="numeric"
                        autoComplete="tel"
                        aria-label="手机号"
                      />
                    </div>
                    {errors.phone ? (
                      <p className={styles.fieldError}>{errors.phone}</p>
                    ) : null}

                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputFieldShort}
                        type="text"
                        placeholder="请输入验证码"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          if (errors.code) setErrors((v) => ({ ...v, code: undefined }));
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
                    {errors.code ? (
                      <p className={styles.fieldError}>{errors.code}</p>
                    ) : null}

                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleLogin}
                      disabled={submitting}
                    >
                      {submitting ? <ToastLoadingIcon size={18} onDark /> : '登录/注册'}
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
                          if (errors.account) setErrors((v) => ({ ...v, account: undefined }));
                        }}
                        autoComplete="username"
                        aria-label="账号"
                      />
                    </div>
                    {errors.account ? (
                      <p className={styles.fieldError}>{errors.account}</p>
                    ) : null}

                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputField}
                        type="password"
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((v) => ({ ...v, password: undefined }));
                        }}
                        autoComplete="current-password"
                        aria-label="密码"
                      />
                    </div>
                    {errors.password ? (
                      <p className={styles.fieldError}>{errors.password}</p>
                    ) : null}

                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleAccountLogin}
                      disabled={submitting}
                    >
                      {submitting ? <ToastLoadingIcon size={18} onDark /> : '登录'}
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
                    <div className={styles.qrcodeWrapper}>
                      <img className={styles.qrcodeImg} src={LOGIN_QR_IMAGE} alt="登录二维码" />
                    </div>
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
              )
            ) : (
              <div className={styles.formMain}>
                <div className={styles.header}>
                  <div className={styles.title}>创建企业版</div>
                  <div className={styles.desc}>
                    请确认联系人信息，下一步完成企业实名认证
                  </div>
                </div>

                <div className={styles.inputArea}>
                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputField}
                        placeholder="请输入联系人姓名"
                        value={entContact}
                        onChange={(e) => {
                          setEntContact(e.target.value);
                          if (entErrors.contact) setEntErrors((v) => ({ ...v, contact: undefined }));
                        }}
                      />
                    </div>
                    {entErrors.contact ? (
                      <p className={styles.fieldError}>{entErrors.contact}</p>
                    ) : null}

                    <div className={styles.inputRow}>
                      <input
                        className={styles.inputField}
                        type="tel"
                        placeholder="请输入手机号"
                        value={entPhone}
                        onChange={(e) => {
                          setEntPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                          if (entErrors.phone) setEntErrors((v) => ({ ...v, phone: undefined }));
                        }}
                        inputMode="numeric"
                      />
                    </div>
                    {entErrors.phone ? (
                      <p className={styles.fieldError}>{entErrors.phone}</p>
                    ) : null}

                    <div className={styles.agreementRow}>
                      <button
                        type="button"
                        className={`${styles.checkbox} ${entAgreed ? styles.checkboxChecked : ''}`}
                        onClick={() => {
                          setEntAgreed((v) => !v);
                          if (entErrors.agree) setEntErrors((v) => ({ ...v, agree: undefined }));
                        }}
                        aria-pressed={entAgreed}
                        aria-label="同意京小灵企业服务协议与隐私政策"
                      >
                        {entAgreed ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path
                              d="M2.5 6.5L5 9L9.5 3"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </button>
                      <div className={styles.agreementText}>
                        <span className={styles.grayText}>我已阅读并同意 </span>
                        <button
                          type="button"
                          className={styles.darkText}
                          onClick={() => showAppToast('京小灵企业服务协议页面即将上线')}
                        >
                          《京小灵企业服务协议》
                        </button>
                        <span className={styles.grayText}> 与 </span>
                        <button
                          type="button"
                          className={styles.darkText}
                          onClick={() => showAppToast('隐私政策页面即将上线')}
                        >
                          《隐私政策》
                        </button>
                      </div>
                    </div>
                    {entErrors.agree ? (
                      <p className={styles.fieldError}>{entErrors.agree}</p>
                    ) : null}

                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleEnterpriseSubmit}
                      disabled={entSubmitting}
                    >
                      {entSubmitting ? <ToastLoadingIcon size={18} onDark /> : '下一步'}
                    </button>
                    <button
                      type="button"
                      className={styles.backLink}
                      onClick={() => setView('login')}
                    >
                      返回登录
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.copyright}>
            Copyright © 2026 京小灵客户服务数字员工平台
          </p>
          <div className={styles.icpInfo}>
            <span className={styles.icpText}>京公网安备 11011502040511号</span>
            <span className={styles.icpLink}>京ICP备18016634号-46</span>
          </div>
        </div>
      </div>

      <FirstLoginPasswordModal
        open={showFirstLoginPwdModal}
        tempPassword={pendingTempPassword}
        onCancel={() => {
          setShowFirstLoginPwdModal(false);
          setPendingPrivateAccount('');
          setPendingTempPassword('');
        }}
        onConfirm={() => completePrivateLogin(pendingPrivateAccount)}
      />
    </div>
  );
};
