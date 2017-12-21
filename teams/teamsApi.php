<?php
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

function syncDebug($type, $b_or_e, $subtype='') {}
require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";
require_once __DIR__."/../commonFramework/modelsManager/modelsTools.inc.php"; // for getRandomID


// *** Helper functions

function getUserTeam($idItem, $getExtra=false, $idTeam=null) {
   // Get the team on some item for the current user
   // Returns either the group information, either null if no team was found
   global $db;
   if($idTeam) {
      $stmt = $db->prepare("SELECT groups.* FROM groups WHERE ID = :id;");
      $stmt->execute(['id' => $idTeam]);
   } else {
      $stmt = $db->prepare("SELECT groups.* FROM groups JOIN groups_groups ON idGroupParent = groups.ID WHERE idTeamItem = :idItem AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
   }
   $team = $stmt->fetch();
   if($team && $getExtra) {
      // Get other members
      $stmt = $db->prepare("SELECT groups_groups.idGroupChild, groups.sName FROM groups_groups JOIN groups ON groups_groups.idGroupChild = groups.ID WHERE groups_groups.idGroupParent = :idTeam;");
      $stmt->execute(['idTeam' => $team['ID']]);
      $team['children'] = $stmt->fetchAll();

      // Get admin information
      $stmt = $db->prepare("SELECT idGroupParent FROM groups_groups WHERE idGroupChild = :idTeam AND sRole = 'owner';");
      $stmt->execute(['idTeam' => $team['ID']]);
      $team['isAdmin'] = ($stmt->fetchColumn() == $_SESSION['login']['idGroupOwned']);
   }
   return $team;
}


function checkRequirements($team, $idItem, $modGroup, $removing=false) {
   // Check whether a team still fulfills the requirements of the item after
   // adding or removing a member
   global $db;

   $stmt = $db->prepare("SELECT sTeamMode, idTeamInGroup, iTeamMaxMembers from items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $idItem]);
   $item = $stmt->fetch();
   if(!$item || !$item['sTeamMode']) {
      // Item was deleted right now or someone is crafting requests
      return ['result' => false, 'error' => 'Invalid item.'];
   }

   if($team) {
      $count = count($team['children']) + ($removing ? -1 : 1);
   } else {
      $count = 1;
   }

   // Is the new number of people ok?
   if(!$removing && $item['iTeamMaxMembers'] && $count > $item['iTeamMaxMembers']) {
      return ['result' => false, 'error' => 'Maximum number of members reached.'];
   }

   // Do the members satisfy the acceptance condition?
   if($item['sTeamMode'] != 'None' && $item['idTeamInGroup']) {
      $children = [];
      if(!$removing) {
         $children[] = $modGroup;
      }
      if($team) {
         foreach($team['children'] as $child) {
            if($child['idGroupChild'] == $modGroup) { continue; }
            $children[] = $child['idGroupChild'];
         }
      }
      $queryList = implode(', ', $children);
      $stmt = $db->prepare("SELECT COUNT(*) FROM groups_ancestors WHERE idGroupAncestor = :idGroupAncestor AND idGroupChild IN (" . $queryList . ");");
      $stmt->execute(['idGroupAncestor' => $item['idTeamInGroup']]);
      $nbOk = intval($stmt->fetchColumn());

      if($item['sTeamMode'] == 'One' && $nbOk == 0) {
         return ['result' => false, 'error' => 'At least one member must fulfill the access requirements.'];
      } elseif($item['sTeamMode'] == 'Half' && $nbOk < $count / 2) {
         return ['result' => false, 'error' => 'At least half of the members must fulfill the access requirements.'];
      } elseif($item['sTeamMode'] == 'All' && $nbOk < $count) {
         return ['result' => false, 'error' => 'All the members must fulfill the access requirements.'];
      }
   }
   return ['result' => true];
}


// *** Functions handling requests

function getTeam($request) {
   // Send the team for the current item
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }
   $team = getUserTeam($request['idItem'], true);
   return ['result' => true, 'team' => $team];
}


function createTeam($request) {
   // Create a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }
   if(!isset($request['name']) || !$request['name']) {
      return ['result' => false, 'error' => 'No name provided.'];
   }
   if(!isset($request['password']) || !$request['password']) {
      return ['result' => false, 'error' => 'No password provided.'];
   }
   if(getUserTeam($request['idItem'])) {
      return ['result' => false, 'error' => 'User already belongs to a team for this item.'];
   }

   // Check requirements
   $req = checkRequirements(null, $request['idItem'], $_SESSION['login']['idGroupSelf']);
   if(!$req['result']) { return $req; }

   // Create new team
   $idGroup = getRandomID();
   $stmt = $db->prepare("INSERT INTO groups (ID, sName, sDateCreated, sPassword, sType, idTeamItem) VALUES(:id, :name, NOW(), :password, 'Team', :idItem);");
   $res = $stmt->execute(['id' => $idGroup, 'name' => $request['name'], 'password' => $request['password'], 'idItem' => $request['idItem']]);
   if(!$res) {
      return ['result' => false, 'error' => 'Error while creating team.'];
   }

   // Add user as owner
   $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroupOwned, :idGroup, 0, 'direct', 'owner', NOW());");
   $stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'idGroup' => $idGroup]);

   // Add user as member too
   $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroup, :idGroupSelf, 0, 'direct', 'member', NOW());");
   $stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf'], 'idGroup' => $idGroup]);

   Listeners::groupsGroupsAfter($db);

   return ['result' => true, 'team' => getUserTeam($request['idItem'], true)];
}


function joinTeam($request) {
   // Join a team with a password
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }
   if(!isset($request['password']) || !$request['password']) {
      return ['result' => false, 'error' => 'No password provided.'];
   }
   if(getUserTeam($request['idItem'])) {
      return ['result' => false, 'error' => 'User already belongs to a team for this item.'];
   }

   // Get team
   $stmt = $db->prepare("SELECT ID FROM groups WHERE idTeamItem = :idItem AND sPassword = :password;");
   $stmt->execute(["idItem" => $request['idItem'], "password" => $request['password']]);
   $res = $stmt->fetch();

   if($res) {
      // Check requirements
      $team = getUserTeam($request['idItem'], true, $res['ID']);
      $req = checkRequirements($team, $request['idItem'], $_SESSION['login']['idGroupSelf']);
      if(!$req['result']) { return $req; }

      // Add user as member
      $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroup, :idGroupSelf, 0, 'direct', 'member', NOW());");
      $stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf'], 'idGroup' => $team['ID']]);

      Listeners::groupsGroupsAfter($db);

      // Send back information about the team
      return ['result' => true, 'team' => getUserTeam($request['idItem'], true)];
   } else {
      return ['result' => false, 'error' => 'Invalid password.'];
   }
}


function changeTeamPassword($request) {
   // Change the password for a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }

   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => "User doesn't belong to a team for this item."];
   }
   if(!$team['isAdmin']) {
      return ['result' => false, 'error' => "Only the team owner can remove members."];
   }

   $password = (isset($request['password']) && $request['password']) ? $request['password'] : null;

   $stmt = $db->prepare("UPDATE groups SET sPassword = :password WHERE ID = :id;");
   $res = $stmt->execute(['password' => $password, 'id' => $team['ID']]);
   $team['sPassword'] = $password;
   return ['result' => $res, 'team' => $team];
}


function removeTeamMember($request) {
   // Remove a member from a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }
   if(!isset($request['idGroupChild']) || !$request['idGroupChild']) {
      return ['result' => false, 'error' => 'No user provided.'];
   }

   if($request['idGroupChild'] == $_SESSION['login']['idGroupSelf']) {
      // Removing oneself is handled by leaveTeam
      return leaveTeam($request);
   }

   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => "User doesn't belong to a team for this item."];
   }
   if(!$team['isAdmin']) {
      return ['result' => false, 'error' => "Only the team owner can remove members."];
   }

   $stmt = $db->prepare("SELECT ID FROM groups_groups WHERE idGroupParent = :idTeam AND idGroupChild = :idGroupChild;");
   $stmt->execute(['idTeam' => $team['ID'], 'idGroupChild' => $request['idGroupChild']]);
   $groupGroupID = $stmt->fetchColumn();

   if(!$groupGroupID) {
      return ['result' => false, 'error' => "This user doesn't belong to this team."];
   }

   // Check requirements
   $req = checkRequirements($team, $request['idItem'], $request['idGroupChild'], true);
   if(!$req['result']) { return $req; }

   $stmt = $db->prepare("DELETE FROM groups_groups WHERE ID = :id;");
   $stmt->execute(['id' => $groupGroupID]);

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


function leaveTeam($request) {
   // Leave a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'No item provided.'];
   }
   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => "User doesn't belong to a team for this item."];
   }

   // Check requirements
   $req = checkRequirements($team, $request['idItem'], $_SESSION['login']['idGroupSelf'], true);
   if(!$req['result']) { return $req; }

   // Get admin
   $stmt = $db->prepare("SELECT ID, idGroupParent FROM groups_groups WHERE idGroupChild = :idGroup AND sRole = 'owner';");
   $stmt->execute(['idGroup' => $team['ID']]);
   $adminGroupGroup = $stmt->fetch();

   $deleteGroupAfter = false;
   if($adminGroupGroup['idGroupParent'] == $_SESSION['login']['idGroupOwned']) {
      // User is owner of this group 
      $stmt = $db->prepare("SELECT users.idGroupOwned FROM users JOIN groups_groups ON idGroupChild = users.idGroupSelf WHERE users.idGroupOwned != :idCurrentOwner and groups_groups.idGroupParent = :idGroup ORDER BY groups_groups.sStatusDate ASC LIMIT 1;");
      $stmt->execute(['idCurrentOwner' => $_SESSION['login']['idGroupOwned'], 'idGroup' => $team['ID']]);
      $res = $stmt->fetch();
      if($res) {
         // Assign next oldest member as owner
         $stmt = $db->prepare("INSERT IGNORE INTO groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroupOwned, :idGroup, 0, 'direct', 'owner', NOW());");
         $stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'idGroup' => $idGroup]);
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
   $stmt->execute(['idGroup' => $team['ID'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);

   if($deleteGroupAfter) {
      // Delete team
      $stmt = $db->prepare("DELETE FROM groups WHERE ID = :id;");
      $stmt->execute(['id' => $team['ID']]);
   }

   Listeners::groupsGroupsAfter($db);

   return ['result' => true];
}


if($request['action'] == 'getTeam') {
   die(json_encode(getTeam($request)));
} elseif($request['action'] == 'createTeam') {
   die(json_encode(createTeam($request)));
} elseif($request['action'] == 'joinTeam') {
   die(json_encode(joinTeam($request)));
} elseif($request['action'] == 'changeTeamPassword') {
   die(json_encode(changeTeamPassword($request)));
} elseif($request['action'] == 'removeTeamMember') {
   die(json_encode(removeTeamMember($request)));
} elseif($request['action'] == 'leaveTeam') {
   die(json_encode(leaveTeam($request)));
}
