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

    onShow: function (options) {
        
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
                if (new2iconUrl === "") {//没有第二个人
                    new2iconUrl = "/icons/user.png";
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
        let that = this;
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
    tap_DeleteGroup(e){
        let that = this;
        console.log("点击了退出协作按钮");
        wx.showModal({
            title: '提示',
            content: '退出将清空您的笔画数据，确定要退出当前协作？',
            success (res11) {
              if (res11.confirm) {
                console.log('用户点击确定');
                wx.request({
                    url: url,
                    data: {
                        "id": app.globalData.userInfo.id,
                        'exit': 1
                    },
                    success: function (res) {
                        if (res.statusCode == 200) {
                            if (res.data.statusCode == 0) {
                                getCurrentPages()[0].response_Reset()
                                
                                wx.showModal({
                                    title: '提示',
                                    content: '已成功退出队伍',
                                    showCancel:false
                                  });
                                  app.globalData.userInfo.roomID = 0;
                                  wx.setStorageSync('roomID', '0');
                                that.setData({
                                    noGroup:true,
                                    groupUser1iconUrl: "/icons/user.png",
                                    groupUser2iconUrl: "/icons/user.png",
                                    groupUser3iconUrl: "/icons/user.png",
                                    groupName: "未加入协作",
                                    status:"已登陆"
                                })
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
              } else if (res11.cancel) {
                console.log('用户点击取消');
              }
            }
          })
          
    },

    tap_CreateGroup(e){
        let that = this;
        console.log("点击了加入或创建协作按钮");
        wx.showActionSheet({
            itemList: ['加入协作', '创建协作'],
            success (res) {
              if (res.tapIndex === 0) {//加入
                wx.navigateTo(
                    {
                        url: '/pages/JoinRoom/JoinRoom',
                        complete:function(){
                            setTimeout(function(){
                                that.setData({
                                    pageVisable:true
                                })
                            },1000)
                            
                        }
                    }
                    
                )
              }
              if (res.tapIndex === 1) {//创建
                wx.navigateTo(
                    {
                        url: '/pages/CreateRoom/CreateRoom',
                        complete:function(){
                            setTimeout(function(){
                                that.setData({
                                    pageVisable:true
                                })
                            },1000)
                            
                        }
                    }
                    
                )
              }
            },
            fail (res) {
              console.log(res.errMsg)
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
                                                                        if (new2iconUrl === "") {//没有第二个人
                                                                            new2iconUrl = "/icons/user.png";
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
            
    },
    exportPage_onClick(e){
      let oPage = getCurrentPages()[0]
      oPage._exportImage = true
        console.log(oPage)
        wx.navigateBack({
            delta:1
        })
    
    },
    introduce_onClick(e){
        wx.setStorageSync("AlreadyIntroduce")//清空已读记录。
        wx.navigateBack({
            delta:1
        })
        
    },
  drawSet_onClick(){
    wx.showToast({
        title: "功能开发中...",
        icon: "none"
    })
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