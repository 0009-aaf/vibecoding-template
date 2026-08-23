# 接口契约 — [项目名称]

> 全项目接口契约（编号 04）。plan 阶段3 初始化框架，spec 阶段按切片追加契约（`<!-- @slice:N -->` 标记），implement 阶段强制对齐（宪法 C12）。
> 本文档无"变更记录"章节（DOC-STANDARD S4 例外）：变更历史由 @slice 标记与 git 承载。
> 本文档须遵守 `docs/00-DOC-STANDARD.md`。

## 1. 库清单（引用）

> 权威清单在 `docs/02-ARCHITECTURE.md` §6（M16 门禁依据），此处仅镜像摘要，冲突以 ARCH 为准。

| 库 | 版本 | 用途 |
|---|---|---|
| （从 ARCH §6 复制） | | |

## 2. 命名约定（引用）

> 权威约定在 `docs/02-ARCHITECTURE.md` §7（API 路径 camelCase/snake_case、统一术语表）。

- API 路由：`/api/v1/<资源名>`（复数）
- 错误格式：RFC 9457（`type/title/detail`）

## 3. 共享类型

<!-- plan 阶段占位；spec 阶段按切片追加导出类型与共享 schema 结构 -->

```
（示例）export interface User { id: string; email: string; name: string }
```

## 4. 全局错误码注册表

> 每切片新增非 2xx 响应必须在此登记（规则见 slice-spec-writer Step 4.1）；
> 禁止私造未登记错误码、禁止复用他切片语义。/vibe-audit 契约一致性检查核对本表。

| 错误码 | 域 | HTTP | 语义 | UI 文案方向 | 登记切片 |
|---|---|---|---|---|---|
| （如 AUTH-001） | AUTH | 409 | 邮箱已注册 | "该邮箱已注册，试试登录" | 001 |

## 5. API 契约（按切片追加）

> 每切片一个标记区块；端点格式含错误码与性能预算（P95）。

<!-- @slice:001
POST /api/v1/auth/register
  Request: { email: string, password: string }
  Response 200: { user: User, token: string }
  Response 422: { errors: Array<{ field: string, message: string }> }
  错误码: AUTH-001 邮箱重复(409) / AUTH-002 密码强度不足(422)
  性能预算: P95 < 300ms
@slice-end:001 -->
