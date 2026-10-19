App({
  globalData: {
    profile: null,
    teamId: '',
    role: '',
    ready: false,
  },

  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({ title: '基础库过低', content: '请升级微信后使用', showCancel: false });
      return;
    }
    wx.cloud.init({ env: 'REPLACE_WITH_YOUR_ENV_ID', traceUser: true });
    this.loadProfile();
  },

  async loadProfile() {
    const { call } = require('./utils/cloud');
    try {
      const profile = await call('crm', 'getMyProfile', {}, { silent: true });
      this.globalData.profile = profile;
      this.globalData.teamId = profile ? profile.teamId : '';
      this.globalData.role = profile ? profile.role : '';
      this.globalData.ready = true;
      wx.setStorageSync('profile', profile);
      if (this.profileReadyCallback) this.profileReadyCallback(profile);
    } catch (err) {
      this.globalData.ready = true;
      if (this.profileReadyCallback) this.profileReadyCallback(null);
    }
  },

  isManager() {
    const role = this.globalData.role;
    return role === 'owner' || role === 'manager';
  },
});
