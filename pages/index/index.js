let  app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    usericonUrl:"../../icons/user.png"
  },
  


  //页面加载事件----------------

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 查看是否授权
    let that = this ;
  
    this.applyPermission()
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  },
  //单击事件----------------
  onGetUserInfo(e){
    this.applyPermission().then(res=>{
      console.log("拿到数据了：",res)
      return res
    }).then(res=>{
      console.log("继续下一件事。",res)
    })
    console.log("继续了。")
  },
  //----------------
  applyPermission() {
    let that = this;
    var p = new Promise(function (resolve, reject) {
      wx.getSetting({
        success(res) {
          if (res.authSetting['scope.userInfo']) {
            console.log("用户已授权基本信息。")
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称
            wx.getUserInfo({
              success(res) {
                console.log(res.userInfo)
                app.globalData.userInfo = res.userInfo;
                console.log(app.globalData.userInfo.avatarUrl)
                resolve(res);
                that.setData({
                  usericonUrl: app.globalData.userInfo.avatarUrl
                })
              }
            })
          } else {
            console.log("用户未授权user信息")
  
          }
  
          if (res.authSetting['scope.writePhotosAlbum'] != true) {
            console.log("用户未授权相册功能。")
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success() {
                console.log("用户点击同意授权。")
              }
            })
          } else {
            console.log("用户已授权相册功能。")
          }
  
        }
      })
    })
    return p 
   
  }

  

})