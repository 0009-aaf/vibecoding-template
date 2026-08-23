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

## ADR-002: 文档按生命周期分配——plan 产基线，implement 增量维护

- 日期: 2026-08-23 | 状态: Accepted
- **Context**: 审计发现 4 类文档缺口（安全基线/CHANGELOG/技术债/API 文档）。全塞进 plan 会违反反臃肿原则且信息倒流——CHANGELOG 与技术债的信息在实现期才产生。
- **Decision**: 按"信息在哪产生，文档就在哪维护"分配：安全基线（07-SECURITY.md）归 plan 阶段3（与架构选型同生命周期，G05.5 门禁）；CHANGELOG 与技术债（TECH-DEBT.md）归 vibe-implement 阶段4/6 增量维护；API 文档不新增（04-CONTRACTS 的 @slice 机制已覆盖）。
- **Alternatives**: 全部塞进 plan（信息倒流+膨胀）/ 全部留给人工（无落点即丢失，NOTICED BUT NOT TOUCHING 曾无 sink）
- **Consequences**: + plan 产出聚焦基线类文档，实现期文档有强制落点；- implement 流程多两步轻量登记
- **Verification**: G05.5 存在性校验 + audit TBD/TECH-DEBT 对账 + 本仓库 dogfood 实例（07-SECURITY/08-CODING-STANDARDS/06-RUNBOOK/CHANGELOG/TECH-DEBT 均已生成）

## ADR-003: 防漂移机制——机器校验替代人工同步约定

- 日期: 2026-08-23 | 状态: Accepted
- **Context**: G06 检查在模板源加入后两份 quality-gate 副本未同步（漂移真实发生），且 03-STATUS 声称的"MD5 一致"约定无机器校验；用户痛点"同步更新的文档有时候不会自动更新"。
- **Decision**: 新增 scripts/check-sync.mjs 五项检测（S1 三份 quality-gate 强制注册 ID+配置区剥离哈希双指标 / S2 过期引用归零 / S3 悬空命令引用 / S4 全局部署滞后警告 / S5 双源 sync-hash），由 vibe-gate 插件在 git commit 前强制执行（通用机制：任何仓库放 scripts/check-sync.mjs 即生效），vibe-audit 增加漂移检测检查项。
- **Alternatives**: 继续 MD5 人工约定（已失效过一次）/ CI 远程校验（本地模板仓库无 CI 场景）
- **Consequences**: + 漂移在 commit 时被拦截，S1 双指标连注释级行差异都能抓住（实测：故意漂移与历史遗留 // === 主流程 === 行差均命中）；- commit 路径多一次脚本执行（<1s）
- **Verification**: 故意删副本检查项 ID → check-sync exit 1 并定位到文件；还原后 exit 0（已实测）
