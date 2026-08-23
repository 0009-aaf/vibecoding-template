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

## ADR-004: 文档规范体系化（00-DOC-STANDARD + S6 机器校验）

- 日期: 2026-08-23 | 状态: Accepted
- **Context**: 文档数量增长至 10 编号 + 4 无编号后，结构/编号/引用格式无成文规范，靠惯例维护必然漂移（编号冲突 06 双用已是先例）。
- **Decision**: 编号 00 为元规范层：`docs/00-DOC-STANDARD.md` 定义编号体系（含白名单与无编号例外）、必备四件（H1/引言/编号章节/变更记录）、内容规范（数值带单位/不适用带理由/禁空洞词）、交叉引用与术语统一、反臃肿（章节 ≤10）；由 check-sync 新增 S6 强制（编号白名单防野编号、四件缺失即阻断、模板侧变更记录占位校验）。
- **Alternatives**: 规范写在 AGENTS.md（与 AI 行为约定混杂，非文档规范专责）/ 不成文靠 review（已证明会漂移）
- **Consequences**: + 新文档有统一模板与机器校验，存量 10 份已合规整改；- 新增文档多一道结构门槛（S6 即时反馈，成本低）
- **Verification**: S6 上线即抓到 03-STATUS 缺引言与 CONTRACTS 模板缺占位两处真实问题；野编号文件（docs/10-TEST.md）实测 exit 1 拦截，清理后恢复

## ADR-005: 引入界面设计文档（09-DESIGN）与项目宪法（constitution.md）

- 日期: 2026-08-23 | 状态: Accepted
- **Context**: 对照 Kiro（design.md 含 UI 节）与 GitHub Spec Kit（constitution.md 实践）发现两类缺口：视觉决策散落 PRD §2 几行字，AI 实现 UI 无一致性锚点；不可协商原则散落 AGENTS/DoD/反合理化表，无单一最高约束。
- **Decision**: ①`docs/09-DESIGN.md`（设计令牌/页面清单/组件复用/交互五态/响应式/无障碍基线，vibe-plan 阶段4 生成，G05.6 门禁校验存在性[判定与 M18 共用 isUiFile]，audit 增视觉走查，UI 切片 spec 强制引用其条目）；②`constitution.md` 项目根（13 条全部提炼自既有约定不发明新规则，4 个 vibe 命令守卫注入"违背即否决"，变更须 ADR[C13]，vibe-plan 阶段5 生成且增量保护）。同步引入 04-CONTRACTS 独立模板（含全局错误码注册表，治跨切片错误码冲突）。
- **Alternatives**: 视觉继续留在 PRD §2（信息密度不足，五态/令牌无处安放）/ 宪法并入 AGENTS.md（AGENTS 是 AI 入口约定，宪法是人与 AI 共同底线且须 ADR 变更，层级不同）
- **Consequences**: + UI 实现有令牌/五态/断点锚点，错误码跨切片唯一，13 条底线可一键引用；- plan 期产出从 11 项增至 14 项（每项均允许"不适用(理由)"，反臃肿原则延续）
- **Verification**: G05.6 三份门禁同步且 S1 哈希一致；本仓库 dogfood 09-DESIGN（整体不适用留档）与 constitution 已生成并过 S6；架构设计器与 ARCH-template 双源同步（sync-hash 3→4）由 S5 校验相等
