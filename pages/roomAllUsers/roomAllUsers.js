let  app = getApp();
var url = "https://pykky.com/wechatbwb/BlackWhiteBoard.php";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        list: []
    },

    onLoad: function (options) {
        let that = this ;
        var  arr=[];
        for(var i in app.globalData.roomAllUserInfo){
            arr.push(app.globalData.roomAllUserInfo[i]);
        }//对象转化为数组
       //console.log(arr);
        that.setData({
            list:arr
        });
        console.log("当前页面list数据:",that.data.list);
    },

        //----------------
    tap_oneUserView(e){
        console.log("点击了某个用户id:",e.target.id);
    },
    //-------响应事件写上面------
    onShareAppMessage: function (res) {
        console.log('用户点击了分享',res)
        let romid = wx.getStorageSync('roomID');
        console.log(romid);
        if (romid === "0" || romid === "") {
            //还没加入房间，分享小程序本身
            return {
                title: '叮咚协作白板',
                path: '/pages/drawBoard/drawBoard',
                imageUrl: 'https://pykky.com/wechatbwb/bwbCode2.jpg'
            }       
        } else {
            //已加入小程序，分享房间邀请信息
            return {
                title: '点击加入协作',
                path: '/pages/drawBoard/drawBoard?romid=' + romid
            }
        }
    }
})