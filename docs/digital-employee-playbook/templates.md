# templates.md｜仓库级模板：意图到结构与元素的映射

版本 0.2。模板是本仓库组件的**声明式组装配方**，不是声称已经存在的通用 React 页面导出。机器可检查的字段与绑定唯一放在 catalog.json；本文说明如何选与如何用。

## 1. 先确定业务，再选结构

输入 product.md 的意图卡；按 domain、object、action、outcome 四字段精确路由。只按“培训”“发布”关键词选择模板会造成业务混用，不可采用。自然语言澄清/规范化发生在路由前，四字段不全返回 needs_clarification，无匹配返回 no_match，多匹配返回 ambiguous。

目录目前只完成在线客服培训的四个小模板。外呼、质检、技能创建等请求不会退回这个域。选择市场、任务监控等通用布局可作为后续模板候选，但在业务规则与原子用例补齐前不登记为可自动匹配。

## 2. 已登记模板

| 模板 | 意图与精确匹配 | 结构及必需元素 | 禁止隐含动作 |
|---|---|---|---|
| TPL-SAVE 候选保存 | online_service / training_snapshot / save_candidate / candidate_saved | 员工上下文、双栏承载、字段与标签、保存主动作、候选状态、忙碌态 | 不应用、不上岗、不新增导航 |
| TPL-TEST 能力测试 | 同域/对象 / test_candidate / test_evidence | 员工上下文、测试区、结果状态、忙碌态 | 不因测试通过自动应用 |
| TPL-APPLY 应用确认 | 同域/对象 / apply_candidate / new_sessions_updated | 影响确认层、确认、取消、提交结果状态 | 不编辑培训、不扩大到旧会话 |
| TPL-HISTORY 存档查看 | 同域/对象 / inspect_history / history_viewed | 员工上下文、存档列表、状态 | 只读查看不触发回退/应用 |

历史组件有应用/删除能力，不代表 TPL-HISTORY 授权调用全部组件能力。实例必须限制暴露动作；需要回退时创建独立意图卡并按业务资格生成应用单元。

## 3. 模板槽位→组件→Token

| 模板.槽位 | 组件 ID / 实际承载 | Token映射 ID | 输入/输出约束 |
|---|---|---|---|
| SAVE.context | CMP-WORKSPACE / OnboardingWorkspaceHeader | K-SECONDARY | 返回当前员工上下文；员工名/版本展示可组合补充，不臆造组件 props |
| SAVE.layout | CMP-SPLIT / ResizableSplitPane | K-PANEL | left=编辑区；right=状态/证据；不改变业务数据 |
| SAVE.fields | CMP-FIELD / 原生字段+FIELD | K-FIELD、K-LABEL | 输入只写草稿；单行与多行分开 |
| SAVE.save | CMP-PRIMARY / 原生 button+BTN_INK | K-PRIMARY | onClick 仅绑定 save_candidate |
| SAVE.candidate_status | CMP-STATUS / badgeClass | K-STATUS | 展示候选资格，不能写成当前在岗状态 |
| SAVE.busy | CMP-BUSY / ContentBusy | K-PANEL | 忙碌仅影响本单元，不盖住全平台 |
| TEST.test | CMP-TEST / OnboardingCapabilityTestPanel | K-PANEL | 现有是模拟对话，需要扩展逐项资格证据，不能直接称完整测试组件 |
| APPLY.confirmation | CMP-DIALOG / PanelModal | K-DIALOG | children=差异/范围；footer=确认/取消；由调用方管理提交与未知态 |
| APPLY.confirm / cancel | CMP-PRIMARY / CMP-SECONDARY | K-PRIMARY / K-SECONDARY | 确认提交/取消无副作用，各自独立断言 |
| HISTORY.versions | CMP-VERSIONS / AgentVersionPanel | K-PANEL | 查看/删除/应用权限受意图与业务约束，不能直接暴露全部默认动作 |

完整槽位 ID 使用 catalog.json 中 context/layout 等字段，表中的 SAVE 是 TPL-SAVE 的简称。所有槽位均保留 required=true；本次若需要删槽位，先明确规则是否仍被其他元素承载，再改目录与用例，不能生成时临场省掉。

## 4. 匹配输出必须带解释

route 输出模板 ID、选中的业务规则、每个槽位的组件与Token绑定、原子用例 ID。生成计划使用 examples/save-plan.json 的格式。字段缺失、候选不唯一、模板未覆盖，都不算匹配成功。

示例：“先保存，不影响线上”→规范化 save_candidate→TPL-SAVE→save 槽→CMP-PRIMARY→K-PRIMARY→BTN_INK；对应 DOM-OS-01/R01→AU-S01 检查线上版本不变。按钮外观相同不意味着行为相同，确认应用使用另一个模板与独立动作。

## 5. 不允许新增无依据的元素

生成结果新增成长曲线、全局助手、自动发布、计费或其他业务字段时，必须有意图/Spec来源。不是 catalog 允许的槽位先登记扩展建议，Evaluator 将其判为 unplanned_slot；不得以“丰富页面”绕过主线。

## 6. 模板扩展模板

id / domain / object / action / outcome / 适用与排除 / 必需槽位 / 可选槽位与明确条件 / 组件限制 / Token绑定 / 业务规则 / 小单元用例 / 组合用例 / 当前缺口 / 来源与版本。

新模板先写一条匹配正例、一条同词异域反例、一条字段缺失反例，再通过目录检查。新增知识不默认进入所有任务上下文。

## TPL-SKILL-CONFIRM｜AI 修改前核对

意图签名：skill_creation / skill / confirm_write / content_updated。来源：Skill 策略与 S05；状态 prototype_recipe。

适用：当前 Skill 有待确认的 AI 修改。排除：纯问答、用户直接编辑、发布、员工创建。必须有 skillId。

- confirmation → CMP-SKILL-CONFIRM → K-SKILL-CONFIRM：变更要点、当前轮次、确认状态。旧轮次只读但可回看。
- content → CMP-FIELD → K-FIELD / K-LABEL：本次独立试跑的内容核对区。现有完整产品使用 ManusExpertFrame 时需另建编辑器配方，不能把 textarea 当等价专家编辑器。
- 布局：宽屏左右核对，窄宽上下排列；不强制所有创建首屏展开。必须沿用已有样式，并实际检查遮挡与滚动。

验证 AU-SK01–06。可运行参考：src/design-io/SkillConfirmPreview.tsx，design-io.html?case=skill-confirm。此为小单元交互样例，不是完整 Skill 生成。
