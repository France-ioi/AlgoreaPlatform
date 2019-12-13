<?php

// File called through json ajax with a token, verifies the token and puts
// informations in a session.

// JSON request (default in AngularJS $http.post) + PHP crazyness, see
// http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/


// First, get out of the parent (LTI wrapper for instance)
if(!isset($_GET['step'])) {
?>
<!doctype html>
<html>
   <head>
   <script src="/bower_components/jschannel/src/jschannel.js" type="text/javascript"></script>
   <script type="text/javascript">
      try {
         window.parent.location.href = window.location.href + '&step=1';
      } catch(e) {}
      // If the above fails, try calling platform.openUrl
      var platform = Channel.build({
         window: window.parent,
         origin: "*",
         scope: "login.france-ioi.org",
         onReady: function() {
            platform.call({
               method: 'platform.openUrl',
               params: window.location.href + '&step=1',
               success: function() {}
               });
         }
      });
   </script>
   </head>
   <body>
   </body>
</html>
<?php
    die();
}
// We're out of any parent, proceed with login

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once(__DIR__.'/../shared/LoginTokenEntry.php');

$loginToken = $_GET['loginToken'];
if (!$loginToken) {
   die('missing loginToken param');
}
session_start();
if(!LoginTokenEntry::apply($loginToken)) {
    $res = '{"result": false, "error": "invalid or empty token"}';
    die($res);
}

function createTempUser($db) {
   $sLogin = 'tmp-'.mt_rand(10000000, 99999999);
   list($userAdminGroupId, $userSelfGroupId) = createGroupsFromLogin($db, $sLogin, 1);
   $userId = getRandomID();
   $stm = $db->prepare("insert into `users` (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`) values (:userId, '0', :sLogin, '1', NOW(), :userSelfGroupId, NULL);");
   $stm->execute(array(
      'userId' => $userId,
      'sLogin' => $sLogin,
      'userSelfGroupId' => $userSelfGroupId
   ));
   $_SESSION['login'] = array(
      'idGroupSelf' => $userSelfGroupId,
      'tempUser'    => 1,
      'ID'          => $userId,
      'sLogin'      => $sLogin,
      'bIsAdmin'    => false,
   );
   echo json_encode(array('result' => true, 'sLogin' => $sLogin, 'ID' => $userId));
}

// user has logged through login platform, we receive the token here:
// we fill the session and, if not already creted, create a new user
require_once(dirname(__FILE__)."/../shared/TokenParser.php");
$tokenParser = new TokenParser($config->login->public_key, $config->login->name);
$params = $tokenParser->decodeJWS($loginToken);
if (!$params || empty($params)) {
   echo '{"result": false, "error": "invalid or empty token"}';
   return;
}
foreach ($params as $param_k => $param_v) {
   $_SESSION['login'][$param_k] = $param_v;
}
$_SESSION['login']['sToken'] = $loginToken;
$_SESSION['login']['tempUser'] = 0;
$_SESSION['login']['loginId'] = $params['idUser'];
$query = 'select ID, idGroupSelf, idGroupOwned, bIsAdmin from users where `loginID`= :idUser ;';
$stm = $db->prepare($query);
$stm->execute(array('idUser' => $params['idUser']));
if(! $stm->rowCount()) {
   list($userAdminGroupId, $userSelfGroupId) = createGroupsFromLogin($db, $params['sLogin']);
   $userId = getRandomID();
   $query = "insert into `users` (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`) values ('$userId', '".$params['idUser']."', '".$params['sLogin']."', '0', NOW(), $userSelfGroupId, $userAdminGroupId);";
   $db->exec($query);
   $_SESSION['login']['ID'] = $userId;
   $_SESSION['login']['idGroupSelf'] = $userSelfGroupId;
   $_SESSION['login']['idGroupOwned'] = $userAdminGroupId;
   $_SESSION['login']['bIsAdmin'] = false;
} else {
   $res = $stm->fetch();
   $_SESSION['login']['ID'] = $res['ID'];
   $_SESSION['login']['idGroupSelf'] = $res['idGroupSelf'];
   $_SESSION['login']['idGroupOwned'] = $res['idGroupOwned'];
   $_SESSION['login']['bIsAdmin'] = $res['bIsAdmin'];
}

// Redirect to the main page now
Header("Location: /");
?>
<!doctype html>
<html>
   <head>
   <script type="text/javascript">
      window.location.href = "/";
   </script>
   </head>
   <body>
   </body>
</html>
