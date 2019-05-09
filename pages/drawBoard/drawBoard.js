
// Array.prototype.limiteIndex = function (index) {//防止越界，返回正确范围内的索引
//   if(index>this.length-1){
//     return this.length - 1
//   }
//   if(index<0){
//     return 0 
//   }
//   return index;
// }
class ToolsStatus{
    /**
   * toolType为选择了什么工具
   * nowStatus 为当前工具的具体状态
   * ---------------------
   * 0.画笔
   * 1.橡皮
   * 2.选区
   *    --0.未选择图层
   *    --1.已选中图层
   * 3.形状
   *    --0.无焦点状态
   *    --1.拖动状态
   * 4.文字
   *    --0.无焦点状态
   *    --1.等待输入状态，完成  
   * 6.颜料
   */
  constructor(){
    this.toolType = 0;
    this.nowStatus = 0;
    this.keyBord = {
      display:0,//0不显示，1为显示
      x:-100,
      y:-100,
      value:"",
      focus:true
    };

  }
}
class Dom{//模拟dom操作取元素属性类
  constructor(){
  
  }
  getElementByString (str,callback){//可以通过该属性获取元素当前的宽高等信息。str 值为css选择器名 ,注意为回调函数！
    const query = wx.createSelectorQuery()
    var temp 
    query.select(".drawCanvas").boundingClientRect();
    query.exec(function (res) {
      
      callback(res);

    })
  
    return temp
  }
  getElementContext(str, callback) {
    wx.createSelectorQuery().select('.drawCanvas').context(function (res) {
      callback(res);
      
    }).exec()

  }
}

class DrawBoard{
  constructor() {
    this.actions = [];//画布的所有绘制路径事件  
    this.backgroundColor = "white";//默认背景颜色
    this.width = 0 ;
    this.height = 0;
  }
  addAction(){
    this.actions.push(new Action());//添加一次绘制事件

  }
  getLastAction(index = 0 ) {//支持返回倒数前几个点
    let length = this.actions.length
    var index = length - 1 - index

    // index = this.actions.limiteIndex(index)
   

    return this.actions[index];

  }
  getActionByindex(index = 0){
   
    // index =  this.actions.limiteIndex(index)//防止索引越界。
 
    return this.actions[index]
  }
  reload(){//重新载入画布使用
    let ctx = wx.createCanvasContext("testCanvas");
    
    
    var une = {//模拟e传入直接绘画出点
      reload:true,
      index:0
    }
    for (let i = 0; i < this.actions.length; i++) {//遍历每一条路径
      const iAction = this.actions[i];
      iAction.every(function(point){ //调用函数遍历该路径下的所有点
        // canvas_touchmove(une)
       
      })
    }

  
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
    toolsStatus:{},//工具选择状态

    
  }, 

  loadDrawBoard(){
    this.data.drawBoard = new DrawBoard();//画布对象创建，不能直接在data创建。。
    this.data.toolsStatus = new ToolsStatus();
    
  

    (new Dom()).getElementByString(".drawCanvas", (res) => {
      this.data.drawBoard.width = res[0].width
      this.data.drawBoard.height = res[0].height
    })
    this.setData({
     
       'toolsStatus.keyBord.display': 0
    })
    console.log(this.data.toolsStatus)
  },
  compute_textInput(datas,toolsStatus,thisPoint){//切换到文字工具-处理函数
    
    if(toolsStatus.nowStatus == 0){
      toolsStatus.nowStatus = 1
      console.log('开始输入文字')
      this.setData({
        "toolsStatus.keyBord.display":1,
        "toolsStatus.keyBord.value":"",
        "toolsStatus.keyBord.x":thisPoint.x,
        "toolsStatus.keyBord.y":thisPoint.y,
        "toolsStatus.keyBord.focus":true
      })
    }else{
      console.log('结束输入文字')
        toolsStatus.nowStatus = 0
        let text = toolsStatus.keyBord.value
        if (text!="") {
        let ctx = wx.createCanvasContext("testCanvas");
       
        ctx.setFontSize(16);
        ctx.fillText(text,toolsStatus.keyBord.x-6,toolsStatus.keyBord.y+9);
         ctx.draw(true);
        }
        this.setData({
          "toolsStatus.keyBord.display":0,
          "toolsStatus.keyBord.focus":false
        })
     
        
       }   
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
    
    this.loadDrawBoard();

  
    
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {
   
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

  //------UI事件------
  changeStatus(e){//画布工具栏点击事件
    let buttonId = e.currentTarget.id;
    let datas = this.data
    let ctx = wx.createCanvasContext("testCanvas");

    switch (buttonId){
      case "tools_pen":
      console.log("画笔开启");
      datas.toolsStatus.toolType = 0;
      datas.toolsStatus.nowStatus = 0;
      break;
      case "tools_eraser":
        console.log("橡皮开启");
    
        ctx.clearRect(0,0,datas.drawBoard.width,datas.drawBoard.height)
        ctx.draw(true)
        this.loadDrawBoard();
        datas.toolsStatus.toolType = 1;
        datas.toolsStatus.nowStatus = 0;
        break;
      case "tools_shape":
        console.log("矩形开启");
        break;
      case "tools_text":
        console.log("文字开启");
       
        datas.toolsStatus.toolType = 4;
        datas.toolsStatus.nowStatus = 0;



        break;
      case "tools_select":
        console.log("选区开启");
        datas.toolsStatus.toolType = 2;
        datas.toolsStatus.nowStatus = 0;

        let action_index = 0


        let delAction = datas.drawBoard.actions[action_index]
        let linewidth = delAction.lineWidth + 3
        // datas.drawBoard.actions.splice(action_index,1);//删除第二次绘制事件

        ctx.fillStyle = 'red';

        delAction.every(function (point) {
          ctx.fillRect(point.x - linewidth / 2, point.y - linewidth / 2, linewidth, linewidth)
        })
        ctx.draw(true)
        datas.drawBoard.reload()
        break;
      case "tools_pigment":
        console.log("颜料点击");
        break;
    }
    

  },
  
  canvas_touchstart(e) {
    let datas = this.data
    let toolsStatus = datas.toolsStatus
    let thisPoint = new CGPoint(e.touches[0].x, e.touches[0].y)
    console.log("按下",thisPoint)
    switch(toolsStatus.toolType){
      case 4:
          this.compute_textInput(datas,toolsStatus,thisPoint)
         return
      break;
    }
    
    

    this.data.drawBoard.addAction();//开始添加一次绘制事件
    let lsAction = this.data.drawBoard.getLastAction();//并且开始记录
    lsAction.addPoint(...thisPoint.getJsonArr());


    

  },

  canvas_touchmove(e) { 
    let datas = this.data
    let toolsStatus = datas.toolsStatus
    let thisPoint = new CGPoint(e.touches[0].x, e.touches[0].y) //当前新的点，
    switch(toolsStatus.toolType){
      case 4:
      this.setData({
       
        "toolsStatus.keyBord.x":thisPoint.x,
        "toolsStatus.keyBord.y":thisPoint.y,
       
      })
         return
      break;
    }
    
    var lsAction = {}
    
    if (e.reload == true) {//判断是否是程序重新载入而调用的
      lsAction = datas.drawBoard.getActionByindex(e.index)
      console.log(e.index)
      return
    } else {
      lsAction = datas.drawBoard.getLastAction()
    }

    let lsPoint = lsAction.getLastPoint();//上一次最后一个点
    let lsPoint_1 = lsAction.getLastPoint(1)//倒数第二个点
    let [lsX, lsY, tX, tY, lssX, lssY] = [...lsPoint.getJsonArr(), ...thisPoint.getJsonArr(), ...lsPoint_1.getJsonArr()]
    let [style_lineWidth, style_Color] = [3, 'rgb(0,0,0)']

    let ctx = wx.createCanvasContext("testCanvas");
    ctx.strokeStyle = style_Color
    // ctx.setStrokeStyle(style_Color)
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    // ctx.setShadow(0, 0, style_lineWidth*2,"rgba(0,0,0,0.3)")
    ctx.lineWidth=style_lineWidth
    //曲线优化
   
    ctx.moveTo((lssX+lsX)/2,(lsY+lssY)/2)
    ctx.quadraticCurveTo(...lsPoint.getJsonArr(), (lsX+tX)/2,(lsY+tY)/2)
    ctx.stroke()
    ctx.draw(true)

    lsAction.lineWidth = style_lineWidth
    lsAction.color = style_Color 
    lsAction.addPoint(...thisPoint.getJsonArr())
 
  },
  canvas_touchend(e) {
    //触摸完毕，进行曲线调整。
    let datas = this.data
    // let lsAction = datas.drawBoard.getLastAction()
    // lsAction.every(function(point){
      
     
    //   // console.log(this)
    // })


  },
  textFieldInput(e){
    
    this.data.toolsStatus.keyBord.value  = e.detail.value
  }
  //-------

})