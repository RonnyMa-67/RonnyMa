"use strict";

const layouts = {
  main: [
    ["首图 · 产品与主卖点", "Commercial Slush Machine", "2 × 15 L", "Independent bowl controls", "a bright professional beverage counter with two modest slush cups on the left"],
    ["容量 · 双口味", "Two Flavors, One Station", "30 L", "Two independently controlled bowls", "a neutral beverage service counter with two distinct colored slush drinks on the left"],
    ["操作 · 出杯结构", "Front Dispensing", "", "Dual drip trays", "a clean quick-service counter with a single empty cup off to the side"],
    ["结构 · 材质细节", "Built for Countertop Service", "304", "Stainless steel enclosure panels", "a softly lit neutral background for a real hardware close-up"],
    ["包装 · 发货", "Packing and Freight", "45 / 55 kg", "Net / gross weight\nCarton: 480 × 630 × 920 mm", "a clean packing bench with unmarked protective materials off to the side"],
    ["规格 · 尺寸电气", "Dimensions and Power", "600 W", "425 × 550 × 740 mm\n110–130 V / 220–240 V\n50 / 60 Hz", "a bright neutral studio with a level work surface and no measuring graphics"]
  ],
  detail: [
    ["应用 · 菜单", "Two Flavors. One Counter.", "2 × 15 L", "30 L total capacity\nIndependent bowl controls", "an airy commercial beverage counter with two finished slush drinks off to the left"],
    ["操作 · 部件", "Pull to Serve", "", "Dual drip trays\n304 stainless steel enclosure panels", "a genuine bar service area with space for an original dispensing photo"],
    ["选型 · 规格", "Choose Your Bowl Count", "1 / 2 / 3", "X2: 425 × 550 × 740 mm\nX2: 600 W · 50 / 60 Hz\n110–130 V / 220–240 V\n−3 to −2 °C\nCarton: 480 × 630 × 920 mm\nNet / gross: 45 / 55 kg", "a clean level studio backdrop for an authentic row of product photographs"],
    ["安装 · 柜台", "Plan Your Counter", "425 × 550 × 740 mm", "Counter space · Vent clearance · Local power", "a professional counter with cups on the left and open working space beside the equipment"],
    ["定制 · 询价", "Discuss Your Project", "", "Logo & artwork\nDestination & voltage\nOrder quantity", "a calm commercial demo counter with restrained blank print swatches and finished slush cups on the left"]
  ]
};

const byId = id => document.getElementById(id);
const controls = Object.fromEntries(["mode", "page", "model", "metric", "title", "lines", "subject", "scene", "logo", "brief", "prompt", "canvas", "status", "dimensions", "download"].map(id => [id, byId(id)]));
const pictures = {};
const canvas = controls.canvas;
const context = canvas.getContext("2d");
const params = new URLSearchParams(location.search);
controls.mode.value = params.get("mode") === "detail" ? "detail" : "main";

function activePage() { return layouts[controls.mode.value][Number(controls.page.value)]; }

function listPages() {
  controls.page.replaceChildren(...layouts[controls.mode.value].map((page, index) => new Option(page[0], String(index))));
  pageChanged();
}

function pageChanged() {
  for (const field of ["title", "metric", "lines"]) controls[field].value = "";
  for (const field of ["subject", "scene"]) {
    controls[field].value = "";
    delete pictures[field];
  }
  controls.brief.value = activePage()[4];
  controls.prompt.value = scenePrompt("Muse");
  draw();
}

function scenePrompt(platform) {
  const scene = controls.brief.value.trim() || activePage()[4];
  const ratio = controls.mode.value === "main" ? "square" : "landscape";
  const editing = platform === "Gemini" ? "An optional uploaded image is a reference only for venue lighting and composition. Omit its product." : "If your Muse version accepts a reference photo, use it only for venue lighting and composition. Omit its product.";
  return `Create ONE ${ratio} photorealistic commercial foodservice background: ${scene}. Keep the right-center open for a large countertop machine to be composited later. Realistic light, stainless steel and a neutral palette. ${editing} Output the background only. No machine, logos, letters, numbers, labels, wires, feet, or invented equipment. Do not add decorative borders.`;
}

function fitText(text, x, y, width, initial, minimum, weight, color) {
  if (!text) return true;
  let size = initial;
  do {
    context.font = `${weight} ${size}px Arial, sans-serif`;
    if (context.measureText(text).width <= width) {
      context.fillStyle = color;
      context.fillText(text, x, y + (initial - size) / 2);
      return true;
    }
    size -= 1;
  } while (size >= minimum);
  return false;
}

function wrappedLines(text, width, fontSize, weight) {
  context.font = `${weight} ${fontSize}px Arial, sans-serif`;
  const lines = [];
  for (const paragraph of text.split("\n").filter(Boolean)) {
    let row = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      if (row && context.measureText(row + " " + word).width > width) {
        lines.push(row);
        row = word;
      } else row += (row ? " " : "") + word;
    }
    if (row) lines.push(row);
  }
  return lines;
}

function imageWithin(image, x, y, width, height, cover = false) {
  const scale = (cover ? Math.max : Math.min)(width / image.width, height / image.height);
  const targetWidth = image.width * scale, targetHeight = image.height * scale;
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(image, x + (width - targetWidth) / 2, y + (height - targetHeight) / 2, targetWidth, targetHeight);
  context.restore();
}

function draw() {
  const isDetail = controls.mode.value === "detail";
  const dense = isDetail && controls.page.value === "2";
  const width = 1200, height = isDetail ? (dense ? 1600 : 1500) : 1200;
  canvas.width = width;
  canvas.height = height;
  controls.dimensions.textContent = `${width} × ${height} px · ${isDetail ? (dense ? "3:4" : "4:5") : "1:1"}`;
  const ink = "#102D43", top = isDetail ? 240 : 218, footer = dense ? 330 : 275, photoHeight = height - top - footer;
  context.fillStyle = "#FAFAFA"; context.fillRect(0, 0, width, height);
  context.fillStyle = "#E6EEF2"; context.fillRect(0, top, width, photoHeight);
  context.fillStyle = ink; context.fillRect(0, height - footer, width, footer);
  if (pictures.scene) imageWithin(pictures.scene, 0, top, width, photoHeight, true);
  if (pictures.subject) {
    const half = isDetail && controls.page.value === "2";
    imageWithin(pictures.subject, pictures.scene && !half ? 315 : 48, top + 22, pictures.scene && !half ? 840 : 1104, photoHeight - 44);
  }
  if (pictures.logo) imageWithin(pictures.logo, 48, 25, 140, 54);
  let valid = fitText(controls.model.value.trim(), pictures.logo ? 211 : 48, 63, 940, 31, 24, 700, ink);
  const title = controls.title.value.trim();
  const headings = wrappedLines(title, 1104, 67, 700);
  if (headings.length > 2) valid = false;
  headings.slice(0, 2).forEach((line, index) => {
    valid = fitText(line, 48, 131 + 67 * index, 1104, 67, 42, 700, ink) && valid;
  });
  const metric = controls.metric.value.trim(), footerTop = height - footer;
  let textY = footerTop + 59;
  if (metric) {
    valid = fitText(metric, 48, footerTop + 95, 1104, 76, 44, 700, "#FFFFFF") && valid;
    textY = footerTop + 152;
  }
  const lines = controls.lines.value.split("\n").map(line => line.trim()).filter(Boolean);
  const limit = dense ? 6 : 3;
  if (lines.length > limit) valid = false;
  lines.slice(0, limit).forEach((line, index) => {
    const column = dense ? index % 2 : 0;
    const row = dense ? Math.floor(index / 2) : index;
    valid = fitText(line, 48 + column * 558, textY + 43 * row, dense ? 530 : 1104, 36, 28, 600, "#FFFFFF") && valid;
  });
  controls.download.disabled = !valid || !pictures.subject || !title;
  controls.status.textContent = !valid ? "文字超出版式，请精简后再导出。" : !pictures.subject ? "上传原机照片后可导出。" : !title ? "请输入当前页的标题。" : "可导出，先核对机身和文案。";
}

for (const field of ["subject", "scene", "logo"]) {
  controls[field].addEventListener("change", async event => {
    const file = event.target.files[0];
    delete pictures[field];
    if (!file) { draw(); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (event.target.files[0] === file) { pictures[field] = image; draw(); }
    } catch {
      if (event.target.files[0] === file) { draw(); controls.status.textContent = "图片无法读取，请换 PNG 或 JPG。"; }
    } finally { URL.revokeObjectURL(url); }
  });
}

for (const field of ["model", "metric", "title", "lines"]) controls[field].addEventListener("input", draw);
controls.brief.addEventListener("input", () => { controls.prompt.value = scenePrompt("Muse"); });
controls.mode.addEventListener("change", listPages);
controls.page.addEventListener("change", pageChanged);
byId("example").addEventListener("click", () => {
  const [, title, metric, lines] = activePage();
  controls.title.value = title;
  controls.metric.value = metric;
  controls.lines.value = lines;
  controls.model.value = "ADW15LX2";
  draw();
});

for (const [key, platform] of [["muse", "Muse"], ["gemini", "Gemini"]]) {
  byId(key).addEventListener("click", async () => {
    controls.prompt.value = scenePrompt(platform);
    try {
      await navigator.clipboard.writeText(controls.prompt.value);
      controls.status.textContent = `已复制 ${platform} 指令。`;
    } catch {
      controls.prompt.focus(); controls.prompt.select();
      controls.status.textContent = "请复制已选中的指令。";
    }
  });
}

controls.download.addEventListener("click", () => {
  const model = controls.model.value.trim().replace(/[^a-z\d_-]+/gi, "-") || "AIDEWO";
  const page = String(Number(controls.page.value) + 1).padStart(2, "0");
  const link = document.createElement("a");
  link.download = `${model}-${controls.mode.value}-${page}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});
listPages();
