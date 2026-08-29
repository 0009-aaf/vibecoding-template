// secret-matrix.mjs — quality-gate M01 密钥扫描误报/漏报矩阵回归（DoD 防御机制必测）
//
// 运行: node scripts/secret-matrix.mjs
// 期望: 误报 = 0/10  漏网 = 0/8（矩阵必须全绿才能认为 M01 有效）
//
// 正则真源：直接 import quality-gate.js 导出的 secretPatterns（单一真源）——
// 改 M01 正则只改 quality-gate 一处，本矩阵自动跟随，消除手工双源"假验证"。
// guard 侧同类回归见 global/plugins/guard/guard-matrix.mjs。
//
// 饱和线（2026-08-29 机制审计）：覆盖已见 + 高频写法即停，不追未来/极端写法；
// 新增用例前先判断是否真实事故（被漏拦过）再补，禁止"每次审查加用例"式无限膨胀。

import { secretPatterns } from '../.opencode/quality-gate.js';

function scan(content) {
  for (const p of secretPatterns) {
    const m = content.match(p);
    if (m) return m[0].substring(0, 30);
  }
  return null;
}

// 合法代码片段：期望不命中（HIT = 误报）
const legal = [
  "const password = await hash(input)", // 无引号字符串
  "apiKey = process.env.API_KEY", // 环境变量引用
  'token: "abc123"', // 值 <12 字符
  'const config = { secret: "" }', // 空值
  "// this module stores the api_key config", // 注释提到词但无赋值
  'const short = "sk-short"', // sk- 后不足 20 字符
  "password.length > 12", // 属性访问
  "if (token === expectedToken) return", // 比较
  "const apiKey = fetchApiKey()", // 函数调用返回值
  "config.token = tokenFromEnv", // 变量间赋值
];

// 密钥样本：期望命中（MISS = 漏网）
const secrets = [
  'const k = "sk-proj-abcdefghijklmnopqrstuvwxyz123456"', // sk- 长串
  "-----BEGIN RSA PRIVATE KEY-----", // PEM 头
  'password: "supersecretpassword123"', // password 键
  'api_key = "abcdefghijklmno1234"', // api_key 键
  'token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"', // JWT
  '"sk-ant-api03-9f8e7d6c5b4a3210fedcba"', // sk- 变体（Ant 前缀）
  'export const SECRET = "abcdefghijklmnopqrstuvwxyz123456"', // 大写 SECRET + 长值（/i）
  '{"access_token": "a-very-long-bearer-token-value-here"}', // JSON access_token
];

let fp = 0;
let fail = false;
console.log("=== 合法代码（应放行）===");
for (const c of legal) {
  const hit = scan(c);
  if (hit) {
    fp++;
    fail = true;
    console.log(`[误报] HIT(${hit}): ${c}`);
  } else {
    console.log(`[OK] 放行: ${c}`);
  }
}

let miss = 0;
console.log("\n=== 密钥样本（应命中）===");
for (const c of secrets) {
  const hit = scan(c);
  if (!hit) {
    miss++;
    fail = true;
    console.log(`[漏网] MISS: ${c}`);
  } else {
    console.log(`[OK] 命中(${hit.substring(0, 20)}...): ${c.substring(0, 44)}`);
  }
}

console.log(`\n误报=${fp}/${legal.length}  漏网=${miss}/${secrets.length}`);
if (fail) {
  console.log("❌ 矩阵未通过：M01 正则存在误报或漏网，禁止发布该 quality-gate 改动");
  process.exit(1);
}
console.log("✅ 矩阵通过：合法不误伤、非法不漏网");
