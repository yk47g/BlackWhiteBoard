let  app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        roomName: null
    },

    onLoad: function () {
        this.setData({
            roomName: app.globalData.userInfo.groupName
        })
    },

        //----------------
    tapBtn:function (e) {
        console.log("点击了返回按钮");
        wx.reLaunch({
            url: '/pages/drawBoard/drawBoard'
        });
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