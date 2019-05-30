App({

  globalData:{
    session: "",
    userInfo: {
      iconurl:"",
      name:"",
      id:null,
      groupName:"未加入协作",
      roomID:0
    },
    roomAllUserInfo:{
    },
    systemInfo:{}
  },
  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    
    wx.getSystemInfo({
      success: (res)=> {
        this.globalData.systemInfo = res
          console.log("获取系统信息完成。")
      },
    })
    //获取缓存中的session
    this.globalData.session = wx.getStorageSync("session");
    this.globalData.userInfo.roomID = wx.getStorageSync("roomID");//检测缓存中是否有session和roomid并存入全局变量中
    
    //读取二维码进来后保存roomid到缓存中
        //。。。
        //

    //console.log(this.globalData.session);
    if (this.globalData.session === "") {
      console.log("缓存中无seesion,用户未登录");
    }
    

  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    console.log("app_Onshow",options)
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {
  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {
    
  }
})
