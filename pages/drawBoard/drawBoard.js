
Array.prototype.last = function () {
  return this[this.length - 1];
}
class DrawBoard{
  constructor() {
    this.actions = [];//画布的所有绘制路径事件  
    this.backgroundColor = "white";//默认背景颜色

  }
  addAction(){
    this.actions.push(new Action());//添加一次绘制事件

  }
  getLastAction() {
    return this.actions[this.actions.length-1];

  }
}
class Action{//绘制事件类
  constructor() {
    this.points = [] ;//CGPoint类型
    this.lineWidth =  5;
    this.color = "red";
    this.time = "";
    this.user = "IMtao";
  }
  addPoint(x,y){
    this.points.push(new CGPoint(x,y))
  }
  getLastPoint(index = 0){//返回CGPoint , 支持返回倒数前几个点，默认为0最后一个
    return this.points[this.points.length - 1 - index]
  }

}
class CGPoint {//坐标点类
  
  constructor(x,y) {
    this.x = x ;
    this.y = y;
  }
  getJsonArr(){
   
    return [this.x,this.y] 
  }
  getJson() {
    const json = { x: this.x, y: this.y }
    return json
  }
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    drawBoard:{},

    actionStatus:0//工具选择状态
  }, 

  

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.drawBoard = new DrawBoard();//画布对象创建，不能直接在data创建。。
  
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {
   
  },

  canvas_touchstart(e) {
    
    this.data.drawBoard.addAction();//开始添加一次绘制事件
    let lsAction = this.data.drawBoard.getLastAction();//并且开始记录
    lsAction.addPoint(e.touches[0].x, e.touches[0].y);


    console.log(this.data.drawBoard)
 

  },

  canvas_touchmove(e) {

    let ctx = wx.createCanvasContext("testCanvas");
    let datas = this.data
    let lsAction = datas.drawBoard.getLastAction()
    let lsPoint = lsAction.getLastPoint();
    let thisPoint = new CGPoint(e.touches[0].x, e.touches[0].y) 

    ctx.setStrokeStyle('blue')
    ctx.setLineJoin("round")
    ctx.setLineCap("round")
    ctx.setLineWidth(2)

    ctx.moveTo(...lsPoint.getJsonArr())
   
    ctx.lineTo(...thisPoint.getJsonArr())
    lsAction.addPoint(...thisPoint.getJsonArr())

    // ctx.quadraticCurveTo(...lsPoint.getJsonArr(), (tempXy[0] + datas.actions.last.xys[0]) / 2, (tempXy[1] + datas.actions.last.xys[1]) / 2)
    
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