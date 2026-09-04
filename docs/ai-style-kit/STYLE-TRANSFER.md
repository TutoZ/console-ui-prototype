# 外来页面 → 京小灵：改写手册

配合 `AGENTS.md` 与 `examples/` 使用。目标是**组件级对齐**，不是「看起来灰一点」。

---

## 五步流程

1. **定类型**：列表 CRUD / 弹窗表单 / 卡片网格 / Dashboard / 设置表单。只选一个主配方。
2. **换壳**：列表 → `PAGE` + `OnlinePageHeader`；弹窗 → `Modal`；说明页 → `PageHeader`。
3. **换原子**：所有 Button/Input/Tag/Tabs 映射到下表，不要留 shadcn/antd 默认 class。
4. **删装饰**：蓝主色、渐变、大圆角、双层卡片、大阴影、spin、蓝 ring。
5. **对照** `examples/*.after.tsx` + 文末清单。

---

## 外来栈 → 京小灵

### 按钮

| 外来 | 京小灵 |
|------|--------|
| shadcn `Button` / `variant="default"` 蓝 | `BTN_INK` |
| `variant="secondary"` / `ghost` | `BTN_SOFT` |
| `variant="outline"` | `BTN_OUTLINE` |
| `variant="destructive"` 红底 | `BTN_DANGER`（白底红字，不是红底） |
| Ant `type="primary"` 蓝 | `BTN_INK` |
| `size="large"` | 丢掉，固定 `h-8` |

### 表单

| 外来 | 京小灵 |
|------|--------|
| shadcn `Input` / antd `Input` | `cn(FIELD, FIELD_CTRL)` |
| `Textarea` | `cn(FIELD, 'min-h-[80px] py-2')` 不要 `FIELD_CTRL` |
| `Label` | `LABEL` |
| `Select` 触发器 | `SELECT_TRIGGER` 或同等 h-8 + 7px 圆角 |
| Form 外包 Card | **删掉外卡** |
| `focus-visible:ring-ring` 蓝圈 | 删；靠 `FIELD` 自带 `focus:border-neutral-400` |

### 结构

| 外来 | 京小灵 |
|------|--------|
| `Card` 包住整张表格 | 去掉；表直接放，容器最多 `PANEL` 且列表页通常不要 |
| 页顶大标题 + 描述 + 再工具栏 | 列表改 `OnlinePageHeader`（标题与工具同一行） |
| shadcn `Tabs` 下划线/胶囊混用 | 页内同级：`SegmentedTabBar`；不要再造一套 |
| `Dialog` / antd `Modal` | `Modal`（`open` `onClose` `title` `footer`） |
| `Pagination` 页码 | `ListPagination` |
| `Spinner` / `Loader2` | `MatrixLoader`；包一层内容用 `ContentBusy` |
| `Badge variant="default"` 蓝 | `badgeClass('neutral'|…)` 按语义 |
| `Skeleton` 灰条 | 优先 `ContentBusy`；不要用脉冲块代替点阵 |

### 颜色（看 class 就换）

| 外来 | 换成 |
|------|------|
| `bg-blue-600` `bg-primary` `bg-indigo-600` | `BTN_INK` / `bg-neutral-800` |
| `bg-slate-50` `bg-slate-100` | `bg-neutral-50` / `bg-neutral-100` |
| `text-slate-*` | `text-neutral-*` |
| `bg-background` 若是 shadcn 深色/锌色 | `bg-white`（`PAGE`） |
| `rounded-2xl` `rounded-3xl` 卡片 | `rounded-[13px]`（`CARD`/`PANEL`） |
| `rounded-md` 按钮若视觉偏方 | `rounded-[7px]` |
| `shadow-xl` `shadow-2xl` | 弹窗用 `MODAL_PANEL`；卡片用 `CARD` 自带轻阴影 |

`text-live` / `#1E90FF` 只用于：顶栏选中、在线点、AI 自动、实时指标。不要拿来做主按钮或大色块。

---

## 配方（改完应长这样）

### 列表 CRUD

```
PAGE
  OnlinePageHeader 标题 | 搜索框 SEARCH_FIELD + BTN_INK 新建
  OnlineSectionHeader 小标题 + 一句说明
  <table className={onlineTableClass.table}> … OnlineEmptyRow
  超过 10 条 → ListPagination
Modal 新建/编辑
```

### 弹窗表单

```
Modal title footer={BTN_SOFT 取消 + BTN_INK 确定}
  <div className="space-y-4">
    LABEL + input FIELD+FIELD_CTRL
  </div>
```

### 卡片网格（员工/市场）

```
PAGE
  顶栏工具
  grid gap-4 md:grid-cols-2 lg:grid-cols-3
    每张 CARD + CARD_HOVER，圆角 13px，不要营销大阴影
```

---

## 改完自检

- [ ] 主 CTA 是墨黑 `BTN_INK`，全页没有蓝/紫主按钮
- [ ] 输入聚焦没有蓝光圈
- [ ] 无 `animate-spin`、无 `slate-`、无裸 Hex
- [ ] 按钮 h-8 / 圆角 7px；卡和弹窗 13px
- [ ] 列表：标题与搜索同一行；表扁平；未再套 CARD
- [ ] 弹窗表单：未套 CARD；取消+确定在右下
- [ ] 状态用 `badgeClass`，加载用 `MatrixLoader`
- [ ] import 来自 `@joysupport/ui`（或仓库内 `@/lib/ui` + common）
