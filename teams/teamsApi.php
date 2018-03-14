<?php
// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'api_error'));
   exit();
}
if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo json_encode(array('result' => false, 'error' => 'api_needs_login'));
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
      // Get admin information
      $stmt = $db->prepare("
         SELECT groups_groups.idGroupParent, users.idGroupSelf
         FROM groups_groups
         JOIN users ON users.idGroupOwned = groups_groups.idGroupParent
         WHERE idGroupChild = :idTeam AND sRole = 'owner';");
      $stmt->execute(['idTeam' => $team['ID']]);
      $adminInfo = $stmt->fetch();
      $team['isAdmin'] = ($adminInfo['idGroupParent'] == $_SESSION['login']['idGroupOwned']);

      // Get other members
      $stmt = $db->prepare("
         SELECT groups_groups.idGroupChild, users.sFirstName, users.sLastName, groups.sName, groups_groups.sStatusDate, groups_ancestors.ID IS NOT NULL AS qualified
         FROM groups_groups
         JOIN groups ON groups_groups.idGroupChild = groups.ID
         JOIN users ON users.idGroupSelf = groups_groups.idGroupChild
         JOIN items
         LEFT JOIN groups_ancestors ON groups_groups.idGroupChild = groups_ancestors.idGroupChild AND groups_ancestors.idGroupAncestor = items.idTeamInGroup
         WHERE groups_groups.idGroupParent = :idTeam AND items.ID = :idItem;");
      $stmt->execute(['idTeam' => $team['ID'], 'idItem' => $idItem]);
      $children = $stmt->fetchAll();

      // Add admin information and sort children
      $team['children'] = [];
      foreach($children as $child) {
         $child['qualified'] = ($child['qualified'] == '1');
         $child['isAdmin'] = ($child['idGroupChild'] == $adminInfo['idGroupSelf']);
         if($child['idGroupChild'] == $_SESSION['login']['idGroupSelf']) {
            $team['user'] = $child;
         }
         if($child['isAdmin']) {
            array_unshift($team['children'], $child);
         } else {
            $team['children'][] = $child;
         }
      }

      // Get requirements information
      $team['checkRequirements'] = checkRequirements($team, $idItem);
   }
   return $team;
}


function checkRequirements($team, $idItem, $modGroup=null, $removing=false) {
   // Check whether a team still fulfills the requirements of the item after
   // adding or removing a member
   global $db;

   $stmt = $db->prepare("SELECT sTeamMode, bTeamsEditable, idTeamInGroup, iTeamMaxMembers from items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $idItem]);
   $item = $stmt->fetch();
   if(!$item || !$item['sTeamMode']) {
      // Item was deleted right now or someone is crafting requests
      return ['result' => false, 'error' => 'api_error'];
   }

   if($team) {
      $count = count($team['children']) + ($modGroup ? ($removing ? -1 : 1) : 0);
   } else {
      $count = 1;
   }

   if($count == 0) {
      // We're removing the last member
      return ['result' => true];
   }

   // Is the new number of people ok?
   if(!$removing && $item['iTeamMaxMembers'] && $count > $item['iTeamMaxMembers']) {
      return ['result' => false, 'error' => 'teams_max_members_reached'];
   }

   // Do the members satisfy the acceptance condition?
   if($item['sTeamMode'] != 'None' && $item['idTeamInGroup']) {
      $children = [];
      if(!$removing && $modGroup) {
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
         return ['result' => false, 'error' => 'teams_qualified_one'];
      } elseif($item['sTeamMode'] == 'Half' && $nbOk < $count / 2) {
         return ['result' => false, 'error' => 'teams_qualified_half'];
      } elseif($item['sTeamMode'] == 'All' && $nbOk < $count) {
         return ['result' => false, 'error' => 'teams_qualified_all'];
      }
   }
   return ['result' => true];
}

function getQualificationState($idItem) {
   // Check whether an user is qualified, and if not, whether they can enter a
   // team to participate
   global $db;

   $stmt = $db->prepare("SELECT * FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $idItem]);
   $item = $stmt->fetch();

   // Check qualification state
   if(!$item['idTeamInGroup'] || $item['sTeamMode'] == 'None') {
      // No qualification needed
      $qualState = 2;
   } else {
      $stmt = $db->prepare("SELECT ID FROM groups_ancestors WHERE idGroupAncestor = :idGroupAncestor AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idGroupAncestor' => $item['idTeamInGroup'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
      if($stmt->fetchColumn()) {
         // Qualified
         $qualState = 1;
      } else {
         // Not qualified; 0 means we can still enter a team  to participate, -1 means we can't
         $qualState = $item['sTeamMode'] == 'All' ? -1 : 0;
      }
   }
   return $qualState;
}

function canResetQualificationState() {
   // Check whether an user can reset their qualification state
   // TODO :: better criteria when we will have multiple badges
   $canReset = true;
   foreach($_SESSION['login']['aBadges'] as $badge) {
      if($badge['url'] == 'https://badges.concours-alkindi.fr/qualification_tour2/2018') { $canReset = false; }
   }
   //return $canReset;
   return false;
}

function generateUserItems($team) {
   // Generate all user_items for a team
   global $db;

   // * Generate missing attempts
   // Fetch attempts
   $attemptsIds = [];
   $stmt = $db->prepare("SELECT ID, idItem FROM groups_attempts WHERE idGroup = :idGroup;");
   $stmt->execute(['idGroup' => $team['ID']]);
   while($res = $stmt->fetch()) {
      $attemptsIds[$res['idItem']] = $res['ID'];
   }

   // Fetch list of items which have attempts
   $stmt = $db->prepare("
      SELECT items.ID
      FROM items
      JOIN items_ancestors ON items_ancestors.idItemChild = items.ID
      WHERE items.bHasAttempts = 1 AND items_ancestors.idItemAncestor = :idItem;");
   $stmt->execute(['idItem' => $team['idTeamItem']]);

   // Generate missing attempts
   while($res = $stmt->fetch()) {
      if(!isset($attemptsIds[$res['ID']])) {
         // Attempt is missing, create one
         $newId = getRandomId();
         $stmt2 = $db->prepare("INSERT INTO groups_attempts (ID, idGroup, idItem, idUserCreator, iOrder) VALUES (:id, :idGroup, :idItem, :idUser, 1);");
         $stmt2->execute(['id' => $newId, 'idGroup' => $team['ID'], 'idItem' => $res['ID'], 'idUser' => $_SESSION['login']['ID']]);
         $attemptsIds[$res['ID']] = $newId;
      }
   }


   // * Generate missing users_items
   // Set all users_items to be computed for this team
   $stmt = $db->prepare("
      UPDATE users_items
      JOIN users ON users_items.idUser = users.ID
      JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
      JOIN items_ancestors ON users_items.idItem = items_ancestors.idItemChild
      SET sAncestorsComputationState = 'todo'
      WHERE groups_groups.idGroupParent = :idGroup AND items_ancestors.idItemAncestor = :idItem;");
   $stmt->execute(['idGroup' => $team['ID'], 'idItem' => $team['idTeamItem']]);

   // Create missing user_items
   $stmt = $db->prepare("
      SELECT users.ID as idUser, items_ancestors.idItemChild as idItem
      FROM users
      JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
      JOIN items_ancestors
      JOIN items ON items_ancestors.idItemChild = items.ID
      WHERE groups_groups.idGroupParent = :idGroup AND items_ancestors.idItemAncestor = :idItem AND items.bHasAttempts = 1;");
   $stmt->execute(['idGroup' => $team['ID'], 'idItem' => $team['idTeamItem']]);

   while($res = $stmt->fetch()) {
      // Pretty inefficient but necessary because of getRandomID()
      $stmt2 = $db->prepare("INSERT IGNORE INTO `users_items` (`ID`, `idUser`, `idItem`, `idAttemptActive`, `sAncestorsComputationState`) VALUES (:ID, :idUser, :idItem, :idAttempt, 'todo');");
      $stmt2->execute(['ID' => getRandomID(), 'idUser' => $res['idUser'], 'idItem' => $res['idItem'], 'idAttempt' => $attemptsIds[$res['idItem']]]);
   }

   Listeners::computeAllUserItems($db);
}


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
   global $db;
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
   if(!$item['bTeamsEditable']) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Check user is qualified
   if($item['idTeamInGroup'] && $item['sTeamMode'] != 'None') {
      $stmt = $db->prepare("SELECT ID FROM groups_ancestors WHERE idGroupAncestor = :idGroupAncestor AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idGroupAncestor' => $item['idTeamInGroup'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
      if(!$stmt->fetchColumn()) {
         // Not qualified
         return ['result' => false, 'error' => 'teams_needs_qualification'];
      }
   }

   // Create new team
   $idGroup = getRandomID();
   $stmt = $db->prepare("INSERT INTO groups (ID, sName, sDateCreated, sPassword, sType, idTeamItem) VALUES(:id, :name, NOW(), :password, 'Team', :idItem);");
   $res = $stmt->execute(['id' => $idGroup, 'name' => $request['name'], 'password' => $request['password'], 'idItem' => $request['idItem']]);
   if(!$res) {
      return ['result' => false, 'error' => 'teams_creation_error'];
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
   if(!$item['bTeamsEditable']) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Get team
   $stmt = $db->prepare("SELECT ID FROM groups WHERE idTeamItem = :idItem AND sPassword = :password;");
   $stmt->execute(["idItem" => $request['idItem'], "password" => $request['password']]);
   $res = $stmt->fetch();

   if($res) {
      $team = getUserTeam($request['idItem'], true, $res['ID']);
      // Check requirements
      if($team['iTeamParticipating']) {
         $req = checkRequirements($team, $request['idItem'], $_SESSION['login']['idGroupSelf']);
         if(!$req['result']) { return $req; }
      }

      // Add user as member
      $stmt = $db->prepare("INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild, iChildOrder, sType, sRole, sStatusDate) VALUES(:idGroup, :idGroupSelf, 0, 'direct', 'member', NOW());");
      $stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf'], 'idGroup' => $team['ID']]);

      Listeners::groupsGroupsAfter($db);

      generateUserItems($team);

      // Send back information about the team
      return ['result' => true, 'team' => getUserTeam($request['idItem'], true)];
   } else {
      return ['result' => false, 'error' => 'teams_invalid_password'];
   }
}


function startItem($request) {
   // Get access to an item as a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }

   $team = getUserTeam($request['idItem'], true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }

   // Check requirements
   $req = checkRequirements($team, $request['idItem']);
   if(!$req['result']) { return $req; }

   // Grant access to the item
   $stmt = $db->prepare('insert into groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idGroup, :idItem, NOW(), NOW(), 1) on duplicate key update sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;');
   $stmt->execute(['idItem' => $request['idItem'], 'idGroup' => $team['ID']]);
   Listeners::groupsItemsAfter($db);

   // Update team participation status
   $stmt = $db->prepare('UPDATE groups SET iTeamParticipating = 1 WHERE ID = :id;');
   $stmt->execute(['id' => $team['ID']]);
   $team['iTeamParticipating'] = 1;

   generateUserItems($team);

   return ['result' => true, 'team' => $team];
}


function changeTeamPassword($request) {
   // Change the password for a team
   global $db;
   if(!isset($request['idItem']) || !$request['idItem']) {
      return ['result' => false, 'error' => 'api_error'];
   }

   $stmt = $db->prepare("SELECT bTeamsEditable FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = $stmt->fetch();
   // Check item allows team modifications
   if(!$item['bTeamsEditable']) {
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

   $stmt = $db->prepare("UPDATE groups SET sPassword = :password WHERE ID = :id;");
   $res = $stmt->execute(['password' => $password, 'id' => $team['ID']]);
   $team['sPassword'] = $password;
   return ['result' => $res, 'team' => $team];
}


function removeTeamMember($request) {
   // Remove a member from a team
   global $db;
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
   if(!$item['bTeamsEditable']) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   if($request['idGroupChild'] == $_SESSION['login']['idGroupSelf']) {
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
   removeMemberData($team, $stmt->fetchColumn(), $_SESSION['login']['ID']);

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
   global $db;
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
   if(!$item['bTeamsEditable']) {
      return ['result' => false, 'error' => 'teams_not_editable'];
   }

   // Check requirements
   if($team['iTeamParticipating']) {
      $req = checkRequirements($team, $request['idItem'], $_SESSION['login']['idGroupSelf'], true);
      if(!$req['result']) { return $req; }
   }

   // Get admin
   $stmt = $db->prepare("SELECT ID, idGroupParent FROM groups_groups WHERE idGroupChild = :idGroup AND sRole = 'owner';");
   $stmt->execute(['idGroup' => $team['ID']]);
   $adminGroupGroup = $stmt->fetch();

   $deleteGroupAfter = false;
   if($adminGroupGroup['idGroupParent'] == $_SESSION['login']['idGroupOwned']) {
      // User is owner of this group 
      $stmt = $db->prepare("SELECT users.ID, users.idGroupOwned FROM users JOIN groups_groups ON idGroupChild = users.idGroupSelf WHERE users.idGroupOwned != :idCurrentOwner and groups_groups.idGroupParent = :idGroup ORDER BY groups_groups.sStatusDate ASC LIMIT 1;");
      $stmt->execute(['idCurrentOwner' => $_SESSION['login']['idGroupOwned'], 'idGroup' => $team['ID']]);
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
   $stmt->execute(['idGroup' => $team['ID'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);

   if($deleteGroupAfter) {
      // Delete team
      $stmt = $db->prepare("DELETE FROM groups WHERE ID = :id;");
      $stmt->execute(['id' => $team['ID']]);
   } else {
      // Unlink data from us
      if(!isset($newAdmin)) {
         $stmt = $db->prepare("SELECT ID FROM users WHERE idGroupOwned = :idGroupOwned;");
         $stmt->execute(['idGroupOwned' => $adminGroupGroup['idGroupParent']]);
         $newAdmin = $stmt->fetch();
      }
      removeMemberData($team, $_SESSION['login']['ID'], $newAdmin['ID']);
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
