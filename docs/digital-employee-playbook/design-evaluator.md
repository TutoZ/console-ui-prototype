# Design Evaluator｜质量评估、证据验证与回流契约

版本 0.2。评估器由“可运行静态检查 + 实际操作取证 + 设计/业务评审”组成。已提供的 Python 工具只执行第一项和证据清单完整性检查，不能替代浏览器或人工判断。

## 1. 输入与输出

输入：意图冻结卡、product/domain 规则、单功能 Spec、选定模板、槽位/组件/Token清单、构建版本、原子用例及组合用例、实际输出和证据。

输出：逐项问题、证据、关联规则和责任层、允许进入的下一阶段。不得只输出分数。

## 2. 检查顺序

| 检查 ID | 问题 | 方法与通过证据 | 失败回流 |
|---|---|---|---|
| EV01 主线与知识隔离 | 有没有跑到其他业务域、扩大动作、使用未确认规则？ | 对照原始意图卡与 P/DOM ID；路由器精确字段检查，原意理解由产品经理核对 | product.md / domain.md |
| EV02 模板结构 | 是否选对配方，必需槽位有无丢失或无依据新增？ | catalog 与生成计划对照；画面实际结构另检 | templates.md / Spec |
| EV03 组件语义 | 同名字段/动作是否误用？引用是否真实？ | 路径/导出检查 + 源码接口与实际交互 | components.md / 实现 |
| EV04 Token绑定 | 是否沿正确角色引用？有无源码漂移或未裁定品牌冲突？ | 语义→导出绑定及哈希；计算后样式、截图与一致性人工检查 | design.md / 共享样式 |
| EV05 原子交互 | 每次触发是否满足唯一首要断言？ | 执行 atomic-cases.json，保留状态/请求/录屏证据 | Spec / 实现 / domain |
| EV06 组合任务 | 小单元之间是否丢上下文、串版本或断主线？ | 原有 16 条组合用例与完整任务操作 | product.md / Spec |
| EV07 通用工艺 | 焦点、反馈、恢复、密度、长内容是否合格？ | 依 craft.md 实际键盘和两尺寸画面检查 | craft.md / 组件 |
| EV08 证据真实性 | 模拟是否冒充真实、缺证据是否报通过？ | 检查来源、环境、任务/版本和原始记录；评审者复现抽查 | 证据报告 / 数据来源 |

## 3. 可运行工具

在仓库根目录运行（Python 3.9+，仅标准库，不安装依赖）：

```bash
python3 -B docs/digital-employee-playbook/tools/design_evaluator.py route --plan docs/digital-employee-playbook/examples/save-plan.json
python3 -B docs/digital-employee-playbook/tools/design_evaluator.py check --plan docs/digital-employee-playbook/examples/save-plan.json
python3 -B docs/digital-employee-playbook/tools/design_evaluator.py check --plan docs/digital-employee-playbook/examples/save-plan.json --results docs/digital-employee-playbook/examples/save-results-not-run.json --output docs/digital-employee-playbook/examples/save-evaluation.json
python3 -B -m unittest discover -s docs/digital-employee-playbook/tools -p 'test_*.py' -v
```

第三条命令预期返回非零：示例原子用例没有执行证据，应明确未完成。只跑静态检查返回 0，只代表映射/计划检查通过，不代表 G1。提供结果清单时，仅当清单齐全、每个要求单元有观察和对应类型的非空证据文件，工具才返回 ready_for_human_review；它仍不判断文件内容是否真实支持结论。

23 个已执行工具测试覆盖匹配、缺字段、同词异域、多意图、歧义、错误模板、业务规则污染、缺槽位、无依据元素、错Token/组件、缺用例、对象缺失、禁止动作、导出不存在、源码漂移、伪造通过无证据和环境不一致等。它们测试的是 Evaluator，不是京小灵的 22 个交互单元。

## 4. 证据结果格式

```json
{
  "task_id": "JXL-TRAIN-01.save",
  "mode": "prototype",
  "units": [{
    "id": "AU-S01",
    "status": "not_run",
    "observed": "",
    "evidence": []
  }]
}
```

结果状态可为 passed/failed/blocked/not_run/not_applicable。通过时必须填实际 observed 和 evidence，证据项为 {"kind":"state_record","path":"evidence/实际文件.json"}，路径相对结果清单目录；不可指向目录外。evidence_kind 要与 atomic-cases.json 对应。截图不能替代请求记录，前端状态不能替代后台持久化。

本轮机器目录为严格试点：required_units 不能以 not_applicable 自动豁免。确需改变范围，先改 Spec、配方与用例版本，并记录决策；不能为了得分现场删用例。

## 5. 阶段闸门

- G0：意图、域、规则、模板、Token映射有效，未知条件明确，可做隔离原型。
- G1：所选原子单元通过 + 相关组合用例通过 + 工艺检查有证据 + 无 P0/P1。需要评审者签认；静态工具不输出此结论。
- G2：真实接口、权限、并发、资格和版本隔离通过，按团队流程进入上线评审。
- G3：另一需求复用同一套规则取得证据，才能评价范式可迁移。

完整 P/I/B 分层继承 06-evaluation.md。无证据记未执行，有环境障碍记阻塞，源码缺口记问题；品牌冲突未裁定时不宣称全站视觉一致性已通过。

## 6. 原子问题报告

```text
问题 ID / 阶段 / 环境 / 版本：
原意图和当前工作单元：
规则 P/DOM/R/CRAFT 与槽位/CMP/K-ID：
前置 / 触发 / 唯一首要断言：
实际观察 / 证据文件与时间点：
影响与严重程度：
归因层 product / domain / templates / components / design / craft / implementation：
最小修正 / 对另一单元的影响 / 回归用例：
```

先定位知识层再修复。业务规则错误退回规划；组件错误退回组件；局部排版错误退回工艺，不需要每次重生成整页。修复后执行原失败单元、邻接组合流程和一个负例；不得通过修改预期来掩盖实现缺陷。

## 7. 遵从性实验

对同一 Spec、同一模型与固定数据比较“整页一次生成”和“单元逐步生成”，记录原子断言通过率、首轮通过率、无来源元素数、跨域规则数、导师介入和修正轮次。两组保留相同组合用例，注明执行者与任务难度差异。当前尚未开展该实验，不能宣称已经提高多少遵从率。

## 8. 实现绑定校验与运行样例

`npm run design-io:bindings` 检查保存样例的真实导入路径及槽位内 JSX 引用，并区分 element、container、component_internal 的 Token 放置。组件内部校验仅为源码符号检查，不证明运行时分支或最终样式；计算样式和画面另行观察。

`npm run design-io:verify` 顺序执行绑定、定向类型、11 条代码测试与独立构建。它当前只覆盖 `runs/save-candidate/bindings.json` 与 `src/design-io`，不得将命令成功当成其他功能或 G1/G2 通过。新需求需要自身绑定、测试入口和运行证据。自然语言理解由助手完成，静态路由器只核对结构化结果。

## 逐任务验收入口（0.3）

`design-io:start` 从助手理解后的意图建立本任务清单；`design-io:review` 读取本任务 plan/results。上下文按模板 context_keys 检查，避免把 employeeId 强加给 Skill。缺少 required_units、未执行、失败、错误证据类型或不存在的证据文件均返回不完整。

工具仅验证证据清单，不验证描述真实性；ready_for_human_review 不是视觉通过或上线授权。新试跑以 scripts/test-skill-confirm-browser.mjs 检查实际浏览器行为，截图由观察者检查；运行环境使用 PLAYWRIGHT_MODULE 与可选 CHROME_EXECUTABLE，不把机器绝对路径固化进项目。
