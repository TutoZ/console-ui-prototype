/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 域无权限空态：复用首页插画缺省页 + 留资开通 CTA
 */

import React from 'react';
import { RELAY_HOME_ASSETS } from '@/lib/relayHomeAssets';
import { BTN_INK } from '@/lib/ui';
import { cn } from '@/lib/utils';
import homeStyles from './employees/relay/EmployeeHomeRelay.module.scss';

type DomainNoAccessStateProps = {
  domainTitle: string;
  submitted?: boolean;
  onApply: () => void;
};

export const DomainNoAccessState: React.FC<DomainNoAccessStateProps> = ({
  domainTitle,
  submitted = false,
  onApply,
}) => {
  const title = submitted ? '开通申请已提交' : `暂无${domainTitle}权限`;
  const subtitle = submitted
    ? '顾问将尽快与您联系。在开通完成前，该业务域内容暂不可访问。'
    : '当前账号未开通该业务域。申请试用后，顾问将协助完成权限配置与数字员工上岗。';
  const actionLabel = submitted ? '更新开通申请' : '申请开通试用';

  return (
    <div className="flex flex-1 min-h-0 w-full items-center justify-center">
      <div className={cn(homeStyles.emptyState, '!py-0')}>
        <img className={homeStyles.emptyImage} src={RELAY_HOME_ASSETS.employeesEmpty} alt="" />
        <div className={cn(homeStyles.emptyTextGroup, 'px-4')}>
          <div className={cn(homeStyles.emptyTitle, 'text-center')}>{title}</div>
          <div className={cn(homeStyles.emptySubtitle, 'text-center whitespace-nowrap')}>
            {subtitle}
          </div>
        </div>
        <button
          type="button"
          className={cn(BTN_INK, 'mt-5 min-w-[180px] h-9 px-5 text-[13px]')}
          onClick={onApply}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};
