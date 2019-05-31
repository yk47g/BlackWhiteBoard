let  app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        roomID: null
    },

    onLoad: function () {
        this.setData({
            roomID: app.globalData.userInfo.roomID
        })
    },

        //----------------
    tapBtn:function (e) {
        console.log("点击了返回按钮");
        wx.navigateBack({
            delta:2
        });
    }
    //-------响应事件写上面------

})