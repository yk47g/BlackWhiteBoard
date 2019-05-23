// Array.prototype.limiteIndex = function (index) {//防止越界，返回正确范围内的索引
//   if(index>this.length-1){
//     return this.length - 1
//   }
//   if(index<0){
//     return 0 
//   }
//   return index;
// }
let app = getApp()
let canvas_ID = "CanvasDisplay"
let ctx = wx.createCanvasContext(canvas_ID);

let DevelopConfiguration = {
    SelectCornerDistance: 60,//拉伸时与角点的距离。
    SelectRectPadding: 3,
    SimpleSelectDistance: 5,//进行其他单选时允许的偏差距离
    SelectDistance: 400,//单选曲线时允许的偏差距离
    imgDefaultShrinkProportion: 0.8//上传图片时超出大小，缩放到屏幕大小的比例
}
var drawBoard = {} //全局画布对象。绘制数据存放的地方。。


function release(...list) { //释放内存函数。
    for (let i = 0; i < list.length; i++) {
        delete list[i]
        list[i] = null
    }
}

// console.log(Object.assign({a:2,c:{point:[10]}},{b:3,c:{point:[20]}}))
class MouseAction { //用来记录手指移动距离等数据
    constructor(startPoint, touch) {
        this.distance = 0; //1️以像素的平方为单位
        this.startPoint = startPoint //cgpoint类型
        this.lastPoint = startPoint
        this.endPoint = startPoint
        this.time = 0
        this.identifier = touch.identifier
    }
    isExist(mouseActions) {
        for (let i = 0; i < mouseActions.length; i++) {
            const element = mouseActions[i];
            if (element.identifier == this.identifier) {
                return i
            }
        }
        return -1

    }
}


class Condition { //鼠标事件情况太多，故引入条件类。
    constructor() {
        this.valueArr = {} //将已经成立的Condition_Type条件直接声明为该对象的属性。
    }
    meet(...conditionList) { //判断当前对象下的 valueArr里的条件是否都满足，返回真。

        for (let i = 0; i < conditionList.length; i++) {
            const element = conditionList[i];
            if (typeof (this.valueArr[element]) == "undefined") {
                return false
            }
        }
        return true
    }

    addValue(condition_Type) {
        this.valueArr[condition_Type] = true
    }
    deleteValue(condition_Type) {
        delete this.valueArr[condition_Type]

    }
    deleteAll(indexValue) {
        this.valueArr = null
        this.valueArr = {}
    }
}

const Condition_Type = {
    touchDown_none: "touchDown_none", //按下空白地方
    touchDown_select: "touchDown_select", //按下 图层的内容区域
    touchDown_corner: "touchDown_Corner", //按下角点地方
    touchDown_center: "touchDown_center", //按下 角点以内的中心区域
    touchDown_towFinger: "touchDown_towFinger", //按下时两个手指
    twoFinger_farAway: "twoFinger_farAway", //两个手指远离
    twoFinger_sameDirect: "twoFinger_sameDirect", //两个手指远离
}

function isRectOverlap(mousePoints, rectPoints) //高效判断两个矩形是否相交。
{
    //mousePoints会进行坐标大小判断。
    //根据矩形相交的对立事件进行判断
    let r1 = { left: Math.min(mousePoints[0].x, mousePoints[1].x), right: Math.max(mousePoints[0].x, mousePoints[1].x), top: Math.min(mousePoints[0].y, mousePoints[1].y), bottom: Math.max(mousePoints[0].y, mousePoints[1].y) }
    let r2 = { left: rectPoints[0].x, right: rectPoints[1].x, top: rectPoints[0].y, bottom: rectPoints[1].y }

    return !(r1.left > r2.right || r1.top > r2.bottom || r2.left > r1.right || r2.top > r1.bottom)
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
        this.nowStatus = 0; //只有优先级,不对应类型。


        this.keyBord = {
            display: 0, //0不显示，1为显示
            x: -100,
            y: -100,
            value: "",
            focus: true,
            fontSize: 16
        };
        this.select = {
            selecting: false, //当前有焦点被选中。
            // points: new Array(4), //四个点顺时针，cgpoin类型 一个图层被选中时的矩形边框。
            actionsIndex: [],
            touchDown_actionIndex: -1//记录按下时，所选的index

        }
        this.mouseMoveType = -1
        this.mouseActions = [] //mouseAction 对象数组。
        this.condition = new Condition()
        this.modelFlexData = null
    }
    addSelect(indexValue) { //避免重复
        var exist = false
        let action = drawBoard.actions[indexValue]
        action.selectRect = action.getSelectRectObject()

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
    isSelect(indexValue) {
        for (let i = 0; i < this.select.actionsIndex.length; i++) {
            const element = this.select.actionsIndex[i];
            if (indexValue == element) {
                return true
            }
        }
        return false
    }
}
let ToolsStatus_type = { //当做枚举来用。
    pen: 0,
    mouse: 1,
    eraser: 2,
    image: 3,
    text: 4,
    color: 5
}
let Mouse_MoveType = { //移动的操作类型。
    none: 0,
    multipleSelecting: 1, //正在移动手指进行框选。
    model_move: 2,
    model_felx: 3,
    canvas_move: 4,
    canvas_flex: 5
}

function estimateForMouse(points) { //用以判断按下角点拉伸时的类型。返回离的最近的点的索引
    var distance = 100 //允许的偏差距离。
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
class Dom { //模拟dom操作取元素属性类
    constructor() {

    }
    getElementByString(str, callback) { //可以通过该属性获取元素当前的宽高等信息。str 值为css选择器名 ,注意为回调函数！
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
    constructor(backgroundColor = "", width = 0, height = 0) {
        this.actions = []; //画布的所有绘制路径事件  
        this.backgroundColor = backgroundColor; //默认背景颜色
        this.width = width;
        this.height = height;
    }
    initByJson(json) {//cgpoint 对象的json
        for (const key in this) {
            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {
                if (key == "actions") {
                    let actionsJson = json["actions"]
                    for (let i = 0; i < actionsJson.length; i++) {
                        this.addAction(actionsJson[i].type)
                        this.actions[i].initByJson(actionsJson[i])
                    }
                } else {
                    this[key] = json[key]
                }


            } else {
                console.log("属性不存在。")
            }
        }
        return this
    }
    addAction(type) {
        this.actions.push(new Action(type)); //添加一次绘制事件
        return this.getLastAction()
    }
    getLastAction(index = 0) { //支持返回倒数前几个点
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
class Action { //绘制事件类

    /**
     * Actiontype:
     * 0.曲线
     * 1.形状
     * 2.文字
     * 3.图片
     * */
    constructor(type, user = "unknow", time = "2019") {

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
        this.type = type; //对应toolsStatus备注
        this.user = user;
        this.time = time;

    }
    initByJson(json) {
        for (const key in this) {
            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {
                if (key == "mode") {
                    let modeJson = json["mode"]
                    switch (json["type"]) {
                        case Action_type.line:
                            this.mode = new CGLine().initByJson(modeJson)
                            break
                        case Action_type.shape:
                            this.mode = new CGShape().initByJson(modeJson)
                            break
                        case Action_type.image:
                            this.mode = new CGImage().initByJson(modeJson)
                            break
                        case Action_type.text:

                            this.mode = new CGText().initByJson(modeJson)
                            break
                    }


                } else {
                    this[key] = json[key]
                }


            } else {
                console.log("属性不存在。")
            }
        }
        return this
    }

    getSelectRectObject() {//返回 被点击后呈现出来的 选中框 矩形对象。。
        var maxXY = {
            x: -10000,
            y: -10000
        };
        var minXY = {
            x: 10000,
            y: 10000
        }
        let interval = DevelopConfiguration.SelectRectPadding//选择框与最值点的容差间隔。
        switch (this.type) {
            case Action_type.line:
                const cgline = this.mode
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
                const cgimg = this.mode
                minXY = cgimg.position.getJson()
                maxXY.x = minXY.x + cgimg.width
                maxXY.y = minXY.y + cgimg.height

                break
            case Action_type.text:
                const cgText = this.mode
                maxXY.x = cgText.position.x + ctx.measureText(cgText.text).width + 3
                maxXY.y = cgText.position.y + 4
                minXY.x = cgText.position.x - 3
                minXY.y = cgText.position.y - cgText.size * 0.7 - 4

                break
        }

        maxXY.x += interval
        maxXY.y += interval
        minXY.x -= interval
        minXY.y -= interval
        return new CGRect([new CGPoint(minXY.x, minXY.y), new CGPoint(maxXY.x, maxXY.y)])
    }

}

let Action_type = {
    line: 0,
    shape: 1,
    text: 2,
    image: 3
}


class CGPoint { //坐标点类

    constructor(x = 0, y = 0, toInt = false) {

        if (toInt == true) {
            this.x = parseInt(x)
            this.y = parseInt(y)
        } else {
            this.x = x;
            this.y = y;
        }

    }
    initByJson(json) {//cgpoint 对象的json
        for (const key in this) {

            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {

                this[key] = json[key]
            } else {
                console.log("属性不存在。")
            }
        }
        return this
    }
    getJsonArr() {

        return [this.x, this.y]
    }
    getJson() {
        const json = { x: this.x, y: this.y }
        return json
    }
    modelFlexInit(modelFlexData) {
        /** 
         * 为了渲染图层拉伸效果而做的方法。
         * proportion : 比例
         * relativeOriginPoint: 相对点。
         * */

        // relativeOriginPoint = drawBoard.getActionByindex(getCurrentPages()[0].data.toolsStatus.select.touchDown_actionIndex).relativeOriginPoint


        let temp = new CGPoint(
            (this.x - modelFlexData.relativeOriginPoint.x) * modelFlexData.width + modelFlexData.relativeOriginPoint.x,
            (this.y - modelFlexData.relativeOriginPoint.y) * modelFlexData.height + modelFlexData.relativeOriginPoint.y);
        return temp



    }
    isInclude(ULPoint, DRPoint, r) { //判读当前对象的点是否在这个矩形区域内
        //r表示容错半径
        let maxXY = {
            x: ULPoint.x > DRPoint.x ? ULPoint.x : DRPoint.x,
            y: ULPoint.y > DRPoint.y ? ULPoint.y : DRPoint.y
        }
        let minXY = {
            x: ULPoint.x < DRPoint.x ? ULPoint.x : DRPoint.x,
            y: ULPoint.y < DRPoint.y ? ULPoint.y : DRPoint.y
        }
        if (this.x > maxXY.x + r || this.x < minXY.x - r) {
            return false
        }
        if (this.y > maxXY.y + r || this.y < minXY.y - r) {
            return false
        }
        return true
    }
    isDistance(point, r) {
        //判断另一个点是否在当前对象点的半径内。
        let distance = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
        if (distance < r) {
            return true
        }
        return false
    }



}

class CGRect {//矩形类

    constructor(points) {//可传入两个或四个点以计算矩形的大小等属性。
        var tempPoints
        if (points.length == 2) {
            tempPoints = points
        } else if (points.length == 4) {
            tempPoints = [points[0], points[2]]
        } else {
            console.log("参数错误。")

        }

        this.points = tempPoints //cgrect的属性：恒定为两个点，形容一个cgrect位置大小。
        this.width = Math.abs(tempPoints[1].x - tempPoints[0].x)
        this.height = Math.abs(tempPoints[1].y - tempPoints[0].y)
    }

    getBorderRectParameter(index, r) {//获取一个矩形四个边 对应的矩形的参数，用以画布性能优化。返回数组，直接...使用
        switch (index) {
            case 0://上
                return [this.points[0].x - r, this.points[0].y - r, this.width + 2 * r, 2 * r]
            case 1://右
                return [this.points[1].x - r, this.points[0].y - r, 2 * r, this.height + 2 * r]
            case 2://下
                return [this.points[0].x - r, this.points[1].y - r, 2 * r, this.width + 2 * r, 2 * r]
            case 3://左
                return [this.points[0].x - r, this.points[0].y - r, 2 * r, this.height + 2 * r, 2 * r]

        }

    }

    getMin() {
        return {
            x: this.points[0].x,
            y: this.points[0].y
        }
    }
    getMax() {
        return {
            x: this.points[1].x,
            y: this.points[1].y
        }
    }
    getMinX() {
        return this.points[0].x
    }
    getMinY() {
        return this.points[0].y
    }
    getMaxY() {
        return this.points[1].y
    }
    getMaxX() {
        return this.points[1].x
    }
    getFourPoints() {
        return [new CGPoint(this.points[0].x, this.points[0].y)
            , new CGPoint(this.points[1].x, this.points[0].y)
            , new CGPoint(this.points[1].x, this.points[1].y)
            , new CGPoint(this.points[0].x, this.points[1].y)];

    }
}


class CGLine {
    constructor(lineWidth = 5, color = "black") {
        this.points = []; //CGPoint类型
        this.lineWidth = lineWidth;
        this.color = color;
    }
    initByJson(json) {//cgpoint 对象的json
        for (const key in this) {
            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {
                if (key == "points") {
                    let pointsJson = json["points"]
                    for (let i = 0; i < pointsJson.length; i++) {
                        this.addPoint(0, 0)
                        this.points[i].initByJson(pointsJson[i])
                    }
                } else {
                    this[key] = json[key]
                }


            } else {
                console.log("属性不存在。")
            }
        }
        return this
    }
    addPoint(x, y) {
        this.points.push(new CGPoint(x, y))
    }
    getLastPoint(index = 0) { //返回CGPoint , 支持返回倒数前几个点，默认为0最后一个
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

    every(compute) { //一个遍历函数，遍历当前路径下所有的点，参数为一个处理函数 
        for (let i = 0; i < this.points.length; i++) {
            const ipoint = this.points[i];
            compute(ipoint); //函数格式。参数为各个point点。
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
        this.width = 0;
        this.height = 0;
        this.owidth = 0;
        this.oheight = 0;
        this.path = "";

    }
}
class CGText {
    constructor(text = "", point = new CGPoint(0, 0), size = 16, color = "black", ) {
        this.text = text;
        this.size = size;
        this.color = color;
        this.position = point; //一个点起点  
    }
    initByJson(json) {//cgpoint 对象的json
        for (const key in this) {
            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {
                if (key == "position") {
                    let pointJson = json["position"]

                    this[key] = new CGPoint().initByJson(pointJson)

                } else {
                    this[key] = json[key]
                }


            } else {
                console.log("属性不存在。")
            }
        }
        return this
    }
}

class LocalStorage {//本地存储类
    constructor() {
        this.lastReadTime = "10:33"

    }

    read() {//读取函数
        let json = wx.getStorageSync("drawBoard")
        let page = getCurrentPages()[0]
        drawBoard = null;
        drawBoard = new DrawBoard();
        drawBoard.initByJson(json)
        page.reloadDrawBoard()
        console.log("已完成画布重载：", drawBoard)

    }
    save() {
        wx.setStorageSync("drawBoard", drawBoard)
    }

}


//以上为类，暂时还没移到文件外。

Page({

    /**
     * 页面的初始数据
     */
    data: {

        toolsStatus: {}, //工具选择状态
        exchange: 0,
        toolBarDetailindex: -1,//弹出的画笔调节窗口。
        runAM: false,
        scrollView: {
            ntop: 0,
            nleft: 0,
        },

        penConfiguration: {//默认的画笔配置。
            color: "red",
            shape: -1,
            lineDash: false,
            lineWidth: 3
        }
    },
    draw_line_curve(thisPoint, lsPoint, lssPoint, color = "red", width = 3) {
        //曲线优化
        //起点为： 上一个点和上上个点的中点
        //控制点为：上一个点
        //终点为：上一个点和当前点的中点


        // ctx = wx.createCanvasContext(canvas_ID);
        // ctx.beginPath()

        // ctx.setLineDash([0, 0]);
        // ctx.lineJoin = "round"
        // ctx.lineCap = "round"
        // ctx.lineWidth = width
        // ctx.fillStyle = color
        // ctx.strokeStyle = color

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
    draw_text(cgText) {
        ctx.fillStyle = cgText.color
        ctx.setFontSize(cgText.size);
        ctx.fillText(cgText.text, ...cgText.position.getJsonArr());
        // ctx.draw(true);
    },
    //draw 方法不会调用draw 显示，需要在外部调用。
    compute_textInput(thisPoint, disFocus = false) { //切换到文字工具-处理函数
        let datas = this.data
        let toolsStatus = datas.toolsStatus

        if (disFocus == true || toolsStatus.nowStatus != 0) {
            console.log('结束输入文字')

            let text = toolsStatus.keyBord.value

            if (text != "") {
                let size = 30
                let lsAction = (drawBoard.addAction(Action_type.text)).mode //为CGText
                lsAction.text = text
                lsAction.size = size
                lsAction.position = new CGPoint(toolsStatus.keyBord.x - 6, toolsStatus.keyBord.y + 9)

                this.draw_text(lsAction)
                ctx.draw(true);

            }

            toolsStatus.nowStatus = 0 //清空等待输入状态
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
    compute_line(thisPoint) { //只在手移动绘画时被调用。

        let datas = this.data
        let lsAction = drawBoard.getLastAction().mode //此处lsAction 类型为CGLine
        let lsPoint = lsAction.getLastPoint(); //上一个点
        let lssPoint = lsAction.getLastPoint(1); //上一个点

        lsAction.addPoint(...thisPoint.getJsonArr()) //把点加到数据库中。
        this.draw_line_curve(thisPoint, lsPoint, lssPoint)
        ctx.stroke()
        ctx.draw(true)

    },
    compute_mouse(thisPoint) {
        let action_index = 0



        let delAction = drawBoard.actions[action_index]
        let linewidth = delAction.lineWidth + 3
        // drawBoard.actions.splice(action_index,1);//删除第二次绘制事件

        ctx.fillStyle = 'red';

        delAction.every(function (point) {
            ctx.fillRect(point.x - linewidth / 2, point.y - linewidth / 2, linewidth, linewidth)
        })
        ctx.draw(true)

    },
    compute_eraser() {

    },
    mouse_selectAction(action, selecting = false) { //处理选区 按下事件时显示的选框
        //当selecting时，为多选。传入action为两个point，手指的起点和终点。


        let points = []//角点的特殊处理。


        // ctx.strokeStyle = "rgb(80,80,80)"//"rgb(190,235,248)"//"rgb(230,249,255)"
        // ctx.lineWidth = 2
        // ctx.fillStyle = "pink"//"rgb(32,222,147)"
        // ctx.setLineDash([3, 6]);
        var maxXY = {
            x: -10000,
            y: -10000
        };
        var minXY = {
            x: 10000,
            y: 10000
        }
        let pointSize = 6//角点的大小
        let pointSize_offset = pointSize / 2 //角点位置偏移量。
        if (selecting == false) {


            //开始绘制选框



            action.selectRect = action.getSelectRectObject()
            let rect = action.selectRect
            minXY = rect.getMin()
            maxXY = rect.getMax()

            //左上角开始顺时针。
            //这四个点为角点绘制。。


            points[0] = new CGPoint(minXY.x - pointSize_offset, minXY.y - pointSize_offset)
            points[1] = new CGPoint(maxXY.x - pointSize_offset, minXY.y - pointSize_offset)
            points[2] = new CGPoint(maxXY.x - pointSize_offset, maxXY.y - pointSize_offset)
            points[3] = new CGPoint(minXY.x - pointSize_offset, maxXY.y - pointSize_offset)

        } else {
            //当selecting时，传入action为两个point，手指的起点和终点。

            points = action
            minXY = points[0].getJson()
            maxXY = points[1].getJson()
        }


        ctx.beginPath()
        //绘制边线。
        ctx.moveTo(minXY.x, minXY.y)
        ctx.lineTo(maxXY.x, minXY.y)

        ctx.moveTo(maxXY.x, minXY.y)
        ctx.lineTo(maxXY.x, maxXY.y)

        ctx.moveTo(maxXY.x, maxXY.y)
        ctx.lineTo(minXY.x, maxXY.y)

        ctx.moveTo(minXY.x, maxXY.y)
        ctx.lineTo(minXY.x, minXY.y)


        if (selecting == false) {
            ctx.fillRect(...points[0].getJsonArr(), pointSize, pointSize)
            ctx.fillRect(...points[1].getJsonArr(), pointSize, pointSize)
            ctx.fillRect(...points[2].getJsonArr(), pointSize, pointSize)
            ctx.fillRect(...points[3].getJsonArr(), pointSize, pointSize)
            ctx.fill()

        }


        // ctx.stroke()
        // 
        // return  [minXY]
    },
    ergodicEach_Action(point) { //遍历每一个绘制事件的点并返回与其最近的绘制事件。返回与点最近的action的索引
        //point参数 为两个点的数组时为框选，起点终点，返回action索引数组，
        let actions = drawBoard.actions
        let toolsStatus = this.data.toolsStatus

        var distance = DevelopConfiguration.SelectDistance //允许的偏差距离。
        var tempValue = 0
        var selectIndex = -1 //找到被选择的action索引。
        var selectIndexs = []

        for (let a = 0; a < actions.length; a++) {
            const iAction = actions[a];
            switch (iAction.type) {
                case Action_type.line:
                    const cgline = iAction.mode
                    for (let i = 0; i < cgline.points.length; i++) {
                        let ipoint = cgline.points[i]

                        if (typeof (point.x) != "undefined") { //点选
                            tempValue = Math.pow(point.x - ipoint.x, 2) + Math.pow(point.y - ipoint.y, 2)
                            if (tempValue < distance) {
                                distance = tempValue
                                selectIndex = a
                            }
                        } else { //框选

                            if (ipoint.isInclude(point[0], point[1], 0)) {
                                toolsStatus.addSelect(a)
                            }
                        }
                    }

                    break

                case Action_type.shape:

                    break
                case Action_type.image:
                    const cgimg = iAction.mode
                    let DRPoint = new CGPoint(cgimg.position.x + cgimg.width, cgimg.position.y + cgimg.height)
                    if (typeof (point.x) != "undefined") { //点选


                        if (point.isInclude(cgimg.position, DRPoint, DevelopConfiguration.SimpleSelectDistance)) {
                            selectIndex = a
                        }
                    } else { //框选

                        if (isRectOverlap(point, [cgimg.position, DRPoint])) {
                            console.log("矩形相交")
                            toolsStatus.addSelect(a)
                        }
                    }

                    break
                case Action_type.text:

                    const cgText = iAction.mode
                    let textWidth = ctx.measureText(cgText.text).width
                    let startPoint = new CGPoint(cgText.position.x, cgText.position.y - cgText.size * 0.7 - 4)
                    let endPoint = new CGPoint(cgText.position.x + ctx.measureText(cgText.text).width, cgText.position.y + 4)
                    // console.log(textWidth)
                    // console.log(cgText.position)
                    if (typeof (point.x) != "undefined") { //点选
                        if (point.isInclude(startPoint, endPoint, DevelopConfiguration.SimpleSelectDistance)) {
                            selectIndex = a
                            // console.log("选中文字")
                        }
                    } else { //框选
                        //通过判断框的四个角点是否在区域内以实现高效判断

                        // let urPoint = new CGPoint(point[1].x,point[0].y)//右上角的点。
                        // let dlPoint = new CGPoint(point[0].x,point[1].y)//左下角的点。
                        if (isRectOverlap(point, [startPoint, endPoint])) {
                            console.log("矩形相交")
                            toolsStatus.addSelect(a)
                        }
                    }


                    break
            }

        }
        if (typeof (point.x) != "undefined") {
            return selectIndex
        } else {
            return toolsStatus.select.actionsIndex
        }


    },

    reloadDrawBoard() {

        var time = Date.now()
        let actions = drawBoard.actions
        let toolsStatus = this.data.toolsStatus
        // var ctx, ctxb
        // if (canvas_ID != "CanvasMemory") {
        //     // canvas_ID = "CanvasDisplay"
        //     // ctxb = wx.createCanvasContext("CanvasMemory");
        ctx = wx.createCanvasContext(canvas_ID); //即将要显示的canvas
        // } else {
        //     //   canvas_ID = "CanvasMemory"
        //     //   ctxb = wx.createCanvasContext("CanvasDisplay");
        //     //  ctx = wx.createCanvasContext(canvas_ID);
        // }


        // ctx.draw()//清空画布内容。
        // time = Date.now()


        // 先绘制全部曲线。
        ctx.save()
        ctx.save()
        ctx.save()
        ctx.save()//保存最开始的样式
        // ctx.setLineDash([0, 0]);
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        for (let a = 0; a < actions.length; a++) {
            const iAction = actions[a];
            switch (iAction.type) {
                case Action_type.line:
                    ctx.beginPath()
                    const cgline = iAction.mode
                    ctx.lineWidth = cgline.lineWidth
                    ctx.strokeStyle = cgline.color



                    //进行临时的图层拉伸展示。
                    if (toolsStatus.mouseMoveType == Mouse_MoveType.model_felx) {
                        for (let i = 2; i < cgline.points.length; i++) {
                            if (toolsStatus.isSelect(a)) {
                                let thisPoint = cgline.points[i].modelFlexInit(toolsStatus.modelFlexData)
                                let lsPoint = cgline.points[i - 1].modelFlexInit(toolsStatus.modelFlexData)
                                let lssPoint = cgline.points[i - 2].modelFlexInit(toolsStatus.modelFlexData)
                                this.draw_line_curve(thisPoint, lsPoint, lssPoint)
                            } else {
                                this.draw_line_curve(cgline.points[i], cgline.points[i - 1], cgline.points[i - 2])
                            }
                        }
                    } else {
                        for (let i = 2; i < cgline.points.length; i++) {
                            this.draw_line_curve(cgline.points[i], cgline.points[i - 1], cgline.points[i - 2])
                        }
                    }
                    ctx.closePath()
                    ctx.stroke()

                    break
            }
        }

        

        // 再绘制形状。
        for (let a = 0; a < actions.length; a++) {
            const iAction = actions[a];
            switch (iAction.type) {
                case Action_type.shape:
                    break
            }
        }
       
        // 再绘制文字。
        for (let a = 0; a < actions.length; a++) {
            const iAction = actions[a];
            switch (iAction.type) {
                case Action_type.text:
                    const cgText = iAction.mode
                    this.draw_text(cgText)
                    break
            }

        }
        

        // 再绘制图片。
        for (let a = 0; a < actions.length; a++) { //遍历每一个绘制事件
            const iAction = actions[a];
            switch (iAction.type) {
                case Action_type.image:
                    const cgimg = iAction.mode
                    ctx.drawImage(cgimg.path, 0, 0, cgimg.owidth, cgimg.oheight, ...cgimg.position.getJsonArr(), cgimg.width, cgimg.height)
                    break

            }

        }
        
        // console.log("遍历所有路径所需时间：", Date.now() - time)
        if (toolsStatus.select.selecting == true && toolsStatus.mouseMoveType != Mouse_MoveType.model_felx) {
            ctx.beginPath()
            ctx.strokeStyle = "rgb(80,80,80)"//"rgb(190,235,248)"//"rgb(230,249,255)"
            ctx.lineWidth = 2
            ctx.fillStyle = "pink"//"rgb(32,222,147)"
            ctx.setLineDash([3, 6]);
            for (let a = 0; a < actions.length; a++) { //遍历每一个绘制事件
                const iAction = actions[a];

                if (toolsStatus.isSelect(a)) {


                    this.mouse_selectAction(iAction)

                    ctx.stroke()
                    // ctx.rect(clipPoints[0].x-5,clipPoints[0].y-5 ,clipPoints[1].x+5,10)//up
                    // ctx.rect(clipPoints[3].x-5,clipPoints[3].y-5 ,clipPoints[2].x+5,10)//bottom
                    // ctx.rect(clipPoints[0].x-5,clipPoints[0].y-5 ,10,clipPoints[3].y+5)//left
                    // ctx.rect(clipPoints[1].x-5,clipPoints[1].y-5 ,10,clipPoints[2].y+5)//right
                    // ctx.clip()


                }
            }
        }

        ctx.draw(false, () => {

            if (this.data.toolsStatus.mouseMoveType == Mouse_MoveType.model_move) {
                this.reloadDrawBoard()
            }
        })
       
        //避免错误，在后面再画选框

        // if (toolsStatus.select.selecting == true) {
        //   ctx.restore()
        // }

        // ctx.draw()//等到页面所有的路径都绘制完毕再显示到页面上。
        // this.setData({
        //   exchange:!this.data.exchange
        // })
        // ctxb.draw()

        // console.log("reload结束",Date.now())
    },
    loadDrawBoard() {
        (new Dom()).getElementByString(".drawCanvas", (res) => {
            drawBoard.width = res[0].width
            drawBoard.height = res[0].height
        })
        drawBoard = null; //画布对象创建，不能直接在data创建。
        drawBoard = new DrawBoard();
        this.data.toolsStatus = new ToolsStatus();
        // console.log(this.data.toolsStatus)
        let storage = new LocalStorage()
        storage.read()

        this.setData({
            'toolsStatus.keyBord.display': 0
        })

    },
    compute_scrollGesture(finger1_Offest, finger2_Offest, ismove) {
        if (ismove) {

            let nX = -(finger1_Offest.x + finger2_Offest.x) / 2 + this.data.scrollView.nleft
            let nY = -(finger1_Offest.y + finger2_Offest.y) / 2 + this.data.scrollView.ntop
            nX = parseInt(nX > 0 ? nX : 0)
            nY = parseInt(nY > 0 ? nY : 0)
            this.data.scrollView.ntop = nY
            this.data.scrollView.nleft = nX
            // console.log("x=",nX," y=",nY)
            this.setData({
                "scrollView.ntop": nY,
                "scrollView.nleft": nX
            })

        } else {
            console.log("拉伸画布")
        }
    },
    compute_completeModelFlex(action, modelFlexData) {
        //拖动时的呈现都是临时的，并不会实时修改内存中点的数据。
        //松手后调用了这里才是完成拉伸路径数据的更新。          

        switch (action.type) {
            case Action_type.line:
                const cgline = action.mode
                cgline.every(function (point) {
                    point.x = (point.x - modelFlexData.relativeOriginPoint.x) * modelFlexData.width + modelFlexData.relativeOriginPoint.x
                    point.y = (point.y - modelFlexData.relativeOriginPoint.y) * modelFlexData.height + modelFlexData.relativeOriginPoint.y

                })
                break
            case Action_type.shape:
                break
            case Action_type.image:
                break
            case Action_type.text:
                const cgText = action.mode
                cgText.size *= ratioX
                break
        }

    },
    reset_status(toolType = 0) {//重置工具状态


    },
    //-------以上为画布动作的处理事件-----



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
    changeStatus(e) { //画布工具栏点击事件
        let buttonId = e.currentTarget.id;
        let datas = this.data

        //让画布失去焦点。
        // this.compute_textInput({},true)

        switch (buttonId) {
            case "tools_pen":
                console.log("画笔开启");



                // let animation = wx.createAnimation({
                //     duration: 3000,
                //     timingFunction: "ease-in-out"
                // }
                // )

                // animation.translate(100, -100);
                // animation.step()
                if (this.data.runAM == false) {
                    this.setData({
                        toolBarDetailindex: 0,
                    })
                    setTimeout(function () {
                        this.setData({
                            runAM: true
                        })
                        console.log("开始打开动画", this.data.runAM)
                    }.bind(this), 30);
                }



                datas.toolsStatus.toolType = ToolsStatus_type.pen;
                datas.toolsStatus.nowStatus = 0;

                break;
            case "tools_eraser":
                console.log("橡皮开启");

                // ctx.draw()
                // this.reloadDrawBoard()
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
                // this.mouse_selectAction(drawBoard.getLastAction())
                break;
            case "tools_addImage":

                let that = this
                datas.toolsStatus.toolType = ToolsStatus_type.image;
                wx.chooseImage({
                    success(res) {
                        const imgPath = res.tempFilePaths[0] // tempFilePaths 的每一项是一个本地临时文件路径
                        console.log(imgPath)
                        wx.getImageInfo({
                            src: imgPath,
                            success: function (res) {
                                let systeminfo = app.globalData.systemInfo

                                drawBoard.addAction(Action_type.image)
                                let cgimg = drawBoard.getLastAction().mode
                                cgimg.owidth = res.width//保存原始大小
                                cgimg.oheight = res.height
                                cgimg.width = res.width//用以拉伸后的大小。
                                cgimg.height = res.height

                                let beyondWidth = cgimg.owidth - systeminfo.windowWidth
                                let beyondHeigth = cgimg.oheight - systeminfo.windowHeight
                                if (beyondWidth > 0 || beyondHeigth > 0) {
                                    if (beyondWidth > beyondHeigth) {
                                        cgimg.width = systeminfo.windowWidth * DevelopConfiguration.imgDefaultShrinkProportion
                                        cgimg.height *= (cgimg.width / cgimg.owidth)

                                    } else {
                                        cgimg.height = systeminfo.windowHeight * DevelopConfiguration.imgDefaultShrinkProportion
                                        cgimg.width *= (cgimg.height / cgimg.oheight)
                                    }
                                }

                                cgimg.path = res.path


                                cgimg.position = new CGPoint((systeminfo.windowWidth - cgimg.width) / 2 + that.data.scrollView.nleft, (systeminfo.windowHeight - cgimg.height) / 2 + that.data.scrollView.ntop)

                                console.log(cgimg)
                                that.reloadDrawBoard()
                            }
                        })
                    }
                })

                // this.mouse_selectAction(drawBoard.getLastAction())
                break;
            case "tools_pigment":
                console.log("颜料点击");
                let time = Date.now()
                for (let i = 0; i < 1; i++) {

                    this.reloadDrawBoard()
                }
                console.log("1 次所需时间", Date.now() - time)

                // ctx.draw(t,function(e){
                //   console.log(3,e)
                // })
                try {
                    wx.setStorageSync("actions", drawBoard.actions)
                    // console.log(wx.getStorageSync("actions").getLastAction)
                } catch (e) {

                }

                break;

            case "tools_debug":
                let storage = new LocalStorage()
                storage.save()
                storage.read()



                break;
        }


    },

    canvas_errOutput(e) {
        console.log("画布发生错误", e)

    },
    canvas_touchstart(e) {

        let datas = this.data
        let toolsStatus = datas.toolsStatus
        let touches = e.touches
        let thisPoint = new CGPoint(touches[0].x, touches[0].y)
        console.log("按下", thisPoint)

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            let mouseAction = new MouseAction(new CGPoint(touch.x, touch.y), touch)
            let isExistIndex = mouseAction.isExist(toolsStatus.mouseActions)

            if (isExistIndex == -1) {
                toolsStatus.mouseActions.push(mouseAction)
            } else {
                toolsStatus.mouseActions[isExistIndex] = mouseAction
            }


        }

        // toolsStatus.mouseActions.push()

        switch (toolsStatus.toolType) {

            case ToolsStatus_type.pen:

                drawBoard.addAction(Action_type.line); //开始添加一次绘制事件

                ctx.lineWidth = datas.penConfiguration.lineWidth
                ctx.strokeStyle = datas.penConfiguration.color
                ctx.lineJoin = "round"
                ctx.lineCap = "round"

                let lsAction = drawBoard.getLastAction().mode; //并且开始记录
                lsAction.lineWidth = datas.penConfiguration.lineWidth
                lsAction.color = datas.penConfiguration.color
                lsAction.addPoint(...thisPoint.getJsonArr())

                return

            case ToolsStatus_type.text:
                this.compute_textInput(thisPoint)
                return

            case ToolsStatus_type.mouse:

                let condition = toolsStatus.condition
                let select = toolsStatus.select
                if (select.selecting == true) {//已经有图层被选中。
                    //判断是否为按下角点
                    var cornerPointIndex = -1;

                    for (let i = 0; i < select.actionsIndex.length; i++) {
                        //遍历获取每一个action的矩形选择区域。！！
                        const actionindex = select.actionsIndex[i];
                        let showRect = drawBoard.getActionByindex(actionindex).selectRect

                        rectpoints = showRect.getFourPoints()

                        for (let a = 0; a < 4; a++) {
                            const point = rectpoints[a];
                            if (point.isDistance(thisPoint, DevelopConfiguration.SelectCornerDistance)) {
                                cornerPointIndex = a
                                this.modelFlex_cornerIndex = a//设置为全局变量传输。
                            }
                        }

                        if (cornerPointIndex != -1) {
                            //判断是否拉伸图层。
                            condition.addValue(Condition_Type.touchDown_corner)
                            toolsStatus.mouseMoveType = Mouse_MoveType.model_felx
                            //为拉伸的图层添加当前原宽高度属性。
                            toolsStatus.select.touchDown_actionIndex = select.actionsIndex[i]
                            let actionsIndex = toolsStatus.select.actionsIndex
                            for (let a = 0; a < actionsIndex.length; a++) {

                                let action = drawBoard.getActionByindex(actionsIndex[a]);
                                action.oRect = action.getSelectRectObject()
                                console.log(action)
                            }
                            return;
                        }

                        // if (condition.meet(Condition_Type.touchDown_select)) {}

                        //判断是否在选框区域内，是则下一步为移动图层。
                        if (thisPoint.isInclude(rectpoints[0], rectpoints[2], 0)) {
                            // condition.meet(Condition_Type.touchDown_select)
                            //当前按下在选中图层中。
                            condition.addValue(Condition_Type.touchDown_center)

                            // if (toolsStatus.mouseMoveType != Mouse_MoveType.model_move) {}
                            toolsStatus.mouseMoveType = Mouse_MoveType.model_move //状态：图层移动
                            this.reloadDrawBoard()//开启持续刷新图层样式。
                            return
                        }

                    }






                }


                let index = this.ergodicEach_Action(thisPoint)

                if (index != -1) {//当前操作为选中一个图层。
                    // ctx = wx.createCanvasContext(canvas_ID);
                    let action = drawBoard.getActionByindex(index)
                    toolsStatus.select.selecting = true
                    toolsStatus.select.touchDown_actionIndex = index

                    toolsStatus.addSelect(index)//必须先执行。
                    this.mouse_selectAction(action)//绘制选中的边框样式，并设置action的属性selectRect为rect对象。
                    ctx.stroke()
                    ctx.draw(true)
                    toolsStatus.mouseMoveType = Mouse_MoveType.model_move
                    condition.addValue(Condition_Type.touchDown_select)
                    condition.addValue(Condition_Type.touchDown_center)

                    this.reloadDrawBoard()//开启持续刷新图层样式。

                } else {


                    //点击空白地方，取消所有点的选中状态。
                    condition.deleteAll()
                    condition.addValue(Condition_Type.touchDown_none)

                    toolsStatus.mouseMoveType = Mouse_MoveType.none
                    toolsStatus.select.actionsIndex = null
                    toolsStatus.select.actionsIndex = []
                    toolsStatus.select.touchDown_actionIndex = -1
                    toolsStatus.select.selecting = false
                    this.reloadDrawBoard()





                }



                return
            case ToolsStatus_type.shape:
                return
            case ToolsStatus_type.eraser:
                if (toolsStatus.toolType == ToolsStatus_type.eraser) { //橡皮
                    //删除绘制事件。
                    let index = this.ergodicEach_Action(thisPoint)
                    if (index != -1) {
                        drawBoard.actions.splice(index, 1)

                        this.reloadDrawBoard()
                    }

                    return
                }
                return
        }

    },

    canvas_touchmove(e) {

        let toolsStatus = this.data.toolsStatus
        let touches = e.touches
        let thisPoint = new CGPoint(touches[0].x, touches[0].y) //当前新的点，

        let mouseActions = toolsStatus.mouseActions
        let condition = toolsStatus.condition

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            mouseActions[i].lastPoint = mouseActions[i].endPoint
            mouseActions[i].endPoint = new CGPoint(touch.x, touch.y)

        }

        //先进行全局的两指操作判断。
        if (touches.length == 2) {
            //计算两个手指xy偏差，是否趋近于一样
            let finger1_Offest = { x: mouseActions[0].endPoint.x - mouseActions[0].lastPoint.x, y: mouseActions[0].endPoint.y - mouseActions[0].lastPoint.y }
            let finger2_Offest = { x: mouseActions[1].endPoint.x - mouseActions[1].lastPoint.x, y: mouseActions[1].endPoint.y - mouseActions[1].lastPoint.y }

            console.log("手指1", finger1_Offest, "手指2", finger2_Offest)
            //移动时，手指偏差值 乘积为正数

            this.compute_scrollGesture(finger1_Offest, finger2_Offest, true)

            return
            if ((Math.abs(finger1_Offest.x) + Math.abs(finger1_Offest.y) + Math.abs(finger2_Offest.x) + Math.abs(finger2_Offest.y)) > 0.8) {
                if (finger1_Offest.x * finger2_Offest.x >= 0 || finger1_Offest.y * finger2_Offest.y >= 0) {


                    if ((finger1_Offest.x == 0 && finger1_Offest.x == finger1_Offest.y) || (finger2_Offest.x == 0 && finger2_Offest.x == finger2_Offest.y)) {
                        //拉伸。
                        this.compute_scrollGesture(finger1_Offest, finger2_Offest, false)
                    } else {
                        //移动


                    }
                } else {
                    //拉伸。
                    this.compute_scrollGesture(finger1_Offest, finger2_Offest, false)
                }
            }

            return
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


            case ToolsStatus_type.eraser:

                //添加事件条件， 为后面的事件类型做判断。

                //删除绘制事件。
                let selectindex = this.ergodicEach_Action(thisPoint) //获取与手指最近的绘制事件
                if (selectindex != -1) {
                    drawBoard.actions.splice(selectindex, 1)
                    // ctx.clip()
                    this.reloadDrawBoard()
                    console.log("删除")

                }
                return


            case ToolsStatus_type.mouse:
                if (condition.meet(Condition_Type.touchDown_none)) {
                    toolsStatus.mouseMoveType = Mouse_MoveType.multipleSelecting
                    this.reloadDrawBoard()
                    //状态：进行多选
                }



                switch (toolsStatus.mouseMoveType) {
                    case Mouse_MoveType.simpleSelect:
                    case Mouse_MoveType.model_move:

                        var lastPoint = toolsStatus.mouseActions[0].lastPoint
                        var endPoint = toolsStatus.mouseActions[0].endPoint
                        var [OffestX, OffestY] = [endPoint.x - lastPoint.x, endPoint.y - lastPoint.y]
                        var actions = drawBoard.actions
                        for (let i = 0; i < actions.length; i++) {
                            const iAction = actions[i];
                            if (toolsStatus.isSelect(i)) {
                                switch (iAction.type) {
                                    case Action_type.line:
                                        const cgline = iAction.mode
                                        cgline.every(function (point) {
                                            point.x += OffestX
                                            point.y += OffestY
                                        })
                                        let time = Date.now()
                                        // this.reloadDrawBoard()
                                        // console.log("完成一次移动所需时间：", Date.now() - time)
                                        break
                                    case Action_type.shape:
                                        break
                                    case Action_type.image:
                                        const cgimg = iAction.mode
                                        cgimg.position.x += OffestX
                                        cgimg.position.y += OffestY
                                        break
                                    case Action_type.text:
                                        const cgText = iAction.mode
                                        cgText.position.x += OffestX
                                        cgText.position.y += OffestY
                                        break
                                }
                            }

                        }
                        return


                    case Mouse_MoveType.multipleSelecting:
                        //多选的触发条件：按下空白地方、继续移动


                        this.mouse_selectAction([mouseActions[0].startPoint, mouseActions[0].endPoint], true)


                        ctx.stroke()
                        ctx.draw(true)
                        break;
                    case Mouse_MoveType.model_felx:


                        /**
                         * 先通过正在选中拉伸的图层计算出全局拉伸比例。
                         * 再遍历所有选中的对象，按这个比例进行拉伸。
                         */

                        let actionsIndex = toolsStatus.select.actionsIndex
                        //按下的是哪个角点。

                        let controlAction = drawBoard.getActionByindex(toolsStatus.select.touchDown_actionIndex);
                        let cornerIndex = this.modelFlex_cornerIndex
                        let orignPointIndex = cornerIndex >= 2 ? (this.modelFlex_cornerIndex - 2) : (this.modelFlex_cornerIndex + 2)
                        // console.log("原点：", orignPointIndex, "按下的是:", cornerIndex)


                        var startPoint = toolsStatus.mouseActions[0].startPoint
                        var endPoint = toolsStatus.mouseActions[0].endPoint
                        var [OffestX, OffestY] = [endPoint.x - startPoint.x, endPoint.y - startPoint.y]//鼠标的偏移量
                        let oRect = controlAction.oRect
                        var nRect
                        switch (cornerIndex) {//按的是左上角。
                            case 0:
                                nRect = {
                                    width: oRect.width - OffestX,
                                    height: oRect.height - OffestY
                                }
                                break;
                            case 1:
                                nRect = {
                                    width: oRect.width + OffestX,
                                    height: oRect.height - OffestY
                                }
                                break;
                            case 2:
                                nRect = {
                                    width: oRect.width + OffestX,
                                    height: oRect.height + OffestY
                                }
                                break;
                            case 3:
                                nRect = {
                                    width: oRect.width - OffestX,
                                    height: oRect.height + OffestY
                                }
                                break;

                        }


                        let [ratioW, ratioH] = [nRect.width / oRect.width, nRect.height / oRect.height]
                        toolsStatus.modelFlexData = {
                            width: ratioW,
                            height: ratioH,
                            relativeOriginPoint: controlAction.selectRect.getFourPoints()[orignPointIndex]//按下哪个角点，正对角线另一侧的点。
                        }
                        this.reloadDrawBoard()
                        break

                }

                return



            case ToolsStatus_type.shape:
                return

        }
    },

    canvas_touchend(e) {
        //触摸完毕，进行曲线调整。

        let toolsStatus = this.data.toolsStatus

        let condition = toolsStatus.condition

        // toolsStatus.mouseActions = {}

        let touches = e.touches
        switch (toolsStatus.toolType) {
            case ToolsStatus_type.mouse:

                switch (toolsStatus.mouseMoveType) {
                    case Mouse_MoveType.multipleSelecting:
                        let indexs = this.ergodicEach_Action([toolsStatus.mouseActions[0].startPoint, toolsStatus.mouseActions[0].endPoint])
                        if (indexs.length > 0) {
                            console.log("选中" + indexs.length + "个图层 ")
                            // toolsStatus.select.selecting = true
                        }

                        toolsStatus.select.selecting = true

                        this.reloadDrawBoard()
                        break;
                    case Mouse_MoveType.model_move:
                        toolsStatus.mouseMoveType = Mouse_MoveType.none
                        break;
                    case Mouse_MoveType.model_felx:
                        let actionsIndex = toolsStatus.select.actionsIndex

                        for (let i = 0; i < actionsIndex.length; i++) {
                            let action = drawBoard.getActionByindex(actionsIndex[i]);
                            this.compute_completeModelFlex(action, toolsStatus.modelFlexData)

                            //删除临时添加的orect属性
                            delete action.oRect

                        }
                        toolsStatus.modelFlexData = null;

                        toolsStatus.mouseMoveType = Mouse_MoveType.none
                        this.reloadDrawBoard()
                        break;
                    default:
                        break;
                }


                break

            case ToolsStatus_type.pen:
                let lsAction = drawBoard.getLastAction()
                if (lsAction.type == Action_type.line) {
                    if (lsAction.mode.points.length <= 2) { //小于两个点时，删除路径。
                        console.log("路径过短，删除。", drawBoard)

                        drawBoard.actions.splice(drawBoard.actions.length - 1, 1)
                    }
                }
                break
        }
        //清空鼠标事件和本次条件
        condition.deleteAll()

        toolsStatus.mouseActions = []
        // let lsAction = drawBoard.getLastAction()
        // lsAction.every(function(point){


        // })


    },

    textFieldInput(e) {

        this.data.toolsStatus.keyBord.value = e.detail.value
    },
    textFieldInput_lostFocus(e) { //文字输入的失去焦点事件
        this.compute_textInput({}, true)

    },
    button_longpress(e) {
        console.log(e)
    },
    closeDeatilPane(e) {
        if (this.data.runAM == true) {

            this.setData({
                runAM: false
            })
            console.log("正在关闭动画", this.data.runAM)
            setTimeout(function () {
                this.setData({
                    toolBarDetailindex: -1
                })

            }.bind(this), 800);
        }

    },

    button_settings() {
        console.log("点击了设置按钮");
        wx.navigateTo(
            {
                url: '/pages/settings/settings'
            }
        )
    }
    //-------响应事件写上面------
})
