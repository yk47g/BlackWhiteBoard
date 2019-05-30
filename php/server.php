
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
        echo "收到了数据:{$user_message}\n";
        $jsData = json_decode($user_message,true);
        $roomID = $jsData['roomID'];
        $id = $jsData['id'];
        $newDrawBoardData = $jsData['data'];
        $conn=mysqli_connect('localhost','root','e973538be47c38d8','bwb');//三个参数分别对应服务器名，账号，密码，数据库名
        if (mysqli_connect_errno($conn)) {  
        echo "连接服务器失败: " . mysqli_connect_error();  
        }
        $sql = "SELECT *  FROM `bwb_room` WHERE `roomID` = $roomID";
        $res = mysqli_query($conn,$sql);
        if($res && mysqli_num_rows($res)){
            $row = mysqli_fetch_array($res);
            $oldDrawBoardData = $row['drawBoardData'];
            $oldDrawBoardData = json_decode($oldDrawBoardData,true);
            for($i=0;$i<count($oldDrawBoardData);$i++){
                if($oldDrawBoardData[$i]['id'] == $id){//存在这个id，更新这个id的数据
                    $oldDrawBoardData[$i]['data'] = $newDrawBoardData;
                    $oldDrawBoardData = json_encode($oldDrawBoardData);
                    $sql = "UPDATE `bwb_room` SET `drawBoardData` = '$oldDrawBoardData' WHERE `bwb_room`.`roomID` = $roomID";
                    $res = mysqli_query($conn,$sql);
                    if($res){
                        echo "已更新该用户画布数据\n";
                        break;
                    }else{
                        echo "更新该用户画布数据失败\n";
                        break;
                    }
                }else{//数据库里没有这个id的数据，直接插入一个
                    $oldDrawBoardData[$i+1] = $jsData;
                    $oldDrawBoardData = json_encode($oldDrawBoardData);
                    $sql = "UPDATE `bwb_room` SET `drawBoardData` = '$oldDrawBoardData' WHERE `bwb_room`.`roomID` = $roomID";
                    $res = mysqli_query($conn,$sql);
                    if($res){
                        echo "数据库里没有该用户画布数据，已成功新建\n";
                        break;
                    }else{
                        echo "新建该用户画布数据失败\n";
                        break;
                    }
                }
            }
        }else{
            echo "error:账户绑定的房间不存在\n";
        }
        mysqli_close($conn);
    }
});

//关闭时的一个回调
$server->on('close', function ($ser, $fd) {
    echo "client {$fd} 已断开连接\n";
});

$server->start();

?>