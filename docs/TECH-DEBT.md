# 技术债登记 — vibecoding-template

> 由 /vibe-implement 阶段4 维护（vibe-implement.md 阶段4 + NOTICED BUT NOT TOUCHING 规则的落点）。
> /vibe-audit 对账：代码中 TODO/TBD/FIXME/XXX 必须在此登记；"建议处理时机"到期未处理会被提醒。

| 日期 | 位置(文件:行) | 问题 | 影响 | 建议处理时机 |
|---|---|---|---|---|
| 2026-08-23 | `.opencode/node_modules/` | zod 残留但 package.json 未声明（2026-08-22 审计 S-04 同源） | 仓库体积污染，误导依赖判断 | 下次清理提交时删除并重装 |
| 2026-08-23 | `.ruff_cache/` | Python 缓存目录入仓 | 仓库噪声 | 下次清理提交时删除并加入 .gitignore |
| 2026-08-23 | `global/commands/vibe-plan.md:10` | blackboard.py 等外部 harness 依赖为机器特定路径，第三方机器不可用（审计 D-02） | "复制即开跑"承诺对会话注册不成立 | 未来版本参数化或提供降级 |
| 2026-08-23 | `scripts/check-sync.mjs` S3 | 命令引用校验依赖 COMMAND_NAMESPACE 前缀表，全新命名风格的内部命令引用不被校验 | 新增非 vibe- 前缀命令时需手动扩表 | 出现第一个新前缀命令时 |
| 2026-08-23 | `global/templates/quality-gate-template.js` M16 | 库清单检查依赖 package.json，Python/Go 项目退化 | 非 Node 项目 M16 形同虚设 | 出现第一个非 Node vibe 项目时 |
