/**
 * 国际化国家名称归一化与国旗 Emoji 映射全集
 * 支持中英文全称、简称、两字/三字 ISO 代码及常见口语别称
 */

export interface CountryInfo {
  flag: string;
  name: string;        // 标准中文名
  code: string;        // ISO 2-letter
  region?: string;     // 大洲/区域
}

// 核心国家数据库映射
const COUNTRY_DATABASE: Record<string, CountryInfo> = {
  // 北美与南美
  '美国': { flag: '🇺🇸', name: '美国', code: 'US', region: '美洲' },
  '加拿大': { flag: '🇨🇦', name: '加拿大', code: 'CA', region: '美洲' },
  '墨西哥': { flag: '🇲🇽', name: '墨西哥', code: 'MX', region: '美洲' },
  '智利': { flag: '🇨🇱', name: '智利', code: 'CL', region: '美洲' },
  '巴西': { flag: '🇧🇷', name: '巴西', code: 'BR', region: '美洲' },
  '阿根廷': { flag: '🇦🇷', name: '阿根廷', code: 'AR', region: '美洲' },
  '哥伦比亚': { flag: '🇨🇴', name: '哥伦比亚', code: 'CO', region: '美洲' },
  '秘鲁': { flag: '🇵🇪', name: '秘鲁', code: 'PE', region: '美洲' },
  '厄瓜多尔': { flag: '🇪🇨', name: '厄瓜多尔', code: 'EC', region: '美洲' },
  '乌拉圭': { flag: '🇺🇾', name: '乌拉圭', code: 'UY', region: '美洲' },
  '玻利维亚': { flag: '🇧🇴', name: '玻利维亚', code: 'BO', region: '美洲' },
  '巴拿马': { flag: '🇵🇦', name: '巴拿马', code: 'PA', region: '美洲' },
  '哥斯达黎加': { flag: '🇨🇷', name: '哥斯达黎加', code: 'CR', region: '美洲' },
  '多米尼加': { flag: '🇩🇴', name: '多米尼加', code: 'DO', region: '美洲' },
  '危地马拉': { flag: '🇬🇹', name: '危地马拉', code: 'GT', region: '美洲' },

  // 亚太
  '中国': { flag: '🇨🇳', name: '中国', code: 'CN', region: '亚太' },
  '中国香港': { flag: '🇭🇰', name: '中国香港', code: 'HK', region: '亚太' },
  '中国台湾': { flag: '🇹🇼', name: '中国台湾', code: 'TW', region: '亚太' },
  '日本': { flag: '🇯🇵', name: '日本', code: 'JP', region: '亚太' },
  '韩国': { flag: '🇰🇷', name: '韩国', code: 'KR', region: '亚太' },
  '新加坡': { flag: '🇸🇬', name: '新加坡', code: 'SG', region: '亚太' },
  '马来西亚': { flag: '🇲🇾', name: '马来西亚', code: 'MY', region: '亚太' },
  '泰国': { flag: '🇹🇭', name: '泰国', code: 'TH', region: '亚太' },
  '越南': { flag: '🇻🇳', name: '越南', code: 'VN', region: '亚太' },
  '印度尼西亚': { flag: '🇮🇩', name: '印度尼西亚', code: 'ID', region: '亚太' },
  '菲律宾': { flag: '🇵🇭', name: '菲律宾', code: 'PH', region: '亚太' },
  '澳大利亚': { flag: '🇦🇺', name: '澳大利亚', code: 'AU', region: '亚太' },
  '新西兰': { flag: '🇳🇿', name: '新西兰', code: 'NZ', region: '亚太' },
  '印度': { flag: '🇮🇳', name: '印度', code: 'IN', region: '亚太' },
  '巴基斯坦': { flag: '🇵🇰', name: '巴基斯坦', code: 'PK', region: '亚太' },
  '孟加拉': { flag: '🇧🇩', name: '孟加拉', code: 'BD', region: '亚太' },
  '哈萨克斯坦': { flag: '🇰🇿', name: '哈萨克斯坦', code: 'KZ', region: '中亚' },
  '乌兹别克斯坦': { flag: '🇺🇿', name: '乌兹别克斯坦', code: 'UZ', region: '中亚' },

  // 中东与北非
  '阿联酋': { flag: '🇦🇪', name: '阿联酋', code: 'AE', region: '中东' },
  '沙特阿拉伯': { flag: '🇸🇦', name: '沙特阿拉伯', code: 'SA', region: '中东' },
  '卡塔尔': { flag: '🇶🇦', name: '卡塔尔', code: 'QA', region: '中东' },
  '科威特': { flag: '🇰🇼', name: '科威特', code: 'KW', region: '中东' },
  '阿曼': { flag: '🇴🇲', name: '阿曼', code: 'OM', region: '中东' },
  '巴林': { flag: '🇧🇭', name: '巴林', code: 'BH', region: '中东' },
  '约旦': { flag: '🇯🇴', name: '约旦', code: 'JO', region: '中东' },
  '黎巴嫩': { flag: '🇱🇧', name: '黎巴嫩', code: 'LB', region: '中东' },
  '以色列': { flag: '🇮🇱', name: '以色列', code: 'IL', region: '中东' },
  '土耳其': { flag: '🇹🇷', name: '土耳其', code: 'TR', region: '中东' },
  '埃及': { flag: '🇪🇬', name: '埃及', code: 'EG', region: '中东/非洲' },
  '摩洛哥': { flag: '🇲🇦', name: '摩洛哥', code: 'MA', region: '非洲' },
  '阿尔及利亚': { flag: '🇩🇿', name: '阿尔及利亚', code: 'DZ', region: '非洲' },

  // 欧洲
  '德国': { flag: '🇩🇪', name: '德国', code: 'DE', region: '欧洲' },
  '英国': { flag: '🇬🇧', name: '英国', code: 'GB', region: '欧洲' },
  '法国': { flag: '🇫🇷', name: '法国', code: 'FR', region: '欧洲' },
  '意大利': { flag: '🇮🇹', name: '意大利', code: 'IT', region: '欧洲' },
  '西班牙': { flag: '🇪🇸', name: '西班牙', code: 'ES', region: '欧洲' },
  '荷兰': { flag: '🇳🇱', name: '荷兰', code: 'NL', region: '欧洲' },
  '俄罗斯': { flag: '🇷🇺', name: '俄罗斯', code: 'RU', region: '欧洲' },
  '波兰': { flag: '🇵🇱', name: '波兰', code: 'PL', region: '欧洲' },
  '瑞士': { flag: '🇨🇭', name: '瑞士', code: 'CH', region: '欧洲' },
  '瑞典': { flag: '🇸🇪', name: '瑞典', code: 'SE', region: '欧洲' },
  '比利时': { flag: '🇧🇪', name: '比利时', code: 'BE', region: '欧洲' },
  '奥地利': { flag: '🇦🇹', name: '奥地利', code: 'AT', region: '欧洲' },
  '葡萄牙': { flag: '🇵🇹', name: '葡萄牙', code: 'PT', region: '欧洲' },
  '希腊': { flag: '🇬🇷', name: '希腊', code: 'GR', region: '欧洲' },
  '捷克': { flag: '🇨🇿', name: '捷克', code: 'CZ', region: '欧洲' },
  '丹麦': { flag: '🇩🇰', name: '丹麦', code: 'DK', region: '欧洲' },
  '挪威': { flag: '🇳🇴', name: '挪威', code: 'NO', region: '欧洲' },
  '芬兰': { flag: '🇫🇮', name: '芬兰', code: 'FI', region: '欧洲' },
  '爱尔兰': { flag: '🇮🇪', name: '爱尔兰', code: 'IE', region: '欧洲' },
  '罗马尼亚': { flag: '🇷🇴', name: '罗马尼亚', code: 'RO', region: '欧洲' },
  '匈牙利': { flag: '🇭🇺', name: '匈牙利', code: 'HU', region: '欧洲' },
  '乌克兰': { flag: '🇺🇦', name: '乌克兰', code: 'UA', region: '欧洲' },

  // 非洲
  '南非': { flag: '🇿🇦', name: '南非', code: 'ZA', region: '非洲' },
  '尼日利亚': { flag: '🇳🇬', name: '尼日利亚', code: 'NG', region: '非洲' },
  '肯尼亚': { flag: '🇰🇪', name: '肯尼亚', code: 'KE', region: '非洲' },
  '加纳': { flag: '🇬🇭', name: '加纳', code: 'GH', region: '非洲' },
  '埃塞俄比亚': { flag: '🇪🇹', name: '埃塞俄比亚', code: 'ET', region: '非洲' },
};

// 别名 / 代码映射字典 (全小写键)
const COUNTRY_ALIAS_MAP: Record<string, string> = {
  // 美国
  'us': '美国',
  'usa': '美国',
  'united states': '美国',
  'united states of america': '美国',
  'u.s.': '美国',
  'u.s.a.': '美国',
  'america': '美国',
  '美国': '美国',
  '美利坚': '美国',

  // 智利
  'cl': '智利',
  'chl': '智利',
  'chile': '智利',
  '智利': '智利',

  // 马来西亚
  'my': '马来西亚',
  'mys': '马来西亚',
  'malaysia': '马来西亚',
  '马来西亚': '马来西亚',
  '大马': '马来西亚',

  // 泰国
  'th': '泰国',
  'tha': '泰国',
  'thailand': '泰国',
  '泰国': '泰国',

  // 越南
  'vn': '越南',
  'vnm': '越南',
  'vietnam': '越南',
  '越南': '越南',

  // 沙特阿拉伯
  'sa': '沙特阿拉伯',
  'sau': '沙特阿拉伯',
  'saudi arabia': '沙特阿拉伯',
  '沙特': '沙特阿拉伯',
  '沙特阿拉伯': '沙特阿拉伯',

  // 阿联酋
  'ae': '阿联酋',
  'are': '阿联酋',
  'uae': '阿联酋',
  'united arab emirates': '阿联酋',
  '阿联酋': '阿联酋',
  '迪拜': '阿联酋',
  'dubai': '阿联酋',
  'abu dhabi': '阿联酋',
  '阿布扎比': '阿联酋',

  // 德国
  'de': '德国',
  'deu': '德国',
  'germany': '德国',
  'deutschland': '德国',
  '德国': '德国',
  '德意志': '德国',

  // 英国
  'uk': '英国',
  'gbr': '英国',
  'gb': '英国',
  'united kingdom': '英国',
  'great britain': '英国',
  'britain': '英国',
  'england': '英国',
  '英国': '英国',
  '英格兰': '英国',

  // 澳大利亚
  'au': '澳大利亚',
  'aus': '澳大利亚',
  'australia': '澳大利亚',
  '澳大利亚': '澳大利亚',
  '澳洲': '澳大利亚',

  // 日本
  'jp': '日本',
  'jpn': '日本',
  'japan': '日本',
  '日本': '日本',

  // 韩国
  'kr': '韩国',
  'kor': '韩国',
  'south korea': '韩国',
  'korea': '韩国',
  '韩国': '韩国',
  '南韩': '韩国',

  // 新加坡
  'sg': '新加坡',
  'sgp': '新加坡',
  'singapore': '新加坡',
  '新加坡': '新加坡',
  '狮城': '新加坡',

  // 印度尼西亚
  'id': '印度尼西亚',
  'idn': '印度尼西亚',
  'indonesia': '印度尼西亚',
  '印度尼西亚': '印度尼西亚',
  '印尼': '印度尼西亚',

  // 菲律宾
  'ph': '菲律宾',
  'phl': '菲律宾',
  'philippines': '菲律宾',
  '菲律宾': '菲律宾',

  // 印度
  'in': '印度',
  'ind': '印度',
  'india': '印度',
  '印度': '印度',

  // 巴西
  'br': '巴西',
  'bra': '巴西',
  'brazil': '巴西',
  'brasil': '巴西',
  '巴西': '巴西',

  // 墨西哥
  'mx': '墨西哥',
  'mex': '墨西哥',
  'mexico': '墨西哥',
  '墨西哥': '墨西哥',

  // 加拿大
  'ca': '加拿大',
  'can': '加拿大',
  'canada': '加拿大',
  '加拿大': '加拿大',

  // 法国
  'fr': '法国',
  'fra': '法国',
  'france': '法国',
  '法国': '法国',

  // 意大利
  'it': '意大利',
  'ita': '意大利',
  'italy': '意大利',
  'italia': '意大利',
  '意大利': '意大利',

  // 西班牙
  'es': '西班牙',
  'esp': '西班牙',
  'spain': '西班牙',
  'espana': '西班牙',
  '西班牙': '西班牙',

  // 荷兰
  'nl': '荷兰',
  'nld': '荷兰',
  'netherlands': '荷兰',
  'holland': '荷兰',
  '荷兰': '荷兰',

  // 俄罗斯
  'ru': '俄罗斯',
  'rus': '俄罗斯',
  'russia': '俄罗斯',
  '俄罗斯': '俄罗斯',

  // 中国
  'cn': '中国',
  'chn': '中国',
  'china': '中国',
  '中国': '中国',
  'prc': '中国',

  // 中国香港
  'hk': '中国香港',
  'hkg': '中国香港',
  'hong kong': '中国香港',
  '香港': '中国香港',
  '中国香港': '中国香港',

  // 中国台湾
  'tw': '中国台湾',
  'twn': '中国台湾',
  'taiwan': '中国台湾',
  '台湾': '中国台湾',
  '中国台湾': '中国台湾',

  // 埃及
  'eg': '埃及',
  'egy': '埃及',
  'egypt': '埃及',
  '埃及': '埃及',

  // 南非
  'za': '南非',
  'zaf': '南非',
  'south africa': '南非',
  '南非': '南非',

  // 土耳其
  'tr': '土耳其',
  'tur': '土耳其',
  'turkey': '土耳其',
  'turkiye': '土耳其',
  '土耳其': '土耳其',

  // 尼日利亚
  'ng': '尼日利亚',
  'nga': '尼日利亚',
  'nigeria': '尼日利亚',
  '尼日利亚': '尼日利亚',

  // 波兰
  'pl': '波兰',
  'pol': '波兰',
  'poland': '波兰',
  '波兰': '波兰',

  // 瑞士
  'ch': '瑞士',
  'che': '瑞士',
  'switzerland': '瑞士',
  '瑞士': '瑞士',

  // 瑞典
  'se': '瑞典',
  'swe': '瑞典',
  'sweden': '瑞典',
  '瑞典': '瑞典',

  // 比利时
  'be': '比利时',
  'bel': '比利时',
  'belgium': '比利时',
  '比利时': '比利时',

  // 奥地利
  'at': '奥地利',
  'aut': '奥地利',
  'austria': '奥地利',
  '奥地利': '奥地利',

  // 新西兰
  'nz': '新西兰',
  'nzl': '新西兰',
  'new zealand': '新西兰',
  '新西兰': '新西兰',

  // 阿根廷
  'ar': '阿根廷',
  'arg': '阿根廷',
  'argentina': '阿根廷',
  '阿根廷': '阿根廷',

  // 哥伦比亚
  'co': '哥伦比亚',
  'col': '哥伦比亚',
  'colombia': '哥伦比亚',
  '哥伦比亚': '哥伦比亚',

  // 秘鲁
  'pe': '秘鲁',
  'per': '秘鲁',
  'peru': '秘鲁',
  '秘鲁': '秘鲁',

  // 摩洛哥
  'ma': '摩洛哥',
  'mar': '摩洛哥',
  'morocco': '摩洛哥',
  '摩洛哥': '摩洛哥',

  // 希腊
  'gr': '希腊',
  'grc': '希腊',
  'greece': '希腊',
  '希腊': '希腊',

  // 葡萄牙
  'pt': '葡萄牙',
  'prt': '葡萄牙',
  'portugal': '葡萄牙',
  '葡萄牙': '葡萄牙',

  // 捷克
  'cz': '捷克',
  'cze': '捷克',
  'czech': '捷克',
  'czechia': '捷克',
  '捷克': '捷克',

  // 丹麦
  'dk': '丹麦',
  'dnk': '丹麦',
  'denmark': '丹麦',
  '丹麦': '丹麦',

  // 挪威
  'no': '挪威',
  'nor': '挪威',
  'norway': '挪威',
  '挪威': '挪威',

  // 芬兰
  'fi': '芬兰',
  'fin': '芬兰',
  'finland': '芬兰',
  '芬兰': '芬兰',

  // 爱尔兰
  'ie': '爱尔兰',
  'irl': '爱尔兰',
  'ireland': '爱尔兰',
  '爱尔兰': '爱尔兰',

  // 罗马尼亚
  'ro': '罗马尼亚',
  'rou': '罗马尼亚',
  'romania': '罗马尼亚',
  '罗马尼亚': '罗马尼亚',

  // 匈牙利
  'hu': '匈牙利',
  'hun': '匈牙利',
  'hungary': '匈牙利',
  '匈牙利': '匈牙利',

  // 乌克兰
  'ua': '乌克兰',
  'ukr': '乌克兰',
  'ukraine': '乌克兰',
  '乌克兰': '乌克兰',

  // 卡塔尔
  'qa': '卡塔尔',
  'qat': '卡塔尔',
  'qatar': '卡塔尔',
  '卡塔尔': '卡塔尔',

  // 科威特
  'kw': '科威特',
  'kwt': '科威特',
  'kuwait': '科威特',
  '科威特': '科威特',

  // 阿曼
  'om': '阿曼',
  'omn': '阿曼',
  'oman': '阿曼',
  '阿曼': '阿曼',

  // 肯尼亚
  'ke': '肯尼亚',
  'ken': '肯尼亚',
  'kenya': '肯尼亚',
  '肯尼亚': '肯尼亚',

  // 加纳
  'gh': '加纳',
  'gha': '加纳',
  'ghana': '加纳',
  '加纳': '加纳',

  // 厄瓜多尔
  'ec': '厄瓜多尔',
  'ecu': '厄瓜多尔',
  'ecuador': '厄瓜多尔',
  '厄瓜多尔': '厄瓜多尔',

  // 乌拉圭
  'uy': '乌拉圭',
  'ury': '乌拉圭',
  'uruguay': '乌拉圭',
  '乌拉圭': '乌拉圭',

  // 以色列
  'il': '以色列',
  'isr': '以色列',
  'israel': '以色列',
  '以色列': '以色列',
};

/**
 * 国家名称严格归一化 (同一国家不允许两种写法)
 */
export const normalizeCountryName = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '未知地区';
  let clean = raw.trim();
  if (!clean || clean === '-' || clean === '待背调' || clean === '未知' || clean === '全球/未公开') return '未知地区';

  // 移除括号及其内容，例如 "美国 (US)" -> "美国"
  clean = clean.replace(/\s*[\(（][^\)）]*[\)）]\s*/g, '').trim();
  const lower = clean.toLowerCase();

  if (COUNTRY_ALIAS_MAP[lower]) {
    return COUNTRY_ALIAS_MAP[lower];
  }

  for (const [key, val] of Object.entries(COUNTRY_ALIAS_MAP)) {
    if (lower === key || lower.startsWith(key + ' ') || lower.endsWith(' ' + key)) {
      return val;
    }
  }

  return clean;
};

/**
 * 获取国家国旗与显示信息（确保 100% 准确获取国旗）
 */
export const getCountryVisual = (countryStr: string): { flag: string; label: string; normalizedName: string; code?: string } => {
  if (!countryStr || countryStr === '未知' || countryStr === '未知地区' || countryStr === '其他地区') {
    return { flag: '🌐', label: countryStr || '未知地区', normalizedName: '未知地区' };
  }

  const normalized = normalizeCountryName(countryStr);
  const info = COUNTRY_DATABASE[normalized];

  if (info) {
    return {
      flag: info.flag,
      label: normalized,
      normalizedName: normalized,
      code: info.code,
    };
  }

  // 尝试直接查找小写
  const clean = countryStr.trim().toLowerCase();
  const matchedTarget = COUNTRY_ALIAS_MAP[clean];
  if (matchedTarget && COUNTRY_DATABASE[matchedTarget]) {
    const matched = COUNTRY_DATABASE[matchedTarget];
    return {
      flag: matched.flag,
      label: matched.name,
      normalizedName: matched.name,
      code: matched.code,
    };
  }

  return { flag: '🌐', label: countryStr, normalizedName: normalized };
};

/**
 * 获取国家专属轻量色彩，丰富 CRM 与看板的视觉层次
 */
export const getCountryAccent = (countryStr: string) => {
  const norm = normalizeCountryName(countryStr);
  switch (norm) {
    case '美国':
    case '加拿大':
      return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
    case '德国':
    case '英国':
    case '法国':
    case '意大利':
    case '西班牙':
    case '荷兰':
      return { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' };
    case '智利':
    case '巴西':
    case '墨西哥':
    case '阿根廷':
    case '哥伦比亚':
      return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' };
    case '沙特阿拉伯':
    case '阿联酋':
    case '埃及':
    case '卡塔尔':
      return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' };
    case '马来西亚':
    case '泰国':
    case '越南':
    case '新加坡':
    case '印度尼西亚':
    case '菲律宾':
      return { border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' };
    case '日本':
    case '韩国':
      return { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' };
    case '澳大利亚':
    case '新西兰':
      return { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' };
    default:
      return { border: 'border-[var(--line)]', bg: 'bg-[var(--surface-2)]', text: 'text-[var(--ink-2)]' };
  }
};
