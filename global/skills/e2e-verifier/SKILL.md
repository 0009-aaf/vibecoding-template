---
name: e2e-verifier
description: 在浏览器中实际操控应用，验证功能（点击/填表/走流程/断言行为）+ UI（截图+视觉分析）是否符合验收标准。触发词："功能验证"、"E2E验证"、"浏览器验证"、"UI验证"、"浏览器测试"
---

# E2E 验证器

## 核心目标
按切片验收标准验证功能行为和 UI 呈现。支持两种模式：浏览器模式（完整验证）和 CLI 降级模式（HTTP 测试）。

## 输入
- `slices/<编号>/spec.md` 的验收标准
- `docs/02-ARCHITECTURE.md` 的视觉规格
- 应用启动命令（自动探测）

## 输出
- 验证报告（每条验收标准 PASS/FAIL/SKIP + 证据）
- 截图存证到 `references/design/verification/<slice>/`（浏览器模式）

## Step 0: 环境检测（决定模式）

尝试调用 `playwright_navigate`（导航到 `about:blank`）：
- **成功** -> 浏览器模式（Step 1~5 完整流程）
- **失败** -> CLI 降级模式（Step 1~5' HTTP 测试）

> CLI 降级触发场景：纯终端 SSH、无 GUI 服务器、opencode 未配置 browser MCP

## 浏览器模式（Step 1~5）

### Step 1: 启动应用（自动探测 + 端口管理 + 进程追踪）
按顺序探测启动命令：
- `package.json` 有 `scripts.dev` -> `npm run dev`
- 存在 `manage.py` -> `python manage.py runserver`
- 存在 `next.config.*` -> `npm run dev`
- 存在 `vite.config.*` -> `npm run dev`
- 微信小程序 / 其他 -> 询问用户如何启动

**端口冲突处理**：
- 先探测常用端口（3000/3100/5173/8000）是否已有服务在跑
- 已有服务 -> 直接复用，不启动新实例
- 无服务 -> 启动时传动态端口：`PORT=3101 npm run dev` 或 `--port 3101`
- 记录实际使用的 URL

**worktree 端口隔离**：
- worktree 中的 dev server 端口不能与主工作区或其他 worktree 冲突
- 端口分配规则：基础端口 + worktree 编号哈希（如 3100 + hash(slice-001) % 100）
- 或用环境变量 `WORKTREE_PORT` 指定，避免冲突

**进程追踪**：
- 启动应用时记录子进程 PID 到 `references/design/verification/slice-<编号>/server.pid`
  - `<编号>` = 切片编号（如 `001`），与 worktree 路径 `<项目名>-slice-<编号>` 一致
- 验证完成后必须关闭（见 Step 5）
- 如果 Step 5 未能关闭，下次启动前检查 `.pid` 文件，杀掉残留进程

### Step 2: 逐条功能验证（Playwright 实际操控）
对 spec 中每条验收标准：
- 导航到对应页面
- **实际操作**：点击按钮、填写表单、触发交互、走完整流程
- **功能断言**：用浏览器判断行为结果（跳转 URL / 提示文本 / 元素出现 / 数据变化）
- 覆盖：成功路径 + 失败路径 + 边界条件（空输入、错误输入、多次尝试）

### Step 3: 截图存证
- 每个关键状态截图
- 路径：`references/design/verification/<slice>/<状态>.png`
- 例：`login-success.png`、`login-fail.png`、`login-lock.png`、`empty-state.png`

### Step 4: UI 视觉核对（可选，不阻塞）
- **功能优先**：Step 2 的功能断言是核心，Step 4 视觉核对是加分项
- 用 `doubao_analyze_image` 分析截图，核对：布局对齐、配色、导航、空状态、错误提示
- 对照 `docs/02-ARCHITECTURE.md` 视觉规格
- **超时降级**：如果 vision 分析超过 30 秒未返回，跳过视觉核对，报告标记"UI: 跳过（超时）"
- **不阻塞**：视觉核对失败/超时不影响功能断言的 PASS/FAIL 判定
- doubao 不可用时回退 `qwen_vision`，两者都不可用 -> 跳过

### Step 5: 输出验证报告 + 关闭应用

#### 5.1 关闭应用进程
- 读取 Step 1 记录的 PID（`references/design/verification/slice-<编号>/server.pid`）
- 发送 SIGTERM 优雅关闭
- 等待 5 秒，如仍存活 -> SIGKILL 强制关闭
- 删除 `.pid` 文件
- 确认端口已释放（`curl` 探测确认无响应）
- 如果应用是通过 `npm run dev` 启动的，确保子进程树全部关闭

#### 5.2 输出验证报告
```markdown
# 验证报告: slice-001

| 验收标准 | 功能断言 | UI核对 | 截图 |
|----------|---------|--------|------|
| 登录成功跳首页 | ✅ 跳转 | ✅ | login-success.png |
| 登录失败提示 | ✅ 提示 | ⏭️ 跳过 | login-fail.png |
| 连续5次锁定 | ✅ 锁定 | ⏭️ 跳过 | login-lock.png |

结论: ✅ 功能全部通过（UI 核对 1/3 完成，2 个超时跳过）
```

> 注意：功能断言全部 PASS 即可合并。UI 核对超时/跳过不影响合并，仅作参考。

## CLI 降级模式（Step 1~5'）

> 浏览器工具不可用时自动进入此模式。不阻断切片合并，但需人工补充 UI 验证。

### Step 1': 启动应用
- 同浏览器模式 Step 1，探测并启动应用
- 记录 base URL（如 `http://localhost:3101`）
- 同样记录 PID 到 `references/design/verification/slice-<编号>/server.pid`

### Step 2': HTTP 功能测试（API 切片）
对 spec 中每条验收标准，用 `curl` 或 `node -e "fetch(...)"` 验证：
- **成功路径**：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/api/xxx`
- **失败路径**：发送错误数据，检查 4xx 响应码和错误 JSON
- **边界条件**：空 body / 超长字段 / 特殊字符
- 断言：HTTP 状态码 + JSON body 中的关键字段

### Step 3': 纯 UI 切片处理
- 无法用 HTTP 验证的 UI 交互（点击、跳转、视觉呈现）-> 标记 `SKIP`
- 报告中注明"CLI 环境无法验证，需人工确认"
- **不阻断合并**，但 vibe-implement 阶段5 人类验收时需重点检查

### Step 4': 跳过截图和视觉核对
- 无浏览器 -> 无法截图
- 报告中所有截图列标记"CLI 无截图"

### Step 5': 输出 CLI 降级验证报告 + 关闭应用

#### 5'.1 关闭应用进程
- 同浏览器模式 Step 5.1，读取 PID 并关闭应用
- 确认端口已释放

#### 5'.2 输出验证报告
```markdown
# 验证报告: slice-001 (CLI 降级模式)

| 验收标准 | 功能断言 | UI核对 | 截图 |
|----------|---------|--------|------|
| 登录API成功返回token | ✅ 200+token | N/A | CLI 无截图 |
| 登录失败返回422 | ✅ 422+errors | N/A | CLI 无截图 |
| 登录后跳转首页 | ⏭️ SKIP | N/A | 需人工验证 |

结论: ✅ API 功能通过（2/3），1 项需人工 UI 验证
> ⚠️ CLI 降级模式：纯 UI 交互未自动验证，人类验收时需补充
```

## 关键点
- **功能优先**：先断言"行为是否正确"（跳转/提示/数据），再核对"UI 是否好看"
- **覆盖失败路径**：不只测成功，失败和边界同样重要
- **截图即证据**：每条断言配截图，人类验收可直接查看（浏览器模式）
- **CLI 降级不阻断**：浏览器不可用时用 HTTP 测试替代，纯 UI 项标记 SKIP
- **进程必关闭**：无论浏览器模式还是 CLI 降级，验证完成后必须关闭应用进程，释放端口
- **验证不过 -> 报告未通过项**，交给 `/vibe-implement` 修复后再验