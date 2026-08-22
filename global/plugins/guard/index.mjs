/**
 * guard — opencode 原生 Bash 危险命令守卫。
 *
 * 等价实现原 Claude Code 的 "PreToolUse guard hook"：在 tool.execute.before 中
 * 扫描 bash 命令的危险模式并阻断（throw）。
 *
 * 覆盖：rm -rf / git push --force / shutdown·reboot·halt / mkfs / 磁盘直写 / 删除递归、
 * Windows 的 rmdir /s、del /f /s /q、Remove-Item -Recurse -Force 等。
 *
 * 逃生门：环境变量 OPENCODE_DISABLE_GUARD=1 时跳过（与 vibe-gate 的 SKIP_VIBE_GATE 一致）。
 */
const DENY_PATTERNS = [
  // 递归删除（仅递归/批量才危险；单文件删允许）
  { re: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\b/i, msg: "禁止递归强制删除 rm -rf" },
  { re: /\brm\s+-[a-zA-Z]*f[a-zA-Z]*r\b/i, msg: "禁止递归强制删除 rm -fr" },
  { re: /\brmdir\s+\/s(?:\s+\/q)?\b/i, msg: "禁止递归删除 rmdir /s" },
  { re: /\brd\s+\/s(?:\s+\/q)?\b/i, msg: "禁止递归删除 rd /s" },
  { re: /\bdel\s+[^;&|\n]*\/s\b/i, msg: "禁止批量删除 del /s（递归）" },
  { re: /Remove-Item\b[^;\n]*?-Recurse\b/i, msg: "禁止 PowerShell Remove-Item -Recurse（递归删除）" },
  // git 强推（--force-with-lease 是安全的，不拦）
  { re: /\bgit\s+push\b[^;\n]*--force(?!-)/i, msg: "禁止 git push --force" },
  { re: /\bgit\s+push\b[^;\n]*\s-f(?:\s|$)/i, msg: "禁止 git push -f" },
  // 关机/重启
  { re: /\b(?:shutdown|reboot|halt|poweroff)\b/i, msg: "禁止关机/重启类命令" },
  // 磁盘/格式化（要求盘符后跟 / 参数或命令结尾，避免误伤字符串）
  { re: /\bmkfs\b/i, msg: "禁止 mkfs 文件系统创建" },
  { re: /\bdd\b[^;\n]*of=\/dev\//i, msg: "禁止 dd 直写设备" },
  { re: /\bformat\s+[a-zA-Z]:(?:\s*\/|\s*$)/i, msg: "禁止磁盘格式化 format <盘符>:" },
  { re: /\b(?:Format-Volume|Clear-Disk)\b/i, msg: "禁止 PowerShell 磁盘格式化" },
  // fork bomb
  { re: /:\(\)\s*\{\s*:\s*\|:\s*&\s*\}\s*;:/i, msg: "禁止 fork bomb" },
];

function isDangerous(command) {
  if (!command || typeof command !== "string") return null;
  for (const p of DENY_PATTERNS) {
    if (p.re.test(command)) return p.msg;
  }
  return null;
}

export const GuardPlugin = async () => {
  return {
    "tool.execute.before": async (input) => {
      if (input.tool !== "bash") return;
      if (process.env.OPENCODE_DISABLE_GUARD === "1") return;
      const reason = isDangerous(input.args?.command);
      if (reason) {
        throw new Error(`[guard] 危险命令已阻断：${reason}`);
      }
    },
  };
};
