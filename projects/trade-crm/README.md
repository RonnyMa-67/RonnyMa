<div align="center">

![🌱 Trade CRM](https://raw.githubusercontent.com/RonnyMa-67/RonnyMa/main/assets/corner-projects.svg)

**简体中文 · [English](README.en.md)**

</div>

# 🌱 Trade CRM

**客户资料进了表，下一次联系也得有着落。**

微信云开发小程序原型。我梳理客户字段、团队分工和每日跟进需求，借助 AI 辅助开发。将线索接入客户库，记录负责人、阶段和下次联系时间。

## 🧭 代码里有什么

- 今日跟进、客户列表、详情与团队管理。
- 客户阶段、负责人、下次跟进日期与时间线。
- 云函数处理身份、团队范围和角色权限，记录写入操作。
- Excel 转云数据库 JSON 的工具与定时提醒模板。

## 🛠️ 配置与运行

需要微信开发者工具、自己的小程序 AppID 与云开发环境。

1. 导入本目录，在 `project.config.json` 填 AppID，在 `app.js` 填云环境 ID。
2. 创建 `teams`、`members`、`customers`、`followups`、`audit_logs`；数据库仅管理端可读写，通过云函数访问。
3. 部署 `cloudfunctions/crm`，创建团队，验证角色和团队隔离。
4. 如需提醒，先配置自己的订阅消息模板，再部署 `dailyReminder`。仓库配置只是模板。

```bash
python3 -m pip install -r requirements.txt
python3 tools/xlsx_to_json.py /path/to/your-demo.xlsx --team-id=YOUR_TEAM_ID
```

转换结果在被忽略的 `data/`。字段见脚本的 `COLUMNS`。`examples/customer-demo.json` 完全虚构，测试前需替换团队 ID。

## 📎 当前状态

待部署验收，不包含正在运行的微信云环境。未执行微信真机、订阅消息或生产权限测试，团队与角色隔离需在自己的环境验证。没有 PI 报价或真实成交统计，也没有上传客户数据导出。

---

[🏠 回到首页](https://github.com/RonnyMa-67/RonnyMa) · [📦 Skills 抽屉](https://github.com/RonnyMa-67/RonnyMa/tree/main/skills) · [🧪 项目柜子](https://github.com/RonnyMa-67/RonnyMa/tree/main/projects)

🌈 做一点，存一点，下次再来。
