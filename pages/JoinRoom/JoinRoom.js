let  app = getApp();
var url = "https://pykky.com/wechatbwb/BlackWhiteBoard.php";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        list: []
    },

    onLoad: function (options) {
        let that = this ;
        var  arr=[];
        for(var i in app.globalData.roomAllUserInfo){
            arr.push(app.globalData.roomAllUserInfo[i]);
        }//对象转化为数组
       //console.log(arr);
        that.setData({
            list:arr
        });
        console.log("当前页面list数据:",that.data.list);
    },

        //----------------
    tap_oneUserView(e){
        console.log("点击了某个用户id:",e.target.id);
    }
    //-------响应事件写上面------

})