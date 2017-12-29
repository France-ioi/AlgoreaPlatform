<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'missing action'));
   exit();
}
if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo json_encode(array('result' => false, 'error' => 'only identified users can use this feature'));
   exit();
}

require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";
require_once __DIR__."/../commonFramework/modelsManager/modelsTools.inc.php"; // for getRandomID
require_once __DIR__."/../commonFramework/sync/syncCommon.php"; // for syncGetVersion

function getGroupsMatching($request, $db) {
   if (!isset($request['lookupString']) || !$request['lookupString']) {
      echo json_encode(array('result' => false, 'error' => 'missing arguments in request'));
      return;
   }
   $query = 'select groups.ID as ID, bOpened, bFreeAccess, groups.sType as sType, sName, sDescription, groups_groups.sType as relationType, IF(STRCMP(\'\', sPassword),1,0) as hasPassword from groups left join groups_groups on groups.ID = groups_groups.idGroupParent and groups_groups.idGroupChild = :idGroupSelf where groups.sName like :lookupString and groups.bOpened = 1 and groups.sType != \'UserSelf\' and groups.sType != \'UserAdmin\' and groups.sType != \'RootAdmin\' and groups.sType != \'Root\' and groups.sType != \'RootSelf\' group by groups.ID;';
   $values = array('lookupString' => '%'.$request['lookupString'].'%', 'idGroupSelf' => $_SESSION['login']['idGroupSelf']);
   $stmt = $db->prepare($query);
   $stmt->execute($values);
   $results = $stmt->fetchAll();
   // can't just pass JSON_NUMERIC_CHECK to json_encode, because ID is too big
   foreach($results as &$result) {
      $result['bOpened'] = $result['bOpened'] == '1' ? true : false;
      $result['bFreeAccess'] = $result['bFreeAccess'] == '1' ? true : false;
      $result['hasPassword'] = $result['hasPassword'] == '1' ? true : false;
   }
   $returnedObject = array('success' => true, 'results' => $results);
   echo json_encode($returnedObject);
}

function joinGroup($request, $db) {
   if ((!isset($request['ID']) || !$request['ID']) && (!isset($request['password']) || !$request['password'])) {
      echo json_encode(array('result' => false, 'error' => 'missing arguments in request'));
      return;
   }

   // Get group
   $query = "SELECT groups.*, groups_groups.sType as ggsType, groups_groups.ID as ggID, groups.sPasswordEnd < NOW() as bPasswordExpired FROM groups LEFT JOIN groups_groups ON groups.ID = groups_groups.idGroupParent AND groups_groups.idGroupChild = :idGroupSelf";
   if (isset($request['ID'])) {
      $query .= " where groups.ID = :ID GROUP BY groups.ID;";
      $values = array('ID' => $request['ID'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']);
   } else {
      $query .= " where groups.sPassword = :password GROUP BY groups.ID;";
      $values = array('password' => $request['password'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']);
   }
   $stmt = $db->prepare($query);
   $stmt->execute($values);
   $result = $stmt->fetch();

   // Check the request is valid
   if (!$result || empty($result)) {
      echo json_encode(array('success' => false, 'error' => 'Le groupe demandé n\'a pas été trouvé.'));
      return;
   }
   if ($result['ggsType'] && $result['ggsType'] != 'left' && $result['ggsType'] != 'removed' && $result['ggsType'] != 'invitationRefused'  && $result['ggsType'] != 'requestRefused') {
      echo json_encode(array('success' => false, 'error' => 'Vous faites déjà partie de ce groupe'));
      return;
   }
   if ($result['sPassword'] && (!isset($request['password']) || $result['sPassword'] != $request['password'])) {
      echo json_encode(array('success' => false, 'error' => 'Le mot de passe indiqué ne correspond pas.'));
      return;
   }
   if ($result['sPassword'] && $result['bPasswordExpired']) {
      echo json_encode(array('success' => false, 'error' => 'Ce mot de passe a expiré.'));
      return;
   }
   if ($result['bOpened'] == 0 && !isset($request['password'])) {
      echo json_encode(array('success' => false, 'error' => 'Ce groupe est actuellement fermé.'));
      return;
   }

   // If we're redirected to an item after, check the user confirmed, else return a message
   if($result['sRedirectPath'] && !isset($request['confirm'])) {
      echo json_encode(['success' => false, 'confirmNeeded' => true, 'openContest' => $result['bOpenContest']]);
      return;
   }

   // Add to group
   $groupGroupType = 'requestSent';
   if (isset($request['password']) || (!$result['sPassword'] && $result['bFreeAccess'] == 1)) {
      $groupGroupType = 'requestAccepted';
   }
   $groupGroupID = $result['ggID'];
   if (!$groupGroupID) {
      $groupGroupID = getRandomID();
   }

   $version = syncGetVersion($db);
   $query = "lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroup),0); insert into `groups_groups` (`ID`, `idGroupParent`, `idGroupChild`, `iChildOrder`, sType, sStatusDate, iVersion) values (:ID, :idGroup, :idGroupSelf, @maxIChildOrder+1, :groupGroupType, NOW(), :version) on duplicate key update sType=VALUES(sType), sStatusDate=VALUES(sStatusDate); unlock tables;";
   $values = array('ID' => $groupGroupID, 'idGroup' => $result['ID'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf'], 'version' => $version, 'groupGroupType' => $groupGroupType);
   $stmt = $db->prepare($query);
   $stmt->execute($values);

   // Set group password expiration if needed
   if($result['sPasswordTimer'] && !$result['sPasswordEnd']) {
      $stmt = $db->prepare("UPDATE groups SET sPasswordEnd = NOW() + sPasswordTimer WHERE ID = :idGroup AND sPasswordEnd IS NULL;");
      $stmt->execute(['idGroup' => $result['ID']]);
   }
   $redirectPath = implode('/', array_filter(explode('/', $result['sRedirectPath'])));
   $returnedObject = array('success' => true, 'type' => $groupGroupType, 'ID' => $groupGroupID, 'groupName' => $result['sName'], 'redirectPath' => $redirectPath);

   unset($stmt);
   Listeners::groupsGroupsAfter($db);

   // Handle contest opening
   if($result['sRedirectPath'] && $result['bOpenContest']) {
      require_once __DIR__."/../contest/common.php";
      $pathSplit = explode('/', $result['sRedirectPath']);
      $idItem = intval(end($pathSplit));
      $contestData = openContest($idItem, $_SESSION['login']['ID'], $_SESSION['login']['idGroupSelf']);
      if($contestData['success']) {
         $returnedObject['contestData'] = $contestData;
      }
   }

   echo json_encode($returnedObject);
}

if ($request['action'] == 'getGroupsMatching') {
   getGroupsMatching($request, $db);
} elseif ($request['action'] == 'joinGroup') {
   joinGroup($request, $db);
} else {
   json_encode(array('result' => false, 'error' => 'unrecognized action'));
}
