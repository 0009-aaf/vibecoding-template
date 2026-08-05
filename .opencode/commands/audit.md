---
description: 审计命令：commit 前检查密钥扫描、Protected Region、变更范围、文档同步
---

## /audit — 提交前审计

### 检查项

#### 1. 密钥扫描（阻断）
- 扫描 `git diff` 中新增的文本
- 正则匹配：`sk-`、`api_key`、`password`、`secret`、`token`、`private_key`
- 发现密钥 → 阻断并报告位置

#### 2. Protected Region 检查（阻断）
- 读取 `docs/02-ARCHITECTURE.md` 的 Protected Region 标记
- 检查 `git diff` 是否修改了标记文件
- 发现修改 → 阻断并报告

#### 3. 变更范围检查（警告）
- 对比本次变更涉及的文件和任务指定的文件
- 超出范围 → 警告并列出额外文件

#### 4. 文档同步检查（警告）
- 检查 `docs/01-PRD.md` 和 `docs/02-ARCHITECTURE.md` 是否需要更新
- 需求变更但文档未同步 → 警告

### 产出
审计报告格式：
```
## 审计报告

### 密钥扫描: ✅ 通过 / ❌ 阻断
### Protected Region: ✅ 通过 / ❌ 阻断
### 变更范围: ✅ 通过 / ⚠️ 警告
### 文档同步: ✅ 通过 / ⚠️ 警告

### 结论: ✅ 可提交 / ❌ 需修复
```