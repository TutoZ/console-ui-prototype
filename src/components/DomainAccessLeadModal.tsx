/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 域权限开通 · 留资弹窗（统一走 ApplicationLeadModal）
 */

import React, { useMemo } from 'react';
import {
  ApplicationLeadModal,
  type ApplicationLeadPayload,
} from './common/ApplicationLeadModal';

export type DomainLeadPayload = {
  name: string;
  phone: string;
  company: string;
  need: string;
  domainTitle: string;
  jobTitle?: string;
  companyScale?: string;
  businessScenario?: string;
  urgency?: string;
  verifyCode?: string;
};

type DomainAccessLeadModalProps = {
  open: boolean;
  domainTitle: string;
  onClose: () => void;
  onSubmitted?: (payload: DomainLeadPayload) => void;
};

function mapDomainScenario(domainTitle: string): string | undefined {
  if (domainTitle.includes('电话销售') || domainTitle.includes('电销')) return 'telesales';
  if (domainTitle.includes('客服') || domainTitle.includes('在线')) return 'customer_service';
  if (domainTitle.includes('外呼') || domainTitle.includes('催收')) return 'acquisition';
  return undefined;
}

export const DomainAccessLeadModal: React.FC<DomainAccessLeadModalProps> = ({
  open,
  domainTitle,
  onClose,
  onSubmitted,
}) => {
  const defaultBusinessScenario = useMemo(() => mapDomainScenario(domainTitle), [domainTitle]);

  const handleSubmitted = (lead: ApplicationLeadPayload) => {
    onSubmitted?.({
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      need: lead.message || lead.businessScenarioLabel,
      domainTitle,
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
      title={`开通「${domainTitle}」权限`}
      description="当前账号暂无该业务域权限。留下联系方式后，顾问将协助开通试用。"
      submitLabel="提交开通申请"
      successTitle="申请已提交"
      successDescription="顾问将在 1 个工作日内联系您，协助完成权限开通与上岗配置。"
      defaultBusinessScenario={defaultBusinessScenario}
      onSubmitted={handleSubmitted}
    />
  );
};
