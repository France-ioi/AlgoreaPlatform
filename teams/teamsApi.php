<?php
if(!isset($teamsApiBypass)) {
    // json request parsing
    $postdata = file_get_contents("php://input");
    $request = (array) json_decode($postdata);

    if (session_status() === PHP_SESSION_NONE){session_start();}
    header('Content-Type: application/json');
}

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'api_error'));
   exit();
}
if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo json_encode(array('result' => false, 'error' => 'api_needs_login'));
   exit();
}
if(!isset($teamsApiBypass)) {
    $loginData = $_SESSION['login'];
}

if(!function_exists('syncDebug')) { function syncDebug($type, $b_or_e, $subtype='') {} }
require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";
require_once __DIR__."/../commonFramework/modelsManager/modelsTools.inc.php"; // for getRandomID
require_once __DIR__."/teamsCommon.php";


// *** Functions handling requests

function getTeam($request) {
   // Send the team for the current item
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   $team = getUserTeam($request['idItem'], true);

   return [
      'result' => true,
      'team' => $team,
      'qualificationState' => getQualificationState($request['idItem']),
      'canResetQualificationState' => canResetQualificationState()];
}


function createTeam($request) {
   // Create a team
   global $db, $loginData, $teamsApiBypass;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   if(!isset($request['name']) || !$request['name']) {
      return ['result' => false, 'error' => 'teams_no_name'];
   }
   if(!isset($request['password']) || !$request['password']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   if(getUserTeam($request['idItem'])) {
      return ['result' => false, 'error' => 'teams_already_has_team'];
   }

   $stmt = $db->prepare("SELECT * FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();

   // Check item allows team modifications
   if(!$item['bTeamsEditable'] && !isset($teamsApiBypass)) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Check user is qualified
   if($item['idTeamInGroup'] && $item['sTeamMode'] != 'None') {
      $stmt = $db->prepare("SELECT ID FROM groups_ancestors WHERE idGroupAncestor = :idGroupAncestor AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idGroupAncestor' => $item['idTeamInGroup'], 'idGroupSelf' => $loginData['idGroupSelf']]);
      if(!$stmt->fetchColumn()) {
         // Not qualified
         return ['result' => false, 'error' => 'teams_needs_qualification'];
      }
   }

   // Create new team
   $idGroup = getRandomID();
   $stmt = $db->prepare("INSERT INTO `groups` (ID, sName, sDateCreated, sPassword, sType, idTeamItem) VALUES(:id, :name, NOW(), :password, 'Team', :idItem);");
   $res = $stmt->execute(['id' => $idGroup, 'name' => $request['name'], 'password' => $request['password'], 'idItem' => $request['idItem']]);
   if(!$res) {
      return ['result' => false, 'error' => 'teams_creation_error'];
   }

   // Add user as owner
   $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroupOwned, :idGroup, 0, 'direct', 'owner', NOW());");
   $stmt->execute(['idGroupOwned' => $loginData['idGroupOwned'], 'idGroup' => $idGroup]);

   // Add user as member too
   $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroup, :idGroupSelf, 0, 'direct', 'member', NOW());");
   $stmt->execute(['idGroupSelf' => $loginData['idGroupSelf'], 'idGroup' => $idGroup]);

   Listeners::groupsGroupsAfter($db);

   return ['result' => true, 'team' => getUserTeam($request['idItem'], true)];
}


function joinTeam($request) {
   // Join a team with a password
   global $db, $loginData, $teamsApiBypass;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   if(!isset($request['password']) || !$request['password']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   if(getUserTeam($request['idItem'])) {
      return ['result' => false, 'error' => 'teams_already_have_team'];
   }

   $stmt = $db->prepare("SELECT bTeamsEditable FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();
   // Check item allows team modifications
   if(!$item['bTeamsEditable'] && !isset($teamsApiBypass)) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Get team
   $stmt = $db->prepare("SELECT ID FROM `groups` WHERE idTeamItem = :idItem AND sPassword = :password;");
   $stmt->execute(["idItem" => $request['idItem'], "password" => $request['password']]);
   $res = $stmt->fetch();

   if($res) {
      $team = getUserTeam($request['idItem'], true, $res['ID']);
      // Check requirements
      if($team['iTeamParticipating']) {
         $req = checkRequirements($team, $request['idItem'], $loginData['idGroupSelf']);
         if(!$req['result']) { return $req; }
      }

      // Add user as member
      $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroup, :idGroupSelf, 0, 'direct', 'member', NOW());");
      $stmt->execute(['idGroupSelf' => $loginData['idGroupSelf'], 'idGroup' => $team['ID']]);

      Listeners::groupsGroupsAfter($db);
      Listeners::groupsAttemptsAfter($db);

      generateUserItems($team);

      // Send back information about the team
      return ['result' => true, 'team' => getUserTeam($request['idItem'], true)];
   } else {
      return ['result' => false, 'error' => 'teams_invalid_password'];
   }
}


function startItem($request) {
   // Get access to an item as a team
   global $db, $loginData;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }

   // Check contest mode
   $stmt = $db->prepare("SELECT sDuration FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   if($stmt->fetchColumn()) {
      return openContestTeam($request['idItem']);
   }

   // Get team
   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }

   // Grant access to the item
   $stmt = $db->prepare('insert into groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idGroup, :idItem, NOW(), NOW(), 1) on duplicate key update sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;');
   $stmt->execute(['idItem' => $request['idItem'], 'idGroup' => $team['ID']]);
   Listeners::groupsItemsAfter($db);

   // Update team participation status
   $stmt = $db->prepare('UPDATE `groups` SET iTeamParticipating = 1 WHERE ID = :id;');
   $stmt->execute(['id' => $team['ID']]);
   $team['iTeamParticipating'] = 1;

   generateUserItems($team);

   return ['result' => true, 'team' => $team];
}


function changeTeamPassword($request) {
   // Change the password for a team
   global $db, $loginData, $teamsApiBypass;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }

   $stmt = $db->prepare("SELECT bTeamsEditable FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();
   // Check item allows team modifications
   if(!$item['bTeamsEditable'] && !isset($teamsApiBypass)) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }
   if(!$team['isAdmin']) {
      return ['result' => false, 'error' => 'teams_not_admin'];
   }

   $password = (isset($request['password']) && $request['password']) ? $request['password'] : null;

   $stmt = $db->prepare("UPDATE `groups` SET sPassword = :password WHERE ID = :id;");
   $res = $stmt->execute(['password' => $password, 'id' => $team['ID']]);
   $team['sPassword'] = $password;
   return ['result' => $res, 'team' => $team];
}


function removeTeamMember($request) {
   // Remove a member from a team
   global $db, $loginData, $teamsApiBypass;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   if(!isset($request['idGroupChild']) || !$request['idGroupChild']) {
      return ['result' => false, 'error' => 'api_error'];
   }

   $stmt = $db->prepare("SELECT bTeamsEditable FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();
   // Check item allows team modifications
   if(!$item['bTeamsEditable'] && !isset($teamsApiBypass)) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   if($request['idGroupChild'] == $loginData['idGroupSelf']) {
      // Removing oneself is handled by leaveTeam
      return leaveTeam($request);
   }

   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }
   if(!$team['isAdmin']) {
      return ['result' => false, 'error' => 'teams_not_admin'];
   }

   $stmt = $db->prepare("SELECT ID FROM groups_groups WHERE idGroupParent = :idTeam AND idGroupChild = :idGroupChild;");
   $stmt->execute(['idTeam' => $team['ID'], 'idGroupChild' => $request['idGroupChild']]);
   $groupGroupID = $stmt->fetchColumn();

   if(!$groupGroupID) {
      return ['result' => false, 'error' => 'teams_not_a_member'];
   }

   // Check requirements
   if($team['iTeamParticipating']) {
      $req = checkRequirements($team, $request['idItem'], $request['idGroupChild'], true);
      if(!$req['result']) { return $req; }
   }

   $stmt = $db->prepare("DELETE FROM groups_groups WHERE ID = :id;");
   $stmt->execute(['id' => $groupGroupID]);
   Listeners::groupsGroupsAfter($db);

   // Handle groups_attempts, users_answers and users_items
   $stmt = $db->prepare("SELECT ID FROM users WHERE idGroupSelf = :idGroup;");
   $stmt->execute(['idGroup' => $request['idGroupChild']]);
   removeMemberData($team, $stmt->fetchColumn(), $loginData['ID']);

   // Return new state of team
   $newChildren = [];
   foreach($team['children'] as $child) {
      if($child['idGroupChild'] != $request['idGroupChild']) {
         $newChildren[] = $child;
      }
   }
   $team['children'] = $newChildren;

   Listeners::groupsGroupsAfter($db);

   return ['result' => true, 'team' => $team];
}

function removeMemberData($team, $oldUserId, $newUserId) {
   // Unlink data when a member leaves a team
   global $db;

   // Delete users_items from the user
   $stmt = $db->prepare("
      DELETE users_items FROM users_items
      JOIN items_ancestors ON users_items.idItem = items_ancestors.idItemChild
      WHERE idUser = :idUser AND (users_items.idItem = :idItem OR items_ancestors.idItemAncestor = :idItem);");
   $stmt->execute(['idUser' => $oldUserId, 'idItem' => $team['idTeamItem']]);

   // Link groups_attempts and users_answers to the team leader
   $stmt = $db->prepare("
      UPDATE groups_attempts
      SET idUserCreator = :idUserNew
      WHERE idUserCreator = :idUserOld AND idGroup = :idGroup;");
   $stmt->execute(['idUserOld' => $oldUserId, 'idUserNew' => $newUserId, 'idGroup' => $team['ID']]);

   $stmt = $db->prepare("
      UPDATE users_answers
      JOIN items_ancestors ON users_answers.idItem = items_ancestors.idItemChild
      SET idUser = :idUserNew
      WHERE idUser = :idUserOld AND (users_answers.idItem = :idItem OR items_ancestors.idItemAncestor = :idItem);");
   $stmt->execute(['idUserOld' => $oldUserId, 'idUserNew' => $newUserId, 'idItem' => $team['idTeamItem']]);
}

function leaveTeam($request) {
   // Leave a team
   global $db, $loginData, $teamsApiBypass;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }
   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }

   $stmt = $db->prepare("SELECT bTeamsEditable FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();
   // Check item allows team modifications
   if(!$item['bTeamsEditable'] && !isset($teamsApiBypass)) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Check requirements
   if($team['iTeamParticipating']) {
      $req = checkRequirements($team, $request['idItem'], $loginData['idGroupSelf'], true);
      if(!$req['result']) { return $req; }
   }

   // Get admin
   $stmt = $db->prepare("SELECT ID, idGroupParent FROM groups_groups WHERE idGroupChild = :idGroup AND sRole = 'owner';");
   $stmt->execute(['idGroup' => $team['ID']]);
   $adminGroupGroup = $stmt->fetch();

   $deleteGroupAfter = false;
   if($adminGroupGroup['idGroupParent'] == $loginData['idGroupOwned']) {
      // User is owner of this group 
      $stmt = $db->prepare("SELECT users.ID, users.idGroupOwned FROM users JOIN groups_groups ON idGroupChild = users.idGroupSelf WHERE users.idGroupOwned != :idCurrentOwner and groups_groups.idGroupParent = :idGroup ORDER BY groups_groups.sStatusDate ASC LIMIT 1;");
      $stmt->execute(['idCurrentOwner' => $loginData['idGroupOwned'], 'idGroup' => $team['ID']]);
      $newAdmin = $stmt->fetch();
      if($newAdmin) {
         // Assign next oldest member as owner
         $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroupOwned, :idGroup, 0, 'direct', 'owner', NOW());");
         $stmt->execute(['idGroupOwned' => $newAdmin['idGroupOwned'], 'idGroup' => $team['ID']]);
      } else {
         // Last member leaving the team, delete the team
         $deleteGroupAfter = true;
      }

      // Remove ownership
      $stmt = $db->prepare("DELETE FROM groups_groups WHERE ID = :id;");
      $stmt->execute(['id' => $adminGroupGroup['ID']]);
   }

   // Remove user
   $stmt = $db->prepare("DELETE FROM groups_groups WHERE idGroupParent = :idGroup AND idGroupChild = :idGroupSelf;");
   $stmt->execute(['idGroup' => $team['ID'], 'idGroupSelf' => $loginData['idGroupSelf']]);

   if($deleteGroupAfter) {
      // Delete team
      $stmt = $db->prepare("DELETE FROM `groups` WHERE ID = :id;");
      $stmt->execute(['id' => $team['ID']]);
   } else {
      // Unlink data from us
      if(!isset($newAdmin)) {
         $stmt = $db->prepare("SELECT ID FROM users WHERE idGroupOwned = :idGroupOwned;");
         $stmt->execute(['idGroupOwned' => $adminGroupGroup['idGroupParent']]);
         $newAdmin = $stmt->fetch();
      }
      removeMemberData($team, $loginData['ID'], $newAdmin['ID']);
   }

   Listeners::groupsGroupsAfter($db);

   return ['result' => true];
}

if(isset($teamsApiBypass) && $teamsApiBypass) {
   // Do nothing
} elseif($request['action'] == 'getTeam') {
   die(json_encode(getTeam($request)));
} elseif($request['action'] == 'createTeam') {
   die(json_encode(createTeam($request)));
} elseif($request['action'] == 'joinTeam') {
   die(json_encode(joinTeam($request)));
} elseif($request['action'] == 'startItem') {
   die(json_encode(startItem($request)));
} elseif($request['action'] == 'changeTeamPassword') {
   die(json_encode(changeTeamPassword($request)));
} elseif($request['action'] == 'removeTeamMember') {
   die(json_encode(removeTeamMember($request)));
} elseif($request['action'] == 'leaveTeam') {
   die(json_encode(leaveTeam($request)));
} else {
   die(json_encode(['result' => false, 'error' => 'api_error']));
}
