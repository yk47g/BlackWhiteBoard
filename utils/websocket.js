var url = 'wss://pykky.com/wss/';//服务器地址

function connect(user,func) {

    wx.connectSocket({
        url: url,
        header:{'content-type': 'application/json'},
        success: function () {
            console.log('wesocket信道开始连接');
        },

        fail: function () {
            console.log('websocket信道连接失败，请检查！');
            wx.showToast({
                title: '连接失败,请重试！',
                icon: "none",
                duration: 2000
            })
        }
    })
 
    wx.onSocketOpen(function (res) {
        wx.showToast({
            title: '连接成功',
            icon: "success",
            duration: 2000
        })
        console.log('连接成功且已开通websocket信道');

        //接受服务器消息
        wx.onSocketMessage(func);//func回调可以拿到服务器返回的数据
    });
 
    wx.onSocketError(function (res) {
        console.log('websocket信道连接失败，请检查！');
        wx.showToast({
            title: '连接失败,请重试！',
            icon: "none",
            duration: 2000
        })
    })
 
}
 
//发送消息
function send(msg) {
    wx.sendSocketMessage({
        data: msg
    });
}

module.exports = {
    connect: connect,
    send: send
}