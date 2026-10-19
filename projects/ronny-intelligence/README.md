# Ronny Intelligence · B2B 客户研究与线索管理原型

围绕海外客户开发制作的个人工具，由 Ronny 提出外贸运营需求、设计线索字段与评估规则，并借助 AI 辅助开发。该公开快照来自本地 React / TypeScript 项目，已替换公司专用提示词、表单标识和联系人示例。

## 代码中包含的功能

- CSV / XLSX / XLS、文本和图片输入，保留原始线索字段。
- Meta 表单字段映射、批次结果对齐与缺行校验。
- 使用 Gemini 与 Google Search 工具补充客户业务资料；将来源证据、自报信息、推断和未知信息分开。
- 线索评估、CRM 列表、详情、筛选、看板及 Excel 导出。
- 浏览器本地保存；包含可选 Supabase 适配代码和 PWA 配置。

## 源码导航

| 文件 | 内容 |
|---|---|
| `services/metaLeadParser.ts` | 广告表单解析与字段映射 |
| `services/leadImport.ts` | 输入行与 AI 返回结果对应，防止漏行或混行 |
| `services/leadPrompt.ts` | 客户研究与证据要求 |
| `services/leadRules.ts` | 客户评估与后处理规则 |
| `components/CRMView.tsx` | CRM 视图与跟进操作 |
| `components/StatsDashboard.tsx` | 统计看板 |
| `services/excelExport.ts` | Excel 输出 |

## 本地运行

需要 Node.js 与 npm。在本目录执行：

```bash
npm install
npm run dev
```

默认端口为 3000。无 API 密钥时可以查看界面，但不能完成真实 AI 研究。

如需在自己电脑上试用 API，复制 `.env.example` 为 `.env.local`，填写本人可使用的 `GEMINI_API_KEY` 后重新启动。调用可能产生服务商费用，所用模型是否可用取决于账号和服务商。

```bash
npm run lint
npm run build
```

## 使用边界

这是本地原型。当前 Vite 配置会把 API 密钥嵌入浏览器构建结果，因此只能在可信的本地环境中使用自己的密钥；含密钥的构建不能部署到公开网站。正式部署需要服务端代理和访问控制。默认浏览器保存也不等同于团队云端协作。

仓库没有 API 密钥、客户数据库、生产 Supabase 配置或真实客户样例。模型结果需要人工核查，不能直接作为企业资质或采购能力的事实。公开整理时未执行真实付费 API 调用。
