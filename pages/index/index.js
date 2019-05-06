Page({

  /**
   * 页面的初始数据
   */
  data: {
   
    nowXY:{
     
    }
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {
    // this.setData({
    //   ctx:wx.createCanvasContext("testCanvas")
    // })
   
    // this.data.ctx.setStrokeStyle('white')
    // this.data.ctx.setLineWidth(1)
    // this.data.ctx.rect(0, 0, 120, 200)
    // this.data.ctx.stroke()
    // this.data.ctx.draw()
  },

  canvas_touchstart(e){
    this.setData({
      nowXY:e.touches[0]
      
    })
    
  },
  canvas_touchmove(e){
   
    const ctx= wx.createCanvasContext("testCanvas")
    ctx.setStrokeStyle('blue')
    ctx.setLineJoin("round")
    ctx.setLineCap("round")
    ctx.setLineWidth(5)
    ctx.moveTo(this.data.nowXY.x, this.data.nowXY.y)
    this.setData({
      nowXY: e.touches[0]
    })
    ctx.lineTo(this.data.nowXY.x, this.data.nowXY.y)
    
    ctx.stroke()
    ctx.draw(true)
  },
  canvas_touchend(e){
   //触摸完毕
    
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