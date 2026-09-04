/**
 * 企业认证 · 留资加急弹窗（统一走 ApplicationLeadModal）
 */

import React, { useMemo } from 'react';
import {
  ApplicationLeadModal,
  type ApplicationLeadPayload,
} from './common/ApplicationLeadModal';

export type CertExpediteLeadPayload = {
  name: string;
  phone: string;
  company: string;
  remark: string;
  certStatusLabel: string;
  jobTitle?: string;
  companyScale?: string;
  businessScenario?: string;
  urgency?: string;
  verifyCode?: string;
};

type CertExpediteLeadModalProps = {
  open: boolean;
  certStatusLabel: string;
  defaultName: string;
  defaultPhone: string;
  defaultCompany: string;
  onClose: () => void;
  onSubmitted?: (payload: CertExpediteLeadPayload) => void;
};

export const CertExpediteLeadModal: React.FC<CertExpediteLeadModalProps> = ({
  open,
  certStatusLabel,
  defaultName,
  defaultPhone,
  defaultCompany,
  onClose,
  onSubmitted,
}) => {
  const defaults = useMemo(
    () => ({
      name: defaultName,
      phone: defaultPhone,
      company: defaultCompany,
      message: `企业实名认证加急 · 当前状态：${certStatusLabel}`,
      businessScenario: 'enterprise',
    }),
    [certStatusLabel, defaultCompany, defaultName, defaultPhone],
  );

  const handleSubmitted = (lead: ApplicationLeadPayload) => {
    onSubmitted?.({
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      remark: lead.message,
      certStatusLabel,
      jobTitle: lead.jobTitle,
      companyScale: lead.companyScaleLabel,
      businessScenario: lead.businessScenarioLabel,
      urgency: lead.urgencyLabel,
      verifyCode: lead.verifyCode,
    });
  };

  return (
    <ApplicationLeadModal
      open={open}
      onClose={onClose}
      title="联系京小灵 · 留资加急"
      description="留下联系方式后，京小灵顾问将优先协助您推进企业实名认证。"
      submitLabel="提交加急申请"
      successTitle="加急申请已提交"
      successDescription="专属顾问已收到您的加急申请，将优先跟进企业认证进度。"
      defaults={defaults}
      onSubmitted={handleSubmitted}
    />
  );
};
