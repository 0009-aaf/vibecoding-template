# 技术债登记 — vibecoding-template

> 由 /vibe-implement 阶段4 维护（vibe-implement.md 阶段4 + NOTICED BUT NOT TOUCHING 规则的落点）。
> /vibe-audit 对账：代码中 TODO/TBD/FIXME/XXX 必须在此登记；"建议处理时机"到期未处理会被提醒。

| 日期 | 位置(文件:行) | 问题 | 影响 | 建议处理时机 |
|---|---|---|---|---|
| 2026-08-23 | `.opencode/node_modules/` | zod 残留但 package.json 未声明（2026-08-22 审计 S-04 同源） | 仓库体积污染，误导依赖判断 | 下次清理提交时删除并重装 |
| 2026-08-23 | `.ruff_cache/` | Python 缓存目录本地残留（git 未追踪、.gitignore 已覆盖——对账更新：入仓问题不存在，仅磁盘噪声） | 仓库噪声 | 下次清理提交时删除 |
| 2026-08-23 | `global/commands/vibe-plan.md:10` | blackboard.py 等外部 harness 依赖为机器特定路径，第三方机器不可用（审计 D-02） | "复制即开跑"承诺对会话注册不成立 | 未来版本参数化或提供降级 |
| 2026-08-23 | `scripts/check-sync.mjs` S3 | 命令引用校验依赖 COMMAND_NAMESPACE 前缀表，全新命名风格的内部命令引用不被校验 | 新增非 vibe- 前缀命令时需手动扩表 | 出现第一个新前缀命令时 |
| 2026-08-23 | `global/templates/quality-gate-template.js` M16 | 库清单检查依赖 package.json，Python/Go 项目退化 | 非 Node 项目 M16 形同虚设 | 出现第一个非 Node vibe 项目时 |
| 2026-08-23 | `global/commands/vibe-README.md:80,83,143` | 硬编码 `C:\Users\fms\...` 机器路径 ×3（审计 D-02 收敛后残留，未入账） | 他机部署时路径失效 | 下次触碰 vibe-README 时参数化 |
| 2026-08-23 | ~~`AGENTS.md`（根）~~ | 已处理：滞后于文档体系（未引用 constitution.md、核心文档清单缺 00/04-09/TECH-DEBT、切片路径口径不一致）——2026-08-26 整篇重写对齐（constitution 引用/文档清单含 04 缺席说明/`<编号>-<名称>` 口径/浏览器验证与播报工作流/UI 红线节） | 无 | 已闭环 |
| 2026-08-23 | `global/plugins/vibe-gate/index.mjs:23-49` | findVibeGate/findCheckSync 同构重复（仅目标子路径不同） | 修 bug 需同步改两处 | 下次改插件时提取 findUp 通用函数 |
| 2026-08-23 | `global/plugins/clawd-bridge/index.mjs`（8 处空 catch） | fire-and-forget 吞异常完全静默（对比 vault-sync 至少有 debugLog） | 排障时日志空白 | 下次触碰对应函数时补 debugLog |
| 2026-08-23 | `global/plugins/vision-bridge/index.mjs:144-159,190-200` | 多图串行 await（N 张最坏 40N 秒）+ 探测用 readFileSync 全量读（20MB 截图双读） | 消息发送阻塞、IO 浪费 | 出现多图消息卡顿报告时 |
| 2026-08-23 | ~~`global/skills/coding-standards/SKILL.md:26,178`、`coding-standards-shell:21`~~ | 引用不存在的 skill（karpathy-guidelines / code-review-and-quality）与 CLAUDE.md 残留（本体系是 AGENTS.md）——**已处理**：悬空引用改指真实体系（constitution/§九 RV1-RV4/宪法 C2），CLAUDE.md 措辞改指宪法 C3，并纳入 check-sync S7 机器校验防复发 | 悬空引用误导加载 | 已闭环 |
| 2026-08-23 | 三套 "M" 编号体系 | coding-standards 元规则 M1-M6 / §十二 M1-M23 / quality-gate M01-M20 同前缀不同义 | 编号引用歧义（X4 要求编号原样引用） | 编号体系下次改造时（元规则改前缀） |
| 2026-08-23 | `scripts/sync-global.ps1:65-67` | 同步只增不删：部署侧孤儿文件无检测（S4 仅单向对比）；node_modules 删除遇锁会中止 | 幽灵插件继续加载、同步非原子 | 下次改同步机制时（robocopy /MIR 方案） |
| 2026-08-23 | `global/skills/e2e-verifier/SKILL.md:12` | 切片路径旧约定 `slices/<编号>/spec.md`，主约定已是 `<编号>-<名称>`（quality-gate M19 兼容两种才未触发） | 新读者按旧约定找不到目录 | 下次修订 e2e-verifier 时对齐 |
| 2026-08-26 | `global/templates/quality-gate-template.js` G05.7 | 扫描器拦 `<img>` 标签与位图扩展名，但 `background-image:url(icons.svg)` 这类外链矢量变体未计入（红线原文要求图标一律内联 SVG，正则未覆盖 svg 后缀） | 外链 .svg 图标可绕过 G05.7 | 出现第一个滥用案例时把 bg-bitmap 正则纳入 `.svg` 变体并加矩阵用例 |
