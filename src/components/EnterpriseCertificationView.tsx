/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 企业实名认证 — 三步流程：提交证件 → 校验信息 → 认证完成
 */

import React, { useRef, useState } from 'react';
import { Check, Copy, Loader2, Plus, Upload } from '@/lib/icons';
import styles from './EnterpriseCertificationView.module.scss';

export type CertStep = 1 | 2 | 3;

export type CertResultStatus =
  | 'pending'
  | 'reviewing'
  | 'failed'
  | 'trial'
  | 'trial_expired'
  | 'active'
  | 'suspended'
  | 'conflict';

type VerifyMethod = 'face' | 'bank';

type SimBranch = CertResultStatus | 'bank_processing';

type EnterpriseCertificationViewProps = {
  contactName: string;
  contactPhone: string;
  onBack: () => void;
  onEnterPlatform?: (phone: string) => void;
  showToast?: (msg: string) => void;
};

const ENTERPRISE_USER_ID = 'C1086607405';

const MOCK_OCR = {
  legalName: '京小灵体验科技有限公司',
  creditCode: '91110108MA01ABC99X',
  legalRepName: '李明辉',
  legalRepId: '11010119900307****',
};

const SIM_BRANCHES: { value: SimBranch; label: string }[] = [
  { value: 'pending', label: '待认证 · 功能受限' },
  { value: 'reviewing', label: '认证中 · 审核中防重复' },
  { value: 'bank_processing', label: '审核中 · 银行对公处理中' },
  { value: 'failed', label: '认证失败 · 展示驳回原因' },
  { value: 'trial', label: '体验中 · 30天体验期' },
  { value: 'trial_expired', label: '体验到期 · 主账号/坐席差异' },
  { value: 'active', label: '正式服务中 · 全量开放' },
  { value: 'suspended', label: '已停用 · 阻断访问' },
  { value: 'conflict', label: '主体冲突 · 已被绑定' },
];

const RESULT_META: Record<
  CertResultStatus,
  { title: string; desc: string; tone: 'info' | 'success' | 'warning' | 'error' }
> = {
  pending: {
    title: '待认证',
    desc: '企业实名认证尚未完成，部分功能受限。请尽快完成认证以解锁全部能力。',
    tone: 'info',
  },
  reviewing: {
    title: '认证中',
    desc: '您的认证申请正在审核中，请勿重复提交。预计 1 个工作日内完成审核。',
    tone: 'info',
  },
  failed: {
    title: '认证失败',
    desc: '驳回原因：法定代表人证件照片模糊，无法识别有效信息。请重新上传清晰原件照片后再次提交。',
    tone: 'error',
  },
  trial: {
    title: '已通过实名认证 · 免费体验中',
    desc: '恭喜！您的企业已通过核验，享有 30 天免费体验期（剩余 24 天，有效期至 2026-09-09）。',
    tone: 'success',
  },
  trial_expired: {
    title: '体验到期',
    desc: '体验期已结束。主账号可续费开通正式服务；坐席账号请联系企业管理员分配权限。',
    tone: 'warning',
  },
  active: {
    title: '已通过实名认证 · 正式服务中',
    desc: '恭喜！您的企业已通过核验，全部功能已开放。欢迎进入京小灵平台开始配置数字员工。',
    tone: 'success',
  },
  suspended: {
    title: '已停用',
    desc: '企业账号已停用，访问已被阻断。请联系平台客服或企业管理员了解停用原因并恢复服务。',
    tone: 'error',
  },
  conflict: {
    title: '主体冲突',
    desc: '该企业主体已被其他账号绑定，无法重复认证。如为同一企业请使用原绑定账号登录，或联系客服申诉。',
    tone: 'warning',
  },
};

const STEPS = ['提交证件信息', '校验认证信息', '认证完成'];

export const EnterpriseCertificationView: React.FC<EnterpriseCertificationViewProps> = ({
  contactName,
  contactPhone,
  onBack,
  onEnterPlatform,
  showToast,
}) => {
  const [step, setStep] = useState<CertStep>(1);
  const [licenseUpload, setLicenseUpload] = useState<string | null>(null);
  const [idFrontUpload, setIdFrontUpload] = useState<string | null>(null);
  const [idBackUpload, setIdBackUpload] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'pc' | 'wechat'>('pc');
  const [idType, setIdType] = useState('身份证');
  const [idForm, setIdForm] = useState('原件');
  const [certAgreed, setCertAgreed] = useState(false);
  const [step1Errors, setStep1Errors] = useState<Partial<Record<'license' | 'idFront' | 'idBack' | 'agree', string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('face');
  const [simBranch, setSimBranch] = useState<SimBranch>('trial');
  const [resultStatus, setResultStatus] = useState<CertResultStatus | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'rules' | 'guide'>('rules');

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);

  const toast = (msg: string) => showToast?.(msg);

  const handleFilePick = (
    file: File,
    setter: (v: string) => void,
    errorKey: 'license' | 'idFront' | 'idBack',
  ) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast('请上传 JPG / PNG / JPEG 格式图片');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('图片大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      setStep1Errors((e) => ({ ...e, [errorKey]: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleStep1Submit = async () => {
    const next: typeof step1Errors = {};
    if (!licenseUpload) next.license = '请上传企业证照';
    if (!idFrontUpload) next.idFront = '请上传身份证人像面';
    if (!idBackUpload) next.idBack = '请上传身份证国徽面';
    if (!certAgreed) next.agree = '请先阅读并同意企业实名认证服务协议';
    setStep1Errors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 900));
    setSubmitting(false);
    setStep(2);
  };

  const resolveResultStatus = (branch: SimBranch): CertResultStatus => {
    if (branch === 'bank_processing') return 'reviewing';
    return branch;
  };

  const handleStep2Submit = async () => {
    setSubmitting(true);
    await new Promise((r) => window.setTimeout(r, 1000));
    setSubmitting(false);
    setResultStatus(resolveResultStatus(simBranch));
    setStep(3);
  };

  const copyEnterpriseId = async () => {
    try {
      await navigator.clipboard.writeText(ENTERPRISE_USER_ID);
      toast('企业用户 ID 已复制');
    } catch {
      toast('复制失败，请手动复制');
    }
  };

  const canEnterPlatform = resultStatus === 'trial' || resultStatus === 'active';
  const isSoloStep = step !== 1;

  return (
    <div className={styles.certPage}>
      <header className={styles.certHeader}>
        <nav className={styles.stepper} aria-label="认证步骤">
          {STEPS.map((label, idx) => {
            const stepNum = (idx + 1) as CertStep;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={label}>
                {idx > 0 ? (
                  <div
                    className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''} ${isDone ? styles.stepItemDone : ''}`}
                >
                  <div
                    className={`${styles.stepCircle} ${isActive ? styles.stepCircleActive : ''} ${isDone ? styles.stepCircleDone : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isDone ? <Check size={14} strokeWidth={2.5} /> : stepNum}
                  </div>
                  <span
                    className={`${styles.stepLabel} ${isActive || isDone ? styles.stepLabelActive : ''}`}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </header>

      <div className={`${styles.certLayout} ${isSoloStep ? styles.certLayoutSolo : ''}`}>
        <div className={`${styles.certBody} ${isSoloStep ? styles.certBodySolo : ''}`}>
          {step === 1 ? (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>企业证照信息</h2>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => toast('营业执照、登记证书等证照选择指引即将上线')}
                  >
                    证照如何选择？
                  </button>
                </div>

                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>上传方式</span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        checked={uploadMethod === 'pc'}
                        onChange={() => setUploadMethod('pc')}
                      />
                      <span>电脑上传</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        checked={uploadMethod === 'wechat'}
                        onChange={() => {
                          setUploadMethod('wechat');
                          toast('请使用微信扫码在手机端上传（演示）');
                        }}
                      />
                      <span>手机微信上传</span>
                    </label>
                  </div>
                </div>

                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className={styles.hiddenInput}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFilePick(f, setLicenseUpload, 'license');
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className={`${styles.uploadBox} ${licenseUpload ? styles.uploadBoxFilled : ''}`}
                  onClick={() => licenseInputRef.current?.click()}
                >
                  {licenseUpload ? (
                    <img src={licenseUpload} alt="企业证照" className={styles.uploadPreview} />
                  ) : (
                    <>
                      <Plus size={28} className={styles.uploadPlus} />
                      <span>点击上传</span>
                    </>
                  )}
                </button>
                {step1Errors.license ? (
                  <p className={styles.fieldError}>{step1Errors.license}</p>
                ) : null}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>法定代表人信息</h2>
                </div>
                <p className={styles.sectionHint}>需提交企业证照中的法定代表人证件信息</p>

                <div className={styles.selectRow}>
                  <label className={styles.selectField}>
                    <span className={styles.selectLabel}>证件类型</span>
                    <select value={idType} onChange={(e) => setIdType(e.target.value)}>
                      <option value="身份证">身份证</option>
                      <option value="外国人永久居留身份证">外国人永久居留身份证</option>
                      <option value="护照">护照</option>
                    </select>
                  </label>
                  <label className={styles.selectField}>
                    <span className={styles.selectLabel}>类型选项</span>
                    <select value={idForm} onChange={(e) => setIdForm(e.target.value)}>
                      <option value="原件">原件</option>
                      <option value="复印件">复印件</option>
                    </select>
                  </label>
                </div>

                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>上传方式</span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        checked={uploadMethod === 'pc'}
                        onChange={() => setUploadMethod('pc')}
                      />
                      <span>电脑上传</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        checked={uploadMethod === 'wechat'}
                        onChange={() => {
                          setUploadMethod('wechat');
                          toast('请使用微信扫码在手机端上传（演示）');
                        }}
                      />
                      <span>手机微信上传</span>
                    </label>
                  </div>
                </div>

                <div className={styles.idUploadRow}>
                  <input
                    ref={idFrontInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className={styles.hiddenInput}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFilePick(f, setIdFrontUpload, 'idFront');
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={idBackInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className={styles.hiddenInput}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFilePick(f, setIdBackUpload, 'idBack');
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    className={`${styles.idUploadBox} ${idFrontUpload ? styles.uploadBoxFilled : ''}`}
                    onClick={() => idFrontInputRef.current?.click()}
                  >
                    {idFrontUpload ? (
                      <img src={idFrontUpload} alt="人像面" className={styles.uploadPreview} />
                    ) : (
                      <>
                        <Upload size={20} className={styles.idPlaceholderIcon} />
                        <span>上传人像面</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`${styles.idUploadBox} ${idBackUpload ? styles.uploadBoxFilled : ''}`}
                    onClick={() => idBackInputRef.current?.click()}
                  >
                    {idBackUpload ? (
                      <img src={idBackUpload} alt="国徽面" className={styles.uploadPreview} />
                    ) : (
                      <>
                        <Upload size={20} className={styles.idPlaceholderIcon} />
                        <span>上传国徽面</span>
                      </>
                    )}
                  </button>
                </div>
                {step1Errors.idFront ? (
                  <p className={styles.fieldError}>{step1Errors.idFront}</p>
                ) : null}
                {step1Errors.idBack ? (
                  <p className={styles.fieldError}>{step1Errors.idBack}</p>
                ) : null}
              </section>

              <div className={styles.certAgreement}>
                <button
                  type="button"
                  className={`${styles.checkbox} ${certAgreed ? styles.checkboxChecked : ''}`}
                  onClick={() => {
                    setCertAgreed((v) => !v);
                    if (step1Errors.agree) setStep1Errors((e) => ({ ...e, agree: undefined }));
                  }}
                  aria-pressed={certAgreed}
                >
                  {certAgreed ? (
                    <Check size={10} strokeWidth={3} color="#fff" />
                  ) : null}
                </button>
                <span className={styles.certAgreementText}>
                  已阅读并同意{' '}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => toast('企业实名认证服务协议即将上线')}
                  >
                    《企业实名认证服务协议》
                  </button>
                </span>
              </div>
              {step1Errors.agree ? (
                <p className={styles.fieldError}>{step1Errors.agree}</p>
              ) : null}

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleStep1Submit}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : '同意协议并提交'}
              </button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className={styles.verifyHeader}>
                <h2 className={styles.verifyTitle}>请核对并确认智能识别信息</h2>
                <p className={styles.verifyDesc}>
                  系统已从您上传的证照中智能提取以下信息，请核对无误后选择核验方式
                </p>
              </div>

              <div className={styles.ocrGrid}>
                <label className={styles.ocrField}>
                  <span className={styles.ocrLabel}>企业法定名称</span>
                  <input className={styles.ocrInput} value={MOCK_OCR.legalName} readOnly />
                </label>
                <label className={styles.ocrField}>
                  <span className={styles.ocrLabel}>统一社会信用代码</span>
                  <input className={styles.ocrInput} value={MOCK_OCR.creditCode} readOnly />
                </label>
                <label className={styles.ocrField}>
                  <span className={styles.ocrLabel}>法定代表人姓名</span>
                  <input className={styles.ocrInput} value={MOCK_OCR.legalRepName} readOnly />
                </label>
                <label className={styles.ocrField}>
                  <span className={styles.ocrLabel}>法定代表人身份证号</span>
                  <input className={styles.ocrInput} value={MOCK_OCR.legalRepId} readOnly />
                </label>
              </div>

              <h3 className={styles.methodTitle}>核验方式选择</h3>
              <div className={styles.methodCards}>
                <button
                  type="button"
                  className={`${styles.methodCard} ${verifyMethod === 'face' ? styles.methodCardActive : ''}`}
                  onClick={() => setVerifyMethod('face')}
                >
                  <div className={styles.methodCardHead}>
                    <span className={styles.methodRadio} aria-hidden />
                    <span className={styles.methodCardTitle}>
                      法定代表人扫脸核验
                      <span className={styles.recommendTag}>推荐</span>
                    </span>
                    <span className={styles.realtimeTag}>实时生效</span>
                  </div>
                  <p className={styles.methodCardDesc}>
                    法定代表人使用微信或京东 App 扫码完成人脸核验，约 1 分钟出结果
                  </p>
                </button>
                <button
                  type="button"
                  className={`${styles.methodCard} ${verifyMethod === 'bank' ? styles.methodCardActive : ''}`}
                  onClick={() => setVerifyMethod('bank')}
                >
                  <div className={styles.methodCardHead}>
                    <span className={styles.methodRadio} aria-hidden />
                    <span className={styles.methodCardTitle}>企业对公账户打款核验</span>
                  </div>
                  <p className={styles.methodCardDesc}>
                    系统向企业对公账户随机打款小额金额，回填金额完成核验（1-2 个工作日）
                  </p>
                </button>
              </div>

              <div className={styles.simBanner}>
                <span className={styles.simLabel}>仿真认证结果分支：</span>
                <select
                  className={styles.simSelect}
                  value={simBranch}
                  onChange={(e) => setSimBranch(e.target.value as SimBranch)}
                >
                  {SIM_BRANCHES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.step2Actions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setStep(1)}
                >
                  上一步：修改证件
                </button>
                <button
                  type="button"
                  className={styles.primaryBtnWide}
                  onClick={handleStep2Submit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : '确认信息并提交核验'}
                </button>
              </div>
            </>
          ) : null}

          {step === 3 && resultStatus ? (
            canEnterPlatform ? (
              <div className={styles.successPanel}>
                <div className={styles.successIcon} aria-hidden>
                  <Check size={36} strokeWidth={3} color="#fff" />
                </div>
                <h2 className={styles.successTitle}>{RESULT_META[resultStatus].title}</h2>
                <p className={styles.successDesc}>{RESULT_META[resultStatus].desc}</p>

                {resultStatus === 'trial' ? (
                  <div className={styles.benefitBox}>
                    <p className={styles.benefitHeading}>您已获得以下完整权益：</p>
                    <ul className={styles.benefitList}>
                      <li>数字客服坐席全量开放（支持多坐席协同接待）</li>
                      <li>京小灵 AI 数字员工知识库自由训练</li>
                      <li>免费体验期：30 天（有效期至 2026-09-09）</li>
                    </ul>
                  </div>
                ) : (
                  <div className={styles.benefitBox}>
                    <p className={styles.benefitHeading}>您已获得以下完整权益：</p>
                    <ul className={styles.benefitList}>
                      <li>数字客服坐席全量开放（支持多坐席协同接待）</li>
                      <li>京小灵 AI 数字员工知识库自由训练</li>
                      <li>正式服务已开通，平台能力全量可用</li>
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.successPrimaryBtn}
                  onClick={() => onEnterPlatform?.(contactPhone)}
                >
                  查看已认证企业 (租户列表)
                </button>
              </div>
            ) : (
              <div className={styles.resultPanel}>
                <div className={`${styles.resultCard} ${styles[`resultCard_${RESULT_META[resultStatus].tone}`]}`}>
                  <div className={styles.resultBadge}>{RESULT_META[resultStatus].title}</div>
                  <p className={styles.resultDesc}>{RESULT_META[resultStatus].desc}</p>
                  <div className={styles.resultMeta}>
                    <span>联系人：{contactName}</span>
                    <span>手机号：{contactPhone}</span>
                    <span>企业名称：{MOCK_OCR.legalName}</span>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  {resultStatus === 'failed' ? (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => {
                        setStep(1);
                        setResultStatus(null);
                      }}
                    >
                      重新提交证件
                    </button>
                  ) : null}
                  <button type="button" className={styles.secondaryBtn} onClick={onBack}>
                    返回登录
                  </button>
                </div>
              </div>
            )
          ) : null}
        </div>

        {step === 1 ? (
          <aside className={styles.sidebar} aria-label="认证辅助助手">
            <div className={styles.sidebarIdBar}>
              <span>企业用户ID: {ENTERPRISE_USER_ID}</span>
              <button type="button" className={styles.copyBtn} onClick={copyEnterpriseId} aria-label="复制">
                <Copy size={14} />
              </button>
            </div>
            <div className={styles.sidebarTabs}>
              <button
                type="button"
                className={sidebarTab === 'rules' ? styles.sidebarTabActive : styles.sidebarTab}
                onClick={() => setSidebarTab('rules')}
              >
                法人信息上传
              </button>
              <button
                type="button"
                className={sidebarTab === 'guide' ? styles.sidebarTabActive : styles.sidebarTab}
                onClick={() => setSidebarTab('guide')}
              >
                报错指引
              </button>
            </div>
            <div className={styles.sidebarContent}>
              {sidebarTab === 'rules' ? (
                <div className={styles.rulePanel}>
                  <h4 className={styles.ruleH4}>法人信息上传规则：</h4>
                  <div className={styles.ruleBlock}>
                    <h5 className={styles.ruleH5}>【支持的证件类型】</h5>
                    {[
                      '中华人民共和国居民身份证',
                      '外籍护照',
                      '港澳居民来往大陆通行证 / 台湾居民来往大陆通行证',
                      '港澳居民居住证 / 台湾居民居住证',
                      '外国人永久居留身份证',
                      '营业执照（仅限有限合伙企业）',
                    ].map((item) => (
                      <p key={item} className={styles.ruleP}>
                        <span className={styles.blueDot} aria-hidden>
                          ●
                        </span>
                        {item}
                      </p>
                    ))}
                    <p className={styles.ruleNote}>
                      法人证件选择&quot;营业执照&quot;时，请上传执行事务合伙人的营业执照。
                    </p>
                  </div>

                  <h4 className={styles.ruleH4}>【证照上传规则（不符合将被驳回）】</h4>
                  <div className={styles.ruleGrayBox}>
                    <p>
                      <b>一、证件主体</b>
                    </p>
                    <p>企业：提交法定代表人的证件</p>
                    <p>个体工商户：提交经营者的身份证</p>
                    <p>
                      <b>二、证件要求</b>
                    </p>
                    <p>上传证件原件彩色照片，可快速审核</p>
                    <p>如用复印件，须加盖彩色公章（避开证件内容），审核需 1–2 个工作日</p>
                    <p>
                      <b>三、照片要求</b>
                    </p>
                    <p>格式：JPG / PNG / JPEG，大小 ≤ 5M</p>
                    <p>内容：文字清晰可辨</p>
                    <p>拍摄：四角完整、光线均匀、画面清晰</p>
                    <p>禁止：模糊、反光、遮挡、翻拍、PS、水印</p>
                  </div>
                </div>
              ) : (
                <div className={styles.guidePanel}>
                  <p className={styles.guideTipTitle}>信息报错无法提交，报错指引帮助您~~</p>
                  <p className={styles.guideTipDesc}>可对照常见报错原因，查看具体解决方案</p>
                  <div className={styles.guideSearchTitle}>报错问题索引</div>
                  <ul className={styles.guideIndexList}>
                    <li>证照模糊 / 文字不清晰：请重新拍摄原件后再上传</li>
                    <li>主体不一致：确保证件与营业执照法定代表人一致</li>
                    <li>格式错误：仅支持 JPG、PNG、JPEG 格式</li>
                    <li>文件过大：压缩至 5MB 以内后重新上传</li>
                    <li>重复提交：认证审核中请勿重复操作</li>
                  </ul>
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
};
