<div align="center">

![🔎 Ronny Scout](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**简体中文 · [English](README.en.md)**

</div>

# 🔎 Ronny Scout

**把客户研究这件事，先摆到桌面上。**

这里是 Ronny Scout 的静态演示工作台。可以导入线索、看 A–J 客户明细、筛选记录、查看商情看板和导出 CSV。内置的 10 位客户都是虚构的，演示不会执行实时背调。

[🎮 打开演示](https://ronnyma-67.github.io/RonnyMa/projects/ronny-scout/) · [📦 安装真正做研究的 Skill](../../skills/ronny-scout/README.md)

## 🧭 可以逛些什么

- 导入：粘贴文本、CSV 或 Excel 复制的 TSV；也可以选择 UTF-8 CSV / TSV / TXT。
- 明细：固定 A–J 十列，搜索、筛选、客户详情和原始输入。
- 看板：品类、国家、评级与业务类型分布，可点击筛选。
- 检查与导出：检测缺失、重复和公式前缀；按当前筛选导出十列 CSV。

## 📎 真实能力与边界

导入只在当前页面内存处理，刷新即清空。它没有登录、云同步或外部研究调用。导入客户保持待核实；看板与开发建议是演示，不代表真实市场结论。

需要 Excel 文件时，先另存为 CSV 或复制单元格粘贴；真实 XLSX 交付可用原生 Skill 的工具。导入需要表头，单次最大 2 MB、合计最多 1,000 条。恢复示例前请先导出想保留的记录。

## 🛠️ 本地试试

下载本目录，保留页面、样式、脚本与图片的相对位置，打开 `index.html` 或用静态服务器运行。无需依赖、API Key 或后端。

```bash
node checks.cjs
```

完整导入格式、字段、检查和品牌说明见[英文技术指南](GUIDE.en.md)与[品牌规则](BRAND_POLICY.md)。源码许可与品牌名称的使用范围分别以各文件为准。

---

[🏠 回到首页](https://github.com/RonnyMa-67/RonnyMa) · [📦 Skills 抽屉](https://github.com/RonnyMa-67/RonnyMa/tree/main/skills) · [🧪 项目柜子](https://github.com/RonnyMa-67/RonnyMa/tree/main/projects)

🌈 做一点，存一点，下次再来。
