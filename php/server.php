
<?php
$server = new swoole_websocket_server("0.0.0.0", 9090);
//只需要绑定要监听的ip和端口。如果ip指定为127.0.0.1，则表示客户端只能位于本机才能连接，其他计算机无法连接。

//握手完毕后回调函数
$server->on('open', function (swoole_websocket_server $server, $request) {
    echo "连接成功,client:{$request->fd}\n";
});

//有消息到达时的回调函数
$server->on('message', function (swoole_websocket_server $server, $frame) {//frame客户端发来的数据帧信息
    // $server->connections 遍历所有websocket连接用户的fd，给所有用户推送
    foreach($server->connections as $key => $fd) {//$frame->fd 客户端的socket id
        $user_message = $frame->data;//$frame->data数据内容
        $server->push($fd, $user_message);
        echo "client:{$fd}\n";
        echo "收到了数据:$user_message\n";
        
    }
});

//关闭时的一个回调
$server->on('close', function ($ser, $fd) {
    echo "client {$fd} 已断开连接\n";
});

$server->start();

?>