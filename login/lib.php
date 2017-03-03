<?php


function createGroupsFromLogin($db, $sLogin, $isTempUser=0) {
   $userSelfGroupId = getRandomID();
   $query = "insert into `groups` (`ID`, `sName`, `sDescription`, `sDateCreated`, `bOpened`, `sType`, `bSendEmails`) values ('".$userSelfGroupId."', '".$sLogin."', '".$sLogin."', NOW(), 0, 'UserSelf', 0);";
   $db->exec($query);
   $userAdminGroupId = null;
   if ($isTempUser) {
      $stm = $db->prepare('select ID from groups where `sName`=\'tempUsers\';');
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
            $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1); unlock tables;');
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
      $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert ignore into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1); unlock tables;');
      $stmt->execute(['idGroupParent' => $previousGroupId, 'idGroupChild' => $idGroupSelf]);
      $launchTriggers = true;
   }
   if ($launchTriggers) {
      Listeners::createNewAncestors($db, "groups", "Group");
   }

}

function handleBadges($idUser, $idGroupSelf, $aBadges) {
    foreach($aBadges as $badge_data) {
        $badge = $badge_data['url'];
        if (substr($badge, 0, 9) === 'groups://') {
            $splitGroups = explode('/', substr($badge, 9));
            $role = array_pop($splitGroups);
            addUserToGroupHierarchy($idGroupSelf, $splitGroups, $role);
        }
    }
}