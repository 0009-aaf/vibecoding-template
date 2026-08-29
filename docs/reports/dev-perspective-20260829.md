# 开发者视角架构评估报告

- 日期: 2026-08-29
- 视角: 一名开发者使用本工作流（vibe-plan → spec → implement → audit）做真实项目的上手体验与架构评价
- 触发: 用户询问"作为开发者使用这套流程会怎么评价和优化"
- 结论: 架构理念不落后、工程素养高（机器校验/宪法/矩阵是亮点）；两个真实缺口——模板仓的"复制即开跑"承诺不成立、轻量路径的真实轻量不足

---

## 一、流程全貌（一句话版）

```
/vibe-plan ──> /vibe-spec ──> /vibe-implement ──> /vibe-audit
  导需求→PRD→架构→安全→   拆垂直切片+依赖图   测试先行→实现→gate→   密钥/契约/范围/测试/
  设计→契约→宪法→规范→      →每切片spec       Converge→浏览器验证→   文档/UI/DoD 双闸门
  quality-gate                              →验收→合并
                    └── /vibe-status（旁路）──> /vibe-clean（残留恢复）
```

六类底层机制：宪法（13 条不可协商）+ 门禁（quality-gate + DoD 双闸门）+ 防漂移（check-sync S1-S8 + 三副本哈希锁）+ 防御矩阵（guard/secret/redline 回归）+ 并行安全（worktree + 锁 + rebase）+ 记忆（vault-sync + blackboard）。

## 二、完善度评价

### ✅ 真正做对的（认可且罕见）

1. **文档防腐是机器校验而非自觉**：check-sync S1-S8 + 三副本哈希锁直接治本，多数项目文档烂是"靠人记着同步"
2. **宪法 + 门禁双层**：软性 AGENTS 约定 + 硬性 constitution 不可协商，违背即否决——分层正确
3. **fast/full/loop 三档**：已意识到"一刀切重流程"问题，方向正确（执行还不彻底）
4. **防御矩阵必测 + 单一真源**：安全规则"写了必须实测"，工程素养
5. **dogfooding**：自家用自家流程，docs/ 即活证据，能自曝问题

### ⚠️ 真实开发者会卡住的点

1. **机制密度 vs 产出价值不成比例**（最核心）：切一个"改文案"的 fast 切片仍要过 DoD/gate/CHANGELOG/TECH-DEBT/STATUS 同步。文档维护税 > 开发产出税，单人短周期项目会被启动成本劝退
2. **"复制即开跑"承诺不成立**（模板仓命门）：blackboard.py / reflect.py / checks.py / gate.py 全在 `~/.claude/harness/`（git 追踪但不随仓库分发），TECH-DEBT 自曝机器路径硬编码。新机器复制 starter-template 后 workflow 一半依赖是断的
3. **规则膨胀有自我强化趋势**：每次审查发现边界就加规则/用例/矩阵项（G05.7 活例），规则库无"删除"路径
4. **check-sync 是单点但无自测**：所有防漂移依赖它，它自己没有防御矩阵
5. **认知负荷过高**：宪法13条+6底线+播报+执行锚+Converge+doubt+反合理化×4+DoD 双闸+稠密轨，新用户记不住，靠"硬性输出义务"强推 → 易退化为机械合规
6. **分层记忆/评估落地有限**：REVISION-PLAN 承认 R-03/04/05 为 P2 且部分未做，置信度衰减、traces→golden-case 飞轮仍是半成品

## 三、优化建议（按优先级）

### P0：补"最小模式"，让轻量真正轻
- 现 fast 只跳过 worktree/锁，**文档链义务不减**。加 `--solo`（单人模式）：跳过 blackboard/记忆/播报/STATUS 同步，只留 gate + DoD
- 判定：改动 ≤2 文件且无文档实体变化 → 自动降级，收尾提示"是否需要补文档"而非强制

### P1：把 harness 收进仓库，兑现"复制即开跑"
- `~/.claude/harness/` 下被 workflow 依赖的脚本并入 `global/harness/` 或 starter，sync-global 一起分发
- 无法并入则 README/runbook 明示"前置依赖"，隐式依赖变显式

### P1：给 check-sync 加自测（S9：S 系列自身用 fixtures 回归，与 guard/secret 矩阵同构）

### P2：机制"关掉"要有显式动作
- 每条软层机制（播报/Converge/doubt）在命令文件写"何时可以不做 + 谁批准不做"，而非默认永远做

### P2：分层记忆真正落地（补 R-03/04，置信度衰减 + golden-case 飞轮）

### 克制（不做的事）
- 不加更多门禁/规则——问题不是缺机制而是机制太多；扩展前先回答"它防的是哪次真实事故"

## 四、本次落地

- 评估留痕：本报告
- P0 最小模式：`/vibe-implement --solo` 落地（见 CHANGELOG 与 vibe-implement.md）
- P1/P2 项登记 TECH-DEBT 备查，不一次性全做

*报告生成: 2026-08-29 | 只读评估 + P0 落地*
