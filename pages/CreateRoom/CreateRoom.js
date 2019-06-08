let  app = getApp();
var url = "https://pykky.com/wechatbwb/BlackWhiteBoard.php";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        //inputValue: null
    },

    onLoad: function (options) {
        
    },

        //----------------
    /* bindKeyInput: function(e) {
        this.setData({
          inputValue: e.detail.value
        })
    }, */
    formSubmit:function (e) {
        console.log("提交了:",e.detail.value.input);
        let subName = e.detail.value.input;
        if (subName === "") {//输入为空的清空
            wx.showModal({
                title: '错误',
                content: '队伍名不能为空！',
                showCancel:false
              });
        }else{
            wx.request({
                url: url,
                data: {
                    "id": app.globalData.userInfo.id,
                    'createRoomName': subName
                },
                success: function (res) {
                    if (res.statusCode == 200) {
                        console.log(res);
                        if (res.data.statusCode == 0) {
                            app.globalData.userInfo.roomID = res.data.data;
                            app.globalData.userInfo.groupName = subName;
                            wx.setStorageSync('roomID', res.data.data);
                            //在这里干点什么。。。清空一下Room数据。。你在这里补一下逻辑
                            wx.navigateTo(
                                {
                                    url: '/pages/CreateRoomSuccess/CreateRoomSuccess'
                                }
                            );
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
        }//if/else
        
    }
    //-------响应事件写上面------

})