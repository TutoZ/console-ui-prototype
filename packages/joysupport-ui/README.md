# @joysupport/ui

JoySupport（京小灵）可安装设计系统包：用同一套常量与组件做**风格转换**和**直接引用**。

裁定顺序：`@joysupport/ui` 常量 / 组件 ≈ 产品内 `lib/ui.ts` + `common/*` 展台（`?ds=1`）。

给其他 AI 做整页风格转化：不要只发本 README。请发放 [`docs/ai-style-kit/`](../../docs/ai-style-kit/README.md)（宪法 + 对照示例 + 可粘贴 prompt），再让对方安装本包。

## 安装

### 同机 / 内网（推荐起步）

在本仓库根目录打包：

```bash
cd packages/joysupport-ui
npm install
npm run build
npm pack
```

在目标项目：

```bash
npm install /绝对路径/joysupport-ui-0.1.0.tgz
# 或
npm install file:../京小灵交互\ 2/packages/joysupport-ui
```

### 本仓库 workspace

根 `package.json` 已声明 workspaces；根目录 `npm install` 后可直接：

```ts
import { BTN_INK, Modal } from '@joysupport/ui';
import '@joysupport/ui/styles.css';
```

## 风格转换（只改 class，不换组件）

```tsx
import { BTN_INK, BTN_SOFT, FIELD, FIELD_CTRL, LABEL, CARD, badgeClass, cn } from '@joysupport/ui';
import '@joysupport/ui/styles.css';

<button className={BTN_INK}>确认</button>
<button className={BTN_SOFT}>取消</button>
<label className={LABEL}>名称</label>
<input className={cn(FIELD, FIELD_CTRL)} />
<span className={badgeClass('success')}>已接入</span>
<div className={cn(CARD, 'p-4')}>…</div>
```

| 意图 | 用什么 |
|------|--------|
| 主按钮 | `BTN_INK` |
| 次按钮 | `BTN_SOFT` / `BTN_OUTLINE` |
| 危险 | `BTN_DANGER` |
| 输入 | `FIELD` + `FIELD_CTRL` |
| 标签 | `LABEL` |
| 卡片 | `CARD`（可交互加 `CARD_HOVER`） |
| 徽章 | `badgeClass('neutral' \| 'ink' \| 'success' \| …)` |

## 直接引用组件

```tsx
import {
  Modal,
  PageHeader,
  SegmentedTabBar,
  ListPagination,
  ContentBusy,
  CardIcon,
  OnlinePageToolbar,
} from '@joysupport/ui';
```

导出组件：`Modal` · `PageHeader` · `SegmentedTabBar` · `ListPagination` · `ContentBusy` · `MatrixLoader` · `CardIcon` · `HoverActionMenu` · `OnlinePageToolbar` / `OnlineSectionHeader` / `OnlineEmptyRow`。

不含业务耦合件（依赖 AppContext / 文案字典的导航等仍留在产品仓库）。

## Tailwind 扫描（必做）

本包用 Tailwind 工具类字符串。消费方 CSS 需扫到包内文件，否则样式会丢。

Tailwind v4：

```css
@import "tailwindcss";
@source "../node_modules/@joysupport/ui/dist";
@import "@joysupport/ui/styles.css";
```

## 对照展台

产品仓库启动后打开：`http://127.0.0.1:5190/?ds=1`

## peer

- `react` / `react-dom` ≥ 18
- 建议 Tailwind CSS ≥ 4（与京小灵一致）
