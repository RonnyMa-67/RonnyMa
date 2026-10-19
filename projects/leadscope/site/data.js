/* ==================================================================
   LeadScope 数据层 · 唯一事实来源
   ------------------------------------------------------------------
   这一版把「19 列背调 Excel」作为统一结构：
     1 序号          2 客户姓名       3 职位           4 表单原选品类
     5 表单合作意向   6 国家           7 企业识别映射    8 实际业务类型
     9 表单原填类型  10 电子邮箱      11 联络电话       12 官方网站
    13 主营业务与供应链  14 企业规模与采购实力  15 背调评估结论
    16 针对性推销策略  17 负责人员       18 跟进记录      19 备忘便签

   页面上所有数字、表格、详情、行动卡、导出都从同一份记录算出来，
   不在视图里写死任何统计值。

   三条硬边界（与首页 / 帮助 / 广告组 / 动态报告同步，不能只改一处）：
     · 原始表单只分析完整度与背调准备度，不凭公司名或企业邮箱判真买家，
       不输出加预算 / 减预算 / 停投放的指令。
     · 查不到不等于有问题。
     · 广告组分析只对带广告字段的数据开放；其他来源给来源构成与信息缺失。
   ================================================================== */
window.LS = (function () {
  'use strict';

  /* ---------------- 双语助手 ---------------- */
  var LANG = 'en';
  function T(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return LANG === 'en' ? (v.en || v.zh || '') : (v.zh || v.en || '');
  }
  function setLang(l) { LANG = (l === 'en') ? 'en' : 'zh'; }

  /* ---------------- 19 列定义 ---------------- */
  var COLS19 = [
    { k: 'no',       zh: '序号',               en: 'No.' },
    { k: 'name',     zh: '客户姓名',            en: 'Contact' },
    { k: 'title',    zh: '职位',               en: 'Job title' },
    { k: 'category', zh: '表单原选品类',         en: 'Requested category' },
    { k: 'intent',   zh: '表单合作意向',         en: 'Stated intent' },
    { k: 'country',  zh: '国家',               en: 'Country' },
    { k: 'entmap',   zh: '企业识别映射',         en: 'Entity match' },
    { k: 'biztype',  zh: '实际业务类型',         en: 'Actual business' },
    { k: 'selftype', zh: '表单原填类型',         en: 'Self-reported type' },
    { k: 'email',    zh: '电子邮箱',            en: 'Email' },
    { k: 'phone',    zh: '联络电话',            en: 'Phone' },
    { k: 'website',  zh: '官方网站',            en: 'Website' },
    { k: 'mainbiz',  zh: '主营业务与供应链',      en: 'Main business & supply chain' },
    { k: 'scale',    zh: '企业规模与采购实力',     en: 'Size & purchasing power' },
    { k: 'verdict',  zh: '背调评估结论',         en: 'Assessment' },
    { k: 'strategy', zh: '针对性推销策略',       en: 'Next-step strategy' },
    { k: 'owner',    zh: '负责人员',            en: 'Owner' },
    { k: 'followup', zh: '跟进记录',            en: 'Follow-up' },
    { k: 'memo',     zh: '备忘便签',            en: 'Memo' }
  ];

  /* ---------------- 受控词表 ---------------- */
  /* 四档结论。刻意不用颜色区分，去色后仍可读。 */
  var VERDICT = {
    strong:  { zh: '强烈推荐', en: 'Strong match' },
    worth:   { zh: '值得跟进', en: 'Worth pursuing' },
    pending: { zh: '待补信息', en: 'Needs more info' },
    hold:    { zh: '谨慎暂弃', en: 'Hold for now' }
  };
  /* 优先级 / 信息状态 / 风险是三个独立维度，允许重叠，重叠规则见 OVERLAP */
  var PRIORITY = {
    p1:  { zh: '优先接待', en: 'Priority' },
    p2:  { zh: '正常排期', en: 'Normal' },
    p3:  { zh: '低优先',   en: 'Low' }
  };
  var INFOSTATE = {
    ready:  { zh: '信息齐',   en: 'Complete' },
    partial:{ zh: '部分缺失', en: 'Partial' },
    thin:   { zh: '关键缺失', en: 'Key gaps' }
  };
  var RISK = {
    none:    { zh: '无风险提示', en: 'No flags' },
    unverified: { zh: '主体未核实', en: 'Entity unverified' },
    conflict:   { zh: '信息矛盾',   en: 'Conflicting info' },
    sanctioned: { zh: '涉制裁名单', en: 'Sanction list hit' }
  };
  /* 三个维度的重叠规则：只有这一种组合会同时出现，其余互斥。
     在详情和帮助里都引用同一段文字。 */
  var OVERLAP = {
    zh: '优先级看「值不值得排人」，信息状态看「判断够不够稳」，风险独立复核，主体未核实不等于风险命中。'
      + '前两个可以同时出现（优先接待但信息部分缺失），确认存在信息矛盾或其他实质风险时，先处理风险再跟进。',
    en: 'Priority is about who to serve first; info state is about how solid the judgment is; '
      + 'risk requires separate review; an unverified entity is not a confirmed risk. The first two can co-occur (priority + partial info). '
      + 'Review confirmed material risks before pursuing the opportunity.'
  };

  var SOURCES = {
    meta:    { zh: '广告表单',  en: 'Ad form',      sub: 'Meta 等',       short: 'Meta' },
    alibaba: { zh: 'B2B 平台', en: 'B2B platform', sub: '阿里国际站等',   short: 'Alibaba' },
    site:    { zh: '独立站表单', en: 'Site form',   sub: '官网询盘',       short: 'Site' },
    expo:    { zh: '展会名片',  en: 'Expo card',   sub: '名片与扫码',     short: 'Expo' },
    email:   { zh: '邮件与手工', en: 'Email & manual', sub: '手工整理',    short: 'Manual' }
  };

  /* 各来源入口的真实状态。规划中的不写成已支持。 */
  var CHANNELS = [
    { src: 'meta',    how: 'file',   st: 'ready',   note: { zh: 'Meta 线索中心手动导出 CSV 后上传', en: 'Export CSV from Meta Leads Centre, then upload' } },
    { src: 'alibaba', how: 'file',   st: 'ready',   note: { zh: '国际站询盘手动导出表后上传', en: 'Export the inquiry list, then upload' } },
    { src: 'site',    how: 'file',   st: 'ready',   note: { zh: '独立站表单后台导出 CSV 后上传', en: 'Export CSV from your site form backend' } },
    { src: 'meta',    how: 'paste',  st: 'ready',   note: { zh: '直接粘贴表单原始字段', en: 'Paste the raw form fields' } },
    { src: 'site',    how: 'paste',  st: 'ready',   note: { zh: '粘贴「字段：值」，解析结构化字段', en: 'Paste field: value lines to parse structured fields' } },
    { src: 'expo',    how: 'photo',  st: 'todo',    note: { zh: '名片 OCR 待接入；接通前先走单条录入', en: 'Card OCR not connected yet; use single entry for now' } },
    { src: 'expo',    how: 'single', st: 'ready',   note: { zh: '手工录入名片信息，先核对再进背调', en: 'Type the card in by hand, verify before screening' } },
    { src: 'email',   how: 'single', st: 'ready',   note: { zh: '邮件往来手工整理成一条线索', en: 'Log an email thread as one lead' } },
    { src: 'alibaba', how: 'single', st: 'ready',   note: { zh: '补录历史询盘', en: 'Log past inquiries one by one' } }
  ];
  var HOWTO = {
    file:   { zh: '表格文件', en: 'Spreadsheet file' },
    paste:  { zh: '粘贴文本', en: 'Paste text' },
    photo:  { zh: '图片或名片', en: 'Image or card' },
    single: { zh: '单条录入', en: 'Single entry' }
  };

  var STATUS = {
    ready:  { zh: '已可用',   en: 'Available' },
    sample: { zh: '示例数据', en: 'Sample data' },
    manual: { zh: '手动流程', en: 'Manual step' },
    todo:   { zh: '待接入',   en: 'Not connected' },
    plan:   { zh: '规划中',   en: 'Planned' },
    off:    { zh: '暂未开放', en: 'Not open' }
  };

  /* ---------------- 事实 / 推测 标记 ---------------- */
  /* 每条判断依据都带标记。链接字段留着，接入背调后填真实来源。 */
  function fact(zh, en, link) { return { kind: 'fact', zh: zh, en: en, link: link || null }; }
  function guess(zh, en, why) { return { kind: 'guess', zh: zh, en: en, why: why || null }; }
  function unknown(zh, en) { return { kind: 'unknown', zh: zh, en: en }; }

  /* ---------------- 示例数据（脱敏） ----------------
     结构照 2026-10-01 真实批次改写：人名、公司、邮箱、电话、序号全部换成假数据，
     判断逻辑、字段分布、缺口形态保持真实。 */
  var LEADS = [
    {
      id: 'L-2401', source: 'meta', batch: 'B-0930',
      raw: {
        name: 'A. Rahman', title: 'Purchase Manager',
        category: 'beverage_dispensers', intent: 'equipment_consultation',
        country: 'Malaysia', email: 'demo-buyer@example.com', phone: '+60 1x-xxx xxxx',
        website: '', company: 'Permata Beverage Supplies Sdn Bhd',
        form: { zh: 'Meta 表单（门店设备咨询）', en: 'Meta form (store equipment)' },
        ext: {
          campaign: 'MY_Beverage_Oct', adset: 'MY_HoReCa_Beverage', ad: 'Video_Dispenser_15s',
          rawText: { zh: '品类：饮品分发机；意向：门店设备咨询；备注：门店 12 家',
                     en: 'Category: beverage dispensers; intent: discuss store equipment; note: 12 stores' }
        }
      },
      ent: {
        identified: true, name: 'Permata Beverage Supplies Sdn Bhd', nameRaw: 'Permata Beverage',
        registry: 'MY', confidence: 'high',
        evidence: [
          fact('企业邮箱域名与公司名一致', 'Corporate email domain matches the company name'),
          fact('官网列有 12 家门店地址', 'Official site lists 12 store addresses', 'https://example.com/permata/stores')
        ]
      },
      ana: {
        biztype: { zh: '连锁餐饮 / 商用集团', en: 'F&B chain / commercial group' },
        roleCode: 'L1', selftype: { zh: '餐饮集团', en: 'Restaurant group' },
        mainbiz: { zh: '主营饮品门店连锁运营，采购集中在饮品设备与耗材，官网有集团采购入口。',
                   en: 'Runs a beverage store chain; purchases concentrate on dispensing equipment and consumables.' },
        scale: { zh: '50-200 人 / 预估年采购 $8万-20万', en: '50-200 staff / est. $80k-200k a year' },
        verdict: 'strong',
        gaps: [],
        evidence: [
          fact('主营与品类直接对口', 'Main business matches the category directly'),
          fact('规模达到集团采购量级', 'Scale reaches group-purchase volume')
        ],
        strategy: { zh: '先确认门店配置、每日用量和计划数量，再提供对应的设备资料。',
                    en: 'Ask about store setup, daily usage and planned quantities, then share the relevant equipment details.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p1', info: 'ready', risk: 'none' }
    },
    {
      id: 'L-2402', source: 'meta', batch: 'B-0930',
      raw: {
        name: 'M. Haddad', title: 'Owner',
        category: 'instant_coffee_machines', intent: 'online_meeting',
        country: 'Qatar', email: 'demo-buyer@example.com', phone: '+974 3x-xxx xxxx',
        website: '', company: '',
        form: { zh: 'Meta 表单（速溶咖啡机）', en: 'Meta form (instant coffee)' },
        ext: {
          campaign: 'QA_Coffee_Leads', adset: 'QA_CafeOwners_Broad', ad: 'Image_CoffeeBar',
          rawText: { zh: '品类：速溶咖啡机；意向：先线上聊；公司名：未填',
                     en: 'Category: instant coffee machines; intent: online chat first; company: not filled' }
        }
      },
      ent: {
        identified: false, name: '', nameRaw: '',
        registry: '', confidence: 'none',
        evidence: [ unknown('只有个人邮箱，没有公司名', 'Personal email only, no company name') ]
      },
      ana: {
        biztype: { zh: '未识别', en: 'Not identified' },
        roleCode: '', selftype: { zh: '咖啡连锁（自报）', en: 'Coffee chain (self-reported)' },
        mainbiz: { zh: '只有自报的「咖啡连锁」，查不到对应主体，主营业务无法确认。',
                   en: 'Only a self-reported "coffee chain"; no matching entity found, main business unconfirmed.' },
        scale: { zh: '未获取', en: 'Not available' },
        verdict: 'pending',
        gaps: [
          { zh: '公司名或店铺名', en: 'Company or store name' },
          { zh: '官网或门店地址', en: 'Website or store address' }
        ],
        evidence: [
          guess('自报「连锁」与个人邮箱并存，角色存疑', 'Self-reported chain vs. personal email; role unclear',
                '自报类型不作为判断依据，只作对照'),
          unknown('无官网可查', 'No website to check')
        ],
        strategy: { zh: '先回一句确认主体名称与门店数量，拿到公司名再进背调，不预判。',
                    en: 'Reply once asking for the entity name and store count; screen only after that.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: { zh: '邮箱为个人邮箱，不代表有问题', en: 'Personal email is not a red flag by itself' } },
      flags: { priority: 'p3', info: 'thin', risk: 'none' }
    },
    {
      id: 'L-2403', source: 'alibaba', batch: 'B-0930',
      raw: {
        name: 'L. Moreau', title: 'Sourcing Director',
        category: 'wine_dispensers', intent: 'sample_order',
        country: 'France', email: 'demo-buyer@example.com', phone: '+33 x-xx-xx-xx-xx',
        website: '******.fr', company: 'Vins & Distribution SARL',
        form: { zh: '国际站询盘', en: 'Alibaba inquiry' },
        ext: {
          platform: { zh: '阿里国际站', en: 'Alibaba.com' },
          inquiry: { zh: '询红酒分发机 8 台，问 CE 认证与法语文案，要求寄样。',
                     en: 'Asked for 8 wine dispensers, CE cert and French UI, samples required.' },
          productPage: 'wine-dispenser-4bottle'
        }
      },
      ent: {
        identified: true, name: 'Vins & Distribution SARL', nameRaw: 'Vins & Distribution',
        registry: 'FR', confidence: 'high',
        evidence: [
          fact('企业邮箱域名与公司名一致', 'Corporate email domain matches the company name'),
          fact('询盘提到 CE 认证，符合欧盟进口商身份', 'CE cert request fits an EU importer')
        ]
      },
      ana: {
        biztype: { zh: '进口分销商', en: 'Importer / distributor' },
        roleCode: 'L1', selftype: { zh: '进口商/分销商', en: 'Importer / distributor' },
        mainbiz: { zh: '主营酒类分销，向餐饮终端供货，设备品类与本方产品线重合。',
                   en: 'Wine distribution supplying restaurants; category overlaps our product line.' },
        scale: { zh: '20-50 人 / 预估年采购 $5万-15万', en: '20-50 staff / est. $50k-150k a year' },
        verdict: 'worth',
        gaps: [ { zh: '分销覆盖的终端数量', en: 'Number of outlets served' } ],
        evidence: [
          fact('业务角色 L1 进口分销，品类强匹配', 'Role L1 importer, strong category match'),
          guess('规模按公司人数与品类推算', 'Scale inferred from headcount and category', '非实测，待对方确认')
        ],
        strategy: { zh: '寄样前先确认终端覆盖数，谈首批 8 台的交期与 CE 文件。',
                    en: 'Confirm outlet coverage before samples; discuss lead time and CE docs for the first 8 units.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: { zh: '已寄目录，等回复', en: 'Catalogue sent, awaiting reply' }, memo: '' },
      flags: { priority: 'p2', info: 'partial', risk: 'none' }
    },
    {
      id: 'L-2404', source: 'site', batch: 'B-1001',
      raw: {
        name: 'S. Okafor', title: 'Operations',
        category: 'blenders', intent: 'price_list',
        country: 'Nigeria', email: 'demo-buyer@example.com', phone: '+234 8xx xxx xxxx',
        website: '', company: 'Sunrise Hotels Group',
        form: { zh: '独立站表单', en: 'Site form' },
        ext: {
          page: { zh: '/pages/commercial-blender', en: '/pages/commercial-blender' },
          inquiry: { zh: '问沙冰机商用款报价与电压（230V），附酒店名。',
                     en: 'Asked for commercial blender pricing and 230V voltage, hotel name attached.' }
        }
      },
      ent: {
        identified: true, name: 'Sunrise Hotels Group', nameRaw: 'Sunrise Hotels',
        registry: 'NG', confidence: 'medium',
        evidence: [
          fact('询盘附酒店名，与邮箱域名部分一致', 'Hotel name in inquiry matches email domain partially'),
          guess('未查到注册全称，主体以酒店名暂记', 'Full registered name not found; logged under hotel name', '待补注册号')
        ]
      },
      ana: {
        biztype: { zh: '终端商用（酒店）', en: 'End-use commercial (hotel)' },
        roleCode: 'L3', selftype: { zh: '酒店', en: 'Hotel' },
        mainbiz: { zh: '酒店运营方，设备为自己使用，采购频次低但单次量可以。',
                   en: 'Hotel operator buying for own use; low frequency, decent volume per order.' },
        scale: { zh: '50-200 人 / 预估年采购 $2万-6万', en: '50-200 staff / est. $20k-60k a year' },
        verdict: 'worth',
        gaps: [ { zh: '门店数量', en: 'Number of properties' } ],
        evidence: [
          fact('品类匹配，电压要求符合当地电网', 'Category matches; 230V fits the local grid'),
          fact('角色 L3 终端商用，非分销', 'Role L3 end-use, not distribution')
        ],
        strategy: { zh: '按单店配置报价，附 230V 机型与本地认证说明。',
                    en: 'Quote per property with the 230V model and local certification notes.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p2', info: 'partial', risk: 'none' }
    },
    {
      id: 'L-2405', source: 'expo', batch: 'B-1001',
      raw: {
        name: 'R. Almeida', title: 'Director',
        category: 'protein_machines', intent: 'visit_booth',
        country: 'Brazil', email: 'demo-buyer@example.com', phone: '+55 11 9xxxx-xxxx',
        website: '', company: 'Nutri Suprimentos LTDA',
        form: { zh: '展会名片（待核对）', en: 'Expo card (to verify)' },
        ext: {
          expoName: { zh: '海外酒店餐饮展 2026-10-15', en: 'International hospitality trade show, 2026-10-15' },
          cardImage: 'card-almeida.jpg',
          ocr: {
            state: 'unconfirmed',
            fields: [
              { k: 'name',   v: 'R. Almeida',           ok: true },
              { k: 'company',v: 'Nutri Suprimentos LTDA', ok: true },
              { k: 'email',  v: 'demo-buyer@example.com', ok: false, why: { zh: '域名需核对', en: 'Domain needs checking' } },
              { k: 'phone',  v: '+55 11 9xxxx-xxxx',     ok: false, why: { zh: '识别为 9xxxx，需人工确认', en: 'Read as 9xxxx, needs human check' } }
            ],
            note: { zh: 'OCR 结果未经核对前不进背调。', en: 'OCR results stay out of screening until verified.' }
          }
        }
      },
      ent: {
        identified: false, name: 'Nutri Suprimentos LTDA', nameRaw: 'Nutri Suprimentos',
        registry: '', confidence: 'low',
        evidence: [ unknown('名片 OCR 待核对，主体未确认', 'Card OCR unverified, entity not confirmed') ]
      },
      ana: {
        biztype: { zh: '待核对', en: 'To verify' },
        roleCode: '', selftype: { zh: '名片显示贸易类', en: 'Card shows a trading business' },
        mainbiz: { zh: '名片只写了「营养品供应」，主营范围太宽，等核对后再判。',
                   en: 'The card only says "nutrition supplies" — too broad to judge until verified.' },
        scale: { zh: '未获取', en: 'Not available' },
        verdict: 'pending',
        gaps: [ { zh: '名片邮箱与电话核对', en: 'Verify card email and phone' }, { zh: '主营范围', en: 'Main business scope' } ],
        evidence: [ unknown('主体识别被 OCR 核对阻塞', 'Entity ID blocked on card verification') ],
        strategy: { zh: '展位现场当面核对名片信息，确认后再进背调。',
                    en: 'Verify the card face to face at the booth, then screen.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: { zh: '名片拍照已存', en: 'Card photo saved' } },
      flags: { priority: 'p3', info: 'thin', risk: 'none' }
    },
    {
      id: 'L-2406', source: 'email', batch: 'B-1001',
      raw: {
        name: 'K. Tanaka', title: 'Purchasing',
        category: 'multi_function', intent: 'catalogue',
        country: 'Japan', email: 'demo-buyer@example.com', phone: '+81 x-xxxx-xxxx',
        website: '******.co.jp', company: 'Osaka Beverage Trading Co., Ltd.',
        form: { zh: '邮件往来（手工录入）', en: 'Email thread (manual entry)' },
        ext: {
          emailSubject: { zh: 'Re: 多功能饮品设备报价', en: 'Re: Quote for multi-function beverage units' },
          inquiry: { zh: '第三封邮件，问了交期与售后，要日文说明书。',
                     en: 'Third email; asked about lead time, after-sales and a Japanese manual.' }
        }
      },
      ent: {
        identified: true, name: 'Osaka Beverage Trading Co., Ltd.', nameRaw: 'Osaka Beverage Trading',
        registry: 'JP', confidence: 'high',
        evidence: [ fact('企业邮箱域名与公司名一致', 'Corporate email domain matches the company name') ]
      },
      ana: {
        biztype: { zh: '贸易代理商', en: 'Trading agent' },
        roleCode: 'L2', selftype: { zh: '贸易商', en: 'Trading company' },
        mainbiz: { zh: '代理多个设备品牌，替终端客户询价，自己不一定是最终用户。',
                   en: 'Carries several equipment brands and quotes for end clients; may not be the end user.' },
        scale: { zh: '10-50 人 / 预估年采购 $3万-10万', en: '10-50 staff / est. $30k-100k a year' },
        verdict: 'worth',
        gaps: [ { zh: '代理的品牌清单', en: 'List of brands carried' } ],
        evidence: [
          fact('角色 L2 代理，需确认是否独家', 'Role L2 agent; exclusivity unconfirmed'),
          guess('第三封邮件问售后，意向真实但量级未知', 'Third email asks about after-sales; intent real, volume unknown', '邮件频率推断')
        ],
        strategy: { zh: '发日文说明书与代理政策，问清目标终端类型再报批量价。',
                    en: 'Send the Japanese manual and agency terms; ask about end-client type before batch pricing.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: { zh: '已发说明书', en: 'Manual sent' }, memo: '' },
      flags: { priority: 'p2', info: 'partial', risk: 'none' }
    },
    {
      id: 'L-2407', source: 'meta', batch: 'B-1001',
      raw: {
        name: 'T. Novak', title: '',
        category: 'blenders', intent: 'price_list',
        country: 'Czechia', email: 'novak****@seznam.cz', phone: '+420 xxx xxx xxx',
        website: '', company: '',
        form: { zh: 'Meta 表单（沙冰机）', en: 'Meta form (blenders)' },
        ext: {
          campaign: 'CZ_Blenders_Oct', adset: 'CZ_Restaurants_Broad', ad: 'Carousel_3Models',
          rawText: { zh: '品类：沙冰机；意向：要报价单；公司名：未填',
                     en: 'Category: blenders; intent: price list; company: not filled' }
        }
      },
      ent: {
        identified: false, name: '', nameRaw: '',
        registry: '', confidence: 'none',
        evidence: [ unknown('个人邮箱 + 无公司名 + 无电话确认', 'Personal email, no company name, phone unconfirmed') ]
      },
      ana: {
        biztype: { zh: '未识别', en: 'Not identified' },
        roleCode: '', selftype: { zh: '未填', en: 'Not filled' },
        mainbiz: { zh: '没有任何主体信息，主营业务查不了，也就判不了。',
                   en: 'No entity info at all; main business cannot be checked, so no call can be made.' },
        scale: { zh: '未获取', en: 'Not available' },
        verdict: 'hold',
        gaps: [ { zh: '公司名或店铺名', en: 'Company or store name' }, { zh: '可回访的联系方式', en: 'A reachable contact' } ],
        evidence: [ unknown('查不到 ≠ 有问题，只是信息不够判', 'Not found is not a problem — there is just not enough to judge') ],
        strategy: { zh: '发一次标准报价单，不做额外跟进；有回信再补录。',
                    en: 'Send the standard price list once; log again only if they reply.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p3', info: 'thin', risk: 'none' }
    },
    {
      id: 'L-2408', source: 'alibaba', batch: 'B-1001',
      raw: {
        name: 'D. Petrov', title: 'CEO',
        category: 'beverage_dispensers', intent: 'distributorship',
        country: 'Kazakhstan', email: 'demo-buyer@example.com', phone: '+7 7xx xxx xxxx',
        website: '******.kz', company: 'Almaty Trade House LLP',
        form: { zh: '国际站询盘', en: 'Alibaba inquiry' },
        ext: {
          platform: { zh: '阿里国际站', en: 'Alibaba.com' },
          inquiry: { zh: '问区域总代条件，提到已有 3 个城市的仓储。',
                     en: 'Asked about regional distributorship; mentioned warehousing in 3 cities.' },
          productPage: 'beverage-dispenser-6tanks'
        }
      },
      ent: {
        identified: true, name: 'Almaty Trade House LLP', nameRaw: 'Almaty Trade House',
        registry: 'KZ', confidence: 'medium',
        evidence: [
          fact('企业邮箱域名与公司名一致', 'Corporate email domain matches the company name'),
          guess('自称有仓储，未实地核实', 'Claims warehousing; not verified on site', '对方自述')
        ],
        gapsHint: true
      },
      ana: {
        biztype: { zh: '进口分销商', en: 'Importer / distributor' },
        roleCode: 'L1', selftype: { zh: '进口商/分销商', en: 'Importer / distributor' },
        mainbiz: { zh: '主营食品设备进口与仓储分销，覆盖三个城市，与本方品类对口。',
                   en: 'Food-equipment import and warehousing across three cities; matches our category.' },
        scale: { zh: '50-200 人 / 预估年采购 $10万-30万', en: '50-200 staff / est. $100k-300k a year' },
        verdict: 'strong',
        gaps: [ { zh: '仓储面积与现有品牌', en: 'Warehouse size and current brands' } ],
        evidence: [
          fact('角色 L1 进口分销，品类强匹配，量级最大', 'Role L1 importer, strong match, largest volume'),
          guess('区域总代意向为对方自述', 'Distributorship intent is self-reported', '待合同阶段核实')
        ],
        strategy: { zh: '约视频会议谈区域总代条件，先要仓储照片与现有品牌清单。',
                    en: 'Book a video call on distributorship terms; ask for warehouse photos and current brand list.' }
      },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p1', info: 'partial', risk: 'none' }
    }
  ];

  /* 第二批演示批次，供批次切换与跨来源关联演示 */
  var LEADS_B = [
    {
      id: 'L-2391', source: 'meta', batch: 'B-0928',
      raw: {
        name: 'J. Silva', title: 'Buyer', category: 'juice_dispensers', intent: 'price_list',
        country: 'Portugal', email: 'demo-buyer@example.com', phone: '+351 9xx xxx xxx', website: '', company: '',
        form: { zh: 'Meta 表单（果汁机）', en: 'Meta form (juice dispensers)' },
        ext: { campaign: 'PT_Juice_Oct', adset: 'PT_Cafes_Core', ad: 'Image_JuiceWall',
               rawText: { zh: '品类：果汁机；意向：要报价单；公司名：未填', en: 'Category: juice dispensers; intent: price list; company: not filled' } }
      },
      ent: { identified: false, name: '', nameRaw: '', registry: '', confidence: 'none',
             evidence: [ unknown('个人邮箱，无公司名', 'Personal email, no company name') ] },
      ana: { biztype: { zh: '未识别', en: 'Not identified' }, roleCode: '', selftype: { zh: '未填', en: 'Not filled' },
             mainbiz: { zh: '信息不够判，等回信。', en: 'Not enough info to judge; waiting for a reply.' },
             scale: { zh: '未获取', en: 'Not available' }, verdict: 'pending',
             gaps: [ { zh: '公司名', en: 'Company name' } ],
             evidence: [ unknown('查不到 ≠ 有问题', 'Not found is not a problem') ],
             strategy: { zh: '发标准报价单，等回信再补录。', en: 'Send the standard price list; log again on reply.' } },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p3', info: 'thin', risk: 'none' }
    },
    {
      id: 'L-2392', source: 'expo', batch: 'B-0928',
      raw: {
        name: 'H. Yilmaz', title: 'Manager', category: 'coffee_machines', intent: 'visit_booth',
        country: 'Türkiye', email: 'demo-buyer@example.com', phone: '+90 5xx xxx xx xx', website: '', company: 'Bosphorus Catering A.Ş.',
        form: { zh: '展会名片（已核对）', en: 'Expo card (verified)' },
        ext: { expoName: { zh: '海外酒店餐饮展 2026-10-16', en: 'International hospitality trade show, 2026-10-16' },
               cardImage: 'card-yilmaz.jpg',
               ocr: { state: 'confirmed',
                      fields: [ { k: 'name', v: 'H. Yilmaz', ok: true }, { k: 'company', v: 'Bosphorus Catering A.Ş.', ok: true },
                                { k: 'email', v: 'demo-buyer@example.com', ok: true }, { k: 'phone', v: '+90 5xx xxx xx xx', ok: true } ],
                      note: { zh: '现场核对完成。', en: 'Verified on site.' } } }
      },
      ent: { identified: true, name: 'Bosphorus Catering A.Ş.', nameRaw: 'Bosphorus Catering', registry: 'TR', confidence: 'high',
             evidence: [ fact('展位现场核对名片信息', 'Card verified at the booth') ] },
      ana: { biztype: { zh: '餐饮承包商', en: 'Catering contractor' }, roleCode: 'L3', selftype: { zh: '餐饮服务', en: 'Catering' },
             mainbiz: { zh: '承接企业食堂与活动餐饮，设备自用，复购看项目。', en: 'Runs canteens and events; buys for own use, repeat depends on projects.' },
             scale: { zh: '20-50 人 / 预估年采购 $2万-5万', en: '20-50 staff / est. $20k-50k a year' },
             verdict: 'worth', gaps: [ { zh: '在手项目数', en: 'Active project count' } ],
             evidence: [ fact('角色 L3 终端商用', 'Role L3 end-use commercial') ],
             strategy: { zh: '按项目报价，附咖啡机与沙冰机组合方案。', en: 'Quote per project with a coffee + blender bundle.' } },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p2', info: 'ready', risk: 'none' }
    },
    {
      id: 'L-2393', source: 'site', batch: 'B-0928',
      raw: {
        name: '', title: '', category: 'ice_machines', intent: 'whatsapp',
        country: 'UAE', email: '', phone: '+971 5x xxx xxxx', website: '', company: '',
        form: { zh: '独立站表单（匿名）', en: 'Site form (anonymous)' },
        ext: { page: { zh: '/pages/ice-machine', en: '/pages/ice-machine' },
               inquiry: { zh: '只留了电话，要求 WhatsApp 联系。', en: 'Phone only, asked to chat on WhatsApp.' } }
      },
      ent: { identified: false, name: '', nameRaw: '', registry: '', confidence: 'none',
             evidence: [ unknown('无姓名无邮箱，只有电话', 'No name or email, phone only') ] },
      ana: { biztype: { zh: '未识别', en: 'Not identified' }, roleCode: '', selftype: { zh: '未填', en: 'Not filled' },
             mainbiz: { zh: '只有一个电话号码，主体识别无从做起。', en: 'A phone number only; entity ID cannot start.' },
             scale: { zh: '未获取', en: 'Not available' }, verdict: 'hold',
             gaps: [ { zh: '姓名或公司名', en: 'Name or company' }, { zh: '邮箱', en: 'Email' } ],
             evidence: [ unknown('允许导入，标待补', 'Import allowed, marked as needs-info') ],
             strategy: { zh: 'WhatsApp 问一句公司名与用途，有回复再进背调。', en: 'Ask for company and use case on WhatsApp; screen after a reply.' } },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: '' },
      flags: { priority: 'p3', info: 'thin', risk: 'none' }
    }
  ];

  /* 跨来源关联示例：L-2408 与 L-2418 是同一家公司，不同来源进来的两条原始记录 */
  var LEADS_B2 = [
    {
      id: 'L-2418', source: 'email', batch: 'B-0928',
      raw: {
        name: 'D. Petrov', title: 'CEO', category: 'beverage_dispensers', intent: 'catalogue',
        country: 'Kazakhstan', email: 'demo-buyer@example.com', phone: '', website: '******.kz',
        company: 'Almaty Trade House LLP',
        form: { zh: '邮件往来（手工录入）', en: 'Email thread (manual entry)' },
        ext: { emailSubject: { zh: '产品目录请求', en: 'Catalogue request' },
               inquiry: { zh: '早于询盘两周的一封目录请求邮件。', en: 'A catalogue request two weeks before the inquiry.' } }
      },
      ent: { identified: true, name: 'Almaty Trade House LLP', nameRaw: 'Almaty Trade House', registry: 'KZ', confidence: 'medium',
             evidence: [ fact('邮箱域名与公司名一致', 'Email domain matches company name') ] },
      ana: { biztype: { zh: '进口分销商', en: 'Importer / distributor' }, roleCode: 'L1', selftype: { zh: '进口商', en: 'Importer' },
             mainbiz: { zh: '同 L-2408 的主体，这条是更早的目录请求。', en: 'Same entity as L-2408; this is the earlier catalogue request.' },
             scale: { zh: '同 L-2408', en: 'Same as L-2408' }, verdict: 'worth',
             gaps: [ { zh: '与询盘记录合并跟进', en: 'Merge follow-up with the inquiry record' } ],
             evidence: [ fact('与 L-2408 主体一致，已关联', 'Same entity as L-2408, linked') ],
             strategy: { zh: '与 L-2408 并到同一个跟进里，别发两套报价。', en: 'Fold into the same follow-up as L-2408; do not send two quotes.' } },
      hand: { owner: { zh: '待分配', en: 'Unassigned' }, followup: '', memo: { zh: '与 L-2408 同主体', en: 'Same entity as L-2408' } },
      flags: { priority: 'p2', info: 'partial', risk: 'none' }
    }
  ];

  var BATCHES = [
    { id: 'B-1001', label: { zh: '10 月 1 日批次', en: 'Oct 1 batch' }, src: 'mixed',  leads: LEADS },
    { id: 'B-0928', label: { zh: '9 月 28 日批次', en: 'Sep 28 batch' }, src: 'mixed', leads: LEADS_B.concat(LEADS_B2) }
  ];
  /* 广告组示例数据：带 campaign/adset/ad 字段，走归因引擎 */
  var AD_ROWS = [];
  (function seed(){
    function add(camp, adset, ad, mail, comp, ph, ctry, cat, spend) {
      AD_ROWS.push({ campaign: camp, adset: adset, ad: ad, email: mail, company: comp,
                     phone: ph, country: ctry, category: cat, spend: spend });
    }
    /* MY_HoReCa：准备度高的组 */
    for (var i = 0; i < 6; i++) add('MY_Beverage_Oct', 'MY_HoReCa_Beverage', 'Video_Dispenser_15s',
      i % 2 ? 'lead' + i + '@******.com.my' : 'demo-buyer@example.com', i % 3 ? 'Cafe Group ' + i : 'Permata Beverage', '', 'Malaysia', 'beverage_dispensers', 0);
    /* QA_CafeOwners：个人邮箱为主 */
    for (var j = 0; j < 5; j++) add('QA_Coffee_Leads', 'QA_CafeOwners_Broad', 'Image_CoffeeBar',
      'q' + j + '@gmail.com', '', j === 0 ? '+974 3x-xxx' : '', 'Qatar', 'instant_coffee_machines', 0);
    /* CZ_Restaurants：大多无效 */
    for (var k = 0; k < 4; k++) add('CZ_Blenders_Oct', 'CZ_Restaurants_Broad', 'Carousel_3Models',
      'n' + k + '@seznam.cz', '', '', 'Czechia', 'blenders', 0);
    /* 样本不足的一组 */
    add('CZ_Blenders_Oct', 'CZ_Hotels_Test', 'Image_HotelBar', 'demo-buyer@example.com', 'Hotel Meridian', '', 'Czechia', 'blenders', 0);
    add('CZ_Blenders_Oct', 'CZ_Hotels_Test', 'Image_HotelBar', 'demo-buyer@example.com', '', '', 'Czechia', 'blenders', 0);
  })();

  /* ================= 派生统计 ================= */
  function byBatch(bid) {
    if (!bid) return LEADS.concat(LEADS_B).concat(LEADS_B2);
    var b = BATCHES.filter(function (x) { return x.id === bid; })[0];
    return b ? b.leads : [];
  }
  function count(list, key, val) { return list.filter(function (r) { return r.flags[key] === val; }).length; }
  function dist(list, key, table) {
    return Object.keys(table).map(function (k) {
      return { k: k, label: table[k], n: count(list, key, k) };
    });
  }
  function sourceDist(list) {
    var m = {};
    list.forEach(function (r) { m[r.source] = (m[r.source] || 0) + 1; });
    return Object.keys(SOURCES).map(function (s) {
      return { k: s, label: SOURCES[s], n: m[s] || 0 };
    });
  }
  function verdictDist(list) { return dist(list, 'priority', PRIORITY); }

  function kpi(list) {
    return {
      total: list.length,
      strong: list.filter(function (r) { return r.ana.verdict === 'strong'; }).length,
      pending: list.filter(function (r) { return r.ana.verdict === 'pending'; }).length,
      thin: count(list, 'info', 'thin'),
      unassigned: list.filter(function (r) { return T(r.hand.owner).indexOf(T({zh:'待分配',en:'Unassigned'})) >= 0; }).length
    };
  }

  /* ================= 归因引擎（从 attrib.js 移植） =================
     分级规则原样保留；判定文案去掉预算指令。 */
  var FREE_MAIL = ('gmail.com googlemail.com yahoo.com yahoo.co.uk hotmail.com outlook.com ' +
    'live.com msn.com aol.com icloud.com me.com mail.com protonmail.com proton.me gmx.com ' +
    'gmx.de yandex.ru zoho.com qq.com 163.com 126.com sina.com sina.cn sohu.com foxmail.com ' +
    'tom.com 21cn.com yeah.net aliyun.com 139.com 189.cn hotmail.co.uk live.cn').split(' ');
  var PLACEHOLDER = ('n/a na n.a. none null nil no unknown test tester asdf xxx 个人 个体 ' +
    '无 没有 无公司 自己 自用 私营业主 个体户 self personal nobody').split(' ');
  var ALIASES = {
    name:     ['full_name', 'name', '姓名', '名字', 'first_name'],
    email:    ['email', 'email_address', 'mail', '邮箱', '电子邮件', '电子邮箱'],
    phone:    ['phone_number', 'phone', 'tel', 'mobile', '电话', '手机号', '联系电话'],
    company:  ['company_name', 'company', '公司名', '公司名称', '公司'],
    title:    ['job_title', 'title', '职位'],
    country:  ['country', '国家', '国家/地区', '国家 / 地区', '国家地区'],
    category: ['品类', '意向品类', 'category', '产品品类'],
    intent:   ['合作意向', '意向', 'intent', '备注'],
    campaign: ['campaign_name', 'campaign', '广告系列', '广告系列名称'],
    adset:    ['adset_name', 'ad_set_name', 'adset', '广告组', '广告组名称'],
    ad:       ['ad_name', 'ad', '广告', '广告名称'],
    spend:    ['spend', 'cost', '花费', '消耗', '金额']
  };
  function norm(s) { return String(s == null ? '' : s).trim().replace(/^["']+|["']+$/g, ''); }
  function low(s) { return norm(s).toLowerCase(); }
  function hasPhone(p) { return norm(p).replace(/\D/g, '').length >= 7; }
  function hasCompany(c) { var v = norm(c); return !!v && PLACEHOLDER.indexOf(low(c)) < 0; }
  function emailClass(e) {
    var x = low(e); if (!x || x.indexOf('@') < 0) return 'none';
    var d = x.split('@').pop().trim();
    return FREE_MAIL.indexOf(d) >= 0 ? 'free' : 'biz';
  }
  function splitCSV(text) {
    text = String(text || '').replace(/^\uFEFF/, '');
    var rows = [], row = [], cur = '', q = false, i = 0;
    while (i < text.length) {
      var ch = text.charAt(i);
      if (q) {
        if (ch === '"') { if (text.charAt(i + 1) === '"') { cur += '"'; i += 2; continue; } q = false; i++; continue; }
        cur += ch; i++; continue;
      }
      if (ch === '"') { q = true; i++; continue; }
      if (ch === ',') { row.push(cur); cur = ''; i++; continue; }
      if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      cur += ch; i++;
    }
    if (q) throw new Error(T({zh:'CSV 引号未闭合，请检查文件格式',en:'Unclosed CSV quotation; check the file format'}));
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || (r[0] && r[0].trim() !== ''); });
  }
  function mapColumns(headers) {
    var out = {}, i, j;
    for (i = 0; i < headers.length; i++) headers[i] = norm(headers[i]);
    Object.keys(ALIASES).forEach(function (f) {
      var al = ALIASES[f];
      for (j = 0; j < al.length; j++)
        for (i = 0; i < headers.length; i++)
          if (headers[i].toLowerCase() === al[j].toLowerCase()) { out[f] = headers[i]; return; }
    });
    return out;
  }
  function parseTable(text) {
    var raw = splitCSV(text);
    if (!raw.length) return { rows: [], colmap: {} };
    if (new Set(raw[0].map(function(h){return h.trim().toLowerCase();})).size!==raw[0].length) throw new Error(T({zh:'存在重复列名，请先改成不同列名',en:'Duplicate column names; rename them before import'}));
    var headers = raw[0].map(function(h){return h.trim();}), colmap = mapColumns(headers), rows = [], r, o, i;
    for (r = 1; r < raw.length; r++) {
      if(raw[r].length>headers.length)throw new Error(T({zh:'数据行列数超过表头，请检查逗号与引号',en:'A row has more columns than the header; check commas and quotes'}));
      o = {};
      for (i = 0; i < headers.length; i++) o[headers[i]] = raw[r][i] != null ? String(raw[r][i]) : '';
      rows.push(o);
    }
    return { rows: rows, colmap: colmap };
  }
  function classify(rows, colmap) {
    function get(r, f) { var h = colmap[f]; return h ? norm(r[h]) : ''; }
    var seenMail = {}, seenPhone = {}, i, e, p;
    for (i = 0; i < rows.length; i++) {
      e = low(get(rows[i], 'email')); p = norm(get(rows[i], 'phone')).replace(/\D/g, '');
      if (e) seenMail[e] = (seenMail[e] || 0) + 1;
      if (p.length >= 7) seenPhone[p] = (seenPhone[p] || 0) + 1;
    }
    var out = [];
    for (i = 0; i < rows.length; i++) {
      var r = rows[i], email = get(r, 'email'), phone = get(r, 'phone'), company = get(r, 'company');
      var ec = emailClass(email), hp = hasPhone(phone), hc = hasCompany(company);
      e = low(email); p = norm(phone).replace(/\D/g, '');
      var dup = (e && seenMail[e] > 1) || (p.length >= 7 && seenPhone[p] > 1);
      var grade;
      if (!(ec !== 'none' || hp)) grade = 'weak';
      else if (ec === 'biz') grade = 'ready';
      else if (hc) grade = 'ready';
      else if (ec === 'free') grade = 'weak';
      else grade = 'needs_info';
      out.push({
        name: get(r, 'name'), email: email, phone: phone, company: company,
        country: get(r, 'country'), category: get(r, 'category'),
        campaign: get(r, 'campaign'),
        adset: get(r, 'adset') || get(r, 'campaign') || '未分组',
        ad: get(r, 'ad'),
        email_class: ec, has_phone: hp, has_company: hc, dup: dup,
        grade: grade, spend: Number(get(r, 'spend')) || 0
      });
    }
    return out;
  }
  function pct(v) { return Math.round(v * 100); }
  function verdictFor(leads, rate) {
    if (leads < 5) return 'more_data';
    if (rate >= 0.60) return 'act';
    if (rate >= 0.40) return 'keep';
    if (rate >= 0.20) return 'review';
    return 'review_hard';
  }
  /* 判定文案：只描述信息完整度与背调准备度，不给投放指令。 */
  var VERDICT_TEXT = {
    act:        { zh: '该组可直接进背调的比例够高，值得先处理', en: 'High share ready for screening; handle this group first' },
    keep:       { zh: '表现正常，维持现有跟进顺序', en: 'Normal; keep the current order' },
    review:     { zh: '可直接背调的比例偏低，先看表单字段是否问全', en: 'Low share ready for screening; check whether the form asks enough fields' },
    review_hard:{ zh: '大部分线索缺少可识别主体，先补充字段再核实', en: 'Most leads lack an identifiable entity; fix the form fields first' },
    more_data:  { zh: '样本不足，不下结论', en: 'Not enough samples; no conclusion' }
  };
  function aggregate(rows) {
    var g = {}, order = [], i;
    for (i = 0; i < rows.length; i++) {
      var k = rows[i].adset;
      if (!g[k]) { g[k] = { adset: k, leads: 0, ready: 0, needs_info: 0, weak: 0, biz_email: 0, no_company: 0, dup: 0, campaigns: {}, countries: {} }; order.push(k); }
      var b = g[k];
      b.leads++; b[rows[i].grade]++;
      if (rows[i].email_class === 'biz') b.biz_email++;
      if (!rows[i].has_company) b.no_company++;
      if (rows[i].dup) b.dup++;
      b.campaigns[rows[i].campaign || '—'] = 1;
      b.countries[rows[i].country || '—'] = 1;
    }
    function rate(a, n) { return n ? a / n : 0; }
    var out = order.map(function (k) {
      var b = g[k], n = b.leads, rr = rate(b.ready, n);
      return {
        adset: k, leads: n, ready: b.ready, needs_info: b.needs_info, weak: b.weak,
        ready_rate: rr, biz_email_rate: rate(b.biz_email, n), no_company: b.no_company, dup: b.dup,
        campaigns: Object.keys(b.campaigns).length,
        countries: Object.keys(b.countries).filter(function (c) { return c !== '—'; }),
        verdict: verdictFor(n, rr)
      };
    });
    out.sort(function (a, b) { return (b.ready_rate - a.ready_rate) || (b.leads - a.leads); });
    return out;
  }
  function findings(rows, groups) {
    var out = [], total = rows.length, weak = 0, noComp = 0, dup = 0, i;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].grade === 'weak') weak++;
      if (!rows[i].has_company) noComp++;
      if (rows[i].dup) dup++;
    }
    out.push({ k: 'weak', p: { n: total, w: weak, pc: pct(weak / total) } });
    if (noComp) out.push({ k: 'nocomp', p: { n: noComp, pc: pct(noComp / total) } });
    if (dup) out.push({ k: 'dup', p: { n: dup } });
    if (groups.length > 1) {
      var best = groups[0], worst = groups[groups.length - 1];
      if (best.ready_rate > worst.ready_rate) {
        out.push({ k: 'gap', p: { b: best.adset, bp: pct(best.ready_rate), w: worst.adset, wp: pct(worst.ready_rate) } });
      }
    }
    var small = groups.filter(function (g) { return g.verdict === 'more_data'; });
    if (small.length) out.push({ k: 'small', p: { n: small.length, names: small.map(function (g) { return g.adset; }).join('、') } });
    return out;
  }
  var FIND_TPL = {
    weak:   { zh: '共 {n} 条线索，{w} 条（{pc}%）缺少可识别主体：个人邮箱且没填公司名，或联系方式全空。这只说明现有信息不足以直接背调，不代表这些是假线索。',
              en: '{n} leads total; {w} ({pc}%) lack an identifiable entity — personal email with no company name, or no contact at all. These records need clarification under the current rules; this does not make them fake leads.' },
    nocomp: { zh: '{n} 条（{pc}%）没填公司名。它可以辅助识别主体，但不单独决定能否背调，可以测试更明确的填写提示，再比较可用信息比例。',
              en: '{n} ({pc}%) left the company name empty. A company name helps identify the buyer but is not the only way to do so. Test a clear form hint and compare complete, usable answers.' },
    dup:    { zh: '{n} 条重复提交（同邮箱或同电话）。重复本身不说明质量问题，跨组重复倒是值得看。',
              en: '{n} duplicate submissions (same email or phone). Duplicates are not a quality signal by themselves; cross-group repeats are worth a look.' },
    gap:    { zh: '组间差异：{b} 可直接背调比例 {bp}%，{w} 只有 {wp}%。差异可能来自表单、受众或样本结构，需要结合实际投放设置核实。',
              en: 'Between groups: {b} reaches {bp}% ready for screening, {w} only {wp}%. The difference may reflect forms, audiences or the sample mix. Check the campaign setup before drawing a cause or budget conclusion.' },
    small:  { zh: '{n} 个组样本不足 5 条（{names}），这几组不下结论。',
              en: '{n} group(s) have fewer than 5 samples ({names}); no conclusion for them.' }
  };

  /* ================= CSV 导出 ================= */
  function csvCell(v) {
    var s = v == null ? '' : String(v);
    /* 防公式注入：以 = + - @ 开头的单元格前置单引号 */
    if (/^\s*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function toCSV(headers, rows) {
    return '\uFEFF' + [headers.map(csvCell).join(',')].concat(
      rows.map(function (r) { return r.map(csvCell).join(','); })).join('\r\n');
  }
  /* 19 列兼容导出 */
  function baseRow(r, i) {
    return [
      r.raw.no || (i + 1), T(r.raw.name), T(r.raw.title), T(r.raw.category), T(r.raw.intent),
      T(r.raw.country), T(r.ent.nameRaw) || T({ zh: '未识别', en: 'Not identified' }), T(r.ana.biztype),
      T(r.ana.selftype), r.raw.email, r.raw.phone, r.raw.website || T({ zh: '未获取', en: 'Not available' }),
      T(r.ana.mainbiz), T(r.ana.scale), T(VERDICT[r.ana.verdict]), T(r.ana.strategy),
      T(r.hand.owner), T(r.hand.followup), T(r.hand.memo)
    ];
  }
  function export19(list) {
    return toCSV(COLS19.map(function (c) { return T(c); }), list.map(baseRow));
  }
  /* 扩展导出：19 列 + 来源扩展字段 + 事实/推测标记 + 来源链接 */
  function exportExt(list) {
    var headers = COLS19.map(function (c) { return T(c); }).concat([
      T({ zh: '来源', en: 'Source' }), T({ zh: '广告系列', en: 'Campaign' }),
      T({ zh: '广告组', en: 'Ad set' }), T({ zh: '广告', en: 'Ad' }),
      T({ zh: '依据类型', en: 'Evidence kind' }), T({ zh: '依据摘要', en: 'Evidence summary' }),
      T({ zh: '来源链接', en: 'Source link' }), T({ zh: '优先级', en: 'Priority' }),
      T({ zh: '信息状态', en: 'Info state' }), T({ zh: '风险提示', en: 'Risk' }),
      T({ zh: '导出版本', en: 'Export kind' }),
      T({zh:'原始需求',en:'Raw request'}),T({zh:'产品或落地页',en:'Product or landing page'}),T({zh:'展会名称',en:'Exhibition'}),T({zh:'邮件主题',en:'Email subject'}),T({zh:'原始字段 JSON',en:'Original fields JSON'}),T({zh:'线索 ID',en:'Lead ID'}),T({zh:'批次 ID',en:'Batch ID'})
    ]);
    var rows = list.map(function (r, i) {
      var e = r.ext();
      var ev = r.ana.evidence.map(function (x) {
        return (x.kind === 'fact' ? T({ zh: '事实', en: 'Fact' }) : x.kind === 'guess' ? T({ zh: '推测', en: 'Inference' }) : T({ zh: '未知', en: 'Unknown' })) + ': ' + T(x);
      }).join(' | ');
      var links = r.ent.evidence.filter(function (x) { return x.link; }).map(function (x) { return x.link; }).join(' | ');
      return baseRow(r, i).concat([
        T(SOURCES[r.source].short), e.campaign || '', e.adset || '', e.ad || '',
        ev ? T({ zh: '混合', en: 'Mixed' }) : T({ zh: '无', en: 'None' }), ev || '', links || '',
        T(PRIORITY[r.flags.priority]), T(INFOSTATE[r.flags.info]), T(RISK[r.flags.risk]),
        T({ zh: '扩展版', en: 'Extended' }),T(e.inquiry||e.rawText),e.productPage||e.page||'',e.expoName||'',e.emailSubject||'',JSON.stringify((r.raw.ext||{}).originalFields||r.raw),r.id,r.batch||''
      ]);
    });
    return toCSV(headers, rows);
  }
  /* 简版导出：只给结论与下一步，明确标注是简版 */
  function exportSimple(list) {
    var headers = [T({ zh: '客户', en: 'Contact' }), T({ zh: '国家', en: 'Country' }),
      T({ zh: '结论', en: 'Assessment' }), T({ zh: '下一步', en: 'Next step' }),
      T({ zh: '信息状态', en: 'Info state' }), T({ zh: '导出版本', en: 'Export kind' })];
    var rows = list.map(function (r) {
      return [T(r.raw.name) || T({ zh: '未具名', en: 'Unnamed' }), T(r.raw.country),
        T(VERDICT[r.ana.verdict]), T(r.ana.strategy), T(INFOSTATE[r.flags.info]),
        T({ zh: '简版（不含依据与原始字段）', en: 'Simple (no evidence or raw fields)' })];
    });
    return toCSV(headers, rows);
  }
  function download(name, text) {
    var prev=document.getElementById('export-ready');if(prev){URL.revokeObjectURL(prev.dataset.url);prev.remove();}
    var url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
    var box=document.createElement('div');box.id='export-ready';box.dataset.url=url;box.className='export-ready';box.setAttribute('role','status');
    var title=document.createElement('span');title.textContent=T({zh:'文件已生成，可下载保存',en:'File ready to download'});
    var a=document.createElement('a');a.href=url;a.download=name;a.textContent=T({zh:'下载 CSV',en:'Download CSV'});a.className='btn btn-primary';
    var close=document.createElement('button');close.textContent=T({zh:'关闭',en:'Close'});close.className='btn btn-ghost';close.onclick=function(){URL.revokeObjectURL(url);box.remove();};
    box.append(title,a,close);document.body.appendChild(box);a.focus();
  }

  /* ================= 记录扩展字段取值 ================= */
  function extOf(r) {
    var x = r.raw.ext || {};
    return {
      campaign: x.campaign || '', adset: x.adset || '', ad: x.ad || '',
      platform: x.platform || '', inquiry: x.inquiry || '', productPage: x.productPage || '',
      page: x.page || '', expoName: x.expoName || '', cardImage: x.cardImage || '',
      ocr: x.ocr || null, emailSubject: x.emailSubject || '', rawText: x.rawText || '',
      form: r.raw.form || ''
    };
  }
  LEADS.concat(LEADS_B, LEADS_B2).forEach(function (r) {
    r.ext = function () { return extOf(r); };
    r.raw.no = '';
  });

  /* 跨来源关联：同主体不同来源 */
  function linksOf(r) {
    if (r.id === 'L-2408') return ['L-2418'];
    if (r.id === 'L-2418') return ['L-2408'];
    return [];
  }
  function findLead(id) {
    return LEADS.concat(LEADS_B, LEADS_B2).filter(function (r) { return r.id === id; })[0] || null;
  }

  /* ================= 过滤 ================= */
  function filterRows(list, f) {
    f = f || {};
    return list.filter(function (r) {
      if (f.verdict && r.ana.verdict !== f.verdict) return false;
      if (f.source && r.source !== f.source) return false;
      if (f.info && r.flags.info !== f.info) return false;
      if (f.priority && r.flags.priority !== f.priority) return false;
      if (f.owner==='unassigned' && T(r.hand.owner).indexOf(T({zh:'待分配',en:'Unassigned'}))<0) return false;
      if (f.q) {
        var q = f.q.toLowerCase();
        var hay = [T(r.raw.name), T(r.raw.company), r.raw.email, T(r.ana.biztype), T(r.ana.mainbiz), r.id].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  /* ================= 背调接入说明 ================= */
  var INTEGRATION = {
    needs: [
      { zh: '19 列结构化输入（名称、职位、品类、意向、国家、邮箱、电话、官网、自报类型）',
        en: 'The 19-column structured input (name, title, category, intent, country, email, phone, website, self-reported type)' },
      { zh: '原始需求文本（不加工，保留原文）', en: 'Raw requirement text, unmodified' },
      { zh: '来源标记与广告字段（如有）', en: 'Source tag and ad fields, if any' },
      { zh: '输出回填字段：企业识别映射、实际业务类型、主营业务、规模、结论、策略',
        en: 'Fields to write back: entity match, actual business, main business, scale, verdict, strategy' }
    ],
    api: [
      { zh: 'POST /leads/import — 传入 CSV 或单条 JSON，返回批次号', en: 'POST /leads/import — takes CSV or single JSON, returns a batch id' },
      { zh: 'GET /batches/{id}/leads — 分页拉取，含分析结果与依据', en: 'GET /batches/{id}/leads — paged, with results and evidence' },
      { zh: 'POST /batches/{id}/export?format=19|ext|simple — 三种导出', en: 'POST /batches/{id}/export?format=19|ext|simple — three export kinds' },
      { zh: 'POST /leads/{id}/handoff — 写负责人、跟进、备忘', en: 'POST /leads/{id}/handoff — write owner, follow-up, memo' }
    ],
    note: {
      zh: '接口是规划，不是已接通。接入前判断在 Google AI Studio 里手动跑，结果手动粘回表格。',
      en: 'These endpoints are planned, not connected. Until then, screening runs manually in Google AI Studio and results are pasted back into the sheet.'
    }
  };

  /* 粘贴文本的字段识别：中英别名 → 标准字段 */
  var ALIAS_LOOKUP = {};
  Object.keys(ALIASES).forEach(function (f) {
    ALIASES[f].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = f; });
  });
  ['姓名', '名字', '联系人', 'name'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'name'; });
  ['公司', '公司名', '公司名称', 'company'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'company'; });
  ['邮箱', '电子邮箱', '电子邮件', 'email'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'email'; });
  ['电话', '联系电话', '手机', 'phone'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'phone'; });
  ['品类', '意向品类', 'category'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'category'; });
  ['国家', 'country'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'country'; });
  ['职位', 'title'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'title'; });
  ['官网', '网站', 'website'].forEach(function (a) { ALIAS_LOOKUP[a.toLowerCase()] = 'website'; });
  COLS19.forEach(function(c){ALIAS_LOOKUP[c.zh.toLowerCase()]=c.k;ALIAS_LOOKUP[c.en.toLowerCase()]=c.k;});
  [['source',['来源','source']],['adset',['ad set']],['inquiry',['原始需求','raw request','需求','request','inquiry']],['productPage',['产品或落地页','product or landing page']],['expoName',['展会名称','exhibition']],['emailSubject',['邮件主题','email subject']],['strategy',['下一步','next step']]].forEach(function(pair){pair[1].forEach(function(a){ALIAS_LOOKUP[a]=pair[0];});});
  function aliasOf(text) { return ALIAS_LOOKUP[String(text || '').trim().toLowerCase()] || ''; }

  STATUS.pending={zh:'待核实',en:'Needs verification'};
  Object.keys(SOURCES).forEach(function(k){SOURCES[k].label={zh:SOURCES[k].zh,en:SOURCES[k].en};});
  LEADS[0].ana.roleCode='L3';
  LEADS[0].ana.scale={zh:'客户自述 12 家门店；员工数与年采购额尚未核实。',en:'Customer reports 12 stores; staff and annual purchasing are unverified.'};
  LEADS[0].ana.evidence=[fact('主营与品类直接对口（虚构示例）','Business and category match (fictional example)'),unknown('采购权限与采购量待确认','Purchasing authority and volume need confirmation')];
  LEADS[0].ana.gaps=[{zh:'确认集中采购权限、计划数量与设备更换周期。',en:'Confirm purchasing authority, quantities and replacement cycle.'}];
  CHANNELS.forEach(function(c){if(c.src==='site'&&c.how==='paste')c.note={zh:'按「字段：值」粘贴；询盘正文可手工录入并保留原文',en:'Paste field: value pairs, or enter the original inquiry manually'};});

  /* 供筛选用的来源标签表（与 SOURCES 同一份） */
  var SOURCES_LABELS = SOURCES;

  return {
    T: T, setLang: setLang, lang: function () { return LANG; },
    COLS19: COLS19, VERDICT: VERDICT, PRIORITY: PRIORITY, INFOSTATE: INFOSTATE, RISK: RISK,
    OVERLAP: OVERLAP, SOURCES: SOURCES, SOURCES_LABELS: SOURCES_LABELS, CHANNELS: CHANNELS,
    HOWTO: HOWTO, STATUS: STATUS, aliasOf: aliasOf,
    BATCHES: BATCHES, byBatch: byBatch, findLead: findLead, linksOf: linksOf,
    kpi: kpi, dist: dist, sourceDist: sourceDist, verdictDist: verdictDist,
    filterRows: filterRows,
    parseTable: parseTable, mapColumns: mapColumns, classify: classify, aggregate: aggregate, findings: findings,
    AD_ROWS: AD_ROWS,
    VERDICT_TEXT: VERDICT_TEXT, FIND_TPL: FIND_TPL, pct: pct,
    export19: export19, exportExt: exportExt, exportSimple: exportSimple, download: download,
    INTEGRATION: INTEGRATION,
    fact: fact, guess: guess, unknown: unknown
  };
})();
