Page({

  /**
   * 页面的初始数据
   */
  data: {
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  canvas_touchstart(e){
    const xy = e.touches[0]
    console.log("x:" + xy.x +"  y:"+xy.y);
    
  },
  canvas_touchmove(e){
    const xy = e.touches[0]
    console.log("x:" + xy.x + "  y:" + xy.y);
  },
  canvas_touchend(e){
    console.log(e)
    // const xy = e.touches[0]
    // console.log("x:" + xy.x + "  y:" + xy.y);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
    const ctx = wx.createCanvasContext("testCanvas")
    ctx.setStrokeStyle('white')
    ctx.setLineWidth(1)
    ctx.rect(0, 0,120, 200)
    ctx.stroke()
    ctx.draw()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  }
})