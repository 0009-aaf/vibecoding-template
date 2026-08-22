# sync-global.ps1 — 将 vibecoding-template/global/ 真源镜像同步到全局 opencode 配置
#
# 用途：
#   1. 新机器初始化：从仓库恢复完整 vibe 工作流到 ~/.config/opencode/
#   2. 仓库 global/ 更新后：一键推送到全局配置
#
# 规则：
#   - 方向：仓库 global/ -> 全局 ~/.config/opencode/（仓库为真源）
#   - 幂等：整目录复制，重复执行无副作用
#   - 保护：不触碰 opencode.json（含本地密钥/provider 配置，不进仓库）、跳过 node_modules
#   - 可选自检：完成后运行 vibe-command-structure 的 checks.py
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts/sync-global.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sync-global.ps1 -SkipCheck

[CmdletBinding()]
param(
    [string]$GlobalDir = (Join-Path $env:USERPROFILE '.config\opencode'),
    [switch]$SkipCheck
)

$ErrorActionPreference = 'Stop'

# 入口判空
if (-not $GlobalDir) {
    Write-Error 'GlobalDir 为空，无法确定全局配置目录'
    exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot  # scripts/ 的上级 = 仓库根
$source = Join-Path $repoRoot 'global'

# 源目录必须存在
if (-not (Test-Path -LiteralPath $source)) {
    Write-Error "真源镜像不存在: $source （请先确认仓库 global/ 已就位）"
    exit 1
}

Write-Host "同步: $source"
Write-Host "  ->  $GlobalDir"

# 全局目录不存在则创建
if (-not (Test-Path -LiteralPath $GlobalDir)) {
    New-Item -ItemType Directory -Force -Path $GlobalDir | Out-Null
    Write-Host "  已创建全局配置目录"
}

$subDirs = @('skills', 'commands', 'templates', 'plugins')
$copied = 0
foreach ($sub in $subDirs) {
    $srcSub = Join-Path $source $sub
    if (-not (Test-Path -LiteralPath $srcSub)) {
        Write-Warning "跳过（仓库缺 $sub/）: $srcSub"
        continue
    }
    $dstSub = Join-Path $GlobalDir $sub
    if (-not (Test-Path -LiteralPath $dstSub)) {
        New-Item -ItemType Directory -Force -Path $dstSub | Out-Null
    }
    # 整目录复制，排除 node_modules（依赖产物不进镜像）
    Copy-Item -Path (Join-Path $srcSub '*') -Destination $dstSub -Recurse -Force -Exclude 'node_modules'
    $count = (Get-ChildItem -Path $dstSub -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "  [OK] $sub/  files=$count"
    $copied++
}

Write-Host "完成: $copied/4 个目录已同步"

# 可选自检
if (-not $SkipCheck) {
    $checks = "C:\Users\fms\.claude\harness\tasks\vibe-command-structure\checks.py"
    if (Test-Path -LiteralPath $checks) {
        Write-Host ''
        Write-Host '--- 运行命令结构回归自检 ---'
        & python $checks
        if ($LASTEXITCODE -ne 0) {
            Write-Error '自检未通过：全局命令结构与回归基线不一致，请检查 global/commands 内容'
            exit 1
        }
        Write-Host '自检通过'
    }
    else {
        Write-Warning "跳过自检（checks.py 不存在）: $checks"
    }
}

Write-Host '同步完成。'
