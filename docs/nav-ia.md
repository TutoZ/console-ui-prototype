# 京小灵导航信息架构（一级 / 二级菜单）

产品侧导航真相源：[`lib/navDomain.ts`](../lib/navDomain.ts)。  
交互展台：`/?ds=1`。本表为产品给定的菜单与说明。

## 总表

| 一级菜单 | 二级菜单 | 说明 | 实现状态 |
|----------|----------|------|----------|
| **数字员工** | Agent Builder | 一句话创建数字员工与技能 | 已接 `platformHome` |
| | 我的数字员工 | 进入我的数字员工页面 | 已接 `employees` |
| | 数字员工市场 | 进入员工市场页面 | 已接 `market` |
| | 数字员工技能 | 进入我的已订阅技能页面，可切换到技能市场 | 已接 `skills`（从原「在线」迁入） |
| **在线客服** | 员工培训 | 进入员工配置页面，支持新建 agent 和培训现有 agent | 已接 `training`（同员工配置页） |
| | 接待记录 | 进入数字员工对话记录页面 | 已接 `sessions` |
| | 员工知识 | 进入数字员工支持配置页面 | 已接 `kb` |
| | 员工业绩 | 进入数字员工数据监控页面 | 已接 `dashboard`（从原「数字员工」迁入） |
| | 员工比拼 | 进入数字员工比拼页面 | 已接 `abTest`（从原「数字员工」迁入） |
| **智能外呼** | 任务下发 | 外呼任务创建、调度与进度 | 已接 `tasks` |
| | 员工监控 | 今日核心数据 / 意向 / 呼叫速度 | 已接 `outboundApp` · `monitor` |
| | 员工培训 | 智能体话术配置与培训 | 已接 `training` |
| | 外呼记录 | 通话明细查询与导出 | 已接 `records` |
| | 员工业绩 | 任务/日期维度业绩报表 | 已接 `stats` |
| **热线客服** | 员工培训 | 原「智能体管理」，话术与智能体配置 | 已接 `hotlineApp` · `agents` |
| | 员工业绩 | 热线接待量、接通与满意度 | 已接 `hotlineApp` · `stats` |
| | 接待记录 | 呼入通话明细 | 已接 `hotlineApp` · `calls` |
| | 号码管理 | 热线号码申请与绑定 | 已接 `hotlineApp` · `numbers` |
| **电话销售** | （应用内二级） | 见电话销售应用 PRD（@陆谷涛 Ringo） | 域已接，子项见应用 PRD |
| **智能随访** | 派发任务 / 运行概览 | 雇佣随访数字员工后解锁 | 已接 `followupApp` |
| **电话催收** | （应用内二级） | 见电话催收应用 PRD（@陆谷涛 Ringo） | 域已接，子项见应用 PRD |
| **智能质检** | （应用内二级） | 见智能质检应用 PRD（@薛程月） | 域已接，子项见应用 PRD |
| **资源中心** | 电话线路 | 详见 @张宇翔(Cooper) PRD | 占位页 `phoneLines` |
| | 短信资源 | 暂无，本期不实现 | 菜单禁用 / `comingSoon` |
| **通用配置** | 账号管理 | 原「坐席管理」更名；详见 @张宇翔(Cooper) PRD | 已接 `staff` |
| | 角色权限 | 角色与权限 | 已接 `roles` |

## 相对旧版的主要变化

| 变化 | 说明 |
|------|------|
| 「在线」→「在线客服」 | 一级域名更新 |
| 「质检」→「智能质检」 | 一级域名更新 |
| 「外呼」→「智能外呼」 | 一级域名更新 |
| 「热线」→「热线客服」 | 一级域名更新 |
| 「电销」→「电话销售」 | 一级域名更新 |
| 「催收」→「电话催收」 | 一级域名更新 |
| 「管理区」→「通用配置」 | 底部一级入口更名 |
| 「员工分配 / 坐席管理」→「账号管理」 | 二级文案更名 |
| 「员工技能」→「数字员工技能」并迁到「数字员工」 | 归属调整 |
| 员工业绩、员工比拼迁到「在线客服」 | 归属调整 |
| 新增「资源中心」 | 电话线路 + 短信资源（暂无） |
| 新增「员工培训」二级 | 在线客服下进入员工配置/培训 |

## 解锁规则

- **常驻一级**：数字员工、在线客服、资源中心、通用配置（底部）
- **雇佣解锁**：智能外呼 / 热线客服 / 电话销售 / 电话催收 / 智能质检 / 智能随访（雇佣对应岗位族数字员工后出现）

## 相关代码

| 文件 | 作用 |
|------|------|
| [`lib/navDomain.ts`](../lib/navDomain.ts) | 一级/二级常量、域映射 |
| [`lib/platformTerminology.ts`](../lib/platformTerminology.ts) | 对外文案词表 |
| [`src/components/PrimaryNavRail.tsx`](../src/components/PrimaryNavRail.tsx) | 一级窄轨（V1/V2） |
| [`src/components/Navigation.tsx`](../src/components/Navigation.tsx) | hybrid 顶栏二级（V1） |
| [`src/components/SecondarySideNav.tsx`](../src/components/SecondarySideNav.tsx) | dualSide 侧栏二级（V2） |
| [`src/components/PrimaryNavTreeV3.tsx`](../src/components/PrimaryNavTreeV3.tsx) | 可折叠树形侧栏（V3，对齐 joypi 工作台） |
| [`lib/navLayoutVersion.ts`](../lib/navLayoutVersion.ts) | 右下角版本切换（V1/V2/V3） |
