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
        let subID = e.detail.value.input;
        var re = /^\d+$/; //正则表达式判断字符串是否为数字
        if (!re.test(subID)) {　
           console.log("不是数字");
           wx.showModal({
            title: '错误',
            content: '输入的房间ID必须为数字',
            showCancel:false
          });
        }else{
            wx.request({
                url: url,
                data: {
                    "id": app.globalData.userInfo.id,
                    'joinRoomID': subID
                },
                success: function (res) {
                    if (res.statusCode == 200) {
                        if (res.data.statusCode == 0) {
                            wx.showToast({
                                title: '已成功加入协作',
                                icon: "success",
                                duration: 2000
                            })
                            setTimeout(function () {
                                wx.navigateBack({
                                    delta:1
                                });
                            },500);
                        } else {
                            console.log(res.data.errMsg);
                            wx.showToast({
                                title: '协作加入失败',
                                icon: "none",
                                duration: 2000
                            })
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
    //-------响应事件写上面------

})