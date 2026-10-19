const { call } = require('../../utils/cloud');
const { STAGES } = require('../../utils/format');

const PAGE_SIZE = 20;

Page({
  data: {
    stages: STAGES,
    stageIndex: 0,
    keyword: '',
    list: [],
    loading: true,
    hasMore: true,
    isManager: false,
  },

  onShow() {
    const { isManager } = require('../../utils/auth');
    this.setData({ isManager: isManager() });
    this.reset();
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadMore();
  },

  onPullDownRefresh() {
    this.reset().then(() => wx.stopPullDownRefresh());
  },

  async reset() {
    this.setData({ list: [], hasMore: true, loading: true });
    await this.loadMore();
  },

  async loadMore() {
    if (!this.data.hasMore) return;
    try {
      const stage = this.data.stageIndex === 0 ? '' : this.data.stages[this.data.stageIndex];
      const rows = await call(
        'crm',
        'listCustomers',
        {
          keyword: this.data.keyword,
          stage: stage,
          skip: this.data.list.length,
          limit: PAGE_SIZE,
        },
        { silent: true }
      );
      const { dueText } = require('../../utils/format');
      const decorated = (rows || []).map((item) => {
        item.dueText = dueText(item.nextFollowUpAt);
        item.isOverdue = require('../../utils/format').daysUntil(item.nextFollowUpAt) < 0;
        return item;
      });
      this.setData({
        list: this.data.list.concat(decorated),
        hasMore: decorated.length === PAGE_SIZE,
        loading: false,
      });
    } catch (err) {
      const { ensureJoined } = require('../../utils/auth');
      ensureJoined();
      this.setData({ loading: false });
    }
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value });
    this.reset();
  },

  onStage(e) {
    this.setData({ stageIndex: Number(e.currentTarget.dataset.index) });
    this.reset();
  },

  async onMarkFromList(e) {
    try {
      await call(
        'crm',
        'addFollowUp',
        { customerId: e.detail.id, content: '已联系（快速标记）', nextAtOffsetDays: 3 },
        { loading: true }
      );
      wx.showToast({ title: '已顺延 3 天' });
      this.reset();
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },

  goDetail(e) {
    wx.navigateTo({
      url: '/pages/customer-detail/customer-detail?id=' + e.currentTarget.dataset.id,
    });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/customer-detail/customer-detail' });
  },
});
