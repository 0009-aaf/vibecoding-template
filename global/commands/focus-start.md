---
description: 声明一个 Focus 焦点：设定目标、文件范围、功能边界和约束条件
agent: plan
subtask: true
---

## Focus 声明: /focus-start

### 会话隔离
生成 SID = `focus-{今日日期}-{4位随机}`。
- Vault = 从 `~/.config/opencode/opencode.json` 的 `references.vault.path` 读取（未配置则询问用户）
- Session 目录 = `{Vault}/_Team/sessions/{SID}`
- Session blackboard = `{Session目录}/blackboard.md`
- Memories 目录 = `{Vault}/_Team/memories/{SID}/`

### 参数格式
$ARGUMENTS 格式: `目标 | 文件: <范围> | 功能: <描述> | 约束: <条件>`

示例: `/focus-start 实现用户认证模块 | 文件: auth/*,db/* | 功能: 认证实现 | 约束: 不改现有API`

### 步骤0: 初始化
1. 创建 Memories 目录: `{Vault}/_Team/memories/{SID}/`
2. 创建 `observations.md`, `reflections.md`, `decisions.md`, `offload/` 子目录
3. 加载跨会话记忆: 读 `{Vault}/_Team/memories/global/decisions.md` 和 `conventions.md`
4. 注入记忆到当前上下文

### 步骤1: 注册 Focus
解析参数为:
- **目标:** {target}
- **文件范围:** {files}
- **功能边界:** {function}
- **约束条件:** {constraints}

写入 session blackboard:
```yaml
focus:
  target: {target}
  files: {files}
  function: {function}
  constraints: {constraints}
  status: in_progress
  started_at: {now}
```

### 步骤2: 边界注入
在系统提示中注入三层边界约束:
1. **文件边界:** 只允许操作 `{files}` 范围内的文件
2. **功能边界:** 只执行 `{function}` 范围内的操作
3. **审计边界:** complete_focus 时检查范围溢出

### 输出
- session blackboard: `{Session目录}/blackboard.md`
- 主 blackboard 注册 SID
- 返回: "Focus [{target}] 已启动，文件范围: {files}"