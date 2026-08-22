// guard-matrix.mjs — guard 插件误报/漏报矩阵回归（DoD 防御机制必测）
//
// 运行: node global/plugins/guard/guard-matrix.mjs
// 期望: 误伤 = 0/13  漏网 = 0/14
// 规则:
//   - 合法命令必须全部放行（不误伤）
//   - 危险命令必须全部拦截（不漏网）
// 变更 DENY_PATTERNS 后必须先更新本矩阵并跑绿，否则视为"写了就当有用"。

import { DENY_PATTERNS } from "./index.mjs";

function isDangerous(command) {
  if (!command || typeof command !== "string") return null;
  for (const p of DENY_PATTERNS) {
    if (p.re.test(command)) return p.msg;
  }
  return null;
}

const legal = [
  "git commit -m \"fix: update docs\"",
  "rm file.txt",
  "rm -r build",
  "git push origin main",
  "git push --force-with-lease origin main",
  "Remove-Item temp.log",
  "del /q file.txt",
  "dd if=backup.img of=disk.img",
  "npm run shutdown-handler-test", // 子串含 shutdown，放行
  "Write-Host \"server will halt soon\"", // 字符串含 halt，放行
  "echo \"please do not reboot the server\"", // 字符串含 reboot，放行
  "Get-Content format-guide.md",
  "node script.js --force-clean", // 含 --force 但非 git push
];

const dangerous = [
  "rm -rf /",
  "rm -fr node_modules",
  "rmdir /s /q C:\\temp",
  "rd /s D:\\foo",
  "del /f /s /q *.*",
  "Remove-Item -Recurse -Force C:\\temp",
  "git push --force origin main",
  "git push -f origin main",
  "shutdown /s",
  "reboot now",
  "halt -p",
  "shutdown.exe /s /t 0", // .exe 变体
  // 注: 嵌套调用（cmd /c shutdown、powershell -c "shutdown"）属对抗性绕过，
  // 变体无限，不在此层正则覆盖范围 —— 由 opencode 权限系统/人类确认兜底。
  "mkfs.ext4 /dev/sda1",
  "dd if=img.iso of=/dev/sdb",
  "format c: /q",
  ":(){ :|:& };:",
];

let fp = 0;
let fail = false;
console.log("=== 合法命令（应放行）===");
for (const c of legal) {
  const r = isDangerous(c);
  if (r) {
    fp++;
    fail = true;
    console.log(`[误伤] BLOCKED(${r}): ${c}`);
  } else {
    console.log(`[OK] 放行: ${c}`);
  }
}

let miss = 0;
console.log("\n=== 危险命令（应拦截）===");
for (const c of dangerous) {
  const r = isDangerous(c);
  if (!r) {
    miss++;
    fail = true;
    console.log(`[漏网] PASSED: ${c}`);
  } else {
    console.log(`[OK] 拦截(${r}): ${c}`);
  }
}

console.log(`\n误伤=${fp}/${legal.length}  漏网=${miss}/${dangerous.length}`);
if (fail) {
  console.log("❌ 矩阵未通过：存在误伤或漏网，禁止发布本 guard 改动");
  process.exit(1);
}
console.log("✅ 矩阵通过：合法不误伤、非法不漏网");
