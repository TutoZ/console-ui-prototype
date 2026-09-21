import React from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles } from '@/lib/icons';
import { CallRecord } from './callRecordsTypes';

interface CallLabelDetailModalProps {
  call: CallRecord;
  onClose: () => void;
}

export const CallLabelDetailModal: React.FC<CallLabelDetailModalProps> = ({ call, onClose }) => {
  const detail = call.labelDetail;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="label-detail-title"
        className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 id="label-detail-title" className="text-sm font-semibold text-neutral-900 leading-tight">
                标签判定详情
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                大模型智能意图判定与规则推理过程
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
          {/* Tag badge summary */}
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-sky-800 font-medium block">大模型判定标签</span>
              <span className="text-sm font-semibold text-sky-950 mt-0.5 inline-block">
                {call.llmLabel}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-sky-800 font-medium block">判定置信度</span>
              <span className="text-sm font-mono font-bold text-sky-700 mt-0.5 inline-block">
                {(detail.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Model & Rule info */}
          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3.5 text-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">判定模型:</span>
              <span className="font-mono text-[11px] font-medium text-neutral-800">{detail.modelName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">匹配规则:</span>
              <span className="font-medium text-neutral-900">{detail.ruleName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">命中意图:</span>
              <span className="text-sky-700 font-medium">{detail.matchedIntent}</span>
            </div>
          </div>

          {/* Trigger reason */}
          <div>
            <h4 className="text-[11px] font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              判定触发依据
            </h4>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-700 leading-relaxed text-[11.5px]">
              {detail.triggerReason}
            </div>
          </div>

          {/* Conditions checklist */}
          <div>
            <h4 className="text-[11px] font-semibold text-neutral-900 mb-2">
              判定规则条件满足情况
            </h4>
            <div className="space-y-2">
              {detail.conditions.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-neutral-200/80 bg-white flex items-start gap-2.5"
                >
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-neutral-800 text-[11px]">{c.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 font-medium">
                        已满足
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[11px] mt-0.5 leading-snug">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
