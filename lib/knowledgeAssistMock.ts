/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 知识搭子 · 文档处理对话 mock（对齐截图：清洗 → 分片 / QA → 确认入库）
 */

import type { SkillThinkStep } from '@/lib/skillStudioMock';

export type KnowledgeChunkKind = 'text' | 'qa';

export type KnowledgeProcessFile = {
  id: string;
  name: string;
  kind: KnowledgeChunkKind;
  count: number;
  sizeLabel: string;
  meta: string;
};

export type KnowledgeTextChunk = {
  id: string;
  source: string;
  chars: number;
  body: string;
};

export type KnowledgeQaChunk = {
  id: string;
  source: string;
  chars: number;
  question: string;
  answer: string;
  evidence: string;
};

export type KnowledgeProcessResult = {
  sourceFileName: string;
  sourceSizeLabel: string;
  total: number;
  textCount: number;
  qaCount: number;
  filteredCount: number;
  files: KnowledgeProcessFile[];
  textChunks: KnowledgeTextChunk[];
  qaChunks: KnowledgeQaChunk[];
};

export const DEFAULT_KB_PROCESS_PROMPT =
  '请清理文档中的无效格式和重复内容，提取适合客服使用的问答对，并按照业务主题生成普通文本分片。';

export function buildKnowledgeProcessThinkSteps(fileName: string): SkillThinkStep[] {
  const shortName = fileName.length > 28 ? `${fileName.slice(0, 26)}…` : fileName;
  return [
    {
      id: 'parse',
      label: '解析工作表结构',
      detail: `正在读取「${fileName}」的 Sheet 与行列范围，识别业务主题边界。`,
      status: 'done',
      children: [
        { id: 'parse-read', label: `已读取 \`${shortName}\``, kind: 'read' },
        { id: 'parse-run', label: '已扫描工作表结构与行列范围', kind: 'run' },
      ],
    },
    {
      id: 'clean',
      label: '清洗无效与重复内容',
      detail: '过滤空行、合并重复问答，保留可追溯的原表行号。',
      status: 'done',
      children: [
        { id: 'clean-run', label: '已过滤空行与重复问答', kind: 'run' },
        { id: 'clean-note', label: '已保留原表行号坐标', kind: 'note' },
      ],
    },
    {
      id: 'chunk',
      label: '生成文本分片与 QA',
      detail: '按语义边界切分普通文本分片，并抽取高频客服问答对。',
      status: 'done',
      children: [
        { id: 'chunk-run', label: '已生成普通文本分片候选', kind: 'run' },
        { id: 'chunk-run-qa', label: '已抽取客服 QA 问答对', kind: 'run' },
        { id: 'chunk-note', label: '准备输出分片预览与入库确认', kind: 'note' },
      ],
    },
  ];
}

export function buildKnowledgeProcessResult(fileName: string, sizeLabel = '37.90 KB'): KnowledgeProcessResult {
  const base = fileName.replace(/\.[^.]+$/, '') || '知识文档';
  return {
    sourceFileName: fileName,
    sourceSizeLabel: sizeLabel,
    total: 91,
    textCount: 55,
    qaCount: 36,
    filteredCount: 8,
    files: [
      {
        id: 'text',
        name: `${base}_文本分片.jsonl`,
        kind: 'text',
        count: 55,
        sizeLabel: '68 KB',
        meta: '单行即一条候选 Chunk',
      },
      {
        id: 'qa',
        name: `${base}_QA问答.jsonl`,
        kind: 'qa',
        count: 36,
        sizeLabel: '42 KB',
        meta: '单行即一条候选 Chunk',
      },
    ],
    textChunks: [
      {
        id: 'text_001',
        source: `${fileName} · Sheet: 产品介绍 · 第 18-21 行`,
        chars: 108,
        body: '食安责任险承保因食品安全问题导致消费者人身损害或财产损失的赔偿责任。急性肠胃炎等符合保险责任的医疗费用，在免赔与限额内可申请理赔。外卖订单场景下，保单生效以保单约定起始时间为准。',
      },
      {
        id: 'text_002',
        source: `${fileName} · Sheet: 产品介绍 · 第 22-25 行`,
        chars: 96,
        body: '保障范围通常包含第三者人身伤亡、医疗费用及合理的律师费用；故意行为、未取得经营资质、超出约定经营场所等情形不在保障范围内。',
      },
      {
        id: 'text_003',
        source: `${fileName} · Sheet: 理赔须知 · 第 4-7 行`,
        chars: 112,
        body: '出险后请尽快报案并保留票据、诊断证明、订单记录等材料。资料齐全后进入审核，常规案件预计 2–5 个工作日反馈；复杂案件可能延长并会主动告知进度。',
      },
      {
        id: 'text_004',
        source: `${fileName} · Sheet: 理赔须知 · 第 8-10 行`,
        chars: 88,
        body: '缺件将影响时效：保单号、事故经过、医疗发票为必交件；缺少任一必交件时，系统会提示补交清单。',
      },
    ],
    qaChunks: [
      {
        id: 'qa_001',
        source: `${fileName} · Sheet: 常见问题 · 第 8-9 行`,
        chars: 42,
        question: '食安险什么时候生效？',
        answer: '以保单约定的保险期间起始日 0 时起生效，具体以保单载明为准。',
        evidence: '【原表第8行】保险责任自保单约定起始日零时起生效。',
      },
      {
        id: 'qa_002',
        source: `${fileName} · Sheet: 常见问题 · 第 10-11 行`,
        chars: 58,
        question: '外卖订单出险能否理赔？',
        answer: '在保单有效期内、经营场所与责任范围内发生的食品安全事故，可按条款申请理赔。',
        evidence: '【原表第10行】外卖场景纳入承保，需核对门店主体与保单一致。',
      },
      {
        id: 'qa_003',
        source: `${fileName} · Sheet: 常见问题 · 第 12-13 行`,
        chars: 51,
        question: '理赔大概要多久？',
        answer: '资料齐全后常规案件约 2–5 个工作日反馈；缺件或复杂情形会另行告知时效。',
        evidence: '【原表第12行】审核时效以资料齐全次日起算。',
      },
    ],
  };
}

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
