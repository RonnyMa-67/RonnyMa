# Ronny Meta Ops

> **⚠️ Muse 专用 / FOR MUSE ONLY**
> 本 skill 专为 **Muse（Meta 的个人 AI 助手）** 设计，仅供 Muse 在所有者的环境中使用，其他 AI 助手/平台请勿使用。许可见 [LICENSE](LICENSE)。

一个 B2B 品牌在 Meta（Facebook 主页 + Instagram + 表单广告）的完整运营模式，由 Muse 端到端跑：付费获客（展会三段式）、主页自然运营、私信自动化、定时汇报。

提炼自一次真实的 **Gulfood Manufacturing** 展会投放 + 主页运营实战：展前/展中/展后三段式表单广告全程跑通，主页周备稿、私信自动回复、早报/周小结/月汇总的定时汇报体系同步落地。文中的品牌示例语境为 Aidewo（商用饮料设备），流程本身已参数化，换品牌只需替换品牌配置。

## 包含什么

- **付费获客**：展前蓄水 → 展中围栏 → 展后约见三段式；小预算不拆分的结构原则；带两道必答筛子题的高意向即时表单；展后线索三查分级（真实/对口/量级 → A/B/C），不陌拜、只约见。
- **自然运营**：五根柱子配比（演示 35 / 工厂 20 / 场景 20 / 科普 15 / 人和展会 10），每周 4 条、海湾工作周、FB+IG 同步；每周批量备稿、所有者一次点头才排期。
- **私信自动化**：即时回复 / 离开消息 / FAQ / 关键词 / 快捷回复五件套英文模板，红线是只收集信息、绝不自动承诺价格/MOQ/交期/运费。
- **定时汇报**：广告早报（主角是昨日新增线索）、主页晨扫、周备稿、周小结、月汇总；便当盒数据卡规格，结论先行、无事不发。
- **打法基准**：线索成本、CTR、CPM 的判断线，停投尺子，加预算尺子，长期市场顺序，跟进速度标准（5 分钟 vs 30 分钟，合格率差约 21 倍）。

## 文件结构

```
ronny-meta-ops/
├── SKILL.md                              # 工作流正文（Muse 执行入口）
├── README.md                             # 本文件
├── LICENSE                               # Muse-Only 许可
└── references/
    ├── ads-playbook.md                   # 广告打法细节与数字基准
    ├── page-operations.md                # 主页运营细节与工具选型
    ├── report-format.md                  # 便当盒数据卡规格
    ├── inbox-automation-templates.md     # 私信五件套英文模板（占位符）
    ├── product-context-template.md       # 产品口径文件模板
    └── scheduled-jobs.md                 # 定时任务清单模板
```

## 怎么在 Muse 里用

1. 把本目录放进 Muse 的 skills 目录，Muse 会在涉及 Meta 广告投放、主页/IG 运营、私信自动化、广告汇报的任务中自动调用。
2. 首次使用先按 SKILL.md 的「开始前」备齐品牌配置（主页、IG、广告账户、市场、工作时间），并先建一份产品口径文件（模板在 `references/product-context-template.md`）。
3. 定时汇报按 `references/scheduled-jobs.md` 的清单逐项建立，时间是北京时间默认值，可按所有者作息调整。

> 本 skill 依赖 Muse 的 Meta 相关连接器（如 meta-ads-cli、facebook-cli）与定时任务能力；在其他助手或平台上没有等效运行环境，这也是它标注 Muse 专用的原因。

## 脱敏说明

仓库内**没有任何真实 ID 与客户数据**：广告账户、主页、表单、任务等标识一律使用 `{{PAGE}}`、`{{AD_ACCOUNT}}` 等占位符；不含真实人名、内部人员信息与任何客户线索数据。保留的数字只有打法基准区间（如日预算 $15–25、线索成本判断线），属于方法论而非内部机密。品牌名 Aidewo 仅作为公开营销语境的示例出现。

## License

Muse-Only 自定义许可，见 [LICENSE](LICENSE)：版权归 Ronny Ma 所有，仅授权在 Muse 中使用。
