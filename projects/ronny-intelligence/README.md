<div align="center">

![🗂️ Ronny Intelligence](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**简体中文 · [English](README.en.md)**

</div>

# 🗂️ Ronny Intelligence

**来源有点多，先把线索放到一起。**

一个 React / TypeScript 前端原型。我负责梳理外贸运营需求、线索字段和判断规则，再借助 AI 辅助实现。公开快照已替换公司专用提示词、表单标识和联系人示例。

## 🧭 里面有什么

- CSV / Excel、文本和图片输入，保留原始线索。
- Meta 表单字段映射、批次对齐与漏行检查。
- Gemini 与 Google Search 适配；区分证据、自报、推断和未知。
- 线索评估、CRM、筛选、详情、看板和 Excel 导出。
- 浏览器本地保存，可选 Supabase 适配与 PWA 配置。

## 🛠️ 本地运行

需要 Node.js 与 npm，在本目录执行：

```bash
npm install
npm run dev
# 检查
npm run lint
npm run build
```

默认端口 3000。无 Key 可看界面，不能完成真实 AI 研究。若在可信的本地环境试用，将 `.env.example` 复制为 `.env.local`，配置自己的 `GEMINI_API_KEY` 并重启；调用可能产生服务商费用。

## 📎 这个坑目前到哪了

当前 Vite 配置将 Key 嵌入浏览器构建，含密钥的构建不能部署公开网站。正式部署需要服务端代理与访问控制；本地保存也不等于团队云协作。未执行真实付费 API 调用，研究结果仍需人工核查。

## 🗺️ 源码路标

`services/metaLeadParser.ts`：表单映射 · `leadImport.ts`：批次对齐 · `leadPrompt.ts`：研究要求 · `leadRules.ts`：评级规则 · `components/CRMView.tsx`：跟进 · `StatsDashboard.tsx`：看板 · `services/excelExport.ts`：导出。

---

[🏠 回到首页](https://github.com/RonnyMa-67/RonnyMa) · [📦 Skills 抽屉](https://github.com/RonnyMa-67/RonnyMa/tree/main/skills) · [🧪 项目柜子](https://github.com/RonnyMa-67/RonnyMa/tree/main/projects)

🌈 做一点，存一点，下次再来。
