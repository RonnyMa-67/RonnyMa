function call(name, action, data = {}, options = {}) {
  const silent = options.silent === true;
  const loading = options.loading === true;

  if (loading) wx.showLoading({ title: '处理中', mask: true });

  return wx.cloud
    .callFunction({ name, data: { action, ...data } })
    .then((res) => {
      const body = res.result || {};
      if (body.ok === false) {
        const err = new Error(body.message || '请求失败');
        err.code = body.code;
        throw err;
      }
      return body.data;
    })
    .catch((err) => {
      if (!silent) {
        wx.showToast({
          title: (err && err.message) || '网络异常',
          icon: 'none',
          duration: 2000,
        });
      }
      throw err;
    })
    .finally(() => {
      if (loading) wx.hideLoading();
    });
}

function toast(title) {
  wx.showToast({ title, icon: 'none' });
}

module.exports = { call, toast };
