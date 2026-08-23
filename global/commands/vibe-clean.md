---
description: 清理命令：检测并清理 worktree 残留、分支残留、锁残留、合并锁残留、blackboard 残留
---

## /vibe-clean - 崩溃恢复清理

### 会话隔离
生成 SID = `clean-{今日日期}-{4位随机}`。注册：`python ~/.claude/harness/blackboard.py register <SID> "vibe-clean (<清理摘要>)"`

### 守卫
$ARGUMENTS 可选指定清理目标：
- 空 -> 全量扫描 + 交互式确认
- `--force` -> 全量扫描 + 自动清理（不询问，但**跳过有活跃 PID 的 worktree**）
- `--scan-only` -> 只扫描不清理，输出报告
- `--fix-status` -> 只修复状态不一致（代码已合并但状态未更新），不删 worktree

### 阶段1: 扫描残留

#### 1.1 worktree 残留
- `git worktree list` 获取所有 worktree
- 对每个 worktree，提取切片编号
- **PID 检查**：检查 worktree 内是否有 `references/design/verification/slice-<编号>/server.pid`
  - `<编号>` = 切片编号（如 `001`、`006`），与 worktree 路径 `<项目名>-slice-<编号>` 一致
  - PID 文件存在且进程仍在运行 -> 标记"有活跃 dev server"，`--force` 模式跳过此 worktree
  - PID 文件存在但进程已退出 -> 可安全清理
  - 无 PID 文件 -> 可安全清理
- 检查 `slices/README.md` 中对应切片状态：
  - `已完成` -> worktree 残留（应已清理）
  - `进行中` 且 blackboard 有对应会话 -> 正常，跳过
  - `进行中` 但 blackboard 无对应会话 -> 崩溃残留
  - `待开始` -> 异常（worktree 不该存在）

#### 1.2 分支残留
- `git branch` 获取所有 `slice/*` 分支
- 对每个分支，检查对应 worktree 是否存在：
  - worktree 不存在 -> 分支残留
  - 检查分支是否有未合并的 commit：`git log main..slice/<编号>`
    - 有未合并 commit -> 提示用户"分支有未合并代码，是否创建 backup 分支？"
    - 无未合并 commit -> 安全删除

#### 1.3 锁残留
- 读取 `slices/README.md`，找出 session-id 非空但状态不是"进行中"的切片
- 读取 `_Team/blackboard.md`，检查对应 session 是否存在
- session-id 非空但 blackboard 无对应 -> 锁残留

#### 1.4 合并锁残留
- 扫描主工作区 `.merge-lock-*` 文件
- 对每个锁文件，提取切片编号
- 检查 `slices/README.md` 中对应切片状态：
  - `已完成` -> 合并锁残留（合并完成但锁未删）
  - `进行中` -> 合并进行中（如无对应活跃会话则为残留）

#### 1.5 blackboard 残留
- 读取 `_Team/blackboard.md` 活跃会话表
- 对每个会话，检查对应 worktree 是否存在
- 会话存在但 worktree 不存在 -> blackboard 残留

### 阶段2: 输出扫描报告

```
═══════════════════════════════════════════
  清理扫描报告
═══════════════════════════════════════════

🔍 检测到 4 个残留：

1. [worktree 残留] ../app-slice-002
   切片: 002-profile | 状态: 已完成
   原因: 切片已完成但 worktree 未清理
   
2. [分支残留] slice/old-feature
   未合并 commit: 3 个
   ⚠️ 有未合并代码，建议创建 backup 分支
   
3. [锁残留] slice-003
   session-id: impl-003-20260807-b7k9
   原因: blackboard 无对应会话
   
4. [合并锁残留] .merge-lock-001
   切片: 001-auth | 状态: 已完成
   原因: 合并完成但锁未删除

═══════════════════════════════════════════
```

### 阶段3: 交互式清理（非 --force 模式）

对每个残留，用 question 工具询问用户：

#### 3.1 worktree 残留清理
```
"检测到 worktree 残留: ../app-slice-002（切片 002 已完成）
 清理选项:
 1. 删除 worktree（推荐）
 2. 保留（我手动处理）
 3. 查看详情"
```
- 选择 1 -> `git worktree remove --force ../app-slice-002`
- 删除失败 -> 记录警告，继续下一个

#### 3.2 分支残留清理
```
"检测到分支残留: slice/old-feature（3 个未合并 commit）
 清理选项:
 1. 创建 backup 分支后删除（推荐）
 2. 直接删除（丢弃未合并代码）
 3. 保留"
```
- 选择 1 -> `git branch backup/old-feature-<日期>` -> `git branch -D slice/old-feature`
- 选择 2 -> `git branch -D slice/old-feature`

#### 3.3 锁残留清理
- 编辑 `slices/README.md`，清空对应切片的 session-id
- `git add slices/README.md && git commit -m "clean: clear stale lock for <切片>"`

#### 3.4 合并锁残留清理
- `node -e "try{require('fs').unlinkSync('.merge-lock-<编号>')}catch(e){}; try{require('fs').unlinkSync('.slice-lock-<编号>')}catch(e){}"`

#### 3.5 blackboard 残留清理
- 编辑 `_Team/blackboard.md`，移除无对应 worktree 的会话

### 阶段4: 验证清理结果
- 重新扫描（阶段1）-> 确认所有残留已清理
- 仍有残留 -> 报告未能清理的项和原因
- 运行 `git worktree list` 确认 worktree 列表干净
- 运行 `git branch` 确认无残留分支

### 阶段5: 恢复中断的切片（可选）
如果有切片状态为"进行中"但 worktree 不存在（崩溃导致）：
- 用 question 工具询问用户：
  "切片 003 实现中断，是否恢复？
   1. 重新开始（创建新 worktree，从头实现）
   2. 标记为待开始（清理状态，稍后再做）
   3. 跳过"
- 选择 1 -> 清空 session-id，状态改回"待开始"，提示用户运行 `/vibe-implement 003`
- 选择 2 -> 清空 session-id，状态改回"待开始"

### 阶段6: 修复状态不一致（--fix-status 模式）
检查"代码已合并但状态未更新"的情况：
- 对每个状态为"待验收"或"进行中"的切片：
  - `git log main --oneline | grep "feat: <编号>"` 检查 main 是否包含该切片的 commit
  - 包含 -> 代码已合并但状态未更新 -> 自动修复：
    1. 编辑 `slices/README.md`：状态改为"已完成"，清空 session-id
    2. 编辑 `docs/03-STATUS.md`：标记切片为"已完成"
    3. `git add && git commit -m "fix-status: <编号> already merged"`
    4. 删除残留锁文件（.slice-lock-<编号>、.merge-lock-<编号>）
  - 不包含 -> 跳过

### 收尾
- 输出清理总结：清理了哪些项、保留了哪些项
- 从 blackboard 移除本会话：`python ~/.claude/harness/blackboard.py archive <SID>`
- 提示用户运行 `/vibe-status` 确认状态正常
