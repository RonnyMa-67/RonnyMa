const { call } = require('../../utils/cloud');
const { STAGES, LEVELS, dateText } = require('../../utils/format');
const { isManager } = require('../../utils/auth');

Page({
  data: {
    id: '',
    isNew: true,
    stages: STAGES,
    levels: LEVELS,
    stageIndex: 0,
    levelIndex: 2,
    form: {},
    followups: [],
    members: [],
    memberIndex: 0,
    canManage: false,
    nextDate: '',
    content: '',
    loading: true,
  },

  onLoad(options) {
    this.setData({
      id: options.id || '',
      isNew: !options.id,
      canManage: isManager(),
      loading: !!options.id,
    });
    if (options.id) {
      this.load(options.id);
      if (this.data.canManage) this.loadMembers();
    } else {
      this.setData({ nextDate: this.defaultNextDate() });
    }
  },

  defaultNextDate() {
    return dateText(new Date(Date.now() + 3 * 86400000));
  },

  async load(id) {
    try {
      const data = await call('crm', 'getCustomer', { id });
      const c = data.customer || {};
      this.setData({
        form: c,
        stageIndex: Math.max(0, STAGES.indexOf(c.stage || '待联系')),
        levelIndex: Math.max(0, LEVELS.indexOf(c.level || 'C')),
        followups: (data.followups || []).map((f) => {
          f.dateText = dateText(f.createdAt);
          return f;
        }),
        nextDate: dateText(c.nextFollowUpAt) || '',
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  async loadMembers() {
    const rows = await call('crm', 'listMembers', {}, { silent: true }).catch(() => []);
    this.setData({ members: rows || [] });
  },

  onField(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  onStage(e) {
    this.setData({ stageIndex: Number(e.detail.value) });
  },

  onLevel(e) {
    this.setData({ levelIndex: Number(e.detail.value) });
  },

  onDate(e) {
    this.setData({ nextDate: e.detail.value });
  },

  onOwner(e) {
    this.setData({ memberIndex: Number(e.detail.value) });
  },

  onContent(e) {
    this.setData({ content: e.detail.value });
  },

  copyStrategy() {
    wx.setClipboardData({ data: this.data.form.strategy || '' });
  },

  copyEmail() {
    wx.setClipboardData({ data: this.data.form.email || '' });
  },

  callPhone() {
    const phone = this.data.form.phone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone.replace(/\s/g, '') });
  },

  async save() {
    const f = this.data.form;
    const payload = {
      id: this.data.id,
      company: f.company || '',
      contact: f.contact || '',
      jobTitle: f.jobTitle || '',
      country: f.country || '',
      email: f.email || '',
      phone: f.phone || '',
      website: f.website || '',
      stage: this.data.stages[this.data.stageIndex],
      level: this.data.levels[this.data.levelIndex],
      notes: f.notes || '',
      nextFollowUpAt: this.data.nextDate || '',
    };
    if (!payload.company) {
      wx.showToast({ title: '请填写公司名称', icon: 'none' });
      return;
    }
    try {
      const saved = await call('crm', 'upsertCustomer', payload, { loading: true });
      wx.showToast({ title: '已保存' });
      if (this.data.isNew) {
        this.setData({ id: saved._id, isNew: false });
        wx.setNavigationBarTitle({ title: '客户详情' });
      }
      this.load(saved._id);
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },

  async addFollowUp() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '写一句跟进内容', icon: 'none' });
      return;
    }
    try {
      await call(
        'crm',
        'addFollowUp',
        { customerId: this.data.id, content: this.data.content.trim(), nextAt: this.data.nextDate || null },
        { loading: true }
      );
      this.setData({ content: '' });
      wx.showToast({ title: '已记录' });
      this.load(this.data.id);
    } catch (err) {
      /* 错误已在请求层提示 */
    }
  },

  async transfer() {
    const target = this.data.members[this.data.memberIndex];
    if (!target) return;
    wx.showModal({
      title: '转交客户',
      content: '将「' + (this.data.form.company || '该客户') + '」转交给 ' + target.name + '？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await call('crm', 'transferOwner', { id: this.data.id, toOpenid: target.openid }, { loading: true });
          wx.showToast({ title: '已转交' });
          this.load(this.data.id);
        } catch (err) {
          /* 错误已在请求层提示 */
        }
      },
    });
  },

  remove() {
    wx.showModal({
      title: '删除客户',
      content: '删除后不可恢复，确认删除？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await call('crm', 'deleteCustomer', { id: this.data.id }, { loading: true });
          wx.navigateBack();
        } catch (err) {
          /* 错误已在请求层提示 */
        }
      },
    });
  },
});
