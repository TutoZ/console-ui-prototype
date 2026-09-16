# 京小灵 UI 宪法（任何 AI 必读）

你正在把页面做成 **JoySupport / 京小灵** 现网风格。这不是「好看一点的后台」，是固定设计系统。

**基调**：白底、中性灰、墨黑主操作。克制、紧凑、高信息密度。彩色只表示状态。

实现时优先 `import` `@joysupport/ui`（或本仓库 `@/lib/ui` + `common/`），禁止手写一套平行组件。

```tsx
import {
  BTN_INK, BTN_SOFT, BTN_OUTLINE, BTN_DANGER,
  BTN_INK_SM, BTN_SOFT_SM, BTN_OUTLINE_SM, BTN_DANGER_SM,
  BTN_AI, BTN_AI_TEXT, SKILL_AOP_PRIMARY_BTN, SKILL_AOP_PRIMARY_BTN_SM,
  FIELD, LABEL, SEARCH_FIELD, SELECT_TRIGGER, CHIP, CHIP_ACTIVE,
  CARD, CARD_HOVER, PANEL, PAGE, cn, badgeClass, confirmStatusBadgeClass,
  Modal, PageHeader, ONLINE_PAGE, OnlinePageHeader, OnlineSectionHeader,
  OnlineEmptyRow, onlineTableClass, SegmentedTabBar, ListPagination,
  ContentBusy, MatrixLoader,
} from '@joysupport/ui';
import '@joysupport/ui/styles.css';
```

Tailwind v4 需扫描包：`@source "../node_modules/@joysupport/ui/dist";`

展台（核对视觉）：基础 `?ds=1` · AI 对话过程 `?ds=ai`  
https://dist-livid-eight-15.vercel.app/?ds=1

---

## 硬约束（违反即不合格）

1. **管理页主按钮必须墨黑** `BTN_INK`。禁止 `bg-blue-*` / `bg-indigo-*` / `bg-primary` 蓝紫作为列表/弹窗主 CTA。
2. **禁止蓝色 focus ring**。输入聚焦：`focus:border-neutral-300`（`FIELD` 自带），不要 `ring-blue-500`。
3. **禁止 `slate-*` / `indigo-*` / `violet-*` 当中性色或主色**。中性只用 `neutral-*`。
4. **禁止业务页裸 Hex**（`bg-[#...]`）。颜色走常量 / `badgeClass` / `FUNCTIONAL_COLORS`；token 源码内已封装的功能色除外。
5. **加载禁止 `animate-spin` 圆环**。用 `MatrixLoader`；区块用 `ContentBusy`。
6. **控件高度 32px**（`h-8`）。不要 `h-10` / `h-12` 的大按钮。对话卡内用 `BTN_*_SM`（h-6）。
7. **圆角**：按钮/输入 **7px**（`rounded-[7px]`）；卡片/弹窗/表容器 **13px**（`rounded-[13px]`）。不要 `rounded-3xl` 大胶囊卡。
8. **表单不要再套一层大卡片**。弹窗内：`LABEL` + `FIELD`，字段 `space-y-4`。
9. **列表页不要再叠一个巨大 PageHeader**。用 `ONLINE_PAGE` + `OnlinePageHeader`（左标题 + 右搜索/新建）+ 扁平表；**表上方不要再加区块头**；表不要再包 `CARD`。
10. **一页一个主 CTA**。取消用 `BTN_SOFT` 或 `BTN_OUTLINE`；删除用 `BTN_DANGER`。
11. **蓝的两种合法用途（勿混用）**：
    - `badgeClass('live')` / Chip 选中 / Info 功能色 → **#376BFA**（标签与筛选态）
    - 顶栏激活 / 发送钮 / 技能创作中间态 → **黑→#1565BF 渐变**（`NAV_ACTIVE_*` / `SKILL_AOP_*` / `BTN_AI`）
    - `text-live`（约 `#1E90FF`）只用于在线点、选中底条等信号，**不当主按钮、不当大面积品牌色**
12. **分页**用 `ListPagination`（共 N 条 · 上一页 · 当前/总页 · 下一页），不要 `1 2 3 4` 页码条。
13. **AI 渐变主色不得用于普通管理 CRUD**。`BTN_AI` / `SKILL_AOP_PRIMARY_BTN*` 仅用于：首页创作发送、技能/知识创作中间态、确认执行等 Agent Builder 场景。

---

## Token 速记

| 用途 | 写法 | 约值 |
|------|------|------|
| 画布 | `ONLINE_PAGE` / `PAGE` → `bg-white p-5` | 白，内边距 20 |
| 描边 | `border-neutral-200` | `#E5E5E5` |
| 主文 | `text-neutral-800` / 标题 `text-neutral-900` | |
| Label | `LABEL` → `text-neutral-500 mb-1` | 12px，距输入 4px |
| 主按钮 | `BTN_INK` | 墨黑底白字，h-8 |
| 次按钮 | `BTN_SOFT` | 浅灰 |
| 描边按钮 | `BTN_OUTLINE` | 白底灰边 |
| 危险 | `BTN_DANGER` | 白底红字红边 |
| 卡内小号 | `BTN_*_SM` | h-6 / 11px |
| 输入 | `FIELD`（已含 h-8）；旧写法 `cn(FIELD, FIELD_CTRL)` 仍可用 | focus:neutral-300 |
| 搜索 | `SEARCH_FIELD`；可叠 `pl-9` 放图标 | |
| 下拉触发 | `SELECT_TRIGGER` | h-8 / 7px |
| 筛选 Chip | `CHIP` / 选中 `CHIP_ACTIVE` | 无描边圆角药片 |
| 卡片 | `CARD`；可交互加 `CARD_HOVER` | 13px 圆角 |
| 静态表/面板 | `PANEL` | 无悬停抬起 |
| 成功标 | `badgeClass('success')` | 绿 #00B26F |
| 警告标 | `badgeClass('warning')` | 橙 #F08433 |
| 危险标 | `badgeClass('danger')` | 红 #F33B50 |
| 信息/解析中 | `badgeClass('live')` | Info #376BFA |
| 普通标 | `badgeClass('neutral')` | 灰 |
| 确认态角标 | `confirmStatusBadgeClass('confirmed'\|'pending')` | 确认流专用 |
| AI 发送/主 CTA | `BTN_AI` / `BTN_AI_TEXT` / `SKILL_AOP_PRIMARY_BTN(_SM)` | 黑→蓝渐变 |

字号：页标题 `text-lg font-semibold`；区块 `text-sm font-semibold`；正文 `text-xs`～`text-[13px]`；辅助 `text-[11px] text-neutral-500`；徽章 `text-[10px]`。

动效默认 **200ms**。卡片悬停轻上移用 `CARD_HOVER`，不要大阴影、渐变背景、玻璃拟态。

---

## 选组件（按页面类型）

| 你要做的页 | 用这些 | 不要 |
|------------|--------|------|
| 管理列表（知识库/技能/记录） | `ONLINE_PAGE` + `OnlinePageHeader` + 扁平 `<table>` + `onlineTableClass` + `ListPagination` + `OnlineEmptyRow` | 整表套 CARD；再放 PageHeader；表上再叠 OnlineSectionHeader |
| 带筛选的列表 | 同上 + 筛选区（搜索/`SELECT_TRIGGER`/`CHIP` + 查询 `BTN_INK`）；筛选区可用 `OnlineSectionHeader` | 整条筛选塞进圆角 CARD |
| 弹窗新建/编辑 | `Modal` + 内 `space-y-4` 的 LABEL/FIELD；底 `BTN_SOFT` 取消 + `BTN_INK` 确定 | 自定义遮罩；表单再套卡 |
| 非列表说明/Dashboard | `PageHeader` + 内容网格 `gap-4` | 蓝统计卡、大圆角营销风 |
| 同页 2～5 个同级视图 | `SegmentedTabBar` | 和下划线顶栏抢同一层级 |
| 页内双 Tab（如我的技能/市场） | 墨黑字 + 墨黑底条（见展台 `#tpl-dual-tabs`） | 顶栏渐变胶囊指示条 |
| 顶栏二级菜单 | `navSecondaryTabClass` + 渐变底条 | 实色蓝字当激活 |
| 加载 | `ContentBusy` / `MatrixLoader` | 灰色脉冲块代替点阵 |
| Agent Builder / 技能创作 | 产品内 `GoalComposer*`、`SkillThinkingCard`、`SkillClarifyCard`、`SkillRoundConfirmCard`；样式用 `SKILL_AOP_*` / `BTN_AI` / `BTN_*_SM` | 把 shadcn Chat 皮肤直接当成品；管理页滥用渐变钮 |

> 对话过程组件（Sender / Think / 确认卡）在京小灵产品仓库内，**不在** `@joysupport/ui` 包导出。跨项目改写时：壳与 Token 用本包；对话卡按 `STYLE-TRANSFER.md` 的 AI 配方仿写。

---

## 改写外来页面时

先读同目录 `STYLE-TRANSFER.md` 与 `examples/*`。流程：识别布局类型 → 换壳（ONLINE_PAGE/列表/弹窗/AI 创作）→ 换原子（按钮/输入/徽章/Chip）→ 删装饰（蓝主按钮、渐变背景、大圆角、双层卡片）→ 对照 `examples/*.after.tsx` 自检。
