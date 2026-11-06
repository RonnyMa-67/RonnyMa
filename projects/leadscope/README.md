<div align="center">

![📋 LeadScope](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**简体中文 · [English](README.en.md)**

</div>

# 📋 LeadScope

**把线索放好，别让跟进靠记忆。**

浏览器本地的 B2B 线索工作台，用 HTML、CSS、JavaScript 做的。先把导入、负责人、跟进和导出这一圈理顺。

## 🧭 当前能做

CSV 导入 → 字段预览 → 确认保存 → 批次管理 → 搜索筛选 → 客户详情 → 负责人、跟进与备注 → CSV 导出。也可粘贴或手工录入。

覆盖 Meta、B2B 平台、独立站、展会名片手录、邮件及手工来源。导出有 19 列扩展版与简版，看板按当前批次计算，示例和录入数据分开。

## 🛠️ 运行

需要 Node.js，无需安装依赖：

```bash
npm run dev
node checks/check.cjs
```

打开 `http://localhost:4173/`，工作台在 `/workspace.html`。

## 📎 还没接上的部分

自动背调、Meta 自动同步、名片 OCR、账号权限、云端持久化、团队协作与支付未接入。XLSX 请先转 UTF-8 CSV。输入使用当前标签页的 sessionStorage 暂存，关闭可能丢失，请及时导出。

示例不代表客户调查事实，信息完整度也不等于客户价值。

## 🗺️ 源码路标

`site/`：页面 · `site/local-data.js`：导入与暂存 · `site/data.js`：示例、筛选和导出 · `checks/check.cjs`：路由、双语与导入导出检查 · `examples/示例导入.csv`：虚构示例 · `site/assets/phosphor/`：图标与 MIT 许可。

---

[🏠 回到首页](https://github.com/RonnyMa-67/RonnyMa) · [📦 Skills 抽屉](https://github.com/RonnyMa-67/RonnyMa/tree/main/skills) · [🧪 项目柜子](https://github.com/RonnyMa-67/RonnyMa/tree/main/projects)

🌈 做一点，存一点，下次再来。
