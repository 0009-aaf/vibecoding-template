---
name: coding-standards-html
description: 纯 HTML/CSS/JS 项目编码规范（8 条）。Agent 操作 .html 文件或无框架前端项目时自动加载。单文件阈值、内联禁令、语义标签、拆分时机、迁移框架时机。阈值来自 2026 业界实践（LightShell / htmlfile.cloud）。
---

# 纯 HTML 项目编码规范

> 适用：无框架的纯 HTML/CSS/JS 项目（原型 / 工具页 / 静态页 / AI 生成的单文件页面）。
> React 项目用 `coding-standards-react`，Vue 用 `coding-standards-vue`，小程序用 `coding-standards-wx`。
> 通用规则（命名 / 函数设计 / 边界防御）见 `coding-standards`，本文只列纯 HTML 专项。

## 核心问题：AI 生成的"单文件巨石"

AI 生成前端代码的已知通病（2026 多项实测报告一致）：
- 所有 HTML + 内联 CSS + 内联 JS 堆在一个文件，几百上千行
- 列表 / 详情 / 编辑混杂，无组件边界
- 内联 `style` 泛滥、深层 div 嵌套、无语义标签、onclick 内联处理器

**本规范目的**：给"什么时候单文件可接受、什么时候必须拆"划出量化红线。

## 规则

| # | 规则 | 说明 |
|---|------|------|
| H1 | 单文件 HTML 仅限原型 / 工具页 / demo，且同时满足：HTML <500 行、内联 CSS <200 行、内联 JS <300 行 | 本条是 `coding-standards` D3（文件 ≤300 行）的**显式例外**：HTML 标签开闭冗长，同逻辑比代码多 ~40% 行数；但内联 CSS/JS 块仍按 200/300 阈值触发拆分 |
| H2 | 触发任一阈值立即拆分：`<style>` -> `styles.css`、`<script>` -> `app.js`（ESM 模块） | 拆最重的那层开始（通常是 JS）；保持命名/路径规范，拆后重测（路径/缓存/加载错误） |
| H3 | 禁止内联 `style` 属性（JS 动态计算的值除外）；禁止 `onclick` 等内联事件处理器，用 `addEventListener` | 生产环境 CSP 默认拦 inline script；内联样式无法缓存和复用 |
| H4 | 语义标签优先（`header`/`nav`/`main`/`article`/`section`/`footer`），div 嵌套 ≤5 层 | DOM 嵌套深度与代码嵌套（F6 ≤3 层）是不同维度；语义标签是 a11y 和 SEO 的基础 |
| H5 | JS 按 MVC 分层：controller（事件绑定）/ model（纯逻辑，不碰浏览器 API）/ renderer（DOM 操作），分文件 | 纯逻辑可单测；DOM 操作集中在 renderer 才可维护 |
| H6 | 出现第二个页面 -> 立即建项目结构：`pages/` `components/` `css/` `js/`，共享导航/页头/样式提取为公共文件 | "统一组件 + 统一导航 + 统一风格"先于页面数量扩张 |
| H7 | AI 生成的单文件 HTML 转生产用途前必须拆分：重复 UI 块（卡片/列表项/导航）抽为可复用片段或 Web Component | AI 单文件输出的价值是布局结构（60 分初稿）；组件抽象、状态管理、交互闭环必须人工/AI 二次工程化 |
| H8 | 页面 >5 个，或需要路由 / 复杂状态管理 -> 建议迁移 Vite + 框架（React/Vue），不再堆纯 HTML | "项目在变成产品时尽早拆"，纯 HTML 的回报在递减 |

## 通用前端规则（不重复立法）

以下来自 `coding-standards-react` 的通用前端节（FE1-FE3），同样适用于纯 HTML 项目：
- FE1 UI 状态覆盖：loading / empty / error / success 四态
- FE2 用户操作后给即时反馈（加载态/成功/失败提示）
- FE3 键盘可访问、屏幕阅读器友好（`aria-label`、`role`、`alt`、`lang`）

## 自检清单

```
□ HTML <500 行且 CSS <200 且 JS <300？         -> H1 否则 H2
□ 无内联 style / onclick？                      -> H3
□ 语义标签 + div 嵌套 ≤5 层？                   -> H4
□ JS 分 controller/model/renderer？             -> H5
□ 多页面已有 pages/components 结构？            -> H6
□ AI 单文件已拆组件才转生产？                   -> H7
□ >5 页或需路由 -> 已建议迁移框架？             -> H8
```

## 来源

- LightShell《Single-File Apps》指南（阈值：HTML 500 / CSS 200 / JS 300 行）
- htmlfile.cloud《Single-File HTML Apps: Keep One File or Split?》（2026-06）
- web-component-best-practices（HTML/CSS/JS 分文件 + 显式注册模式）
- 2026 多篇 AI 前端工程化实测（SegmentFault / TrueSight / CSDN）：AI 单文件输出的组件化改造路径
