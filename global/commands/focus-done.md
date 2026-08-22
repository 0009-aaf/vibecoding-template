---
description: 完成 Focus：记录结论、触发 doubao 观察、清理中间上下文
agent: plan
subtask: true
---

## Focus 完成: /focus-done

### 前置条件
- 必须有活跃的 focus（从 session blackboard 读取）

### 参数格式
$ARGUMENTS 格式: `结论: <摘要> | 决策: <决策> | 遗留: <待办>`

示例: `/focus-done 结论: JWT+refresh token 方案 | 决策: 认证用 Bearer header | 遗留: token轮换待实现`

### 步骤0: 审计边界
读 session blackboard 的 focus 注册信息，检查:
1. 修改的文件是否在 `{files}` 范围内？溢出 → 记录警告但不阻断
2. 实现的功能是否在 `{function}` 范围内？溢出 → 记录警告
3. 是否违反 `{constraints}`？违反 → 记录违规

### 步骤1: 记录决策
将 `{决策}` 写入:
- `{Memories目录}/decisions.md` (会话级)
- `{Vault}/_Team/memories/global/decisions.md` (跨会话，追加)

### 步骤2: 触发 Observer（关键）
调用 doubao MCP `chat` 工具，用以下 prompt 观察当前会话:

```
system: 你是代码助手 observer，任务是从对话中提取关键observation。
提取以下类型:
- decision: 架构/技术决策
- fact: 发现的事实
- preference: 用户偏好/约定
- error: 遇到的错误和解决方案

忽略: 常规感谢、确认、闲聊。输出格式为 markdown 列表，每条标注类型。
```

prompt: "从以下对话中提取 observation:\n\n{最近20条消息摘要}"

### 步骤3: 写入观察
将 doubao 返回的 observation 写入 `{Memories目录}/observations.md`

### 步骤4: 清理中间上下文
1. 标记 focus 期间的大工具输出为可丢弃
2. 超过 5000 chars 的输出 → 移入 `{Memories目录}/offload/`，上下文替换为 `[offload: {path}] [摘要: {2行摘要}]`

### 步骤5: 完成
更新 session blackboard:
```yaml
focus:
  status: done
  completed_at: {now}
  conclusion: {结论}
  decisions: {决策}
  todos: {遗留}
```

### 输出
- 主 blackboard 移到历史
- 返回: "Focus [{target}] 完成。{n} 条 observation 记录，{m} 条决策写入 global 记忆"