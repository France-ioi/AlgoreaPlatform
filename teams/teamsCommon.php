<?php
if (session_status() === PHP_SESSION_NONE){session_start();}
if(!function_exists('syncDebug')) { function syncDebug($type, $b_or_e, $subtype='') {} }
require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";
require_once __DIR__."/../commonFramework/modelsManager/modelsTools.inc.php"; // for getRandomID


// *** Helper functions for teams

function getUserTeam($idItem, $getExtra=false, $idTeam=null) {
   // Get the team on some item for the current user
   // Returns either the group information, either null if no team was found
   global $db, $loginData;
   if($idTeam) {
      $stmt = $db->prepare("SELECT groups.* FROM groups WHERE ID = :id;");
      $stmt->execute(['id' => $idTeam]);
   } else {
      $stmt = $db->prepare("SELECT groups.* FROM groups JOIN groups_groups ON idGroupParent = groups.ID WHERE idTeamItem = :idItem AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $loginData['idGroupSelf']]);
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
      $team['isAdmin'] = ($adminInfo['idGroupParent'] == $loginData['idGroupOwned']);

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
         if($child['idGroupChild'] == $loginData['idGroupSelf']) {
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
   global $db, $loginData, $teamsApiBypass;

   if(isset($teamsApiBypass)) {
      return ['result' => true];
   }

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
   global $db, $loginData;

   $stmt = $db->prepare("SELECT * FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $idItem]);
   $item = $stmt->fetch();

   // Check qualification state
   if(!$item['idTeamInGroup'] || $item['sTeamMode'] == 'None') {
      // No qualification needed
      $qualState = 2;
   } else {
      $stmt = $db->prepare("SELECT ID FROM groups_ancestors WHERE idGroupAncestor = :idGroupAncestor AND idGroupChild = :idGroupSelf;");
      $stmt->execute(['idGroupAncestor' => $item['idTeamInGroup'], 'idGroupSelf' => $loginData['idGroupSelf']]);
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
   global $loginData;

   $canReset = true;
   foreach($loginData['aBadges'] as $badge) {
      if($badge['url'] == 'https://badges.concours-alkindi.fr/qualification_tour2/2018') { $canReset = false; }
   }
   //return $canReset;
   return false;
}

function generateUserItems($team) {
   // Generate all user_items for a team
   global $db, $loginData;

   // * Fetch attempts
   $attemptsIds = [];
   $stmt = $db->prepare("SELECT ID, idItem FROM groups_attempts WHERE idGroup = :idGroup;");
   $stmt->execute(['idGroup' => $team['ID']]);
   while($res = $stmt->fetch()) {
      $attemptsIds[$res['idItem']] = $res['ID'];
   }

   // * Generate missing users_items
   // Create missing users_items for the chapter item
   $stmt = $db->prepare("
      INSERT IGNORE INTO users_items (idUser, idItem)
      (SELECT users.ID AS idUser, :idItem AS idItem
       FROM users
       JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
       WHERE groups_groups.idGroupParent = :idGroup);");
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
      $curAttemptId = isset($attemptsIds[$res['idItem']]) ? $attemptsIds[$res['idItem']] : null;
      // Pretty inefficient but necessary because of getRandomID()
      $stmt2 = $db->prepare("INSERT IGNORE INTO `users_items` (`ID`, `idUser`, `idItem`, `idAttemptActive`, `sAncestorsComputationState`) VALUES (:ID, :idUser, :idItem, :idAttempt, 'todo');");
      $stmt2->execute(['ID' => getRandomID(), 'idUser' => $res['idUser'], 'idItem' => $res['idItem'], 'idAttempt' => $curAttemptId]);
   }

   // Set all attempts to be propagated for this team
   $stmt = $db->prepare("
      UPDATE groups_attempts
      SET sAncestorsComputationState = 'todo'
      WHERE groups_attempts.idGroup = :idGroup;");
   $stmt->execute(['idGroup' => $team['ID']]);

   $stmt = null;
   $stmt2 = null;
   Listeners::propagateAttempts($db);
   Listeners::computeAllUserItems($db);
}

function openContestTeam($idItem) {
   // Open a contest for the team
   global $db, $loginData;

   $team = getUserTeam($idItem, true);
   if(!$team) {
      return ['result' => false, 'error' => 'teams_no_team'];
   }

   // Check requirements
   $req = checkRequirements($team, $idItem);
   if(!$req['result']) { return $req; }

   $stmt = $db->prepare('select NOW() as now, items.*, users_items.*, TIME_TO_SEC(items.sDuration) as duration, max(groups_items.bCachedFullAccess) as fullAccess, DATE_ADD(items.sEndContestDate, INTERVAL 1 DAY) as contestEndDate from items
       left join users_items on users_items.idItem = items.ID and users_items.idUser = :idUser
       JOIN groups_ancestors as my_groups_ancestors ON my_groups_ancestors.idGroupChild = :idGroupSelf
       JOIN groups_items ON groups_items.idGroup = my_groups_ancestors.idGroupAncestor AND groups_items.idItem = items.ID
       WHERE items.ID = :idItem AND (`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) group by items.ID;');
   $stmt->execute(['idItem' => $idItem, 'idUser' => $loginData['ID'], 'idGroupSelf' => $loginData['idGroupSelf']]);
   $contestData = $stmt->fetch();
   if (!$contestData) {
       return ['success' => false, 'error' => "le concours n'existe pas ou vous n'y avez pas accès"];
   }
   if (!intval($contestData['duration'])) {
       return ['success' => false, 'error' => "l'item demandé n'est pas un concours"];
   }
   if ($contestData['sAccessOpenDate'] && !$contestData['fullAccess'] && $contestData['sAccessOpenDate'] > $contestData['now']) {
       return ['success' => false, 'error' => "le concours n'a pas encore commencé"];
   }
   if ($contestData['sEndContestDate'] && !$contestData['fullAccess'] && $contestData['contestEndDate'] < $contestData['now']) {
       return ['success' => false, 'error' => "le concours est terminé"];
   }
/*   if (isset($contestData['sContestStartDate']) && $contestData['sContestStartDate'] && !$reopen) {
       return ['success' => false, 'error' => "vous avez déjà commencé ce concours"];
   }*/

   // Generate all user items
   generateUserItems($team);

   // Update them with contest info
   $stmt = $db->prepare("
      UPDATE users_items
      JOIN users ON users_items.idUser = users.ID
      JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
      SET users_items.sContestStartDate = NOW(), users_items.sLastActivityDate = NOW(), users_items.sStartDate = NOW()
      WHERE groups_groups.idGroupParent = :idGroup AND users_items.idItem = :idItem;");
   $stmt->execute(['idGroup' => $team['ID'], 'idItem' => $idItem]);

   // Update team participation status
   $stmt = $db->prepare('UPDATE groups SET iTeamParticipating = 1 WHERE ID = :id;');
   $stmt->execute(['id' => $team['ID']]);
   $team['iTeamParticipating'] = 1;

   // Open access
   $stmt = $db->prepare('INSERT into groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idGroup, :idItem, NOW(), NOW(), 1) on duplicate key update sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;');
   $stmt->execute(['idItem' => $idItem, 'idGroup' => $team['ID']]);
   Listeners::groupsItemsAfter($db);

   $startTime = new DateTime($contestData['now']);
   $endTime = new DateTime($contestData['now']);
   $duration = new DateInterval('PT'.$contestData['duration'].'S');
   $endTime->add($duration);

   return ['result' => true, 'team' => $team, 'endTime' => $endTime->getTimestamp(), 'startTime' => $startTime->getTimestamp(), 'duration' => $contestData['duration']];
}


function closeContestTeam($idItem) {
   // Close a contest for the team
   global $db, $loginData;
   $team = getUserTeam($idItem, true);

   // Set contest as finished
   $stmt = $db->prepare("
      UPDATE users_items
      JOIN users ON users_items.idUser = users.ID
      JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
      SET sFinishDate = NOW()
      WHERE groups_groups.idGroupParent = :idGroup AND users_items.idItem = :idItem;");
   $stmt->execute(['idGroup' => $team['ID'], 'idItem' => $idItem]);

   // Remove access
   $stmt = $db->prepare('UPDATE groups_items SET sPartialAccessDate = null, sCachedPartialAccessDate = null, bCachedPartialAccess = 0 where idItem = :idItem and idGroup = :idGroup and bManagerAccess = 0;');
   $stmt->execute(['idItem' => $idItem, 'idGroup' => $team['ID']]);
   Listeners::groupsItemsAfter($db);
}
