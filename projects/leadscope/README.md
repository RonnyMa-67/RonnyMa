# LeadScope · 多来源线索工作台

Ronny 的个人 B2B 线索整理工具，使用 HTML、CSS、JavaScript 实现。这个公开快照采用包含完整 CSV 导入与导出流程的本地交付版本，展示从线索录入到跟进管理的业务设计。

## 当前可用

CSV 导入 → 字段预览 → 确认保存 → 批次管理 → 搜索筛选 → 客户详情 → 负责人、跟进与备注 → CSV 导出。也可粘贴字段或手工录入。

支持 Meta、B2B 平台、独立站、展会名片信息手录、邮件及手工五种来源。导出包含 19 列、扩展版和简版。看板按当前批次计算，示例与录入数据分开。

## 运行

无需安装依赖，使用 Node.js：

```bash
npm run dev
```

打开 `http://localhost:4173/`，工作台为 `http://localhost:4173/workspace.html`。

```bash
node checks/check.cjs
```

## 文件

- `site/`：公开介绍与工作台页面。
- `site/local-data.js`：导入、解析和浏览器暂存。
- `site/data.js`：数据字段、虚构示例与筛选导出逻辑。
- `checks/check.cjs`：路由渲染、双语、导入导出和异常场景回归。
- `examples/示例导入.csv`：虚构示例，仅用于体验。
- `site/assets/phosphor/`：图标来源与 MIT 许可证。

## 使用边界

自动背调、Meta 自动同步、名片 OCR、账号权限、云端持久化、团队协作和支付尚未接入。XLSX 需要先转换为 UTF-8 CSV。输入记录使用当前标签页的 sessionStorage 暂存；关闭标签页可能丢失，请及时导出。

演示资料不是客户调查事实；信息完整度也不等于客户价值。该版本不得描述为已上线的自动 AI 背调服务。
