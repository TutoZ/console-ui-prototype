# JoySupport（京小灵）组件库完整说明

> 给**不熟悉英文组件名**的同学看的完整文档。  
> 每个条目都按：**中文叫什么 → 英文代码名是什么意思 → 长什么样 / 干什么用 → 什么时候用 → 怎么写 → 别踩坑**。

| 资源 | 地址 |
|------|------|
| 交互展台（可点、可试） | https://dist-livid-eight-15.vercel.app/?ds=1 |
| 本地展台 | `http://127.0.0.1:5190/?ds=1` |
| **给其他 AI 的风格转化包** | [`ai-style-kit/`](./ai-style-kit/README.md) |
| 样式常量源码 | [`lib/ui.ts`](../lib/ui.ts) |
| 共享组件目录 | [`src/components/common/`](../src/components/common/) |
| 可安装包 | [`@joysupport/ui`](../packages/joysupport-ui/README.md) |
| 产品设计规范 | [`DESIGN.md`](../DESIGN.md) |

**裁定顺序**：`lib/ui.ts` → `common/*` 共享组件 → 业务页。冲突时以展台与源码为准。

---

## 阅读约定

| 你看到的英文 | 白话意思 |
|--------------|----------|
| Token | 设计令牌：颜色、字号、圆角等「全局尺子」 |
| Atom | 原子：按钮、输入框这类最小控件 |
| Pattern | 模式：弹窗、列表页、卡片等拼装好的块 |
| Recipe | 配方：多个块组合起来的标准页面做法 |
| Canonical | 权威 / 默认要用的方案 |
| Legacy | 废弃，新页面禁止再用 |
| Live Spec | 展台上的是真实组件，不是假图 |
| `?ds=1` | Design System，打开组件库展台的网址参数 |

---

## 目录

1. [怎么引用](#1-怎么引用)
2. [中英对照速查表](#2-中英对照速查表)
3. [设计令牌（全局尺子）](#3-设计令牌全局尺子)
4. [原子控件](#4-原子控件)
5. [导航](#5-导航)
6. [反馈与状态](#6-反馈与状态)
7. [页面模式 / 业务块](#7-页面模式--业务块)
8. [标准配方（怎么拼页面）](#8-标准配方怎么拼页面)
9. [平台接入状态标签](#9-平台接入状态标签)

---

## 1. 怎么引用

### 在京小灵本仓库写页面

```tsx
import { BTN_INK, FIELD, FIELD_CTRL, LABEL, cn } from '@/lib/ui';
import { Modal } from '@/src/components/common/Modal';

<button className={BTN_INK}>确定</button>
```

### 在其他前端项目（风格对齐 / 直接用组件）

```bash
# 本仓库根目录打包装
npm run pack:ui
# 对方项目安装
npm i ./joysupport-ui-0.1.0.tgz
```

```tsx
import { BTN_INK, Modal, PageHeader, cn } from '@joysupport/ui';
import '@joysupport/ui/styles.css';
```

使用 Tailwind v4 时，要让工具类生效，CSS 里加上：

```css
@source "../node_modules/@joysupport/ui/dist";
```

---

## 2. 中英对照速查表

不知道英文名时，先查这张表。

### 样式常量（写在 className 上的「预制样式」）

| 中文 | 代码名 | 一句话 |
|------|--------|--------|
| 主按钮（墨黑） | `BTN_INK` | Button Ink：墨黑色主操作按钮 |
| 次按钮（柔灰） | `BTN_SOFT` | Soft：浅灰次要按钮 |
| 描边按钮 | `BTN_OUTLINE` | Outline：白底描边按钮 |
| 危险按钮 | `BTN_DANGER` | Danger：删除等危险操作 |
| 主按钮别名 | `BTN_MD` | 与 `BTN_INK` 相同，历史别名 |
| 输入框样式 | `FIELD` | 单行/多行输入框的边框与字号 |
| 输入框高度 | `FIELD_CTRL` | Control：固定高度 32px，与 FIELD 组合 |
| 表单标签 | `LABEL` | 输入框上方小标题文字 |
| 搜索框整包 | `SEARCH_FIELD` | 页头用的加宽搜索框 |
| 搜索框宽度 | `SEARCH_WIDTH` | 搜索框宽度常量 |
| 下拉触发器 | `SELECT_TRIGGER` | Select 下拉框触发按钮样式 |
| 分段条容器 | `SEGMENTED_BAR` | 胶囊分段切换的外框 |
| 分段项样式函数 | `segmentedItemClass` | 分段里每一项选中/未选中样式 |
| 内容卡片 | `CARD` | 白底圆角卡片（可 hover） |
| 卡片悬停抬起 | `CARD_HOVER` | 鼠标悬停时轻微上浮 |
| 静态面板 | `PANEL` | 白底圆角容器，无悬停抬起 |
| 页面外壳 | `PAGE` | 主内容区白底滚动画布 |
| 弹窗遮罩 | `MODAL_OVERLAY` | 弹窗外半透明黑底 |
| 弹窗面板 | `MODAL_PANEL` | 弹窗白底内容区 |
| 徽章色板 | `badgeTones` | Tag 各种颜色的定义表 |
| 徽章样式函数 | `badgeClass` | 生成状态标签的 class |
| 确认流角标 | `confirmStatusBadgeClass` | 确认卡「待确认 / 已确认」 |
| 激活渐变 | `NAV_ACTIVE_GRADIENT_*` | 顶栏/发送钮黑→蓝渐变 |
| AI 创作色系 | `SKILL_AOP_*` | 技能/孵化中间态 tint、发送钮 |
| 类名合并工具 | `cn` | class names：合并/覆盖 Tailwind class |

### 共享组件（`import { Xxx } from '...'`）

| 中文 | 代码名 | 一句话 |
|------|--------|--------|
| 统一弹窗 | `Modal` | 遮罩 + 标题 + 内容 + 底部按钮 |
| 页面大标题区 | `PageHeader` | 页顶：图标 + 大标题 + 右侧操作 |
| 分段切换条 | `SegmentedTabBar` | 页内「我的员工 / 市场」这类切换 |
| 列表分页 | `ListPagination` | 「上一页 / 当前页 / 下一页」 |
| 区块加载中 | `ContentBusy` | 某一块内容转圈等待 |
| 点阵加载动画 | `MatrixLoader` | 京小灵专用点阵 SVG 加载图标 |
| 彩色方块图标 | `CardIcon` | 列表行首彩色圆角字母/图标 |
| 悬停展开菜单 | `HoverActionMenu` | 鼠标悬停弹出的轻量选项 |
| 在线页工具栏 | `OnlinePageToolbar` | 列表页右上角搜索+新建 |
| 在线页区块头 | `OnlineSectionHeader` | 列表上方小标题+说明 |
| 表格空行 | `OnlineEmptyRow` | 表格「暂无数据」那一行 |
| 提示输入条 | `PromptComposer` | 技能创建对话底部输入发送区（遗留） |
| 创作 Sender | `GoalComposerGhost` / `skill-ai-composer` | Agent Builder 创作输入（dongDesign Sender） |
| 思考过程卡 | `SkillThinkingCard` | 规划/拆解中间态（Think） |
| 确认信息卡 | `SkillRoundConfirmCard` | 技能草案确认（确认流） |
| 工作台全屏层 | `WorkspaceOverlay` | 盖住整页的配置/知识工作台 |
| 处理过程折叠 | `ExecutionProcessFold` | 对话里「正在检索/调用技能」折叠条 |
| 可拖拽分栏 | `ResizableSplitPane` | 左右两栏可拖中间分隔线 |
| 母版升级横幅 | `MasterTemplateUpgradeBanner` | 「母版有新版本可同步」提示条 |

### 业务组件（在业务页里，一般不单独发包）

| 中文 | 代码名 | 一句话 |
|------|--------|--------|
| 顶栏二级 Tab | `Navigation` | 内容区顶栏；选中渐变字 + 胶囊底条 |
| 左侧窄轨导航 | `PrimaryNavRail` | 最左侧图标一级导航 |
| 二级侧栏 | `SecondarySideNav` | 双侧导航模式下的二级菜单 |
| 员工卡片 | `EmployeeCardRelay` | 「我的数字员工」首页一张员工卡 |
| 市场卡片 | `MarketCardRelay` | 「数字员工市场」一张可雇佣卡片 |

---

## 3. 设计令牌（全局尺子）

「Token」= 全站统一的视觉参数。不要在业务里随手写 `#xxxxxx`。

### 3.1 颜色 Color

**原则**：界面主体只用灰 + 墨黑；彩色只表示状态（成功/警告/危险/实时）。

#### 常用中性灰

| 中文用途 | Tailwind | Hex |
|----------|----------|-----|
| 侧栏浅底 | `neutral-50` | `#FAFAFA` |
| 浅填充 / 分段底 | `neutral-100` | `#F5F5F5` |
| 默认描边 | `neutral-200` | `#E5E5E5` |
| 次要文字 / 表单 Label | `neutral-500` | `#737373` |
| 主按钮底色 | `neutral-800` | `#262626` |
| 大标题 | `neutral-900` | `#171717` |

#### 品牌别名（CSS 变量，可写成 `bg-ink`）

| 中文 | Token | Hex | 干什么 |
|------|-------|-----|--------|
| 纸底画布 | `paper` | `#FAF9F6` | 暖灰页面底（部分页） |
| 墨黑 | `ink` | `#111111` | 主操作、深色面 |
| 实时蓝 | `live` | `#1E90FF` | 在线/选中底条/AI 信号（**唯一允许的主蓝**） |
| 发丝线 | `line` | `#E7E5E0` | 极细分隔线 |

#### 状态标签色（`badgeClass`）

仅底色 + 字色，**不允许描边**（`border-0`）。

| 中文场景 | tone 参数 | 观感 |
|----------|-----------|------|
| 普通标签 | `neutral` | 浅灰底灰字 |
| 强调 / 墨黑标 | `ink` | 黑底白字 |
| 成功 / 已上岗 | `success` | 浅绿底绿字 |
| 警告 / 定制中 | `warning` | 浅黄底棕字 |
| 危险 / 失败 | `danger` | 浅红底红字 |
| 信息 / 解析中 / 休息 | `live` | 浅蓝底蓝字 |

```tsx
<span className={badgeClass('success')}>已上岗</span>
<span className={badgeClass('live')}>解析中</span>
```

### 3.2 字体 Font / Typography

| 中文用途 | 写法 | 大约字号 |
|----------|------|----------|
| Banner 大标题 | `text-2xl font-bold` | 24 |
| 页面标题 | `text-xl font-semibold` | 20 |
| 卡片/弹窗标题 | `text-sm font-semibold` | 14 |
| 正文、分段 Tab | `text-[13px]` | 13 |
| 按钮、输入文字 | `text-xs font-semibold` | 12 |
| 说明、辅助 | `text-[11px] text-neutral-500` | 11 |
| 标签、分页 | `text-[10px]` | 10 |

### 3.3 图标 Icon

- 来源包装：`lib/icons.tsx`（底层 Hugeicons）
- 尺寸约定：表格内 **13px** · 按钮旁 **14px** · 卡片 **16px**

### 3.4 间距 Space

| 中文场景 | 写法 | px |
|----------|------|-----|
| 页面内边距 | `PAGE` → `p-5` | 20 |
| 表单字段之间 | `space-y-4` | 16 |
| Label 到输入框 | `LABEL` → `mb-1` | 4 |
| 大模块间距 | `mb-5` ~ `mb-6` | 20~24 |

### 3.5 圆角 Radius

| 中文场景 | 值 |
|----------|-----|
| 按钮、输入框 | **7px** |
| 卡片、弹窗 | **13px** |
| 分段切换外框 | `rounded-lg` |

### 3.6 阴影 Shadow

| 中文 | 代码 | 说明 |
|------|------|------|
| 可交互卡片 | `CARD` | 轻微阴影；可加 `CARD_HOVER` 抬起 |
| 静态面板/表 | `PANEL` | 有边框，无悬停抬起 |
| 弹窗 | `MODAL_PANEL` | 更明显阴影 |

### 3.7 描边 Border

- 默认描边：`border-neutral-200`（约 `#E5E5E5`）
- 输入聚焦：加深为 `border-neutral-400`，**不要用蓝色光圈**

### 3.8 动效 Motion

- 默认过渡约 **200ms**
- 卡片悬停：轻微上移（`CARD_HOVER`）

---

## 4. 原子控件

「原子」= 最小可复用控件。

### 4.1 按钮 Button

**英文名**：`BTN_INK` / `BTN_SOFT` / `BTN_OUTLINE` / `BTN_DANGER`  
**意思**：Button 的四种预制样式字符串（不是 React 组件，直接当 `className` 用）。

**长什么样**：高度 32px（`h-8`），圆角 7px，字号 12。

| 变体 | 中文场景 | 样子 |
|------|----------|------|
| `BTN_INK` | 确定、保存、新建、查询 | 墨黑底白字 |
| `BTN_SOFT` | 取消、次要操作 | 浅灰底 |
| `BTN_OUTLINE` | 次要、描边风格 | 白底灰边 |
| `BTN_DANGER` | 删除、高风险 | 白底红字红边 |

**加载态**：按钮 `disabled`，里面放 `MatrixLoader`（点阵），可写「提交中…」。不要用旋转圆环。

```tsx
<button type="button" className={BTN_INK}>确定</button>
<button type="button" className={BTN_SOFT}>取消</button>
<button type="button" className={BTN_INK} disabled>
  <MatrixLoader size={14} /> 提交中…
</button>
```

| 推荐 | 禁止 |
|------|------|
| 一页一个主 CTA 用墨黑 | 主按钮用蓝色 |
| 取消用柔灰/描边 | 自己改高度、圆角 |
| 加载必须禁用点击 | 用 `animate-spin` 圆环代替点阵 |

展台：`#atom-button`

---

### 4.2 表单字段 Field / Form

**英文名**：`FIELD`（输入框）、`FIELD_CTRL`（高度）、`LABEL`（标签文字）  
**意思**：Form Field = 表单里的一格输入。

```tsx
<label className={LABEL}>知识库名称</label>
<input className={cn(FIELD, FIELD_CTRL)} placeholder="请输入" />
{/* 多行文本域：只用 FIELD，不要加 FIELD_CTRL */}
<textarea className={cn(FIELD, 'min-h-[80px] py-2')} />
```

| 推荐 | 禁止 |
|------|------|
| Label 与输入间距 4px | **整块表单再包一层圆角大卡片** |
| 字段之间 `space-y-4` | 蓝色 focus ring |
| 错误：红描边 + 红色说明文字 | |

展台：`#atom-field`

---

### 4.3 标签 Tag / Badge

**英文名**：`badgeClass('success')`  
**意思**：Badge = 徽章/小标签，用来标状态，不是按钮。

常见文案：「已上岗」「待上岗」「解析中」「专属定制」。

| 推荐 | 禁止 |
|------|------|
| 用 `badgeClass(tone)` | 把标签做成主按钮去点 |
| 仅底色 + 字色（`border-0`） | 自己发明紫色系标签 / 加描边 |

展台：`#atom-tag`

---

### 4.4 筛选 Chip

**英文名**：Filter Chip  
**意思**：Chip = 小药片形状的筛选按钮，例如「今天 / 近 7 天 / 近 30 天」。

| 推荐 | 禁止 |
|------|------|
| 互斥快捷筛选 | 代替主 CTA |
| 选中用浅蓝底+描边 | 做成一堆大圆角胶囊装饰 |

展台：`#atom-chip`

---

## 5. 导航

### 5.1 顶栏二级 Tab（默认导航）

**英文名**：`Navigation` + `navSecondaryTabClass`  
**意思**：内容区顶部横向菜单；当前项为**黑→蓝渐变字** + 底部渐变胶囊条（不是实色 `text-live`）。

**出现场景**：默认布局（hybrid）= 左侧窄轨 `PrimaryNavRail` + 顶栏这些 Tab。  
例如数字员工域：「我的数字员工 | 数字员工市场 | …」；智能质检域：`QC_APP_MAIN_TABS`（质检计划 / 数据汇总 / 质检模板…）。

**源码**：`src/components/Navigation.tsx` · `lib/navDomain.ts`  
**状态**：已接入（生产默认）

| 推荐 | 禁止 |
|------|------|
| 二级能力横排在顶栏 | 引用已废弃的 `QcAppMainTabs` 组件（数据仍用 `QC_APP_MAIN_TABS`） |
| 激活用 `navSecondaryTabClass` + `NAV_SECONDARY_TAB_INDICATOR` | 在双侧导航模式下再叠一套顶栏 |
| 分层示意见 `#tpl-layered-tabs` | 用实色蓝字代替渐变激活 |

展台：`#atom-underline` · 质检分层样例 `#tpl-layered-tabs`

---

### 5.2 页内子 Tab（技能页）

**英文名**：In-page sub tabs（展台 `#tpl-dual-tabs`）  
**意思**：`OnlinePageHeader` 下方再挂一行页内子 Tab；激活为**墨黑字 + 墨黑底条**（不是顶栏 `navSecondaryTabClass` 渐变胶囊）。

**出现场景**：数字员工技能（`SkillPage`）「我的技能 | 技能市场」。

**写法**：`h-9` / `text-[13px]`；激活底条 `absolute left-3 right-3 bottom-0 h-0.5 rounded-full bg-neutral-900`。市场 Tab 可隐藏「新建」。

| 推荐 | 禁止 |
|------|------|
| 页头与子 Tab 同在 shrink-0 顶区 | 用 `navSecondaryTabClass` 渐变条做页内子 Tab |
| 与 `SkillPage` 同构 | 做成 Segmented 叠在页头上 |

展台：`#tpl-dual-tabs`  
**状态**：已接入

---

### 5.3 分段控件 Segmented

**英文名**：`SegmentedTabBar` / `SEGMENTED_BAR`  
**意思**：Segmented Control = 一段灰底里的白色「滑块」切换，像 iOS 分段。

**出现场景**：同一页内切换 2～5 个同级视图（员工页、任务中心、上岗配置等）。技能页用 §5.2 墨黑底条，不用 Segmented。  
**尺寸**：外框总高 **38px**，选中片 **30px**。

```tsx
<SegmentedTabBar
  value={tab}
  onChange={setTab}
  items={[
    { id: 'employees', label: '我的数字员工' },
    { id: 'market', label: '数字员工市场' },
  ]}
/>
```

| 推荐 | 禁止 |
|------|------|
| 同级少量视图切换 | 和顶栏下划线 Tab 抢同一层级 |
| | 选项很多时改用侧栏/顶栏 |

展台：`#atom-segmented`  
**状态**：已接入

---

### 5.4 双侧导航 Dual Nav

**英文名**：`PrimaryNavRail` + `SecondarySideNav`（布局名 `dualSide`）  
**意思**：

- **Primary Nav Rail**：最左侧一条很窄的图标轨（一级域）
- **Secondary Side Nav**：旁边稍宽的二级文字侧栏

**怎么开**：右下角「版本」里选双侧导航。默认仍是 hybrid（窄轨 + 顶栏 `Navigation`）。  
**状态**：A/B 可选（不是默认权威方案）

| 推荐 | 禁止 |
|------|------|
| 做导航 A/B 对比 | 当成默认方案到处用 |
| | 与顶栏 `Navigation` 同时全开 |

展台：`#pattern-dual-nav`

---

### 5.5 页面头 PageHeader

**英文名**：`PageHeader`  
**意思**：页面最上方的「大标题区」：左边图标+标题+说明，右边放搜索/按钮。

**适合**：Dashboard、角色权限等**非列表**页。  
**不适合**：知识库/技能等「在线列表」——那些页标题已由二级导航承担，再用大标题会重复。

展台：`#pattern-header`  
**状态**：单点使用

---

### 5.6 宽侧栏（废弃）

**英文名**：Wide Sidebar（历史遗留示意，旧 Sidebar 已删除）  
**意思**：以前 232px 宽侧栏方案，**已废弃**，全站无引用。  
**状态**：Legacy — 新页面禁止复制。

展台：`#legacy-wide-nav`

---

## 6. 反馈与状态

### 6.1 轻提示 Toast

**英文名**：Toast（本项目经 `showAppToast` + Sonner）  
**意思**：屏幕上短暂飘出的成功/失败提示，约 1.6 秒消失。

类型：`success`（成功）· `error`（失败）· `warning`（警告）· `info`（信息）。

展台：`#feedback-toast`

---

### 6.2 加载态 Busy / Loader

**英文名**：

| 代码 | 白话 |
|------|------|
| `MatrixLoader` | 点阵小动画图标（全站统一加载符号） |
| `ContentBusy` | Content Busy = 某一块内容「忙碌中」，盖住该区域 |

尺寸约定：按钮旁 `inline` 16 · 列表空位 `slot` 28 · 主内容区 `panel` 40。

```tsx
<ContentBusy busy={loading} label="加载中" size="panel">
  <实际内容 />
</ContentBusy>
```

展台：`#feedback-busy`

---

### 6.3 空状态 Empty

**意思**：没有数据时怎么展示。

| 场景 | 做法 |
|------|------|
| 首页完全没员工 | 大插画 + 主按钮引导雇佣 |
| 表格无行 | `OnlineEmptyRow` 一行居中说明 |
| 搜索无结果 | 小文案「试试调整关键词」，不要报系统错误 |

展台：`#feedback-empty`

---

### 6.4 状态点 Status

**意思**：在线/离线小圆点、状态徽章、按钮角标小红/黄点。

- 在线点：绿色 `#00AC6B`
- 离线点：灰色
- 文案状态：用 `badgeClass`
- 角标：仅在有待办时出现（如培训通知）

展台：`#feedback-status`

---

## 7. 页面模式 / 业务块

「Pattern」= 已经拼好的页面区块。

### 7.1 在线列表页 Online Layout

**英文名**：`OnlinePageLayout` 相关导出  
（`OnlinePageToolbar` / `OnlineSectionHeader` / `onlineTableClass` / `OnlineEmptyRow`）

**白话**：知识库、技能、账号管理这类「管理列表页」的标准骨架（对齐 `KnowledgeBasePage`）：

1. `OnlinePageHeader`：左标题（如「员工知识」）+ 右搜索 + 主按钮「新建知识库」
2. 扁平表格列：知识库 / 文档数 / 字符数 / 更新时间 / 操作（文字链「上传」+ 图标重命名/删除）
3. 超过 10 条：底栏 `border-t` + `ListPagination`
4. `OnlineSectionHeader` 只用于表下详情区（如上传面板），**不要**压在表上方

展台：`#pattern-online` · 完整模板 `#tpl-list`

---

### 7.2 营销轮播 Home Banner

**英文名**：写在 `EmployeeHomeRelay` 里，**不是**独立组件。  
**白话**：员工首页那块「雇佣新员工上手向导」大图。  
**注意**：母版升级提示请用下面的「母版升级横幅」，不要和营销轮播混用，也不要抽成通用 Banner。

展台：`#pattern-banner` · 状态：单点

---

### 7.3 卡片图标 CardIcon

**英文名**：`CardIcon`  
**白话**：列表行首的彩色圆角方块（可放字或图标）。颜色由 `seed`（如 id）稳定算出，同一对象颜色不变。

**产品默认**：`size="sm"` + `variant="soft"` + 首字（对齐「员工知识」列表）。soft 仅底色+字色，**无描边**。

```tsx
<CardIcon seed={kb.id} size="sm" variant="soft">{kb.firstChar}</CardIcon>
```

| variant | 用途 |
|---------|------|
| `soft` | 列表行首（默认） |
| `solid` | 需要更强对比的标题区 |
| `ai` | AI 能力入口，墨黑底，不按 seed 上色 |

展台：`#pattern-card-icon`

---

### 7.4 员工卡 Employee Card

**英文名**：`EmployeeCardRelay`  
**白话**：「我的数字员工」网格里的一张卡：头像、名称、简介、在线点、培训/上岗/派发等按钮。

展台：`#pattern-employee`

---

### 7.5 市场卡 Market Card

**英文名**：`MarketCardRelay`  
**白话**：「数字员工市场」里可浏览/雇佣的模板卡片。

展台：`#pattern-market`

---

### 7.6 弹窗 Modal

**英文名**：`Modal`  
**白话**：中间弹出的对话框：点遮罩关闭，有标题、内容、底部取消/确定。

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="创建知识库"
  footer={
    <>
      <button className={BTN_SOFT} onClick={() => setOpen(false)}>取消</button>
      <button className={BTN_INK}>确定</button>
    </>
  }
>
  <div className="space-y-4">表单字段…</div>
</Modal>
```

展台：`#pattern-modal`

---

### 7.7 表格 / 分页 Table & Pagination

**英文名**：`ListPagination`（列表分页）  
**白话**：超过一页（默认每页 10 条）时出现：「共 N 条 · 上一页 · 当前页/总页 · 下一页」。  
**不是**「1 2 3 4」那种页码条。

| 推荐 | 禁止 |
|------|------|
| >10 条再出分页 | 做成 1 2 3 页码条 |
| 状态列用 `badgeClass` | 一行堆太多按钮 |

展台：`#pattern-table`

---

### 7.8 处理过程折叠 ExecutionProcessFold

**英文名**：`ExecutionProcessFold`  
**白话**：对话里折叠展示「检索知识库 / 调用技能」等步骤；运行中展开并显示点阵加载，结束后显示步数与完成勾。

展台：`#pattern-exec-fold` · 状态：已接入

---

### 7.9 可拖拽分栏 ResizableSplitPane

**英文名**：`ResizableSplitPane`  
**白话**：左右两栏，中间拖条改宽度。适合「左列表 / 右详情」。简单单列页不要用。

展台：`#pattern-split-pane` · 状态：已接入

---

### 7.10 母版升级提示 Upgrade Banner

**英文名**：`MasterTemplateUpgradeBanner`  
**白话**：员工详情里「母版发了新版本，是否同步」的提示条；可展开更新说明，同步前要二次确认弹窗。

展台：`#pattern-upgrade-banner` · 状态：已接入

---

### 7.11 提示输入 PromptComposer

**英文名**：`PromptComposer`  
**白话**：技能创建等对话场景底部的输入组合框（不是普通单行 `FIELD`）。空内容时发送按钮禁用。

展台：`#pattern-composer` · 状态：单点（遗留）  
**新页请用** `#pattern-goal-composer`。

---

### 7.11b 创作 Sender（GoalComposer / skill-ai-composer）

**英文名**：`GoalComposerGhost` + `skill-ai-composer`  
**白话**：Agent Builder 首页与技能落地页的创作输入（dongDesign-AI **Sender**）。含 Ghost 打字机、Tab 补全、推荐芯片（只填入不跳转）、渐变发送钮。

展台：`#pattern-goal-composer` · 状态：已接入  
规范：`DESIGN.md` §10 · `.cursor/rules/ai-product-dongdesign.mdc`

---

### 7.11c 对话气泡字阶 AI Bubble

**白话**：AI / 用户气泡内文字排版（dongDesign-AI **Bubble**）。正文 `14px/22px` `#595959`；一/二/三级标题见展台。

展台：`#pattern-ai-bubble` · 状态：已接入

---

### 7.11d 思考过程卡 SkillThinkingCard

**英文名**：`SkillThinkingCard`  
**白话**：规划拆解时的思考链（dongDesign-AI **Think**）。模式：outline / executing / generating / nested。

展台：`#pattern-ai-thinking` · 状态：已接入

---

### 7.11e 确认信息卡 SkillRoundConfirmCard

**英文名**：`SkillRoundConfirmCard`  
**白话**：技能创建草案确认；角标用 `confirmStatusBadgeClass`。员工孵化已改为规划后直接写入，不再挂此卡。

展台：`#pattern-ai-confirm` · 状态：已接入

---

### 7.12 悬停菜单 HoverActionMenu

**英文名**：`HoverActionMenu`  
**白话**：鼠标悬停在触发器上，展开少量选项（2～5 个），可带一句短说明。复杂操作请改用弹窗。

展台：`#pattern-hover-menu` · 状态：单点

---

### 7.13 工作台层 WorkspaceOverlay

**英文名**：`WorkspaceOverlay`  
**白话**：盖住几乎全屏的工作台层（如知识库配置），自带关闭。简单表单请用 `Modal`，不要上全屏层。

展台：`#pattern-workspace` · 状态：单点

---

### 7.14 骨架屏 Loading Skeletons

**英文名**：Skeleton（骨架屏）  
**白话**：内容还没到时的占位轮廓。线上在用：

| 中文场景 | 代码名 |
|----------|--------|
| 对话回复加载 | `ChatReplySkeleton` |
| 工作日志加载 | `WorkLogSkeleton` |
| 上传创建中 | `UploadLoadingPanel` |

不要用灰色脉冲块代替 `MatrixLoader`；`DocumentRowSkeleton` 等未接入，勿用。

展台：`#pattern-skeleton`

---

## 8. 标准配方（怎么拼页面）

「Recipe」= 推荐拼法，不是新组件。

### 8.1 弹窗 CRUD（新建/编辑）

**英文**：Modal CRUD = Create / Read / Update / Delete 用弹窗完成。

**步骤**：

1. 列表右上角 `OnlinePageToolbar`：搜索 + 主按钮（`BTN_INK`「新建」）
2. 点击打开 `Modal`
3. 弹窗内：`LABEL` + `FIELD`，字段间距 `space-y-4`（**不要再套 CARD**）
4. 底部：`BTN_SOFT` 取消 + `BTN_INK` 确定
5. 成功用 Toast；校验失败红描边

展台：`#recipe-crud`

---

### 8.2 在线列表 CRUD

**英文**：List CRUD  
**白话**：对齐产品「员工知识」：`OnlinePageHeader` + 扁平表 + 底部分页。不要再放巨大 `PageHeader`，表上方不要再加区块头。

展台：`#recipe-list` · 完整样例 `#tpl-list`

---

### 8.3 员工卡操作条

**白话**：员工卡片底部按钮怎么排：

| 状态 | 按钮组合 |
|------|----------|
| 在线 | 培训 + 派发/休息 + 更多 |
| 离线 | 培训 + 上岗 + 更多 |

不要一次放三个同样显眼的主按钮。有培训待办时才显示角标。

展台：`#recipe-employee-bar`

---

### 8.4 筛选条 Filter Bar

**白话**：页头一排：搜索框 + 下拉 + 时间 Chip + 查询按钮。  
**禁止**把整条筛选装进圆角 `CARD` 里。

展台：`#recipe-filter`

---

## 9. 平台接入状态标签

展台上每个区块可能带状态徽章：

| 中文 | 英文 | 含义 |
|------|------|------|
| 已接入 | In prod | 生产默认路径在用，放心跟 |
| 单点 | Single use | 只有个别页面用，扩展前先问清 |
| A/B 可选 | A/B opt-in | 版本开关可开，不是默认 |
| 未接入 | Unused | 展台有样例，产品还没接 |
| 废弃 | Legacy | 禁止新页面使用 |

---

## 附录 A：常量 → 展台锚点

打开展台后，地址栏加 `#锚点` 可直达，例如：  
`https://dist-livid-eight-15.vercel.app/?ds=1#atom-segmented`

| 你要找的中文 | 代码 | 锚点 |
|--------------|------|------|
| 主/次/描边/危险按钮 | `BTN_*` | `#atom-button` |
| 表单输入 | `FIELD` / `LABEL` | `#atom-field` |
| 状态标签 | `badgeClass` | `#atom-tag` |
| 筛选药片 | Chip | `#atom-chip` |
| 顶栏菜单 | `Navigation` | `#atom-underline` |
| 页内子 Tab（技能） | `SkillPage` 墨黑底条 | `#tpl-dual-tabs` |
| 分段切换 | `SegmentedTabBar` | `#atom-segmented` |
| 双侧导航 | `PrimaryNavRail`… | `#pattern-dual-nav` |
| 页面大标题 | `PageHeader` | `#pattern-header` |
| 弹窗 | `Modal` | `#pattern-modal` |
| 分页 | `ListPagination` | `#pattern-table` |
| 加载 | `ContentBusy` | `#feedback-busy` |
| 创作 Sender | `GoalComposer` | `#pattern-goal-composer` |
| AI 气泡字阶 | Bubble | `#pattern-ai-bubble` |
| 思考过程卡 | `SkillThinkingCard` | `#pattern-ai-thinking` |
| 确认信息卡 | `SkillRoundConfirmCard` | `#pattern-ai-confirm` |
| 在线列表壳 | `OnlinePage*` | `#pattern-online` |
| 员工卡 | `EmployeeCardRelay` | `#pattern-employee` |
| 市场卡 | `MarketCardRelay` | `#pattern-market` |

---

## 附录 B：维护约定

改规范时顺序：

1. 改 [`lib/ui.ts`](../lib/ui.ts) 或 `common/*`
2. 更新交互展台 `ComponentLibraryPage`
3. 同步本文档
4. 若对外发包，同步 [`packages/joysupport-ui`](../packages/joysupport-ui/) 并 `npm run pack:ui`

---

*本文档镜像展台完整结构，面向产品 / 设计 / 其他项目前端。交互细节以 `/?ds=1` 为准。*
