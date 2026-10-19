const ROLE_LABEL = {
  owner: '负责人',
  manager: '主管',
  member: '业务员',
};

function getProfile() {
  const app = getApp();
  if (app && app.globalData && app.globalData.profile) return app.globalData.profile;
  return wx.getStorageSync('profile') || null;
}

function role() {
  const p = getProfile();
  return p ? p.role : '';
}

function isManager() {
  const r = role();
  return r === 'owner' || r === 'manager';
}

function roleLabel(r) {
  return ROLE_LABEL[r] || '成员';
}

function ensureJoined() {
  const p = getProfile();
  if (!p || !p.teamId) {
    wx.showModal({
      title: '尚未加入团队',
      content: '请到「团队」页输入邀请码加入后使用',
      showCancel: false,
    });
    return false;
  }
  return true;
}

module.exports = { getProfile, role, isManager, roleLabel, ensureJoined };
