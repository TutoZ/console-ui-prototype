/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 食安险客户体验 — 配音字幕时间轴（压缩至约 50s）。
 * 一句只说一次；幕间不重播收尾。
 * 配音：edge-tts zh-CN-YunxiNeural（正常语速）。
 *
 * ## 概念
 * - 触发理赔 SOP 技能 → 先知识库告知规则 → 再调食源性疾病理赔 SOP → 请选订单
 * - 字幕「调」；合成「吊」（diào）；「SOP」→「S O P」
 */

export type NarrationCue = {
  atMs: number;
  durationMs: number;
  /** 字幕展示文案 */
  text: string;
  /**
   * 合成口播文案；缺省等于 text。
   * 「调取」→「吊取」；「SOP」→「S O P」
   */
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
/** 开场画面先静默再开读 */
export const NARRATION_INTRO_LEAD_MS = 1200;

/**
 * 连贯口播（剧情线，压缩版）
 *
 * pre_act1：客户问题
 * act1：命中 SOP → 先知识库 → 再 SOP → 请选订单
 * act2：不必人工/改接口 → Browser Use 核对实付
 * act3：礼貌收尾 + 保留记忆
 */
export const FOOD_SAFETY_NARRATION: Record<NarrationSegmentId, NarrationCue[]> = {
  intro: [
    {
      atMs: 0,
      durationMs: 5016,
      audioId: 'intro_0',
      text: '用一条食安险咨询，看数字员工怎么把事办对',
    },
  ],
  pre_act1: [
    {
      atMs: 0,
      durationMs: 4128,
      audioId: 'pre_act1_0',
      text: '客户吃完外卖不舒服还吐了，想理赔',
    },
  ],
  act1: [
    {
      atMs: 0,
      durationMs: 6288,
      audioId: 'act1_0',
      text: '触发理赔SOP技能，先调知识库核对规则告诉客户',
      speakText: '触发理赔 S O P 技能，先吊知识库核对规则告诉客户',
    },
    {
      atMs: 6288,
      durationMs: 6216,
      audioId: 'act1_1',
      text: '再调食源性疾病理赔SOP推进流程，请客户选订单',
      speakText: '再吊取食源性疾病理赔 S O P 推进流程，请客户选订单',
    },
  ],
  act2: [
    {
      atMs: 0,
      durationMs: 5376,
      audioId: 'act2_0',
      text: '不必人工查询、不必改接口，用 Browser Use 核对实付',
    },
    {
      atMs: 5376,
      durationMs: 4896,
      audioId: 'act2_1',
      text: '打开订单页查询，读出餐品、状态和金额',
    },
  ],
  act3: [
    {
      atMs: 0,
      durationMs: 5640,
      audioId: 'act3_0',
      text: '客户道谢，礼貌收尾并保留记忆，有问题随时再找它',
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

/** 合成用文案；字幕仍用 cue.text */
export function getNarrationSpeakText(cue: NarrationCue): string {
  return cue.speakText ?? cue.text;
}
