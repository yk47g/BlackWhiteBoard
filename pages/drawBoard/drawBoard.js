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
ctx.lineJoin = "round"
ctx.lineCap = "round"
ctx.save()
let DevelopConfiguration = {
    SelectCornerDistance: 70,//拉伸时与角点的距离。
    SelectRectPadding: 3,
    SimpleSelectDistance: 5,//进行其他单选时允许的偏差距离
    SelectDistance: 400,//单选曲线时允许的偏差距离
    imgDefaultShrinkProportion: 0.8,//上传图片时超出大小，缩放到屏幕大小的比例
    SelectRectStyle: {
        color: "rgb(80,80,80)",
        lineWidth: 2,
        cornerPointColor: "pink"
    },
    lineDashData: [3, 5],
    sameTimeTouchInterval: 40

}
console.log(typeof({}))
var drawBoard = {} //全局画布对象。绘制数据存放的地方。。
var websocket = require('../..//utils/websocket.js');//加载通信库
var utils = require('../..//utils/util.js');//加载插件库
var url = "https://pykky.com/wechatbwb/BlackWhiteBoard.php";//请求地址

//发送数据函数 传入一个data数据参数即可，将发送给服务器data，data时间，用户id，房间id
function send(data) {
    //websocket.send('{ "content": "' + this.data.drawBoardData + '", "date": "' + utils.formatTime(new Date()) + '","type":"text", "nickName": "' + this.data.userInfo.nickName + '", "avatarUrl": "' + this.data.userInfo.avatarUrl + '" }')
    data = JSON.stringify(data);
    websocket.send('{ "data": [' + data + '], "date": "' + utils.formatTime(new Date()) + '", "id": "' + app.globalData.userInfo.id + '", "roomID": "' + app.globalData.userInfo.roomID + '" }');

}
function getTimestamp() {
    //获取时间戳作为数据的唯一标识
    // return "/aa1"
    return String((new Date()).valueOf());
}

//上传文件函数 传入本地文件路径参数即可，成功回调返回网络地址
function saveToFIle(path) {
    var p = new Promise(function (resolve, reject) {

        // wx.compressImage({
        //     src: path,
        //     quality: 80,
        //     success: function (res) {
        //         let imgPath = res.tempFilePath

                let imgPath = path
                wx.uploadFile({
                    url: url,
                    filePath: imgPath,
                    name: 'image',
                    formData: {
                        'session': app.globalData.session
                    },
                    success: function (res) {
                        if (res.statusCode === 200) {//上传成功
                            // that._tempImgPath = res.data;//拿到的地址
                            imageUrl = res.data


                            resolve(imageUrl)//执行成功回传

                        } else {
                            reject(e)
                        }
                    }
                });
        //     },
        //     fail: function (e) {
        //         console.log(e)
        //         reject(e)
        //     }
        // })
    })
    return p
}
function downloadFile(path) {
    var p = new Promise(function (resolve, reject) {
        wx.downloadFile({
            url: path,
            success: function (res) {
                console.log("下载文件状态：" + res.statusCode)
                resolve(res)
            },
            fail: function (res) {
                reject(res)
            }
        })

    })
    return p
}

function rpx(number) {//传入rpx值，转化为px
    // 规定任意屏幕的大小均为750rpx
    let systeminfo = app.globalData.systemInfo
    return (systeminfo.windowWidth / 750) * number
}

//拿用户头像函数  传入用户id参数，返回用户头像地址
function joinUserIconByID(id) {
    let that = getCurrentPages()[0]
    let data = that.data
    wx.request({
        url: url,
        data: {
            "id": id,
        },
        success: function (res) {
            if (res.statusCode == 200) {
                if (res.data.statusCode == 0) {


                    if (typeof (data.userOnlineInfo[id]) == "undefined") {
                        let user = new UserInfo()
                        user.iconUrl = res.data.data;
                        data.userOnlineInfo[id] = user
                        data.userOnlineIdArray.unshift(id)
                        data.userOnlineIcon.unshift(res.data.data)

                        // let key = 'userOnlineInfo[' + String(id) +'][iconUrl]'
                        that.setData({

                            userOnlineIdArray: data.userOnlineIdArray,
                            userOnlineIcon: data.userOnlineIcon

                        })
                    }

                } else {
                    console.log(res.data.errMsg);
                }
            }
            else {
                console.log(res.errMsg);
            }
        },//request.success
        fail: function (e) {
            console.log("request.fail:", e);
        }//request.fail
    });//request
}

function release(...list) { //释放内存函数。
    for (let i = 0; i < list.length; i++) {
        delete list[i]
        list[i] = null
    }
}


// console.log(Object.assign({a:2,c:{point:[10]}},{b:3,c:{point:[20]}}))
class MouseAction { //用来记录手指移动距离等数据
    constructor(startPoint, touch, time) {

        this.startPoint = startPoint //cgpoint类型
        this.lastPoint = startPoint
        this.endPoint = startPoint
        this.time = time
        this.identifier = touch.identifier
    }
    isExist(mouseActions) {//判断当前对象的identifier 是否存在于里面。
        for (let i = 0; i < mouseActions.length; i++) {
            const element = mouseActions[i];
            if (element.identifier == this.identifier) {
                return i
            }
        }
        return -1

    }
    isSameTimeTouch(mouseAction) {
        console.log(this, mouseAction)
        let interval = Math.abs(this.time - mouseAction.time)
        if (interval < DevelopConfiguration.sameTimeTouchInterval) {//判断是否同时按下的间隔。
            return true
        }
        return false
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
    twoFinger_gesture: "twoFinger_gesture", //手势移动拉伸画布
    twoFinger_sameTimeTouchDown: "twoFinger_sameTimeTouchDown",
    exist_oneFingerTouch: "exist_oneFingerTouch"

}

function isRectOverlap(mousePoints, rectPoints) //高效判断两个矩形是否相交。
{
    //mousePoints会进行坐标大小判断。
    //根据矩形相交的对立事件进行判断

    let r1 = { left: Math.min(mousePoints[0].x, mousePoints[1].x), right: Math.max(mousePoints[0].x, mousePoints[1].x), top: Math.min(mousePoints[0].y, mousePoints[1].y), bottom: Math.max(mousePoints[0].y, mousePoints[1].y) }
    let r2 = { left: Math.min(rectPoints[0].x, rectPoints[1].x), right: Math.max(rectPoints[0].x, rectPoints[1].x), top: Math.min(rectPoints[0].y, rectPoints[1].y), bottom: Math.max(rectPoints[0].y, rectPoints[1].y) }



    return !(r1.left > r2.right || r1.top > r2.bottom || r2.left > r1.right || r2.top > r1.bottom)
}


class ToolsStatus {
    /**
     * toolType为当前选择了什么工具
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
        this.lastTooType = 0;


        this.keyBord = {//临时出现在画板上的文字输入编辑框
            display: 0, //0不显示，1为显示
            x: -100,
            y: -100,
            value: "",
            focus: true,
            fontSize: 16,
            waitInput: false
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
        this.runReload = false //是否持续运行reload
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
    deleteMouseActionby(touches) {//调用一次就会遍历一次，删除
        var indexString = ""
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            indexString += touch.identifier + ","
        }

        for (let i = 0; i < this.mouseActions.length; i++) {
            const element = this.mouseActions[i];
            if (indexString.indexOf(element.identifier) == -1) {

                this.mouseActions.splice(i, 1)

                return
            }

        }

        //    //只能删除一个。
        //     for (let i = 0; i < this.mouseActions.length; i++) {
        //         const element = this.mouseActions[i];
        //         if (element.identifier == identifier ) {
        //             this.mouseActions.splice(i,1)
        //             return
        //         }
        //     }

    }
}
let ToolsStatus_type = { //当做枚举来用。
    pen: 0,
    mouse: 1,
    eraser: 2,
    image: 3,
    text: 4,
    color: 5,
    shape: 6//不直接显示在工具栏上。
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
class Room { //用作本地与数据库互联起来的类
    constructor() {
        this.roomID = -1
        // this.nowPageIndex = 0//当前用户所阅览的是第几页。

        this.name = ""
        this.drawBoardAll = {} //存放所有用户的drawboard 数据
    }
    initByJson(json) {
        for (const key in this) {
            if (this.hasOwnProperty(key) && json.hasOwnProperty(key)) {
                if (key == "drawBoardAll") {
                    let drawBoardAllJson = json["drawBoardAll"]
                    for (const key2 in drawBoardAllJson) {
                        if (drawBoardAllJson.hasOwnProperty(key2)) {
                            const drawBoardJson = drawBoardAllJson[key2];
                            let temp = new DrawBoard()
                            temp.initByJson(drawBoardJson)
                            this.drawBoardAll[key2] = temp

                        }
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
}
let thisRoom = new Room()
class UserInfo {
    constructor() {
        this.iconUrl = ""
        this.name = ""
        this.id = ""
    }
}


class Dom { //模拟dom操作取元素属性类
    constructor() {

    }
    getElementByString(str, callback) { //可以通过该属性获取元素当前的宽高等信息。str 值为css选择器名 ,注意为回调函数！
        const query = wx.createSelectorQuery()

        query.select(str).boundingClientRect();
        query.exec(function (res) {

            callback(res);

        })


    }
    getElementContext(str, callback) {
        wx.createSelectorQuery().select('.drawCanvas').context(function (res) {
            callback(res);

        }).exec()

    }
}

class DrawBoard {
    constructor(backgroundColor = "", width = 2000, height = 2000) {
        this.actions = []; //画布的所有绘制路径事件  
        // this.userSession = 0
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
        let action = this.getLastAction()
        action.time = new Date().toLocaleTimeString()
        // action.user
        return action

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
        var interval = DevelopConfiguration.SelectRectPadding//选择框与最值点的容差间隔。
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
                const cgshape = this.mode
                interval += 1
                switch (this.mode.type) {
                    case CGShape_type.rectangle:

                        minXY.x = Math.min(cgshape.points[2].x, cgshape.points[0].x)
                        minXY.y = Math.min(cgshape.points[2].y, cgshape.points[0].y)
                        maxXY.x = Math.max(cgshape.points[2].x, cgshape.points[0].x)
                        maxXY.y = Math.max(cgshape.points[2].y, cgshape.points[0].y)
                        break;
                    case CGShape_type.roundness:

                        let points = cgshape.getRoundnessRectPoints()
                        minXY.x = points[0].x
                        minXY.y = points[0].y
                        maxXY.x = points[1].x
                        maxXY.y = points[1].y
                        break;
                    case CGShape_type.triangle:

                        minXY.x = Math.min(cgshape.points[0].x, cgshape.points[1].x)
                        minXY.y = Math.min(cgshape.points[0].y, cgshape.points[2].y)
                        maxXY.x = Math.max(cgshape.points[0].x, cgshape.points[1].x)
                        maxXY.y = Math.max(cgshape.points[0].y, cgshape.points[2].y)
                        break;
                }
                break
            case Action_type.image:
                const cgimg = this.mode
                minXY = cgimg.position.getJson()
                maxXY.x = minXY.x + cgimg.width
                maxXY.y = minXY.y + cgimg.height

                break
            case Action_type.text:
                const cgText = this.mode

                maxXY.x = cgText.position.x + ctx.measureText(cgText.text).width - 3
                maxXY.y = cgText.position.y + (cgText.size) / 2
                minXY.x = cgText.position.x - 3
                minXY.y = cgText.position.y - (cgText.size) / 2 - 2
                console.log(cgText, minXY, maxXY)
                break
        }
        //以上的maxxy不能直接赋值cgpoint引用，否则会出现问题。

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
        toInt = true
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

    setPoint(x = null, y = null) {//通过函数修改点数据
        if (x != null) {
            this.x = parseInt(x)
        }
        if (y != null) {
            this.y = parseInt(y)
        }
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

        this.points = [new CGPoint(Math.min(tempPoints[0].x, tempPoints[1].x), Math.min(tempPoints[0].y, tempPoints[1].y)),
        new CGPoint(Math.max(tempPoints[0].x, tempPoints[1].x), Math.max(tempPoints[0].y, tempPoints[1].y))] //cgrect的属性：恒定为两个点，形容一个cgrect位置大小。
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
    getPointByIndex(index) {
        return this.getFourPoints()[index]
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
        this.lineDash = true;
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
        this.type = -1;
    }
    getRinRoundness() {
        return Math.pow(Math.pow(this.points[0].x - this.points[1].x, 2) + Math.pow(this.points[0].y - this.points[1].y, 2), 0.5)
    }
    getRoundnessRectPoints() {//两个points的数组
        let r = this.getRinRoundness()
        return [new CGPoint(this.points[0].x - r, this.points[0].y - r), new CGPoint(this.points[0].x + r, this.points[0].y + r)]
    }
    initByJson(json) {
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
}
let CGShape_type = {
    none: -1,
    rectangle: 0,//矩形
    triangle: 1,//三角形
    roundness: 2,//圆形
}

class CGImage {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.owidth = 0;
        this.oheight = 0;
        this.position = null;
        this.path = "";//当前用户的本地路径。
        this.url = ""//网络http
        this.tag = -1;//图片在服务器及本地的唯一标识=时间戳

    }
    initByJson(json) {
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
    getlocalStoragePath() {//获取图片当前的本地缓存。
        let that = this
        var p = new Promise(function (resolve, reject) {
            let locoalImgObj = wx.getStorageSync("ImgStorage")
            if (typeof (locoalImgObj) != "object" ) {
                locoalImgObj = {}
            }
            if (that.tag != -1) {
                //图片已存在服务器中，有标识符。
              
                if (typeof (locoalImgObj[that.tag]) == "undefined") {
                    //图片在本地没有缓存
                    downloadFile(that.url).then(res => {
                        console.log("缓存到本地的临时文件", res.tempFilePath)
                        locoalImgObj[that.tag] = res.tempFilePath
                        wx.setStorageSync("ImgStorage", locoalImgObj)
                        that.path = res.tempFilePath
                        resolve(res.tempFilePath)
                     

                    })

                } else {
                    //图片在本地中有缓存，判断是否可用。
                    
                    wx.getFileSystemManager().access({
                        path:locoalImgObj[that.tag],
                        success:function(){
                            resolve(locoalImgObj[that.tag])
                        },
                        fail:function(){
                            console.log("本地缓存无效，需要重新缓存图片")
                            downloadFile(that.url).then(res => {
                                console.log("缓存到本地的临时文件", res.tempFilePath)
                                locoalImgObj[that.tag] = res.tempFilePath
                                wx.setStorageSync("ImgStorage", locoalImgObj)
                                that.path = res.tempFilePath
                                resolve(res.tempFilePath)
                            })
                        }
                    })
                   
                 
                }


            } else {
                //首次创建图片
                that.tag = getTimestamp()

                downloadFile(that.url).then(res => {
                    console.log("首次创建到本地的临时文件", res.tempFilePath)
                    //将本地路径缓存到本地图片数据中。
                
                    locoalImgObj[that.tag] = res.tempFilePath
                    wx.setStorageSync("ImgStorage", locoalImgObj)
                    that.path = res.tempFilePath
                    resolve(res.tempFilePath)
              
                })
            }

        })
        return p



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

    readLocalStorage() {//读取函数进行读取完整的drawboardAll，不进行重绘
        let json = wx.getStorageSync("Room")


        // var result = JSON.stringify(json);
        // send(result);
        // let page = getCurrentPages()[0]
        if (json != "") {

            console.log("开始初始化room")
            thisRoom.initByJson(json)
            console.log(thisRoom)

            if (app.globalData.session == "") {//判断是否属于未登录的房间。
                drawBoard = thisRoom.drawBoardAll.temp

            } else {
                delete thisRoom.drawBoardAll.temp
                console.log("账号已登录，删除原有temp画板数据")
                this.saveLocalStorage()
            }
        } else {
            console.log("本地缓存为空")
            //缓存为空，创建临时的画板数据。
            thisRoom.drawBoardAll.temp = drawBoard //默认为本地我的数据。
        }

        //把读取到的缓存加载入drawboardALl
    }
    readDatabase() {//读取数据库内容、

    }
    uploadDate() {

    }

    saveLocalStorage() {
        wx.setStorageSync("Room", thisRoom)
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
        pageVisable: true,
        scrollView: {
            ntop: 0,
            nleft: 0,
        },
        colorDatas: ["rgb(255,99,105)", "rgb(255,171,99)", "rgb(255,230,105)",
            "rgb(214,230,99)", "rgb(176,244,99)", "rgb(65,63,61)",
            "rgb(206,206,206)", "rgb(194,181,250)", "rgb(125,209,240)", "rgb(125,230,194)"
        ],

        penConfiguration: {//当前工具栏的配置状态。
            color: "rgb(255,99,105)",
            shape: -1,
            lineDash: false,
            lineWidth: 3,
            shape: CGShape_type.none,
            textSize: 30
        },
        userOnlineIdArray: [],//这里控制显示的在线人，值为id
        userOnlineInfo: {//通过上面的id 来读取这里的info。

        },
        userOnlineIcon: [],

        animation: {
            background: {},
            opeanPane: {},
            dodgeTools: {}
        },
        drawBoardList: {}


    },
    draw_line_curve(thisPoint, lsPoint, lssPoint) {
        //曲线优化
        //起点为： 上一个点和上上个点的中点
        //控制点为：上一个点
        //终点为：上一个点和当前点的中点



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
    draw_text(cgText, tempflexData = null) {
        ctx.fillStyle = cgText.color

        var position = new CGPoint(cgText.position.x, cgText.position.y)
        if (tempflexData == null) {
            ctx.setFontSize(cgText.size);
        } else {
            ctx.setFontSize(tempflexData.size);
            position = tempflexData.position
        }

        position.x -= 3
        position.y += cgText.size * 0.34

        ctx.fillText(cgText.text, ...position.getJsonArr());
        // ctx.draw(true);
    },
    draw_circle() {

    },
    //draw 方法不会调用draw 显示，需要在外部调用。
    compute_exportImage() {

        let systeminfo = app.globalData.systemInfo
        let datas = this.data
        ctx.draw(true, function () {
            wx.canvasToTempFilePath({
                canvasId: canvas_ID,
                quality: 1,

                x: datas.scrollView.nleft,
                y: datas.scrollView.ntop,
                width: systeminfo.windowWidth,//设置导出画布的内容区域。
                height: systeminfo.windowHeight,
                success: function (res) {


                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: function () {
                            wx.showToast({
                                title: "已导出到相册"

                            })

                        },
                        fail: function (fileres) {
                            wx.showToast({
                                title: "导出图片失败，请添加相册授权",
                                icon: "none"
                            })
                            wx.authorize({
                                scope: 'scope.writePhotosAlbum',
                                success() {
                                    console.log("用户点击同意授权。")
                                }
                            })
                            console.log(fileres)
                        }
                    })
                }
            })
        })
    },
    compute_textInput(thisPoint, disFocus = false) { //切换到文字工具-处理函数
        let datas = this.data
        let toolsStatus = datas.toolsStatus

        if (disFocus == true || toolsStatus.keyBord.waitInput != false) {
            console.log('结束输入文字')

            let text = toolsStatus.keyBord.value

            if (text != "") {
                let size = datas.penConfiguration.textSize

                let lsAction = (drawBoard.getLastAction()).mode //为CGText
                lsAction.text = text
                lsAction.size = size
                lsAction.color = datas.penConfiguration.color
                // lsAction.position = new CGPoint(toolsStatus.keyBord.x, toolsStatus.keyBord.y)

                this.draw_text(lsAction)
                ctx.draw(true);

                send(drawBoard)
            } else {
                console.log("没有文字输入，作废。")
            }

            toolsStatus.keyBord.waitInput = false //清空等待输入状态
            this.setData({
                "toolsStatus.keyBord.display": 0,
                "toolsStatus.keyBord.focus": false,
                "toolsStatus.keyBord.value": ""
            })

        } else {


            toolsStatus.keyBord.waitInput = true
            console.log('开始输入文字')
            console.log(thisPoint)
            console.log(thisPoint.x - datas.scrollView.nleft, thisPoint.y - datas.scrollView.ntop)
            this.setData({
                "toolsStatus.keyBord.display": 1,
                "toolsStatus.keyBord.value": "",
                "toolsStatus.keyBord.x": thisPoint.x - datas.scrollView.nleft,
                "toolsStatus.keyBord.y": thisPoint.y - datas.scrollView.ntop,
                "toolsStatus.keyBord.focus": true
            })
            let lsAction = (drawBoard.addAction(Action_type.text)).mode
            lsAction.position = thisPoint
        }
    },
    compute_line(thisPoint) { //只在手移动绘画时被调用。

        let datas = this.data
        let lsAction = drawBoard.getLastAction().mode //此处lsAction 类型为CGLine

        let lsPoint = lsAction.getLastPoint(); //上一个点
        let lssPoint = lsAction.getLastPoint(1); //上一个点
        lsAction.addPoint(...thisPoint.getJsonArr()) //把点加到数据库中。
        if (lsAction.points.length < 3) {
            return
        }
        this.draw_line_curve(thisPoint, lsPoint, lssPoint)
        ctx.stroke()
        ctx.draw(true)

    },
    compute_shape(thisPoint) {
        let datas = this.data
        let lsAction = drawBoard.getLastAction().mode
        switch (this.data.penConfiguration.shape) {
            case CGShape_type.rectangle:
                // let width = thisPoint.x - lsAction.points[0].x
                // let height = thisPoint.y - lsAction.points[0].y

                let rect = new CGRect([this.data.toolsStatus.mouseActions[0].startPoint, thisPoint])
                lsAction.points[1].x = thisPoint.x
                lsAction.points[1].y = lsAction.points[0].y
                lsAction.points[2] = thisPoint
                lsAction.points[3].y = thisPoint.y
                lsAction.points[3].x = lsAction.points[0].x
                //这里没进行顺序处理。

                // lsAction.points[0] = rect.getPointByIndex(0)
                // lsAction.points[1] = rect.getPointByIndex(1)
                // lsAction.points[2] = rect.getPointByIndex(2)
                // lsAction.points[3] = rect.getPointByIndex(3)
                // lsAction.points[4] = rect.getPointByIndex(0)
                break;
            case CGShape_type.roundness:
                lsAction.points[1] = thisPoint
                // let r = Math.pow(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2), 0.5)
                //求出半径。
                break
            case CGShape_type.triangle:

                lsAction.points[1] = thisPoint
                let width = thisPoint.x - lsAction.points[0].x
                let midHeight = thisPoint.y - lsAction.points[0].y
                // lsAction.points[2].x = lsAction.points[0].x
                lsAction.points[2].y = lsAction.points[0].y + 2 * midHeight
                break;
            default:
                break;
        }
        this.reloadDrawBoard()

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
    compute_addImage() {
        let that = this

        let datas = this.data
        datas.toolsStatus.toolType = ToolsStatus_type.image;
        wx.chooseImage({
            success(res) {
                const orignFilePath = res.tempFilePaths[0] // tempFilePaths 的每一项是一个本地临时文件路径
                wx.showLoading({
                    title: "正在添加图片",
                    mask: true
                })


                saveToFIle(orignFilePath).then(imageUrl => {
                    console.log("回传的网络图片地址", imageUrl)
                    drawBoard.addAction(Action_type.image)
                    let cgimg = drawBoard.getLastAction().mode
                    cgimg.url = imageUrl
                    cgimg.getlocalStoragePath().then(localPath => {
                        console.log("回传回来的本地路径", localPath)

                        wx.getImageInfo({
                            src: localPath,
                            success: function (res) {
                                let systeminfo = app.globalData.systemInfo
                                cgimg.owidth = res.width//保存原始大小
                                cgimg.oheight = res.height
                                cgimg.width = res.width//保存原始大小
                                cgimg.height = res.height
                                console.log(res)
                                //开始计算居中后的图片大小。
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
                                cgimg.position = new CGPoint((systeminfo.windowWidth - cgimg.width) / 2 + that.data.scrollView.nleft, (systeminfo.windowHeight - cgimg.height) / 2 + that.data.scrollView.ntop)
                                datas.toolsStatus.toolType = ToolsStatus_type.mouse;
                                console.log(cgimg)
                                wx.hideLoading()
                                that.setData({
                                    "toolsStatus.toolType": datas.toolsStatus.toolType
                                })
                                //以上只添加图片进入数据库，不进行渲染。
                               
                                that.reloadDrawBoard()
    
                            },
                            fail: function () {
                                that.data.toolsStatus.toolType = that.data.toolsStatus.lastTooType;
                                that.setData({
                                    "toolsStatus.toolType": that.data.toolsStatus.toolType
                                })
                            }
                        })
                    })

                    
                })

            },
            fail: function () {
                that.data.toolsStatus.toolType = that.data.toolsStatus.lastTooType;
                that.setData({
                    "toolsStatus.toolType": that.data.toolsStatus.toolType
                })
            }
        })
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
        let pointSize = 8//角点的大小
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
        ctx.stroke()

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

                case Action_type.shape:
                    const cgshape = iAction.mode
                    if (typeof (point.x) != "undefined") { //点选
                        switch (cgshape.type) {
                            case CGShape_type.rectangle:
                                //矩形。
                                if (point.isInclude(cgshape.points[0], cgshape.points[2], DevelopConfiguration.SimpleSelectDistance)) {
                                    selectIndex = a
                                    console.log("选中矩形")
                                }
                                break;
                            case CGShape_type.roundness:
                                let r = cgshape.getRinRoundness()
                                if (point.isDistance(cgshape.points[0], r * r)) {
                                    selectIndex = a
                                    console.log("选中圆")
                                }
                                break;
                            case CGShape_type.triangle:
                                let ULPoint = cgshape.points[0]
                                let DRPoint = new CGPoint(cgshape.points[1].x, cgshape.points[2].y)
                                if (point.isInclude(ULPoint, DRPoint, DevelopConfiguration.SimpleSelectDistance)) {
                                    selectIndex = a
                                    console.log("选中三角形")
                                }
                                break
                            default:
                                break;
                        }

                    } else { //框选
                        switch (cgshape.type) {
                            case CGShape_type.rectangle:
                                if (isRectOverlap(point, [cgshape.points[0], cgshape.points[2]])) {
                                    toolsStatus.addSelect(a)
                                }
                                break
                            case CGShape_type.roundness:
                                let r = cgshape.getRinRoundness()
                                //通过计算圆所处的矩形大小来判断。
                                if (isRectOverlap(point, cgshape.getRoundnessRectPoints())) {
                                    toolsStatus.addSelect(a)
                                }
                                break;
                            case CGShape_type.triangle:
                                let ULPoint = cgshape.points[0]
                                let DRPoint = new CGPoint(cgshape.points[1].x, cgshape.points[2].y)
                                if (isRectOverlap(point, [ULPoint, DRPoint])) {
                                    toolsStatus.addSelect(a)
                                }

                                break
                        }
                    }

                    break
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

    reloadDrawBoard(reloadImg = false) {


        let toolsStatus = this.data.toolsStatus
        ctx.lineJoin = "round"
        ctx.lineCap = "round"

        // let nowPageIndex = thisRoom.nowPageIndex
        let mydrawBoard = drawBoard //保存原来的我的drawboard
        let myActions = drawBoard.actions //默认actions为当前用户的

        var isMyDrawboard = false


        for (const key in thisRoom.drawBoardAll) {
            drawBoard = mydrawBoard
            if (typeof (drawBoard) == "undefined") {
                console.log("reload错误：drawboard undefined")
            }
            var actions = {}
            if (thisRoom.drawBoardAll.hasOwnProperty(key)) {
                drawBoard = thisRoom.drawBoardAll[key];

                actions = drawBoard.actions
            } else {
                continue
            }

            if (key == app.globalData.userInfo.id || key == "temp") {
                //判断是我的画布
                actions = myActions
                isMyDrawboard = true
            } else {
                isMyDrawboard = false
            }


            //绘制路径
            for (let a = 0; a < actions.length; a++) {
                const iAction = actions[a];
                switch (iAction.type) {
                    case Action_type.line:

                        ctx.beginPath()
                        const cgline = iAction.mode
                        ctx.lineWidth = cgline.lineWidth
                        ctx.strokeStyle = cgline.color
                        if (cgline.lineDash) {
                            ctx.setLineDash(DevelopConfiguration.lineDashData);
                        } else {
                            ctx.setLineDash(0);
                        }


                        //进行临时的图层拉伸展示。
                        if (toolsStatus.mouseMoveType == Mouse_MoveType.model_felx && isMyDrawboard) {
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
                        //进行临时的图层拉伸展示。
                        ctx.beginPath()
                        const cgshape = iAction.mode
                        ctx.lineWidth = cgshape.lineWidth
                        ctx.strokeStyle = cgshape.color
                        if (cgshape.lineDash) {
                            ctx.setLineDash(DevelopConfiguration.lineDashData);
                        } else {
                            ctx.setLineDash(0);
                        }
                        var thisPoint, lsPoint

                        for (let i = 1; i < cgshape.points.length; i++) {

                            if (toolsStatus.isSelect(a) && toolsStatus.mouseMoveType == Mouse_MoveType.model_felx && isMyDrawboard) {
                                thisPoint = cgshape.points[i].modelFlexInit(toolsStatus.modelFlexData)
                                lsPoint = cgshape.points[i - 1].modelFlexInit(toolsStatus.modelFlexData)
                            } else {
                                thisPoint = cgshape.points[i]
                                lsPoint = cgshape.points[i - 1]
                                // this.draw_line_curve(cgshape.points[i], cgshape.points[i - 1])
                            }

                            if (iAction.mode.type == CGShape_type.roundness) {//圆形特殊处理。这里的for只会进行一次。

                                let r = Math.pow(Math.pow(lsPoint.x - thisPoint.x, 2) + Math.pow(lsPoint.y - thisPoint.y, 2), 0.5)
                                ctx.arc(...lsPoint.getJsonArr(), r, 0, 2 * Math.PI, false)
                            } else {
                                this.draw_line_curve(thisPoint, lsPoint)
                            }
                        }


                        // for (let i = 1; i < cgshape.points.length; i++) {
                        //     if (iAction.mode.type = CGShape_type.roundness) {//圆形特殊处理。
                        //         let r = Math.pow(Math.pow(cgshape.points[0].x - cgshape.points[1].x, 2) + Math.pow(cgshape.points[0].y - cgshape.points[1].y, 2), 0.5)
                        //         ctx.arc(...cgshape.points[0].getJsonArr(), r, 0, 2 * Math.PI, false)
                        //     } else {
                        //         this.draw_line_curve(cgshape.points[i], cgshape.points[i - 1])
                        //     }
                        // }

                        ctx.closePath()
                        ctx.stroke()
                        break
                }
            }

            // 再绘制文字。
            for (let a = 0; a < actions.length; a++) {
                const iAction = actions[a];
                switch (iAction.type) {
                    case Action_type.text:
                        const cgText = iAction.mode
                        var tempflexData = {}
                        if (toolsStatus.isSelect(a) && toolsStatus.mouseMoveType == Mouse_MoveType.model_felx && isMyDrawboard) {
                            tempflexData.size = cgText.size * (toolsStatus.modelFlexData.width + toolsStatus.modelFlexData.height) / 2
                            tempflexData.position = cgText.position.modelFlexInit(toolsStatus.modelFlexData)

                            this.draw_text(cgText, tempflexData)
                        } else {

                            this.draw_text(cgText)
                        }


                        break
                }

            }


            // 再绘制图片。
            for (let a = 0; a < actions.length; a++) { //遍历每一个绘制事件
                const iAction = actions[a];
                switch (iAction.type) {
                    case Action_type.image:
                        const cgimg = iAction.mode

                        if (toolsStatus.isSelect(a) && toolsStatus.mouseMoveType == Mouse_MoveType.model_felx && isMyDrawboard) {
                            let tempPosition = cgimg.position.modelFlexInit(toolsStatus.modelFlexData)
                            let tempWidth = cgimg.width * toolsStatus.modelFlexData.width
                            let tempHeight = cgimg.height * toolsStatus.modelFlexData.height
                            ctx.drawImage(cgimg.path, 0, 0, cgimg.owidth, cgimg.oheight, ...tempPosition.getJsonArr(), tempWidth, tempHeight)
                        } else {
                        if (reloadImg == true) {
                            let that = this
                            cgimg.getlocalStoragePath().then(localpath =>{
                                console.log("重载路径",localpath)
                                ctx.drawImage(localpath, 0, 0, cgimg.owidth, cgimg.oheight, ...cgimg.position.getJsonArr(), cgimg.width, cgimg.height)
                                that.reloadDrawBoard()
                            })
                        }else{
                            ctx.drawImage(cgimg.path, 0, 0, cgimg.owidth, cgimg.oheight, ...cgimg.position.getJsonArr(), cgimg.width, cgimg.height)

                        }
                           


                        }
                        break

                }

            }


        }

        //为选中的图层添加选中框（多,单选时。）
        if (toolsStatus.select.selecting == true && toolsStatus.mouseMoveType != Mouse_MoveType.model_felx && toolsStatus.mouseMoveType != Mouse_MoveType.model_move) {
            ctx.beginPath()
            ctx.strokeStyle = DevelopConfiguration.SelectRectStyle.color//"rgb(190,235,248)"//"rgb(230,249,255)"
            ctx.lineWidth = DevelopConfiguration.SelectRectStyle.lineWidth
            ctx.fillStyle = DevelopConfiguration.SelectRectStyle.cornerPointColor//"rgb(32,222,147)"
            ctx.setLineDash([3, 6]);
            for (let a = 0; a < actions.length; a++) { //遍历每一个绘制事件
                const iAction = actions[a];

                if (toolsStatus.isSelect(a)) {
                    this.mouse_selectAction(iAction)

                    // ctx.rect(clipPoints[0].x-5,clipPoints[0].y-5 ,clipPoints[1].x+5,10)//up
                    // ctx.rect(clipPoints[3].x-5,clipPoints[3].y-5 ,clipPoints[2].x+5,10)//bottom
                    // ctx.rect(clipPoints[0].x-5,clipPoints[0].y-5 ,10,clipPoints[3].y+5)//left
                    // ctx.rect(clipPoints[1].x-5,clipPoints[1].y-5 ,10,clipPoints[2].y+5)//right
                    // ctx.clip()


                }
            }
        }
        if (toolsStatus.mouseMoveType == Mouse_MoveType.multipleSelecting) { //渲染多选时候的动态选框
            ctx.beginPath()
            let mouseActions = toolsStatus.mouseActions
            ctx.lineWidth = DevelopConfiguration.SelectRectStyle.lineWidth
            ctx.strokeStyle = DevelopConfiguration.SelectRectStyle.color
            ctx.setLineDash([3, 6]);
            this.mouse_selectAction([mouseActions[0].startPoint, mouseActions[0].endPoint], true)


        }

        drawBoard = mydrawBoard//还原数据。
        //正式的渲染到屏幕上。
        ctx.draw(false, () => {

            if (toolsStatus.mouseMoveType == Mouse_MoveType.model_move || toolsStatus.mouseMoveType == Mouse_MoveType.multipleSelecting || toolsStatus.runReload == true) {

                this.reloadDrawBoard()

            }
        })
        ctx.restore()
        ctx.save()

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
    initDrawBoard() { //进行最基础的变量初始化。
        // new Dom().getElementByString(".drawCanvas", (res) => {

        //     drawBoard.width = res[0].width
        //     drawBoard.height = res[0].height
        // })

        drawBoard = new DrawBoard();
        this.data.toolsStatus = new ToolsStatus();
        this.setData({
            'toolsStatus.keyBord.display': 0,
            'toolsStatus.toolType': ToolsStatus_type.pen
        })
        this._onlyChangeLineWidth = false //允许点击形状后，下一步只更改路径大小。

    },
    prepareForInter() {

        //进行本地缓存读取。初始化 drawboardAll
        let storage = new LocalStorage()
        storage.readLocalStorage()



        //读取网络数据并设置
        // thisRoom.roomID = 
        // thisRoom.onlineUsersSession = 

        thisRoom.name = "房间"



        console.log("初始化完成的：", thisRoom, drawBoard)
        //drawboardAll数据加载完毕，执行一次重载渲染新数据。
        this.reloadDrawBoard()
        

    },
    compute_scrollGesture(toolsStatus) {
        let mouseActions = toolsStatus.mouseActions
        if (mouseActions.length != 2) {
            console.log("mouseAction长度错误！")
        }
        //移动画布处理-----

        let finger1_Offest = { x: mouseActions[0].endPoint.x - mouseActions[0].lastPoint.x, y: mouseActions[0].endPoint.y - mouseActions[0].lastPoint.y }
        let finger2_Offest = { x: mouseActions[1].endPoint.x - mouseActions[1].lastPoint.x, y: mouseActions[1].endPoint.y - mouseActions[1].lastPoint.y }
        let nX = -(finger1_Offest.x + finger2_Offest.x) / 2 + this.data.scrollView.nleft
        let nY = -(finger1_Offest.y + finger2_Offest.y) / 2 + this.data.scrollView.ntop
        // console.log(finger1_Offest.x+","+finger1_Offest.y,finger2_Offest.x+","+finger2_Offest.y)
        console.log(finger1_Offest, finger2_Offest, nX, nY, "---", this.data.scrollView.nleft, this.data.scrollView.ntop, "<====", mouseActions[0])


        nX = nX > 0 ? nX : 0
        nY = nY > 0 ? nY : 0
        // this.data.scrollView.ntop = nY
        // this.data.scrollView.nleft = nX

        // console.log("X= ", parseInt(-(finger1_Offest.x + finger2_Offest.x) / 2), "y=", parseInt(-(finger1_Offest.y + finger2_Offest.y) / 2))


        //缩放画布处理-----

        let distance = Math.pow(Math.pow(mouseActions[0].endPoint.x - mouseActions[1].endPoint.x, 2) + Math.pow(mouseActions[0].endPoint.y - mouseActions[1].endPoint.y, 2), 0.5)
        // console.log("手指距离：", distance)

        //应用到画布上
        //以下处理非常重要，移动后画布位置改变，此时按下的点的坐标已经！=原来的点。

        mouseActions[0].endPoint.x -= finger1_Offest.x
        mouseActions[0].endPoint.y -= finger1_Offest.y
        mouseActions[1].endPoint.x -= finger2_Offest.x
        mouseActions[1].endPoint.y -= finger2_Offest.y
        // console.log(mouseActions[0].endPoint.x+","+mouseActions[0].endPoint.y,mouseActions[1].endPoint.x+","+mouseActions[1].endPoint.y)

        this.setData({
            "scrollView.ntop": nY,
            "scrollView.nleft": nX
        })


    },
    compute_completeModelFlex(action, modelFlexData) {
        //拖动时的呈现都是临时的，并不会实时修改内存中点的数据。
        //松手后调用了这里才是完成拉伸路径数据的更新。          

        switch (action.type) {
            case Action_type.line:
            case Action_type.shape:
                const cgline = action.mode
                cgline.every(function (point) {
                    point.x = (point.x - modelFlexData.relativeOriginPoint.x) * modelFlexData.width + modelFlexData.relativeOriginPoint.x
                    point.y = (point.y - modelFlexData.relativeOriginPoint.y) * modelFlexData.height + modelFlexData.relativeOriginPoint.y

                })
                break


            case Action_type.image:
                const cgimg = action.mode
                cgimg.width = cgimg.width * modelFlexData.width
                cgimg.height = cgimg.height * modelFlexData.height
                cgimg.position = cgimg.position.modelFlexInit(modelFlexData)
                break
            case Action_type.text:
                const cgText = action.mode
                cgText.size *= (modelFlexData.width + modelFlexData.height) / 2
                cgText.position = cgText.position.modelFlexInit(modelFlexData)

                break
        }

    },
    cancelSelectStatus() {//重置工具状态
        let toolsStatus = this.data.toolsStatus
        let condition = toolsStatus.condition
        condition.deleteAll()

        toolsStatus.mouseMoveType = Mouse_MoveType.none
        toolsStatus.select.actionsIndex = null
        toolsStatus.select.actionsIndex = []
        toolsStatus.select.touchDown_actionIndex = -1
        toolsStatus.select.selecting = false
        this.reloadDrawBoard()
    },

    RunAnimation(type) {
        //处理按下后的靠边动画，
        let animation = wx.createAnimation({
            duration: 300,
            timingFunction: "ease-out"
        })
        switch (type) {
            case "closeTools":

                // animation.left(100)
                animation.opacity(0)
                // animation.translate(-100);
                animation.step()
                this.setData({
                    "animation.dodgeTools": animation.export()
                })
                break;

            case "opeanTools":

                // animation.left(100)
                animation.opacity(1)
                // animation.translate(0);
                animation.step()
                this.setData({
                    "animation.dodgeTools": animation.export()
                })
                break;
            default:
                break;
        }


    },

    //-------以上为画布动作的处理事件-----
    status_userJoinOnline(userId) {//有用户加入上线状态。
        joinUserIconByID(userId)
    },

    //通信互联事件。


    //--------页面加载事件------
    /**
     * 生命周期函数--监听页面加载，一个页面只会调用一次
     */

    onLoad: function (options) {


    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function (options) {
        this.setData({
            pageVisable: true
        })
        if (this.data.toolsStatus.toolType == ToolsStatus_type.image) {
            return
        }
        let that = this;
        console.log("页面启动参数：", options)
        // 无论什么情况，先初始化创建一个本地使用的drawboard
        this.initDrawBoard();
        //开始执行一些为互联准备的数据。
        this.prepareForInter();
        //登陆
        //检测缓存中是否有session和roomid并存入全局变量中
        if (!(app.globalData.session === "")) {
            //根据已有的session从服务器获取所有个人信息存入全局变量
            wx.request({
                url: url,
                data: {
                    "session": app.globalData.session,
                },
                success: function (res) {
                    if (res.statusCode == 200) {
                        console.log("服务器request回来的data：", res.data);
                        if (res.data.statusCode == 100 || res.data.statusCode == 0) {
                            app.globalData.userInfo.id = res.data.id;
                            app.globalData.userInfo.name = res.data.name;
                            app.globalData.userInfo.iconurl = res.data.iconurl;
                            app.globalData.userInfo.groupName = res.data.groupName;
                            var currentRoomID = res.data.roomID;
                            //console.log(app.globalData.userInfo.roomID);
                            if ((currentRoomID != app.globalData.userInfo.roomID) && currentRoomID === 0) {//用户还没加入队伍，访问数据库加入队伍

                                console.log("用户当前未加入队伍,开始加入缓存里的队伍:", app.globalData.userInfo.roomID);

                                //
                                //弹框询问是否确认加入房间：，当前画板内容会被清空
                                //

                                //加入队伍
                                wx.request({
                                    url: url,
                                    data: {
                                        "session": app.globalData.id,
                                        "newRoomID": app.globalData.userInfo.roomID
                                    },
                                    success: function (res) {
                                        if (res.statusCode == 200) {
                                            if (res.data.statusCode == 0) {
                                                wx.showModal({
                                                    title: '提示',
                                                    content: '已成功加入队伍',
                                                    showCancel: false
                                                });
                                            } else {
                                                console.log(res.data.errMsg);
                                            }
                                        }
                                        else {
                                            console.log(res.errMsg);
                                        }
                                    },//request.success
                                    fail: function (e) {
                                        console.log("request.fail:", e);
                                    }//request.fail
                                });//request

                            }
                            if ((currentRoomID != app.globalData.userInfo.roomID) && currentRoomID != 0) {//用户已加入某队伍，需要提示先退出队伍

                                var str = '您已加入队伍';
                                str += app.globalData.userInfo.groupName;
                                str += '，是否切换到' + res.data.groupName;
                                wx.showModal({
                                    title: '提示',
                                    content: str,
                                    showCancel: false
                                });
                                wx.setStorageSync('roomID', currentRoomID);//还原被二维码更改的roomID缓存


                            }
                            if ((currentRoomID === app.globalData.userInfo.roomID) && currentRoomID != 0) {//和数据库roomid一致，开始连接socket

                                //下载数据库中roomid对应已有的整个画板数据,存入对象，key为用户id对应value值是该用户的画板数据
                                var jsDownLoadDrawBoardData = JSON.parse(res.data.drawBoardData);
                                //console.log(jsDownLoadDrawBoardData);
                                for (var i = 0; i < jsDownLoadDrawBoardData.length; i++) {
                                    thisRoom.drawBoardAll[String(jsDownLoadDrawBoardData[i].id)] = new DrawBoard().initByJson(jsDownLoadDrawBoardData[i].data[0]);

                                    // that.data.drawBoardList[String(jsDownLoadDrawBoardData[i].id)] = jsDownLoadDrawBoardData[i].data[0];
                                }
                                console.log("从数据库下载的整个画板数据：", thisRoom.drawBoardAll);
                                that.reloadDrawBoard(true)

                                //连接socket
                                websocket.connect(app.globalData.userInfo, function (sockres) {
                                    // console.log(JSON.parse(sockres.data))

                                    //接受socket通道中新的画板数据，更新到本机特定用户的画板数据中
                                    //var list = [];
                                    //list = that.data.drawBoardList;

                                    var jsListData = JSON.parse(sockres.data);
                                    // that.data.drawBoardList[jsListData.id] = ;

                                    thisRoom.drawBoardAll[jsListData.id] = new DrawBoard().initByJson(jsListData.data[0])

                                    //list.push(JSON.parse(sockres.data));
                                    //that.setData({
                                    //    drawBoardList: list
                                    //});
                                    that.status_userJoinOnline(jsListData.id)


                                    console.log("收到实时数据，当前画布所有：", thisRoom.drawBoardAll);
                                    //console.log("第一个画布数据：",that.data.drawBoardList[1].data);
                                    that.reloadDrawBoard(true)
                                });

                                //获取当前队伍里所有人的信息
                                wx.request({
                                    url: url,
                                    data: {
                                        "roomid": currentRoomID,
                                    },
                                    success: function (res) {
                                        if (res.statusCode == 200) {
                                            if (res.data.statusCode == 0) {
                                                //console.log("所有用户信息:", res.data.data);//传回来一个数组
                                                for (var i = 0; i < res.data.data.length; i++) {
                                                    app.globalData.roomAllUserInfo[String(res.data.data[i].id)] = res.data.data[i];
                                                }//key为用户id，传入每个用户详细信息对象
                                                console.log("房间所有用户的信息:", app.globalData.roomAllUserInfo);
                                            } else {
                                                console.log(res.data.errMsg);
                                            }
                                        }
                                        else {
                                            console.log(res.errMsg);
                                        }
                                    },//request.success
                                    fail: function (e) {
                                        console.log("request.fail:", e);
                                    }//request.fail
                                });//request
                            }

                        }
                        else {
                            console.log(res.data.errMsg);
                        }
                    }
                    else {
                        console.log(res.errMsg);
                    }
                },//request.success

                fail: function (e) {
                    console.log("request.fail:", e);
                }//request.fail

            });//request

        } else {
            if (!(app.globalData.userInfo.roomID === "")) {//如果没有session(没有登陆)但是有房间id

                //
                //提示用户需要先去设置里登陆
                //

            }
        }



        if (typeof (this._exportImage) != "undefined" && this._exportImage == true) {
            console.log("开始导出画布")
            this.compute_exportImage();
            this._exportImage = false
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        if (this.data.toolsStatus.toolType == ToolsStatus_type.image) {
            return
        }
        let localStorage = new LocalStorage()
        localStorage.saveLocalStorage()
        wx.closeSocket();
        console.log("页面隐藏，断开连接并保存。", thisRoom);
        // if (app.globalData.userInfo.id == null) {
        //     let storage = new LocalStorage()
        //     storage.saveLocalStorage()
        // }
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    // /**
    //  * 页面相关事件处理函数--监听用户下拉动作
    //  */
    // onPullDownRefresh: function () {

    // },

    // /**
    //  * 页面上拉触底事件的处理函数
    //  */
    // onReachBottom: function () {

    // },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        console.log(res)

        if (res.from == "button") {
            //邀请用户
        } else {
            //分享小程序
        }

        // let shareData={
        //     title:"",
        // path:"",
        // imageUrlL:"",
        // }
        return {} //必须返回一个objec 以定义转发的内容
    },
    onResize(res) {
        console.log("设备旋转", res)
    },

    //------UI响应事件------
    opeanDetailPane(toolType) {

        let datas = this.data
        if (datas.toolsStatus.toolType == toolType) {
            this.setData({
                toolBarDetailindex: toolType,
            })
            setTimeout(function () {
                let animation_back = wx.createAnimation({
                    duration: 400,
                    timingFunction: "ease"
                })
                // animation.left(100)
                animation_back.opacity(0.3)
                animation_back.step()

                let animation_opean = wx.createAnimation({
                    duration: 400,
                    timingFunction: "ease"
                })
                animation_opean.translate(0, -rpx(500));
                animation_opean.step()
                this.setData({
                    "animation.background": animation_back.export(),
                    "animation.opeanPane": animation_opean.export()

                })

            }.bind(this), 5);
        }
    },
    changeStatus(e) { //画布工具栏点击事件
        let buttonId = e.currentTarget.id;
        let datas = this.data

        //让画布失去焦点。
        // this.compute_textInput({},true)


        switch (buttonId) {
            case "tools_pen":
                console.log("画笔开启");

                if (this.data.penConfiguration.shape != CGShape_type.none) {

                    this.opeanDetailPane(ToolsStatus_type.shape)
                    datas.toolsStatus.toolType = ToolsStatus_type.shape;
                } else {
                    this.opeanDetailPane(ToolsStatus_type.pen)
                    datas.toolsStatus.toolType = ToolsStatus_type.pen;
                }

                this.cancelSelectStatus()



                break;
            case "tools_eraser":
                console.log("橡皮开启");
                this.cancelSelectStatus();//取消选中状态。
                // ctx.draw()
                // this.reloadDrawBoard()
                datas.toolsStatus.toolType = ToolsStatus_type.eraser;


                break;
            // case "tools_shape":
            //     console.log("矩形开启");
            //     this.opeanDetailPane(ToolsStatus_type.shape)
            //     datas.toolsStatus.toolType = ToolsStatus_type.shape;

            //     break;
            case "tools_text":
                console.log("文字开启");
                this.cancelSelectStatus()
                datas.toolsStatus.toolType = ToolsStatus_type.text;


                break;
            case "tools_select":
                console.log("选区开启");
                // this.cancelSelectStatus()
                datas.toolsStatus.toolType = ToolsStatus_type.mouse;

                break;
            case "tools_addImage":

                this.cancelSelectStatus()
                datas.toolsStatus.lastTooType = datas.toolsStatus.toolType
                this.compute_addImage()


                break;
            case "tools_pigment":
                this.setData({
                    "toolsStatus.toolType": datas.toolsStatus.toolType
                })
                console.log("颜料点击");

                datas.toolsStatus.lastTooType = datas.toolsStatus.toolType
                datas.toolsStatus.toolType = ToolsStatus_type.color;
                this.setData({
                    "toolsStatus.toolType": datas.toolsStatus.toolType
                })
                this.opeanDetailPane(ToolsStatus_type.color)



                break;

            case "tools_debug":
                // let storage = new LocalStorage()
                // storage.saveLocalStorage()
                // storage.readLocalStorage()
                this.compute_exportImage()


                break;
        }


        this.setData({
            "toolsStatus.toolType": datas.toolsStatus.toolType
        })
    },
    detailPane_onClick(e) {

        let buttonId = e.currentTarget.id;
        let configuration = this.data.penConfiguration
        let datas = this.data
        console.log(buttonId)

        switch (buttonId) {
            case "pen_dash":

                configuration.lineDash = !configuration.lineDash
                break;
            case "pen_line0":
                configuration.lineWidth = 1
                if (this._onlyChangeLineWidth != true) {

                    configuration.shape = CGShape_type.none
                    console.log(configuration.shape)
                    datas.toolsStatus.toolType = ToolsStatus_type.pen;

                } else {
                    this._onlyChangeLineWidth = false
                }

                break;
            case "pen_line1":
                configuration.lineWidth = 3
                if (this._onlyChangeLineWidth != true) {

                    configuration.shape = CGShape_type.none

                    datas.toolsStatus.toolType = ToolsStatus_type.pen;
                } else {
                    this._onlyChangeLineWidth = false
                }
                break;
            case "pen_line2":

                configuration.lineWidth = 6
                if (this._onlyChangeLineWidth != true) {

                    configuration.shape = CGShape_type.none
                    datas.toolsStatus.toolType = ToolsStatus_type.pen;
                } else {
                    this._onlyChangeLineWidth = false
                }

                break;
            case "pen_line3":
                configuration.lineWidth = 9
                if (this._onlyChangeLineWidth != true) {
                    configuration.shape = CGShape_type.none
                    datas.toolsStatus.toolType = ToolsStatus_type.pen;
                } else {
                    this._onlyChangeLineWidth = false
                }
                break;
            case "pen_shapeRoundness":

                if (configuration.shape != CGShape_type.roundness) {
                    configuration.shape = CGShape_type.roundness
                    datas.toolsStatus.toolType = ToolsStatus_type.shape;
                    this._onlyChangeLineWidth = true
                } else {
                    configuration.shape = CGShape_type.none
                    datas.toolsStatus.toolType = ToolsStatus_type.pen
                }

                break;
            case "pen_shapeTriangle":
                if (configuration.shape != CGShape_type.triangle) {
                    configuration.shape = CGShape_type.triangle
                    datas.toolsStatus.toolType = ToolsStatus_type.shape;
                    this._onlyChangeLineWidth = true
                } else {
                    configuration.shape = CGShape_type.none
                    datas.toolsStatus.toolType = ToolsStatus_type.pen
                }
                break;
            case "pen_shapeRectangle":
                if (configuration.shape != CGShape_type.rectangle) {
                    configuration.shape = CGShape_type.rectangle
                    datas.toolsStatus.toolType = ToolsStatus_type.shape;

                    this._onlyChangeLineWidth = true
                } else {
                    configuration.shape = CGShape_type.none
                    datas.toolsStatus.toolType = ToolsStatus_type.pen
                }
                break;
            default:

                if (buttonId.indexOf("color") != -1) {
                    let colorIndex = buttonId.replace("color", "")

                    datas.penConfiguration.color = datas.colorDatas[colorIndex]

                }
                break;
        }
        this.setData({
            penConfiguration: configuration
        })
    },
    canvas_errOutput(e) {
        console.log("画布发生错误", e)

    },
    canvas_touchstart(e) {
        this.RunAnimation("closeTools")

        let datas = this.data
        let toolsStatus = datas.toolsStatus
        let touches = e.touches
        let thisPoint = new CGPoint(touches[0].x, touches[0].y)
        let condition = toolsStatus.condition






        for (let i = 0; i < touches.length; i++) {

            const touch = touches[i];
            let mouseAction = new MouseAction(new CGPoint(touch.x, touch.y), touch, e.timeStamp)
            let isExistIndex = mouseAction.isExist(toolsStatus.mouseActions)

            if (isExistIndex == -1) {
                toolsStatus.mouseActions.push(mouseAction)
            }

            // else {
            // toolsStatus.mouseActions[isExistIndex] = mouseAction
            // }/
        }

        //处理多手指事件情况。
        if (touches.length == 2) {

            if (toolsStatus.mouseActions[0].isSameTimeTouch(toolsStatus.mouseActions[1]) == true) {
                console.log("同时按下双指")
                condition.addValue(Condition_Type.twoFinger_sameTimeTouchDown)
                condition.addValue(Condition_Type.twoFinger_gesture)
            } else {
                console.log("后触发式的双指。")
                condition.addValue(Condition_Type.exist_oneFingerTouch)//已经有手指处于按下状态。
            }
        }



        if (condition.meet(Condition_Type.twoFinger_gesture)) {
            return
        }


        switch (toolsStatus.toolType) {

            case ToolsStatus_type.pen:

                drawBoard.addAction(Action_type.line); //开始添加一次绘制事件

                ctx.lineWidth = datas.penConfiguration.lineWidth
                ctx.strokeStyle = datas.penConfiguration.color
                ctx.lineJoin = "round"
                ctx.lineCap = "round"

                var lsAction = drawBoard.getLastAction().mode; //并且开始记录
                lsAction.lineWidth = datas.penConfiguration.lineWidth
                lsAction.color = datas.penConfiguration.color
                lsAction.addPoint(...thisPoint.getJsonArr())
                lsAction.lineDash = datas.penConfiguration.lineDash
                return
            case ToolsStatus_type.shape:
                drawBoard.addAction(Action_type.shape); //开始添加一次绘制事件
                ctx.lineWidth = datas.penConfiguration.lineWidth
                ctx.strokeStyle = datas.penConfiguration.color
                ctx.lineJoin = "round"
                ctx.lineCap = "round"

                var lsAction = drawBoard.getLastAction().mode; //并且开始记录
                lsAction.lineWidth = datas.penConfiguration.lineWidth
                lsAction.color = datas.penConfiguration.color
                lsAction.lineDash = datas.penConfiguration.lineDash
                // datas.penConfiguration.shape = CGShape_type.triangle
                lsAction.type = datas.penConfiguration.shape
                switch (datas.penConfiguration.shape) {
                    case CGShape_type.rectangle:
                        for (let i = 0; i < 5; i++) {
                            lsAction.addPoint(...thisPoint.getJsonArr())//依次添加矩形的四个点。
                        }
                        break;
                    case CGShape_type.roundness:
                        for (let i = 0; i < 2; i++) {
                            lsAction.addPoint(...thisPoint.getJsonArr())//1.原点，2.圆弧点。
                        }
                        break;
                    case CGShape_type.triangle:
                        for (let i = 0; i < 3; i++) {
                            lsAction.addPoint(...thisPoint.getJsonArr())//三角形三个点。
                        }
                        break;
                    default:
                        break;
                }

                return
            case ToolsStatus_type.text:
                this.compute_textInput(thisPoint)
                return

            case ToolsStatus_type.mouse:


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

                    let action = drawBoard.getActionByindex(index)
                    toolsStatus.select.selecting = true
                    toolsStatus.select.touchDown_actionIndex = index

                    toolsStatus.addSelect(index)//必须先执行。

                    condition.addValue(Condition_Type.touchDown_select)
                    condition.addValue(Condition_Type.touchDown_center)

                    this.reloadDrawBoard()

                } else {


                    //点击空白地方，取消所有点的选中状态。
                    // condition.deleteAll()
                    condition.addValue(Condition_Type.touchDown_none)

                    toolsStatus.mouseMoveType = Mouse_MoveType.none
                    toolsStatus.select.actionsIndex = null
                    toolsStatus.select.actionsIndex = []
                    toolsStatus.select.touchDown_actionIndex = -1
                    toolsStatus.select.selecting = false
                    this.reloadDrawBoard()

                }



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
            if (touch.identifier != mouseActions[i].identifier) {
                console.log("错误：移动事件错乱。")
            }
            mouseActions[i].lastPoint = mouseActions[i].endPoint
            mouseActions[i].endPoint = new CGPoint(touch.x, touch.y)

        }

        //先进行全局的两指操作判断。
        if (touches.length == 2) {
            //计算两个手指xy偏差，是否趋近于一样
            condition.addValue(Condition_Type.twoFinger_gesture)
            console.log(mouseActions[0], touches[0])
            this.compute_scrollGesture(toolsStatus)
            return

            //移动时，手指偏差值 乘积为正数
            // if ((Math.abs(finger1_Offest.x) + Math.abs(finger1_Offest.y) + Math.abs(finger2_Offest.x) + Math.abs(finger2_Offest.y)) > 0.8) {
            //     if (finger1_Offest.x * finger2_Offest.x >= 0 || finger1_Offest.y * finger2_Offest.y >= 0) {


            //         if ((finger1_Offest.x == 0 && finger1_Offest.x == finger1_Offest.y) || (finger2_Offest.x == 0 && finger2_Offest.x == finger2_Offest.y)) {
            //             //拉伸。
            //             this.compute_scrollGesture(finger1_Offest, finger2_Offest, false)
            //         } else {
            //             //移动


            //         }
            //     } else {
            //         //拉伸。
            //         this.compute_scrollGesture(finger1_Offest, finger2_Offest, false)
            //     }
            // }

        }
        if (condition.meet(Condition_Type.twoFinger_gesture)) {
            //残余事件。
            return
        }

        switch (toolsStatus.toolType) {
            case ToolsStatus_type.pen:
                //系统的运行逻辑：先加点再进行绘画。
                this.compute_line(thisPoint)

                return;
            case ToolsStatus_type.shape:
                this.compute_shape(thisPoint)
                return
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


                }
                return


            case ToolsStatus_type.mouse:
                if (toolsStatus.mouseMoveType != Mouse_MoveType.multipleSelecting && condition.meet(Condition_Type.touchDown_none)) {
                    toolsStatus.mouseMoveType = Mouse_MoveType.multipleSelecting
                    this.reloadDrawBoard()
                    //状态：进行多选
                }
                if (toolsStatus.mouseMoveType != Mouse_MoveType.model_move && condition.meet(Condition_Type.touchDown_select, Condition_Type.touchDown_center)) {
                    toolsStatus.mouseMoveType = Mouse_MoveType.model_move
                    this.reloadDrawBoard()//开启持续刷新图层样式。
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
                                    case Action_type.shape://shape本质是cgline类，当做cgline处理
                                        const cgline = iAction.mode
                                        cgline.every(function (point) {
                                            point.x += OffestX
                                            point.y += OffestY
                                        })
                                        let time = Date.now()
                                        // this.reloadDrawBoard()
                                        // console.log("完成一次移动所需时间：", Date.now() - time)
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
                        //以上仅计算出图层缩放比例，并不进行图像处理。
                        if (toolsStatus.runReload == false) {
                            toolsStatus.runReload = true
                            this.reloadDrawBoard()
                        }
                        break

                }

                return





        }
    },

    canvas_touchend(e) {//手指离开后，如果还存在手指的话，e里面则仍然存在touches数据。

        this.RunAnimation("opeanTools")



        let toolsStatus = this.data.toolsStatus

        let condition = toolsStatus.condition
        let touches = e.touches
        let lsAction = drawBoard.getLastAction()
        if (condition.meet(Condition_Type.twoFinger_gesture) != true) {
            switch (toolsStatus.toolType) {
                case ToolsStatus_type.mouse:

                    switch (toolsStatus.mouseMoveType) {
                        case Mouse_MoveType.multipleSelecting:

                            let indexs = this.ergodicEach_Action([toolsStatus.mouseActions[0].startPoint, toolsStatus.mouseActions[0].endPoint])
                            toolsStatus.mouseMoveType = Mouse_MoveType.none
                            if (indexs.length > 0) {
                                console.log("选中" + indexs.length + "个图层 ")
                                toolsStatus.select.selecting = true
                                // toolsStatus.select.selecting = true
                            }



                            this.reloadDrawBoard()
                            break;
                        case Mouse_MoveType.model_move:
                            toolsStatus.mouseMoveType = Mouse_MoveType.none
                            this.reloadDrawBoard()
                            break;
                        case Mouse_MoveType.model_felx:
                            let actionsIndex = toolsStatus.select.actionsIndex
                            toolsStatus.runReload = false
                            for (let i = 0; i < actionsIndex.length; i++) {
                                let action = drawBoard.getActionByindex(actionsIndex[i]);
                                this.compute_completeModelFlex(action, toolsStatus.modelFlexData)

                                //删除临时添加的orect属性
                                delete action.oRect

                            }
                            toolsStatus.mouseMoveType = Mouse_MoveType.none
                            toolsStatus.modelFlexData = null;


                            this.reloadDrawBoard()
                            break;
                        default:
                            break;
                    }
                    break

                case ToolsStatus_type.pen:

                    if (lsAction.type == Action_type.line) {
                        if (lsAction.mode.points.length <= 2) { //小于两个点时，删除路径。
                            console.log("路径过短，删除。")

                            drawBoard.actions.splice(drawBoard.actions.length - 1, 1)
                        }
                    }
                    break
                case ToolsStatus_type.shape:

                    if (this.data.penConfiguration.shape == CGShape_type.roundness) {
                        if (lsAction.mode.getRinRoundness() <= 1) { //小于两个点时，删除路径。
                            drawBoard.actions.splice(drawBoard.actions.length - 1, 1)
                        }
                    }
                    break
            }
        }

        //清空鼠标事件和本次条件
        //处理：删除当前松开的手指的mouseAction。
        toolsStatus.deleteMouseActionby(touches)
        if (condition.meet(Condition_Type.twoFinger_sameTimeTouchDown)) {
            condition.deleteValue(Condition_Type.twoFinger_sameTimeTouchDown)
            condition.addValue(Condition_Type.exist_oneFingerTouch)
            console.log("双指后松开了一个手指。")
            //双指的手势还没完全放开
        }

        if (touches.length == 0) {//所有手指全部松开，完成一次事件。
            condition.deleteAll()
            toolsStatus.mouseActions = []
        }

        send(drawBoard)
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


        console.log("正在关闭动画")
        setTimeout(function () {

            let animation_back = wx.createAnimation({
                duration: 400,
                timingFunction: "ease"
            })
            // animation.left(100)
            animation_back.opacity(0)
            animation_back.step()

            let animation_opean = wx.createAnimation({
                duration: 400,
                timingFunction: "ease"
            })
            animation_opean.translate(0, 0);
            animation_opean.step()
            this.setData({
                "animation.background": animation_back.export(),
                "animation.opeanPane": animation_opean.export()

            })
        }.bind(this), 5);

        setTimeout(function () {
            this.setData({
                toolBarDetailindex: -1
            })
            if (this.data.toolsStatus.toolType == ToolsStatus_type.color) {
                this.data.toolsStatus.toolType = this.data.toolsStatus.lastTooType;
                this.setData({
                    "toolsStatus.toolType": this.data.toolsStatus.toolType
                })
            }
        }.bind(this), 500);


    },
    inviteUser(e) {//点击右下角的邀请用户。


    },
    button_settings() {
        console.log("点击了设置按钮");
        this.setData({
            pageVisable: false
        })
        wx.navigateTo(
            {
                url: '/pages/settings/settings',
               
            }

        )
    }
    //-------响应事件写上面------
})
