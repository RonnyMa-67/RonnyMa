"use strict";

const query = new URLSearchParams(location.search);
const mode = query.get("mode") === "detail" ? "detail" : "main";
const isEnglish = query.get("lang") === "en";
const textPath = mode + (isEnglish ? ".en.txt" : ".txt");
const field = document.getElementById("prompt");
const copy = document.getElementById("copy");
const status = document.getElementById("status");
const modeHref = (target, en) => "?mode=" + target + (en ? "&lang=en" : "");

const labels = isEnglish ? {
  title: mode === "detail" ? "Product detail images · Image workspace" : "Product main images · Image workspace",
  brief: "Upload real product photos, plus optional logos, verified facts and style references. Paste the same prompt into image-enabled ChatGPT, Muse or Gemini to generate complete product images in order. Use any brand or category.",
  main: "Six main images",
  detail: "Five detail images",
  back: "← Back to skills",
  copy: "Copy full prompt",
  prompt: "Full image prompt",
  text: "Open plain text",
  source: "View source on GitHub",
  fallback: "If your image tool only makes one image at a time, start with image 01, then ask for image 02 in the same style.",
  error: "The prompt didn't load. Open the plain-text version or the GitHub source.",
  copied: "Copied. Paste it into your image-generation conversation.",
  manual: "Prompt selected. Copy it manually."
} : {
  title: mode === "detail" ? "通用商品详情图 · 生图工作台" : "通用商品主图 · 生图工作台",
  error: "指令加载失败，请打开纯文本或 GitHub 原文复制。",
  copied: "已复制，可粘贴到生图对话。",
  manual: "已选中全文，请手动复制。"
};

document.title = labels.title;
document.getElementById("heading").textContent = labels.title;
document.getElementById("nav-" + mode).setAttribute("aria-current", "page");
document.getElementById("nav-main").href = modeHref("main", isEnglish);
document.getElementById("nav-detail").href = modeHref("detail", isEnglish);
const locale = document.getElementById("locale");
locale.href = modeHref(mode, !isEnglish);
document.getElementById("raw").href = textPath;
document.getElementById("source").href = "https://github.com/RonnyMa-67/RonnyMa/blob/main/tools/aidewo-images/" + textPath;

if (isEnglish) {
  document.documentElement.lang = "en";
  locale.lang = "zh-CN";
  locale.textContent = "中文";
  const origin = document.querySelector(".pxw-origin");
  origin.setAttribute("aria-label", "Ronny's site · Skills");
  origin.href = "../../en/#skills";
  origin.querySelector(".pxw-origin-section").textContent = "/ Skills";
  document.querySelector(".pxw-guide-main").textContent = "Main image guide (中文)";
  document.querySelector(".pxw-guide-detail").textContent = "Detail image guide (中文)";
  document.getElementById("mode-navigation").setAttribute("aria-label", "Image workspaces");
  document.getElementById("home-link").href = "../../en/#skills";
  for (const [id, value] of Object.entries({
    "home-link": labels.back, "nav-main": labels.main, "nav-detail": labels.detail,
    "brief": labels.brief, "prompt-label": labels.prompt, "copy": labels.copy,
    "raw": labels.text, "source": labels.source, "fallback-note": labels.fallback
  })) document.getElementById(id).textContent = value;
}

fetch(textPath)
  .then(response => {
    if (!response.ok) throw new Error("Cannot load prompt");
    return response.text();
  })
  .then(text => {
    field.value = text.trimEnd();
    copy.disabled = !field.value;
  })
  .catch(() => { status.textContent = labels.error; });

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = labels.copied;
  } catch {
    field.focus();
    field.select();
    status.textContent = labels.manual;
  }
});
