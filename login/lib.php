<?php


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

function addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $groupHierarchy, $role, $direct=true) {
   // Add a user to a group represented by a hierarchy
   // role: member or manager
   // direct: true = search a direct child at each level
   //        false = search any descendant

   global $db;
   if ($role != 'member' && $role != 'manager') return;

   $previousGroupId = null;
   $launchTriggers = false;

   // Find the group corresponding to the hierarchy
   foreach($groupHierarchy as $groupInfo) {
      list($groupTextId, $groupName) = $groupInfo;

      if($direct) {
         // Search for a child group matching, create it if it doesn't exist
         $groupId = null;
         if (!$previousGroupId) {
            $stmt = $db->prepare('select ID from groups where sTextId = :groupTextId;');
            $stmt->execute(['groupTextId' => $groupTextId]);
            $groupId = $stmt->fetchColumn();
         } else {
            $stmt = $db->prepare('select groups.ID from groups join groups_groups on groups_groups.idGroupChild = groups.ID where groups.sTextId = :groupTextId and groups_groups.idGroupParent = :previousGroupId;');
            $stmt->execute(['groupTextId' => $groupTextId, 'previousGroupId' => $previousGroupId]);
            $groupId = $stmt->fetchColumn();
         }
         if ($groupId) {
            // Update name of old group
            $stmt = $db->prepare('UPDATE groups SET sName=:groupName where ID=:id');
            $stmt->execute(['groupName' => $groupName, 'id' => $groupId]);
         } else {
            // Create new group
            $launchTriggers = true;
            $groupId = getRandomID();
            $stmt = $db->prepare('insert into groups (ID, sName, sTextId, sDateCreated) values (:ID, :sName, :sTextId, NOW());');
            $stmt->execute(['ID' => $groupId, 'sName' => $groupName, 'sTextId' => $groupTextId]);
            if ($previousGroupId) {
               $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`, `sStatusDate`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1, NOW()); unlock tables;');
               $stmt->execute(['idGroupParent' => $previousGroupId, 'idGroupChild' => $groupId]);
            }
         }
         $previousGroupId = $groupId;
      } else {
         // Search for any descendant group matching; names are not updated
         if (!$previousGroupId) {
            $stmt = $db->prepare('select ID from groups where sTextId = :groupTextId;');
            $stmt->execute(['groupTextId' => $groupTextId]);
            $groupId = array($stmt->fetchColumn());
         } else {
            $groupId = array();
            $condition = 'groups_ancestors.idGroupAncestor IN ('.implode(', ', $previousGroupId).')';
            $stmt = $db->prepare('select groups.ID from groups join groups_ancestors on groups_ancestors.idGroupChild = groups.ID where groups.sTextId = :groupTextId and '.$condition.';');
            $stmt->execute(['groupTextId' => $groupTextId]);
            while(($newGroupId = $stmt->fetchColumn()) !== FALSE) {
               $groupId[] = $newGroupId;
            }
         }
         if(count($groupId) == 0) { return; }
         $previousGroupId = $groupId;
      }
   }
   if(!$previousGroupId) return;

   if($direct) {
      $previousGroupId = array($previousGroupId);
   }

   foreach($previousGroupId as $targetGroupId) {
      // Add member/manager reights to each group
      if($role == 'manager') {
         $groupInfo = array('idGroupParent' => $idGroupOwned, 'idGroupChild' => $targetGroupId);
      } else { // member role
         $groupInfo = array('idGroupParent' => $targetGroupId, 'idGroupChild' => $idGroupSelf);
      }

      // Check the relation doesn't already exist
      $stmt = $db->prepare('select groups_groups.ID from groups_groups where groups_groups.idGroupChild = :idGroupChild and groups_groups.idGroupParent = :idGroupParent;');
      $stmt->execute($groupInfo);
      $groupGroupId = $stmt->fetchColumn();
      if (!$groupGroupId) {
         $stmt = $db->prepare('lock tables groups_groups write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroupParent),0); insert ignore into `groups_groups` (`idGroupParent`, `idGroupChild`, `iChildOrder`, `sStatusDate`) values (:idGroupParent, :idGroupChild, @maxIChildOrder+1, NOW()); unlock tables;');
         $stmt->execute($groupInfo);
         $launchTriggers = true;
      }
   }

   $stmt = null;
   // Launch triggers only if something happened
   if ($launchTriggers) {
      Listeners::createNewAncestors($db, "groups", "Group");
   }

}

function handleBadges($idUser, $idGroupSelf, $idGroupOwned, $aBadges) {
   // Handle badges sent by login module
   // So far, only badges built from PMS info are supported

   // Depth levels for each protocol
   $protocolsArgs = array(
      'teacher' => 1,
      'school' => 1,
      'grade' => 1,
      'competition' => 2
      );

   // Member
   $pmsMemberInfo = array(
      'teacher' => array(array('teacher_none', 'Teacher unknown')),
      'school' => array(),
      'grade' => array(array('grade_unknown', 'Grade unknown')),
      'competition' => array()
      );

   // Manager info (only teacher for now)
   $pmsTeacherInfo = null;

   foreach($aBadges as $badge_data) {
      $badge = $badge_data['url'];
      $splitProtocol = explode('://', $badge);
      if(count($splitProtocol) != 2) { continue; } // unsupported

      $protocol = $splitProtocol[0];
      if(!isset($protocolsArgs[$protocol])) { continue; } // unsupported protocol

      $path = explode('/', $splitProtocol[1], 2+$protocolsArgs[$protocol]*2);
      if(count($path) < 4) { continue; } // unsupported

      $domain = $path[0];
      if($domain == 'pms.bwinf.de') { // no support yet for other domains
         $role = $path[1];

         // Consolidate path into tuples (sTextId, sName)
         $pathWithNames = array();
         for($i = 1; $i < count($path)/2; $i++) {
            $pathWithNames[] = array($path[$i*2], $path[$i*2+1]);
         }

         if($role == 'member') {
            if($protocol == 'teacher' || $protocol == 'grade') {
               $pmsMemberInfo[$protocol] = $pathWithNames;
            } elseif($protocol == 'school' || $protocol == 'competition') {
               $pmsMemberInfo[$protocol][] = $pathWithNames;
            }
         } elseif($role == 'manager' && $protocol == 'teacher') {
            $pmsTeacherInfo = $pathWithNames;
         }
      }
   }

   $basePms = array(array('PMS', 'PMS'));
   $basePmsSchools = array(array('schools', 'Schulen'));
   $basePmsCompetitions = array(array('competitions', 'Wettbewerbe'));

   // Add member info
   $schoolPath = null;
   if($pmsMemberInfo['teacher'] && count($pmsMemberInfo['school']) > 0) {
      $schoolPath = array_merge($pmsMemberInfo['school'][0], $pmsMemberInfo['teacher']); // used later
      // PMS/school/teacher/grade/
      $fullPath = array_merge($basePms, $basePmsSchools, $schoolPath, $pmsMemberInfo['grade']);
      addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $fullPath, 'member');
   }

   foreach($pmsMemberInfo['competition'] as $competitionPath) {
      if($schoolPath !== null) {
         // PMS/competition/school/teacher/grade/
         $compPath1 = array_merge($basePms, $basePmsCompetitions, array($competitionPath[0]), $schoolPath, array($competitionPath[1]));
         addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $compPath1, 'member');
         // PMS/schools/school_/teacher_/competition_/grade_/
         $compPath2 = array_merge($basePms, $basePmsSchools, $schoolPath, $competitionPath);
         addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $compPath2, 'member');
      } else {
         // PMS/competitions/competition_/grade_/
         $compPath = array_merge($basePms, $basePmsCompetitions, $competitionPath);
         addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $compPath, 'member');
      }
   }

   // Add teacher info
   if($pmsTeacherInfo) {
      // Add groups for each school
      foreach($pmsMemberInfo['school'] as $school) {
         $schoolPath = array_merge($basePms, $school, $pmsTeacherInfo);
         addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, $schoolPath, 'manager');
      }
      // Look up for other groups corresponding to that teacher (subgroups of competitions for instance)
      addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, array_merge($basePms, $pmsTeacherInfo), 'manager', false);
      // Add all teachers to a special group
      addUserToGroupHierarchy($idGroupSelf, $idGroupOwned, array(array('PMS', 'PMS'), array('teachers', 'Lehrer')), 'member');
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
        'iGrade' => 'graduation_grade',
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
            (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`, `sEmail`, `sFirstName`, `sLastName`, `sStudentId`, `sCountryCode`, `sBirthDate`, `iGraduationYear`, `iGrade`, `sAddress`, `sZipcode`, `sCity`, `sLandLineNumber`, `sCellPhoneNumber`, `sDefaultLanguage`, `sFreeText`, `sWebSite`, `sLastIP`, `sSex`)
            values
            (:ID, :idUser, :sLogin, '0', NOW(), :userSelfGroupId, :userAdminGroupId, :sEmail, :sFirstName, :sLastName, :sStudentId, :sCountryCode, :sBirthDate, :iGraduationYear, :iGrade, :sAddress, :sZipcode, :sCity, :sLandLineNumber, :sCellPhoneNumber, :sDefaultLanguage, :sFreeText, :sWebSite, :sLastIP, :sSex);
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
            'iGrade' => $params['iGrade'],
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
                `iGrade` = :iGrade,
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
            'iGrade' => $params['iGrade'],
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
