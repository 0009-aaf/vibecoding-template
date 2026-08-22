---
description: 同步 vault: 将项目决策和文档写入 Obsidian — 决策→30_Decisions/<项目名>/，同步核心文档→20_Projects/，更新日报
---

## /vault-sync — 同步 Obsidian

> 仅用于**有意义的决策**（架构变更、PRD 更新、技术选型），不需要每次切片都跑。

$ARGUMENTS

### 守卫
1. 从 `~/.config/opencode/opencode.json` 的 `references.vault.path` 读取 vault 路径
2. 从当前项目 `AGENTS.md` 或 `docs/01-PRD.md` 读取项目名称（取第一个 `#` 标题，去除空格和特殊字符）
3. 项目名称为空 → 询问用户

### 操作

#### 1. 技术决策（有意义的架构/技术变更）
- 写入 `30_Decisions/<项目名>/YYYY-MM-DD-标题.md`
- 包含：决策内容、备选方案、选择理由、影响范围、session-id
- 与本次切片无关的决策不需要写

#### 2. 同步三份核心文档（可选，需指定 `--sync-docs`）
- `docs/01-PRD.md` → `20_Projects/<项目名>/01-PRD.md`
- `docs/02-ARCHITECTURE.md` → `20_Projects/<项目名>/02-ARCHITECTURE.md`
- `docs/03-STATUS.md` → `20_Projects/<项目名>/03-STATUS.md`

#### 3. 更新今日记录
- 追加到 `10_Daily/YYYY-MM-DD.md`
- 完成事项 + 待办 + 关键决策链接（标注项目名 + session-id）

### 用法
- `/vault-sync` — 只写决策 + 日报（用于有决策变更时）
- `/vault-sync --sync-docs` — 写决策 + 日报 + 同步三份文档（用于 PRD/架构更新时）