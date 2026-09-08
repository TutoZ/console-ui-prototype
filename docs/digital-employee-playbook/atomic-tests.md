# 原子交互用例｜一次触发，一个首要断言

与 atomic-cases.json 一致的产品经理阅读版。22 条均未执行；23 条已运行的 Python 测试只验证映射与 Evaluator。

保留 acceptance-cases.json 的 16 条组合用例；本表是对关键交互的细拆，不替代组合、真实联调和用户任务验证。

| ID | 所属组合用例 / 规则 | 前置 | 触发 | 唯一首要断言 | 证据类型 |
|---|---|---|---|---|---|
| AU-S01 | TC01 / R01 | 在岗 V1 + V2 草稿 | 保存候选 | activeSnapshotId 保持 V1 | state_record |
| AU-S02 | TC01 / R01 | 在岗 V1 + V2 草稿 | 保存候选 | 生成唯一候选存档 ID | state_record |
| AU-S03 | TC02 / R13 | 草稿已输入 | 保存返回明确失败 | 草稿字段值不丢失 | recording |
| AU-S04 | TC02 / R13 | 明确失败 | 失败后查看恢复入口 | 重试入口可发现且可操作 | recording |
| AU-S05 | TC01 / R01 | 保存回执成功 | 保存成功后观察提示 | 文字明确尚未应用 | screenshot |
| AU-S06 | TC04 / R04 | V2 已通过 | 修改已测版本对应草稿 | 新草稿不能借用旧测试资格 | state_record |
| AU-T01 | TC03 / R02 | V2 已保存 | 启动 V2 测试 | 测试记录关联 V2 ID | state_record |
| AU-T02 | TC05 / R03 | 固定三项测试 | 获得一个不合格结果 | 整体结果为未通过 | state_record |
| AU-T03 | TC06 / R03 | 测试执行中 | 注入一项服务失败 | 整体不显示全部通过 | screenshot |
| AU-T04 | TC15 / R12 | 原型环境 | 展示模拟结果 | 演示数据标签持续可见 | screenshot |
| AU-T05 | TC04 / R02 | 既有 V2 测试记录 | 更改草稿 | 历史 V2 记录内容不被改写 | state_record |
| AU-A01 | TC07 / R06 | 合格 V2 | 打开应用确认 | 确认前可见影响范围 | screenshot |
| AU-A02 | TC07 / R06 | 确认弹窗已开 | 取消应用确认 | 不发起应用请求 | request_record |
| AU-A03 | TC08 / R08 | 请求已提交 | 等待无终态回执 | 进入结果未知而非成功 | state_record |
| AU-A04 | TC09 / R09 | 原请求未终结 | 重复确认提交 | 只有一个有效应用事件 | request_record |
| AU-A05 | TC10 / R09 | 当前已变 V3 | 基于过期 V1 提交 V2 | V3 不被覆盖 | state_record |
| AU-A06 | TC13 / R11 | 弹窗打开时有权限 | 撤权后提交 | 服务端拒绝应用 | request_record |
| AU-A07 | TC07 / R07 | 旧会话 A 使用 V1 | 成功应用后读取旧会话 | A 仍绑定 V1 | state_record |
| AU-A08 | TC07 / R07 | 当前已应用 V2 | 成功应用后启动新会话 | 新会话 B 绑定 V2 | state_record |
| AU-H01 | TC11 / R10 | 有未保存草稿 | 关闭历史预览 | 返回原草稿字段值 | state_record |
| AU-H02 | TC11 / R10 | V1 正在使用 | 请求删除当前存档 | V1 不被删除 | state_record |
| AU-K01 | TC16 / R13 | 键盘打开弹窗 | 关闭弹窗 | 焦点回到触发控件 | recording |

前端原型可用固定状态/模拟请求记录检查预期；服务端拒绝、幂等和会话版本等断言必须另有联调证据。每个单元独立复位数据，后续组合测试再验证状态连续性。
