/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 号码管理（Number Management）类型定义
 */

export interface HotlinePhoneNumberItem {
  id: string;
  areaCode: string;       // 区号，例如 "010", "021", "0755"
  phoneNumber: string;    // 号码，例如 "95013-8201"
  boundAgent: string | null; // 绑定的智能体名称，null 表示未绑定
  remark: string;         // 备注，例如 "华北配送热线"
  createdAt?: string;
  updatedAt?: string;
}

export interface PhoneNumberFilterState {
  boundAgent: string;     // 'all' | 'unbound' | string (具体智能体)
  searchQuery: string;    // 完整号码或尾号
  onlyUnbound: boolean;   // 只查看未绑定智能体的号码
}

export interface VoiceAgentOption {
  id: string;
  name: string;
  modelBadge?: string;
  description?: string;
}
