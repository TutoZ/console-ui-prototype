/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 号码管理初始数据与智能体列表（精准对齐设计图）
 */

import { HotlinePhoneNumberItem, VoiceAgentOption } from './numberManagementTypes';

export const INITIAL_PHONE_NUMBERS: HotlinePhoneNumberItem[] = [
  {
    id: 'num-01',
    areaCode: '010',
    phoneNumber: '95013-8201',
    boundAgent: '配送预约客服',
    remark: '华北配送热线',
    createdAt: '2026-05-10 10:00:00',
    updatedAt: '2026-06-01 14:20:00',
  },
  {
    id: 'num-02',
    areaCode: '021',
    phoneNumber: '95013-8206',
    boundAgent: '配送预约客服',
    remark: '华东主线路',
    createdAt: '2026-05-12 11:30:00',
    updatedAt: '2026-06-02 09:15:00',
  },
  {
    id: 'num-03',
    areaCode: '0755',
    phoneNumber: '95013-8212',
    boundAgent: '售后回访助手',
    remark: '售后专线',
    createdAt: '2026-05-15 15:40:00',
    updatedAt: '2026-06-05 16:30:00',
  },
  {
    id: 'num-04',
    areaCode: '028',
    phoneNumber: '95013-8220',
    boundAgent: null,
    remark: '待配置',
    createdAt: '2026-05-18 09:10:00',
    updatedAt: '2026-06-08 11:00:00',
  },
  {
    id: 'num-05',
    areaCode: '027',
    phoneNumber: '95013-8223',
    boundAgent: '配送预约客服',
    remark: '华中配送热线',
    createdAt: '2026-05-20 14:00:00',
    updatedAt: '2026-06-10 10:45:00',
  },
  {
    id: 'num-06',
    areaCode: '025',
    phoneNumber: '95013-8228',
    boundAgent: null,
    remark: '备用线路',
    createdAt: '2026-05-22 16:20:00',
    updatedAt: '2026-06-12 17:00:00',
  },
  {
    id: 'num-07',
    areaCode: '010',
    phoneNumber: '95013-8801',
    boundAgent: null,
    remark: '华北应急热线',
    createdAt: '2026-05-25 08:30:00',
    updatedAt: '2026-06-15 13:20:00',
  },
  {
    id: 'num-08',
    areaCode: '021',
    phoneNumber: '95013-8802',
    boundAgent: null,
    remark: '华东储备号码',
    createdAt: '2026-05-28 10:50:00',
    updatedAt: '2026-06-16 15:10:00',
  },
  {
    id: 'num-09',
    areaCode: '0571',
    phoneNumber: '95013-8803',
    boundAgent: null,
    remark: '浙江专线号码',
    createdAt: '2026-06-01 11:15:00',
    updatedAt: '2026-06-18 09:40:00',
  },
  {
    id: 'num-10',
    areaCode: '020',
    phoneNumber: '95013-8805',
    boundAgent: null,
    remark: '华南备用热线',
    createdAt: '2026-06-05 14:40:00',
    updatedAt: '2026-06-19 18:00:00',
  },
];

/** 目标语音智能体候选（Image 2 中选项） */
export const VOICE_AGENT_OPTIONS: VoiceAgentOption[] = [
  { id: 'agent-1', name: '呼入接待坐席 (大模型)', modelBadge: '大模型' },
  { id: 'agent-2', name: '售后咨询呼入人员 (大模型)', modelBadge: '大模型' },
  { id: 'agent-3', name: '售前咨询接待员 (大模型)', modelBadge: '大模型' },
  { id: 'agent-4', name: '保通保险客服专员 (大模型)', modelBadge: '大模型' },
  { id: 'agent-5', name: '续保理赔接听员 (大模型)', modelBadge: '大模型' },
  { id: 'agent-6', name: '投诉退换处理坐席 (大模型)', modelBadge: '大模型' },
  { id: 'agent-7', name: '配送预约客服', modelBadge: '大模型' },
  { id: 'agent-8', name: '售后回访助手', modelBadge: '大模型' },
];
