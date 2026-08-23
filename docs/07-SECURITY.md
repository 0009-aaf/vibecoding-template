# Security Baseline — vibecoding-template

> 安全基线：本地开发工作流模板仓库，无对外服务。多数项"本地工具不适用(理由)"，
> 密钥与供应链两项为硬约束。评审对照基准（/vibe-audit 安全基线对照项）。

## 1. 认证与会话

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 认证方式 | 不适用（本地模板仓库，无运行时服务） | 本地自用 |
| 会话/密码 | 不适用（同上） | |

## 2. 授权与访问控制

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 授权模型 | 不适用（无多用户运行时） | |
| 写保护 | Protected Region（M02）：quality-gate.js、starter AGENTS.md 等由门禁保护，防误改 | ARCH §5 |
| 危险命令 | guard 插件 14 条 DENY_PATTERNS 拦截（rm -rf / del /s / force push 等），矩阵回归验证 | guard-matrix.mjs |

## 3. 密钥与敏感数据

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 密钥扫描 | M01 阻断（sk-/api_key/password/secret/token/private_key），secret-matrix.mjs 矩阵回归 | 硬约束 |
| .env | `.env` 永不入库；仓库只放 `.env.example` 占位 | RUNBOOK §2 |
| opencode.json | 含本地 provider 密钥，不进仓库（sync-global.ps1 显式不触碰） | sync 规则 |
| 前端可见数据 | 不适用（无前端产物） | |

## 4. 输入与接口防护

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 输入校验 | 不适用（无 API 入口）；脚本入口判空由编码规范 S1/P1 约束 | |
| 注入/XSS/CSRF/CORS/限流 | 不适用（本地模板，无对外接口） | |

## 5. 依赖与供应链

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 新库准入 | 模板自身零运行时依赖（Node 内置模块 only）；插件依赖 @opencode-ai/plugin | ARCH §6 |
| 漏洞扫描 | 定期 `npm audit`（范围仅 .opencode/ 插件依赖） | |
| 锁文件 | 不适用（无应用级 package.json 依赖树） | |

## 6. 审计与变更记录

| 项 | 基线 | 依据/理由 |
|---|---|---|
| 安全相关变更 | 过 /vibe-audit 安全基线对照（本文件为基准） | |
| 决策留痕 | 安全取舍记 ADR 到 docs/05-DECISIONS.md | |
| 防御机制必测 | guard/secret 两矩阵（误报/漏报）必须全绿才可发布变更 | AGENTS.md 红线 |

## 变更记录

| 日期 | 变更 | 原因 |
|---|---|---|
| 2026-08-23 | 初版（补 G05.5 门禁项） | 文档生命周期补强：安全基线归属 plan 阶段 |
