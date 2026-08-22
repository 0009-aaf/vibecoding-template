---
description: 状态命令：一键查看项目全貌 - 切片进度、活跃会话、阻塞项、残留检测、清理建议
---

## /vibe-status - 项目状态

### 读取
1. `slices/README.md` - 切片列表和锁状态
2. `docs/03-STATUS.md` - 项目阶段和上下文
3. `_Team/blackboard.md` - 活跃会话（如可访问）
4. `git worktree list` - 活跃 worktree（并行切片隔离）
5. `git branch` - 残留切片分支
6. 主工作区 `.merge-lock-*` 文件 - 残留合并锁
7. `.vibecoding/dense-track.md` - 稠密轨状态（存在则读取，缺失则跳过）

### 残留检测（新增）
检测以下异常并报告：
- **worktree 残留**：worktree 存在但 `slices/README.md` 中对应切片状态为"已完成"
- **分支残留**：`slice/*` 分支存在但对应 worktree 已删除
- **锁残留**：`slices/README.md` 中 session-id 非空但 blackboard 无对应会话
- **合并锁残留**：主工作区有 `.merge-lock-*` 文件但对应切片已"已完成"
- **blackboard 残留**：blackboard 有活跃会话但对应 worktree 不存在

检测到残留 -> 在输出中标注，建议运行 `/vibe-clean` 清理

### 输出格式

```
═══════════════════════════════════════════
  项目状态: [项目名]
═══════════════════════════════════════════

📊 切片进度
  ✅ 已完成: 2/5
  🔄 待验收: 1  (slice-003 report, session: impl-003-...)
  🔄 进行中: 1  (slice-004 export, session: impl-004-...)
  ⏳ 待开始: 1  (slice-005 sync, 前置: 004)
  🚫 阻塞:   0

🔒 活跃锁
  slice-003 -> impl-003-20260807-b7k9 (分支: slice/003-report)
  slice-004 -> impl-004-20260809-c2d5 (worktree: ../app-slice-004)

📝 当前阶段
  开发中

🛤️ 稠密轨（.vibecoding/dense-track.md）
  <SID>: ✓ schema ✓ repository ? handler ✗ ui
  (详情: 回复"展开 <层> 详情"读取该层证据与根因)

⚠️ 残留检测
  ⚠️ worktree 残留: ../app-slice-002 (切片 002 已完成，worktree 未清理)
  ⚠️ 分支残留: slice/old-feature (对应 worktree 不存在)
  ⚠️ 合并锁残留: .merge-lock-001

💡 建议
  可并行: slice-005（无锁、前置已完成）
  等待中: 无
  
  🔧 清理: 检测到 3 个残留，建议运行 /vibe-clean 清理
═══════════════════════════════════════════
```

### 逻辑
- 统计各状态数量（已完成/待验收/进行中/待开始/阻塞）
- 阻塞判定：前置依赖未完成
- 残留检测：worktree/分支/锁/blackboard 交叉验证
- 稠密轨（渐进披露）：读取 dense-track.md，**默认只显示索引行**（`✓/?/✗ <层>` 一层一行），
  证据/根因/验证覆盖等详情**不默认加载**（省 token）；用户回复"展开 <层> 详情"时才读取展开
  文件缺失或为空时区块显示"无"
- 建议下一步：列出"无锁 + 前置已完成"的切片，可立即开始
- 有残留时建议运行 `/vibe-clean`
