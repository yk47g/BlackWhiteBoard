
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
  getLastAction(index = 0 ) {//支持返回倒数前几个点
    let length = this.actions.length
    var index = length - 1 - index
    if (index < 0) {//当越界时返回第一个点
      index = 0
    }
    return this.actions[index];

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
    let length = this.points.length
    var index = length - 1 - index
    if (index<0){//当越界时返回第一个点
      index = 0
    }
    return this.points[index]
  }
  every(compute){//一个遍历函数，遍历当前绘制事件下所有的点，参数为一个处理函数 
    for (let i = 0; i < this.points.length; i++) {
      const ipoint = this.points[i];
      compute(ipoint);//函数格式。参数为各个point点。
    }
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
    let lsPoint = lsAction.getLastPoint();//上一次最后一个点
    let thisPoint = new CGPoint(e.touches[0].x, e.touches[0].y) //当前新的点，
    let [style_lineWidth, style_Color] = [2, 'rgb(255.255.255)']
    console.log(thisPoint);
    ctx.strokeStyle = style_Color
    ctx.setLineJoin("round")
    ctx.setLineCap("round")
    ctx.setShadow(0, 0, 4,"rgba(0,0,0,0.2)")
    ctx.lineWidthstyle_lineWidth

   
    ctx.moveTo(...lsPoint.getJsonArr())

    // ctx.lineTo(...thisPoint.getJsonArr())

    let lsPoint_1 = lsAction.getLastPoint(1)//倒数第二个点
    let [lsX, lsY, tX, tY, lssX, lssY] = [...lsPoint, ...thisPoint, ...lsPoint_1]

    //曲线优化
   
    ctx.moveTo((lssX+lsX)/2,(lsY+lssY)/2)
    ctx.quadraticCurveTo(...lsPoint.getJsonArr(), (lsX+tX)/2,(lsY+tY)/2)
    ctx.stroke()
    ctx.draw(true)

    lsAction.lineWidth = style_lineWidth
    lsAction.color = style_Color 
    // lsAction.addPoint(...thisPoint.getJsonArr())
    lsAction.addPoint(...thisPoint.getJsonArr())
 
  },
  canvas_touchend(e) {
    //触摸完毕，进行曲线调整。
    let datas = this.data
    let lsAction = datas.drawBoard.getLastAction()
    lsAction.every(function(point){
      
     
      // console.log(this)
    })


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
    let datas = this.data
    let ctx = wx.createCanvasContext("testCanvas");

    switch (buttonId){
      case "tools_pen":
      console.log("画笔开启");
      break;
      case "tools_eraser":
        console.log("橡皮开启");
        let action_index = 0
        

        let delAction = datas.drawBoard.actions[action_index]
        let linewidth = delAction.lineWidth + 2
        // datas.drawBoard.actions.splice(action_index,1);//删除第二次绘制事件

        ctx.setFillStyle('red');
          
        delAction.every(function(point){
          console.log(point)
         
           ctx.fillRect(point.x-linewidth/2,point.y-linewidth/2,linewidth,linewidth)
       
        })
        ctx.draw(true)
      
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