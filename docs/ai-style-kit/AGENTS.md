# 京小灵 UI 宪法（任何 AI 必读）

你正在把页面做成 **JoySupport / 京小灵** 现网风格。这不是「好看一点的后台」，是固定设计系统。

**基调**：白底、中性灰、墨黑主操作。克制、紧凑、高信息密度。彩色只表示状态。

实现时优先 `import` `@joysupport/ui`（或本仓库 `@/lib/ui` + `common/`），禁止手写一套平行组件。

```tsx
import {
  BTN_INK, BTN_SOFT, BTN_OUTLINE, BTN_DANGER,
  FIELD, FIELD_CTRL, LABEL, SEARCH_FIELD, CARD, PANEL, PAGE, cn, badgeClass,
  Modal, PageHeader, OnlinePageHeader, OnlineSectionHeader, OnlineEmptyRow,
  onlineTableClass, SegmentedTabBar, ListPagination, ContentBusy, MatrixLoader,
} from '@joysupport/ui';
import '@joysupport/ui/styles.css';
```

Tailwind v4 需扫描包：`@source "../node_modules/@joysupport/ui/dist";`

---

## 硬约束（违反即不合格）

1. **主按钮必须墨黑** `BTN_INK`。禁止 `bg-blue-*` / `bg-indigo-*` / `bg-primary` 蓝紫作为主 CTA。
2. **禁止蓝色 focus ring**。输入聚焦：`focus:border-neutral-400`，不要 `ring-blue-500`。
3. **禁止 `slate-*` / `indigo-*` / `violet-*` 当中性色或主色**。中性只用 `neutral-*`。
4. **禁止裸 Hex**（`bg-[#...]`）。颜色走常量或 Tailwind token。
5. **加载禁止 `animate-spin` 圆环**。用 `MatrixLoader`；区块用 `ContentBusy`。
6. **控件高度 32px**（`h-8`）。不要 `h-10` / `h-12` 的大按钮。
7. **圆角**：按钮/输入 **7px**（`rounded-[7px]`）；卡片/弹窗/表容器 **13px**（`rounded-[13px]`）。不要 `rounded-3xl` 大胶囊卡。
8. **表单不要再套一层大卡片**。弹窗内：`LABEL` + `FIELD`，字段 `space-y-4`。
9. **列表页不要再叠一个巨大 PageHeader**。用 `OnlinePageHeader`（左标题 + 右搜索/新建）+ 扁平表，表不要再包 `CARD`。
10. **一页一个主 CTA**。取消用 `BTN_SOFT` 或 `BTN_OUTLINE`；删除用 `BTN_DANGER`。
11. **实时蓝 `#1E90FF`（`text-live` / `bg-live`）只用于**：在线/AI/选中底条。不当主按钮、不当大面积品牌色。
12. **分页**用 `ListPagination`（共 N 条 · 上一页 · 当前/总页 · 下一页），不要 `1 2 3 4` 页码条。

---

## Token 速记

| 用途 | 写法 | 约值 |
|------|------|------|
| 画布 | `PAGE` → `bg-white p-5` | 白，内边距 20 |
| 描边 | `border-neutral-200` | `#E5E5E5` |
| 主文 | `text-neutral-800` / 标题 `text-neutral-900` | |
| Label | `LABEL` → `text-neutral-500 mb-1` | 12px，距输入 4px |
| 主按钮 | `BTN_INK` | 墨黑底白字，h-8 |
| 次按钮 | `BTN_SOFT` | 浅灰 |
| 描边按钮 | `BTN_OUTLINE` | 白底灰边 |
| 危险 | `BTN_DANGER` | 白底红字红边 |
| 输入 | `cn(FIELD, FIELD_CTRL)`；多行只用 `FIELD` | |
| 卡片 | `CARD`；可交互加 `CARD_HOVER` | 13px 圆角 |
| 静态表/面板 | `PANEL` | 无悬停抬起 |
| 成功标 | `badgeClass('success')` | 绿 |
| 警告标 | `badgeClass('warning')` | 黄 |
| 危险标 | `badgeClass('danger')` | 红 |
| 信息/解析中 | `badgeClass('live')` | 蓝（仅标签） |
| 普通标 | `badgeClass('neutral')` | 灰 |

字号：页标题 `text-lg`/`text-xl font-semibold`；区块 `text-sm font-semibold`；正文 `text-xs`～`text-[13px]`；辅助 `text-[11px] text-neutral-500`；徽章 `text-[10px]`。

动效默认 **200ms**。卡片悬停轻上移用 `CARD_HOVER`，不要大阴影、渐变、玻璃拟态。

---

## 选组件（按页面类型）

| 你要做的页 | 用这些 | 不要 |
|------------|--------|------|
| 管理列表（知识库/技能/记录） | `PAGE` + `OnlinePageHeader` + `OnlineSectionHeader` + 扁平 `<table>` + `onlineTableClass` + `ListPagination` + `OnlineEmptyRow` | 整表套 CARD；再放 PageHeader |
| 弹窗新建/编辑 | `Modal` + 内 `space-y-4` 的 LABEL/FIELD；底 `BTN_SOFT` 取消 + `BTN_INK` 确定 | 自定义遮罩；表单再套卡 |
| 非列表说明/Dashboard | `PageHeader` + 内容网格 `gap-4` | 蓝统计卡、大圆角营销风 |
| 同页 2～5 个同级视图 | `SegmentedTabBar` | 和下划线顶栏抢同一层级 |
| 加载 | `ContentBusy` / `MatrixLoader` | 灰色脉冲块代替点阵 |

---

## 改写外来页面时

先读同目录 `STYLE-TRANSFER.md` 与 `examples/*`。流程：识别布局类型 → 换壳（PAGE/列表/弹窗）→ 换原子（按钮/输入/徽章）→ 删装饰（蓝、渐变、大圆角、双层卡片）→ 对照 `examples/*.after.tsx` 自检。
