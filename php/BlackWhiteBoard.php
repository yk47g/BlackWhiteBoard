<?php
$conn=mysqli_connect('localhost','root','e973538be47c38d8','bwb');//三个参数分别对应服务器名，账号，密码，数据库名
if (mysqli_connect_errno($conn)) {  
    die("连接服务器失败: " . mysqli_connect_error());  
}

//上传图片
$file = $_FILES['image'];
$session = $_POST['session'];
if(!empty($session)){
    //有session，直接通过session查询用户信息
    $sql = "SELECT * FROM `bwb_users` WHERE `session3rd` = '$session'";
    $res = mysqli_query($conn,$sql);
    if($res && mysqli_num_rows($res)){
        if(!empty($file)){
            //获取拓展名
            $exename = $file['name'];
            $imageSavePath = uniqid().substr($exename,strrpos($exename,"."));
            $imageSavePath2 = '/www/wwwroot/blog.pykky.com/wechatbwb/wechatFile/'.$imageSavePath;
            if(move_uploaded_file($file['tmp_name'], $imageSavePath2)){
                echo 'https://pykky.com/wechatbwb/wechatFile/'.$imageSavePath;
                mysqli_close($conn);
                exit;
            }
        }
    }else{
        echo json_encode(array("statusCode"=>7 , "errMsg"=>"error:传入session在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}

//上传图片不能用这个编码
header("charset=utf-8");
include_once "wxBizDataCrypt.php";

function wget($url){
    $info=curl_init();
    curl_setopt($info,CURLOPT_RETURNTRANSFER,true);
    curl_setopt($info,CURLOPT_HEADER,0);
    curl_setopt($info,CURLOPT_NOBODY,0);
    curl_setopt($info,CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($info,CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($info,CURLOPT_URL,$url);
    $output= curl_exec($info);
    curl_close($info);
    return $output;
}

$id = $_GET["id"];

//清空画布数据
$DcurrentRoomid = $_GET["DcurrentRoomid"];
if ((!empty($id)) && (!empty($DcurrentRoomid))){
    $newDrawData = '[{"data":[{"actions":[],"backgroundColor":"","width":2000,"height":2000}],"date":"2019/05/31 21:00:00","id":"'.$id.'","roomID":"'.$DcurrentRoomid.'"}]';
    $sql = "UPDATE `bwb_room` SET `drawBoardData` = '' WHERE `bwb_room`.`roomID` = $DcurrentRoomid";
    $sql = "UPDATE `bwb_room` SET `drawBoardData` = '$newDrawData' WHERE `bwb_room`.`roomID` = $DcurrentRoomid";
    $res = mysqli_query($conn,$sql);
    if($res){
        echo json_encode(array("statusCode"=>0));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>11 , "data"=>null , "errMsg"=>"error:房间id或用户id不存在"));
        mysqli_close($conn);
        exit;
    }
}

//修改队伍名称
$newRoomName = $_GET["newRoomName"];
$currentRoomid = $_GET["currentRoomid"];
if ((!empty($currentRoomid)) && (!empty($newRoomName))){
    $sql = "UPDATE `bwb_room` SET `roomName` = '$newRoomName' WHERE `bwb_room`.`roomID` = $currentRoomid";
    $res = mysqli_query($conn,$sql);
    if($res){
        echo json_encode(array("statusCode"=>0));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>10 , "data"=>null , "errMsg"=>"error:房间不存在"));
        mysqli_close($conn);
        exit;
    }
}

//创建队伍
$createRoomName = $_GET["createRoomName"];
if ((!empty($id)) && (!empty($createRoomName))){
    //检查是否已存在这个队伍名字
    $sql = "SELECT *  FROM `bwb_room` WHERE `roomName` = '$createRoomName'";
    $res = mysqli_query($conn,$sql);
    if($res && mysqli_num_rows($res)){
        echo json_encode(array("statusCode"=>9 , "data"=>null , "errMsg"=>"error:已存在此队伍名字"));
        mysqli_close($conn);
        exit;
    }
    //开始插入
    $sql = "INSERT INTO `bwb_room` (`roomID`, `roomName`, `roomAdminID`, `time`, `drawBoardData`) VALUES (NULL, '$createRoomName', '$id', CURRENT_TIMESTAMP, NULL)";
    $res = mysqli_query($conn,$sql);
    if($res){
        //重新查询这个名字获取对应roomID
        $sql = "SELECT *  FROM `bwb_room` WHERE `roomName` = '$createRoomName'";
        $res = mysqli_query($conn,$sql);
        if($res && mysqli_num_rows($res)){
            $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
            $roomID = $row['roomID'];
            //把这个人的roomID改成新的
            $sql = "UPDATE `bwb_users` SET `roomID` = '$roomID' WHERE `bwb_users`.`id` = $id";
            $res = mysqli_query($conn,$sql);
            //$newDrawData = '[{'.'"'.'data'.'"'.':[],'.'"'.'date'.'"'.':'.'"'.'2019/05/30 00:00:00'.'"'.','.'"'.'id'.'"'.':'.'"'.$id.'"'.','.'"'.'roomID'.'"'.':'.'"'.$roomID.'"'.'}]';
            $newDrawData = '[{"data":[{"actions":[],"backgroundColor":"","width":2000,"height":2000}],"date":"2019/05/31 21:00:00","id":"'.$id.'","roomID":"'.$roomID.'"}]';
            //插入一个空的drawboardData
            $sql = "UPDATE `bwb_room` SET `drawBoardData` = '$newDrawData' WHERE `bwb_room`.`roomID` = $roomID";
            $res2 = mysqli_query($conn,$sql);
            if($res && $res2){
                echo json_encode(array("statusCode"=>0 ,"data"=>$roomID));
                mysqli_close($conn);
                exit;
            }else{
                echo json_encode(array("statusCode"=>11 , "data"=>null , "errMsg"=>"error:更改此人的roomid失败或插入空白drawboardData失败"));
            }
        }
        else{
            echo json_encode(array("statusCode"=>10 , "data"=>null , "errMsg"=>"error:插入数据库失败"));
        }
    }else{
        echo json_encode(array("statusCode"=>8 , "data"=>null , "errMsg"=>"error:传入用户id在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}

//加入队伍
$joinRoomID = $_GET["joinRoomID"];
if ((!empty($id)) && (!empty($joinRoomID))){
    $sql = "UPDATE `bwb_users` SET `roomID` = '$joinRoomID' WHERE `bwb_users`.`id` = $id";
    $res = mysqli_query($conn,$sql);
    if($res){
        echo json_encode(array("statusCode"=>0));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>8 , "data"=>null , "errMsg"=>"error:传入用户id在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}

//退出队伍
$exit = $_GET["exit"];
if ((!empty($id)) && (!empty($exit))){
    $sql = "UPDATE `bwb_users` SET `roomID` = '0' WHERE `bwb_users`.`id` = $id";
    $res = mysqli_query($conn,$sql);
    if($res){
        echo json_encode(array("statusCode"=>0));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>7 , "data"=>null , "errMsg"=>"error:传入用户id在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}


//拿当前房间所有用户信息
$roomid = $_GET["roomid"];
if(!empty($roomid)){
    $sql = "SELECT *  FROM `bwb_users` WHERE `roomID` = $roomid";
    $res = mysqli_query($conn,$sql);
    if($res && mysqli_num_rows($res)){
        //二维数组遍历
        $i = 0;
        while($row=mysqli_fetch_array($res,MYSQLI_ASSOC))//当前行
        {
            $array[$i]['id'] = $row['id'];
            $array[$i]['name'] = $row['name'];
            $array[$i]['avatarUrl'] = $row['avatarUrl'];
            $i = $i+1;
        }
        //$row = mysqli_fetch_all($res,MYSQLI_ASSOC);
        echo json_encode(array("statusCode"=>0 ,"data"=>$array));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>6 ,"errMsg"=>"error:不存在此房间"));
        mysqli_close($conn);
        exit;
    }
}

//拿用户头像函数
if(!empty($id)){
    $sql = "SELECT * FROM `bwb_users` WHERE `id` = $id";
    $res = mysqli_query($conn,$sql);
    if($res && mysqli_num_rows($res)){
        $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
        $iconurl = $row['avatarUrl'];
        echo json_encode(array("statusCode"=>0 ,"data"=>$iconurl));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>5 , "data"=>null , "errMsg"=>"error:传入用户id在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}

//加入队伍
$newRoomID = $_GET["newRoomID"];
if(!empty($newRoomID)){
    $sql = "UPDATE `bwb_users` SET `roomID` = '$newRoomID' WHERE `bwb_users`.`id` = $id";
    $res = mysqli_query($conn,$sql);
    if($res){
        echo json_encode(array("statusCode"=>0));
        mysqli_close($conn);
        exit;
    }else{
        echo json_encode(array("statusCode"=>6 ,"errMsg"=>"error:传入用户id在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}

$session = $_GET["session"];
//先看有没有session
if(!empty($session)){
    //有session，直接通过session查询返回用户信息
    $sql = "SELECT * FROM `bwb_users` WHERE `session3rd` = '$session'";
    $res = mysqli_query($conn,$sql);
    if($res && mysqli_num_rows($res)){
        $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
        $id = $row['id'];
        $name = $row['name'];
        $iconurl = $row['avatarUrl'];
        $roomID = $row['roomID'];
         if($roomID == 0){
            $groupName = "未加入协作";
        }else{
            $sql = "SELECT *  FROM `bwb_room` WHERE `roomID` = $roomID";
            $res = mysqli_query($conn,$sql);
            if($res && mysqli_num_rows($res)){
                $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
                $groupName = $row['roomName'];
                $drawBoardData = $row['drawBoardData'];
            }else{
                echo json_encode(array("statusCode"=>97 , "data"=>$res , "errMsg"=>"error:账户绑定的协作不存在"));
                mysqli_close($conn);
                exit;
            }
        }
        echo json_encode(array("statusCode"=>100 ,"id"=>$id , "name"=>$name , "iconurl"=>$iconurl , "roomID"=>$roomID , "groupName"=>$groupName, "drawBoardData"=>$drawBoardData));
        
    }else{
        echo json_encode(array("statusCode"=>99 , "data"=>null , "errMsg"=>"error:传入session在数据库中不存在"));
        mysqli_close($conn);
        exit;
    }
}
else{
    //通过微信服务器获取信息
    $appid = "wx63f9ffa3f1044331";
    $appscret = "76cf019fe23970b90284f85975720fd3";
    
    $code = $_GET["code"];
    if(!empty($code)){
        $url = 'https://api.weixin.qq.com/sns/jscode2session?appid='.$appid.'&secret='.$appscret.'&js_code='.$code.'&grant_type=authorization_code';
        $codeInfo = wget($url);//get请求网址，获取数据
        $codeInfo = json_decode($codeInfo,true);//对json数据解码
        $openid = $codeInfo['openid'];
        $session_key = $codeInfo['session_key'];
        if(empty($openid)){
            echo json_encode(array("statusCode"=>1 , "data"=>null , "errMsg"=>$codeInfo));
            mysqli_close($conn);
            exit;
        }
        
        $signature = $_GET["signature"];
        $signature2 = sha1($_GET['rawData'].$session_key);
        if ($signature != $signature2) {
            echo json_encode(array("statusCode"=>2 , "data"=>$signature2,"data2"=>$signature ,"key"=>$session_key, "errMsg"=>"error:数据校验失败"));
            mysqli_close($conn);
            exit;
        }

        $encryptedData = $_GET['encryptedData'];
        $iv = $_GET['iv'];
        $pc = new WXBizDataCrypt($appid, $session_key);
        $errCode = $pc->decryptData($encryptedData, $iv, $realData);
        if (empty($realData) || ($errCode != 0)) {
            echo json_encode(array("statusCode"=>3 , "data"=>null , "errMsg"=>"error:解密数据失败"));
            mysqli_close($conn);
            exit;
        }
        $realData = json_decode($realData,true);//对解密数据进行解码

        //处理同一个微信号不同设备的情况
        $openid = $realData['openId'];
        $sql = "SELECT * FROM `bwb_users` WHERE `openid` = '$openid'";//改为openid验证
        $res = mysqli_query($conn,$sql);
        if($res && mysqli_num_rows($res)){
            $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
            $id = $row['id'];
            $name = $row['name'];
            $iconurl = $row['avatarUrl'];
            $session = $row['session3rd'];
            $roomID = $row['roomID'];
            if($roomID == 0){
                $groupName = "未加入协作";
            }else{
                $sql = "SELECT *  FROM `bwb_room` WHERE `roomID` = $roomID";
                $res = mysqli_query($conn,$sql);
                if($res){
                    $row = mysqli_fetch_array($res,MYSQLI_ASSOC);
                    $groupName = $row['roomName'];
                    $drawBoardData = $row['drawBoardData'];
                }else{
                    echo json_encode(array("statusCode"=>96 , "data"=>$res , "errMsg"=>"error:账户绑定的协作不存在"));
                    mysqli_close($conn);
                    exit;
                }
            }
            echo json_encode(array("statusCode"=>100 , "id"=>$id , "name"=>$name , "iconurl"=>$iconurl , "session"=>$session, "roomID"=>$roomID , "groupName"=>$groupName, "drawBoardData"=>$drawBoardData));
            //exit;
        }else{
            //生成第三方3rd_session
            $session3rd  = null;
            $strPol = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
            $max = strlen($strPol)-1;
            for($i=0;$i<16;$i++){
                $session3rd .=$strPol[rand(0,$max)];
            }
        
            //写入数据库
            $name = $realData['nickName'];
            $sex = $realData['gender'];
            $city = $realData['city'];
            $province = $realData['province'];
            $country = $realData['country'];
            $avatarUrl = $realData['avatarUrl'];
            if(empty($name)){
                echo 'fail!';
                echo $realData;
                mysqli_close($conn);
                exit;
            }
            $sql = "INSERT INTO `bwb_users` (`id`, `name`, `roomID`, `sex`, `city`, `province`, `country`, `avatarUrl`, `openid`, `unionid`, `session3rd`, `time`) VALUES (NULL, '$name', 0, $sex, '$city', '$province', '$country', '$avatarUrl', '$openid', '$unionid', '$session3rd', CURRENT_TIMESTAMP)";
            $res = mysqli_query($conn,$sql);
            if($res){
                echo json_encode(array("statusCode"=>0 , "data"=>$session3rd , "errMsg"=>"success"));
                //exit;
            }else{
                echo json_encode(array("statusCode"=>4 , "data"=>mysqli_error($conn) , "errMsg"=>"error:写入数据库失败"));
                //exit;
            }
        }
    }else{
        echo json_encode(array("statusCode"=>98 , "data"=>$session3rd , "errMsg"=>"error:没有session，且传入code为空"));
    }
    
}

mysqli_close($conn);


?>
