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
            if (app.globalData.userInfo.groupName === "未加入协作") {
                that.setData({
                    usericonUrl: app.globalData.userInfo.iconurl,
                    userName: app.globalData.userInfo.name,
                    userId: app.globalData.userInfo.id,
                    groupName: app.globalData.userInfo.groupName,
                    status: "已登陆",
                    noGroup: true
                });
            }else{
                //遍历房间所有用户信息的头像
                $j=0;
                var new1iconUrl = "";
                var new2iconUrl = "";
                var new3iconUrl = "";
                for(var i in app.globalData.roomAllUserInfo){
                    if($j==0){
                        new1iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;
                    }
                    if ($j==1) {
                        new2iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;
                    }
                    if ($j==2) {
                        new3iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;
                        
                    }
                    $j = $j+1;
                }
                if (new3iconUrl === "") {//没有第三个人
                    new3iconUrl = "/icons/user.png";
                }
                that.setData({
                    usericonUrl: app.globalData.userInfo.iconurl,
                    groupUser1iconUrl: new1iconUrl,
                    groupUser2iconUrl: new2iconUrl,
                    groupUser3iconUrl: new3iconUrl,
                    userName: app.globalData.userInfo.name,
                    userId: app.globalData.userInfo.id,
                    groupName: app.globalData.userInfo.groupName,
                    status: "协作中",
                    noGroup: false
                });
            }
            
        }
        
    },

        //----------------
    bind_GetUserInfo(e){
        this.applyPermission();       
    },
    tap_more(e){
        console.log("点击了更多用户省略号按钮");
        let that = this
        this.setData({
            pageVisable:false
        })
        wx.navigateTo(
            {
                url: '/pages/roomAllUsers/roomAllUsers',
                complete:function(){
                    setTimeout(function(){
                        that.setData({
                            pageVisable:true
                        })
                    },1000)
                    
                }
            }
            
        )
    },
    tap_CreateGroup(e){
        console.log("点击了退出协作按钮");
        wx.showModal({
            title: '提示',
            content: '退出将清空您的笔画数据，确定要退出当前协作？',
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
          
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
                                                    if (app.globalData.userInfo.groupName === "未加入协作") {
                                                        that.setData({
                                                            usericonUrl: app.globalData.userInfo.iconurl,
                                                            userName: app.globalData.userInfo.name,
                                                            userId: app.globalData.userInfo.id,
                                                            groupName: app.globalData.userInfo.groupName,
                                                            status: "已登陆",
                                                            noGroup: true,
                                                            ShowgetUserInfoView: false
                                                        });
                                                    }else{
                                                        //获取当前队伍里所有人的信息
                                                        wx.request({
                                                            url: url,
                                                            data: {
                                                                "roomid": app.globalData.userInfo.roomID,
                                                            },
                                                            success: function (res) {
                                                                if (res.statusCode == 200) {
                                                                    if (res.data.statusCode == 0) {
                                                                        //console.log("所有用户信息:", res.data.data);//传回来一个数组
                                                                        for (var i = 0; i < res.data.data.length; i++) {
                                                                            app.globalData.roomAllUserInfo[String(res.data.data[i].id)] = res.data.data[i];
                                                                        }//key为用户id，传入每个用户详细信息对象
                                                                        console.log("房间所有用户的信息:",app.globalData.roomAllUserInfo);
                                                                        //遍历房间所有用户信息的头像
                                                                        $j=0;
                                                                        var new1iconUrl = "";
                                                                        var new2iconUrl = "";
                                                                        var new3iconUrl = "";
                                                                        for(var i in app.globalData.roomAllUserInfo){
                                                                            if($j==0){
                                                                                new1iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;
                                                                            }
                                                                            if ($j==1) {
                                                                                new2iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;
                                                                            }
                                                                            if ($j==2) {
                                                                                new3iconUrl = app.globalData.roomAllUserInfo[i].avatarUrl;

                                                                            }
                                                                            $j = $j+1;
                                                                        }
                                                                        if (new3iconUrl === "") {//没有第三个人
                                                                            new3iconUrl = "/icons/user.png";
                                                                        }
                                                                        that.setData({
                                                                            usericonUrl: app.globalData.userInfo.iconurl,
                                                                            groupUser1iconUrl: new1iconUrl,
                                                                            groupUser2iconUrl: new2iconUrl,
                                                                            groupUser3iconUrl: new3iconUrl,
                                                                            userName: app.globalData.userInfo.name,
                                                                            userId: app.globalData.userInfo.id,
                                                                            groupName: app.globalData.userInfo.groupName,
                                                                            status: "协作中",
                                                                            noGroup: false,
                                                                            ShowgetUserInfoView: false
                                                                        });
                                                                        console.log("数据库存在此用户，下载用户数据完成");
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