Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tapcard', { id: this.data.item._id });
    },

    onMark(e) {
      wx.stopPropagation && wx.stopPropagation();
      this.triggerEvent('markdone', { id: this.data.item._id });
    },
  },
});
