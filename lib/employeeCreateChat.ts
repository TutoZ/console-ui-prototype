/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 数字员工创建对话 — 澄清题 / 确认要点（交互对齐技能创建，内容域不同）
 */

import type { SkillClarifyQuestion } from '@/components/skills/SkillClarifyCard';
import type { SkillConfirmItem } from '@/components/skills/SkillRoundConfirmCard';
import { formatClarifyAnswers } from '@/lib/skillStudioMock';

export type EmployeeDraftLike = {
  name: string;
  personality: string;
  description: string;
  duties: string;
  prohibited: string;
  skills: Array<{ name: string; desc: string }>;
  knowledgeBases: Array<{ name: string; desc: string }>;
};

/** 首轮补充信息 — 对齐岗位 / 能力 / 边界 */
export function buildEmployeeClarifyQuestions(intent: string): SkillClarifyQuestion[] {
  const text = intent.trim();
  const has = (...keys: string[]) => keys.some((k) => text.includes(k));

  const isInsurance = has('保险', '理赔', '延保', '食安');
  const isIt = has('IT', '技术支持', '故障', '派单');
  const isSales = has('外呼', '电销', '催收', '拓客');

  const sceneDefault = isInsurance
    ? 'scene-claim'
    : isIt
      ? 'scene-it'
      : isSales
        ? 'scene-outbound'
        : has('客服', '咨询', '接待')
          ? 'scene-cs'
          : null;

  const toneDefault = has('高价值', 'VIP', '回访', '共情')
    ? 'tone-warm'
    : has('催收', '质检', '严谨')
      ? 'tone-strict'
      : null;

  const boundaryDefault = has('赔付', '承诺', '红线', '投诉')
    ? 'boundary-escalate'
    : has('自主', '完结')
      ? 'boundary-self'
      : 'boundary-mixed';

  return [
    {
      id: 'service-scene',
      prompt: '这个数字员工主要服务什么场景？',
      required: true,
      selectedId: sceneDefault,
      options: [
        { id: 'scene-cs', label: '在线客服咨询与办理' },
        { id: 'scene-claim', label: '保险理赔咨询与资料预审' },
        { id: 'scene-it', label: 'IT 报修与工单派发' },
        { id: 'scene-outbound', label: '外呼催收 / 电销拓客' },
      ],
    },
    {
      id: 'service-tone',
      prompt: '沟通风格更偏向？',
      required: true,
      selectedId: toneDefault,
      options: [
        { id: 'tone-warm', label: '亲和共情，主动关怀' },
        { id: 'tone-pro', label: '严谨专业，结论清晰' },
        { id: 'tone-strict', label: '克制礼貌，强调规范与边界' },
        { id: 'tone-mixed', label: '先安抚再给可执行步骤' },
      ],
    },
    {
      id: 'boundary-policy',
      prompt: '遇到边界或超权限诉求如何处理？',
      required: true,
      selectedId: boundaryDefault,
      options: [
        { id: 'boundary-escalate', label: '达到红线即转人工，不擅自承诺' },
        { id: 'boundary-self', label: '简单问题可自主完结' },
        { id: 'boundary-mixed', label: '先收集信息，复杂 case 转人工' },
        { id: 'boundary-generic', label: '暂不确定，先写通用兜底话术' },
      ],
    },
  ];
}

export { formatClarifyAnswers };

export function buildEmployeeConfirmItems(draft: EmployeeDraftLike): SkillConfirmItem[] {
  const skillSummary =
    draft.skills.length > 0
      ? draft.skills.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
      : '（待补充）';
  const kbSummary =
    draft.knowledgeBases.length > 0
      ? draft.knowledgeBases.map((k, i) => `${i + 1}. ${k.name}`).join('\n')
      : '（待补充）';

  return [
    {
      id: 'name',
      label: draft.name || '未命名数字员工',
      checked: true,
      fieldLabel: '员工名称',
      value: draft.name,
    },
    {
      id: 'description',
      label: draft.description.slice(0, 80) || '员工描述',
      checked: true,
      fieldLabel: '员工描述',
      value: draft.description,
    },
    {
      id: 'personality',
      label: draft.personality.slice(0, 60) || '语言风格',
      checked: true,
      fieldLabel: '语言风格',
      value: draft.personality,
    },
    {
      id: 'duties',
      label: draft.duties.slice(0, 60) || '职责&服务场景',
      checked: true,
      fieldLabel: '职责&服务场景',
      value: draft.duties,
    },
    {
      id: 'prohibited',
      label: draft.prohibited.slice(0, 60) || '约束&限制',
      checked: true,
      fieldLabel: '约束&限制',
      value: draft.prohibited,
    },
    {
      id: 'skills',
      label: skillSummary.slice(0, 80),
      checked: true,
      fieldLabel: '技能&工作流',
      value: skillSummary,
    },
    {
      id: 'knowledgeBases',
      label: kbSummary.slice(0, 80),
      checked: true,
      fieldLabel: '背景知识',
      value: kbSummary,
    },
  ];
}

export const EMPLOYEE_REPLY_CHIPS = [
  { id: 'persona', label: '补充性格人设', send: '请把员工性格写得更具体，突出共情与专业边界' },
  { id: 'duty', label: '细化工作职责', send: '请把工作职责拆成更可执行的步骤' },
  { id: 'prohibit', label: '收紧禁止行为', send: '请补充禁止行为与红线，强调不得擅自承诺赔付' },
  { id: 'skill', label: '再加一项技能', send: '请再规划一项与主场景强相关的技能' },
  { id: 'kb', label: '补充知识库', send: '请再规划一个业务红线或 SOP 知识库' },
] as const;
