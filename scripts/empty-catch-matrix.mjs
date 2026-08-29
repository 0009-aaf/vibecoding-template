// empty-catch-matrix.mjs — quality-gate M21 空 catch 扫描误报/漏报矩阵回归
// （宪法 C11 防御机制必测：先矩阵全绿才认为 M21 有效）
//
// 运行: node scripts/empty-catch-matrix.mjs
// 期望: 误报 = 0/14  漏网 = 0/8（矩阵必须全绿）
//
// 真源：直接 import quality-gate.js 导出的 findEmptyCatch（单一真源）——
// 改 M21 只改 quality-gate 一处，本矩阵自动跟随，消除手工双源"假验证"。
//
// 饱和线：覆盖已见 + 高频写法即停（同 secret-matrix/ui-redline-matrix）。

import { findEmptyCatch } from '../.opencode/quality-gate.js';

// 合法代码片段：期望不命中（命中 = 误报）
const legal = [
  "try { run() } catch (e) { console.error(e) }", // 有处理
  "try { run() } catch (err) { throw new Error('boom', { cause: err }) }", // 显式 re-throw
  "try { run() } catch { handle() }", // 无参数 catch 有处理
  "try { run() } catch (e: unknown) { log(e) }", // TS 类型注解
  'const s = "catch {}";', // 字符串字面量（应跳过）
  "myCatch{}", // 标识符中含 catch（catch 前是字母，应跳过）
  "// catch (e) {}", // 行注释里（应跳过）
  "/* catch (e) {} */", // 块注释里（应跳过）
  "try { run() } catch (e) { if (e.code === 1) return }", // 有代码
  "catch (e) { /* TODO: real handling */ return }", // 注释 + return（有代码）
  "const re = /from\\s+[\"']@\\/features\\/([^/]+)\\/[^\"']*[\"']/;\ntry { run() } catch (e) { handle(e) }", // 正则含引号 + 后续 catch 有处理（M10 场景回归）
  "const r2 = /catch {/;", // 正则字面量内含 "catch {"（应掩码跳过）
  "const re = /catch {}/g;", // 正则字面量含空 catch 块形态，前置 "=" 应掩码（修复回归：防误报）
  "const re = /a\\/b/g; try { run() } catch (e) { handle(e) }", // 单行正则 + catch 有处理（防"正则不掩导致误报"）
];

// 违规代码片段：期望命中（未命中 = 漏网）
const violations = [
  "try { run() } catch (e) {}", // 空
  "try { run() } catch { }", // 无参数空
  "try { run() }\ncatch (e) {\n}", // 跨行空
  "try { run() } catch (e) { /* ignore */ }", // 仅块注释
  "try { run() } catch (e) { // swallow\n}", // 仅行注释
  "try { run() } catch (e) { ; }", // 仅空语句
  "catch (e) {}", // 独立 catch（无 try 前缀，健壮性）
  "const x = a / b; try { run() } catch (e) {} const y = c / d;", // 单行除法夹真实空 catch（2026-08-29 掩码漏报回归：修复前放行）
];

let fp = 0;
let fn = 0;
let fail = false;

console.log("=== 合法代码（应放行）===");
for (const c of legal) {
  const issues = findEmptyCatch(c, "test.ts");
  if (issues.length > 0) {
    fp++;
    fail = true;
    console.log(`[误报] 命中: ${JSON.stringify(c)}`);
  } else {
    console.log(`[OK] 放行: ${JSON.stringify(c)}`);
  }
}

console.log("\n=== 违规代码（应命中）===");
for (const c of violations) {
  const issues = findEmptyCatch(c, "test.ts");
  if (issues.length === 0) {
    fn++;
    fail = true;
    console.log(`[漏网] 未命中: ${JSON.stringify(c)}`);
  } else {
    console.log(`[OK] 拦截: ${JSON.stringify(c)} (行 ${issues[0].line})`);
  }
}

console.log(`\n结果: 误报 ${fp}/14  漏网 ${fn}/8`);
if (fail) {
  console.log("✗ 矩阵未全绿，M21 不可上线");
  process.exit(1);
}
console.log("✓ 矩阵全绿，M21 有效");
