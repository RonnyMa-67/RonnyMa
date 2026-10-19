const { call } = require('../../utils/cloud');
const { roleLabel, isManager } = require('../../utils/auth');

Page({
  data: {
    joined: false,
    profile: null,
    roleText: '',
    members: [],
    stats: null,
    inviteCode: '',
    teamName: '',
    inputName: '',
    inputCode: '',
    isManager: false,
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      const profile = await call('crm', 'getMyProfile', {}, { silent: true });
      if (!profile) {
        this.setData({ joined: false, profile: null });
        return;
      }
      const app = getApp();
      app.globalData.profile = profile;
      app.globalData.teamId = profile.teamId;
      app.globalData.role = profile.role;

      const [members, stats] = await Promise.all([
        call('crm', 'listMembers', {}, { silent: true }).catch(() => []),
        call('crm', 'getTeamStats', {}, { silent: true }).catch(() => null),
      ]);

      this.setData({
        joined: true,
        profile,
        roleText: roleLabel(profile.role),
        isManager: isManager(),
        members: (members || []).map((m) => Object.assign({}, m, { roleText: roleLabel(m.role) })),
        stats,
        inviteCode: profile.inviteCode || '',
        teamName: profile.teamName || '',
      });
    } catch (err) {
      this.setData({ joined: false });
    }
  },

  onNameInput(e) {
    this.setData({ inputName: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ inputCode: e.detail.value });
  },

  async createTeam() {
    const name = this.data.inputName.trim();
    if (!name) {
      wx.showToast({ title: '填写你的名字', icon: 'none' });
      return;
    }
    try {
      await call('crm', 'createTeam', { name }, { loading: true });
      wx.showToast({ title: '团队已创建' });
      this.refresh();
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },

  async joinTeam() {
    const code = this.data.inputCode.trim();
    if (!code) {
      wx.showToast({ title: '填写邀请码', icon: 'none' });
      return;
    }
    try {
      await call('crm', 'joinTeam', { inviteCode: code, name: this.data.inputName.trim() }, { loading: true });
      wx.showToast({ title: '已加入团队' });
      this.refresh();
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },

  copyCode() {
    wx.setClipboardData({ data: this.data.inviteCode });
  },

  changeRole(e) {
    const index = Number(e.currentTarget.dataset.index);
    const target = this.data.members[index];
    if (!target) return;
    const next = target.role === 'manager' ? 'member' : 'manager';
    wx.showActionSheet({
      itemList: ['设为主管', '设为业务员'],
      success: async (res) => {
        const role = res.tapIndex === 0 ? 'manager' : 'member';
        if (role === target.role) return;
        try {
          await call('crm', 'updateMemberRole', { openid: target.openid, role }, { loading: true });
          wx.showToast({ title: '已更新' });
          this.refresh();
        } catch (err) {
          /* 错误已在请求层提示 */
        }
      },
    });
    void next;
  },
});
