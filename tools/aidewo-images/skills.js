"use strict";

const mode = new URLSearchParams(location.search).get("mode") === "detail" ? "detail" : "main";
const isDetail = mode === "detail";
const title = isDetail ? "AIDEWO 五张详情图 · 通用生图技能" : "AIDEWO 六张主图 · 通用生图技能";
const textPath = isDetail ? "detail.txt" : "main.txt";
const slug = isDetail ? "aidewo-product-details" : "aidewo-main-images";
const field = document.getElementById("prompt");
const copy = document.getElementById("copy");
const status = document.getElementById("status");

document.title = title;
document.getElementById("heading").textContent = title;
document.getElementById("nav-" + mode).setAttribute("aria-current", "page");
document.getElementById("raw").href = textPath;
document.getElementById("source").href = "https://github.com/RonnyMa-67/RonnyMa/blob/main/skills/" + slug + "/SKILL.md";

fetch(textPath)
  .then(response => {
    if (!response.ok) throw new Error("Cannot load prompt");
    return response.text();
  })
  .then(text => {
    field.value = text.trimEnd();
    copy.disabled = !field.value;
  })
  .catch(() => {
    status.textContent = "指令加载失败，请打开纯文本或 GitHub 原文复制。";
  });

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = "已复制，可粘贴到生图对话。";
  } catch {
    field.focus();
    field.select();
    status.textContent = "已选中全文，请手动复制。";
  }
});
