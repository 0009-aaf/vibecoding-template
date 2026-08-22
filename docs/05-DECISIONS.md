# ADR 决策记录 — Vibecoding 开发架构模板

> 每条 ADR：Context / Decision / Alternatives / Consequences / Verification。
> 新决策追加，不修改旧 ADR 的 Decision（历史留痕）。

## ADR-001: 灾备采用 Git 即代码灾备

- 日期: 2026-08-18 | 状态: Accepted
- **Context**: 模板项目是纯配置/Markdown 项目，无数据存储，无在线服务；唯一需要保护的是文档与配置本身。
- **Decision**: Git 即代码灾备（D9 ⭐）——仓库多副本 + 可回滚，不做备份/异地/多活。
- **Alternatives**: 3-2-1 备份（无数据可备，过度设计）/ 云托管（无在线服务，无意义）
- **Consequences**: + 零成本、天然多副本可回滚；- 不含运行时数据（本项目无运行时数据）
- **Verification**: 从 git clone 全新副本即可完整恢复（验证通过）
