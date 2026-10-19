const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const STAGES = ['待联系', '询盘', '报价', '样品', '谈判', '成交', '流失'];
const PAGE_MAX = 20;

// ---------------------------------------------------------------------------
// 身份与权限：所有 action 都必须先经过这里，客户端传的 teamId / role 一律不采信
// ---------------------------------------------------------------------------

async function currentMember() {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return null;
  const res = await db
    .collection('members')
    .where({ openid: OPENID, status: 'active' })
    .limit(1)
    .get();
  return res.data.length ? res.data[0] : null;
}

// 业务员的可见范围收窄到「负责人是自己」，主管与老板看全团队
function scope(member, extra) {
  const base = Object.assign({ teamId: member.teamId }, extra || {});
  if (member.role === 'member') base.ownerId = member.openid;
  return base;
}

function deny(message) {
  const err = new Error(message || '没有权限');
  err.code = 'FORBIDDEN';
  throw err;
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

// 全链路统一用 'YYYY-MM-DD' 字符串存日期：
// 一是控制台导入的 JSON 只能写字符串，混用 Date 会导致比较查不出数据；
// 二是字符串字典序与时间序一致，排序天然正确，也不受云函数时区影响。
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

function toDateText(value) {
  if (!value) return '';
  const text = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

async function writeLog(member, action, targetId, detail) {
  try {
    await db.collection('audit_logs').add({
      data: {
        teamId: member.teamId,
        actorOpenid: member.openid,
        actorName: member.name || '',
        action: action,
        targetId: targetId || '',
        detail: detail || '',
        createdAt: new Date(),
      },
    });
  } catch (err) {
    // 审计日志失败不影响主流程
  }
}

// ---------------------------------------------------------------------------
// 团队
// ---------------------------------------------------------------------------

async function getMyProfile(member) {
  if (!member) return null;
  const teamRes = await db.collection('teams').doc(member.teamId).get().catch(() => null);
  return {
    openid: member.openid,
    name: member.name || '',
    role: member.role,
    teamId: member.teamId,
    teamName: (teamRes && teamRes.data && teamRes.data.name) || '',
    inviteCode: (teamRes && teamRes.data && teamRes.data.inviteCode) || '',
  };
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

async function createTeam(member, payload) {
  if (member) deny('你已加入团队');
  const { OPENID } = cloud.getWXContext();
  const code = randomCode();
  const teamRes = await db.collection('teams').add({
    data: {
      name: payload.name || '我的团队',
      inviteCode: code,
      ownerOpenid: OPENID,
      createdAt: new Date(),
    },
  });
  await db.collection('members').add({
    data: {
      teamId: teamRes._id,
      openid: OPENID,
      name: payload.name || '负责人',
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
  });
  return { teamId: teamRes._id, inviteCode: code };
}

async function joinTeam(member, payload) {
  if (member) deny('你已加入团队');
  const code = String(payload.inviteCode || '').trim().toUpperCase();
  if (!code) deny('请填写邀请码');
  const teamRes = await db.collection('teams').where({ inviteCode: code }).limit(1).get();
  if (!teamRes.data.length) deny('邀请码不存在');

  const { OPENID } = cloud.getWXContext();
  await db.collection('members').add({
    data: {
      teamId: teamRes.data[0]._id,
      openid: OPENID,
      name: payload.name || '',
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    },
  });
  return { teamId: teamRes.data[0]._id };
}

async function listMembers(member) {
  const res = await db.collection('members').where({ teamId: member.teamId, status: 'active' }).get();
  return res.data.map((m) => ({
    openid: m.openid,
    name: m.name || '未命名成员',
    role: m.role,
  }));
}

async function updateMemberRole(member, payload) {
  if (member.role !== 'owner') deny('只有负责人可以调整角色');
  if (payload.openid === member.openid) deny('不能修改自己的角色');
  if (!['manager', 'member'].includes(payload.role)) deny('角色不合法');
  await db
    .collection('members')
    .where({ teamId: member.teamId, openid: payload.openid })
    .update({ data: { role: payload.role } });
  await writeLog(member, 'updateMemberRole', payload.openid, payload.role);
  return { ok: true };
}

async function disableMember(member, payload) {
  if (member.role !== 'owner') deny('只有负责人可以停用成员');
  if (payload.openid === member.openid) deny('不能停用自己');
  await db
    .collection('members')
    .where({ teamId: member.teamId, openid: payload.openid })
    .update({ data: { status: 'disabled' } });
  await writeLog(member, 'disableMember', payload.openid, '');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 客户
// ---------------------------------------------------------------------------

async function listCustomers(member, payload) {
  const where = scope(member, {});
  if (payload.stage) where.stage = payload.stage;
  if (payload.level) where.level = payload.level;

  let query = db.collection('customers').where(where);
  if (payload.keyword) {
    const kw = String(payload.keyword).trim();
    query = query.and([
      {
        company: db.RegExp({ regexp: kw, options: 'i' }),
        contact: db.RegExp({ regexp: kw, options: 'i' }),
        country: db.RegExp({ regexp: kw, options: 'i' }),
        email: db.RegExp({ regexp: kw, options: 'i' }),
      },
    ]);
  }

  const res = await query
    .orderBy('nextFollowUpAt', 'asc')
    .skip(payload.skip || 0)
    .limit(Math.min(payload.limit || PAGE_MAX, PAGE_MAX))
    .get();

  return res.data;
}

async function getCustomer(member, payload) {
  const res = await db.collection('customers').doc(payload.id).get().catch(() => null);
  if (!res || !res.data || res.data.teamId !== member.teamId) deny('客户不存在或无权查看');
  if (member.role === 'member' && res.data.ownerId !== member.openid) deny('该客户不属于你');

  const followups = await db
    .collection('followups')
    .where({ customerId: payload.id })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return { customer: res.data, followups: followups.data };
}

async function upsertCustomer(member, payload) {
  const data = {
    company: payload.company || '',
    contact: payload.contact || '',
    jobTitle: payload.jobTitle || '',
    country: payload.country || '',
    email: payload.email || '',
    phone: payload.phone || '',
    website: payload.website || '',
    productCategory: payload.productCategory || '',
    intent: payload.intent || '',
    businessType: payload.businessType || '',
    formType: payload.formType || '',
    profile: payload.profile || '',
    headcount: payload.headcount || '',
    purchasePotential: payload.purchasePotential || '',
    verdict: payload.verdict || '',
    level: payload.level || 'C',
    strategy: payload.strategy || '',
    stage: payload.stage || '待联系',
    notes: payload.notes || '',
    lastFollowUpAt: new Date(),
    nextFollowUpAt: toDateText(payload.nextFollowUpAt),
    updatedAt: new Date(),
  };

  if (payload.id) {
    const exist = await db.collection('customers').doc(payload.id).get().catch(() => null);
    if (!exist || !exist.data || exist.data.teamId !== member.teamId) deny('客户不存在或无权修改');
    if (member.role === 'member' && exist.data.ownerId !== member.openid) deny('该客户不属于你');
    await db.collection('customers').doc(payload.id).update({ data });
    await writeLog(member, 'updateCustomer', payload.id, data.company);
    return { _id: payload.id };
  }

  const addRes = await db.collection('customers').add({
    data: Object.assign(data, {
      teamId: member.teamId,
      ownerId: member.openid,
      ownerName: member.name || '',
      sourceId: payload.sourceId || '',
      createdAt: new Date(),
    }),
  });
  await writeLog(member, 'createCustomer', addRes._id, data.company);
  return { _id: addRes._id };
}

async function deleteCustomer(member, payload) {
  if (member.role === 'member') deny('业务员不能删除客户');
  const exist = await db.collection('customers').doc(payload.id).get().catch(() => null);
  if (!exist || !exist.data || exist.data.teamId !== member.teamId) deny('客户不存在或无权删除');
  await db.collection('customers').doc(payload.id).remove();
  await db.collection('followups').where({ customerId: payload.id }).remove();
  await writeLog(member, 'deleteCustomer', payload.id, (exist.data && exist.data.company) || '');
  return { ok: true };
}

async function transferOwner(member, payload) {
  if (member.role === 'member') deny('只有主管可以转交客户');
  const exist = await db.collection('customers').doc(payload.id).get().catch(() => null);
  if (!exist || !exist.data || exist.data.teamId !== member.teamId) deny('客户不存在');

  const target = await db
    .collection('members')
    .where({ teamId: member.teamId, openid: payload.toOpenid, status: 'active' })
    .limit(1)
    .get();
  if (!target.data.length) deny('目标成员不存在');

  await db.collection('customers').doc(payload.id).update({
    data: {
      ownerId: payload.toOpenid,
      ownerName: target.data[0].name || '',
      updatedAt: new Date(),
    },
  });
  await writeLog(member, 'transferOwner', payload.id, target.data[0].name || '');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 跟进
// ---------------------------------------------------------------------------

async function addFollowUp(member, payload) {
  const exist = await db.collection('customers').doc(payload.customerId).get().catch(() => null);
  if (!exist || !exist.data || exist.data.teamId !== member.teamId) deny('客户不存在');
  if (member.role === 'member' && exist.data.ownerId !== member.openid) deny('该客户不属于你');

  let nextAt = toDateText(payload.nextAt);
  if (!nextAt && payload.nextAtOffsetDays) {
    nextAt = todayText(Number(payload.nextAtOffsetDays) || 3);
  }

  await db.collection('followups').add({
    data: {
      teamId: member.teamId,
      customerId: payload.customerId,
      content: payload.content || '',
      authorOpenid: member.openid,
      authorName: member.name || '',
      createdAt: new Date(),
    },
  });

  // 没有指定新日期时只记录跟进，不动 nextFollowUpAt，避免打乱原有节奏
  if (nextAt) {
    await db
      .collection('customers')
      .doc(payload.customerId)
      .update({ data: { nextFollowUpAt: nextAt, updatedAt: new Date() } });
  }
  await writeLog(member, 'addFollowUp', payload.customerId, '');
  return { ok: true };
}

async function getTodayTasks(member) {
  const today = todayText(0);
  const tomorrow = todayText(1);
  const nextWeek = todayText(8);
  const base = scope(member, { stage: _.neq('成交') });

  const [overdue, todayList, upcoming] = await Promise.all([
    db.collection('customers').where(Object.assign({}, base, { nextFollowUpAt: _.lt(today) }))
      .orderBy('nextFollowUpAt', 'asc').limit(50).get(),
    db.collection('customers').where(Object.assign({}, base, {
      nextFollowUpAt: _.and(_.gte(today), _.lt(tomorrow)),
    })).orderBy('level', 'asc').limit(50).get(),
    db.collection('customers').where(Object.assign({}, base, {
      nextFollowUpAt: _.and(_.gte(tomorrow), _.lt(nextWeek)),
    })).orderBy('nextFollowUpAt', 'asc').limit(50).get(),
  ]);

  return {
    overdue: overdue.data,
    today: todayList.data,
    upcoming: upcoming.data,
  };
}

// ---------------------------------------------------------------------------
// 导入：每天一张背调表，按 sourceId 去重，已存在则更新背调结论
// ---------------------------------------------------------------------------

async function importCustomers(member, payload) {
  if (member.role === 'member') deny('只有主管可以导入');
  const rows = payload.rows || [];
  if (!rows.length) deny('没有待导入的数据');

  const members = await db.collection('members').where({ teamId: member.teamId, status: 'active' }).get();
  const nameToOpenid = {};
  members.data.forEach((m) => {
    if (m.name) nameToOpenid[m.name.trim()] = m.openid;
  });

  const result = { created: 0, updated: 0, skipped: 0 };
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    for (const row of batch) {
      const sourceId = String(row.sourceId || '').trim();
      if (!sourceId) {
        result.skipped += 1;
        continue;
      }

      const doc = {
        teamId: member.teamId,
        sourceId: sourceId,
        company: row.company || '',
        contact: row.contact || '',
        jobTitle: row.jobTitle || '',
        country: row.country || '',
        email: row.email || '',
        phone: row.phone || '',
        website: row.website || '',
        productCategory: row.productCategory || '',
        intent: row.intent || '',
        businessType: row.businessType || '',
        formType: row.formType || '',
        profile: row.profile || '',
        headcount: row.headcount || '',
        purchasePotential: row.purchasePotential || '',
        verdict: row.verdict || '',
        level: row.level || 'C',
        strategy: row.strategy || '',
        stage: row.stage || '待联系',
        notes: row.notes || '',
        nextFollowUpAt: toDateText(row.nextFollowUpAt) || todayText(3),
        updatedAt: new Date(),
      };

      const exist = await db
        .collection('customers')
        .where({ teamId: member.teamId, sourceId: sourceId })
        .limit(1)
        .get();

      if (exist.data.length) {
        await db.collection('customers').doc(exist.data[0]._id).update({ data: doc });
        result.updated += 1;
      } else {
        const ownerName = String(row.ownerName || '').trim();
        doc.ownerId = nameToOpenid[ownerName] || '';
        doc.ownerName = nameToOpenid[ownerName] ? ownerName : '';
        doc.createdAt = new Date();
        await db.collection('customers').add({ data: doc });
        result.created += 1;
      }
    }
  }

  await writeLog(member, 'importCustomers', '', JSON.stringify(result));
  return result;
}

// ---------------------------------------------------------------------------
// 统计
// ---------------------------------------------------------------------------

async function getTeamStats(member) {
  const base = scope(member, {});
  const [total, won, byMember] = await Promise.all([
    db.collection('customers').where(base).count(),
    db.collection('customers').where(Object.assign({}, base, { stage: '成交' })).count(),
    db
      .collection('customers')
      .aggregate()
      .match(base)
      .group({ _id: '$ownerName', count: _.aggregate.sum(1) })
      .end(),
  ]);

  const byLevel = {};
  for (const level of ['A', 'B', 'C', 'D']) {
    const res = await db.collection('customers').where(Object.assign({}, base, { level })).count();
    byLevel[level] = res.total;
  }

  return {
    total: total.total,
    won: won.total,
    byLevel,
    byMember: (byMember.list || []).map((m) => ({ name: m._id || '未分配', count: m.count })),
  };
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const ACTIONS = {
  getMyProfile,
  createTeam,
  joinTeam,
  listMembers,
  updateMemberRole,
  disableMember,
  listCustomers,
  getCustomer,
  upsertCustomer,
  deleteCustomer,
  transferOwner,
  addFollowUp,
  getTodayTasks,
  importCustomers,
  getTeamStats,
};

exports.main = async (event) => {
  const action = event.action;
  const handler = ACTIONS[action];
  if (!handler) return { ok: false, code: 'BAD_ACTION', message: '未知操作：' + action };

  try {
    const member = await currentMember();
    const isPublic = action === 'getMyProfile' || action === 'createTeam' || action === 'joinTeam';
    if (!member && !isPublic) {
      return { ok: false, code: 'NO_TEAM', message: '尚未加入团队' };
    }
    const data = await handler(member, event);
    return { ok: true, data: data === undefined ? null : data };
  } catch (err) {
    const code = err.code || 'ERROR';
    return { ok: false, code, message: err.message || '服务异常' };
  }
};
