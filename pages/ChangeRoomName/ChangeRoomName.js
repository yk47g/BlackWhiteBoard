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
                content: '协作名称不能为空！',
                showCancel:false
              });
        }else{
            wx.request({
                url: url,
                data: {
                    "currentRoomid": app.globalData.userInfo.roomID,
                    'newRoomName': subName
                },
                success: function (res) {
                    if (res.statusCode == 200) {
                        console.log(res);
                        if (res.data.statusCode == 0) {
                            app.globalData.userInfo.groupName = subName;
                            wx.navigateTo(
                                {
                                    url: '/pages/ChangeRoomNameSuccess/ChangeRoomNameSuccess'
                                }
                            );
                        } else {
                            wx.showModal({
                                title: '错误',
                                content:res.data.errMsg,
                                showCancel:false
                              });
                            
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