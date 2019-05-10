
// Array.prototype.limiteIndex = function (index) {//防止越界，返回正确范围内的索引
//   if(index>this.length-1){
//     return this.length - 1
//   }
//   if(index<0){
//     return 0 
//   }
//   return index;
// }
let canvas_ID = "testCanvas"
function release(...list) {//释放内存函数。
  for (let i = 0; i < list.length; i++) {
    delete list[i]
    list[i] = null
  }
}
class MouseAction {//用来记录手指移动距离等数据
  constructor(startPoint) {
    this.distance = 0;//1️以像素的平方为单位
    this.startPoint = startPoint //cgpoint类型
    this.endPoint = null
    this.time = 0

  }
}

class ToolsStatus {
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
 * 5.颜料
 */
  constructor() {
    this.toolType = 0;
    this.nowStatus = 0;//只有优先级,不对应类型。
    this.color = "white";
    this.keyBord = {
      display: 0,//0不显示，1为显示
      x: -100,
      y: -100,
      value: "",
      focus: true,
      fontSize: 16
    };
    this.select = {
      selecting: false,//当前有焦点被选中。
      points: new Array(4),//四个点顺时针，cgpoin类型
      actionsIndex: []
    }

    this.mouseActions = [] //mouseAction 对象数组。

  }
  addSelect(indexValue) {//避免重复
    var exist = false
    for (let i = 0; i < this.select.actionsIndex.length; i++) {
      const element = this.select.actionsIndex[i];
      if (element == indexValue) {
        exist = true
      }
    }
    if (exist != true) {
      this.select.actionsIndex.push(indexValue)
    }
  }
  deleteSelect(indexValue) {

    for (let i = 0; i < this.select.actionsIndex.length; i++) {
      const element = this.select.actionsIndex[i];
      if (element == indexValue) {
        this.select.actionsIndex.splice(i, 1)
      }
    }
  }

}
let ToolsStatus_type = {//当做枚举来用。
  pen: 0,
  mouse: 1,
  eraser: 2,
  shape: 3,
  text: 4,
  color: 5
}
let Mouse_touchMove = {
  move: 0,
  flex: 1
}
function estimateForMouse(points) {//判断选中时，鼠标的按下事件是什么类型。返回离的最近的点的索引
  var distance = 100//允许的偏差距离。
  var tempValue = 0
  var selectindex = -1
  for (let i = 0; i < points.length; i++) {
    const element = points[i];
    tempValue = Math.pow(point.x - cgline.points[i].x, 2) + Math.pow(point.y - cgline.points[i].y, 2)
    if (tempValue < distance) {
      distance = tempValue
      selectindex = i
    }
  }

  return selectindex
}
class Dom {//模拟dom操作取元素属性类
  constructor() {

  }
  getElementByString(str, callback) {//可以通过该属性获取元素当前的宽高等信息。str 值为css选择器名 ,注意为回调函数！
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

class DrawBoard {
  constructor() {
    this.actions = [];//画布的所有绘制路径事件  
    this.backgroundColor = "white";//默认背景颜色
    this.width = 0;
    this.height = 0;
  }
  addAction(type) {
    this.actions.push(new Action(type));//添加一次绘制事件
    return this.getLastAction()
  }
  getLastAction(index = 0) {//支持返回倒数前几个点
    let length = this.actions.length
    var index = length - 1 - index

    // index = this.actions.limiteIndex(index)


    return this.actions[index];

  }
  getActionByindex(index = 0) {

    // index =  this.actions.limiteIndex(index)//防止索引越界。

    return this.actions[index]
  }

}
class Action {//绘制事件类

  /**
   * Actiontype:
   * 0.曲线
   * 1.形状
   * 2.文字
   * 3.图片
   * */
  constructor(type) {
    console.log("新绘制事件：" + type);
    this.mode = {};

    switch (type) {
      case Action_type.line:
        this.mode = new CGLine()
        break
      case Action_type.shape:
        this.mode = new CGShape()
        break
      case Action_type.image:
        this.mode = new CGImage()
        break
      case Action_type.text:

        this.mode = new CGText()
        break
    }
    this.type = type;//对应toolsStatus备注
    this.user = "IMtao";
    this.time = "123";

  }
}
let Action_type = {
  line: 0,
  shape: 1,
  text: 2,
  image: 3
}


class CGPoint {//坐标点类

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  getJsonArr() {

    return [this.x, this.y]
  }
  getJson() {
    const json = { x: this.x, y: this.y }
    return json
  }
}

class CGLine {
  constructor() {
    this.points = [];//CGPoint类型
    this.lineWidth = 5;
    this.color = "red";
  }
  addPoint(x, y) {
    this.points.push(new CGPoint(x, y))
  }
  getLastPoint(index = 0) {//返回CGPoint , 支持返回倒数前几个点，默认为0最后一个
    let length = this.points.length
    var index = length - 1 - index

    //当越界处理、
    index = index < 0 ? 0 : index
    index = index > length ? length - 1 : index
    return this.points[index]
  }
  getPointByIndex(index) {
    let length = this.points.length
    return this.getLastPoint(length - 1 - index)
  }

  every(compute) {//一个遍历函数，遍历当前路径下所有的点，参数为一个处理函数 
    for (let i = 0; i < this.points.length; i++) {
      const ipoint = this.points[i];
      compute(ipoint);//函数格式。参数为各个point点。
    }
  }
}

class CGShape extends CGLine {
  constructor() {
    super()
  }
}

class CGImage {
  constructor() {

  }
}
class CGText {
  constructor() {
    this.text = "";
    this.size = 16;
    this.color = "black";
    this.position = null;
  }
}


Page({

  /**
   * 页面的初始数据
   */
  data: {
    drawBoard: {},
    toolsStatus: {},//工具选择状态


  },
  draw_line_curve(ctx, thisPoint, lsPoint, lssPoint, color = "black", width = 3) {
    //曲线优化
    //起点为： 上一个点和上上个点的中点
    //控制点为：上一个点
    //终点为：上一个点和当前点的中点


    // let ctx = wx.createCanvasContext(canvas_ID);
    // ctx.beginPath()
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.lineWidth = width
    ctx.strokeStyle = color
    // ctx.setShadow(0, 0, style_lineWidth*2,"rgba(0,0,0,0.3)")
    if (lssPoint == null) {
      ctx.moveTo(...lsPoint.getJsonArr())
      ctx.lineTo(...thisPoint.getJsonArr())
    } else {
      let [lsX, lsY, tX, tY, lssX, lssY] = [...lsPoint.getJsonArr(), ...thisPoint.getJsonArr(), ...lssPoint.getJsonArr()]
      ctx.moveTo((lssX + lsX) / 2, (lsY + lssY) / 2)
      ctx.quadraticCurveTo(...lsPoint.getJsonArr(), (lsX + tX) / 2, (lsY + tY) / 2)
    }

    // ctx.stroke()
    // ctx.draw(true)不直接在此函数默认执行draw 避免出现闪烁的现象。

  },
  draw_text(ctx, cgText) {

    ctx.setFontSize(cgText.size);
    ctx.fillText(cgText.text, ...cgText.position.getJsonArr());
    // ctx.draw(true);
  },
  //draw 方法不会调用draw 显示，需要在外部调用。
  compute_textInput(thisPoint, disFocus = false) {//切换到文字工具-处理函数
    let datas = this.data
    let toolsStatus = datas.toolsStatus

    if (disFocus == true || toolsStatus.nowStatus != 0) {
      console.log('结束输入文字')

      let text = toolsStatus.keyBord.value

      if (text != "") {
        let size = 16
        let lsAction = (datas.drawBoard.addAction(Action_type.text)).mode//为CGText
        lsAction.text = text
        lsAction.size = size
        lsAction.position = new CGPoint(toolsStatus.keyBord.x - 6, toolsStatus.keyBord.y + 9)
        let ctx = wx.createCanvasContext(canvas_ID);
        this.draw_text(ctx, lsAction)
        ctx.draw(true);

      }

      toolsStatus.nowStatus = 0//清空等待输入状态
      this.setData({
        "toolsStatus.keyBord.display": 0,
        "toolsStatus.keyBord.focus": false,
        "toolsStatus.keyBord.value": ""
      })

    } else {

      toolsStatus.nowStatus = 1
      console.log('开始输入文字')
      this.setData({
        "toolsStatus.keyBord.display": 1,
        "toolsStatus.keyBord.value": "",
        "toolsStatus.keyBord.x": thisPoint.x,
        "toolsStatus.keyBord.y": thisPoint.y,
        "toolsStatus.keyBord.focus": true
      })
    }
  },
  compute_line(thisPoint) {//只在手移动绘画时被调用。

    let datas = this.data
    let lsAction = datas.drawBoard.getLastAction().mode//此处lsAction 类型为CGLine
    let lsPoint = lsAction.getLastPoint();//上一个点
    let lssPoint = lsAction.getLastPoint(1);//上一个点
    let ctx = wx.createCanvasContext(canvas_ID);
    lsAction.addPoint(...thisPoint.getJsonArr())//把点加到数据库中。
    this.draw_line_curve(ctx, thisPoint, lsPoint, lssPoint)
    ctx.stroke()
    ctx.draw(true)
    release(ctx)
  },
  compute_mouse(thisPoint) {
    let action_index = 0



    let delAction = datas.drawBoard.actions[action_index]
    let linewidth = delAction.lineWidth + 3
    // datas.drawBoard.actions.splice(action_index,1);//删除第二次绘制事件

    ctx.fillStyle = 'red';

    delAction.every(function (point) {
      ctx.fillRect(point.x - linewidth / 2, point.y - linewidth / 2, linewidth, linewidth)
    })
    ctx.draw(true)

  },
  mouse_selectAction(action, selecting = false) {//处理选区 按下事件,当selecting时，传入action为两个point，手指的起点和终点。
    let ctx = wx.createCanvasContext(canvas_ID);
    let points = this.data.toolsStatus.select.points
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    ctx.fillStyle = "red"
    var maxXY = {
      x: -10000,
      y: -10000
    };
    var minXY = {
      x: 10000,
      y: 10000
    }
    if (selecting == false) {

      switch (action.type) {
        case Action_type.line:
          const cgline = action.mode
          // console.log(cgline)
          cgline.every(function (point) {
            maxXY.x = point.x > maxXY.x ? point.x : maxXY.x
            maxXY.y = point.y > maxXY.y ? point.y : maxXY.y

            minXY.x = point.x < minXY.x ? point.x : minXY.x
            minXY.y = point.y < minXY.y ? point.y : minXY.y
          })
          break

        case Action_type.shape:

          break
        case Action_type.image:

          break
        case Action_type.text:

          break
      }
      let interval = 3
      let pointSize = 6
      let pointSize_offset = pointSize / 2
      maxXY.x += interval
      maxXY.y += interval
      minXY.x -= interval
      minXY.y -= interval
      //开始绘制选框

      //左上角开始顺时针。
      points[0] = new CGPoint(minXY.x - pointSize_offset, minXY.y - pointSize_offset)
      points[1] = new CGPoint(maxXY.x - pointSize_offset, minXY.y - pointSize_offset)
      points[2] = new CGPoint(maxXY.x - pointSize_offset, maxXY.y - pointSize_offset)
      points[3] = new CGPoint(minXY.x - pointSize_offset, maxXY.y - pointSize_offset)
      ctx.fillRect(...points[0].getJsonArr(), pointSize, pointSize)
      ctx.fillRect(...points[1].getJsonArr(), pointSize, pointSize)
      ctx.fillRect(...points[2].getJsonArr(), pointSize, pointSize)
      ctx.fillRect(...points[3].getJsonArr(), pointSize, pointSize)
    } else {
      //当selecting时，传入action为两个point，手指的起点和终点。
      console.log("aaaa", action)
      points[0] = new CGPoint(action[0].x, action[0].y)
      points[1] = new CGPoint(action[1].x, action[0].y)
      points[2] = new CGPoint(action[1].x, action[1].y)
      points[3] = new CGPoint(action[0].x, action[1].y)
      minXY = points[0].getJson()
      maxXY = points[2].getJson()
    }




    ctx.moveTo(minXY.x, minXY.y)
    ctx.lineTo(maxXY.x, minXY.y)

    ctx.moveTo(maxXY.x, minXY.y)
    ctx.lineTo(maxXY.x, maxXY.y)

    ctx.moveTo(maxXY.x, maxXY.y)
    ctx.lineTo(minXY.x, maxXY.y)

    ctx.moveTo(minXY.x, maxXY.y)
    ctx.lineTo(minXY.x, minXY.y)
    ctx.stroke()
    ctx.draw(true)
  }
  ,
  ergodicEach_Action(point) {//遍历每一个绘制事件的点并返回与其最近的绘制事件。返回action索引数组，
    //point参数 为两个点的数组时为框选，起点终点
    let actions = this.data.drawBoard.actions
    let toolsStatus = this.data.drawBoard.toolsStatus
    var distance = 500//允许的偏差距离。
    var tempValue = 0
    var selectIndex = -1//找到被选择的action索引。
    var selectIndexs = []

    for (let a = 0; a < actions.length; a++) {
      const iAction = actions[a];
      switch (iAction.type) {
        case Action_type.line:
          const cgline = iAction.mode
          for (let i = 0; i < cgline.points.length; i++) {
            let ipoint = cgline.points[i]
            if (typeof(point.x)!= "undefined") {//点选
              tempValue = Math.pow(point.x - ipoint.x, 2) + Math.pow(point.y - cgline.ipoint.y, 2)
              // console.log(tempValue)
              if (tempValue < distance) {
                distance = tempValue
                selectIndex = a
                toolsStatus.addSelect(selectIndex)
              } else {
                // iAction.select = false
                // toolsStatus.deleteSelect(selectIndex)
              }
            }else{//框选
              maxXY = point[0].getJson()
              minXY = point[1].getJson()
              var condition = 0
              if(ipoint.x<maxXY.x && ipoint.x>minXY.x){

              }
              

            }
          }

          break

        case Action_type.shape:

          break
        case Action_type.image:

          break
        case Action_type.text:
          const cgText = iAction.mode

          break
      }

    }


    return selectIndex
  },
  loadDrawBoard() {
    this.data.drawBoard = null;//画布对象创建，不能直接在data创建。
    this.data.drawBoard = new DrawBoard();
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

  reloadDrawBoard() {

    let actions = this.data.drawBoard.actions
    let ctxb = wx.createCanvasContext(canvas_ID);
    let ctx = wx.createCanvasContext(canvas_ID);

    // ctx.draw()//清空画布内容。

    for (let a = 0; a < actions.length; a++) {//遍历每一个绘制事件
      const iAction = actions[a];

      switch (iAction.type) {
        case Action_type.line:
          const cgline = iAction.mode
          // if(cgline.points.length<3){//只有两个点时
          // this.draw_line_curve( cgline.points[1],cgline.points[0],null) 
          // }else{
          // }
          if (cgline.points.length > 2) {
            for (let i = 1; i < cgline.points.length; i++) {
              this.draw_line_curve(ctx, cgline.points[i], cgline.points[i - 1], cgline.points[i - 2])
            }
            ctx.stroke()
          }
          break

        case Action_type.shape:

          break
        case Action_type.image:

          break
        case Action_type.text:
          const cgText = iAction.mode
          this.draw_text(ctx, cgText)
          break
      }
      // if(iAction.select ){
      //     this.mouse_selectAction(iAction)
      // }
    }
    ctxb.draw()

    ctx.draw()//等到页面所有的路径都绘制完毕再显示到页面上。
    release(ctx, ctxb)
  },




  //--------页面加载事件------
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

  //------UI响应事件------
  changeStatus(e) {//画布工具栏点击事件
    let buttonId = e.currentTarget.id;
    let datas = this.data
    let ctx = wx.createCanvasContext("testCanvas");
    //让画布失去焦点。
    // this.compute_textInput({},true)

    switch (buttonId) {
      case "tools_pen":
        console.log("画笔开启");
        datas.toolsStatus.toolType = ToolsStatus_type.pen;
        datas.toolsStatus.nowStatus = 0;
        break;
      case "tools_eraser":
        console.log("橡皮开启");

        // ctx.clearRect(0, 0, datas.drawBoard.width, datas.drawBoard.height)
        ctx.draw()
        // this.loadDrawBoard();
        this.reloadDrawBoard()
        datas.toolsStatus.toolType = ToolsStatus_type.eraser;
        datas.toolsStatus.nowStatus = 0;
        break;
      case "tools_shape":
        console.log("矩形开启");
        datas.toolsStatus.toolType = ToolsStatus_type.shape;
        datas.toolsStatus.nowStatus = 0;
        break;
      case "tools_text":
        console.log("文字开启");

        datas.toolsStatus.toolType = ToolsStatus_type.text;
        datas.toolsStatus.nowStatus = 0;



        break;
      case "tools_select":
        console.log("选区开启");
        datas.toolsStatus.toolType = ToolsStatus_type.mouse;
        datas.toolsStatus.nowStatus = 0;
        // this.mouse_selectAction(this.data.drawBoard.getLastAction())
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


    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];

      toolsStatus.mouseActions.push(new MouseAction(new CGPoint(touch.x, touch.y)))
    }
    // toolsStatus.mouseActions.push()

    console.log("按下", thisPoint)
    switch (toolsStatus.toolType) {

      case ToolsStatus_type.pen:

        this.data.drawBoard.addAction(Action_type.line);//开始添加一次绘制事件
        let lsAction = this.data.drawBoard.getLastAction();//并且开始记录
        lsAction.lineWidth = 3
        lsAction.color = "black"
        lsAction.mode.addPoint(...thisPoint.getJsonArr())

        return

      case ToolsStatus_type.text:
        this.compute_textInput(thisPoint)
        return

      case ToolsStatus_type.mouse:


        let index = this.ergodicEach_Action(thisPoint)
        this.reloadDrawBoard()
        if (index != -1) {
          let action = this.data.drawBoard.getActionByindex(index)

          // if (action.select == true) {
          //   //已经被选中了，再按下。判断伸缩移动事件。

          //   let type = estimateForMouse(action.selectAttribute.points)
          //   switch(type){
          //     case 0:

          //     case 1:

          //     break
          //     case 2:
          //     case 3:

          //     default:

          //   }

          // } else {//之前为被选中。
          toolsStatus.select.selecting = true
          toolsStatus.addSelect(index)
          this.mouse_selectAction(action)
          // }


        } else {
          //点击空白地方，取消所有点的选中状态。
          toolsStatus.select.selecting = false
          toolsStatus.select.actionsIndex = null
          // toolsStatus.select.points=null
          // toolsStatus.select.points=new Array(4)
          toolsStatus.select.actionsIndex = []

        }

        return

      case ToolsStatus_type.eraser:
        return

      case ToolsStatus_type.shape:
        return

    }

  },

  canvas_touchmove(e) {

    let toolsStatus = this.data.toolsStatus

    let thisPoint = new CGPoint(e.touches[0].x, e.touches[0].y) //当前新的点，
    console.log(e)
    let mouseActions = toolsStatus.mouseActions
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      toolsStatus.mouseActions[i].endPoint = new CGPoint(touch.x, touch.y)
    }

    switch (toolsStatus.toolType) {
      case ToolsStatus_type.pen:
        //系统的运行逻辑：先加点再进行绘画。
        this.compute_line(thisPoint)

        return;
      case ToolsStatus_type.text:
        this.setData({
          "toolsStatus.keyBord.x": thisPoint.x,
          "toolsStatus.keyBord.y": thisPoint.y,
        })
        return

      case ToolsStatus_type.mouse:

        let index = this.ergodicEach_Action(thisPoint)
        this.reloadDrawBoard()

        this.mouse_selectAction([mouseActions[0].startPoint, mouseActions[0].endPoint], true)
        // if (index != -1) {
        //   let action = this.data.drawBoard.getActionByindex(index)

        //   // if (action.select == true) {
        //   //   //已经被选中了，再按下。判断伸缩移动事件。

        //   //   let type = estimateForMouse(action.selectAttribute.points)
        //   //   switch(type){
        //   //     case 0:

        //   //     case 1:

        //   //     break
        //   //     case 2:
        //   //     case 3:

        //   //     default:

        //   //   }

        //   // } else {//之前为被选中。
        //     toolsStatus.select.selecting = true
        //     toolsStatus.addSelect(index)
        //     this.mouse_selectAction(action)
        //   // }


        // } else {
        //   //点击空白地方，取消所有点的选中状态。
        //   toolsStatus.select.selecting = false
        //   toolsStatus.select.actionsIndex=null
        //   // toolsStatus.select.points=null
        //   // toolsStatus.select.points=new Array(4)
        //   toolsStatus.select.actionsIndex = []

        // }
        //  if (action.select == true) {
        //     //已经被选中了，再按下。判断伸缩移动事件。

        //     let type = estimateForMouse(action.selectAttribute.points)
        //     switch(type){
        //       case 0:

        //       case 1:

        //       break
        //       case 2:
        //       case 3:

        //       default:

        //     }

        //   } else {//之前为被选中。
        //     action.select = true
        //     this.mouse_selectAction(action)
        //   }
        return

      case ToolsStatus_type.eraser:
        return

      case ToolsStatus_type.shape:
        return

    }
  },

  canvas_touchend(e) {
    //触摸完毕，进行曲线调整。

    let toolsStatus = this.data.toolsStatus
    let lsAction = this.data.drawBoard.getLastAction()
    toolsStatus.mouseActions = []
    // toolsStatus.mouseActions = {}

    if (lsAction.type == Action_type.line) {
      if (lsAction.mode.points.length <= 2) {//小于两个点时，删除路径。
        this.data.drawBoard.actions.splice(lsAction.mode.points.length - 1, 1)
      }
    }
    // this.reloadDrawBoard()
    // let lsAction = datas.drawBoard.getLastAction()
    // lsAction.every(function(point){


    //   // console.log(this)
    // })


  },

  textFieldInput(e) {

    this.data.toolsStatus.keyBord.value = e.detail.value
  },
  textFieldInput_lostFocus(e) {//文字输入的失去焦点事件
    this.compute_textInput({}, true)

  }
  //-------响应事件写上面------

})