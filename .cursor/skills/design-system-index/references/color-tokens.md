# 色彩 Token 全量清单

> 来源：`src/index.css`（`:root` + `@theme inline` + `.dark`）+ `lib/ui.ts` + `DESIGN.md` + 全站 TSX 实际用法。  
> 亮色模式为当前唯一启用视觉；`.dark` 值保留供未来扩展。

### 文档写作规范

与 [design-system-skills 色彩/表单规范](https://github.com/xasking/design-system-skills/tree/main/design-system-index/references) 保持一致：

1. **颜色**：每条须同时标注 **Token 名 + Hex + Tailwind class**（代码只用 Tailwind，Hex 供设计稿对照）。
2. **间距/圆角**：标注 **Token 名（H5/V1/V4 等）+ px + class**。
3. **约束**：强制规则用 **（强约束）**；正反对照用 ✅ / ❌。
4. **禁止**：TSX 中写 `bg-[#F2F7FF]` 等裸 Hex；设计稿 `#F2F7FF` 映射为 `bg-sky-50`（`#F0F9FF`）。

---

## 一、CSS 变量 → Tailwind 映射（亮色 `:root`）

### 1.1 shadcn Mira 语义 Token（主体系）

| CSS 变量 | oklch 值 | Hex（参考） | Tailwind 类 | 用途 |
|----------|----------|-------------|-------------|------|
| `--background` | `oklch(1 0 0)` | `#FFFFFF` | `bg-background` | 页面画布 / body |
| `--foreground` | `oklch(0.145 0 0)` | `#111111` | `text-foreground` | 主文本 |
| `--card` | `oklch(1 0 0)` | `#FFFFFF` | `bg-card` | 卡片 / 面板底 |
| `--card-foreground` | `oklch(0.145 0 0)` | `#111111` | `text-card-foreground` | 卡片内文本 |
| `--popover` | `oklch(1 0 0)` | `#FFFFFF` | `bg-popover` | 弹窗 / 下拉浮层 |
| `--popover-foreground` | `oklch(0.145 0 0)` | `#111111` | `text-popover-foreground` | 浮层文本 |
| `--primary` | `oklch(0.205 0 0)` | `#111111` | `bg-primary` / `text-primary` | 主操作 / 墨黑 |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#FAFAFA` | `text-primary-foreground` | 主按钮字色 |
| `--secondary` | `oklch(0.97 0 0)` | `#F5F5F5` | `bg-secondary` | 次级按钮 / 柔灰底 |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `#111111` | `text-secondary-foreground` | 次级按钮字 |
| `--muted` | `oklch(0.97 0 0)` | `#F5F5F5` | `bg-muted` | 轻填充 / 分段容器 |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#737373` | `text-muted-foreground` | 次要文本 / Label |
| `--accent` | `oklch(0.97 0 0)` | `#F5F5F5` | `bg-accent` | hover 填充 |
| `--accent-foreground` | `oklch(0.205 0 0)` | `#111111` | `text-accent-foreground` | accent 上文本 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#DC2626` | `text-destructive` / `bg-destructive/*` | 危险 / 错误 |
| `--border` | `oklch(0.922 0 0)` | `#E8E8E8` | `border-border` | 默认描边 |
| `--input` | `oklch(0.922 0 0)` | `#E8E8E8` | `border-input` | 输入框描边 |
| `--ring` | `oklch(0.708 0 0)` | `#A3A3A3` | `ring-ring` / `focus-visible:ring-ring/30` | 聚焦环 |

### 1.2 JoyServing 品牌别名

| 别名变量 | 映射 | Hex（DESIGN） | Tailwind | 语义 |
|----------|------|---------------|----------|------|
| `--paper` | `var(--background)` | `#FAF9F6` / `#FFFFFF` | `bg-paper` | 页面画布（暖灰纸底） |
| `--surface` | `var(--card)` | `#FFFFFF` | `bg-surface` / `bg-card` | 卡片 / 面板 |
| `--rail` | `var(--muted)` | `#F5F4F0` | `bg-rail` / `bg-muted` | 表头 / 轨道 |
| `--rail-strong` | `var(--accent)` | `#ECEBE6` | `bg-rail-strong` / `bg-accent` | 深轨道 |
| `--line` | `var(--border)` | `#E7E5E0` | `border-line` / `border-border` | 发丝描边 |
| `--ink` | `var(--primary)` | `#111111` | `bg-ink` / `bg-primary` | 墨黑主色 |
| `--ink-hover` | color-mix | `#262626` | `hover:bg-primary/80` | 主按钮 hover |
| `--live` | 独立 oklch 蓝 | `#1E90FF` | `bg-live` / `text-live` | 实时蓝 |
| `--card-line` | `var(--border)` | `#E7E5E0` | `border-card-line` | 卡片发丝描边 |
| `--nav-active` | `var(--sidebar-accent)` | `#F5F5F5` | `bg-nav-active` | 侧栏激活填充 |
| `--nav-active-line` | `var(--sidebar-border)` | `#E8E8E8` | `border-nav-active-line` | 侧栏激活描边 |

### 1.3 Sidebar Token

| CSS 变量 | oklch 值 | Tailwind |
|----------|----------|----------|
| `--sidebar` | `oklch(0.985 0 0)` | `bg-sidebar` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `text-sidebar-foreground` |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `bg-sidebar-primary` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `text-sidebar-primary-foreground` |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `bg-sidebar-accent` |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `text-sidebar-accent-foreground` |
| `--sidebar-border` | `oklch(0.922 0 0)` | `border-sidebar-border` |
| `--sidebar-ring` | `oklch(0.708 0 0)` | `ring-sidebar-ring` |

### 1.4 图表 Token

| 变量 | oklch 值 | Tailwind |
|------|----------|----------|
| `--chart-1` | `oklch(0.87 0 0)` | `bg-chart-1` |
| `--chart-2` | `oklch(0.556 0 0)` | `bg-chart-2` |
| `--chart-3` | `oklch(0.439 0 0)` | `bg-chart-3` |
| `--chart-4` | `oklch(0.371 0 0)` | `bg-chart-4` |
| `--chart-5` | `oklch(0.269 0 0)` | `bg-chart-5` |

### 1.5 补齐 neutral 中间灰阶

| Token | oklch | Tailwind |
|-------|-------|----------|
| neutral-150 | `oklch(0.946 0 0)` | `bg-neutral-150` |
| neutral-250 | `oklch(0.896 0 0)` | `bg-neutral-250` |
| neutral-350 | `oklch(0.789 0 0)` | `bg-neutral-350` / `border-neutral-350/10` |
| neutral-550 | `oklch(0.498 0 0)` | `text-neutral-550`（侧栏图标） |
| neutral-850 | `oklch(0.237 0 0)` | `bg-neutral-850` / `hover:bg-neutral-850` |

### 1.6 圆角 CSS 变量（基于 `--radius: 0.45rem`）

| Token | 计算 | Tailwind |
|-------|------|----------|
| `--radius-sm` | `radius × 0.6` | `rounded-sm` |
| `--radius-md` | `radius × 0.8` | `rounded-md` |
| `--radius-lg` | `0.45rem` | `rounded-lg` |
| `--radius-xl` | `radius × 1.4` | `rounded-xl` |
| `--radius-2xl` | `radius × 1.8` | `rounded-2xl` |
| `--radius-3xl` | `radius × 2.2` | `rounded-3xl` |
| `--radius-4xl` | `radius × 2.6` | `rounded-4xl` |

---

## 二、语义状态色（全站固定组合）

### 2.0 DongDesign 功能色 `FUNCTIONAL_COLORS`（`lib/ui.ts`）

| 语义 | 本体 | 浅 / 深 / 柔 / 底 |
|------|------|-------------------|
| Success 成功 | `#00B26F` | `#00CA80` / `#009B5E` / `#80E5B9` / `#E8F8F1` |
| Warning 警告 | `#F08433` | `#FDA754` / `#C86627` / `#F9C999` / `#FFF3E8` |
| Error 错误 | `#F33B50` | `#FC616F` / `#C42D40` / `#FDB1B3` / `#FEEBEC` |
| Info 信息 | `#376BFA` | `#598EF8` / `#1F57C6` / `#ADC7FC` / `#E8F1FF` |

> 来源：[DongDesign 色彩 · 功能色](https://dongdesign.jd.com/vue/zh-CN/component/basic/color.html)。标签 / 状态强调 / Chip 选中统一映射此表，不再拆「标签色调」「状态与强调」两套色。

### 2.1 badgeClass（`lib/ui.ts`）

| tone | Hex 参考 | 完整 class 组合 |
|------|----------|----------------|
| `neutral` | 底 `#F4F4F5` 字 `#909399` | `bg-[#F4F4F5] text-[#909399]` |
| `ink` | 底 `#262626` 字 `#FFFFFF` | `bg-neutral-800 text-white` |
| `success` | 底 `#E8F8F1` 字 `#00B26F` | `bg-[#E8F8F1] text-[#00B26F]` |
| `warning` | 底 `#FFF3E8` 字 `#F08433` | `bg-[#FFF3E8] text-[#F08433]` |
| `danger` | 底 `#FEEBEC` 字 `#F33B50` | `bg-[#FEEBEC] text-[#F33B50]`（Error） |
| `live` | 底 `#E8F1FF` 字 `#376BFA` | `bg-[#E8F1FF] text-[#376BFA]`（Info） |

> **徽章禁止描边**：基础壳用 `border-0`，仅底色 + 字色。

徽章基础壳：`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-px rounded border-0`

### 2.1.1 确认流状态角标 `confirmStatusBadgeClass`（非 badgeClass）

与列表/首页 `badgeClass` 不同，专用于对话确认卡「已确认 / 待确认」：

| tone | 用途 | 底 Hex | 字 Hex | Tailwind |
|------|------|--------|--------|----------|
| `confirmed` | 确认卡标题旁 | `#E8F8F1` | `#00B26F` | `bg-[#E8F8F1] text-[#00B26F]` · `h-[18px] text-[11px] rounded` |
| `confirmedSoft` | 草案卡内联 | `#E8F8F1` | `#009B5E` | `bg-[#E8F8F1] text-[#009B5E]` · `text-[10px] rounded-md` |
| `pending` | 待确认 | `#FFF3E8` | `#F08433` | `bg-[#FFF3E8] text-[#F08433]` · `text-[10px] rounded-md` |

```tsx
confirmStatusBadgeClass('confirmed')      // SkillRoundConfirmCard 标题
confirmStatusBadgeClass('confirmedSoft')   // SkillChatConfirmDock 已确认
confirmStatusBadgeClass('pending')         // 待确认
```

### 2.2 页面级语义色常用三件套（功能色）

| 语义 | 背景 Hex | 文字 Hex | 边框 Hex | 说明 |
|------|----------|----------|----------|------|
| 成功 | `#E8F8F1` | `#00B26F` | `#80E5B9` | Success |
| 警告 | `#FFF3E8` | `#F08433` | `#F9C999` | Warning |
| 错误 / 危险 | `#FEEBEC` | `#F33B50` | `#FDB1B3` | Error |
| 信息 | `#E8F1FF` | `#376BFA` | `#ADC7FC` | Info（live / Chip） |
| 中性 | `#F4F4F5` | `#909399` | `#E9E9EB` | 中性标签 |
| 主 CTA 实心 | `#111111` | `#FFFFFF` | — | `bg-ink` / `bg-neutral-900` |
| 深色命令区 | `#0A0A0A` | `#E5E5E5` | — | `bg-neutral-950 text-neutral-200` |

### 2.3 CardIcon 渐变盘（`CardIcon.tsx`，按 seed 派生）

仅用于**卡片 App 图标**，非页面主色：

| # | solid 渐变 | soft 渐变（无描边） |
|---|-----------|-----------|
| 1 | `from-blue-500 to-blue-600` | `from-blue-50 to-blue-100/80 text-blue-600` |
| 2 | `from-violet-500 to-violet-600` | `from-violet-50 to-violet-100/80 text-violet-600` |
| 3 | `from-emerald-500 to-emerald-600` | `from-emerald-50 to-emerald-100/80 text-emerald-600` |
| 4 | `from-amber-500 to-orange-500` | `from-amber-50 to-amber-100/80 text-amber-600` |
| 5 | `from-rose-500 to-pink-600` | `from-rose-50 to-rose-100/80 text-rose-500` |
| 6 | `from-cyan-500 to-sky-600` | `from-cyan-50 to-cyan-100/80 text-cyan-600` |
| 7 | `from-indigo-500 to-indigo-600` | `from-indigo-50 to-indigo-100/80 text-indigo-600` |
| 8 | `from-fuchsia-500 to-purple-600` | `from-fuchsia-50 to-purple-100/80 text-fuchsia-600` |

> 产品默认 `variant="soft"` + `size="sm"`；soft **禁止** `border` / `ring`。

### 2.4 侧栏 Navigation 专用色

| 元素 | class |
|------|-------|
| 侧栏底 | `bg-sidebar/95 backdrop-blur-md border-sidebar-border` |
| 导航项默认 | `text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground` |
| 导航项激活 | `bg-sidebar-accent text-sidebar-accent-foreground font-semibold ring-1 ring-foreground/10` |
| 分组标题 | `text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest` |
| 一级标题字 | `font-bold text-neutral-800 text-[12.5px]` |
| 二级子项 | `text-[12px]`，激活同上 |
| 图标默认 | `text-neutral-550` |
| 图标激活 | `text-neutral-900` |
| Beta 标 | `text-[9px] font-black text-neutral-800 bg-neutral-200/60 border-neutral-350/10` |
| 雇佣 CTA | `bg-ink hover:bg-neutral-850 text-white` |
| 页脚底 | `bg-neutral-50/70 border-card-line` |
| 新手引导卡 | `bg-white border-card-line shadow-[0_2px_10px_rgba(31,35,41,0.02)]` |
| 进度条轨 | `bg-neutral-100`，填充 `bg-neutral-900` |
| 客服工作台入口 | `border-neutral-200/80 bg-white hover:bg-neutral-50` |
| 个人菜单 | `bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-neutral-200/80` |
| 退出 | `hover:bg-rose-50 text-rose-600` |

### 2.5 Ring / 描边透明度规范

| 用途 | class |
|------|-------|
| 卡片/面板默认 | `ring-1 ring-foreground/10` |
| 卡片 hover | `ring-foreground/15` |
| 分段/导航激活 | `ring-1 ring-foreground/10` |
| 卡片选中 | `ring-1 ring-neutral-900/15 border-neutral-900/20` |
| 聚焦 | `focus-visible:ring-2 focus-visible:ring-ring/30` |
| 分段容器 | `ring-1 ring-foreground/10 backdrop-blur-md` |

---

## 三、禁止项

| 禁止 | 替代 |
|------|------|
| `bg-[#...]` / `text-[#...]` | 语义 token 或 Tailwind 色阶 |
| `slate-*` | `neutral-*` 或语义 token |
| `blue-*` / `indigo-*` 作主色 | `primary` / `ink` / `live` / `sky`（实时） |
| `zinc-*` 在新 JoyServing 页面 | `neutral-*` 或 shadcn token（历史 zinc 待收敛） |

---

## 四、滚动条

```css
.custom-scrollbar → thumb #D4D4D4 (neutral-300), hover #A3A3A3 (neutral-400)
width: 6px, radius: 9999px
```

---

## 五、校验清单

- [ ] 颜色文档/代码均 Token + Hex 对照，TSX 无裸 Hex
- [ ] 主色 `#111111`（ink），非 blue-600
- [ ] 信息浅蓝 `#F2F7FF` 设计稿 → `bg-sky-50`（`#F0F9FF`）
- [ ] 语义色使用三件套（success/warning/live 等）
- [ ] 与 `forms.md`、`code-compliance.md` 一致
