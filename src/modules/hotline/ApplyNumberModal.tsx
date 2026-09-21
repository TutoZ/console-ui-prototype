/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 申请号码须知弹窗（对齐设计图）
 */

import React from 'react';
import { X } from '@/lib/icons';

interface ApplyNumberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newNumber: any) => void;
  availableAgents?: any[];
}

export const ApplyNumberModal: React.FC<ApplyNumberModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-neutral-100/80 p-6 transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            {/* 蓝色实心圆形 i 图标 */}
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs shadow-blue-500/30">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              申请号码须知
            </h3>
          </div>

          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* 文本内容说明 */}
        <div className="pt-2 pb-6 px-1">
          <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed tracking-normal">
            提交号码申请后，京小灵运营人员将通过后台手动为本系统添加号码，可能存在一定延迟。如有需要，可联系运营人员确认进度
          </p>
        </div>

        {/* 底部按钮栏：居右「我知道了」 */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-xs shadow-blue-600/20 cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

