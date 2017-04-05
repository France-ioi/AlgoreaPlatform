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
   $stm = null;
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

function addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $groupHierarchy, $role) {
   global $db;
   if ($role != 'member' && $role != 'manager') return;
   $previousGroupId = null;
   $launchTriggers = false;

   // Find the group corresponding to the hierarchy
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

   if($role == 'manager') {
      $groupInfo = array('idGroupParent' => $idGroupOwned, 'idGroupChild' => $previousGroupId);
   } else { // member role
      $groupInfo = array('idGroupParent' => $previousGroupId, 'idGroupChild' => $idGroupSelf);
   }

   // Check the relation doesn't already exist
   $stmt = $db->prepare('select groups_groups.ID from groups_groups where groups_groups.idGroupChild = :idGroupChild and groups_groups.idGroupParent = :idGroupParent;');
   $stmt->execute($groupInfo);
   $groupGroupId = $stmt->fetchColumn();
   if (!$groupGroupId) {
      $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert ignore into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1); unlock tables;');
      $stmt->execute($groupInfo);
      $launchTriggers = true;
   }

   $stmt = null;
   // Launch triggers only if something happened
   if ($launchTriggers) {
      Listeners::createNewAncestors($db, "groups", "Group");
   }

}

function handleBadges($idUser, $idGroupSelf, $idGroupOwned, $aBadges) {
    foreach($aBadges as $badge_data) {
        $badge = $badge_data['url'];
        if (substr($badge, 0, 9) === 'groups://') {
            $splitGroups = explode('/', substr($badge, 9));
            $role = array_pop($splitGroups);
            addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $splitGroups, $role);
        }
    }
}


function remapUserArray($user) {
    $map = [
        'idUser' => 'id',
        'sLogin' => 'login',
        'sEmail' => 'primary_email',
        'sFirstName' => 'first_name',
        'sLastName' => 'last_name',
        'sStudentId' => 'student_id',
        'sCountryCode' => 'country_code',
        'sBirthDate' => 'birthday',
        'iGraduationYear' => 'graduation_year',
        'sAddress' => 'address',
        'sZipcode' => 'zipcode',
        'sCity' => 'city',
        'sLandLineNumber' => 'primary_phone',
        'sCellPhoneNumber' => 'secondary_phone',
        'sDefaultLanguage' => 'language',
        'sFreeText' => 'presentation',
        'sWebSite' => 'website',
        'sLastIP' => 'ip',
        'aBadges' => 'badges'
    ];
    $res = [];
    foreach($map as $k => $v) {
        $res[$k] = isset($user[$v]) ? $user[$v] : null;
    }

    $res['sSex'] = null;
    if(!empty($user['gender'])) {
        if($user['gender'] == 'm') {
            $res['sSex'] = 'Male';
        } else if($user['gender'] == 'f') {
            $res['sSex'] = 'Female';
        }
    }
    $res['bEmailVerified'] = !empty($user['primary_email_verified']) ? 1 : 0;
    $res['sCountryCode'] = strtolower($res['sCountryCode']);
    return $res;
}



function createUpdateUser($db, $params) {
    if (!$params || empty($params) || !isset($params['idUser']) || !intval($params['idUser'])) {
        echo json_encode(["result" => false, "error" => "invalid or empty user data"]);
        return;
    }

    foreach ($params as $param_k => $param_v) {
        $_SESSION['login'][$param_k] = $param_v;
    }
    //$_SESSION['login']['sToken'] = $request['token'];
    $_SESSION['login']['tempUser'] = 0;
    $_SESSION['login']['loginId'] = $params['idUser'];
    $query = 'select ID, idGroupSelf, idGroupOwned, bIsAdmin from users where `loginID`= :idUser ;';
    $stm = $db->prepare($query);
    $stm->execute(array('idUser' => $params['idUser']));
    $res = $stm->fetch();
    if(!$res) {
        list($userAdminGroupId, $userSelfGroupId) = createGroupsFromLogin($db, $params['sLogin']);
        $userId = getRandomID();

        $stmt = $db->prepare("
            insert into `users`
            (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`, `sEmail`, `sFirstName`, `sLastName`, `sStudentId`, `sCountryCode`, `sBirthDate`, `iGraduationYear`, `sAddress`, `sZipcode`, `sCity`, `sLandLineNumber`, `sCellPhoneNumber`, `sDefaultLanguage`, `sFreeText`, `sWebSite`, `sLastIP`, `sSex`)
            values
            (:ID, :idUser, :sLogin, '0', NOW(), :userSelfGroupId, :userAdminGroupId, :sEmail, :sFirstName, :sLastName, :sStudentId, :sCountryCode, :sBirthDate, :iGraduationYear, :sAddress, :sZipcode, :sCity, :sLandLineNumber, :sCellPhoneNumber, :sDefaultLanguage, :sFreeText, :sWebSite, :sLastIP, :sSex);
        ");
        $stmt->execute([
            'ID' => $userId,
            'idUser' => $params['idUser'],
            'sLogin' => $params['sLogin'],
            'userAdminGroupId' => $userAdminGroupId,
            'userSelfGroupId' => $userSelfGroupId,
            'sEmail' => $params['sEmail'],
            'sFirstName' => $params['sFirstName'],
            'sLastName' => $params['sLastName'],
            'sStudentId' => $params['sStudentId'],
            'sCountryCode' => ''.$params['sCountryCode'],
            'sBirthDate' => $params['sBirthDate'],
            'iGraduationYear' => 0+$params['iGraduationYear'],
            'sAddress' => ''.$params['sAddress'],
            'sZipcode' => ''.$params['sZipcode'],
            'sCity' => ''.$params['sCity'],
            'sLandLineNumber' => ''.$params['sLandLineNumber'],
            'sCellPhoneNumber' => ''.$params['sCellPhoneNumber'],
            'sDefaultLanguage' => ''.$params['sDefaultLanguage'],
            'sFreeText' => ''.$params['sFreeText'],
            'sWebSite' => ''.$params['sWebSite'],
            'sLastIP' => ''.$params['sLastIP'],
            'sSex' => $params['sSex'],
        ]);
        $_SESSION['login']['ID'] = $userId;
        $_SESSION['login']['idGroupSelf'] = $userSelfGroupId;
        $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
        $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
        $_SESSION['login']['idGroupOwned'] = $userAdminGroupId;
        $_SESSION['login']['bIsAdmin'] = false;
    } else {
        $stmt = $db->prepare("
            update `users` set
                `sLogin` = :sLogin,
                `sEmail` = :sEmail,
                `sFirstName` = :sFirstName,
                `sLastName` = :sLastName,
                `sStudentId` = :sStudentId ,
                `sCountryCode` = :sCountryCode,
                `sBirthDate` = :sBirthDate,
                `iGraduationYear` = :iGraduationYear,
                `sAddress` = :sAddress,
                `sZipcode` = :sZipcode,
                `sCity` = :sCity,
                `sLandLineNumber` = :sLandLineNumber,
                `sCellPhoneNumber` = :sCellPhoneNumber,
                `sDefaultLanguage` = :sDefaultLanguage,
                `sFreeText` = :sFreeText,
                `sWebSite` = :sWebSite,
                `sLastIP` = :sLastIP,
                `sSex` = :sSex
            where ID = :ID;");
        $stmt->execute([
            'ID' => $res['ID'],
            'sLogin' => $params['sLogin'],
            'sEmail' => $params['sEmail'],
            'sFirstName' => $params['sFirstName'],
            'sLastName' => $params['sLastName'],
            'sStudentId' =>$params['sStudentId'],
            'sCountryCode' => ''.$params['sCountryCode'],
            'sBirthDate' => $params['sBirthDate'],
            'iGraduationYear' => 0+$params['iGraduationYear'],
            'sAddress' => ''.$params['sAddress'],
            'sZipcode' => ''.$params['sZipcode'],
            'sCity' => ''.$params['sCity'],
            'sLandLineNumber' => ''.$params['sLandLineNumber'],
            'sCellPhoneNumber' => ''.$params['sCellPhoneNumber'],
            'sDefaultLanguage' => ''.$params['sDefaultLanguage'],
            'sFreeText' => ''.$params['sFreeText'],
            'sWebSite' => ''.$params['sWebSite'],
            'sLastIP' => ''.$params['sLastIP'],
            'sSex' => $params['sSex'],
        ]);

        $_SESSION['login']['ID'] = $res['ID'];
        $_SESSION['login']['idGroupSelf'] = $res['idGroupSelf'];
        $_SESSION['login']['idGroupOwned'] = $res['idGroupOwned'];
        $_SESSION['login']['bIsAdmin'] = $res['bIsAdmin'];
        $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
        $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
    }
    if (isset($params['aBadges'])) {
        handleBadges($_SESSION['login']['ID'], $_SESSION['login']['idGroupSelf'], $_SESSION['login']['idGroupOwned'], $params['aBadges']);
    }
    echo json_encode(array('result' => true, 'sLogin' => $params['sLogin'], 'ID' => $_SESSION['login']['ID'], 'loginData' => $_SESSION['login']));
}
