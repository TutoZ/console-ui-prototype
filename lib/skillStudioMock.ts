/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 技能工作室 — 自然语言生成技能包（原型 mock，对齐 AgentOne createSkill）
 */

export type SkillStudioFile = {
  path: string;
  content: string;
};

export type SkillStudioDraft = {
  draftId: string;
  skillCode: string;
  displayName: string;
  purpose: string;
  capabilities: string[];
  files: SkillStudioFile[];
  /** 列表页用的简短描述 */
  listDescription: string;
};

function shortId(len = 12): string {
  return Math.random().toString(16).slice(2, 2 + len).padEnd(len, '0');
}

function isQcPrompt(text: string): boolean {
  return /质检|合规|稽核|审核|会话质量|客服对话/.test(text);
}

function isClaimsPrompt(text: string): boolean {
  return /理赔|免赔|保单|测算|赔付/.test(text);
}

function buildQcDraft(prompt: string, draftId: string, skillCode: string): SkillStudioDraft {
  const skillMd = `---
name: ${skillCode}
description: 汽车行业客服会话合规质检技能。根据对话内容核对合规要点、输出清单命中与风险提示。
---

# ${skillCode}

## 何时使用

当需要对照标准检查客服与客户对话是否合规、是否存在禁语或流程遗漏时使用本技能。

## 输入

- 完整客服对话（标注角色：客服 / 客户）
- 可选：场景类型、会话 ID、渠道

## 步骤

1. 读取 \`references/compliance_checklist.md\` 与质检标准
2. 按场景映射 \`references/automotive_scenarios.md\`
3. 逐条核对，填写 \`assets/inspection_report_template.md\`
4. 输出命中项、风险等级与改进建议

## 用户需求原文

${prompt.trim()}
`;

  const checklist = `# 合规检查清单

| 编号 | 检查点 | 严重度 | 说明 |
|------|--------|--------|------|
| C01 | 开场身份核实 | 高 | 是否核验证件/订单身份 |
| C02 | 禁语与承诺 | 高 | 不得承诺保本/绝对收益 |
| C03 | 投诉升级路径 | 中 | 激烈情绪是否转人工 |
| C04 | 结束确认 | 低 | 是否复述结论与后续动作 |
`;

  const criteria = `# 质检评分标准

| 维度 | 权重 | 满分说明 |
|------|------|----------|
| 服务态度 | 20% | 礼貌、共情、无打断 |
| 问题解决 | 25% | 定位准确、方案可执行 |
| 专业知识 | 25% | 口径正确、无误导 |
| 流程合规 | 30% | 必问项齐全、记录完整 |
`;

  const scenarios = `# 汽车行业场景映射

- 售前咨询：报价、配置、试驾预约
- 售后投诉：质量、交期、服务态度
- 保险理赔：出险、定损、赔付进度
- 配件与保养：预约、价格、原厂件说明
`;

  const report = `# 汽车行业客服质检报告

## 一、基本信息

| 字段 | 值 |
|------|-----|
| 对话 ID | {{DIALOGUE_ID}} |
| 客服 ID | {{AGENT_ID}} |
| 场景类型 | {{SCENARIO_TYPE}} |
| 质检时间 | {{INSPECTED_AT}} |

## 二、维度评分

| 维度 | 权重 | 得分 |
|------|------|------|
| 服务态度 | 20% | {{SCORE_ATTITUDE}} |
| 问题解决能力 | 25% | {{SCORE_RESOLUTION}} |
| 专业知识 | 25% | {{SCORE_KNOWLEDGE}} |
| 流程合规 | 30% | {{SCORE_COMPLIANCE}} |

## 三、明细点评

- 服务态度：{{COMMENT_ATTITUDE}}
- 问题解决：{{COMMENT_RESOLUTION}}
- 专业知识：{{COMMENT_KNOWLEDGE}}
- 流程合规：{{COMMENT_COMPLIANCE}}

## 四、风险与建议

{{RISKS_AND_SUGGESTIONS}}
`;

  return {
    draftId,
    skillCode,
    displayName: skillCode,
    purpose:
      '提供系统性的合规检查支持，帮助核查业务流程与话术是否符合规范，降低合规风险并提升稽核效率。',
    capabilities: [
      '自动提取对话中的合规要点',
      '按标准清单生成命中结果',
      '输出风险提示与改进建议',
    ],
    listDescription: '汽车行业客服会话合规质检：清单核对、评分报告与风险提示。',
    files: [
      { path: 'SKILL.md', content: skillMd },
      { path: 'assets/inspection_report_template.md', content: report },
      { path: 'references/compliance_checklist.md', content: checklist },
      { path: 'references/quality_inspection_criteria.md', content: criteria },
      { path: 'references/automotive_scenarios.md', content: scenarios },
    ],
  };
}

function buildClaimsDraft(prompt: string, draftId: string, skillCode: string): SkillStudioDraft {
  const skillMd = `---
name: ${skillCode}
description: 根据保单免赔额与就医票据测算预估赔付，并生成报案摘要。
---

# ${skillCode}

## 步骤

1. 解析保单免赔与条款要点（\`references/policy_rules.md\`）
2. 核对票据金额与项目
3. 输出预估赔付与材料清单（\`assets/claim_summary_template.md\`）

## 用户需求原文

${prompt.trim()}
`;

  return {
    draftId,
    skillCode,
    displayName: skillCode,
    purpose: '在客户询问理赔金额时，结合免赔与票据自动测算预估赔付，并生成可提交的报案摘要。',
    capabilities: ['解析保单免赔规则', '核算票据可赔金额', '生成报案摘要与材料清单'],
    listDescription: '理赔测算：免赔核算、预估赔付与报案摘要。',
    files: [
      { path: 'SKILL.md', content: skillMd },
      {
        path: 'assets/claim_summary_template.md',
        content: `# 报案摘要\n\n- 保单号：{{POLICY_NO}}\n- 预估赔付：{{ESTIMATED_PAYOUT}}\n- 所需材料：{{MATERIALS}}\n`,
      },
      {
        path: 'references/policy_rules.md',
        content: `# 免赔与条款要点\n\n- 年免赔额、次免赔额\n- 除外责任摘要\n- 材料齐全性检查\n`,
      },
    ],
  };
}

function buildGenericDraft(prompt: string, draftId: string, skillCode: string): SkillStudioDraft {
  const first = prompt.trim().split(/\n/)[0]?.slice(0, 48) || '自定义业务技能';
  const skillMd = `---
name: ${skillCode}
description: ${first}
---

# ${skillCode}

## 用途

${prompt.trim()}

## 步骤

1. 理解用户意图与必要输入
2. 参考 \`references/playbook.md\` 执行
3. 按 \`assets/output_template.md\` 组织结果
`;

  return {
    draftId,
    skillCode,
    displayName: skillCode,
    purpose: first.length > 80 ? `${first.slice(0, 80)}…` : first,
    capabilities: ['理解自然语言需求', '按剧本执行业务步骤', '输出结构化结果'],
    listDescription: prompt.trim().slice(0, 120) || '自定义技能',
    files: [
      { path: 'SKILL.md', content: skillMd },
      {
        path: 'assets/output_template.md',
        content: `# 输出模板\n\n## 结论\n\n{{CONCLUSION}}\n\n## 依据\n\n{{EVIDENCE}}\n`,
      },
      {
        path: 'references/playbook.md',
        content: `# 执行剧本\n\n1. 收集必要字段\n2. 校验完整性\n3. 调用工具或知识\n4. 返回结构化答复\n\n## 需求原文\n\n${prompt.trim()}\n`,
      },
    ],
  };
}

/** 合并用户编辑后得到最终技能包文件 */
export function mergeDraftFiles(
  draft: SkillStudioDraft,
  edits: Record<string, string>,
): SkillStudioFile[] {
  return draft.files.map((f) => ({
    path: f.path,
    content: edits[f.path] ?? f.content,
  }));
}

/** 创建页“规格确认”四要素摘要 */
export function summarizeSkillSpec(draft: SkillStudioDraft, files: SkillStudioFile[]) {
  const refs = files.filter(
    (f) => f.path.startsWith('references/') && !f.path.endsWith('README.md'),
  );
  const assets = files.filter(
    (f) => f.path.startsWith('assets/') && !f.path.endsWith('README.md'),
  );
  return {
    when: draft.purpose,
    steps: draft.capabilities,
    referenceCount: refs.length,
    assetCount: assets.length,
    fileCount: files.length,
    output: draft.listDescription,
  };
}

/** 根据自然语言需求生成技能草稿包 */
export function generateSkillDraftFromPrompt(prompt: string, prev?: SkillStudioDraft | null): SkillStudioDraft {
  const draftId = prev?.draftId ?? shortId(12);
  const skillCode = prev?.skillCode ?? `skill_${shortId(12)}`;
  const text = prompt.trim();
  if (isQcPrompt(text)) return buildQcDraft(text, draftId, skillCode);
  if (isClaimsPrompt(text)) return buildClaimsDraft(text, draftId, skillCode);
  return buildGenericDraft(text, draftId, skillCode);
}

export function newEmptyDraftMeta(): { draftId: string; skillCode: string } {
  const id = shortId(12);
  return { draftId: id, skillCode: `new_skill_${id.slice(0, 8)}` };
}

/** AOP V2 表单 — 技能定义 / 技能主体 / 规范约束 / 补充说明 */
export type SkillKnowledgeModule = {
  id: string;
  content: string;
  note: string;
};

export type SkillStepModule = {
  id: string;
  name: string;
  instruction: string;
  knowledge: string;
  example: string;
};

export type SkillRefUpload = {
  id: string;
  name: string;
  kind: 'script' | 'doc' | 'image' | 'archive' | 'other';
  status: 'ok' | 'failed' | 'parsing';
  failReason?: string;
  /** 脚本/md 可落盘路径；参考类仅作 AI 材料 */
  settlePath?: string;
};

export type SkillElementsForm = {
  /** 1 技能定义 */
  nameCn: string;
  nameEn: string;
  purpose: string;
  triggerWhen: string;
  triggerForbidden: string;
  userInputs: string;
  outputs: string;
  mountedKbIds: string[];
  mountedScriptIds: string[];
  mountedRefFileIds: string[];
  /** 2 技能主体 */
  knowledgeModules: SkillKnowledgeModule[];
  stepModules: SkillStepModule[];
  /** 3 规范约束 */
  forbiddenActs: string;
  contentRedlines: string;
  answerStyle: string;
  fallbackPolicy: string;
  expressionStyle: string;
  /** 4 补充说明 */
  examples: string;
  extraNotes: string;
  /** 参考上传（sprint7） */
  refUploads: SkillRefUpload[];
};

export const SKILL_FORM_SECTIONS = [
  { id: 'define', label: '技能定义' },
  { id: 'body', label: '技能主体' },
  { id: 'rules', label: '规范约束' },
  { id: 'extra', label: '补充说明' },
] as const;

export type SkillFormSectionId = (typeof SKILL_FORM_SECTIONS)[number]['id'];

/** 表单字段展示说明 / 预填 / 必填（对齐 AOP V2 字段表） */
export type SkillFormFieldMeta = {
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
  maxLength?: number;
  limitHint?: string;
};

export const SKILL_FORM_FIELDS = {
  nameCn: {
    label: '技能名称',
    hint: '中文名',
    placeholder: '京东延保进度查询助手',
    required: true,
    maxLength: 30,
    limitHint: '≤30 字，唯一',
  },
  nameEn: {
    label: '技能标识',
    hint: '英文/拼音标识，系统内部引用；可手动填或留空自动从中文名生成',
    placeholder: 'yb_progress',
    required: true,
    limitHint: '小写字母/数字/下划线',
  },
  purpose: {
    label: '能力简介',
    hint: '这个技能能做什么（一句话能力概述）',
    placeholder: '查询京东延保服务单状态与处理进度',
    required: true,
    maxLength: 50,
    limitHint: '≤50 字',
  },
  triggerWhen: {
    label: '触发条件',
    hint: '什么情况应启用（用户问法/场景特征）',
    placeholder: '用户问延保进度时',
    required: true,
    maxLength: 50,
    limitHint: '≤50 字',
  },
  triggerForbidden: {
    label: '禁止触发场景',
    hint: '什么情况不启用（路由避让）',
    placeholder: '非京东延保、非本人订单',
    required: false,
    limitHint: '管“是否接活”',
  },
  userInputs: {
    label: '用户输入信息',
    hint: '用户会提供的关键参数（讲“有什么”，非格式）',
    placeholder: '服务单号、手机号后四位',
    required: true,
    limitHint: '与规范约束·输入格式分工',
  },
  outputs: {
    label: '产出物',
    hint: '技能交付什么（讲“是什么”）',
    placeholder: '进度节点、处理方、预计完成时间',
    required: true,
    limitHint: '与规范约束·红线分工',
  },
  mountedScripts: {
    label: '资源挂载 · 企业接入脚本',
    hint: '挂载要调的可执行脚本（用脚本时必填）',
    placeholder: 'create_replace 脚本',
    required: false,
    limitHint: '多选；须先挂后引',
  },
  mountedKbs: {
    label: '资源挂载 · 企业知识库',
    hint: '挂载要召回的线上知识库（KB 召回时必填）',
    placeholder: '延保条款库',
    required: false,
    limitHint: '多选',
  },
  mountedRefs: {
    label: '资源挂载 · 其他技能包文件',
    hint: '挂载可引用的 references 文件（引用文件时必填；含本技能与其他技能包）',
    placeholder: 'claims_process.md',
    required: false,
    limitHint: '多选',
  },
  knowledgeContent: {
    label: '知识内容',
    hint: '一条模型需懂的背景知识（术语/概念/状态枚举/速查表）；可多条，全局常驻始终注入',
    placeholder: '服务单状态：审核中/维修中/换新中/已完成',
    required: false,
    limitHint: '知识/混合型必填；纯速查不检索',
  },
  knowledgeNote: {
    label: '知识说明',
    hint: '该知识的边界/适用范围/备注',
    placeholder: '仅京东延保订单适用',
    required: false,
  },
  stepName: {
    label: '步骤名称',
    hint: '这一步的短名（AI 可从说明自动建议）',
    placeholder: '校验订单号',
    required: false,
  },
  stepInstruction: {
    label: '步骤说明',
    hint: '这步做什么（动作 / 知识都写这里）；可任意增/插/拖拽排序',
    placeholder: '校验订单号并确认用户身份',
    required: false,
    limitHint: '流程/混合型必填',
  },
  stepKnowledge: {
    label: '步骤知识',
    hint: '这步依赖的关键规则 / 判断 / 边界；含分支时写“条件→跳步骤 N”',
    placeholder: '不在保→跳兜底步骤',
    required: false,
    limitHint: '含判断必填',
  },
  stepExample: {
    label: '步骤示例',
    hint: '这步的输入→输出样例；天然是 L3 golden 测试 fixtures',
    placeholder: '输入“单号123”→输出“已校验，在保”',
    required: false,
  },
  forbiddenActs: {
    label: '禁止行为',
    hint: '绝对不能做',
    placeholder: '不得编造物流状态、不得泄露他人订单',
    required: false,
    limitHint: '恒显',
  },
  contentRedlines: {
    label: '内容红线',
    hint: '必须含/禁止含的内容要求',
    placeholder: '必须含处理时效；禁止承诺具体赔付',
    required: false,
    limitHint: '恒显',
  },
  answerStyle: {
    label: '回答口径',
    hint: '引用规则、话术范式',
    placeholder: '必须引用售后条款库',
    required: false,
    limitHint: '知识型建议填',
  },
  fallbackPolicy: {
    label: '兜底策略',
    hint: '答不了/低置信时怎么办（降低“答不上来乱编”风险）',
    placeholder: '不确定则转人工核实',
    required: false,
    limitHint: '恒显',
  },
  expressionStyle: {
    label: '表达风格',
    hint: '语气/长度上限/禁用词',
    placeholder: '温和安抚、≤80 字、禁用“亲”',
    required: false,
    limitHint: '恒显',
  },
  examples: {
    label: '示例',
    hint: '场景示例：用户问法+期望回复+注意点；也可填典型 I/O',
    placeholder: '用户“单子三天没动静”→展示进度+转人工',
    required: false,
    limitHint: '推荐填，助生成+测试',
  },
  extraNotes: {
    label: '补充资料',
    hint: '模板装不下的长内容/备注（业务速查表、召回触发规则、输出规范等）',
    placeholder: '业务知识速查表 §1–§6',
    required: false,
    limitHint: '专家/AI 填，进文档',
  },
} as const satisfies Record<string, SkillFormFieldMeta>;

/** 资源挂载可选项（演示） */
export const SKILL_MOUNT_SCRIPT_OPTIONS = [
  { id: 'script_create_replace', label: 'create_replace 脚本' },
  { id: 'script_order_query', label: '延保进度查询脚本' },
  { id: 'script_notify', label: '进度通知脚本' },
] as const;

export const SKILL_MOUNT_KB_OPTIONS = [
  { id: 'kb_yb_policy', label: '延保条款库' },
  { id: 'kb_aftersale', label: '售后政策库' },
  { id: 'kb_faq', label: '常见问题库' },
] as const;

export const SKILL_MOUNT_REF_OPTIONS = [
  { id: 'ref_claims', label: 'claims_process.md' },
  { id: 'ref_status', label: 'status_enum.md' },
  { id: 'ref_scripts_readme', label: 'scripts/README.md' },
] as const;

/** 从中文名生成技能标识（无拼音库时的稳定兜底） */
export function suggestSkillCodeFromName(nameCn: string): string {
  const trimmed = nameCn.trim();
  if (!trimmed) return 'new_skill';
  const known: Record<string, string> = {
    京东延保进度查询助手: 'yb_progress',
  };
  if (known[trimmed]) return known[trimmed];
  const latin = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (latin.length >= 2) return latin.slice(0, 40);
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) h = (h * 31 + trimmed.charCodeAt(i)) >>> 0;
  return `skill_${h.toString(36).slice(0, 8)}`;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createEmptyKnowledgeModule(): SkillKnowledgeModule {
  return { id: uid('km'), content: '', note: '' };
}

export function createEmptyStepModule(): SkillStepModule {
  return { id: uid('sm'), name: '', instruction: '', knowledge: '', example: '' };
}

export function createEmptySkillElements(skillCode = 'new_skill'): SkillElementsForm {
  return {
    nameCn: '',
    nameEn: skillCode,
    purpose: '',
    triggerWhen: '',
    triggerForbidden: '',
    userInputs: '',
    outputs: '',
    mountedKbIds: [],
    mountedScriptIds: [],
    mountedRefFileIds: [],
    knowledgeModules: [createEmptyKnowledgeModule()],
    stepModules: [createEmptyStepModule()],
    forbiddenActs: '',
    contentRedlines: '',
    answerStyle: '',
    fallbackPolicy: '',
    expressionStyle: '',
    examples: '',
    extraNotes: '',
    refUploads: [],
  };
}

export function draftToSkillElements(draft: SkillStudioDraft): SkillElementsForm {
  const steps =
    draft.capabilities.length > 0
      ? draft.capabilities.map((c, i) => ({
          id: uid('sm'),
          name: `步骤 ${i + 1}`,
          instruction: c,
          knowledge: '',
          example: '',
        }))
      : [createEmptyStepModule()];

  return {
    ...createEmptySkillElements(draft.skillCode),
    nameCn: draft.displayName,
    nameEn: draft.skillCode,
    purpose: draft.purpose.slice(0, 50),
    triggerWhen: draft.purpose.slice(0, 50),
    triggerForbidden: '非本技能业务范围；用户未提供关键上下文',
    userInputs: '用户问题、订单/服务单号、必要核验信息',
    outputs: draft.listDescription || '结构化结论与可执行建议',
    mountedKbIds: ['kb_claim'],
    stepModules: steps,
    knowledgeModules: [
      {
        id: uid('km'),
        content: draft.purpose,
        note: '由对话生成，可按业务边界修订',
      },
    ],
    forbiddenActs: '不得编造事实；不得泄露他人隐私',
    fallbackPolicy: '不确定时说明局限并转人工核实',
    examples: `用户：“${draft.displayName}相关问题”→ 给出进度/结论与下一步`,
  };
}

/** 必填校验：返回首个缺失字段的 section + 文案 */
export function validateSkillElements(form: SkillElementsForm): {
  ok: boolean;
  section?: SkillFormSectionId;
  field?: string;
  message?: string;
} {
  if (!form.nameCn.trim()) {
    return { ok: false, section: 'define', field: 'nameCn', message: '请填写技能名称' };
  }
  if (form.nameCn.trim().length > 30) {
    return { ok: false, section: 'define', field: 'nameCn', message: '技能名称不超过 30 字' };
  }
  if (!/^[a-z0-9_]+$/.test((form.nameEn.trim() || suggestSkillCodeFromName(form.nameCn)))) {
    return {
      ok: false,
      section: 'define',
      field: 'nameEn',
      message: '技能标识须为小写字母、数字或下划线',
    };
  }
  if (!form.purpose.trim()) {
    return { ok: false, section: 'define', field: 'purpose', message: '请填写能力简介' };
  }
  if (form.purpose.trim().length > 50) {
    return { ok: false, section: 'define', field: 'purpose', message: '能力简介不超过 50 字' };
  }
  if (!form.triggerWhen.trim()) {
    return { ok: false, section: 'define', field: 'triggerWhen', message: '请填写触发条件' };
  }
  if (form.triggerWhen.trim().length > 50) {
    return { ok: false, section: 'define', field: 'triggerWhen', message: '触发条件不超过 50 字' };
  }
  if (!form.userInputs.trim()) {
    return { ok: false, section: 'define', field: 'userInputs', message: '请填写用户输入信息' };
  }
  if (!form.outputs.trim()) {
    return { ok: false, section: 'define', field: 'outputs', message: '请填写产出物' };
  }
  const hasKnowledge = form.knowledgeModules.some((m) => m.content.trim());
  const hasStep = form.stepModules.some((m) => m.instruction.trim());
  if (!hasKnowledge && !hasStep) {
    return {
      ok: false,
      section: 'body',
      field: 'body',
      message: '技能主体至少填写一项知识内容或步骤说明',
    };
  }
  return { ok: true };
}

export function skillFormRequiredProgress(form: SkillElementsForm): {
  done: number;
  total: number;
  defineDone: boolean;
  bodyDone: boolean;
} {
  const defineChecks = [
    form.nameCn.trim(),
    form.nameEn.trim(),
    form.purpose.trim(),
    form.triggerWhen.trim(),
    form.userInputs.trim(),
    form.outputs.trim(),
  ];
  const defineDone = defineChecks.every(Boolean);
  const bodyDone =
    form.knowledgeModules.some((m) => m.content.trim()) ||
    form.stepModules.some((m) => m.instruction.trim());
  const checks = [...defineChecks, bodyDone ? '1' : ''];
  return {
    done: checks.filter(Boolean).length,
    total: checks.length,
    defineDone,
    bodyDone,
  };
}

export function slugifySkillName(name: string): string {
  const pinyinLike = name
    .trim()
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '_')
    .replace(/[\u4e00-\u9fa5]/g, 'x')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return (pinyinLike || 'new_skill').slice(0, 40);
}

/** sprint7：按扩展名判定上传类型 */
export function classifyUploadName(fileName: string): SkillRefUpload['kind'] {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['py', 'js', 'sh', 'ps1', 'md'].includes(ext)) return 'script';
  if (['docx', 'pdf', 'xlsx', 'csv', 'txt'].includes(ext)) return 'doc';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
  return 'other';
}

export function settlePathForUpload(fileName: string, kind: SkillRefUpload['kind']): string | undefined {
  if (kind !== 'script') return undefined;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'md') return `references/${fileName}`;
  return `scripts/${fileName}`;
}

export const SKILL_REF_FILE_OPTIONS = [
  { id: 'ref_claims', label: 'claims_process.md（本技能包）' },
  { id: 'ref_policy', label: '延保条款速查（其他技能包）' },
  { id: 'ref_faq', label: '客服口径库.md' },
] as const;

export function buildAiTestCases(count = 5): SkillTestCase[] {
  const seeds = [
    { input: '用户问服务单进度，提供单号', expected: '核验身份 → 查询节点 → 给出预计完成时间' },
    { input: '非本业务订单催进度', expected: '识别禁止触发 → 礼貌拒答并引导正确入口' },
    { input: '只给手机号后四位无单号', expected: '追问关键输入 → 不编造进度' },
    { input: '要求承诺具体赔付金额', expected: '引用红线 → 不承诺金额 → 转人工核实' },
    { input: '情绪激动投诉处理慢', expected: '安抚 → 展示进度 → 兜底转人工' },
    { input: '重复同一问法第三次', expected: '复述已查结果 → 给出下一步' },
    { input: '询问能否加急', expected: '说明规则边界 → 可操作路径' },
    { input: '英文夹杂口语描述问题', expected: '理解意图 → 结构化追问' },
  ];
  return seeds.slice(0, Math.max(1, Math.min(count, seeds.length))).map((s, i) => ({
    id: `tc_ai_${Date.now()}_${i}`,
    source: 'ai' as const,
    input: s.input,
    expected: s.expected,
    status: 'ready' as const,
  }));
}

export function runSkillTestCases(cases: SkillTestCase[]): SkillTestCase[] {
  return cases.map((c, i) => {
    if (!c.expected.trim()) {
      return { ...c, status: i % 3 === 0 ? 'uncertain' : 'passed' };
    }
    return { ...c, status: i % 4 === 0 ? 'failed' : 'passed' };
  });
}

export function summarizeTestRun(cases: SkillTestCase[]): string {
  const pass = cases.filter((c) => c.status === 'passed').length;
  const fail = cases.filter((c) => c.status === 'failed').length;
  const uncertain = cases.filter((c) => c.status === 'uncertain').length;
  const rate = cases.length ? Math.round((pass / cases.length) * 100) : 0;
  return `测试完成：通过率 ${rate}%（pass ${pass} / fail ${fail} / 不确定 ${uncertain}）。失败已按触发路由、行为场景、工具脚本、效果质量聚类；AOP 技能已定位到字段级。是否采纳优化建议？回复“采纳”即可写入表单。`;
}

export function autoVersionNote(prevName: string, nextName: string, form: SkillElementsForm): string {
  const bits = [
    prevName !== nextName ? `名称调整为“${nextName}”` : '',
    form.stepModules.filter((s) => s.instruction.trim()).length
      ? `更新 ${form.stepModules.filter((s) => s.instruction.trim()).length} 个执行步骤`
      : '',
    form.knowledgeModules.some((k) => k.content.trim()) ? '补充知识模块' : '',
    form.forbiddenActs.trim() ? '强化禁止行为约束' : '',
  ].filter(Boolean);
  return bits.length ? bits.join('；') : '根据对话与表单 diff 更新技能配置';
}

/** 由表单实时编译 SKILL.md（右栏 / 文档预览） */
export function compileSkillMarkdown(form: SkillElementsForm): string {
  const steps = form.stepModules
    .filter((s) => s.instruction.trim() || s.name.trim())
    .map((s, i) => {
      const lines = [
        `### ${i + 1}. ${s.name.trim() || `步骤 ${i + 1}`}`,
        s.instruction.trim() ? `- 说明：${s.instruction.trim()}` : '',
        s.knowledge.trim() ? `- 知识：${s.knowledge.trim()}` : '',
        s.example.trim() ? `- 示例：${s.example.trim()}` : '',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');

  const knowledge = form.knowledgeModules
    .filter((k) => k.content.trim())
    .map((k, i) => `### 知识 ${i + 1}\n${k.content.trim()}${k.note.trim() ? `\n> ${k.note.trim()}` : ''}`)
    .join('\n\n');

  return `---
name: ${form.nameEn || 'new_skill'}
description: ${form.purpose || '（待填写能力简介）'}
---

# ${form.nameCn || form.nameEn || '未命名技能'}

## 何时使用

${form.triggerWhen || '（待填写触发条件）'}

## 禁止触发

${form.triggerForbidden || '（选填）'}

## 用户输入

${form.userInputs || '（待填写）'}

## 产出物

${form.outputs || '（待填写）'}

## 资源挂载

- 脚本：${form.mountedScriptIds.length ? form.mountedScriptIds.join(', ') : '—'}
- 知识库：${form.mountedKbIds.length ? form.mountedKbIds.join(', ') : '—'}
- 引用文件：${form.mountedRefFileIds.length ? form.mountedRefFileIds.join(', ') : '—'}

## 技能主体

### 知识
${knowledge || '（未填写知识模块）'}

### 步骤
${steps || '（未填写步骤模块）'}

## 规范约束

- 禁止行为：${form.forbiddenActs || '—'}
- 内容红线：${form.contentRedlines || '—'}
- 回答口径：${form.answerStyle || '—'}
- 兜底策略：${form.fallbackPolicy || '—'}
- 表达风格：${form.expressionStyle || '—'}

## 示例

${form.examples || '（选填）'}

## 补充资料

${form.extraNotes || '—'}
`;
}

export function compileSchemaJson(form: SkillElementsForm): string {
  return JSON.stringify(
    {
      input: {
        description: form.userInputs || 'user_query',
        fields: ['sessionId', 'userMessage', 'context'],
      },
      output: {
        description: form.outputs || 'structured_result',
        fields: ['reply', 'actions', 'confidence'],
      },
      skillCode: form.nameEn || 'new_skill',
    },
    null,
    2,
  );
}

export function compileHandlerTs(form: SkillElementsForm): string {
  return `/** 技能运行时入口 — ${form.nameCn || form.nameEn || 'skill'} */
export async function runSkill(input: Record<string, unknown>) {
  // TODO: 接入编排引擎 / 企业脚本
  // 触发: ${form.triggerWhen || '…'}
  // 红线: ${form.forbiddenActs || '—'}
  return { ok: true, skill: '${form.nameEn || 'new_skill'}', input };
}
`;
}

export function compileMetadataYaml(form: SkillElementsForm): string {
  return `id: ${form.nameEn || 'skill_pkg'}
cn_name: "${form.nameCn || '未命名技能'}"
version: "1.0.0"
runtime: "nodejs20"
entrypoint: "scripts/handler.ts"
timeout_ms: 3000
security_audit: "PASS"
created_at: "${new Date().toISOString().split('T')[0]}"
`;
}

export type SkillOptimizeSuggestion = {
  id: string;
  field: 'triggerWhen' | 'forbiddenActs' | 'fallbackPolicy' | 'outputs';
  fieldLabel: string;
  reason: string;
  diffRemoved: string;
  diffAdded: string;
  patch: Partial<SkillElementsForm>;
};

export function buildOptimizeSuggestions(form: SkillElementsForm): SkillOptimizeSuggestion[] {
  return [
    {
      id: 'sug-trigger',
      field: 'triggerWhen',
      fieldLabel: '触发条件',
      reason: '触发过宽，易误匹配非本业务问法',
      diffRemoved: `- 触发: ${form.triggerWhen || '（空）'}`,
      diffAdded: '+ 触发: 用户明确询问本业务进度/状态，且提供可核验标识时启用',
      patch: {
        triggerWhen:
          form.triggerWhen.trim() ||
          '用户明确询问本业务进度/状态，且提供可核验标识（单号/手机后四位）时启用',
      },
    },
    {
      id: 'sug-forbid',
      field: 'forbiddenActs',
      fieldLabel: '禁止行为',
      reason: '缺失对承诺金额 / 编造状态的硬拦截',
      diffRemoved: `- 禁止: ${form.forbiddenActs || '（空）'}`,
      diffAdded: '+ 禁止: 不得编造进度；不得承诺具体赔付金额；不确定时转人工',
      patch: {
        forbiddenActs:
          '不得编造进度或物流状态；不得承诺具体赔付金额；不得泄露他人订单信息',
        fallbackPolicy: form.fallbackPolicy.trim() || '不确定则说明局限并转人工核实',
      },
    },
  ];
}

/** 对话引导步骤文案（对齐参考包“一步一问、灌入中栏”） */
export const GUIDE_STEP_PROMPTS = [
  '说“我想创建一个技能”开始；或直接描述业务目标。',
  '【1/4 技能定义】技能中文名、标识、能力简介、触发/禁止触发、输入与产出？也可说“采用延保进度默认配置”。',
  '【2/4 技能主体】需要哪些常驻知识？执行分几步？也可说“生成标准主体”。',
  '【3/4 规范约束】禁止行为、红线、兜底策略？也可说“采用安全默认约束”。',
  '【4/4 补充与验收】补示例后，可到“技能测试”跑用例；失败建议可一键写回表单。',
] as const;

/** 将已有技能转为工作台草稿（编辑入口） */
export function skillToStudioDraft(skill: {
  id: string;
  name: string;
  description: string;
  skillCode?: string;
  files?: SkillStudioFile[];
}): SkillStudioDraft {
  const skillCode = skill.skillCode ?? `skill_${skill.id.replace(/^s_/, '')}`;

  if (skill.files?.length) {
    return {
      draftId: skill.id,
      skillCode,
      displayName: skill.name,
      purpose: skill.description,
      capabilities: ['解析用户输入', '执行技能逻辑', '输出结构化结果'],
      files: enrichDraftFiles(skill.files.map(({ path, content }) => ({ path, content }))),
      listDescription: skill.description,
    };
  }

  const prompt = `${skill.name}：${skill.description}`;
  const generated = generateSkillDraftFromPrompt(prompt, {
    draftId: skill.id,
    skillCode,
    displayName: skill.name,
    purpose: skill.description,
    capabilities: [],
    files: [],
    listDescription: skill.description,
  });

  return {
    ...generated,
    draftId: skill.id,
    skillCode,
    displayName: skill.name,
    listDescription: skill.description,
  };
}

export const SKILL_MOUNT_KNOWLEDGE_OPTIONS = SKILL_MOUNT_KB_OPTIONS;

export type SkillTestCase = {
  id: string;
  source: 'ai' | 'excel' | 'manual';
  input: string;
  /** 期望可选；无期望由 AI 基于 SKILL.md 判定 */
  expected: string;
  status: 'ready' | 'passed' | 'failed' | 'uncertain';
};

/** 新建时默认空列表；演示可点“AI 自动生成” */
export const INITIAL_SKILL_TEST_CASES: SkillTestCase[] = [];

export const TEST_CASE_PAGE_SIZE = 30;

/** 生成时附加的标准工程文件（文档编辑器 Tab） */
export const SKILL_ENGINEERING_FILES: SkillStudioFile[] = [
  {
    path: 'schema.json',
    content: `{
  "input": {
    "sessionId": "string",
    "dialogue": "string",
    "channel": "string"
  },
  "output": {
    "verdict": "pass|fail|warn",
    "score": "number",
    "findings": "array"
  }
}`,
  },
  {
    path: 'handler.ts',
    content: `/** 技能运行时入口 — 发布后可被数字员工调用 */
export async function runSkill(input: Record<string, unknown>) {
  // TODO: 接入编排引擎
  return { ok: true, input };
}`,
  },
  {
    path: 'metadata.yaml',
    content: `version: "1.0.0"
owner: team-ops
tags:
  - customer-service
  - v1`,
  },
];

export function enrichDraftFiles(files: SkillStudioFile[]): SkillStudioFile[] {
  const paths = new Set(files.map((f) => f.path));
  const extra = SKILL_ENGINEERING_FILES.filter((f) => !paths.has(f.path));
  return [...files, ...extra];
}

/** 技能包默认骨架文件（未生成前也可浏览 / 编辑模板） */
export const DEFAULT_SKILL_FILES: SkillStudioFile[] = [
  {
    path: 'SKILL.md',
    content: `---
name: my-skill
description: （一句话说明技能用途与触发场景）
---

# my-skill

## 何时使用

描述何时应调用本技能。

## 步骤

1. …
2. …

## 输出

说明期望输出格式。
`,
  },
  {
    path: 'references/README.md',
    content: `# references

存放技能运行时参考文档、清单与知识片段。

生成技能后，相关参考文件会出现在此目录。
`,
  },
  {
    path: 'assets/README.md',
    content: `# assets

存放模板、静态资源与输出样例。

生成技能后，报告模板等文件会出现在此目录。
`,
  },
  {
    path: 'scripts/README.md',
    content: `# scripts

存放可执行脚本与辅助工具。

生成技能后，自动化脚本会出现在此目录。
`,
  },
];

/** 将扁平 path 列表整理为目录树节点 */
export type SkillFileTreeNode =
  | { kind: 'dir'; name: string; children: SkillFileTreeNode[] }
  | { kind: 'file'; name: string; path: string };

/** 默认目录树：根文件 + 三个标准文件夹 */
export function getDefaultSkillTree(): SkillFileTreeNode[] {
  return buildFileTree(DEFAULT_SKILL_FILES);
}

export function buildFileTree(files: SkillStudioFile[]): SkillFileTreeNode[] {
  type Dir = { kind: 'dir'; name: string; children: SkillFileTreeNode[]; map: Map<string, Dir> };
  const root: Dir = { kind: 'dir', name: '', children: [], map: new Map() };

  const ensureDir = (parent: Dir, name: string): Dir => {
    let d = parent.map.get(name);
    if (!d) {
      d = { kind: 'dir', name, children: [], map: new Map() };
      parent.map.set(name, d);
      parent.children.push(d);
    }
    return d;
  };

  for (const f of files) {
    const parts = f.path.split('/');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = ensureDir(cur, parts[i]);
    }
    const fileName = parts[parts.length - 1];
    cur.children.push({ kind: 'file', name: fileName, path: f.path });
  }

  const strip = (nodes: SkillFileTreeNode[]): SkillFileTreeNode[] =>
    nodes.map((n) => {
      if (n.kind === 'file') return n;
      const d = n as Dir;
      return { kind: 'dir', name: d.name, children: strip(d.children) };
    });

  return strip(root.children);
}

/* ─────────────────────────────────────────────────────────────
 * AI 访谈式 Skill Builder — 六类原型 + 能力卡 + 边界测试
 * ───────────────────────────────────────────────────────────── */

export type SkillArchetype =
  | 'route_entry'
  | 'data_aggregate'
  | 'decision_rule'
  | 'knowledge_judge'
  | 'api_execute'
  | 'boundary_guide';

export const SKILL_ARCHETYPE_META: Record<
  SkillArchetype,
  { label: string; short: string; focus: string }
> = {
  route_entry: {
    label: '入口路由型',
    short: '入口路由',
    focus: '触发范围、优先级、唯一入口',
  },
  data_aggregate: {
    label: '数据聚合型',
    short: '数据聚合',
    focus: '数据源、字段、返回结构',
  },
  decision_rule: {
    label: '决策规则型',
    short: '决策规则',
    focus: '条件、规则、例外、结论',
  },
  knowledge_judge: {
    label: '知识判断型',
    short: '知识判断',
    focus: '知识源、判断标准、处理动作',
  },
  api_execute: {
    label: 'API 执行型',
    short: 'API 执行',
    focus: 'API、参数、调用顺序、禁止虚构',
  },
  boundary_guide: {
    label: '边界引导型',
    short: '边界引导',
    focus: '能答什么、不能答什么、兜底话术',
  },
};

export type SkillDataField = {
  id: string;
  label: string;
  source: 'api' | 'kb' | 'user' | 'mixed';
  checked: boolean;
};

export type SkillDecisionRule = {
  id: string;
  when: string;
  then: string;
};

export type SkillCapabilityCard = {
  name: string;
  archetypes: SkillArchetype[];
  goals: string[];
  triggers: string[];
  dataFields: SkillDataField[];
  outputs: string[];
  tools: string[];
  priority: 'high' | 'medium' | 'low';
  uniqueEntry: boolean | null;
  knowledgeSource: string;
  judgeTarget: string;
  judgeActions: { yes: string; no: string };
  rules: SkillDecisionRule[];
  forbidFiction: boolean;
  canAnswer: string[];
  cannotAnswer: string[];
  fallbackScript: string;
  understood: boolean;
  testable: boolean;
};

export type InterviewQuestionKind =
  | 'triggers'
  | 'unique_entry'
  | 'data_fields'
  | 'outputs'
  | 'rules'
  | 'knowledge'
  | 'api_strategy'
  | 'boundary'
  | 'fallback';

export type InterviewQuestion = {
  id: string;
  kind: InterviewQuestionKind;
  prompt: string;
  hint?: string;
};

export type BoundaryTestCase = {
  id: string;
  utterance: string;
  expected: 'trigger' | 'not_trigger' | 'uncertain';
  label: 'positive' | 'colloquial' | 'boundary' | 'negative';
  userMark?: 'trigger' | 'not_trigger';
  result?: 'pass' | 'fail' | 'pending';
};

export type ClassifySkillResult = {
  archetypes: SkillArchetype[];
  name: string;
  goals: string[];
  summary: string;
  card: SkillCapabilityCard;
  questions: InterviewQuestion[];
};

function emptyCard(partial?: Partial<SkillCapabilityCard>): SkillCapabilityCard {
  return {
    name: '',
    archetypes: [],
    goals: [],
    triggers: [],
    dataFields: [],
    outputs: [],
    tools: [],
    priority: 'medium',
    uniqueEntry: null,
    knowledgeSource: '',
    judgeTarget: '',
    judgeActions: { yes: '', no: '' },
    rules: [],
    forbidFiction: false,
    canAnswer: [],
    cannotAnswer: [],
    fallbackScript: '',
    understood: false,
    testable: false,
    ...partial,
  };
}

/** 根据自然语言意图识别 Skill 类型，并生成访谈问题队列 */
export function classifySkillIntent(intent: string): ClassifySkillResult {
  const text = intent.trim();
  const lower = text.toLowerCase();

  const has = (...keys: string[]) => keys.some((k) => text.includes(k) || lower.includes(k));

  const archetypes: SkillArchetype[] = [];
  if (has('唯一入口', '路由', '凡涉及', '都进入', '选它')) archetypes.push('route_entry');
  if (has('聚合', '一次性返回', '客户', '车辆', '门店', '权益', '查询客户'))
    archetypes.push('data_aggregate');
  if (has('七天', '无理由', '是否符合', '允许退', '不允许', '规则', '条件'))
    archetypes.push('decision_rule');
  if (has('知识库', '是否属于本店', '判断商品')) archetypes.push('knowledge_judge');
  if (has('api', 'curl', '接口', '安装申请', '禁止虚构', '禁止推测'))
    archetypes.push('api_execute');
  if (has('业务范围外', '不能回答', '边界', '兜底')) archetypes.push('boundary_guide');

  if (archetypes.length === 0) {
    if (has('预约', '保养', '车检', '维保')) {
      archetypes.push('route_entry', 'data_aggregate');
    } else if (has('退货', '退款')) {
      archetypes.push('decision_rule');
    } else if (has('安装')) {
      archetypes.push('api_execute');
    } else {
      archetypes.push('data_aggregate');
    }
  }

  // 去重保持顺序
  const uniq = Array.from(new Set(archetypes));

  let name = '未命名业务技能';
  if (has('维保', '保养', '车检')) name = '预约维保';
  else if (has('七天', '无理由')) name = '七天无理由退货判定';
  else if (has('本店商品', '退换货知识')) name = '退换货本店商品判定';
  else if (has('净水器', '安装')) name = '净水器安装申请';
  else if (has('食安')) name = '食安险业务边界引导';
  else {
    const first = text.replace(/[“”""]/g, '').slice(0, 18);
    if (first) name = first;
  }

  const goals: string[] = [];
  if (uniq.includes('route_entry')) goals.push('识别并路由相关业务意图');
  if (uniq.includes('data_aggregate')) goals.push('汇总预约/办理所需完整信息');
  if (uniq.includes('decision_rule')) goals.push('按规则给出明确结论');
  if (uniq.includes('knowledge_judge')) goals.push('基于知识库完成判断并分流');
  if (uniq.includes('api_execute')) goals.push('严格通过接口取数并执行申请');
  if (uniq.includes('boundary_guide')) goals.push('守住业务边界并给出兜底话术');
  if (goals.length === 0) goals.push('完成用户描述的业务能力');

  const typeLabel = uniq.map((a) => SKILL_ARCHETYPE_META[a].label.replace('型', '')).join(' + ');
  const summary = `我理解这是一个“${typeLabel} Skill”。\n\n它需要解决：\n${goals
    .map((g, i) => `${['①', '②', '③', '④', '⑤', '⑥'][i] || `${i + 1}.`} ${g}`)
    .join('\n')}`;

  const card = emptyCard({
    name,
    archetypes: uniq,
    goals,
    priority: uniq.includes('route_entry') ? 'high' : 'medium',
    triggers: suggestTriggersForIntent(text, uniq),
    dataFields: suggestDataFields(uniq),
    outputs: suggestOutputs(uniq),
    tools: suggestTools(uniq),
    knowledgeSource: uniq.includes('knowledge_judge') ? '退换货知识库' : '',
    judgeTarget: uniq.includes('knowledge_judge') ? '判断商品是否属于本店商品' : '',
    judgeActions: uniq.includes('knowledge_judge')
      ? { yes: '进入退货流程', no: '告知非本店商品' }
      : { yes: '', no: '' },
    rules: uniq.includes('decision_rule') ? suggestDefaultRules(text) : [],
    forbidFiction: uniq.includes('api_execute'),
    canAnswer: uniq.includes('boundary_guide') ? ['保单查询', '理赔材料说明'] : [],
    cannotAnswer: uniq.includes('boundary_guide') ? ['非食安险产品咨询', '竞品对比'] : [],
    fallbackScript: uniq.includes('boundary_guide')
      ? '抱歉，这个问题超出食安险服务范围，我可以帮您转接人工或相关业务入口。'
      : '',
  });

  return {
    archetypes: uniq,
    name,
    goals,
    summary,
    card,
    questions: buildInterviewQueue(uniq),
  };
}

export function suggestTriggersForIntent(intent: string, archetypes: SkillArchetype[]): string[] {
  if (archetypes.includes('route_entry') || intent.includes('保养') || intent.includes('维保')) {
    return [
      '预约保养',
      '约保养',
      '保养预约',
      '预约车检',
      '车辆检修预约',
      '我想给车做个保养',
      '帮我约个车检',
      '我的车该保养了，帮我安排一下',
    ];
  }
  if (archetypes.includes('decision_rule') || intent.includes('退货')) {
    return ['我想退货', '申请七天无理由', '这个能退吗', '帮我退款'];
  }
  if (archetypes.includes('api_execute')) {
    return ['申请安装净水器', '帮我约安装', '净水器安装进度'];
  }
  if (archetypes.includes('boundary_guide')) {
    return ['食安险怎么理赔', '这个保单能保什么', '你们还卖别的保险吗'];
  }
  return ['帮我处理这件事', '我想咨询相关业务'];
}

function suggestDataFields(archetypes: SkillArchetype[]): SkillDataField[] {
  if (archetypes.includes('api_execute')) {
    return [
      { id: 'customer', label: '客户信息', source: 'api', checked: true },
      { id: 'order', label: '订单信息', source: 'api', checked: true },
      { id: 'install', label: '安装信息', source: 'api', checked: true },
      { id: 'store', label: '门店信息', source: 'api', checked: true },
    ];
  }
  if (archetypes.includes('data_aggregate') || archetypes.includes('route_entry')) {
    return [
      { id: 'customer', label: '客户信息', source: 'api', checked: true },
      { id: 'vehicle', label: '车辆信息', source: 'api', checked: true },
      { id: 'advice', label: '维保建议', source: 'mixed', checked: true },
      { id: 'store', label: '门店信息', source: 'api', checked: true },
      { id: 'benefit', label: '用户权益', source: 'api', checked: true },
    ];
  }
  return [
    { id: 'user', label: '用户输入', source: 'user', checked: true },
    { id: 'context', label: '业务上下文', source: 'mixed', checked: true },
  ];
}

function suggestOutputs(archetypes: SkillArchetype[]): string[] {
  if (archetypes.includes('decision_rule')) return ['是否允许退款', '判定依据', '下一步话术'];
  if (archetypes.includes('knowledge_judge')) return ['是否本店商品', '分流动作'];
  if (archetypes.includes('api_execute')) return ['安装申请单', '接口回执', '禁止虚构声明'];
  if (archetypes.includes('boundary_guide')) return ['可答范围说明', '兜底话术', '转接建议'];
  return ['预约信息', '保养方案卡片'];
}

function suggestTools(archetypes: SkillArchetype[]): string[] {
  if (archetypes.includes('api_execute')) return ['客户查询 API', '订单查询 API', '安装申请 API'];
  if (archetypes.includes('knowledge_judge')) return ['退换货知识库检索'];
  if (archetypes.includes('data_aggregate') || archetypes.includes('route_entry')) {
    return ['客户查询', '车辆查询', '门店查询', '权益查询'];
  }
  if (archetypes.includes('decision_rule')) return ['订单时效校验', '品类规则引擎'];
  return ['业务知识检索'];
}

function suggestDefaultRules(intent: string): SkillDecisionRule[] {
  if (intent.includes('OPPO') || intent.includes('七天') || intent.includes('退货')) {
    return [
      { id: 'r1', when: '商品 = 衣服 AND 购买时间 ≤ 7天', then: '允许退款' },
      { id: 'r2', when: '商品 = 手机 AND 品牌 = OPPO AND ≤ 7天', then: '允许退款' },
      { id: 'r3', when: '商品 = 手机 AND 品牌 ≠ OPPO', then: '不允许退款' },
      { id: 'r4', when: '其他情况', then: '不允许退款' },
    ];
  }
  return [
    { id: 'r1', when: '满足业务准入条件', then: '允许继续' },
    { id: 'r2', when: '不满足 / 信息不足', then: '拒绝并说明原因' },
  ];
}

export function buildInterviewQueue(archetypes: SkillArchetype[]): InterviewQuestion[] {
  const q: InterviewQuestion[] = [];
  if (archetypes.includes('route_entry') || archetypes.includes('data_aggregate')) {
    q.push({
      id: 'triggers',
      kind: 'triggers',
      prompt: '这个 Skill 什么时候应该被触发？',
      hint: '我已根据描述识别了常见说法，可全部纳入或增删。',
    });
  }
  if (archetypes.includes('route_entry')) {
    q.push({
      id: 'unique_entry',
      kind: 'unique_entry',
      prompt: '这个 Skill 是不是该业务的唯一入口？',
      hint: '唯一入口会自动提高路由优先级，并优先于普通咨询类 Skill。',
    });
  }
  if (archetypes.includes('data_aggregate') || archetypes.includes('api_execute')) {
    q.push({
      id: 'data_fields',
      kind: 'data_fields',
      prompt: '执行前，哪些信息必须一次性拿到？',
      hint: '勾选即确认返回结构；右侧会实时预览能力卡。',
    });
  }
  if (archetypes.includes('decision_rule')) {
    q.push({
      id: 'rules',
      kind: 'rules',
      prompt: '请确认判定规则是否与业务一致？',
      hint: '我已把自然语言规则转成结构化逻辑，请核对例外分支。',
    });
  }
  if (archetypes.includes('knowledge_judge')) {
    q.push({
      id: 'knowledge',
      kind: 'knowledge',
      prompt: '请确认知识来源、判断目标与结果动作。',
    });
  }
  if (archetypes.includes('api_execute')) {
    q.push({
      id: 'api_strategy',
      kind: 'api_strategy',
      prompt: '请确认数据获取策略（全部走 API 时将自动写入禁止虚构约束）。',
    });
  }
  if (archetypes.includes('boundary_guide')) {
    q.push({
      id: 'boundary',
      kind: 'boundary',
      prompt: '哪些问题能答、哪些必须拒绝？兜底话术是什么？',
    });
  }
  q.push({
    id: 'outputs',
    kind: 'outputs',
    prompt: '用户最终应看到什么产出？',
    hint: '确认后即可进入边界测试。',
  });
  return q;
}

export function applyInterviewAnswer(
  card: SkillCapabilityCard,
  kind: InterviewQuestionKind,
  payload: Record<string, unknown>,
): SkillCapabilityCard {
  const next = { ...card };
  switch (kind) {
    case 'triggers': {
      const triggers = (payload.triggers as string[]) || card.triggers;
      next.triggers = triggers;
      break;
    }
    case 'unique_entry': {
      const unique = payload.uniqueEntry as boolean;
      next.uniqueEntry = unique;
      next.priority = unique ? 'high' : 'medium';
      break;
    }
    case 'data_fields': {
      next.dataFields = (payload.dataFields as SkillDataField[]) || card.dataFields;
      break;
    }
    case 'outputs': {
      next.outputs = (payload.outputs as string[]) || card.outputs;
      next.understood = true;
      next.testable = true;
      break;
    }
    case 'rules': {
      next.rules = (payload.rules as SkillDecisionRule[]) || card.rules;
      next.understood = true;
      break;
    }
    case 'knowledge': {
      next.knowledgeSource = String(payload.knowledgeSource ?? card.knowledgeSource);
      next.judgeTarget = String(payload.judgeTarget ?? card.judgeTarget);
      next.judgeActions = (payload.judgeActions as SkillCapabilityCard['judgeActions']) ||
        card.judgeActions;
      next.understood = true;
      break;
    }
    case 'api_strategy': {
      next.dataFields = (payload.dataFields as SkillDataField[]) || card.dataFields;
      next.forbidFiction = true;
      next.understood = true;
      break;
    }
    case 'boundary': {
      next.canAnswer = (payload.canAnswer as string[]) || card.canAnswer;
      next.cannotAnswer = (payload.cannotAnswer as string[]) || card.cannotAnswer;
      next.fallbackScript = String(payload.fallbackScript ?? card.fallbackScript);
      next.understood = true;
      break;
    }
    default:
      break;
  }
  next.testable = next.understood || next.triggers.length > 0;
  return next;
}

/** 自动生成正向 / 口语 / 边界 / 负向测试 */
export function buildBoundaryTests(card: SkillCapabilityCard): BoundaryTestCase[] {
  const positives = card.triggers.slice(0, 3).map((u, i) => ({
    id: `bp_${i}`,
    utterance: u,
    expected: 'trigger' as const,
    label: (i === 0 ? 'positive' : 'colloquial') as BoundaryTestCase['label'],
  }));

  const boundaries: BoundaryTestCase[] = [];
  if (card.archetypes.includes('route_entry') || card.name.includes('维保')) {
    boundaries.push(
      {
        id: 'bb1',
        utterance: '我想知道保养多少钱',
        expected: 'uncertain',
        label: 'boundary',
      },
      {
        id: 'bb2',
        utterance: '我的车多久保养一次',
        expected: 'not_trigger',
        label: 'boundary',
      },
      {
        id: 'bb3',
        utterance: '预约明天和销售见面',
        expected: 'not_trigger',
        label: 'boundary',
      },
      {
        id: 'bn1',
        utterance: '帮我预约餐厅',
        expected: 'not_trigger',
        label: 'negative',
      },
    );
  } else if (card.archetypes.includes('decision_rule')) {
    boundaries.push(
      {
        id: 'bb1',
        utterance: '买了 3 天的衣服能退吗',
        expected: 'trigger',
        label: 'positive',
      },
      {
        id: 'bb2',
        utterance: 'OPPO 手机买了 10 天还能退吗',
        expected: 'trigger',
        label: 'boundary',
      },
      {
        id: 'bn1',
        utterance: '帮我查物流',
        expected: 'not_trigger',
        label: 'negative',
      },
    );
  } else {
    boundaries.push(
      {
        id: 'bb1',
        utterance: `关于${card.name}的边界问题`,
        expected: 'uncertain',
        label: 'boundary',
      },
      {
        id: 'bn1',
        utterance: '今天天气怎么样',
        expected: 'not_trigger',
        label: 'negative',
      },
    );
  }

  return [...positives, ...boundaries];
}

export function runBoundaryTests(
  cases: BoundaryTestCase[],
): BoundaryTestCase[] {
  return cases.map((c) => {
    const mark = c.userMark;
    if (mark) {
      const pass =
        (c.expected === 'uncertain' && true) ||
        (mark === 'trigger' && c.expected === 'trigger') ||
        (mark === 'not_trigger' && c.expected === 'not_trigger');
      // uncertain: any mark counts as learning, treat as pass for demo
      const ok =
        c.expected === 'uncertain'
          ? true
          : mark === 'trigger'
            ? c.expected === 'trigger'
            : c.expected === 'not_trigger';
      return { ...c, result: ok ? 'pass' : 'fail' };
    }
    // auto mock: positives/colloquial trigger; negative not; boundary uncertain stays pending-ish pass
    if (c.expected === 'trigger') return { ...c, result: 'pass' };
    if (c.expected === 'not_trigger') return { ...c, result: 'pass' };
    return { ...c, result: 'pass' };
  });
}

export function capabilityCardToElements(card: SkillCapabilityCard): SkillElementsForm {
  const code = slugifySkillName(card.name) || 'new_skill';
  const typeLabel = card.archetypes.map((a) => SKILL_ARCHETYPE_META[a].label).join(' + ');
  const fields = card.dataFields.filter((f) => f.checked).map((f) => f.label).join('、');
  const form = createEmptySkillElements(code);
  form.nameCn = card.name.slice(0, 30);
  form.nameEn = code;
  form.purpose = `${typeLabel}：${card.goals.join('；')}`.slice(0, 50);
  form.triggerWhen = card.triggers.slice(0, 6).join(' / ').slice(0, 50) || '用户表达相关业务意图';
  form.triggerForbidden =
    card.cannotAnswer.slice(0, 3).join('；') ||
    '非本技能业务范围；信息不足需澄清；情绪升级转人工';
  form.userInputs = fields || '用户问题与必要业务上下文';
  form.outputs = card.outputs.join('、') || '结构化业务结果';
  form.knowledgeModules = [
    {
      id: uid('km'),
      content: [
        `类型：${typeLabel}`,
        card.knowledgeSource ? `知识源：${card.knowledgeSource}` : '',
        card.judgeTarget ? `判断目标：${card.judgeTarget}` : '',
        card.rules.length
          ? `规则：\n${card.rules.map((r) => `- IF ${r.when} THEN ${r.then}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      note: '由访谈式创建生成',
    },
  ];
  form.stepModules = card.goals.map((g, i) => ({
    id: uid('sm'),
    name: `步骤 ${i + 1}`,
    instruction: g,
    knowledge: card.knowledgeSource,
    example: card.triggers[0] || '',
  }));
  form.forbiddenActs = card.forbidFiction
    ? '禁止使用推测数据；禁止使用示例数据；所有字段必须来自 API 返回值'
    : '不得编造事实；不得泄露隐私';
  form.fallbackPolicy =
    card.fallbackScript || '异常时阻断并转人工专席核实';
  form.examples = card.triggers
    .slice(0, 3)
    .map((t) => `用户：“${t}”→ 触发本技能`)
    .join('\n');
  if (card.uniqueEntry) {
    form.extraNotes = '路由优先级：高；冲突策略：优先于普通咨询类 Skill（唯一入口）';
  }
  return form;
}

export const INTENT_EXAMPLES = [
  '用户说预约保养、车检、维修时，都进入这个 Skill，并一次性返回客户、车辆、门店和维保建议。',
  '判断用户申请退货是否符合七天无理由退货政策（衣服 7 天内可退；手机仅 OPPO 且 7 天内）。',
  '当用户发起退货请求时，查询退换货知识库判断是否本店商品：是则进入退货，否则告知非本店。',
  '安利净水器安装申请：客户/订单/安装/门店信息必须通过接口查询，禁止编造。',
] as const;

/** 深度思考 / 思维链步骤（工作台对话中间态） */
export type SkillThinkCotKind = 'read' | 'run' | 'note';

export type SkillThinkCotChild = {
  id: string;
  label: string;
  /** Cot 动作样式：读文件 / 跑命令 / 普通备注 */
  kind?: SkillThinkCotKind;
};

export type SkillThinkStep = {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
  /** Cot 嵌套动作（展开后展示工具调用式步骤） */
  children?: SkillThinkCotChild[];
};

export type SkillThinkPlan = {
  title: string;
  steps: SkillThinkStep[];
  /** 任务规划步骤（与深度思考分离；缺省时回退用 steps） */
  planSteps?: SkillThinkStep[];
  /** 总时长目标（ms），分摊到各步 */
  totalMs: number;
};

/** 根据用户意图生成可逐步播放的思维链 + 任务规划 */
export function buildIntentThinkPlan(intent: string): SkillThinkPlan {
  const classified = classifySkillIntent(intent);
  const typeLabel = classified.archetypes
    .map((a) => SKILL_ARCHETYPE_META[a].label)
    .join(' + ');
  const focus = classified.archetypes
    .map((a) => SKILL_ARCHETYPE_META[a].focus)
    .join('；');

  return {
    title: '思考中',
    totalMs: 9000 + Math.floor(Math.random() * 2400),
    steps: [
      {
        id: 'parse',
        label: '先总结用户想做成的能力',
        detail: `${classified.goals.slice(0, 2).join('；') || intent.slice(0, 48)}。对照创建规范，把必须守住的边界与不可省略约束先拎出来。`,
        status: 'pending',
        children: [
          { id: 'parse-read', label: '已读取用户目标表述', kind: 'read' },
          { id: 'parse-run', label: '已对齐 `技能创建规范` 边界', kind: 'run' },
        ],
      },
      {
        id: 'type',
        label: '再看写入四张表单前还缺什么',
        detail: `场景更接近「${typeLabel}」，关注点在：${focus}。据此判断技能能做什么、哪里不该越权，以及表单里还缺哪些关键信息。`,
        status: 'pending',
        children: [
          { id: 'type-read', label: `已匹配范式「${typeLabel}」`, kind: 'read' },
          { id: 'type-run', label: '已扫描 `定义/主体/规范/补充` 缺口', kind: 'run' },
        ],
      },
      {
        id: 'gap',
        label: '思路收束',
        detail: `信息还不够写死规格，优先澄清：${classified.questions.map((q) => q.prompt.replace(/？$/, '')).slice(0, 3).join('；')}。想清楚后再进入任务规划。`,
        status: 'pending',
        children: [
          { id: 'gap-run', label: '已整理待澄清关键问题', kind: 'run' },
          { id: 'gap-note', label: '准备进入任务规划生成可点选卡片', kind: 'note' },
        ],
      },
    ],
    planSteps: [
      {
        id: 'p1',
        label: '生成澄清问题',
        detail: '准备可点选的补充信息卡',
        status: 'pending',
      },
      {
        id: 'p2',
        label: '对齐四张表单草稿',
        detail: '定义 / 主体 / 规范 / 补充等待写入',
        status: 'pending',
      },
      {
        id: 'p3',
        label: '交付可确认方案',
        detail: '理解摘要与确认卡，点确认后再写入左侧',
        status: 'pending',
      },
    ],
  };
}

/** 技能创建首轮反问 — 补充信息 */
export type SkillClarifyOption = {
  id: string;
  label: string;
};

export type SkillClarifyQuestion = {
  id: string;
  prompt: string;
  required?: boolean;
  options: SkillClarifyOption[];
  selectedId?: string | null;
};

export type SkillClarifyPayload = {
  questions: SkillClarifyQuestion[];
  submitted?: boolean;
  skipped?: boolean;
  collapsed?: boolean;
};

/** 根据用户意图生成首轮反问（对齐左侧四张创建表单） */
export function buildSkillClarifyQuestions(intent: string): SkillClarifyQuestion[] {
  const text = intent.trim();
  const has = (...keys: string[]) => keys.some((k) => text.includes(k));

  const isComplaint = has('投诉', '辱骂', '安抚', '情绪', '红线', '客诉', '监管', '曝光', '威胁');
  const isQuery = has('查询', '进度', '物流', '订单', '运单', '状态', '跟踪');
  const isCollect = has('收集', '分流', '接待', '咨询', '引导');

  const triggerDefault = isComplaint
    ? 'trigger-complaint'
    : isQuery
      ? 'trigger-query'
      : isCollect
        ? 'trigger-collect'
        : null;

  const capabilityDefault = has('接口', '脚本', 'API', '系统', '查询')
    ? has('知识', '知识库', 'FAQ', '文档')
      ? 'cap-both'
      : 'cap-api'
    : has('知识', '知识库', 'FAQ')
      ? 'cap-kb'
      : isComplaint
        ? 'cap-guide'
        : null;

  const boundaryDefault = isComplaint
    ? 'boundary-escalate'
    : isQuery
      ? 'boundary-mixed'
      : null;

  return [
    {
      id: 'trigger-scene',
      prompt: '这个技能主要在什么场景下触发？',
      required: true,
      selectedId: triggerDefault,
      options: [
        { id: 'trigger-consult', label: '用户主动咨询业务问题' },
        { id: 'trigger-complaint', label: '投诉 / 风险 / 情绪类话术' },
        { id: 'trigger-query', label: '订单、物流、售后进度查询' },
        { id: 'trigger-collect', label: '信息收集与初步分流' },
      ],
    },
    {
      id: 'execution-capability',
      prompt: '执行时需要哪些能力？',
      required: true,
      selectedId: capabilityDefault,
      options: [
        { id: 'cap-kb', label: '查知识库，组织可读回复' },
        { id: 'cap-api', label: '调用业务系统接口查询' },
        { id: 'cap-both', label: '知识库 + 接口组合使用' },
        { id: 'cap-guide', label: '纯对话引导，不查外部资料' },
      ],
    },
    {
      id: 'boundary-policy',
      prompt: '遇到边界情况如何处理？',
      required: true,
      selectedId: boundaryDefault,
      options: [
        { id: 'boundary-escalate', label: '达到红线即转人工，不擅自承诺' },
        { id: 'boundary-self', label: '简单问题可自主完结' },
        { id: 'boundary-mixed', label: '先安抚收集信息，复杂 case 转人工' },
        { id: 'boundary-generic', label: '暂不确定，先写通用兜底话术' },
      ],
    },
  ];
}

export function formatClarifyAnswers(questions: SkillClarifyQuestion[]): string {
  return questions
    .filter((q) => q.selectedId)
    .map((q) => {
      const option = q.options.find((o) => o.id === q.selectedId);
      return option ? `${q.prompt} ${option.label}` : q.prompt;
    })
    .join('\n');
}

/** 不应触发说法（创建交互蓝图：应触发 / 不应触发成对出现） */
export function suggestAntiTriggersForIntent(
  intent: string,
  archetypes: SkillArchetype[],
): string[] {
  if (archetypes.includes('route_entry') || intent.includes('保养') || intent.includes('维保')) {
    return [
      '我想知道保养多少钱',
      '我的车多久保养一次',
      '预约明天和销售见面',
      '帮我预约餐厅',
      '油耗突然升高是怎么回事',
    ];
  }
  if (archetypes.includes('decision_rule') || intent.includes('退货')) {
    return ['帮我查物流', '我想换个颜色看看', '只是问问能不能便宜点'];
  }
  if (archetypes.includes('api_execute')) {
    return ['随便编一个安装单号给我', '用示例地址先走通流程'];
  }
  if (archetypes.includes('boundary_guide')) {
    return ['你们还卖别的保险吗', '帮我对比一下竞品'];
  }
  return ['今天天气怎么样', '帮我写一首诗'];
}

/** 用户确认一项后，思考下一问 */
export function buildNextQuestionThinkPlan(
  kind: InterviewQuestionKind,
  cardName: string,
): SkillThinkPlan {
  const map: Record<InterviewQuestionKind, { label: string; detail: string }> = {
    triggers: {
      label: '收敛触发说法',
      detail: `围绕“${cardName}”筛出口语变体与易误触边界`,
    },
    unique_entry: {
      label: '评估路由优先级',
      detail: '判断是否应设为唯一入口，以及与普通咨询 Skill 的冲突策略',
    },
    data_fields: {
      label: '推导必取字段',
      detail: '根据业务目标列出一次性返回的数据结构',
    },
    outputs: {
      label: '对齐产出物',
      detail: '把交付物写成可验收的卡片/结论形态',
    },
    rules: {
      label: '结构化判定规则',
      detail: '把自然语言规则转成 IF / THEN 分支供用户核对',
    },
    knowledge: {
      label: '绑定知识与分流',
      detail: '确认知识源、判断目标与是/否动作',
    },
    api_strategy: {
      label: '约束取数路径',
      detail: '强制 API 取数并生成禁止虚构执行约束',
    },
    boundary: {
      label: '划定可答边界',
      detail: '区分能答 / 不能答，并准备兜底话术',
    },
    fallback: {
      label: '整理兜底策略',
      detail: '异常与拒答时的话术与转接路径',
    },
  };
  const cur = map[kind];
  return {
    title: '思考中',
    totalMs: 1600 + Math.floor(Math.random() * 1200),
    steps: [
      {
        id: 'reflect',
        label: '消化上一轮确认',
        detail: '把用户选择写回能力模型，检查与已有字段是否冲突',
        status: 'pending',
      },
      {
        id: 'next',
        label: cur.label,
        detail: cur.detail,
        status: 'pending',
      },
      {
        id: 'ask',
        label: '生成下一问选项',
        detail: '准备可点选确认卡，避免让用户手写配置',
        status: 'pending',
      },
    ],
  };
}
