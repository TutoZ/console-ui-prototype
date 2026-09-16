# 外来页面 → 京小灵：改写手册

配合 `AGENTS.md` 与 `examples/` 使用。目标是**组件级对齐**，不是「看起来灰一点」。

展台对照：基础 `/?ds=1` · AI `/?ds=ai`（https://dist-livid-eight-15.vercel.app）

---

## 五步流程

1. **定类型**：列表 CRUD / 筛选列表 / 弹窗表单 / 卡片网格 / Dashboard / Agent Builder 对话。只选一个主配方。
2. **换壳**：列表 → `ONLINE_PAGE` + `OnlinePageHeader`；弹窗 → `Modal`；说明页 → `PageHeader`；创作流 → 对话列 + Sender。
3. **换原子**：所有 Button/Input/Tag/Tabs/Chip 映射到下表，不要留 shadcn/antd 默认 class。
4. **删装饰**：蓝主色（管理页）、渐变背景、大圆角、双层卡片、大阴影、spin、蓝 ring。
5. **对照** `examples/*.after.tsx` + 文末清单。

---

## 外来栈 → 京小灵

### 按钮

| 外来 | 京小灵 |
|------|--------|
| shadcn `Button` / `variant="default"` 蓝 | 管理页 → `BTN_INK`；创作发送 → `BTN_AI` |
| `variant="secondary"` / `ghost` | `BTN_SOFT` |
| `variant="outline"` | `BTN_OUTLINE` |
| `variant="destructive"` 红底 | `BTN_DANGER`（白底红字，不是红底） |
| Ant `type="primary"` 蓝 | `BTN_INK`（管理）或 `SKILL_AOP_PRIMARY_BTN`（创作确认） |
| `size="large"` / `h-10` `h-12` | 丢掉，固定 `h-8`；卡内用 `BTN_*_SM` |
| 对话卡「确认执行」 | `SKILL_AOP_PRIMARY_BTN_SM` |
| 对话卡「批量编辑 / 跳过」 | `BTN_SOFT_SM` / `BTN_SOFT` |
| 对话卡「删除」 | `BTN_DANGER_SM` |

### 表单

| 外来 | 京小灵 |
|------|--------|
| shadcn `Input` / antd `Input` | `FIELD`（已含 h-8）；兼容 `cn(FIELD, FIELD_CTRL)` |
| `Textarea` | `cn(FIELD, 'min-h-[80px] py-2')` 不要叠高度 class |
| `Label` | `LABEL` |
| `Select` 触发器 | `SELECT_TRIGGER` |
| 页头搜索 | `SEARCH_FIELD` + 可选左侧 Search 图标 `pl-9` |
| Form 外包 Card | **删掉外卡** |
| `focus-visible:ring-ring` 蓝圈 | 删；靠 `FIELD` 自带 `focus:border-neutral-300` |

### 结构

| 外来 | 京小灵 |
|------|--------|
| `Card` 包住整张表格 | 去掉；表直接放 `onlineTableClass` |
| 页顶大标题 + 描述 + 再工具栏 | 列表改 `OnlinePageHeader`（标题与工具同一行） |
| 表上方再套「全部 xxx」区块头 | **列表 CRUD 删掉**；筛选列表才用 `OnlineSectionHeader` |
| shadcn `Tabs` 下划线/胶囊混用 | 页内少量：`SegmentedTabBar`；技能双 Tab：墨黑底条 |
| 顶栏菜单激活蓝字 | `navSecondaryTabClass` + 渐变胶囊指示条 |
| `Dialog` / antd `Modal` | `Modal`（`open` `onClose` `title` `footer`） |
| `Pagination` 页码 | `ListPagination` |
| `Spinner` / `Loader2` | `MatrixLoader`；包一层内容用 `ContentBusy` |
| `Badge variant="default"` 蓝 | `badgeClass('neutral'|…)`；解析中用 `'live'`（Info 蓝） |
| Filter pill / 时间快捷 | `CHIP` / 选中 `CHIP_ACTIVE`（无描边） |
| `Skeleton` 灰条 | 优先 `ContentBusy`；不要用脉冲块代替点阵 |
| ChatGPT 式蓝发送钮 | `BTN_AI`（36×36 渐变）或 `BTN_AI_TEXT` |

### 颜色（看 class 就换）

| 外来 | 换成 |
|------|------|
| `bg-blue-600` `bg-primary` `bg-indigo-600`（管理 CTA） | `BTN_INK` / `bg-neutral-800` |
| 创作/发送蓝按钮 | `BTN_AI` / `SKILL_AOP_PRIMARY_BTN` |
| `bg-slate-50` `bg-slate-100` | `bg-neutral-50` / `bg-neutral-100` |
| `text-slate-*` | `text-neutral-*` |
| `bg-background` 若是 shadcn 深色/锌色 | `bg-white`（`ONLINE_PAGE`） |
| `rounded-2xl` `rounded-3xl` 卡片 | `rounded-[13px]`（`CARD`/`PANEL`/`MODAL_PANEL`） |
| `rounded-md` 按钮若视觉偏方 | `rounded-[7px]` |
| `shadow-xl` `shadow-2xl` | 弹窗用 `MODAL_PANEL`；卡片用 `CARD` 自带轻阴影 |
| `bg-blue-100 text-blue-700` 状态标 | `badgeClass('live')` 等 |

---

## 配方（改完应长这样）

### 列表 CRUD（对齐「员工知识」）

```
ONLINE_PAGE
  OnlinePageHeader 标题 | SEARCH_FIELD(+图标) + BTN_INK 新建
  <table className={onlineTableClass.table}> … OnlineEmptyRow
  超过 LIST_PAGE_SIZE → ListPagination
Modal 新建/编辑（BTN_INK 确定）
```

不要：巨大 PageHeader、表外包 CARD、表上 OnlineSectionHeader。

### 筛选列表（对齐「接待记录」）

```
ONLINE_PAGE
  OnlinePageHeader 标题 | 重置 BTN_SOFT + 查询 BTN_INK
  筛选区：SELECT_TRIGGER / FIELD / CHIP…（不要包 CARD）
  OnlineSectionHeader 列表标题 + 共 N 条
  扁平表 + ListPagination
```

### 弹窗表单

```
Modal title footer={BTN_SOFT 取消 + BTN_INK 确定}
  <div className="space-y-4">
    LABEL + input FIELD
  </div>
```

### 卡片网格（员工/市场）

```
ONLINE_PAGE / PAGE
  顶栏工具
  grid gap-4 md:grid-cols-2 lg:grid-cols-3
    每张 CARD + CARD_HOVER，圆角 13px，不要营销大阴影
```

### Agent Builder / 技能创作（对齐 `?ds=ai`）

```
左：对话列
  用户气泡 / AI 气泡（正文约 14px/#595959）
  SkillThinkingCard 思考过程（outline|executing|…）
  SkillClarifyCard 补充信息 → 提交用 SKILL_AOP_PRIMARY_BTN，跳过 BTN_SOFT
  SkillRoundConfirmCard 确认 → 确认执行 SKILL_AOP_PRIMARY_BTN_SM；编辑 BTN_SOFT_SM；删除 BTN_DANGER_SM
  底栏 Sender：GoalComposer 类 + BTN_AI 发送
右：可选工作区 / 预览
```

跨仓库无包时：用 Token 仿写上述结构；不要把管理页 `BTN_INK` 换成渐变，也不要把创作页主发送改成墨黑方钮除非产品明确要求。

---

## 改完自检

- [ ] 管理 CRUD 主 CTA 是墨黑 `BTN_INK`，全页没有蓝/紫主按钮
- [ ] AI 创作发送/确认才用 `BTN_AI` / `SKILL_AOP_*`
- [ ] 输入聚焦没有蓝光圈（应为 neutral-300 边）
- [ ] 无 `animate-spin`、无 `slate-` 当中性、无业务裸 Hex
- [ ] 按钮 h-8 / 圆角 7px（卡内 SM 为 h-6）；卡和弹窗 13px
- [ ] 列表：标题与搜索同一行；表扁平；未再套 CARD；未多余区块头
- [ ] 弹窗表单：未套 CARD；取消+确定在右下
- [ ] 状态用 `badgeClass`，筛选用 `CHIP`，加载用 `MatrixLoader`
- [ ] import 来自 `@joysupport/ui`（或仓库内 `@/lib/ui` + common）
