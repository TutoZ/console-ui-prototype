# Manus Skill Editor 壳（样式 1:1，内容由应用注入）

来源：Manus skill-creator 归档页的 `manus-agent-workspace` 编辑器样式（字号、色板、顶栏排版）。

## 策略

- **参考**：布局、字号、颜色、顶栏/底栏、原始/已修改分段（Manus CSS 变量与结构）
- **不参考**：Manus 原文案与业务内容；正文由京小灵 `BuildSkillModal` 经 `postMessage` 注入

## 文件

- `editor.html`：编辑器壳 + 资源管理器 + 消息协议
- `assets/`：Manus 主题 CSS（含 `--text-primary` 等）与 `editor.main.css`

## 消息协议

父页面 → iframe

- `manus-expert-init` / `manus-expert-sync`：`{ packageName, files: [{ id, name, path, content, original, editable }] }`

iframe → 父页面

- `manus-expert-ready`
- `manus-expert-change`：`{ id, content }`（目前仅 `skill.md`）
- `manus-expert-toast`：`{ message }`
