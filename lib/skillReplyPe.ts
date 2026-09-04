/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 多轮对话底部「AI 帮写」快捷建议 — 按上下文动态生成若干回答方向；
 * 点选后回填输入框，用户可再补充、编辑或删除后发送。
 */

export type SkillReplyPeChip = {
  id: string;
  /** 芯片展示文案（简短方向） */
  label: string;
  /** 点芯片时回填到输入框的完整草稿，由用户确认后再发送 */
  send: string;
};

/** 带标识的输入块：【标签】+ 正文 */
export function formatComposerTaggedBlock(label: string, body: string): string {
  return `【${label}】\n${body.trim()}`;
}

export function buildComposerTaggedInput(
  blocks: Array<{ label: string; body: string }>,
): string {
  if (blocks.length === 0) return '';
  return blocks.map((block) => formatComposerTaggedBlock(block.label, block.body)).join('\n\n');
}

/** 将快捷芯片块追加到输入框末尾（可多选叠加） */
export function appendComposerChipBlock(current: string, chip: SkillReplyPeChip): string {
  const block = formatComposerTaggedBlock(chip.label, chip.send);
  const base = current.trim();
  if (!base) return block.slice(0, 1000);
  if (base.includes(block)) return base.slice(0, 1000);
  return `${base}\n\n${block}`.slice(0, 1000);
}

/** 从输入框移除某条快捷芯片对应的标识块 */
export function removeComposerChipBlock(current: string, chip: SkillReplyPeChip): string {
  const block = formatComposerTaggedBlock(chip.label, chip.send);
  const next = current
    .replace(`\n\n${block}`, '')
    .replace(`${block}\n\n`, '')
    .replace(block, '')
    .trim();
  return next;
}

/** 发送时合并：芯片草稿 + 用户补充输入 */
export function buildComposerOutboundText(
  userInput: string,
  chips: SkillReplyPeChip[],
): string {
  const chipBlocks = chips.map((chip) => formatComposerTaggedBlock(chip.label, chip.send));
  const userPart = userInput.trim();
  if (chipBlocks.length === 0) return userPart;
  if (!userPart) return chipBlocks.join('\n\n');
  return `${chipBlocks.join('\n\n')}\n\n${userPart}`;
}

export function composerOutboundLength(userInput: string, chips: SkillReplyPeChip[]): number {
  return buildComposerOutboundText(userInput, chips).length;
}

/** 确认卡字段标签 → fieldKey */
export const SKILL_CONFIRM_LABEL_TO_FIELD_KEY: Record<string, string> = {
  技能名称: 'cnName',
  一句话介绍: 'businessProblem',
  触发条件: 'triggerCond',
  不该使用的情况: 'forbiddenCond',
  用户输入信息: 'coreInputIn',
  产出物: 'coreInputOut',
  执行步骤: 'actionChain',
  禁止行为: 'notAllowed',
  内容红线: 'contentRedLines',
  托底策略: 'fallback',
  使用示例: 'usageExamples',
  补充资料: 'customNotes',
};

/** 从「重新设置要求」等带【标签】的文本中解析要点块 */
export function parseComposerTaggedBlocks(text: string): Array<{ label: string; body: string }> {
  const blocks: Array<{ label: string; body: string }> = [];
  const re = /【([^】]+)】[ \t]*\n([\s\S]*?)(?=\n\n【|$)/g;
  let match: RegExpExecArray | null = re.exec(text);
  while (match) {
    const body = match[2].trim();
    if (body) blocks.push({ label: match[1].trim(), body });
    match = re.exec(text);
  }
  return blocks;
}

export type ParsedResetConfirmItem = {
  id: string;
  label: string;
  checked: boolean;
  fieldKey?: string;
  fieldLabel?: string;
  value?: string;
};

/** 将改写后的【标签】文本转为确认卡要点 */
export function parseResetRequirementsToConfirmItems(text: string): ParsedResetConfirmItem[] {
  const blocks = parseComposerTaggedBlocks(text);
  return blocks.map((block, index) => {
    const fieldKey = SKILL_CONFIRM_LABEL_TO_FIELD_KEY[block.label];
    if (fieldKey) {
      return {
        id: fieldKey,
        fieldKey,
        fieldLabel: block.label,
        value: block.body,
        label: `${block.label}：${block.body}`,
        checked: true,
      };
    }
    return {
      id: `reset-${index}-${Date.now()}`,
      label: block.body,
      checked: true,
      value: block.body,
      fieldLabel: /^要点\s*\d+$/.test(block.label) ? undefined : block.label,
    };
  });
}

export type SkillReplyPeContext = {
  /** 最近几条 AI 话术（新 → 旧） */
  latestAiTexts?: string[];
  /** 用户最近一条发言 */
  lastUserText?: string;
  skillTitle?: string;
  /** 存在未确认的确认卡 */
  awaitingConfirm?: boolean;
  draftConfirmed?: boolean;
  form?: {
    cnName?: string;
    businessProblem?: string;
    triggerCond?: string;
    forbiddenCond?: string;
    notAllowed?: string;
    usageExamples?: string;
    actionChainSummary?: string;
  };
};

function makeChip(id: string, label: string, send: string): SkillReplyPeChip {
  return { id, label, send: send.trim() };
}

function pickUnique(chips: SkillReplyPeChip[], limit = 4): SkillReplyPeChip[] {
  const seen = new Set<string>();
  const out: SkillReplyPeChip[] = [];
  for (const chip of chips) {
    if (seen.has(chip.id)) continue;
    seen.add(chip.id);
    out.push(chip);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 根据当前对话与表单状态，动态生成底部「AI 帮写」建议芯片
 */
export function buildDynamicSkillReplyPe(ctx: SkillReplyPeContext): SkillReplyPeChip[] {
  const title = (ctx.skillTitle || ctx.form?.cnName || '本技能').trim();
  const intro = (ctx.form?.businessProblem || title).trim();
  const latestAi = (ctx.latestAiTexts || []).join('\n');
  const lastUser = (ctx.lastUserText || '').trim();
  const form = ctx.form ?? {};
  const chips: SkillReplyPeChip[] = [];

  if (ctx.awaitingConfirm) {
    chips.push(
      makeChip(
        'confirm-trigger-tight',
        '收紧触发条件',
        `补触发边界：「${title}」仅在用户提供必要业务标识（如单号、手机号后四位）且诉求属于本技能范围时触发；标识不全时先追问，不直接查询。`,
      ),
      makeChip(
        'confirm-safety-strict',
        '加强安全红线',
        `补安全红线：禁止越权改单、擅自承诺赔付标准、泄露后台接口；搞不定时统一托底转人工，并说明预计响应时效。`,
      ),
      makeChip(
        'confirm-chain-kb',
        '动作链挂知识库',
        `生成动作链：步骤为「核验标识 → 查询状态 → 组织结论」；查询步骤需挂载相关知识库，结论话术面向用户可读。`,
      ),
      makeChip(
        'confirm-example-real',
        '补真实对话示例',
        `补使用示例：写一组真实用户问法 + 数字员工回复，体现先核验标识、再给结论与下一步引导。`,
      ),
    );
    return pickUnique(chips);
  }

  if (/请确认|确认执行|变更要点|确认卡/.test(latestAi)) {
    chips.push(
      makeChip(
        'after-confirm-edit-trigger',
        '触发还要再改',
        `补触发边界：「${title}」的触发条件我想再写具体一点，请补充必要标识与不应触发的场景。`,
      ),
      makeChip(
        'after-confirm-edit-redline',
        '红线再严一点',
        `补安全红线：禁止行为与托底策略再收紧，避免越权承诺与泄露内部信息。`,
      ),
      makeChip(
        'after-confirm-test',
        '先测一条用例',
        `我想先测一条用例：用户说「${intro.slice(0, 24)}…」，看当前触发与回复是否合理。`,
      ),
    );
  }

  if (/已更新表单「触发|触发条件|触发边界|不该使用/.test(latestAi)) {
    chips.push(
      makeChip(
        'next-after-trigger-safety',
        '接着写红线',
        `补安全红线：围绕「${title}」写清禁止行为、内容红线，以及无法处理时的托底话术。`,
      ),
      makeChip(
        'next-after-trigger-forbid',
        '补充禁止触发',
        `补触发边界：补充不该触发的情况——缺少关键标识、明显超范围、情绪升级时应阻断并引导转人工。`,
      ),
      makeChip(
        'next-after-trigger-chain',
        '生成默认动作链',
        `生成动作链：采用「核验诉求与业务标识 → 查询并组织结论」写入技能主体。`,
      ),
    );
  }

  if (/已更新表单「禁止|安全红线|托底|内容红线/.test(latestAi)) {
    chips.push(
      makeChip(
        'next-after-safety-example',
        '补使用示例',
        `补使用示例：写一组「${title}」相关用户问句 + 数字员工回复，体现先结论后依据、不编造进度。`,
      ),
      makeChip(
        'next-after-safety-tone',
        '统一回答口径',
        `补安全红线：回答口径统一为「先结论后依据」；禁止承诺未经核验的赔付或处理时效。`,
      ),
      makeChip(
        'next-after-safety-chain',
        '核对动作链',
        `生成动作链：检查步骤是否覆盖核验、查询、异常托底转人工。`,
      ),
    );
  }

  if (/已更新表单「执行步骤|动作链/.test(latestAi)) {
    chips.push(
      makeChip(
        'next-after-chain-kb',
        '步骤挂知识库',
        `生成动作链：在查询步骤挂载相关知识库，输出需转成用户可理解的节点说明。`,
      ),
      makeChip(
        'next-after-chain-safety',
        '补安全红线',
        `补安全红线：采用高安全防护线，写清禁止行为与托底策略。`,
      ),
      makeChip(
        'next-after-chain-example',
        '补对话示例',
        `补使用示例：按当前动作链写一条完整对话，覆盖正常路径与缺少标识的负向路径。`,
      ),
    );
  }

  if (/已更新表单「用户输入|使用示例|补充说明|产出物/.test(latestAi)) {
    chips.push(
      makeChip(
        'next-after-io-trigger',
        '对齐触发话术',
        `补触发边界：根据示例里的用户说法，对齐触发条件与必要标识要求。`,
      ),
      makeChip(
        'next-after-io-negative',
        '补负向示例',
        `补使用示例：再补一条缺少单号 / 超范围诉求的负向示例与拒答话术。`,
      ),
      makeChip(
        'next-after-io-test',
        '跑一条测试',
        `我想先测一条用例，验证示例里的用户说法能否正确触发「${title}」。`,
      ),
    );
  }

  if (/拆解技能草案|四张卡片|继续优化|点下方建议/.test(latestAi) || (ctx.draftConfirmed && chips.length === 0)) {
    chips.push(
      makeChip(
        'grow-trigger',
        '写清触发边界',
        `补触发边界：「${title}」在用户表达相关意图且提供必要业务标识时触发；写清不该触发的边界场景。`,
      ),
      makeChip(
        'grow-safety',
        '写安全红线',
        `补安全红线：围绕「${intro.slice(0, 30)}」写清禁止行为、内容红线与托底转人工策略。`,
      ),
      makeChip(
        'grow-chain',
        '生成动作链',
        `生成动作链：默认「核验诉求与业务标识 → 查询并组织结论」，如需可补充挂载知识库/接口说明。`,
      ),
      makeChip(
        'grow-example',
        '补对话示例',
        `补使用示例：写一组真实用户问法 + 数字员工回复，体现核验标识与可读结论。`,
      ),
    );
  }

  const triggerWeak = !form.triggerCond?.trim() || form.triggerCond.length < 24;
  const safetyWeak = !form.notAllowed?.trim() || form.notAllowed.length < 16;
  const chainWeak = !form.actionChainSummary?.trim();
  const exampleWeak = !form.usageExamples?.trim();

  if (triggerWeak) {
    chips.unshift(
      makeChip(
        'gap-trigger',
        '补全触发条件',
        `补触发边界：请根据「${title}」写清何时该触发、何时不该触发，并明确必要业务标识（如单号）。`,
      ),
    );
  }
  if (safetyWeak && !triggerWeak) {
    chips.unshift(
      makeChip(
        'gap-safety',
        '补安全红线',
        `补安全红线：写清禁止行为、内容红线，以及接口异常或超范围时的托底话术。`,
      ),
    );
  }
  if (chainWeak && !triggerWeak && !safetyWeak) {
    chips.unshift(
      makeChip(
        'gap-chain',
        '生成动作链',
        `生成动作链：按「${title}」业务目标设计核验 → 查询 → 结论三步，并说明每步输入输出。`,
      ),
    );
  }
  if (exampleWeak && ctx.draftConfirmed) {
    chips.unshift(
      makeChip(
        'gap-example',
        '补使用示例',
        `补使用示例：围绕「${title}」写用户问句与数字员工回复，含正常与缺少标识两种路径。`,
      ),
    );
  }

  if (/理赔|保单|测算|食安|投诉/.test(lastUser + intro)) {
    chips.unshift(
      makeChip(
        'domain-insurance',
        '理赔核验话术',
        `补触发边界：用户咨询理赔/进度时，先核验保单号或服务单号；无单号时引导用户提供，不直接给出结论。`,
      ),
    );
  }

  if (chips.length === 0) {
    chips.push(
      makeChip('fallback-trigger', '优化触发边界', `补触发边界：我想优化「${title}」的触发条件与禁止触发场景。`),
      makeChip('fallback-safety', '加强安全约束', `补安全红线：补充禁止行为与托底策略。`),
      makeChip('fallback-example', '补使用示例', `补使用示例：写一条更贴近业务的对话示例。`),
    );
  }

  return pickUnique(chips);
}

/** @deprecated 使用 buildDynamicSkillReplyPe */
export function resolveSkillReplyPe(aiText: string, opts?: { awaitingConfirm?: boolean }): SkillReplyPeChip[] {
  return buildDynamicSkillReplyPe({
    latestAiTexts: aiText ? [aiText] : [],
    awaitingConfirm: opts?.awaitingConfirm,
  });
}

/** 从对话消息里取最近 N 条 AI 文案 */
export function pickLatestAiTextsForReplyPe(
  messages: Array<{ sender: string; content: string; isRevoked?: boolean }>,
  limit = 3,
): string[] {
  const out: string[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.isRevoked) continue;
    if (m.sender === 'ai' && m.content.trim()) {
      out.push(m.content.trim());
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** 从对话消息里取最近一条可匹配的 AI 文案 */
export function pickLatestAiTextForReplyPe(
  messages: Array<{ sender: string; content: string; isRevoked?: boolean }>,
): string {
  return pickLatestAiTextsForReplyPe(messages, 1)[0] ?? '';
}

/** 最近一条用户发言 */
export function pickLatestUserText(
  messages: Array<{ sender: string; content: string; isRevoked?: boolean }>,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.isRevoked) continue;
    if (m.sender === 'user' && m.content.trim()) return m.content.trim();
  }
  return '';
}

/** 是否存在未确认的 skill_confirm 卡 */
export function hasAwaitingSkillConfirm(
  messages: Array<{ sender: string; content: string; isRevoked?: boolean }>,
): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.sender !== 'skill_confirm') continue;
    try {
      const payload = JSON.parse(m.content) as { confirmed?: boolean };
      return !payload.confirmed;
    } catch {
      return true;
    }
  }
  return false;
}
