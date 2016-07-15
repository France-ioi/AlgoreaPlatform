<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

require_once __DIR__.'/../config.php';

session_start();
header('Content-Type: application/json');

if (!isset($request['action']) || !isset($request['idGroup'])) {
   echo json_encode(array('success' => false, 'error' => 'missing action or idGroup'));
   exit();
}
// if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser'] || !isset($_SESSION['login']['idGroupOwned'])) {
//    echo json_encode(array('success' => false, 'error' => 'only identified users can use this file'));
//    exit();
// }

$idGroup = $request['idGroup'];
//$idGroupOwned = $_SESSION['login']['idGroupOwned'];

require_once __DIR__.'/../shared/connect.php';

// verify access rights on group:
$query = 'select sRole from group_group where idGroupChild = :idGroup and idGroupParent = :idGroupOwned;';
$stmt = $db->prepare($query);
//$stmt->execute(['idGroup' => $idGroup, 'idGroupOwned' => $idGroupOwned]);
//$sRole = $stmt->fetchColumn();

// if ($sRole != 'manager' && $sRole != 'owner') {
//    echo json_encode(array('success' => false, 'error' => 'you do not have the rights to modify this group', 'idGroupOwned' => $idGroupOwned));
//    exit();	
// }

require_once("../shared/listeners.php");

function getRandomPass() {
   $characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   $string = '';
   for ($i = 0; $i < 10; $i++) {
      $string .= $characters[mt_rand(0, strlen($characters) - 1)];
   }
}

function refreshCode($idGroup) {
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
   $query = 'delete from groups_groups where idGroupChild = :idGroup and idGroupParent = :idGroupUser;';
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
   $query = 'select max(iChildOrder) from groups_groups where idGroupChild = :idGroup and idGroupParent = :idGroupAdmin;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup]);
   $nextIChildOrder = intval($stmt->fetchColumn()+1);
   $query = 'insert into groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate, idUserInviting) values (:idGroupAdmin, :idGroup, :nextIChildOrder, \'direct\', \'observer\', NOW(), :myUserId);';
   $stmt = $db->prepare($query);
   foreach ($groupArray as $idGroupAdmin) {
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
   $query = 'update groups_groups set sRole = :sRole where idGroupParent = :idGroupAdmin and idGroupChild = :idGroup;';
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupAdmin' => $idGroupAdmin, 'idGroup' => $idGroup, 'sRole' => $sRole]);
   echo json_encode(array('success' => true));
}

if ($request['action'] == 'refreshCode') {
   refreshCode($idGroup);
} elseif ($request['action'] == 'removeUser') {
   removeUser($idGroup, $request['idGroupUser']);
} elseif ($request['action'] == 'removeAdmin') {
   removeAdmin($idGroup, $request['idGroupAdmin']);
} elseif ($request['action'] == 'addAdmins') {
   addAdmin($idGroup, $request['aAdminGroups']);
} elseif ($request['action'] == 'changeAdminRole') {
   changeAdminRole($idGroup, $request['idGroupAdmin'], $request['sRole']);
} else {
   echo json_encode(array('success' => false, 'error' => 'unknown role: '.$sRole));
   exit();
}