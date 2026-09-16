# 组内执行手册｜从需求到可打开的 UI 和交互

组内同学可使用 Cursor、Codex、AI Studio 等 AI Coding 工具。首次按 [跨工具接入说明](10-cross-tool-setup.md) 配置同一份工作包，之后只需输入需求。统一入口为 [START-HERE.md](START-HERE.md)。

本页是具备仓库和命令执行能力时的技术步骤，由助手操作。缺少某项能力时按通用入口保留未验证状态，并在可执行环境补验，不要求用户手填材料。

## 从哪里开始

输入目标、必要约束和预期结果。例如：“Skill 修改前让我确认，出现新方案后旧方案只能查看，确认后留在当前编辑位置。”支持范围以 catalog.json 为准；当前 5 个配方不是 5 个完整业务产品。

助手先读 product 与当前 domain，再选 templates、components、design、craft，输出简短设计理解。未知业务保持未知；可逆 UI 方案继续做，影响操作后果的歧义单列。

## 助手执行顺序

1. 将理解后的任务写为 intent.json；一个主要对象和动作，标明不做事项及真实或演示上下文。参考 examples/skill-confirm-intent.json，但不要直接复用演示实体。
2. `npm run design-io:start -- --intent <intent.json>`：校验来源与路由，生成 runs/<task-id>。同名拒绝覆盖；原任务在原目录继续。Spec 是待补齐草案。
3. 补齐 Spec，逐槽位查询真实组件接口和 Token。实现至用户现有页面或独立试跑，保留原有工作。为新功能写自己的 bindings.json。
4. `npm run design-io:bindings -- <bindings.json>`：验证真实导入及槽位引用。运行适用类型与行为检查；默认 `design-io:verify` 主要验证保存样例与试跑构建，不能替代本次测试。
5. 实际打开结果，按原子用例与完整路径操作，检查两种宽度、长内容、关键状态和键盘焦点。记录截图、操作与问题；证据放当前 run 内。
6. 填写 results.json 和 visual-review.md；运行 `npm run design-io:review -- --run <run目录>`。未执行或失败均阻止证据齐全结论。该命令核对清单，不替代观察者判断画面。
7. 交付可打开结果、Spec 和简短验证摘要。缺口按知识层回流；原型通过不代表生产能力完成。

## 遇到什么情况怎么处理

| 结果 | 助手下一步 |
|---|---|
| no_match | 检查是否理解错对象；确为新意图则基于案例和真实组件新增配方与断言，不套保存模板 |
| source_drift | 阅读变化并记录复核，才更新哈希；不自动消除品牌冲突 |
| missing_entity_context | 读取模板 context_keys；Skill 使用 skillId，不虚构 employeeId |
| wrong_import / missing_applied_token | 修正真实导入及实际应用位置，不只在注释提到 Token |
| incomplete | 查看缺失的具体用例，继续操作与记录；不能复制别的任务证据 |
| ready_for_human_review | 仅清单齐全，结合实际视觉、交互和任务观察作结论 |

## 本轮新增试跑

本地开发服务启动后打开 `/design-io.html?case=skill-confirm`。默认 `/design-io.html` 保留原保存样例。新试跑复用 SkillRoundConfirmCard，演示确认前原文、新方案使旧卡只读、确认后更新内容。并不实现模型生成或完整专家编辑器。

校招生和另一位同学的迁移验证仍需用新需求完成，不能以本次编写者自己跑通作为替代。记录首次结果、返工和已有规则重复解释，才能判断稳定性提高。

review 还核对 bindings.json 与 results.source_hashes：必须记录当前实现文件、绑定来源、lib/ui.ts、src/index.css 的 SHA-256。助手在实际验证后计算，源码变化后重新验证再更新；不能仅更新哈希维持通过。浏览器脚本会写记录和截图，不自动宣告视觉合格。
