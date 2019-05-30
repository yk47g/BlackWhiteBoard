let  app = getApp();
var url = "https://pykky.com/wechatbwb/BlackWhiteBoard.php";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        usericonUrl: "/icons/user.png",
        groupUser1iconUrl: "/icons/user.png",
        groupUser2iconUrl: "/icons/user.png",
        groupUser3iconUrl: "/icons/user.png",
        ShowgetUserInfoView: false,
        userName: "未登录",
        status: "",
        groupName: "未加入协作",
        noGroup: true
    },

    onLoad: function (options) {
        
        let that = this ;

        // 查看是否已获取个人信息
        if (app.globalData.userInfo.id === null) {//没登录
            ShowgetUserInfoView: true;
            this.applyPermission();
        }else{
            var newStatus = "";
            var newNoGroup = true;
            if (app.globalData.userInfo.groupName === "未加入协作") {
                newStatus = "已登陆";
                newNoGroup = true;
            }else{
                newStatus = "协作中"
                newNoGroup = false;
            }
            that.setData({
                usericonUrl: app.globalData.userInfo.iconurl,
                userName: app.globalData.userInfo.name,
                userId: app.globalData.userInfo.id,
                groupName: app.globalData.userInfo.groupName,
                status: newStatus,
                noGroup: newNoGroup
            });
        }
        
    },

        //----------------
    bind_GetUserInfo(e){
        this.applyPermission();       
    },
    
    applyPermission() {
        let that = this;
        wx.getSetting({
            success(res) {
                if (res.authSetting['scope.userInfo']) {
                    console.log("用户已授权");
                    // 已经授权，可以直接调用 getUserInfo
                    wx.login({
                        success: function(data){
                            var code = data.code;
                            console.log("code:"+code);
                            wx.getUserInfo({
                                success: function(res) {
                                    var rawData = res.rawData;
                                    var signature = res.signature;
                                    var encryptedData = res.encryptedData; 
                                    var iv = res.iv;
                                    console.log("getuserinfo_res:",res);
                                    app.globalData.userInfo = res.userInfo;
                                    
                                    wx.request({
                                        url:url,
                                        data:{
                                            "code" : code,
                                            "rawData" : rawData,
                                            "signature" : signature,
                                            "iv" : iv,
                                            "encryptedData": encryptedData
                                        },
                                        success: function(res){
                                            if (res.statusCode == 200) {
                                                console.log("request_Data:",res.data);
                                                if (res.data.statusCode == 0) {//新用户
                                                    wx.setStorageSync('session', res.data.data);
                                                    wx.setStorageSync('roomID', res.data.roomID);
                                                    app.globalData.session=res.data.data;
                                                    that.setData({
                                                        usericonUrl: app.globalData.userInfo.avatarUrl,
                                                        userName: app.globalData.userInfo.nickName,
                                                        ShowgetUserInfoView: false,
                                                        status: "已登陆"
                                                    });
                                                    console.log("数据库不存在此用户，创建用户完成");
                                                }else if (res.data.statusCode == 100) {//数据库中已存在此用户，不同设备
                                                    wx.setStorageSync('session', res.data.session);
                                                    wx.setStorageSync('roomID', res.data.roomID);
                                                    app.globalData.session=res.data.session;
                                                    app.globalData.userInfo.id=res.data.id;
                                                    app.globalData.userInfo.name=res.data.name;
                                                    app.globalData.userInfo.iconurl=res.data.iconurl;
                                                    app.globalData.userInfo.groupName=res.data.groupName;
                                                    app.globalData.userInfo.roomID=res.data.roomID;
                                                    var newStatus = "";
                                                    var newNoGroup = true;
                                                    if (app.globalData.userInfo.groupName === "未加入协作") {
                                                        newStatus = "已登陆";
                                                        newNoGroup = true;
                                                    }else{
                                                        newStatus = "协作中"
                                                        newNoGroup = false;
                                                    }
                                                    that.setData({
                                                        usericonUrl: app.globalData.userInfo.iconurl,
                                                        userName: app.globalData.userInfo.name,
                                                        userId: app.globalData.userInfo.id,
                                                        groupName: app.globalData.userInfo.groupName,
                                                        ShowgetUserInfoView: false,
                                                        status: newStatus,
                                                        noGroup: newNoGroup
                                                    });
                                                    console.log("数据库存在此用户，下载用户数据完成");
                                                }else{
                                                    console.log(res.data.errMsg);
                                                }
                                            }
                                            else{
                                                console.log(res.errMsg);
                                            }
                                        },//request.success
                                        fail: function(e){
                                            console.log("request.fail:",e);
                                        }//request.fail
                                    });//request
                                }//getUserInfo.success
                            })//getUserInfo
                            
                        }//login.success
                    });//login
                } else {
                    console.log("用户未授权user信息");
                    that.setData({
                        ShowgetUserInfoView: true
                    });
                }
            }//getSetting.success
        });//getSetting
            
    }
    //-------响应事件写上面------

})