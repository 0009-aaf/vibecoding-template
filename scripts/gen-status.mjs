#!/usr/bin/env node
/**
 * gen-status.mjs — 从 dense-track / converge 自动生成文档同步草稿（O8）
 *
 * 用途：/vibe-implement 阶段4/6 收尾时，把切片实现结果转成 STATUS /
 *   CHANGELOG / TECH-DEBT 三个文件的草稿片段，减少手写同步（宪法 C10 的
 *   "人的时间税"）。
 *
 * 用法：
 *   node scripts/gen-status.mjs <切片编号> "<一句话变更>"
 *     [--debt "<文件:行>|<问题>|<影响>|<建议时机>"]   # 可重复
 *     [--solo]                                        # solo 档：不读 dense-track
 *
 * 输入（存在则自动读取，缺失不报错）：
 *   .vibecoding/dense-track.md      — 稠密轨：✓/?/✗ 完成层 + 测试
 *   .vibecoding/converge-<编号>.md  — Converge 差距扫描：✓/✗/⏸ 三态
 *
 * 输出：三段草稿（STATUS 描述 / CHANGELOG 条目 / TECH-DEBT 行），
 *   AI 或人确认后贴入对应文件。本脚本只生成草稿，不写盘。
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");

/** 入口判空：无参数即打印用法退出（exit 1） */
function usage() {
  console.log(
    "用法: node scripts/gen-status.mjs <切片编号> \"<一句话变更>\"\n" +
      "      [--debt \"<文件:行>|<问题>|<影响>|<建议时机>\"]  # 可重复\n" +
      "      [--solo]  # solo 档：不读 dense-track\n" +
      "示例: node scripts/gen-status.mjs 003 \"登录页表单——账号密码提交与前端校验\" --debt \"src/ui/login.tsx:120|表单校验逻辑待抽离|UI 层过厚|下个切片\""
  );
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const sliceId = args.find((a) => /^\d{3,}$/.test(a));
  const descIdx = args.findIndex((a) => !a.startsWith("--") && !/^\d{3,}$/.test(a));
  const changeDesc = descIdx >= 0 ? args[descIdx] : "";
  const debts = [];
  const solo = args.includes("--solo");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--debt" && args[i + 1]) {
      const parts = args[i + 1].split("|");
      if (parts.length >= 3) debts.push(parts);
    }
  }
  return { sliceId, changeDesc, debts, solo };
}

/** 读取文件，缺失/不可读返回 null（入口判空 + 异常不吞：返回空态而非崩溃） */
function readOptional(rel) {
  const abs = resolve(REPO_ROOT, rel);
  if (!existsSync(abs)) return null;
  try {
    return readFileSync(abs, "utf8");
  } catch (e) {
    console.error(`[gen-status] 读取 ${rel} 失败: ${e.message}`);
    return null;
  }
}

/** 从 dense-track 提取 ✓/?/✗ 层摘要 */
function summarizeDenseTrack(text) {
  if (!text) return null;
  const done = [];
  const failed = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^([✓?✗])\s*(.+?)\s*\((验证:.*)\)?/);
    if (!m) continue;
    if (m[1] === "✓") done.push(m[2]);
    if (m[1] === "✗") failed.push(m[2]);
  }
  return { done, failed };
}

/** 从 converge 统计 ✓/✗/⏸ 三态 */
function summarizeConverge(text) {
  if (!text) return null;
  let ok = 0;
  let miss = 0;
  let exempt = 0;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("✓")) ok++;
    else if (t.startsWith("✗")) miss++;
    else if (t.startsWith("⏸")) exempt++;
  }
  return { ok, miss, exempt };
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main() {
  const { sliceId, changeDesc, debts, solo } = parseArgs(process.argv);
  if (!sliceId || !changeDesc) {
    usage();
    process.exit(1);
  }

  const dense = solo ? null : summarizeDenseTrack(readOptional(".vibecoding/dense-track.md"));
  const converge = solo ? null : summarizeConverge(readOptional(`.vibecoding/converge-${sliceId}.md`));

  // ---- STATUS 草稿 ----
  let status = `切片 ${sliceId} 完成：${changeDesc}。`;
  if (dense) {
    if (dense.done.length) status += ` 完成层：${dense.done.join(" → ")}。`;
    if (dense.failed.length) status += ` 曾有失败层：${dense.failed.join("、")}（已修复）。`;
  }
  if (converge) {
    status += ` Converge：✓${converge.ok} / ✗${converge.miss} / ⏸${converge.exempt}`;
    if (converge.exempt > 0) status += "（豁免项须登记 TECH-DEBT）";
    status += "。";
  }
  if (debts.length) status += ` 技术债 ${debts.length} 项已登记。`;

  // ---- CHANGELOG 草稿 ----
  const changelog = `- ${sliceId} ${changeDesc}`;

  // ---- TECH-DEBT 草稿 ----
  const date = today();
  const techDebt = debts
    .map(([loc, problem, impact, timing]) => `| ${date} | ${loc} | ${problem} | ${impact} | ${timing || "待定"} |`)
    .join("\n") || "（无 --debt 输入，无技术债行）";

  console.log(`=== STATUS 草稿（docs/03-STATUS.md「上次做了什么」） ===`);
  console.log(status);
  console.log(`\n=== CHANGELOG 草稿（CHANGELOG.md <切片分组>） ===`);
  console.log(changelog);
  console.log(`\n=== TECH-DEBT 草稿（docs/TECH-DEBT.md） ===`);
  console.log(techDebt);
}

main();
