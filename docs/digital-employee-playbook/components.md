# components.md｜仓库级组件：语义、接口与边界

版本 0.2。实际接口以源码为准。CMP-ID 是目录标识；K-ID 是语义绑定标识，均不是新建的 React 组件名或 CSS 变量。可用≠全部交互合格。

## 1. 组件注册与接口

| ID | 现有实现 / 关键接口 | 正确用途 | 不能假定的能力 |
|---|---|---|---|
| CMP-HEADER | PageHeader：title、description?、children?、actionsPlacement? | 列表/通用页标题与动作槽 | 不传臆造的 primaryAction 或 agentId props |
| CMP-WORKSPACE | OnboardingWorkspaceHeader：tabs、activeTabId、onTabChange、onBack、actions? | 员工培训工作区顶栏 | 不是员工数据提供者；需外部补充身份/版本上下文 |
| CMP-PRIMARY | 原生 button + BTN_INK | 当前主业务动作 | 样式常量不包含权限、disabled或幂等逻辑，需调用方设置 |
| CMP-SECONDARY | 原生 button + BTN_SOFT | 取消、返回等次动作 | 不自动恢复焦点、不自动取消后端任务 |
| CMP-FIELD | 原生 input/textarea + FIELD，LABEL；单行加 FIELD_CTRL | 明确标签的字段 | 常量不提供数据校验、错误关联和保存机制 |
| CMP-STATUS | 原生 span + badgeClass(tone) | 不可点击的当前状态 | 状态徽章不是筛选 Chip，也不是权限检查 |
| CMP-DIALOG | PanelModal：open、onClose、title、description?、children、footer? | 有明确影响说明的确认层 | 当前源中未见完整焦点圈定/恢复/Escape处理；必须补测/修复 |
| CMP-SPLIT | ResizableSplitPane：left、right、minLeftPx?、minRightPx?、storageKey? | 编辑/测试分栏 | 小视口、键盘拖动需验证，不当成已具备的能力 |
| CMP-VERSIONS | AgentVersionPanel：agent、knowledgeBases、skills、isDirty、lastSavedAt、previewSnapshotId 与 onPreview/onApplySnapshot/onDeleteSnapshot/onDiscardDraft | 当前存档界面的复用基础 | 当前操作与状态文案未满足新资格语义；需适配，不可原样承诺合格 |
| CMP-TEST | OnboardingCapabilityTestPanel：agent、knowledgeBases、skills、showToast，locked?/title? 等 | 现有能力测试对话容器 | 当前模拟回复不是同版本业务评分系统 |
| CMP-TABLE | 原生 table + TABLE 各字段 | 表头、数据列、行内操作 | 不自带排序/分页/空态或稳定 key |
| CMP-BUSY | ContentBusy，实际接口读取对应源码 | 局部忙碌与子内容切换 | 不自动决定操作完成，不可当任务进度来源 |

Catalog 只检查路径和导出、绑定是否合法；TypeScript 接口检查及浏览器交互另外执行。

## 2. 组装示例：精确到元素

```tsx
import { BTN_INK, FIELD, FIELD_CTRL, LABEL, badgeClass } from '@/lib/ui';
// candidateBusy/canSave/onSave 都来自本功能已定义的状态与权限，不由样式决定。
<label className={LABEL} htmlFor="training-name">培训名称</label>
<input id="training-name" className={`${FIELD} ${FIELD_CTRL}`} />
<button type="button" className={BTN_INK} disabled={!canSave || candidateBusy} onClick={onSave}>
  {candidateBusy ? '正在保存' : '保存培训'}
</button>
<span className={badgeClass('neutral')}>候选存档，尚未应用</span>
```

这是样式与语义片段，不是完整可运行组件；字段值、错误关联、状态/事件和键盘焦点需按 Spec 实现。不得把 onSave 绑定为“保存后自动应用”。

## 3. 状态契约

每个交互组件实例记录：初始、可用、禁用及原因、忙碌、成功、错误、结果未知、只读、焦点。按功能说明不适用项；组件基础包不提供的状态由业务容器组合，不能仅换颜色代替数据行为。

使用按钮常量时显式提供 type、disabled、aria-busy（适用时）、事件和可见焦点。含图标但无文字的操作提供可访问名称。弹窗在提交中如何关闭按 Spec 明确；关闭界面不代表取消请求。

## 4. 语义易混项

- Badge 表达状态；Chip 表达可选条件；岗位/资源标签表达分类，不都叫“状态”。
- 保存固化候选；应用改变运行配置。即使共用 BTN_INK，必须分别绑定规则和事件。
- 查看历史与应用历史不同；组件暴露回调不等于本任务可调用。
- 测试对话容器与测试结果证据表不同；缺逐项断言和版本关联需新组合模式。
- 加载骨架与真实空态不同；进度日志只呈现实际事件或明确演示数据。

## 5. 组件缺口台账

| 缺口 | 发现 | 处置与验收 |
|---|---|---|
| GAP-DIALOG-01 | PanelModal 有 role/aria-modal，但未见完整焦点管理 | 由共享组件负责人处理；AU-K01 及键盘完整流程实测 |
| GAP-TEST-01 | 测试容器使用 mockAgentChatReply | 原型补固定检查点；真实接口/证据留联调，不改标签冒充真实 |
| GAP-VERSION-01 | 版本组件含旧 running/expired 表述和默认操作 | 对齐候选/当前/有效资格；限制只读模板暴露动作 |
| GAP-FOCUS-01 | 按钮共享常量 outline-none | 验证实际 focus-visible；缺失则共享层补充 |

新增组件必须写：现有组件为什么不足、最小新增接口、必需状态、Token引用、至少一个正例和负例、原子用例。业务规则留在 domain/Spec，不能塞进全局组件供所有域误用。

## Skill 确认组件接入

CMP-SKILL-CONFIRM：src/components/skills/SkillRoundConfirmCard.tsx，导出 SkillRoundConfirmCard。

必需 items、onConfirm；可选 title、confirmed、locked、collapsed。items 为 id / label / checked，可用 fieldKey、fieldLabel、value；不要把员工字段名直接作为 Skill fieldKey。locked 用于过期轮次；confirmed 表达已确认。父级仍应拒绝过期或重复回调，不能只依靠按钮视觉状态。

内部样式来自 lib/ui.ts 的 SKILL_AOP_PRIMARY_BTN_SM、confirmStatusBadgeClass、FIELD 等。K-SKILL-CONFIRM 表达内部绑定，不向组件臆造 className 或 token props。外部容器和内容字段单独映射。键盘焦点和嵌套操作仍需运行检查。
