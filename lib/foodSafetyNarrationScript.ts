/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险客户体验 — 配音字幕时间轴。
 * 字幕尽量沿用产品原句，仅 speakText 做发音处理（SOP→S O P）。
 * 配音：edge-tts zh-CN-YunxiNeural（正常语速）。
 */

export type NarrationCue = {
  atMs: number;
  durationMs: number;
  /** 字幕展示文案（产品原句） */
  text: string;
  /** 合成口播；缺省等于 text。「SOP」→「S O P」 */
  speakText?: string;
  audioId: string;
};

export type NarrationSegmentId =
  | 'intro'
  | 'pre_act1'
  | 'act1'
  | 'act2'
  | 'act3';

export const NARRATION_INTRO_FADE_MS = 600;
export const NARRATION_INTRO_LEAD_MS = 1200;

/**
 * 口播映射（与左右对话串行）
 * 1 intro：短开场
 * 2 pre_act1：思维链「主动预测」→ 左侧主动开口
 * 3 act1：用户发言后 → 先安抚 → 再 SOP/知识库
 * 4 act2 / 5 act3
 */
export const FOOD_SAFETY_NARRATION: Record<NarrationSegmentId, NarrationCue[]> = {
  intro: [
    {
      atMs: 0,
      durationMs: 2928,
      audioId: 'intro_0',
      text: '以保险售后咨询场景为例',
    },
  ],
  pre_act1: [
    {
      atMs: 0,
      durationMs: 4272,
      audioId: 'pre_act1_0',
      text: '数字员工自主规划、主动预测用户餐品质量问题',
    },
  ],
  act1: [
    {
      atMs: 0,
      durationMs: 7632,
      audioId: 'pre_act1_1',
      text: '用户反馈外卖就餐不舒服如何理赔，模型根据服务原则先安抚用户、再去找理赔规则',
    },
    {
      atMs: 7632,
      durationMs: 6816,
      audioId: 'act1_0',
      text: 'Skill中约定了要查看理赔SOP，数字员工自主思考查知识库反馈客户',
      speakText:
        'Skill 中约定了要查看理赔 S O P，数字员工自主思考查知识库反馈客户',
    },
  ],
  act2: [
    {
      atMs: 0,
      durationMs: 5160,
      audioId: 'act2_0',
      text: '用户申请推进流程，数字员工无侵入调用业务系统给结果',
    },
    {
      atMs: 5160,
      durationMs: 5856,
      audioId: 'act2_1',
      text: '无需接口对接，登录业务系统，输入订单完成查询，给出处理结果',
    },
  ],
  act3: [
    {
      atMs: 0,
      durationMs: 7200,
      audioId: 'act3_0',
      text: '客户道谢，数字员工礼貌安抚，保存本次服务记忆，帮助后续问题更懂用户高效解决',
    },
  ],
};

export function sumNarrationDuration(segment: NarrationSegmentId): number {
  return FOOD_SAFETY_NARRATION[segment].reduce((sum, c) => sum + c.durationMs, 0);
}

export const NARRATION_INTRO_HOLD_MS = sumNarrationDuration('intro');

export const NARRATION_ACT_DURATION_MS = {
  act1: sumNarrationDuration('act1'),
  act2: sumNarrationDuration('act2'),
  act3: sumNarrationDuration('act3'),
} as const;

export function formatNarrationSubtitle(raw: string): string {
  return raw.replace(/[。．.！!？?\s]+$/u, '').trim();
}

export function getNarrationCues(segment: NarrationSegmentId): NarrationCue[] {
  return FOOD_SAFETY_NARRATION[segment] ?? [];
}

export function getNarrationSpeakText(cue: NarrationCue): string {
  return cue.speakText ?? cue.text;
}
