# 京小灵 · AI 风格转化包

给**其他 AI**（ChatGPT / Claude / Trae / Copilot / v0 / Lovable / 别的 Cursor 仓库）用的便携包。

别人已经用别的 AI 生成了一页（常见：shadcn 蓝按钮、Ant Design、通用 Tailwind）。把本目录丢给那个 AI，再贴上外来页面代码，它应改写成：**视觉与京小灵现网一致、组件与 `@joysupport/ui` 一致**。

本仓库里给人看的长文档（`DESIGN.md`、`docs/component-library.md`、Cursor skill）**不要整包转发**——上下文太长，别的 AI 会漏约束。本目录是专门裁过的最短有效集。

**本包对齐**：组件库展台基础 `?ds=1` + AI `?ds=ai`、`lib/ui.ts` / `@joysupport/ui@0.1.1`、在线列表（员工知识 / 接待记录）与技能确认卡布局。

---

## 这套东西是什么（三层，缺一层都会跑偏）

| 层 | 文件 | 解决什么 | 缺了会怎样 |
|----|------|----------|------------|
| 1. 宪法 | `AGENTS.md` 或 `prompts/paste-me.md` | 硬约束：墨黑主色、禁止蓝按钮、AI 渐变边界、用哪套组件 | AI 凭记忆发明「差不多」的灰蓝风 |
| 2. 对照 | `examples/` + `STYLE-TRANSFER.md` | 外来稿 → 京小灵的改写规则与 before/after | 只换颜色，布局/组件仍是 shadcn |
| 3. 运行时 | `@joysupport/ui` | 真按钮、真弹窗、真列表壳，不是手抄 class | class 对了，交互/圆角/加载态仍漂移 |

**最少发放**：`prompts/paste-me.md` + `examples/` + 告诉对方安装 `@joysupport/ui`。

**完整发放**：整个 `docs/ai-style-kit/` 文件夹 + `joysupport-ui-*.tgz`（见仓库外发放 zip）。

---

## 三种用法

### A. 粘贴到对话（最快）

1. 打开 `prompts/paste-me.md`，全文复制到对方 AI 的系统提示 / 自定义指令 / Project Instructions。
2. 下一轮贴：`请按京小灵规范改写下面页面` + 外来 HTML/TSX。
3. 若对方项目能装包，再附 `packages/joysupport-ui` 的 tgz（`npm run pack:ui`）。

### B. 丢进对方仓库（Cursor / Copilot / Claude Code）

把本目录拷到对方项目，例如：

```
对方项目/
  AGENTS.md          ← 复制本目录 AGENTS.md 到仓库根
  docs/ai-style-kit/ ← 整夹拷贝
```

在对话里说：「先读 `AGENTS.md` 和 `docs/ai-style-kit/`，把当前页面改成京小灵风格。」

### C. 从零生成（不是改写）

同样贴 `paste-me.md`，然后给需求，不要给外来稿。AI 应直接按配方拼：列表用 `ONLINE_PAGE` + `OnlinePageHeader` + 扁平表；弹窗 CRUD 用 `Modal` + `FIELD`；创作确认用 `SKILL_AOP_*` / `BTN_*_SM`。

---

## 裁定顺序（冲突时听谁）

1. `packages/joysupport-ui` 源码（`ui.ts` + 组件）与产品 `lib/ui.ts`
2. 本目录 `AGENTS.md`
3. 展台 https://dist-livid-eight-15.vercel.app/?ds=1 （AI：`?ds=ai`）
4. `docs/component-library.md`（给人看的全量，AI 不必先读）

画布白底；卡片/弹窗圆角 **13px**；按钮/输入 **7px**；管理主 CTA **墨黑**；AI 创作发送/确认才用 **黑→#1565BF 渐变**。

---

## 目录

```
docs/ai-style-kit/
├── README.md                 ← 你正在看（给人）
├── AGENTS.md                 ← 给任何 AI 的总指令
├── STYLE-TRANSFER.md         ← 改写流程 + 外来栈映射
├── prompts/paste-me.md       ← 最短可粘贴 prompt
└── examples/                 ← before / after 对照
    ├── list-page.before.tsx
    ├── list-page.after.tsx
    ├── modal-form.before.tsx
    ├── modal-form.after.tsx
    ├── ai-confirm.before.tsx
    └── ai-confirm.after.tsx
```
