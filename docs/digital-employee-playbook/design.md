# design.md｜品牌级知识与 Token 绑定入口

版本 0.2。此文件位于工作包子目录；不是根目录 DESIGN.md 的大小写重命名。根文档仍保留，本文件登记实际映射和冲突，避免产生两个悄悄竞争的品牌标准。

## 1. 视觉意图与语义角色

专业、清晰、紧凑；主任务操作突出，语义色表达状态，AI强调样式仅用于确有 AI 生成/辅助语义的动作。业务“通过/等待/失败”的含义由 domain.md 决定，品牌层只决定如何表达。

## 2. 当前源码快照与冲突

本次读取的 lib/ui.ts：PAGE 白底；CARD/PANEL 13px 圆角；按钮/输入 7px；主按钮 neutral-800；功能色使用 FUNCTIONAL_COLORS/badgeTones；src/index.css 当前 font-sans 为 Inter Variable。根 DESIGN.md 仍写暖灰、Geist 及另一组圆角。以上是冲突事实，不是本次擅自批准品牌改版。

新增业务页先复用实际共享常量与组件，不复制冲突数值，也不在本包重新发明 CSS 变量。设计师决定是否统一根文档和运行源码后，应重新生成来源哈希及 Token映射。视觉一致性结论在冲突未裁定前标为待确认。

## 3. 语义绑定表

以下 K-ID 是知识映射 ID，不是已经创建的 CSS Token。实际样式由后面的现有导出承载；禁止直接写 `var(--K-PAGE)`。

| 映射 ID | 语义 | 实际引用 | 用法 |
|---|---|---|---|
| K-PAGE | 页面画布、密度、正文基线 | lib/ui.ts：PAGE | 外壳一次使用，不嵌套重复页边距 |
| K-PANEL | 静态内容容器 | PANEL | 存档/结果/表格容器，不添加卡片 hover 上浮 |
| K-PRIMARY | 主要业务动作 | BTN_INK | 保存/确认应用；不是有 AI 的页面都用渐变 |
| K-SECONDARY | 次操作 | BTN_SOFT | 取消、返回；不与主操作竞争 |
| K-FIELD | 文本输入 | FIELD + FIELD_CTRL | 单行组合，多行不加 FIELD_CTRL |
| K-LABEL | 输入标签 | LABEL | 必需信息不能只用 placeholder |
| K-STATUS | 状态徽章 | badgeClass(tone) | tone 由明确语义映射决定，同时显示文字 |
| K-TABLE | 表格节奏 | TABLE | 复用 th/td 等完整结构，不把对象直接当 className |
| K-DIALOG | 确认层 | MODAL_OVERLAY + MODAL_PANEL | 通过现有 Modal/PanelModal 使用，避免重复遮罩 |
| K-AI | AI辅助操作 | BTN_AI_TEXT | 有生成语义时才采用，不替换保存/发布 |

catalog.json 对每个 K-ID 记录 source/symbols；可运行检查确保导出存在。样式组合与计算后视觉需要浏览器验证，导出存在不代表对比度和交互已通过。

## 4. 状态语义映射

成功/合格→success；等待处理/证据失效→warning；失败→danger；处理中→live；中性或未测试→neutral。使用 badgeClass 而非业务页复制色值。失效和未通过必须有各自文字，不因同色合并为一个状态。

涉及原型模拟结果，持续显示“演示数据”，不能因使用 success 色使其看起来已获得生产资格。

## 5. 缺口处理

GAP-BRAND-01：根规范与共享实现不一致，owner=设计师；不修改旧源码来适配本文。
GAP-FOCUS-01：部分按钮常量去掉 outline，复用并不能保证键盘可见焦点；需实测后在共享层修复，业务页不能假报通过。
缺少令牌时登记：语义角色、场景、现有候选、为什么不能复用、影响范围、建议值与负责人。未批准前使用明确标注的原型占位，禁止把新值写成品牌事实。
