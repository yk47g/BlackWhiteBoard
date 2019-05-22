Page({

    /**
     * 页面的初始数据
     */
    data: {
        usericonUrl: "/icons/user.png",
        groupUser1iconUrl: "/icons/user.png",
        groupUser2iconUrl: "/icons/user.png",
        groupUser3iconUrl: "/icons/user.png",
        ADDgroupUsericonUrl: "/icons/user.png",
        userName: "钢铁侠",
        userId: 8888888,
        groupName: "Avengers"
    },

    onLoad: function (options) {
        // 查看是否授权
        let that = this ;
        this.applyPermission()
    },

        //----------------
        bind_GetUserInfo(e){
        this.applyPermission()
    
        },
      
        applyPermission() {
            let that = this;
            wx.getSetting({
                success(res) {

                    if (res.authSetting['scope.userInfo']) {
                        console.log("用户已授权基本信息。")
                        // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                        wx.getUserInfo({
                        success(res) {
                            console.log(res.userInfo)
                            app.globalData.userInfo = res.userInfo;
                        that.setData({
                            usericonUrl: app.globalData.userInfo.avatarUrl
                            })
                        }
                        })
                    } else {
                        console.log("用户未授权user信息")
                    }
                }
            })
        }
    //-------响应事件写上面------

})