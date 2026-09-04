/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 资源中心等「详见 PRD / 本期占位」页
 */

import React from 'react';
import { PAGE } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { OnlinePageHeader } from './common/OnlinePageLayout';

export const ResourcesPlaceholderPage: React.FC<{
  title: string;
  description: string;
  prdHint?: string;
}> = ({ title, description, prdHint }) => {
  return (
    <div className={cn(PAGE, 'custom-scrollbar')}>
      <OnlinePageHeader title={title} />
      <div className="max-w-lg mt-8 space-y-3">
        <p className="text-[13px] text-neutral-500 leading-relaxed">{description}</p>
        {prdHint ? (
          <p className="text-[11px] text-neutral-400 leading-relaxed">{prdHint}</p>
        ) : null}
      </div>
    </div>
  );
};
