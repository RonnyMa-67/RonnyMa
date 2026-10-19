const { call } = require('../../utils/cloud');

Page({
  data: {
    overdue: [],
    today: [],
    upcoming: [],
    loading: true,
    role: '',
  },

  onLoad() {
    const app = getApp();
    this.setData({ role: app.globalData.role || '' });
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },

  async load() {
    this.setData({ loading: true });
    try {
      const data = await call('crm', 'getTodayTasks', {}, { silent: true });
      this.setData({
        overdue: this.decorate(data.overdue || []),
        today: this.decorate(data.today || []),
        upcoming: this.decorate(data.upcoming || []),
        loading: false,
      });
    } catch (err) {
      const { ensureJoined } = require('../../utils/auth');
      ensureJoined();
      this.setData({ loading: false });
    }
  },

  decorate(list) {
    const { dueText } = require('../../utils/format');
    return list.map((item) => {
      item.dueText = dueText(item.nextFollowUpAt);
      return item;
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/customer-detail/customer-detail?id=' + id });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/customer-detail/customer-detail' });
  },

  async markDone(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await call(
        'crm',
        'addFollowUp',
        { customerId: id, content: '已联系（快速标记）', nextAtOffsetDays: 3 },
        { loading: true }
      );
      wx.showToast({ title: '已顺延 3 天' });
      this.load();
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },
});
