---
name: coding-standards-vue
description: Vue 3 编码规范（10 条）。Agent 操作 .vue 文件时自动加载。包含 script setup、Composable、Pinia、模板规范。从 coding-standards §6.4 拆出。
---

# Vue 3 编码规范

> 从 coding-standards v1.8 §6.4 拆出。通用规则见 `coding-standards` skill。

| # | 规则 |
|---|------|
| V1 | 组件名多词PascalCase，模板用 `<PascalCase />` |
| V2 | 唯一写法：`<script setup lang="ts">` |
| V3 | Props/Emits 用泛型语法：`defineProps<Type>()` + `withDefaults`，`defineEmits<Type>()` |
| V4 | Composable 以 `use` 前缀，`readonly()` 保护内部状态 |
| V5 | Composable 内部固定顺序：refs -> computed -> methods -> lifecycle -> watchers |
| V6 | `onUnmounted` 中清理所有副作用（事件/定时器/AbortController） |
| V7 | Pinia 用 Setup Store 语法（ref/computed/function），不用 mutations |
| V8 | `storeToRefs()` 解构 store 保持响应性 |
| V9 | 模板只做声明式渲染，业务逻辑全抽入 composable |
| V10 | Composable 参数用 `MaybeRefOrGetter<T>`，>3 个参数合并为 options 对象 |

## Vue 自检清单（提交前过一遍）

```
□ 组件名多词 PascalCase？                -> V1
□ script setup + lang="ts"？             -> V2
□ Composable 用 use 前缀？               -> V4
□ onUnmounted 清理副作用？               -> V6
□ Pinia 用 Setup Store？                 -> V7
□ 模板只做声明式渲染？                   -> V9
```
