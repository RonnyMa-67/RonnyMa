# Ronny 的外贸运营工具

这里收录三个围绕 B2B 客户开发、线索整理与销售跟进制作的个人工具。Ronny 负责提出业务需求、梳理字段及判断规则，并借助 AI 辅助开发和迭代。公开版本整理日期：2026-10-19。

| 工具 | 业务问题 | 主要源码 | 当前形态 |
|---|---|---|---|
| [Ronny Intelligence](ronny-intelligence/) | 多来源线索需要统一整理，并补充客户业务资料 | `components/LeadInput.tsx`、`services/metaLeadParser.ts`、`services/leadPrompt.ts`、`services/leadRules.ts`、`components/CRMView.tsx` | 可构建的前端原型，AI 调用及云数据库需要另行配置 |
| [LeadScope](leadscope/) | 线索分散，负责人、跟进状态与导出字段不统一 | `site/local-data.js`、`site/data.js`、`site/workspace.html` | 在浏览器处理 CSV 和手工录入，自动背调未接入 |
| [外贸 CRM 小程序](trade-crm/) | 客户资料停留在表格，难以安排每日跟进与团队分工 | `cloudfunctions/crm/index.js`、`pages/`、`tools/xlsx_to_json.py` | 微信云开发原型，需要配置环境并部署验收 |

## 简历中可对应的实践

- 客户资料导入与字段整理：可查看 CSV / Excel 解析、Meta 字段映射和导出逻辑。
- AI 辅助客户研究：可查看提示词、事实与推断的区分、结果校验及客户评估规则。
- 销售跟进管理：可查看 CRM 视图、负责人、跟进记录、下次联系日期与团队权限实现。
- 运营工具原型：可查看组件、数据模型、看板和本地运行方式。

源码展示的是实现与设计过程。项目的示例客户均为虚构或替换后的演示内容；不以示例评估结果证明真实成交或销售业绩。

## 公开版本整理

已排除真实客户导出、密钥、账号配置、本地数据库、对话历史、公司内部文档和依赖安装目录。Ronny Intelligence 中的公司专用名称与示例表单已通用化。原始本地项目未被覆盖。

公开文件保留原有第三方依赖与素材许可，见各项目的说明和许可文件。未为整个仓库擅自添加统一的开源授权。

## 验证

验证结果见 [VALIDATION.md](VALIDATION.md)。API 实际联网、微信真机及生产权限测试需要使用者自己的服务环境；这些结果不会用本地静态检查代替。
