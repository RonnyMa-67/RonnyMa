const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 订阅消息模板 ID：在小程序后台「订阅消息」里申请后填到这里
const TEMPLATE_ID = 'REPLACE_WITH_YOUR_TEMPLATE_ID';

// 与 crm 云函数保持一致：nextFollowUpAt 存的是 'YYYY-MM-DD' 字符串，直接按字典序比较
function todayText(offsetDays) {
  const shanghai = new Date(Date.now() + 8 * 3600000 + (offsetDays || 0) * 86400000);
  return (
    shanghai.getUTCFullYear() +
    '-' +
    String(shanghai.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(shanghai.getUTCDate()).padStart(2, '0')
  );
}

exports.main = async () => {
  const today = todayText(0);
  const tomorrow = todayText(1);
  const res = await db
    .collection('customers')
    .where({
      nextFollowUpAt: _.lt(tomorrow),
      stage: _.neq('成交'),
    })
    .limit(100)
    .get();

  const grouped = {};
  res.data.forEach((c) => {
    if (!c.ownerId) return;
    if (!grouped[c.ownerId]) grouped[c.ownerId] = [];
    grouped[c.ownerId].push(c);
  });

  const summary = { scanned: res.data.length, notified: 0, failed: 0 };

  for (const openid of Object.keys(grouped)) {
    const list = grouped[openid];
    const overdue = list.filter((c) => c.nextFollowUpAt < today).length;
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: openid,
        templateId: TEMPLATE_ID,
        page: 'pages/today/today',
        data: {
          thing1: { value: (list[0].company || '客户').slice(0, 20) },
          thing2: { value: overdue > 0 ? '有逾期客户待跟进' : '今日待跟进' },
          number3: { value: list.length },
          date4: { value: today },
        },
      });
      summary.notified += 1;
    } catch (err) {
      // 用户未订阅或模板未配置时静默跳过，不影响其他人
      summary.failed += 1;
    }
  }

  return summary;
};
