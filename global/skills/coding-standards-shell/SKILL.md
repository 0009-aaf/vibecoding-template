---
name: coding-standards-shell
description: Shell 脚本编码规范（bash + PowerShell，12 条）。Agent 编写 .sh/.ps1/.bat 脚本时自动加载。严格模式、入口判空、trap 清理、破坏性命令防护、PS 5.1 兼容陷阱、非交互执行。来源：LibreDevOps Bash Standards / Microsoft Learn PSScriptAnalyzer（2026）+ 本机实测。
---

# Shell 脚本编码规范（bash + PowerShell）

> 适用：作为交付物的脚本（.sh / .ps1 / .bat）。通用规则见 `coding-standards`。
> AI 生成脚本的通病：无严格模式、变量不加引号、无清理、`rm -rf` 无防护、交互命令在无 TTY 环境挂死。

## 规则

### 共通（SH1-SH7）

| # | 规则 | 触发点/说明 |
|---|------|-----------|
| SH1 | 脚本顶部开严格模式 | bash: `set -Eeuo pipefail` 加 `IFS=$'\n\t'`；PS: `Set-StrictMode -Version 3.0` 加 `$ErrorActionPreference = 'Stop'`（脚本内用固定版本号，Latest 跨版本不确定） |
| SH2 | 入口判空: 参数/环境变量必填校验，fail-fast | bash: `${VAR:?VAR is required}`、参数个数不足时打印 usage 退出 2；PS: `[Parameter(Mandatory)]` 加 `[ValidateNotNullOrEmpty()]`，可叠加 `[ValidateSet()]` / `[ValidatePattern()]` |
| SH3 | 临时文件用 `mktemp -d` / `New-TemporaryFile`，禁止硬编码 /tmp 路径 | 清理放 EXIT trap（bash）/ finally（PS）；bash 先 `local x` 再赋值（`local x="$(cmd)"` 会吞退出码） |
| SH4 | 破坏性命令防护（rm -rf / Remove-Item -Recurse） | 目标路径先校验非空（bash 用 `"${dir:?}"` 防空变量展开成 `/`）；提供 --dry-run；关键步骤前记日志；部署类脚本要有回滚路径 |
| SH5 | 禁 `eval` / `Invoke-Expression`；catch 必处理 | 命令含用户输入时必须白名单校验；空 catch 直接违反项目宪法 C3（`constitution.md`，catch 必处理） |
| SH6 | 结构: bash 用 main() 加 source guard；PS 用 Approved Verbs 函数 | bash: `main "$@"` 且 `if [[ "${BASH_SOURCE[0]}" == "$0" ]]` 包裹（可被 source 测试）；PS 函数名 `Verb-Noun`；脚本超 300 行改用 Python/TS |
| SH7 | 静态检查为门禁 | bash: `shellcheck` 零警告，disable 用行级注释并注明理由；PS: `Invoke-ScriptAnalyzer`（PSGallery preset），抑制用 `[SuppressMessageAttribute]` 加 Justification |

### bash 专项（SH8）

| # | 规则 | 触发点/说明 |
|---|------|-----------|
| SH8 | 变量与替换全加引号: `"$var"` `"$(cmd)"` `"$@"` | 未加引号会按 IFS 分词（SC2086）；列表用数组 `"${arr[@]}"` 而非空格拼接字符串；shebang 用 `#!/usr/bin/env bash` |

### PowerShell 专项（SH9-SH10）

| # | 规则 | 触发点/说明 |
|---|------|-----------|
| SH9 | PS 5.1 兼容: 无 `&&`/`||`（用 `; if ($?) {}` 或 if 语句）；双引号内反引号是转义符 | 内嵌代码（node -e 等）引号地狱 -> 改写临时 .js 文件再执行；字符串优先单引号 |
| SH10 | 输出编码: **不要依赖** `[Console]::OutputEncoding`/`$OutputEncoding`/`chcp 65001`（AI 工具环境实测无效：stdout writer 已建、工具读原始字节流按 UTF-8 解码） | 外部程序（node/git/python）UTF-8 输出天然正常；**PS 自身 Write-Host 中文**和 **wsl.exe UTF-16 输出**才会乱码，用下方"编码要点"的字节直写/文件中转方案 |

### 编码要点（本机实测 2026-08，AI 工具环境 = PS 5.1 非交互 + 工具按 UTF-8 读原始字节）

| 场景 | 现象 | 已验证方案 |
|------|------|-----------|
| 外部程序输出（node/git/python） | UTF-8 字节被工具正确解码，**本来就正常** | 无需处理 |
| PS 自身输出中文（Write-Host/字符串插值） | 按 GBK(936) 编码 -> 工具按 UTF-8 解码 -> 乱码 | **UTF-8 字节直写 stdout**（绕过 PS 编码层）: `$b=[Text.UTF8Encoding]::new($false).GetBytes("中文`n"); [Console]::OpenStandardOutput().Write($b,0,$b.Length)`（注意该对象只有 Write，无 WriteLine） |
| wsl.exe 输出 | UTF-16LE 字节 -> 工具按 UTF-8 解码 -> 乱码 | **cmd 重定向文件 + Unicode 读回**: `cmd /c "wsl -l -v > %TEMP%\w.txt 2>&1"` 然后 `Get-Content -Raw -Encoding Unicode "$env:TEMP\w.txt"`，再按上行字节直写 |
| shell 写文件 | `Out-File` 默认 UTF-16LE；`Set-Content` 默认 ANSI(GBK) | 一律显式 `-Encoding UTF8`；无 BOM UTF-8 用 `[IO.File]::WriteAllText($p,$t,[Text.UTF8Encoding]::new($false))` |
| 判断优先级 | 能不用 shell 输出中文就别用：诊断头用英文；要保留中文结果 -> 写 UTF-8 文件 + Read 工具读 | 次选字节直写；最后才 `Out-File -Encoding UTF8` |

### 非交互执行（SH11-SH12，AI/agent 环境）

| # | 规则 | 触发点/说明 |
|---|------|-----------|
| SH11 | 假设 CI=true 无 TTY: 预置 -y / --yes / --force / --no-input | 会挂死的命令: pause、read、conda init、交互式编辑器；git 用 `--no-edit`、`GIT_TERMINAL_PROMPT=0` |
| SH12 | 无非交互参数时用管道喂答案或 timeout 兜底 | `yes \| cmd`、heredoc、`timeout 30 cmd`；任何可能弹确认的命令都设超时 |

## 对照示例

错误（AI 常见输出）:

```bash
#!/bin/bash
cd $BUILD_DIR
rm -rf $TMP/*
VERSION=`cat version.txt`
echo $VERSION
```

正确:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

BUILD_DIR="${BUILD_DIR:?BUILD_DIR is required}"
readonly TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT INT TERM

on_error() { printf '[FATAL] line %s: %s\n' "$LINENO" "$BASH_COMMAND" >&2; }
trap on_error ERR

cd "${BUILD_DIR}"
VERSION="$(cat version.txt)"
printf '%s\n' "${VERSION}"
```

## 自检清单

```
□ 严格模式开启（set -Eeuo pipefail / Set-StrictMode）？   -> SH1
□ 参数/环境变量必填校验？                                -> SH2
□ 临时文件 mktemp + 清理 trap/finally？                  -> SH3
□ rm -rf 有路径校验 + dry-run？                          -> SH4
□ 无 eval / Invoke-Expression / 空 catch？               -> SH5
□ main() 结构 / Approved Verbs？                         -> SH6
□ shellcheck / PSScriptAnalyzer 零警告？                 -> SH7
□ bash 变量全加引号？                                    -> SH8
□ PS 5.1 无 && / 反引号陷阱？                            -> SH9
□ 编码/引号问题用临时文件绕开？                          -> SH10
□ 非交互 flags 预置？                                    -> SH11/12
```

## 来源

- LibreDevOps Bash Standards（2026-06）: strict mode / declare-then-assign / mktemp+trap / shellcheck 门禁
- BarisKode Shell Review Checklist（2026-02）: 破坏性命令防护 / 幂等 / 回滚
- Microsoft Learn: PSScriptAnalyzer rules / Set-StrictMode / 参数校验
- 本机实测（2026-08）: PS 5.1 双引号反引号转义、node -e 引号嵌套、重定向 GBK 乱码、UTF-8 字节直写方案、wsl UTF-16 文件中转方案
- 权威参考: PowerShell GitHub #7233（console UTF-8 工作区）、#25698（$OutputEncoding vs [Console]::OutputEncoding）、#17523（管道解码差异）、[Console]::OutputEncoding 对 wsl/utf16 的边界
