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
        userId: 8888888,
        groupName: "未加入协作"
    },

    onLoad: function (options) {
        // 查看是否已获取信息
        let that = this ;
        if (app.globalData.userInfo.id === null) {
            ShowgetUserInfoView: true;
            this.applyPermission();
        }else{
            that.setData({
                usericonUrl: app.globalData.userInfo.iconurl,
                userName: app.globalData.userInfo.name,
                userId: app.globalData.userInfo.id,
                groupName: app.globalData.userInfo.groupName
            });
        }
        
    },

        //----------------
    bind_GetUserInfo(e){
        this.applyPermission();       
    },
    
    applyPermission() {
        let that = this;
        //是否已登陆判断,上传session拿信息
        if (!(app.globalData.session === "")) {
            wx.request({
                url:url,
                data:{
                    "session" : app.globalData.session,
                },
                success: function(res){
                    if (res.statusCode == 200) {
                        console.log(res.data);
                        if (res.data.statusCode == 0) {
                            app.globalData.userInfo.id=res.data.id;
                            app.globalData.userInfo.name=res.data.name;
                            app.globalData.userInfo.iconurl=res.data.iconurl;
                            app.globalData.userInfo.groupName=res.data.groupName;
                            app.globalData.userInfo.roomID=res.data.roomID;
                            
                            that.setData({
                                usericonUrl: app.globalData.userInfo.iconurl,
                                userName: app.globalData.userInfo.name,
                                userId: app.globalData.userInfo.id,
                                groupName: app.globalData.userInfo.groupName
                            });
                        }
                        else{
                            console.log(res.data.errMsg);
                        }
                    }
                    else{
                        console.log(res.errMsg);
                    }
                },
                fail: function(e){
                    console.log(e);
                }
            });
        }else{
            wx.getSetting({
                success(res) {
                    if (res.authSetting['scope.userInfo']) {
                        console.log("用户已授权基本信息。");
                        // 已经授权，可以直接调用 getUserInfo 获取头像昵称

                        wx.login({
                            success: function(data){
                                var code = data.code;
                                console.log(code);
                                wx.getUserInfo({
                                    success: function(res) {
                                        var rawData = res.rawData;
                                        var signature = res.signature;
                                        var encryptedData = res.encryptedData; 
                                        var iv = res.iv;
                                        console.log(res);
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
                                                    console.log(res.data);
                                                    if (res.data.statusCode == 0) {//新用户
                                                        wx.setStorageSync('session', res.data.data);
                                                        app.globalData.session=res.data.data;
                                                        that.setData({
                                                            usericonUrl: app.globalData.userInfo.avatarUrl,
                                                            userName: app.globalData.userInfo.nickName
                                                        });
                                                    }else if (res.data.statusCode == 100) {//数据库中已存在此用户，不同设备
                                                        wx.setStorageSync('session', res.data.session);
                                                        app.globalData.session=res.data.session;
                                                        app.globalData.userInfo.id=res.data.id;
                                                        app.globalData.userInfo.name=res.data.name;
                                                        app.globalData.userInfo.iconurl=res.data.iconurl;
                                                        app.globalData.userInfo.groupName=res.data.groupName;
                                                        app.globalData.userInfo.roomID=res.data.roomID;
                                                        that.setData({
                                                            usericonUrl: app.globalData.userInfo.iconurl,
                                                            userName: app.globalData.userInfo.name,
                                                            userId: app.globalData.userInfo.id,
                                                            groupName: app.globalData.userInfo.groupName
                                                        });
                                                    }else{
                                                        console.log(res.data.errMsg);
                                                    }
                                                }
                                                else{
                                                    console.log(res.errMsg);
                                                }
                                            },
                                            fail: function(e){
                                                console.log(e);
                                            }
                                        });
                                    }
                                })
                                
                            }
                        });
                    } else {
                        console.log("用户未授权user信息");
                        that.setData({
                            ShowgetUserInfoView: true
                        });
                    }
                }
            });
        }
            
    }
    //-------响应事件写上面------

})