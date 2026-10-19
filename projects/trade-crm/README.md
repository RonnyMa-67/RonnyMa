# 外贸 CRM · 微信小程序原型

面向海外客户跟进的个人工具原型，由 Ronny 梳理客户字段、团队分工与每日跟进需求，并借助 AI 辅助开发。将表格中的线索接入客户库，记录负责人、跟进阶段与下次联系日期。

## 代码中包含的功能

- 今日跟进、客户列表、客户详情与团队管理四类页面。
- 客户阶段、负责人、下次跟进日期和跟进时间线。
- 云函数集中处理身份、团队范围与角色权限，写入操作记录。
- 背调 Excel 转换为云数据库导入 JSON 的 Python 工具。
- 定时提醒云函数模板。

## 运行与配置

需要微信开发者工具、自己的小程序 AppID 和微信云开发环境。

1. 导入本目录，在 `project.config.json` 填写自己的 AppID，在 `app.js` 填写自己的云环境 ID。
2. 创建 `teams`、`members`、`customers`、`followups`、`audit_logs` 数据集合；将数据库设为仅管理端可读写，通过云函数访问。
3. 部署 `cloudfunctions/crm`，在小程序中创建团队，检查角色与团队数据隔离。
4. 如使用提醒，先配置自己的订阅消息模板，再部署 `dailyReminder`。仓库中的配置是模板。

表格转换工具使用 Python 3：

```bash
python3 -m pip install -r requirements.txt
python3 tools/xlsx_to_json.py /path/to/your-demo.xlsx --team-id=YOUR_TEAM_ID
```

转换结果保存在被忽略的 `data/`。输入字段和格式见 `tools/xlsx_to_json.py` 的 `COLUMNS` 定义。`examples/customer-demo.json` 是完全虚构的结构示例，须替换团队 ID 才能用于自己的测试环境。

## 使用边界

这是待部署验收的原型，不包含已运行的微信云环境；公开整理时没有执行微信真机、订阅消息或生产权限测试。角色和团队隔离的实现需在自己的环境继续验证。此快照没有 PI 报价功能，也没有真实成交统计。

原目录中的客户数据导出与预览没有上传；公开目录仅含代码和虚构示例。
