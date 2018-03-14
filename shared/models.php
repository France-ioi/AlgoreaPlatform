<?php
/* Copyright (c) 2013 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

$tablesModels = array (
   "filters" => array(
      "autoincrementID" => false,
      "fields" => array(
         "idUser" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bSelected" => array("skipHistory" => true, "type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bStarred" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sStartDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sEndDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "bArchived" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bParticipated" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bUnread" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "idItem" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "idGroup" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "olderThan" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "newerThan" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sUsersSearch" => array("type" => "srting", "access" => array("write" => array("user"), "read" => array("user"))),
         "sBodySearch" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bImportant" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
      )
   ),

   "groups" => array(
      "autoincrementID" => false,
      "fields" => array(
         "sName" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iGrade" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sGradeDetails" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sDescription" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sDateCreated" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "bOpened" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bFreeAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "idTeamItem" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "iTeamParticipating" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPassword" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPasswordTimer" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPasswordEnd" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sRedirectPath" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bOpenContest" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bSendEmails" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")))
      )
   ),

    "groups_login_prefixes" => array(
        "autoincrementID" => false,
        "fields" => array(
            "idGroup" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
            "prefix" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
        )
    ),

   "groups_groups" => array(
      "autoincrementID" => false,
      "fields" => array(
         "idGroupParent" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idGroupChild" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iChildOrder" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sRole" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sStatusDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "idUserInviting" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      ),
      "listeners" => array(
         "after" => "Listeners::groupsGroupsAfter"
      )
   ),

   "groups_ancestors" => array(
      "fields" => array(
         "idGroupAncestor" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idGroupChild" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bIsSelf" => array("type" => "boolean", "access" => array("write" => array("user"), "read" => array("user"))),
      )
   ),

   "items" => array(
      "autoincrementID" => false,
      "fields" => array(
         "sUrl" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idPlatform" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sTextId" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bUsesAPI" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bReadOnly" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sFullScreen" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bShowDifficulty" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bShowSource" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bHintsAllowed" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bFixedRanks" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sValidationType" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iValidationMin" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPreparationState" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idItemUnlocked" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iScoreMinUnlock" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sSupportedLangProg" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idDefaultLanguage" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sTeamMode" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bTeamsEditable" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "idTeamInGroup" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "iTeamMaxMembers" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bHasAttempts" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sAccessOpenDate" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sDuration" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sEndContestDate" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bShowUserInfos" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sContestPhase" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iLevel" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bNoScore" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bTitleBarVisible" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bTransparentFolder" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bDisplayDetailsInParent" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bDisplayChildrenAsTabs" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCustomChapter" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
         "groupCodeEnter" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")))
      )
   ),
   "items_items" => array(
      "autoincrementID" => false,
      "fields" => array(
         "idItemParent" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idItemChild" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "iChildOrder" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sCategory" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "bAccessRestricted" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bAlwaysVisible" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "iDifficulty" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
      ),
      "listeners" => array(
         "after" => "Listeners::itemsItemsAfter"
      )
   ),
   "items_ancestors" => array(
      "fields" => array(
         "idItemAncestor" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idItemChild" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
      )
   ),
   "items_strings" => array(
      "autoincrementID" => false,
      "fields" => array(
         "idItem" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idLanguage" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sTranslator" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sTitle" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sImageUrl" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sSubtitle" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sDescription" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sEduComment" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sRankingComment" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
      )
   ),
   "languages" => array(
      "autoincrementID" => false,
      "fields" => array(
          "sName"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sCode"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
      )
   ),

   "groups_attempts" => array(
      "autoincrementID" => false,
      "fields" => array(
          "idGroup"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "idItem"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "idUserCreator"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "iOrder"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "iScore"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreComputed"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreReeval"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreDiffManual"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sScoreDiffComment"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbSubmissionsAttempts"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbTasksTried"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbChildrenValidated"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bValidated"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bFinished"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bKeyObtained"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbTasksWithHelp"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sHintsRequested"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbHintsCached"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbCorrectionsRead"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iPrecision"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "iAutonomy"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "sValidationDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sLastAnswerDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sThreadStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sLastHintDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sFinishDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "sLastActivityDate"  => array("type" => "date", 'skipHistory' => true, "access" => array("write" => array("user"), "read" => array("user"))),
          "sContestStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bRanked"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sAllLangProg"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
      ),
      "listeners" => array(
         "after" => "Listeners::GroupsAttemptsAfter"
      )
   ),
   "groups_items" => array(
      "autoincrementID" => false,
      "fields" => array(
         "idGroup" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idItem" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "idUserCreated" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPartialAccessDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sFullAccessDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sAccessReason" => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
         "sAccessSolutionsDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "bOwnerAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bManagerAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sCachedPartialAccessDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sCachedFullAccessDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sCachedAccessSolutionsDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "sCachedGrayedAccessDate" => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCachedFullAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCachedPartialAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCachedAccessSolutions" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCachedGrayedAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "bCachedManagerAccess" => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
         "sPropagateAccess" => array("skipHistory" => true, "type" => "string", "access" => array("write" => array("admin"), "read" => array("user"))),
      ),
      "listeners" => array(
         "before" => "Listeners::groupsItemsBefore",
         "after" => "Listeners::groupsItemsAfter"
      )
   ),

   "messages" => array(
      "autoincrementID" => false,
      "fields" => array(
          "idThread"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "idUser"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sSubmissionDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "bPublished"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sTitle"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sBody"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "bTrainersOnly"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "bArchived"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "bPersistant"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
      )
   ),
   "threads" => array(
      "autoincrementID" => false,
      "fields" => array(
          "sType"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idUserCreated"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idItem"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sTitle"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bAdminHelpAsked"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bHidden"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLastActivityDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
      )
   ),
   "users" => array(
      "autoincrementID" => false,
      "fields" => array(
          "sLogin"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin","user"))),
          "sOpenIdIdentity"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sPasswordMd5"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sSalt"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sRecover"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sRegistrationDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sEmail"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bEmailVerified"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sFirstName"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLastName"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sCountryCode"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sTimeZone"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sBirthDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "iGraduationYear"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "iGrade"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sSex"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sStudentId"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sAddress"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sZipcode"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sCity"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLandLineNumber"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sCellPhoneNumber"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sDefaultLanguage"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bNotifyNews"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sNotify"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bPublicFirstName"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bPublicLastName"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sFreeText"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sWebSite"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bPhotoAutoload"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLangProg"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLastLoginDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLastActivityDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sLastIP"  => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bBasicEditorMode"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "nbSpacesForTab"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "iMemberState"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idUserGodfather"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "iStepLevelInSite"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bIsAdmin"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "bNoRanking"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "nbHelpGiven"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idGroupSelf"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idGroupOwned"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "idGroupAccess"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "sNotificationReadDate"  => array("type" => "date", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "loginModulePrefix" => array("type" => "string", "access" => array("write" => array("admin"), "read" => array("admin"))),
          "allowSubgroups" => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("admin")))
      )
   ),
   "users_answers" => array(
      "autoincrementID" => true,
      "hasHistory" => false,
      "fields" => array(
          "idUser"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "idItem"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "idAttempt"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sType"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sName"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sState"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sAnswer"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sLangProg"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sSubmissionDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "iScore"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user"))),
          "bValidated"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sGradingDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")))
      ),
   ),
   "users_items" => array(
      "autoincrementID" => false,
      "fields" => array(
          "idUser"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "idItem"  => array("type" => "int", "access" => array("write" => array("admin"), "read" => array("user"))),
          "idAttemptActive"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "iScore"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreComputed"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreReeval"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iScoreDiffManual"  => array("type" => "float", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sScoreDiffComment"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbSubmissionsAttempts"  => array("type" => "int", "skipHistory" => true, "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbTasksTried"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbChildrenValidated"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bValidated"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bFinished"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bKeyObtained"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbTasksWithHelp"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sHintsRequested"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbHintsCached"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "nbCorrectionsRead"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "iPrecision"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "iAutonomy"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "sValidationDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sLastAnswerDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sThreadStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sLastHintDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "sFinishDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "sLastActivityDate"  => array("type" => "date", 'skipHistory' => true, "access" => array("write" => array("user"), "read" => array("user"))),
          "sContestStartDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user")), 'readOnly' => true),
          "bRanked"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sAllLangProg"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sState"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user"))),
          "sAnswer"  => array("type" => "string", "access" => array("write" => array("user"), "read" => array("user")))
      ),
      "listeners" => array(
         "after" => "Listeners::UserItemsAfter"
      )
   ),
   "users_threads" => array(
      "autoincrementID" => false,
      "fields" => array(
          "idUser"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "idThread"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
          "sLastReadDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "sLastWriteDate"  => array("type" => "date", "access" => array("write" => array("user"), "read" => array("user"))),
          "bStarred"  => array("type" => "int", "access" => array("write" => array("user"), "read" => array("user"))),
      ),
   )
);

$viewsModels = array(
   "filters" => array(
      "mainTable" => "filters",
      "adminOnly" => false,
      "joins" => array(
      ),
      "fields" => array(
         "idUser" => array(),
         "sName" => array(),
         "bStarred" => array(),
         "sStartDate" => array(),
         "sEndDate" => array(),
         "bArchived" => array(),
         "bParticipated" => array(),
         "bUnread" => array(),
         "idItem" => array(),
         "idGroup" => array(),
         "olderThan" => array(),
         "newerThan" => array(),
         "sUsersSearch" => array(),
         "sBodySearch" => array(),
         "bImportant" => array(),
      ),
      "filters" => array(
         "accessible" => array(
               "condition"  => "`[PREFIX]filters`.`idUser` = :[PREFIX_FIELD]idUser",
         ),
      ),
   ),

   "groups" => array(
      "mainTable" => "groups",
      "adminOnly" => false,
      "joins" => array(
         "myGroupAncestors" => array("dstField" => "idGroupAncestor", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_ancestors"),
         "myGroupParents" => array("dstField" => "idGroupParent", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_groups"),
         "myGroupDescendants" => array("dstField" => "idGroupChild", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_ancestors"),
         "myGroupDescendantsAncestors" => array("type" => "LEFT", "dstField" => "idGroupAncestor", "srcField" => "idGroupChild", "srcTable" => "myGroupDescendants", "dstTable" => "groups_ancestors"),
         "usersLeft" => array('type' => 'LEFT', "dstField" => "idGroupSelf", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "users"),
         "users" => array("dstField" => "idGroupSelf", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "users"),
         "myInvitationsLeft" => array("type" => "LEFT", "dstField" => "idGroupParent", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_groups"),
         "myInvitations" => array("dstField" => "idGroupParent", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_groups"),
         "invited" => array("dstField" => "idGroupChild", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_groups"),
         "myGroupDescendantsLeft" => array("type" => "LEFT", "dstField" => "idGroupChild", "srcField" => "ID", "srcTable" => "groups", "dstTable" => "groups_ancestors"),
      ),
      "fields" => array(
         "sName" => array(),
         "iGrade" => array(),
         "sGradeDetails" => array(),
         "sDescription" => array(),
         "sDateCreated" => array(),
         "bOpened" => array(),
         "bFreeAccess" => array(),
         "idTeamItem" => array(),
         "iTeamParticipating" => array(),
         "sPassword" => array(),
         "sPasswordTimer" => array(),
         "sPasswordEnd" => array(),
         "sRedirectPath" => array(),
         "bOpenContest" => array(),
         "sType" => [],
         "bSendEmails" => array(),
      ),
      "filters" => array(
         "addUserID" => array(
            "joins" => array("usersLeft"),
            "ignoreValue" => true,
         ),
         "ancestors" => array(
            "joins" => array("myGroupAncestors"),
            "condition"  => '`[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "parents" => array(
            "joins" => array("myGroupParents"),
            "condition"  => '`[PREFIX]myGroupParents`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "descendants" => array(
            "joins" => array("myGroupDescendants"),
            "condition"  => '`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroup',
         ),
         "invited" => array(
            "joins" => array("invited"),
            "condition"  => '`[PREFIX]invited`.`idGroupParent` = :[PREFIX_FIELD]idGroup',
         ),
         "sTypeExclude" => array(
            "joins" => array(),
            "condition"  => "`[PREFIX]groups`.`sType` != :[PREFIX_FIELD]sType",
         ),
      ),
   ),
   "groups_login_prefixes" => array(
      "mainTable" => "groups_login_prefixes",
      "adminOnly" => false,
      "joins" => array(),
      "fields" => array(
         "idGroup" => array(),
         "prefix" => array()
      ),
      "filters" => array(
         "group" => array(
            "condition" => '`[PREFIX]groups_login_prefixes`.`idGroup` = :[PREFIX_FIELD]idGroup',
         ),
      ),
   ),
   "groups_groups" => array(
      "mainTable" => "groups_groups",
      "adminOnly" => false,
      "joins" => array(
         "myGroupDescendantsLeft" => array("type" => "LEFT", "dstField" => "idGroupChild", "srcField" => "idGroupParent", "srcTable" => "groups_groups", "dstTable" => "groups_ancestors"),
         "myGroupDescendants" => array("dstField" => "idGroupChild", "srcField" => "idGroupChild", "srcTable" => "groups_groups", "dstTable" => "groups_ancestors"),
         "myGroupDescendantsAncestors" => array("type" => "LEFT", "dstField" => "idGroupAncestor", "srcField" => "idGroupChild", "srcTable" => "myGroupDescendants", "dstTable" => "groups_ancestors"),
         "myGroupAncestors" => array("dstField" => "idGroupChild", "srcField" => "idGroupParent", "srcTable" => "groups_groups", "dstTable" => "groups_ancestors"),
         "userInviting" => array('type' => 'LEFT', "dstField" => "ID", "srcField" => "idUserInviting", "srcTable" => "groups_groups", "dstTable" => "users"),
         "usersLeft" => array("type" => 'LEFT', "dstField" => "idGroupSelf", "srcField" => "idGroupChild", "srcTable" => "groups_groups", "dstTable" => "users"),
         "users" => array("dstField" => "idGroupSelf", "srcField" => "idGroupChild", "srcTable" => "groups_groups", "dstTable" => "users"),
         "childGroups" => array("dstField" => "ID", "srcField" => "idGroupChild", "srcTable" => "groups_groups", "dstTable" => "groups"),
      ),
      "fields" => array(
         "idGroupParent" => array(),
         "idGroupChild" => array(),
         "iChildOrder" => array(),
         "sType" => array(),
         "sRole" => array(),
         "sStatusDate" => array(),
         "idUserInviting" => array(),
      ),
      "filters" => array(
         "invitationsAndDescendantsRead" => array(
            "joins" => array("myGroupDescendantsLeft"),
            "condition"  => '(`[PREFIX]groups_groups`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf OR `[PREFIX]groups_groups`.`idGroupParent` = :[PREFIX_FIELD]idGroupOwned OR `[PREFIX]myGroupDescendantsLeft`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned)',
         ),
         // groups in which idGroupSelf has an invitation
         "invitationsRead" => array(
            "joins" => array(),
            "condition"  => '(`[PREFIX]groups_groups`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         // groups invited in idGroup
         "invited" => array(
            "joins" => array(),
            "condition"  => '(`[PREFIX]groups_groups`.`idGroupParent` = :[PREFIX_FIELD]idGroup)',
         ),
         "descendantsRead" => array(
            "joins" => array("myGroupDescendants"),
            "condition"  => '`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned',
         ),
         "ancestors" => array(
            "joins" => array("myGroupAncestors"),
            "condition"  => '`[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "parents" => array(
            "joins" => array(),
            "condition"  => '`[PREFIX]groups_groups`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "invitationsAndDescendantsWrite" => array(
            "joins" => array("myGroupDescendantsLeft"),
            "condition"  => '(`[PREFIX]groups_groups`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf AND `[PREFIX]groups_groups`.`idGroupParent` != :[PREFIX_FIELD]idRootSelf) OR `[PREFIX]myGroupDescendantsLeft`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned)',
         ),
         "addLogin" => array(
            "joins" => array("users", "userInviting"),
            "ignoreValue" => true,
         ),
         "sTypeExclude" => array(
            "joins" => array("childGroups"),
            "condition"  => "`[PREFIX]childGroups`.`sType` != :[PREFIX_FIELD]sType",
         ),
      ),
   ),

   "items" => array(
      "mainTable" => "items",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "items", "srcField" => "ID", "dstField" => "idItem"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "items_ancestors" => array("srcTable" => "items", "srcField" => "ID", "dstField" => "idItemChild"),
         "items_items" => array("srcTable" => "items", "srcField" => "ID", "dstField" => "idItemChild"),
      ),
      "fields" => array(
         "sUrl" => array(),
         "idPlatform" => array(),
         "sTextId" => array(),
         "sType" => array(),
         "bShowDifficulty" => array(),
         "bUsesAPI" => array(),
         "bReadOnly" => array(),
         "sFullScreen" => array(),
         "bShowSource" => array(),
         "bHintsAllowed" => array(),
         "bFixedRanks" => array(),
         "sValidationType" => array(),
         "iValidationMin" => array(),
         "idItemUnlocked" => array(),
         "iScoreMinUnlock" => array(),
         "sSupportedLangProg" => array(),
         "idDefaultLanguage" => array(),
         "sTeamMode" => array(),
         "bTeamsEditable" => array(),
         "idTeamInGroup" => array(),
         "iTeamMaxMembers" => array(),
         "bHasAttempts" => array(),
         "sAccessOpenDate" => array(),
         "sDuration" => array(),
         "sEndContestDate" => array(),
         "bShowUserInfos" => array(),
         "sContestPhase" => array(),
         "iLevel" => array(),
         "bNoScore" => array(),
         "bTitleBarVisible" =>  array(),
         "bTransparentFolder" => array(),
         "bDisplayDetailsInParent" => array(),
         "bDisplayChildrenAsTabs" => array(),
         "bCustomChapter" => array(),
         "groupCodeEnter" => array()
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)'),
         "accessibleWrite" => array (
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bOwnerAccess` = 1 OR `[PREFIX]groups_items`.`bCachedManagerAccess` = 1) AND (`[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf OR `[PREFIX]groups_items`.`idGroup` = :[PREFIX_FIELD]idGroupSelf))',
         ),
      ),
   ),

   "items_items" => array(
      "mainTable" => "items_items",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "items_items", "srcField" => "idItemChild", "dstField" => "idItem"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "items_ancestors" => array("srcTable" => "items_items", "srcField" => "idItemChild", "dstField" => "idItemChild"),
      ),
      "fields" => array(
         "idItemParent" => array(),
         "idItemChild" => array(),
         "iChildOrder" => array(),
         "sCategory" => array(),
         "iDifficulty" => array(),
         "bAccessRestricted" => array(),
         "bAlwaysVisible" => array(),
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         "accessibleWrite" => array (
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bOwnerAccess` = 1 OR `[PREFIX]groups_items`.`bCachedManagerAccess` = 1) AND (`[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf OR `[PREFIX]groups_items`.`idGroup` = :[PREFIX_FIELD]idGroupSelf))',
         )
      ),
   ),

   "items_ancestors" => array(
      "mainTable" => "items_ancestors",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "items_ancestors", "srcField" => "idItemChild", "dstField" => "idItem"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor")
      ),
      "fields" => array(
         "idItemAncestor" => array(),
         "idItemChild" => array(),
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :idGroupSelf)',
         ),
      ),
   ),

   "items_strings" => array(
      "mainTable" => "items_strings",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "items_strings", "srcField" => "idItem", "dstField" => "idItem"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "items_ancestors" => array("srcTable" => "items_strings", "srcField" => "idItem", "dstField" => "idItemChild"),
         "items_items" => array("srcTable" => "items_strings", "srcField" => "idItem", "dstField" => "idItemChild"),
      ),
      "fields" => array(
         "idItem"          => array(),
         "idLanguage"      => array(),
         "sTranslator"     => array(),
         "sTitle"          => array(),
         "sImageUrl"       => array(),
         "sSubtitle"       => array(),
         "sDescription"    => array(),
         "sEduComment"     => array(),
         "sRankingComment" => array(),
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :idGroupSelf)',
         ),
         "accessibleWrite" => array (
            "joins" => array("groups_items", "selfGroupAncestors"),
            "condition"  => '((`[PREFIX]groups_items`.`bOwnerAccess` = 1 OR `[PREFIX]groups_items`.`bCachedManagerAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
      ),
   ),

   "groups_attempts" => array(
      "mainTable" => "groups_attempts",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "groups_attempts", "srcField" => "idItem", "dstField" => "idItem"),
         "items_ancestors" => array("srcTable" => "groups_attempts", "srcField" => "idItem", "dstField" => "idItemChild"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "selfGroupDescendants" => array("srcTable" => "groups_attempts", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupChild"),
         "itemsDescendants" => array("srcTable" => "groups_attempts", "dstTable" => "items_ancestors", "srcField" => "idItem", "dstField" => "idItemChild"),
         "team" => array("srcTable" => "groups_attempts", "dstTable" => "groups_groups", "srcField" => "idGroup", "dstField" => "idGroupParent")
      ),
      "fields" => array(
          "idGroup"               => array('insertOnly' => true),
          "idItem"                => array('insertOnly' => true),
          "idUserCreator"         => array('insertOnly' => true),
          "iOrder"                => array('insertOnly' => true),
          "iScore"                => array('readOnly' => true),
          "iScoreComputed"        => array('readOnly' => true),
          "iScoreReeval"          => array('readOnly' => true),
          "iScoreDiffManual"      => array('readOnly' => true),
          "sScoreDiffComment"     => array('readOnly' => true),
          "nbSubmissionsAttempts" => array('readOnly' => true),
          "nbTasksTried"          => array('readOnly' => true),
          "nbChildrenValidated"   => array('readOnly' => true),
          "bValidated"            => array('readOnly' => true),
          "bFinished"             => array('readOnly' => true),
          "bKeyObtained"          => array('readOnly' => true),
          "nbTasksWithHelp"       => array('readOnly' => true),
          "sHintsRequested"       => array('readOnly' => true),
          "nbHintsCached"         => array('readOnly' => true),
          "nbCorrectionsRead"     => array('readOnly' => true),
          "iPrecision"            => array('readOnly' => true),
          "iAutonomy"             => array('readOnly' => true),
          "sStartDate"            => array(),
          "sValidationDate"       => array('readOnly' => true),
          "sLastAnswerDate"       => array('readOnly' => true),
          "sThreadStartDate"      => array('readOnly' => true),
          "sLastHintDate"         => array('readOnly' => true),
          "sContestStartDate"     => array('readOnly' => true),
          "sFinishDate"           => array('readOnly' => true),
          "sLastActivityDate"     => array(),
          "bRanked"               => array('readOnly' => true),
          "sAllLangProg"          => array()
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors", "selfGroupDescendants"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedManagerAccess` = 1 OR `[PREFIX]groups_items`.`bOwnerAccess` = 1 OR `[PREFIX]groups_items`.`bCachedAccessSolutions` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND (`[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf) AND (`[PREFIX]selfGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned))',
         ),
         "groupDescendants" => array(
            "joins" => array("selfGroupDescendants", "users"),
            "condition"  => '`[PREFIX]selfGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroup',
         ),
          "itemsDescendants" => array(
            "joins" => array("itemsDescendants"),
            "condition"  => '`[PREFIX]itemsDescendants`.`idItemAncestor` = :[PREFIX_FIELD]idItem',
         ),
         "idGroup" => array(
            "joins" => array("team"),
            "condition" => '`[PREFIX]team`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf',
         ),
         "idItem" => array(
            "condition" => "`[PREFIX]groups_attempts`.`idItem` = :[PREFIX_FIELD]idItem"
         ),
      ),
   ),
   "groups_items" => array(
      "mainTable" => "groups_items",
      "adminOnly" => false,
      "joins" => array(
         "myGroupDescendantsLeft" => array("type" => "LEFT", "dstField" => "idGroupChild", "srcField" => "idGroup", "srcTable" => "groups_items", "dstTable" => "groups_ancestors"),
         "myGroupDescendants" => array("dstField" => "idGroupChild", "srcField" => "idGroup", "srcTable" => "groups_items", "dstTable" => "groups_ancestors"),
         "myGroupDescendantsAncestors" => array("type" => "LEFT", "dstField" => "idGroupAncestor", "srcField" => "idGroupChild", "srcTable" => "myGroupDescendants", "dstTable" => "groups_ancestors"),
         "myGroupAncestorsLeft" => array("type" => "LEFT", "dstField" => "idGroupAncestor", "srcField" => "idGroup", "srcTable" => "groups_items", "dstTable" => "groups_ancestors"),
         "myGroupAncestors" => array("dstField" => "idGroupAncestor", "srcField" => "idGroup", "srcTable" => "groups_items", "dstTable" => "groups_ancestors"),
         "items_ancestors" => array("srcTable" => "groups_items", "srcField" => "idItem", "dstField" => "idItemChild"),
      ),
      "fields" => array(
         "idGroup" => array(),
         "idItem" => array(),
         "idUserCreated" => array(),
         "sPartialAccessDate" => array(),
         "sFullAccessDate" => array(),
         "sAccessReason" => array(),
         "sAccessSolutionsDate" => array(),
         "bOwnerAccess" => array(),
         "bManagerAccess" => array(),
         "sCachedPartialAccessDate" => array(),
         "sCachedFullAccessDate" => array(),
         "sCachedAccessSolutionsDate" => array(),
         "sCachedGrayedAccessDate" => array(),
         "bCachedPartialAccess" => array(),
         "bCachedAccessSolutions" => array(),
         "bCachedGrayedAccess" => array(),
         "bCachedManagerAccess" => array(),
         "sPropagateAccess" => array(),
      ),
      "filters" => array(
         "descendantsAndAncestorsRead" => array(
            "joins" => array("myGroupDescendants", "myGroupAncestors"),
            "condition"  => '(`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned OR `[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         "descendantsRead" => array(
            "joins" => array("myGroupDescendants"),
            "condition"  => '(`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned)',
         ),
         "ancestorsRead" => array(
            "joins" => array("myGroupAncestors"),
            "condition"  => '(`[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         "descendantsWrite" => array(
            "joins" => array("myGroupDescendants"),
            "condition"  => '(`[PREFIX]groups_items`.`idGroup` = :[PREFIX_FIELD]idGroupSelf `[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned) AND (`[PREFIX]groups_items`.`bCachedManagerAccess` <=> 1 OR `[PREFIX]groups_items`.`bOwnerAccess` <=> 1)',
         ),
         "myGroupSelf" => array(
            "joins" => array(),
            "condition"  => '`[PREFIX]groups_items`.`idGroup` = :[PREFIX_FIELD]idGroupSelf',
         ),
      ),
   ),
   "languages" => array(
      "mainTable" => "languages",
      "adminOnly" => false,
      "joins" => array(
      ),
      "fields" => array(
          "sName"  => array(),
          "sCode"  => array(),
      ),
      "filters" => array(
      ),
   ),
   "messages" => array(
      "mainTable" => "messages",
      "adminOnly" => false,
      "joins" => array(
        "threads" => array("srcTable" => "messages", "srcField" => "idThread", "dstField" => "ID"),
        "users"   => array("srcTable" => "messages", "srcField" => "idUser", "dstField" => "ID"),
        "users_items" => array("srcTable" => "threads", "srcField" => "idItem", "dstField" => "idItem"),
        "left_users_items" => array("type" => "LEFT", "srcTable" => "threads", "srcField" => "idItem", "dstField" => "idItem", "dstTable" => "users_items"),
      ),
      "fields" => array(
          "idThread"        => array(),
          "sLogin"          => array('tableName' => 'users', 'readOnly' => true),
          "idUser"          => array(),
          "sSubmissionDate" => array(),
          "bPublished"      => array(),
          "sTitle"          => array(),
          "sBody"           => array(),
          "bTrainersOnly"   => array(),
          "bArchived"       => array(),
          "bPersistant"     => array(),
      ),
      "filters" => array(
         // "accessibleHelpRead" => array(
         //    "joins" => array("users_items", "threads", "users"),
         //    "condition"  => "(`[PREFIX]users_items`.`idUser` = :[PREFIX_FIELD]idUser and `[PREFIX]users_items`.`bValidated` = 1)",
         // ),
         "accessibleWrite" => array(
            "joins" => array("left_users_items", "threads"),
            "condition"  => "((`[PREFIX]threads`.`sType` = 'General' or `[PREFIX]threads`.`sType` = 'Bug' or `[PREFIX]threads`.`idUserCreated` = :[PREFIX_FIELD]idUser) or (`[PREFIX]left_users_items`.`ID` IS NOT NULL AND `[PREFIX]left_users_items`.`idUser` = :[PREFIX_FIELD]idUser and `[PREFIX]left_users_items`.`bValidated` = 1) and `[PREFIX]messages`.`idUser` = :[PREFIX_FIELD]idUser)",
         ),
         // "accessibleGeneralOrMineRead" => array(
         //    "joins" => array("threads", "users"),
         //    "condition"  => "(`[PREFIX]threads`.`sType` = 'General' or `[PREFIX]threads`.`idUserCreated` = :[PREFIX_FIELD]idUser)",
         // ),
         "idThread" => array(
            "condition"  => "(`[PREFIX]messages`.`idThread` = :[PREFIX_FIELD]idThread)",
         ),
      ),
   ),
   "threads" => array(
      "mainTable" => "threads",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "threads", "srcField" => "idItem", "dstField" => "idItem"),
         "users" =>  array("srcTable" => "threads", "srcField" => "idUserCreated", "dstField" => "ID", "dstTable" => "users"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "selfUserDescendants" => array("srcTable" => "threads", "dstTable" => "users", "dstField" => "ID", "srcField" => "idUserCreated"),
         "selfGroupDescendants" => array("srcTable" => "selfUserDescendants", "dstTable" => "groups_ancestors", "srcField" => "idGroupSelf", "dstField" => "idGroupChild"),
         "itemDescendants" => array("srcTable" => "threads", "dstTable" => "items_ancestors", "srcField" => "idItem", "dstField" => "idItemChild"),
      ),
      "fields" => array(
          "sType"             => array(),
          "sLastActivityDate" => array(),
          "idUserCreated"     => array(),
          "sUserCreatedLogin" => array('tableName' => 'users', 'fieldName' => 'sLogin', 'readOnly' => true),
          "idItem"            => array(),
          "sTitle"            => array(),
          "bAdminHelpAsked"   => array(),
          "bHidden"           => array(),
      ),
      "filters" => array(
         "accessibleHelp" => array(
            "joins" => array("groups_items", "selfGroupAncestors", "selfUserDescendants", "selfGroupDescendants"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedAccessSolutions` = 1 OR `[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         "accessibleGeneralOrMineRead" => array(
            "condition"  => "(`[PREFIX]threads`.`sType` = 'General' or `[PREFIX]threads`.`sType` = 'Bug' or `[PREFIX]threads`.`idUserCreated` = :[PREFIX_FIELD]idUser)",
         ),
         "groupDescendants" => array(
            "joins" => array("selfUserDescendants", "selfGroupDescendants"),
            "condition"  => '`[PREFIX]selfGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroup',
         ),
         "itemDescendants" => array(
            "joins" => array("itemDescendants"),
            "condition"  => '`[PREFIX]itemDescendants`.`idItemAncestor` = :[PREFIX_FIELD]idItem',
         ),
         "accessibleWrite" => array(
            "condition"  => "(`[PREFIX]threads`.`idUserCreated` = :[PREFIX_FIELD]idUser)",
         )
      ),
   ),
   "users" => array(
      "mainTable" => "users",
      "adminOnly" => false,
      "joins" => array(
        "groupDescendantsOwned" => array("dstField" => "idGroupChild", "srcField" => "idGroupOwned", "srcTable" => "users", "dstTable" => "groups_ancestors"),
        "groupAncestersOwned" => array("dstField" => "idGroupAncestor", "srcField" => "idGroupOwned", "srcTable" => "users", "dstTable" => "groups_ancestors"),
        "groupAncestorsSelf" => array("dstField" => "idGroupAncestor", "srcField" => "idGroupSelf", "srcTable" => "users", "dstTable" => "groups_ancestors"),
        "groupInvitedSelf" => array("dstField" => "idGroupChild", "srcField" => "idGroupSelf", "srcTable" => "users", "dstTable" => "groups_groups"),
      ),
      "fields" => array(
          "sLogin"                => array(),
          "sEmail"                => array(),
          "sFirstName"            => array(),
          "sLastName"             => array(),
          "sCountryCode"          => array(),
          "sTimeZone"             => array(),
          "sBirthDate"            => array(),
          "iGraduationYear"       => array(),
          "iGrade"                => array(),
          "sSex"                  => array(),
          "sStudentId"            => array(),
          "sAddress"              => array(),
          "sZipcode"              => array(),
          "sCity"                 => array(),
          "sLandLineNumber"       => array(),
          "sCellPhoneNumber"      => array(),
          "sDefaultLanguage"      => array(),
          "bPublicFirstName"      => array(),
          "bPublicLastName"       => array(),
          "sFreeText"             => array(),
          "sWebSite"              => array(),
          "idUserGodfather"       => array(),
          "idGroupSelf"           => array('readOnly' => true),
          "idGroupOwned"          => array('readOnly' => true),
          "sNotificationReadDate" => array(),
          "loginModulePrefix"     => array(),
          "allowSubgroups"        => array()
      ),
      "filters" => array(
         "ancestors" => array(
            "joins" => array("groupAncestorsSelf"),
            "condition"  => '`[PREFIX]groupAncestorsSelf`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "ancestorsOwned" => array(
            "joins" => array("groupAncestersOwned"),
            "condition"  => '`[PREFIX]groupAncestersOwned`.`idGroupChild` = :[PREFIX_FIELD]idGroup',
         ),
         "descendants" => array(
            "joins" => array("groupDescendantsOwned"),
            "condition"  => '`[PREFIX]groupDescendantsOwned`.`idGroupAncestor` = :[PREFIX_FIELD]idGroup',
         ),
         "invited" => array(
            "joins" => array("groupInvitedSelf"),
            "condition"  => '`[PREFIX]groupInvitedSelf`.`idGroupParent` = :[PREFIX_FIELD]idGroup',
         ),
      ),
   ),
   "users_answers" => array(
      "mainTable" => "users_answers",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "users_answers", "srcField" => "idItem", "dstField" => "idItem"),
         "items_ancestors" => array("srcTable" => "users_answers", "srcField" => "idItem", "dstField" => "idItemChild"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "selfUserDescendants" => array("srcTable" => "users_answers", "dstTable" => "users", "dstField" => "ID", "srcField" => "idUser"),
         "selfGroupDescendants" => array("srcTable" => "selfUserDescendants", "dstTable" => "groups_ancestors", "srcField" => "idGroupSelf", "dstField" => "idGroupChild"),
         "my_users_items" => array("srcTable" => "users_answers", "dstTable" => "users_items", "dstField" => "idItem", "srcField" => "idItem"),
         "other_users_items" => array("srcTable" => "users_answers", "dstTable" => "users_items", "dstField" => "idItem", "srcField" => "idItem"),
         "items" => array("srcTable" => "users_answers", "dstTable" => "items", "dstField" => "ID", "srcField" => "idItem"),
      ),
      "fields" => array(
          "idUser"       => array(),
          "idItem"       => array(),
          "idAttempt"    => array(),
          "sType"        => array(),
          "sName"        => array(),
          "sState"        => array(),
          "sAnswer"      => array(),
          "sLangProg"    => array(),
          "sSubmissionDate"    => array('readOnly' => true),
          "iScore"       => array('readOnly' => true),
          "bValidated"   => array('readOnly' => true),
          "sGradingDate" => array(),
      ),
      "filters" => array(
         "accessibleForumReadSelf" => array(
            "joins" => array("groups_items", "selfGroupAncestors", "selfUserDescendants", "selfGroupDescendants"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1 OR `[PREFIX]groups_items`.`bCachedAccessSolutions` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
        "accessibleForumReadOwned" => array(
            "joins" => array("groups_items", "selfGroupAncestors", "selfUserDescendants", "selfGroupDescendants"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1 OR `[PREFIX]groups_items`.`bCachedAccessSolutions` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)',
         ),
         "accessible" => array(
            "joins" => array(),
            "condition"  => "`[PREFIX]users_answers`.`idUser` = :[PREFIX_FIELD]idUser",
         ),
         "getMyUserItem" => array(
            "joins" => array("my_users_items"),
            "condition"  => "`[PREFIX]my_users_items`.`idUser` = :[PREFIX_FIELD]idUser",
         ),
         "getOtherUserItem" => array(
            "joins" => array("other_users_items"),
            "condition"  => "`[PREFIX]other_users_items`.`idUser` = :[PREFIX_FIELD]idUser",
         ),
         "idItem" => array(
            "joins" => array(),
            "condition"  => "`[PREFIX]users_answers`.`idItem` = :[PREFIX_FIELD]idItem",
         ),
      ),
   ),
   "users_items" => array(
      "mainTable" => "users_items",
      "adminOnly" => false,
      "joins" => array(
         "groups_items" =>  array("srcTable" => "users_items", "srcField" => "idItem", "dstField" => "idItem"),
         "items_ancestors" => array("srcTable" => "users_items", "srcField" => "idItem", "dstField" => "idItemChild"),
         "selfGroupAncestors" => array("srcTable" => "groups_items", "dstTable" => "groups_ancestors", "srcField" => "idGroup", "dstField" => "idGroupAncestor"),
         "users" => array("srcTable" => "users_items", "dstTable" => "users", "dstField" => "ID", "srcField" => "idUser"),
         "selfGroupDescendants" => array("srcTable" => "users", "dstTable" => "groups_ancestors", "srcField" => "idGroupSelf", "dstField" => "idGroupChild"),
         "itemsDescendants" => array("srcTable" => "users_items", "dstTable" => "items_ancestors", "srcField" => "idItem", "dstField" => "idItemChild"),
      ),
      "fields" => array(
          "idUser"                => array('insertOnly' => true),
          "idItem"                => array('insertOnly' => true),
          "idAttemptActive"       => array(),
          "iScore"                => array('readOnly' => true),
          "iScoreComputed"        => array('readOnly' => true),
          "iScoreReeval"          => array('readOnly' => true),
          "iScoreDiffManual"      => array('readOnly' => true),
          "sScoreDiffComment"     => array('readOnly' => true),
          "nbSubmissionsAttempts" => array('readOnly' => true),
          "nbTasksTried"          => array('readOnly' => true),
          "nbChildrenValidated"   => array('readOnly' => true),
          "bValidated"            => array('readOnly' => true),
          "bFinished"             => array('readOnly' => true),
          "bKeyObtained"          => array('readOnly' => true),
          "nbTasksWithHelp"       => array('readOnly' => true),
          "sHintsRequested"       => array('readOnly' => true),
          "nbHintsCached"         => array('readOnly' => true),
          "nbCorrectionsRead"     => array('readOnly' => true),
          "iPrecision"            => array('readOnly' => true),
          "iAutonomy"             => array('readOnly' => true),
          "sStartDate"            => array(),
          "sValidationDate"       => array('readOnly' => true),
          "sLastAnswerDate"       => array('readOnly' => true),
          "sThreadStartDate"      => array('readOnly' => true),
          "sLastHintDate"         => array('readOnly' => true),
          "sContestStartDate"     => array('readOnly' => true),
          "sFinishDate"           => array('readOnly' => true),
          "sLastActivityDate"     => array(),
          "bRanked"               => array('readOnly' => true),
          "sAllLangProg"          => array(),
          "sState"                => array(),
          "sAnswer"               => array()
      ),
      "filters" => array(
         "accessible" => array(
            "joins" => array("groups_items", "selfGroupAncestors", "users", "selfGroupDescendants"),
            "condition"  => '((`[PREFIX]groups_items`.`bCachedManagerAccess` = 1 OR `[PREFIX]groups_items`.`bOwnerAccess` = 1 OR `[PREFIX]groups_items`.`bCachedAccessSolutions` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND (`[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf) AND (`[PREFIX]selfGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned))',
         ),
         "groupDescendants" => array(
            "joins" => array("selfGroupDescendants", "users"),
            "condition"  => '`[PREFIX]selfGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroup',
         ),
          "itemsDescendants" => array(
            "joins" => array("itemsDescendants"),
            "condition"  => '`[PREFIX]itemsDescendants`.`idItemAncestor` = :[PREFIX_FIELD]idItem',
         ),
         "idUser" => array(
            "condition" => "`[PREFIX]users_items`.`idUser` = :[PREFIX_FIELD]idUser"
         ),
         "idItem" => array(
            "condition" => "`[PREFIX]users_items`.`idItem` = :[PREFIX_FIELD]idItem"
         ),
      ),
   ),
   "users_threads" => array(
      "mainTable" => "users_threads",
      "adminOnly" => false,
      "joins" => array(
         "threads" => array("srcTable" => "messages", "srcField" => "idThread", "dstField" => "ID"),
      ),
      "fields" => array(
          "idUser"         => array(),
          "idThread"       => array(),
          "sLastReadDate"  => array(),
          "sLastWriteDate" => array(),
          "bStarred"       => array(),
      ),
      "filters" => array(
         "accessible" => array(
               "condition"  => "`[PREFIX]users_threads`.`idUser` = :[PREFIX_FIELD]idUser",
         ),
      ),
   ),
);

?>
