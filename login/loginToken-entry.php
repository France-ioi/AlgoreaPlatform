<?php

// File called through json ajax with a token, verifies the token and puts
// informations in a session.

// JSON request (default in AngularJS $http.post) + PHP crazyness, see
// http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once(__DIR__.'/../shared/connect.php');
require_once(__DIR__.'/../shared/listeners.php');
require_once(__DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php');

$loginToken = $_GET['loginToken'];
if (!$loginToken) {
   die('missing loginToken param');
}

session_start();
if (!isset($_SESSION['login'])) { $_SESSION['login'] = array(); };

function createGroupsFromLogin($db, $sLogin, $isTempUser=0) {
   $userSelfGroupId = getRandomID();
   $query = "insert into `groups` (`ID`, `sName`, `sDescription`, `sDateCreated`, `bOpened`, `sType`, `bSendEmails`) values ('".$userSelfGroupId."', '".$sLogin."', '".$sLogin."', NOW(), 0, 'UserSelf', 0);";
   $db->exec($query);
   $userAdminGroupId = null;
   if ($isTempUser) {
      $stm = $db->prepare('select ID from groups where `sTextId`=\'RootTemp\';');
      $stm->execute();
      $RootTempGroupId = $stm->fetchColumn();
      $db->exec("lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = '$RootTempGroupId'),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values ($RootTempGroupId, '$userSelfGroupId', @maxIChildOrder+1); unlock tables;");
   } else {
      $userAdminGroupId = getRandomID();
      $query = "insert into `groups` (`ID`, `sName`, `sDescription`, `sDateCreated`, `bOpened`, `sType`, `bSendEmails`) values ('".$userAdminGroupId."', '".$sLogin."-admin', '".$sLogin."-admin', NOW(), 0, 'UserAdmin', 0);";
      $db->exec($query);
      // due to restrictions on triggers, we cannot get the root group id from inside an insert, so we fetch it in another request
      $stm = $db->prepare('select ID from groups where `sType`=\'RootAdmin\';');
      $stm->execute();
      $RootAdminGroupId = $stm->fetchColumn();
      $db->exec("lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = '$RootAdminGroupId'),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values ($RootAdminGroupId, '$userAdminGroupId', @maxIChildOrder+1); unlock tables;");
      // the Root group should be removed one day, but in the meantime, creating users in this group, so that admin interface works
      $stm = $db->prepare('select ID from groups where `sType`=\'RootSelf\';');
      $stm->execute();
      $RootGroupId = $stm->fetchColumn();
      $db->exec("lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = '$RootGroupId'),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values ($RootGroupId, '$userSelfGroupId', @maxIChildOrder+1); unlock tables;");
   }
   Listeners::createNewAncestors($db, "groups", "Group");
   return array($userAdminGroupId, $userSelfGroupId);
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

?>

<!doctype html>
<html>
   <head>
   <script>
      window.parent.location.href = "/";
   </script>
   </head>
   <body>
   </body>
</html>
