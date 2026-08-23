---
name: coding-standards-ts
description: TypeScript 编码规范（10 条）。Agent 操作 .ts/.tsx 文件时自动加载。包含类型安全、strict 模式、运行时校验、CI 阻断规则。从 coding-standards §6.1 拆出。
---

# TypeScript 编码规范

> 从 coding-standards v1.8 §6.1 拆出。通用规则见 `coding-standards` skill。

| # | 规则 |
|---|------|
| TS1 | 禁止 `any`，未知类型用 `unknown`->类型收窄 |
| TS2 | 函数参数/返回值显式类型，不让 TS 推断公共 API 类型 |
| TS3 | `strict` 模式开启 |
| TS4 | `as` 类型断言仅在确保安全的窄化场景使用 |
| TS5 | 用 `@ts-expect-error` 禁用错误（错误消失时 TS 会警告），禁止 `@ts-ignore` |
| TS6 | 开启 `noUncheckedIndexedAccess` - 数组/对象按索引访问自动加 undefined，防止越界崩溃 |
| TS7 | 领域模型与传输层类型分离：API/DTO 类型 ≠ 内部领域类型，在边界处做映射和校验 |
| TS8 | 编译时类型 ≠ 运行时安全：所有外部数据入口用 zod/yup/valibot 等运行时校验 |
| TS9 | CI 中 `tsc --noEmit` 阻断新类型错误，遗留 `any` 计数只减不增 |
| TS10 | `const` 默认，需重赋值才用 `let`，禁止 `var` |

## TS 自检清单（提交前过一遍）

```
□ 没有 any / 类型安全？                   -> TS1 TS2
□ 运行时校验外部数据？                    -> TS8
□ tsc --noEmit 通过了？                   -> TS9
□ noUncheckedIndexedAccess 开启了？       -> TS6
□ 领域模型与 DTO 类型分离了？             -> TS7
```
