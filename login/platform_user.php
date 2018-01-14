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

$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if (!$request) {
  $request = $_GET;
}

if (!$request || !is_array($request) || !$request['action']) {
   echo '{"result": false, "error": "no argument given"}';
   return;
}

$action = $request['action'];

if (session_status() === PHP_SESSION_NONE){session_start();}
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
      $db->exec('unlock tables;'); // why again?
      // the Root group should be removed one day, but in the meantime, creating users in this group, so that admin interface works
      $stm = $db->prepare('select ID from groups where `sType`=\'RootSelf\';');
      $stm->execute();
      $RootGroupId = $stm->fetchColumn();
      $db->exec("lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = '$RootGroupId'),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values ($RootGroupId, '$userSelfGroupId', @maxIChildOrder+1); unlock tables;");
   }
   $db->exec('unlock tables;'); // why again?
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
      'idGroupOwned' => $userAdminGroupId,
      'tempUser'    => 1,
      'ID'          => $userId,
      'sLogin'      => $sLogin,
      'bIsAdmin'    => false,
   );
   echo json_encode(array('result' => true, 'sLogin' => $sLogin, 'ID' => $userId, 'loginData' => $_SESSION['login']));
}

function addUserToGroupHierarchy($idGroupSelf, $groupHierarchy, $role) {
   global $db;
   if ($role != 'member') return;
   $previousGroupId = null;
   $launchTriggers = false;
   foreach($groupHierarchy as $groupName) {
      $groupId = null;
      if (!$previousGroupId) {
         $stmt = $db->prepare('select ID from groups where sName = :groupName;');
         $stmt->execute(['groupName' => $groupName]);
         $groupId = $stmt->fetchColumn();
      } else {
         $stmt = $db->prepare('select groups.ID from groups join groups_groups on groups_groups.idGroupChild = groups.ID where groups.sName = :groupName and groups_groups.idGroupParent = :previousGroupId;');
         $stmt->execute(['groupName' => $groupName, 'previousGroupId' => $previousGroupId]);
         $groupId = $stmt->fetchColumn();
      }
      if (!$groupId) {
         $launchTriggers = true;
         $groupId = getRandomID();
         $stmt = $db->prepare('insert into groups (ID, sName, sDateCreated) values (:ID, :sName, NOW());');
         $stmt->execute(['ID' => $groupId, 'sName' => $groupName]);
         if ($previousGroupId) {
            $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`, `sStatusDate`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1, NOW()); unlock tables;');
            $stmt->execute(['idGroupParent' => $previousGroupId, 'idGroupChild' => $groupId]);
         }
      }
      $previousGroupId = $groupId;
   }
   if (!$previousGroupId) return;
   $stmt = $db->prepare('select groups_groups.ID from groups_groups where groups_groups.idGroupChild = :idGroupSelf and groups_groups.idGroupParent = :previousGroupId;');
   $stmt->execute(['idGroupSelf' => $idGroupSelf, 'previousGroupId' => $previousGroupId]);
   $groupGroupId = $stmt->fetchColumn();
   if (!$groupGroupId) {
      $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert ignore into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`, `sStatusDate`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1, NOW()); unlock tables;');
      $stmt->execute(['idGroupParent' => $previousGroupId, 'idGroupChild' => $idGroupSelf]);
      $launchTriggers = true;
   }
   if ($launchTriggers) {
      $stmt = null;
      Listeners::createNewAncestors($db, "groups", "Group");
   }

}

function checkUserInGroupHierarchy($idGroupSelf, $groupHierarchy, $directChild) {
   global $db;
   $previousGroupId = null;
   foreach($groupHierarchy as $groupName) {
      $groupId = null;
      if (!$previousGroupId) {
         $stmt = $db->prepare('select ID from groups where sName = :groupName;');
         $stmt->execute(['groupName' => $groupName]);
         $groupId = $stmt->fetchColumn();
      } else {
         $stmt = $db->prepare('select groups.ID from groups join groups_groups on groups_groups.idGroupChild = groups.ID where groups.sName = :groupName and groups_groups.idGroupParent = :previousGroupId;');
         $stmt->execute(['groupName' => $groupName, 'previousGroupId' => $previousGroupId]);
         $groupId = $stmt->fetchColumn();
      }
      if (!$groupId) {
         return false;
      }
      $previousGroupId = $groupId;
   }
   if (!$previousGroupId) return false;
   if($directChild) {
      $stmt = $db->prepare('select ID from groups_groups WHERE idGroupParent = :groupParent AND idGroupChild = :groupSelf;');
   } else {
      $stmt = $db->prepare('select ID from groups_ancestors WHERE idGroupAncestor = :groupParent AND idGroupChild = :groupSelf;');
   }
   $stmt->execute(['groupParent' => $previousGroupId, 'groupSelf' => $idGroupSelf]);
   $relId = $stmt->fetchColumn();
   return $relId;
}


function assignRandom($idGroupSelf, $groupHierarchy) {
   global $db;
   if(checkUserInGroupHierarchy($idGroupSelf, $groupHierarchy, false) !== false) { return; }
   $previousGroupId = null;
   foreach($groupHierarchy as $groupName) {
      $groupId = null;
      if (!$previousGroupId) {
         $stmt = $db->prepare('select ID from groups where sName = :groupName;');
         $stmt->execute(['groupName' => $groupName]);
         $groupId = $stmt->fetchColumn();
      } else {
         $stmt = $db->prepare('select groups.ID from groups join groups_groups on groups_groups.idGroupChild = groups.ID where groups.sName = :groupName and groups_groups.idGroupParent = :previousGroupId;');
         $stmt->execute(['groupName' => $groupName, 'previousGroupId' => $previousGroupId]);
         $groupId = $stmt->fetchColumn();
      }
      if (!$groupId) {
         return false;
      }
      $previousGroupId = $groupId;
   }
   if (!$previousGroupId) return false;
   $stmt = $db->prepare('select groups.ID from groups join groups_groups on groups_groups.idGroupChild = groups.ID where groups_groups.idGroupParent = :previousGroupId;');
   $stmt->execute(['previousGroupId' => $previousGroupId]);
   $childIds = [];
   while($groupId = $stmt->fetchColumn()) {
      $childIds[] = $groupId;
   }
   $targetId = $childIds[array_rand($childIds)];
   $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert ignore into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1); unlock tables;');
   $stmt->execute(['idGroupParent' => $targetId, 'idGroupChild' => $idGroupSelf]);
   $stmt = null;
   Listeners::createNewAncestors($db, "groups", "Group");
}


function handleBadges($idUser, $idGroupSelf, $aBadges) {
   global $config;
   foreach($aBadges as $badge) {
      if (isset($config->shared->domains['current']->badgesTranslations) && isset($config->shared->domains['current']->badgesTranslations[$badge])) {
         $badge = $config->shared->domains['current']->badgesTranslations[$badge];
      }
      if (substr($badge, 0, 9) === 'groups://') {
         $splitGroups = explode('/', substr($badge, 9));
         $role = array_pop($splitGroups);
         addUserToGroupHierarchy($idGroupSelf, $splitGroups, $role);
      }
   }
}

if ($action == 'login') {
  // user has logged through login platform, we receive the token here:
  // we fill the session and, if not already creted, create a new user
   require_once(dirname(__FILE__)."/../shared/TokenParser.php");
   $tokenParser = new TokenParser($config->login->public_key, $config->login->name);
   $params = $tokenParser->decodeJWS($request['token']);
   if (!$params || empty($params) || !isset($params['idUser']) || !intval($params['idUser'])) {
      echo json_encode(["result" => false, "error" => "invalid or empty token"]);
      return;
   }
   if (isset($config->shared->domains['current']->loginMandatoryFields)) {
      $missingFields = [];
      foreach($config->shared->domains['current']->loginMandatoryFields as $mandatoryField) {
         if (!isset($params[$mandatoryField]) || !$params[$mandatoryField]) {
            $missingFields[] = $mandatoryField;
         }
      }
      if (count($missingFields)) {
         echo json_encode(['result' => false, 'missingFields' => $missingFields, 'error' => 'missing fields']);
         exit();
      }
   }
   foreach ($params as $param_k => $param_v) {
      $_SESSION['login'][$param_k] = $param_v;
   }
   $_SESSION['login']['sToken'] = $request['token'];
   $_SESSION['login']['tempUser'] = 0;
   $_SESSION['login']['loginId'] = $params['idUser'];
   $query = 'select ID, idGroupSelf, idGroupOwned, bIsAdmin from users where `loginID`= :idUser ;';
   $stm = $db->prepare($query);
   $stm->execute(array('idUser' => $params['idUser']));
   $res = $stm->fetch();
   if(!$res) {
      list($userAdminGroupId, $userSelfGroupId) = createGroupsFromLogin($db, $params['sLogin']);
      $userId = getRandomID();
      $stmt = $db->prepare("insert into `users` (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`, `sEmail`, `sFirstName`, `sLastName`, `sStudentId`) values (:ID, :idUser, :sLogin, '0', NOW(), :userSelfGroupId, :userAdminGroupId, :sEmail, :sFirstName, :sLastName, :sStudentId);");
      $stmt->execute([
         'ID' => $userId,
         'idUser' => $params['idUser'],
         'sLogin' => $params['sLogin'],
         'userAdminGroupId' => $userAdminGroupId,
         'userSelfGroupId' => $userSelfGroupId,
         'sEmail' => (isset($params['sEmail']) ? $params['sEmail'] : null),
         'sFirstName' => (isset($params['sFirstName']) ? $params['sFirstName'] : null),
         'sLastName' => (isset($params['sLastName']) ? $params['sLastName'] : null),
         'sStudentId' => (isset($params['sStudentId']) ? $params['sStudentId'] : null),
      ]);
      $_SESSION['login']['ID'] = $userId;
      $_SESSION['login']['idGroupSelf'] = $userSelfGroupId;
      $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
      $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
      $_SESSION['login']['idGroupOwned'] = $userAdminGroupId;
      $_SESSION['login']['bIsAdmin'] = false;
   } else {
      if (isset($params['sEmail']) || isset($params['sFirstName']) || isset($params['sLastName'])) {
         $stmt = $db->prepare("update `users` set `sEmail` = :sEmail, `sFirstName` = :sFirstName, `sLastName` = :sLastName, sStudentId = :sStudentId where ID = :ID;");
         $stmt->execute([
            'ID' => $res['ID'],
            'sEmail' => (isset($params['sEmail']) ? $params['sEmail'] : null),
            'sFirstName' => (isset($params['sFirstName']) ? $params['sFirstName'] : null),
            'sLastName' => (isset($params['sLastName']) ? $params['sLastName'] : null),
            'sStudentId' => (isset($params['sStudentId']) ? $params['sStudentId'] : null)
         ]);
      }
      $_SESSION['login']['ID'] = $res['ID'];
      $_SESSION['login']['idGroupSelf'] = $res['idGroupSelf'];
      $_SESSION['login']['idGroupOwned'] = $res['idGroupOwned'];
      $_SESSION['login']['bIsAdmin'] = $res['bIsAdmin'];
      $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
      $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
   }
   if (isset($params['aBadges'])) {
      handleBadges($_SESSION['login']['ID'], $_SESSION['login']['idGroupSelf'], $params['aBadges']);
   }
   $_SESSION['login']['sLogin'] = $params['sLogin'];
   echo json_encode(array('result' => true, 'sLogin' => $params['sLogin'], 'ID' => $_SESSION['login']['ID'], 'loginData' => $_SESSION['login']));
} else if ($action == 'notLogged') {
  // user is not logged through login platform, we create a temporary user here
  // is there already a temporary user in the session?
  if (isset($_SESSION['login']['tempUser']) && $_SESSION['login']['tempUser'] == 1) {
     echo json_encode(array('result'    => true, 'sLogin' => $_SESSION['login']['sLogin'], 'ID' => $_SESSION['login']['ID'], 'loginData' => $_SESSION['login']));
  } else {
     $_SESSION['login'] = array();
     createTempUser($db);
  }
} else if ($action == 'logout') {
   $_SESSION['login'] = array();
   createTempUser($db);
}
