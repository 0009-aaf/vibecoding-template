---
name: coding-standards-react
description: React 编码规范。Agent 操作 .tsx/.jsx 文件时自动加载。编写 React 组件时使用。
---

# React 编码规范

## 触发条件

Agent 操作 `.tsx` / `.jsx` 文件时自动加载。编写 React 组件时使用。

## React (15 条)

| # | 规则 |
|---|------|
| R1 | 一律函数组件 + TypeScript，不用 class |
| R2 | tsconfig `"jsx": "react-jsx"`，不显式 import React |
| R3 | Props 用 `interface`，其余用 `type` |
| R4 | Required 优先，可选有默认值；React 19 不用 `defaultProps` |
| R5 | children 用 `ReactNode`；扩展原生用 `ComponentPropsWithoutRef<'>` |
| R6 | Hooks 只在一级调用；依赖数组照实声明，不 suppress exhaustive-deps |
| R7 | 能用派生值就不用 `useState`；能用事件处理就不用 `useEffect` |
| R8 | `useMemo`/`useCallback`/`React.memo` 先测量再用；Compiler 开启后删除手动 memo |
| R9 | useEffect 必须返回 cleanup；fetch 用 AbortController 防竞态 |
| R10 | 状态管理分层：本地→Zustand→Redux Toolkit；服务端用 TanStack Query |
| R11 | 单个组件单一职责，沿状态边界拆分 |
| R12 | key 用数据 ID 不用数组索引 |
| R13 | `lazy()` 按路由分割，不懒加载小组件 |
| R14 | 条件渲染：守卫用 early return，二选一三元，显示/隐藏 `&&`（警惕数字 0） |
| R15 | Props 用 `on*` 前缀，处理函数用 `handle*` 前缀；不直传 setState |

## 通用前端 (3 条)

| # | 规则 |
|---|------|
| FE1 | UI 状态覆盖：loading / empty / error / success 四种状态 |
| FE2 | 用户操作后给即时反馈（加载态/成功/失败提示） |
| FE3 | 键盘可访问、屏幕阅读器友好（`aria-label`、`role`、`alt`） |
