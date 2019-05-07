Page({

  /**
   * 页面的初始数据
   */
  data: {

   
    actions: [],

    actionStatus:0//工具选择状态
  },
  Action() {
    this.xys = [];
    this.time = "";
    this.addXY = function (x, y) {
      this.xys.push([x, y]);

    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    Array.prototype.last = function(){
      return this[this.length-1];
    }
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

  canvas_touchstart(e) {
    let datas = this.data;

    var newaction = new this.Action();
    datas.actions.push(newaction);
    datas.actions[datas.actions.length - 1].addXY(e.touches[0].x, e.touches[0].y)

    
   

  },
  canvas_touchmove(e) {
    let datas = this.data;
    const ctx = wx.createCanvasContext("testCanvas")
    ctx.setStrokeStyle('blue')
    ctx.setLineJoin("round")
    ctx.setLineCap("round")
    ctx.setLineWidth(2)
    console.log(datas.actions.last.xys[0])
    return
    ctx.moveTo(datas.actions.last.xys[0], datas.actions.last.xys[1])
    var tempXy = [datas.actions[datas.actions.length - 2].xys[0], datas.actions[datas.actions.length - 2].xys[1]]
    
    datas.actions[datas.actions.length - 1].addXY(e.touches[0].x, e.touches[0].y)
    // ctx.lineTo(this.data.nowXY.x, this.data.nowXY.y)
    ctx.quadraticCurveTo(tempXy[0], tempXy[1], (tempXy[0] + datas.actions.last.xys[0]) / 2, (tempXy[1] + datas.actions.last.xys[1]) / 2)
    ctx.stroke()
    ctx.draw(true)

 
  },
  canvas_touchend(e) {
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

  },

  //------单击事件------
  changeStatus(e){//画布工具栏点击事件
    let buttonId = e.currentTarget.id;
    switch (buttonId){
      case "tools_pen":
      console.log("画笔开启");
      break;
      case "tools_eraser":
        console.log("橡皮开启");
        break;
      case "tools_select":
        console.log("选区开启");
        break;
      case "tools_pigment":
        console.log("颜料点击");
        break;
    }
    

  }

})