/**
 * 接待记录 / 呼叫记录数据模型与类型定义
 */

export type HangupParty = '客户挂断' | '坐席挂断' | '系统挂断' | '数字员工挂断';

export interface CallUtterance {
  id: string;
  sender: 'ai' | 'customer';
  speakerName: string;
  text: string;
  timestamp: string;
  nodeName?: string; // 流程节点，例如 "开始流程-普通节点"、"核验身份节点"、"预约确认节点"
  nonInterruptSeconds?: number; // 播报前几秒不可打断
  audioDurationSeconds?: number;
  remark?: string;
  correction?: {
    originalText: string;
    correctedText: string;
    correctedAt: string;
  };
  flag?: string; // 质检标记，如 'ASR识别错误' | '播报超时' | '流程错位' | '质检扣分' | '优秀话术'
}

export interface LabelDeterminationDetail {
  ruleName: string;
  modelName: string;
  confidence: number;
  matchedIntent: string;
  triggerReason: string;
  conditions: {
    title: string;
    matched: boolean;
    detail: string;
  }[];
}

export interface CallRecord {
  id: string; // Call ID, 例如 "CALL-20260810-093641"
  callInTime: string; // 呼入时间, 例如 "2026-08-10 09:36:41"
  customerPhone: string; // 客户号码, 例如 "13812342687"
  agentName: string; // 数字员工名称, 例如 "保通保险客服专员"
  agentId?: string;
  location: string; // 号码归属地, 例如 "北京"
  duration: string; // 通话时长, 例如 "04分26秒"
  durationSeconds: number; // 通话秒数
  rounds: number; // 对话轮次
  hangupParty: HangupParty; // 挂断方
  tags: string[]; // 通话标签, 例如 ["配送预约", "日期确认", "高意向"]
  llmLabel: string; // 大模型标签, 例如 "预约确认成功"
  labelDetail: LabelDeterminationDetail;
  metrics: {
    aiSpeechRatio: string; // 例如 "61.40%"
    aiSpeechRatioNum: number;
    longestCustomerNarrative: string; // 例如 "2.1秒"
    longestAiMonologue: string; // 例如 "3.3秒"
    totalRounds: number; // 例如 5
  };
  sessionRemark?: string; // 会话级备注
  utterances: CallUtterance[];
}

export interface CallFilterState {
  timeQuickRange: 'today' | 'yesterday' | 'week' | 'month';
  dateFrom: string;
  dateTo: string;
  callIdQuery: string;
  phoneQuery: string;
  agentFilter: string;
  locationFilter: string;
  hangupPartyFilter: string;
  tagFilter: string;
}
