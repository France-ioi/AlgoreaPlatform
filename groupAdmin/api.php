<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

require_once __DIR__.'/../config.php';

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

$idGroupRequired = $request['action'] != 'createGroup' && $request['action'] != 'createMultipleGroups';
if (!isset($request['action']) || ($idGroupRequired && !isset($request['idGroup']))) {
   echo json_encode(array('success' => false, 'error' => 'missing action or idGroup'));
   exit();
}
// if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser'] || !isset($_SESSION['login']['idGroupOwned'])) {
//    echo json_encode(array('success' => false, 'error' => 'only identified users can use this file'));
//    exit();
// }

//$idGroupOwned = $_SESSION['login']['idGroupOwned'];

require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';

if (isset($request['idGroup'])) {
   // verify access rights on group:
   $idGroup = $request['idGroup'];
   $query = 'select sRole from group_group where idGroupChild = :idGroup and idGroupParent = :idGroupOwned;';
   $stmt = $db->prepare($query);
   //$stmt->execute(['idGroup' => $idGroup, 'idGroupOwned' => $idGroupOwned]);
   //$sRole = $stmt->fetchColumn();

   // if ($sRole != 'manager' && $sRole != 'owner') {
   //    echo json_encode(array('success' => false, 'error' => 'you do not have the rights to modify this group', 'idGroupOwned' => $idGroupOwned));
   //    exit();
   // }
} else {
   $idGroup = null;
}

require_once("../shared/listeners.php");
if (file_exists( __DIR__."/../shared/debug.php")) {
   include_once __DIR__."/../shared/debug.php"; // not required
} else {
   function syncDebug($type, $b_or_e, $subtype='') {}
}

function getRandomPass() {
   $characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   $string = '';
   for ($i = 0; $i < 10; $i++) {
      $string .= $characters[mt_rand(0, strlen($characters) - 1)];
   }
   return $string;
}

function refreshCode($idGroup) {
   global $db;
   $newPass = getRandomPass();
   $query = 'update groups set sPassword = :newPass where ID = :idGroup';
   $stmt = $db->prepare($query);
   $stmt->execute(['newPass' => $newPass, 'idGroup' => $idGroup]);
   echo json_encode(array('success' => true, 'newPass' => $newPass));
}

function removeUser($idGroup, $idGroupUser) {
   global $db;
   if (!$idGroupUser) {
      echo json_encode(array('success' => false, 'error' => 'missing idGroupUser argument.'));
      exit();
   }
   $query = 'update groups_groups set sType = \'removed\' where idGroupParent = :idGroup and idGroupChild = :idGroupUser;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupUser' => $idGroupUser, 'idGroup' => $idGroup]);
   Listeners::groupsGroupsAfter($db);
   echo json_encode(array('success' => true));
}

function removeAdmin($idGroup, $idGroupAdmin) {
   global $db;
   if (!$idGroupAdmin) {
      echo json_encode(array('success' => false, 'error' => 'missing idGroupAdmin argument.'));
      exit();
   }
   $query = 'select sRole from groups_groups where idGroupChild = :idGroup and idGroupParent = :idGroupAdmin;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroup' => $idGroup, 'idGroupAdmin' => $idGroupAdmin]);
   $sRole = $stmt->fetchColumn();
   if (!$sRole) {
      echo json_encode(array('success' => false, 'error' => 'operation impossible: the admin is not part of the group.'));
      exit();
   }
   if ($sRole == 'owner') {
      echo json_encode(array('success' => false, 'error' => 'operation impossible: you cannot remove the owner.'));
      exit();
   }
   if ($sRole == 'manager') {
      $query = 'select count(ID) from groups_groups where idGroupChild = :idGroup and sRole = \'manager\' or sRole = \'owner\';';
      $stmt = $db->prepare($query);
      $stmt->execute(['idGroup' => $idGroup]);
      $nbParents = $stmt->fetchColumn();
      if (intval($nbParents) < 2) {
         die(json_encode(array('success' => false, 'error' => 'operation impossible: the group would not have any manager.', 'nbParents' => $nbParents)));
      }
   }
   $query = 'delete from groups_groups where idGroupChild = :idGroup and idGroupParent = :idGroupAdmin;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup]);
   Listeners::groupsGroupsAfter($db);
   echo json_encode(array('success' => true));
}

function addAdmins($idGroup, $groupArray) {
   global $db;
   if (!$groupArray || !count($groupArray)) {
      echo json_encode(array('success' => false, 'error' => 'missing idGroupAdmin argument.'));
      exit();
   }
   $nextIChildOrder = 0;
   $queryChildOrder = 'select max(iChildOrder) from groups_groups where idGroupChild = :idGroup and idGroupParent = :idGroupAdmin;';
   $queryInsert = 'insert ignore into groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate, idUserInviting) values (:idGroupAdmin, :idGroup, :nextIChildOrder, \'direct\', \'observer\', NOW(), :myUserId);';
   foreach ($groupArray as $idGroupAdmin) {
      $stmt = $db->prepare($queryChildOrder);
      $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup]);
      $nextIChildOrder = intval($stmt->fetchColumn()+1);
      $stmt = $db->prepare($queryInsert);
      $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup, 'nextIChildOrder' => $nextIChildOrder, 'myUserId' => $_SESSION['login']['ID']]);
   }
   Listeners::groupsGroupsAfter($db);
   echo json_encode(array('success' => true));
}

function changeAdminRole($idGroup, $idGroupAdmin, $sRole) {
   global $db;
   if ($sRole != 'observer' && $sRole != 'manager') {
      echo json_encode(array('success' => false, 'error' => 'unknown role: '.$sRole));
      exit();
   }
   if (!$idGroupAdmin) {
      echo json_encode(array('success' => false, 'error' => 'missing idGroupAdmin argument.'));
      exit();
   }
   if ($sRole == 'observer') {
      $query = 'select count(ID) from groups_groups where idGroupChild = :idGroup and sRole = \'manager\' or sRole = \'owner\';';
      $stmt = $db->prepare($query);
      $stmt->execute(['idGroup' => $idGroup]);
      $nbAdminParents = $stmt->fetchColumn();
      if ($nbAdminParents < 2) {
         die(json_encode(array('success' => false, 'error' => 'operation impossible: the group would not have any manager.')));
      }
   }
   $query = 'update groups_groups set sRole = :sRole where idGroupParent = :idGroupAdmin and idGroupChild = :idGroup;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup, 'sRole' => $sRole]);
   echo json_encode(array('success' => true));
}

function deleteGroup($idGroup) {
   global $db;
   $stmt = $db->prepare('delete from groups_groups where idGroupParent = :idGroup or idGroupChild = :idGroup;');
   $stmt->execute(['idGroup' => $idGroup]);
   $stmt = $db->prepare('delete from groups where ID = :idGroup;');
   $stmt->execute(['idGroup' => $idGroup]);
   Listeners::groupsGroupsAfter($db);
   echo json_encode(array('success' => true));
}

function createGroup($idGroup, $sName) {
   global $db;
   if (!$sName) {$sName = 'Nouveau groupe';}
   if (!$idGroup) {
      $idGroup = getRandomID();
   }
   $stmt = $db->prepare('insert into groups (ID, sName, sDateCreated, sType) values (:idGroup, :sName, NOW(), \'Class\');');
   $stmt->execute(['idGroup' => $idGroup, 'sName' => $sName]);
   $stmt = $db->prepare('insert into groups_groups (idGroupChild, idGroupParent, sRole) values (:idGroup, :idGroupOwned, \'owner\');');
   $stmt->execute(['idGroup' => $idGroup, 'idGroupOwned' => $_SESSION['login']['idGroupOwned']]);
   Listeners::groupsGroupsAfter($db);
   echo json_encode(array('success' => true, 'idGroup' => $idGroup));
}


function createMultipleGroups($sNames, $idParent) {
    global $db;
    if(!is_array($sNames) || !count($sNames) || count($sNames) > 20) {
        $res = [
            'success' => false,
            'error' => 'incorrect sNames array'
        ];
        die(json_encode($res));
    }
    $stmt_group = $db->prepare('
        insert into groups
            (ID, sName, sDateCreated, sType)
        values
            (:idGroup, :sName, NOW(), \'Class\');
    ');
    $stmt_group_group = $db->prepare('
        insert into groups_groups
            (idGroupChild, idGroupParent, sRole)
        values
            (:idGroup, :idGroupOwned, \'owner\');
    ');
    $idGroups = [];
    foreach($sNames as $sName) {
        $idGroup = getRandomID();
        $stmt_group->execute(['idGroup' => $idGroup, 'sName' => $sName]);
        $stmt_group_group->execute(['idGroup' => $idGroup, 'idGroupOwned' => $idParent]);
        $idGroups[] = $idGroup;
    }
    Listeners::groupsGroupsAfter($db);
    echo json_encode(array('success' => true, 'idGroups' => $idGroups));
 }



if ($request['action'] == 'refreshCode') {
   refreshCode($idGroup);
} elseif ($request['action'] == 'removeUser') {
   removeUser($idGroup, $request['idGroupUser']);
} elseif ($request['action'] == 'removeAdmin') {
   removeAdmin($idGroup, $request['idGroupAdmin']);
} elseif ($request['action'] == 'addAdmins') {
   addAdmins($idGroup, $request['aAdminGroups']);
} elseif ($request['action'] == 'changeAdminRole') {
   changeAdminRole($idGroup, $request['idGroupAdmin'], $request['sRole']);
} elseif ($request['action'] == 'deleteGroup') {
   deleteGroup($idGroup);
} elseif ($request['action'] == 'createGroup') {
   createGroup($idGroup, $request['sName']);
} elseif ($request['action'] == 'createMultipleGroups') {
    createMultipleGroups($request['sNames'], $request['idParent']);
} else {
   echo json_encode(array('success' => false, 'error' => 'unknown action: '.$request['action']));
   exit();
}