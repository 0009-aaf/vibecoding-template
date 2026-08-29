// Vision Bridge — opencode Plugin
// 给纯文本模型（deepseek-v4-flash 等）"眼睛"：
//   在消息真正发往 LLM 之前（experimental.chat.messages.transform 钩子，
//   该钩子被 opencode 同步等待），把图片 FilePart 用豆包视觉模型转成文字描述，
//   替换为 text part。这样粘贴的截图永远不会以图片形式到达纯文本模型 → 不再卡死。
//
// 设计要点:
//   - 结构鲁棒: 兼容 opencode 1.18.15 的 FilePart (type:"file", 顶层 mime/url)
//     也兼容未来可能的 file.mediaType 变体
//   - 兜底: 识别失败也把图片替换成文字说明(含原图路径)，保证不卡
//   - 去重: 同一图片 URL 10 分钟内只分析一次
//   - 超时: 视觉 API 40s 超时，最坏降级为失败说明
//   - 附带保留浏览器截图 tool.execute.after 自动识图能力
//   - 2026-08: 模型切回豆包，通道走火山方舟 Agent Plan（volcengine-coding-plan，
//     api/plan/v3），与主模型通道一致

import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";

// 火山方舟 Agent Plan 通道（与 opencode.json 的 volcengine-coding-plan 一致）
const VISION_API_URL = "https://ark.cn-beijing.volces.com/api/plan/v3/chat/completions";
const VISION_MODEL = "doubao-seed-2.0-lite";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const CACHE_TTL_MS = 10 * 60 * 1000;

function debug(...args) {
  console.error("[vision-bridge]", ...args);
}

// 优先 Agent Plan key（VOLC_API_KEY=ark-c86f...）；保留 ARK 作为旧环境兼容回退
function apiKey() {
  return process.env.VOLC_API_KEY || process.env.ARK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
}

// 从 part 中提取图片信息（兼容多种 schema 变体）
function imageInfo(part) {
  if (!part || typeof part !== "object") return null;
  const sub = part.file && typeof part.file === "object" ? part.file : null;
  const mime = part.mime || (sub && sub.mime) || (sub && sub.mediaType) || "";
  if (typeof mime !== "string" || !mime.startsWith("image/")) return null;
  const url = part.url || (sub && sub.url) || "";
  if (!url) return null;
  return { mime, url };
}

async function toDataUrl(mime, url) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    const buf = readFileSync(url);
    if (buf.length > MAX_IMAGE_BYTES) return null;
    return `data:${mime || "image/png"};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function analyzeImage(dataUrl) {
  const key = apiKey();
  if (!key) throw new Error("VOLC_API_KEY（或 ARK_API_KEY / DEEPSEEK_API_KEY）未设置");
  const resp = await fetch(VISION_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请用中文详细描述这张图片：逐字提取可见文字（含代码/报错完整转录），描述界面元素、布局、颜色、状态以及值得注意的细节。",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`vision api ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  const text = (msg && typeof msg.content === "string" ? msg.content : "") || (msg && msg.reasoning_content) || "";
  if (!text) throw new Error("vision 返回空内容");
  return text;
}

// url -> { text, at } 去重缓存
const cache = new Map();

async function describeImage(mime, url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.text;
  const dataUrl = await toDataUrl(mime, url);
  if (!dataUrl) throw new Error(`无法读取图片源: ${url}`);
  const text = await analyzeImage(dataUrl);
  cache.set(url, { text, at: Date.now() });
  return text;
}

// 把单个图片 part 替换成文字 part（失败也替换，保证纯文本模型不收到图片）
async function replaceImagePart(part) {
  const img = imageInfo(part);
  if (!img) return false;
  const filename = part.filename || "image";
  let text;
  try {
    const desc = await describeImage(img.mime, img.url);
    text = `[图片 "${filename}" 自动识别结果]\n${desc}\n[/识别结束]`;
  } catch (err) {
    const reason = (err && err.message) || String(err);
    debug("analyze failed", reason);
    const ref = img.url && !img.url.startsWith("data:") ? `原图路径：${img.url}` : "";
    text = `[图片 "${filename}" 自动识别失败：${reason}。${ref}]`;
  }
  const { id, sessionID, messageID } = part;
  const idx = Array.isArray(part.__parts) ? part.__parts.indexOf(part) : -1;
  const replacement = { id, sessionID, messageID, type: "text", text, synthetic: true };
  if (idx >= 0 && Array.isArray(part.__parts)) {
    part.__parts[idx] = replacement;
  }
  return true;
}

export default async () => {
  if (!apiKey()) {
    debug("VOLC_API_KEY（或 ARK_API_KEY / DEEPSEEK_API_KEY）未设置，视觉桥接不可用");
  }
  return {
    // 决定性钩子：在请求发往 LLM 之前，opencode 会等待本异步钩子完成
    "experimental.chat.messages.transform": async (_input, output) => {
      const msgs = output && Array.isArray(output.messages) ? output.messages : [];
      for (const msg of msgs) {
        if (!msg || !Array.isArray(msg.parts)) continue;
        const parts = msg.parts;
        for (const part of parts) {
          if (!part || typeof part !== "object") continue;
          // 绑定父数组引用，便于原地替换
          if (!part.__parts) {
            try {
              Object.defineProperty(part, "__parts", {
                value: parts,
                enumerable: false,
                configurable: true,
                writable: false,
              });
            } catch (e) {
              // 部分对象可能不可扩展，跳过绑定，靠 imageInfo 判断
              debug("part 绑定 __parts 失败", e && e.message);
            }
          }
          await replaceImagePart(part);
        }
      }
    },

    // 浏览器截图工具自动识图（保留 vision-auto 的既有能力）
    "tool.execute.after": async (input, output) => {
      if (!output || typeof output !== "object") return;
      const tool = String(input.tool || "");
      const args = input.args || {};
      const isShot =
        (tool === "browser" && String(args.action || "").toLowerCase() === "screenshot") ||
        /screenshot/i.test(tool);
      if (!isShot) return;
      const outputText = typeof output.output === "string" ? output.output : "";
      let raw = args.path;
      if (!raw) {
        const m = outputText.match(/Screenshot saved to:?\s*(.+?)(?:\n|$)/);
        if (m) raw = m[1].trim();
      }
      if (!raw) return;
      const candidates = [];
      if (isAbsolute(raw)) {
        candidates.push(raw);
      } else {
        if (typeof process !== "undefined" && process.cwd) candidates.push(resolve(process.cwd(), raw));
        candidates.push(join(homedir(), "Downloads", raw));
      }
      let filePath = null;
      for (const c of candidates) {
        try {
          if (readFileSync(c).length > 0) {
            filePath = c;
            break;
          }
        } catch {
          // try next
          continue;
        }
      }
      if (!filePath) return;
      try {
        const buf = readFileSync(filePath);
        if (buf.length > MAX_IMAGE_BYTES) {
          output.output = `${outputText}\n\n[截图过大，未自动识图]`;
          return;
        }
        const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
        const desc = await analyzeImage(dataUrl);
        if (desc) output.output = `${outputText}\n\n[截图已自动识图]\n${desc}`;
      } catch (err) {
        debug("screenshot analyze failed", err && err.message);
        output.output = `${outputText}\n\n[截图自动识图失败: ${(err && err.message) || err}]`;
      }
    },
  };
};
