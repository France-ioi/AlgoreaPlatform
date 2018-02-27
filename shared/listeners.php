<?php

class Listeners {
   public static function computeAllUserItems($db) {
      // Use a lock so that we don't execute the listener multiple times in parallel
      $stmt = $db->query("SELECT GET_LOCK('listener_computeAllUserItems', 1);");
      if($stmt->fetchColumn() != 1) { return; }

      // We mark as 'todo' all ancestors of objects marked as 'todo'
      $db->exec("LOCK TABLES
        users_items as ancestors WRITE,
        users_items as descendants WRITE,
        history_users_items WRITE,
        items_ancestors READ,
        history_items_ancestors READ;
        ");
      $query = "UPDATE `users_items` as `ancestors` JOIN `items_ancestors` ON (`ancestors`.`idItem` = `items_ancestors`.`idItemAncestor` AND `items_ancestors`.`idItemAncestor` != `items_ancestors`.`idItemChild`) JOIN `users_items` as `descendants` ON (`descendants`.`idItem` = `items_ancestors`.`idItemChild` AND `descendants`.`idUser` = `ancestors`.`idUser`) SET `ancestors`.`sAncestorsComputationState` = 'todo' WHERE `descendants`.`sAncestorsComputationState` = 'todo';";
      $db->exec($query);
      $db->exec("UNLOCK TABLES;");
      $hasChanges = true;
      $groupsItemsChanged = false;
      while ($hasChanges) {
         // We mark as "processing" all objects that were marked as 'todo' and that have no children not marked as 'done'
         $query = "UPDATE `users_items` as `parent`
            JOIN  (
                 SELECT * FROM (
            SELECT `parent`.`ID` FROM `users_items` as `parent`
            WHERE `sAncestorsComputationState` = 'todo'
            AND NOT EXISTS
            (
                  SELECT `items_items`.`idItemChild`
                  FROM `items_items`
                  JOIN `users_items` as `children` ON (`children`.`idItem` = `items_items`.`idItemChild`)
                  WHERE `items_items`.`idItemParent` = `parent`.`idItem`
                  AND `children`.`sAncestorsComputationState` <> 'done' AND `children`.`idUser` = `parent`.`idUser`
            )) as `tmp2`
            ) as `tmp`
             SET `sAncestorsComputationState` = 'processing'
            WHERE tmp.ID = parent.ID;";
         $db->exec($query);
        /* For every object marked as 'processing', we compute all the caracteristics based on the children:
              * sLastActivityDate as the max of children's
              * nbTasksWithHelp, nbTasksTried, nbTaskSolved as the sum of children's field
              * nbChildrenValidated as the sum of children with bValidated == 1
              * bValidated, depending on the items_items.sCategory and items.sValidationType
         */
         $updateAttemptsQuery = "
            UPDATE users_items
            left join
            (select attempt_user.ID as idUser, attempts.idItem as idItem, MAX(attempts.iScore) as iScore, MAX(attempts.bValidated) as bValidated
               from users AS attempt_user
               join groups_attempts AS attempts
               join groups_groups AS attempt_group ON attempts.idGroup = attempt_group.idGroupParent AND attempt_user.idGroupSelf = attempt_group.idGroupChild
               GROUP BY attempt_user.ID, attempts.idItem
            ) AS attempts_data ON attempts_data.idUser = users_items.idUser AND attempts_data.idItem = users_items.idItem
            SET users_items.iScore = GREATEST(users_items.iScore, IFNULL(attempts_data.iScore, 0)),
                users_items.bValidated = GREATEST(users_items.bValidated, IFNULL(attempts_data.bValidated, 0))
            WHERE users_items.sAncestorsComputationState = 'processing';";
         $db->exec($updateAttemptsQuery);
         $updateActiveAttemptQuery = "
            UPDATE users_items
            JOIN groups_attempts ON groups_attempts.ID = users_items.idAttemptActive
            SET users_items.sHintsRequested = groups_attempts.sHintsRequested
            WHERE users_items.sAncestorsComputationState = 'processing';";
         $db->exec($updateActiveAttemptQuery);

         $stmtUpdateStr = 'update `users_items`
                           join
                           (select Max(children.sLastActivityDate) as sLastActivityDate, Sum(children.nbTasksTried) as nbTasksTried, Sum(children.nbTasksWithHelp) as nbTasksWithHelp, Sum(children.nbTasksSolved) as nbTasksSolved, Sum(bValidated) as nbChildrenValidated
                              from users_items as children
                              join items_items on items_items.idItemChild = children.idItem
                              where children.idUser = :idUser and items_items.idItemParent = :idItem) as children_data
                           join
                           (select Sum(IF(task_children.ID IS NOT NULL and task_children.bValidated, 1, 0)) as nbChildrenValidated, Sum(IF(task_children.ID IS NOT NULL and task_children.bValidated, 0, 1)) as nbChildrenNonValidated, SUM(if(items_items.sCategory = \'Validation\' and (task_children.ID IS NULL or task_children.bValidated = 0), 1, 0)) AS nbChildrenCategory, Max(task_children.sValidationDate) as maxValidationDate, Max(if(items_items.sCategory = \'Validation\', task_children.sValidationDate, NULL)) as maxValidationDateCategories
                              from items_items
                              left join users_items as task_children on items_items.idItemChild = task_children.idItem and task_children.idUser = :idUser
                              join items on items.ID = items_items.idItemChild
                              where items_items.idItemParent = :idItem
                                 and items.sType != \'Course\' and items.bNoScore = 0) as task_children_data
                         set users_items.sLastActivityDate = children_data.sLastActivityDate,
                             users_items.nbTasksTried = children_data.nbTasksTried,
                             users_items.nbTasksWithHelp = children_data.nbTasksWithHelp,
                             users_items.nbTasksSolved = children_data.nbTasksSolved,
                             users_items.nbChildrenValidated = children_data.nbChildrenValidated,
                             users_items.bValidated =  IF(users_items.bValidated = 1, 1,
                                                       IF(STRCMP(:sValidationType, \'Categories\'),
                                                         IF(STRCMP(:sValidationType, \'All\'),
                                                            IF(STRCMP(:sValidationType, \'AllButOne\'), IF(STRCMP(:sValidationType, \'One\'), 0, if(task_children_data.nbChildrenValidated > 0, 1, 0)),
                                                                if(task_children_data.nbChildrenNonValidated < 2 , 1, 0)
                                                            ),
                                                            if(task_children_data.nbChildrenNonValidated = 0, 1, 0)
                                                         ),
                                                         if(task_children_data.nbChildrenCategory = 0, 1, 0)
                                                       )),
                             users_items.sValidationDate = IFNULL(users_items.sValidationDate, IF(STRCMP(:sValidationType, \'Categories\'), task_children_data.maxValidationDate, task_children_data.maxValidationDateCategories))
                         where users_items.ID = :ID;';
         // query to only user_items with children
         $querySelectNewUsersItems = "select distinct `users_items`.`ID`, `users_items`.`idUser`, `users_items`.`idItem`, `items`.`sValidationType`
                                     from `users_items`
                                     join `items_items` on items_items.idItemParent = users_items.idItem
                                     join `items` on `items`.`ID` = `users_items`.`idItem`
                                     where `users_items`.`sAncestorsComputationState` = 'processing';";
         $stmt = $db->query($querySelectNewUsersItems);
         $rows = $stmt->fetchAll();
         $stmtUpdate = $db->prepare($stmtUpdateStr);
         foreach ($rows as $row) {
            $stmtUpdate->execute(array('ID' => $row['ID'], 'idUser' => $row['idUser'], 'idItem' => $row['idItem'], 'sValidationType' => $row['sValidationType']));
         }

         // Unlock items depending on bKeyObtained
         $querySelectUnlocks = "
            SELECT users.idGroupSelf as idGroup,
                   items.idItemUnlocked as idsItems
            FROM users_items
            JOIN items ON users_items.idItem = items.ID
            JOIN users ON users_items.idUser = users.ID
            WHERE     users_items.sAncestorsComputationState = 'processing'
                  AND users_items.bKeyObtained = 1
                  AND items.idItemUnlocked IS NOT NULL;";
         $queryInsertUnlocks = "
            INSERT INTO groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess)
            VALUES(:idGroup, :idItem, NOW(), NOW(), 1)
            ON DUPLICATE KEY UPDATE sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;";
         $stmt = $db->query($querySelectUnlocks);
         $unlocks = $stmt->fetchAll();
         foreach($unlocks as $unlock) {
            $groupsItemsChanged = true;
            $idsItems = explode(',', $unlock['idsItems']);
            foreach($idsItems as $idItem) {
               $stmt = $db->prepare($queryInsertUnlocks);
               $stmt->execute(['idGroup' => $unlock['idGroup'], 'idItem' => $idItem]);
            }
         }

         // Objects marked as 'processing' are now marked as 'done'
         $query = "UPDATE `users_items` SET `sAncestorsComputationState` = 'done' WHERE `sAncestorsComputationState` = 'processing'";
         $hasChanges = ($db->exec($query) > 0);
      }

      // Release the lock
      $db->query("SELECT RELEASE_LOCK('listener_computeAllUserItems');")->fetchColumn();

      // If items have been unlocked, need to recompute access
      if($groupsItemsChanged) {
         Listeners::groupsItemsAfter($db);
      }
   }

   public static function propagateAttempts($db) {
      // Propagate the data from an attempt to the user_items
      // We use WRITE locks everywhere as MySQL doesn't propagate locks to
      // triggers unless it's WRITE (even though the documentation says the
      // opposite)
      $db->exec("LOCK TABLES
         users_items WRITE,
         groups_attempts WRITE,
         groups_groups WRITE,
         users WRITE
         ");
      $queryPropagate = "
         UPDATE users_items
         JOIN groups_attempts ON groups_attempts.idItem = users_items.idItem
         JOIN groups_groups ON groups_groups.idGroupParent = groups_attempts.idGroup
         JOIN users ON users.ID = users_items.idUser AND users.idGroupSelf = groups_groups.idGroupChild
         SET users_items.sAncestorsComputationState = 'todo'
         WHERE groups_attempts.sAncestorsComputationState = 'todo';";
      $db->exec($queryPropagate);
      $queryEndPropagate = "
         UPDATE groups_attempts
         SET sAncestorsComputationState = 'done'
         WHERE sAncestorsComputationState = 'todo';";
      $db->exec($queryEndPropagate);
      $db->exec("UNLOCK TABLES");
   }

   public static function UserItemsAfter($db) {
      syncDebug('UserItemsAfter', 'begin');
      // the only case where a call to computeAllUserItems is relevant is
      // validation, which is handled by task.php
      //Listeners::computeAllUserItems($db);
      syncDebug('UserItemsAfter', 'end');
   }
   
   public static function GroupsAttemptsAfter($db) {
      syncDebug('GroupsAttemptsAfter', 'begin');
      // same as above: task.php handles it
      Listeners::propagateAttempts($db);
      Listeners::computeAllUserItems($db);
      syncDebug('GroupsAttemptsAfter', 'end');
   }


   public static function createNewAncestors($db, $objectName, $upObjectName, $tablePrefix='', $baseTablePrefix='') {
      //file_put_contents(__DIR__.'/../logs/'.$objectName.'_ancestors_listeners.log', "\n".date(DATE_RFC822)."\n", FILE_APPEND);
      // We mark as 'todo' all descendants of objects marked as 'todo'
      $query = " INSERT IGNORE INTO  `".$tablePrefix.$objectName."_propagate` (`ID`, `sAncestorsComputationState`) SELECT `descendants`.`ID`, 'todo' FROM `".$objectName."` as `descendants` JOIN `".$tablePrefix.$objectName."_ancestors` ON (`descendants`.`ID` = `".$tablePrefix.$objectName."_ancestors`.`id".$upObjectName."Child`) JOIN `".$tablePrefix.$objectName."_propagate` `ancestors` ON (`ancestors`.`ID` = `".$tablePrefix.$objectName."_ancestors`.`id".$upObjectName."Ancestor`) WHERE `ancestors`.`sAncestorsComputationState` = 'todo' ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'";
      // file_put_contents(__DIR__.'/../logs/'.$tablePrefix.$objectName.'_ancestors_listeners.log', "\n\n\n".$query."\n", FILE_APPEND);
      $res = $db->exec($query);
      $hasChanges = true;
      while ($hasChanges) {
         // We mark as "processing" all objects that were marked as 'todo' and that have no parents not marked as 'done'
         // TODO: this query is super slow (> 2.5s sometimes)
         $query = "UPDATE `".$tablePrefix.$objectName."_propagate` as `children` SET `sAncestorsComputationState` = 'processing' WHERE `sAncestorsComputationState` = 'todo' AND `children`.`ID` NOT IN ".
         "(SELECT `id".$upObjectName."Child` FROM ( ".
            "SELECT `".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Child` ".
            "FROM `".$baseTablePrefix.$objectName."_".$objectName."` ".
            "JOIN `".$tablePrefix.$objectName."_propagate` as `parents` ON (`parents`.`ID` = `".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Parent`) ".
            "WHERE `parents`.`sAncestorsComputationState` <> 'done'";
         if ($objectName == 'groups') {
            $query .= " and (`groups_groups`.`sType` = 'invitationAccepted' or  `groups_groups`.`sType` = 'requestAccepted' or `groups_groups`.`sType` = 'direct') ";
         }
         $query .= ") as `notready`)";
         $db->exec($query);
         // file_put_contents(__DIR__.'/../logs/'.$tablePrefix.$objectName.'_ancestors_listeners.log', $query."\n", FILE_APPEND);

         // For every object marked as 'processing', we compute all its ancestors
         $query = "INSERT IGNORE INTO `".$tablePrefix.$objectName."_ancestors` (`id".$upObjectName."Ancestor`, `id".$upObjectName."Child`".($objectName == 'groups' ? ', `bIsSelf`)' : ')').
         "SELECT `".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Parent`, `".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Child`".($objectName == 'groups' ? ", '0' as  `bIsSelf`" : '')." FROM `".$baseTablePrefix.$objectName."_".$objectName."` JOIN `".$tablePrefix.$objectName."_propagate` ON (`".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Child` = `".$tablePrefix.$objectName."_propagate`.`ID` OR `".$baseTablePrefix.$objectName."_".$objectName."`.`id".$upObjectName."Parent` = `".$tablePrefix.$objectName."_propagate`.`ID`)  ".
         "WHERE `".$tablePrefix.$objectName."_propagate`.`sAncestorsComputationState` = 'processing' ";
         if ($objectName == 'groups') {
            $query .= " and (`groups_groups`.`sType` = 'invitationAccepted' or  `groups_groups`.`sType` = 'requestAccepted' or `groups_groups`.`sType` = 'direct') ";
         }
         $query .= "UNION ".
         "SELECT `".$tablePrefix.$objectName."_ancestors`.`id".$upObjectName."Ancestor`, `".$baseTablePrefix.$objectName."_".$objectName."_join`.`id".$upObjectName."Child`".($objectName == 'groups' ? ", '0' as  `bIsSelf`" : '')." FROM `".$tablePrefix.$objectName."_ancestors` ".
         "JOIN `".$baseTablePrefix.$objectName."_".$objectName."` as `".$baseTablePrefix.$objectName."_".$objectName."_join` ON (`".$baseTablePrefix.$objectName."_".$objectName."_join`.`id".$upObjectName."Parent` = `".$tablePrefix.$objectName."_ancestors`.`id".$upObjectName."Child`) ".
         "JOIN `".$tablePrefix.$objectName."_propagate` ON (`".$baseTablePrefix.$objectName."_".$objectName."_join`.`id".$upObjectName."Child` = `".$tablePrefix.$objectName."_propagate`.`ID`) WHERE `".$tablePrefix.$objectName."_propagate`.`sAncestorsComputationState` = 'processing'";
         if ($objectName == 'groups') {
            $query .= " and (`groups_groups_join`.`sType` = 'invitationAccepted' or  `groups_groups_join`.`sType` = 'requestAccepted' or `groups_groups_join`.`sType` = 'direct') UNION SELECT  `".$tablePrefix."groups_propagate`.`ID` as `idGroupAncestor`, `".$tablePrefix."groups_propagate`.`ID` as `idGroupChild`, '1' as `bIsSelf` FROM `".$tablePrefix."groups_propagate` WHERE `".$tablePrefix."groups_propagate`.`sAncestorsComputationState` = 'processing';";
         }
         // file_put_contents(__DIR__.'/../logs/'.$tablePrefix.$objectName.'_ancestors_listeners.log', $query."\n", FILE_APPEND);
         $db->exec($query);

         // Objects marked as 'processing' are now marked as 'done'
         $query = "UPDATE `".$tablePrefix.$objectName."_propagate` SET `sAncestorsComputationState` = 'done' WHERE `sAncestorsComputationState` = 'processing'";
         // file_put_contents(__DIR__.'/../logs/'.$tablePrefix.$objectName.'_ancestors_listeners.log', $query."\n", FILE_APPEND);
         $hasChanges = ($db->exec($query) > 0);
      }
   }

   public static function itemsItemsAfter($db) {
      syncDebug('itemsItemsAfter', 'begin');
      Listeners::createNewAncestors($db, "items", "Item");
      Listeners::computeAllAccess($db);
      syncDebug('itemsItemsAfter', 'end');
   }

   public static function groupsGroupsAfter($db) {
      syncDebug('groupsGroupsAfter', 'begin');
      Listeners::createNewAncestors($db, "groups", "Group");
      syncDebug('groupsGroupsAfter', 'end');
   }

   public static function groupsItemsAfter($db) {
      syncDebug('groupsItemsAfter', 'end');
      Listeners::computeAllAccess($db);
      Listeners::groupsItemsComputeCached($db);
      syncDebug('groupsItemsAfter', 'end');
   }

   public static function computeAllAccess($db) {
      // Lock all tables during computation to avoid issues
      $queryLockTables = "LOCK TABLES
         groups_items WRITE,
         groups_items AS parents READ,
         groups_items AS children READ,
         groups_items AS parent READ,
         groups_items AS child READ,
         groups_items AS new_data READ,
         history_groups_items WRITE,
         groups_items_propagate WRITE,
         groups_items_propagate AS parents_propagate READ,
         items READ,
         items_items READ;";

      $queryUnlockTables = "UNLOCK TABLES;";

      // inserting missing groups_items_propagate
      $queryInsertMissingPropagate = "INSERT IGNORE INTO `groups_items_propagate` (`ID`, `sPropagateAccess`) ".
                                    "SELECT `groups_items`.`ID`, 'self' as `sPropagateAccess` ".
                                    "FROM `groups_items` ".
                                    "WHERE `sPropagateAccess`='self'".
                                    "ON DUPLICATE KEY UPDATE `sPropagateAccess`='self';";

      // Set groups_items as set up for propagation
      $queryUpdatePropagateAccess = "UPDATE `groups_items` SET `sPropagateAccess`='done' WHERE `sPropagateAccess`='self';";

      // inserting missing children of groups_items marked as 'children'
      $queryInsertMissingChildren = "INSERT IGNORE INTO `groups_items` (`idGroup`, `idItem`, `idUserCreated`, `sCachedAccessReason`, `sAccessReason`) ".
                                    "SELECT `parents`.`idGroup` as `idGroup`, `items_items`.`idItemChild` as `idItem`, ".
                                    "   `parents`.`idUserCreated` as `idUserCreated`, '' as `sCachedAccessReason`, '' as `sAccessReason` ".
                                    "FROM `items_items` ".
                                    "JOIN `groups_items` as `parents` on `parents`.`idItem` = `items_items`.`idItemParent` ".
                                    "JOIN `groups_items_propagate` as `parents_propagate` on `parents`.`ID` = `parents_propagate`.`ID` ".
                                    "WHERE `parents_propagate`.`sPropagateAccess` = 'children';";

      // mark as 'done' items that shouldn't propagate
      $queryMarkDoNotPropagate = "INSERT IGNORE INTO `groups_items_propagate` (`ID`, sPropagateAccess) ".
                                    "SELECT `groups_items`.`ID` as `ID`, 'done' as sPropagateAccess FROM groups_items ".
                                    "JOIN `items` on `groups_items`.`idItem` = `items`.`ID` ".
                                    "WHERE `items`.`bCustomChapter` = 1 ON DUPLICATE KEY UPDATE sPropagateAccess='done';";

      // marking 'self' groups_items sons of groups_items marked as 'children'
      $queryMarkExistingChildren = "INSERT IGNORE INTO `groups_items_propagate` (`ID`, sPropagateAccess) ".
                                    "SELECT `children`.`ID` as `ID`, 'self' as sPropagateAccess ".
                                    "FROM `items_items` ".
                                    "JOIN `groups_items` as `parents` on `parents`.`idItem` = `items_items`.`idItemParent` ".
                                    "JOIN `groups_items` as `children` on `children`.`idItem` = `items_items`.`idItemChild` AND `parents`.`idGroup` = `children`.`idGroup` ".
                                    "JOIN `groups_items_propagate` as `parents_propagate` on `parents`.`ID` = `parents_propagate`.`ID` ".
                                    "WHERE `parents_propagate`.`sPropagateAccess` = 'children' ON DUPLICATE KEY UPDATE sPropagateAccess='self';";

      // marking 'children' groups_items as 'done'
      $queryMarkFinishedItems = "UPDATE `groups_items_propagate`".
                "SET `sPropagateAccess` = 'done' ".
                "WHERE `sPropagateAccess` = 'children';";

      // computation for groups_items marked as 'self'.
      // It also marks 'self' groups_items as 'children'
      $queryUpdateGroupItems = "UPDATE `groups_items` ".
       "LEFT JOIN ( ".
       "  SELECT `child`.`ID`,  ".
       "  MIN(`parent`.`sCachedFullAccessDate`) as sCachedFullAccessDate, ".
       "  MIN(IF(`items_items`.`bAccessRestricted` = 0, `parent`.`sCachedPartialAccessDate`, NULL)) as sCachedPartialAccessDate, ".
       "  MAX(`parent`.`bCachedManagerAccess`) as bCachedManagerAccess, ".
       "  MIN(IF(`items_items`.`bAccessRestricted` = 1 AND `items_items`.`bAlwaysVisible` = 1, `parent`.`sCachedPartialAccessDate`, NULL)) as sCachedGrayedAccessDate, ".
       "  MIN(`parent`.`sCachedAccessSolutionsDate`) as sCachedAccessSolutionsDate, ".
       "  CONCAT('From ancestor group(s) ', GROUP_CONCAT(`parent`.`sAccessReason`, ', ')) AS `sAccessReasonAncestors` ".
       "  FROM `groups_items`  `child` ".
       "  JOIN `items_items` ON (`items_items`.`idItemChild` = `child`.`idItem`) ".
       "  LEFT JOIN `groups_items_propagate` ON (`groups_items_propagate`.`ID` = `child`.`ID`) ".
       "  JOIN `groups_items` `parent` ON (`items_items`.`idItemParent` = `parent`.`idItem` AND `parent`.`idGroup` = `child`.`idGroup`) ".
       "  WHERE  ".
       "  (`groups_items_propagate`.`sPropagateAccess` = 'self' OR `groups_items_propagate`.`ID` IS NULL) AND ".
       "  (`parent`.`sCachedFullAccessDate` IS NOT NULL OR `parent`.`sCachedPartialAccessDate` IS NOT NULL OR `parent`.`sCachedAccessSolutionsDate` IS NOT NULL OR ".
       "`parent`.`sFullAccessDate` IS NOT NULL  OR `parent`.`sPartialAccessDate` IS NOT NULL OR `parent`.`sAccessSolutionsDate` IS NOT NULL  OR `parent`.`bManagerAccess` != 0)   GROUP BY `child`.`ID`  ".
       "  ) AS `new_data` ".
       "  ON (`groups_items`.`ID` = `new_data`.ID) ".
       "  JOIN `groups_items_propagate` ON (`groups_items_propagate`.`ID` = `groups_items`.`ID`) ".
       "  SET ".
       "      `groups_items`.`sCachedFullAccessDate` = LEAST(IFNULL(`new_data`.`sCachedFullAccessDate`,`groups_items`.`sFullAccessDate`), ".
       "                                                        IFNULL(`groups_items`.`sFullAccessDate`, `new_data`.`sCachedFullAccessDate`)), ".
       "      `groups_items`.`sCachedPartialAccessDate` = LEAST(IFNULL(`new_data`.`sCachedPartialAccessDate`,`groups_items`.`sPartialAccessDate`), ".
       "                                                        IFNULL(`groups_items`.`sPartialAccessDate`, `new_data`.`sCachedPartialAccessDate`)), ".
       "      `groups_items`.`bCachedManagerAccess` = GREATEST(IFNULL(`new_data`.`bCachedManagerAccess`, 0),`groups_items`.`bManagerAccess`), ".
       "      `groups_items`.`sCachedAccessSolutionsDate` = LEAST(IFNULL(`new_data`.`sCachedAccessSolutionsDate`, `groups_items`.`sAccessSolutionsDate`), ".
       "                                                          IFNULL(`groups_items`.`sAccessSolutionsDate`, `new_data`.`sCachedAccessSolutionsDate`)), ".
       "      `groups_items`.`sCachedGrayedAccessDate` = `new_data`.`sCachedGrayedAccessDate`, ".
       "      `groups_items`.`sCachedAccessReason` = `new_data`.`sAccessReasonAncestors` ".
       "  WHERE `groups_items_propagate`.`sPropagateAccess` = 'self';";

      // marking 'self' groups_items as 'children'
      $queryMarkChildrenItems = "UPDATE `groups_items_propagate`".
                "SET `sPropagateAccess` = 'children' ".
                "WHERE `sPropagateAccess` = 'self';";

      $hasChanges = true;
      while ($hasChanges) {
         $db->exec($queryLockTables);
         $res = $db->exec($queryInsertMissingChildren);
         $res = $db->exec($queryInsertMissingPropagate);
         $res = $db->exec($queryUpdatePropagateAccess);
         $res = $db->exec($queryMarkDoNotPropagate);
         $res = $db->exec($queryMarkExistingChildren);
         $res = $db->exec($queryMarkFinishedItems);
         $res = $db->exec($queryUpdateGroupItems);
         $hasChanges = $db->exec($queryMarkChildrenItems);
         $db->exec($queryUnlockTables);
      }
      // remove default groups_items (veeeery slow)
      // TODO :: maybe move to some cleaning cron
      $queryDeleteDefaultGI = "delete from `groups_items` where ".
                              "    `sCachedAccessSolutionsDate` is null ".
                              "and `sCachedPartialAccessDate` is null ".
                              "and `sCachedFullAccessDate` is null ".
                              "and `sCachedGrayedAccessDate` is null ".
                              "and `sCachedAccessReason` = '' ".
                              "and `sFullAccessDate` is null ".
                              "and `sPartialAccessDate` is null ".
                              "and `sAccessSolutionsDate` is null ".
                              "and `bCachedManagerAccess` = 0 ".
                              "and `bManagerAccess` = 0 ".
                              "and `bOwnerAccess` = 0 ".
                              "and `sAccessReason` = '';";
      //$db->exec($queryDeleteDefaultGI);
   }

   public static function groupsItemsComputeCached($db) {
      $listFields = array(
         "bCachedFullAccess" => "sCachedFullAccessDate",
         "bCachedPartialAccess" => "sCachedPartialAccessDate",
         "bCachedAccessSolutions" => "sCachedAccessSolutionsDate",
         "bCachedGrayedAccess" => "sCachedGrayedAccessDate");

      foreach ($listFields as $bAccessField => $sAccessDateField) {
         $query = "UPDATE `groups_items` ".
         "SET `".$bAccessField."` = true ".
         "WHERE `".$bAccessField."` = false ".
         "AND `".$sAccessDateField."` IS NOT NULL AND `".$sAccessDateField."` <= NOW();";
         $db->exec($query);
         //file_put_contents(__DIR__.'/../logs/groups_item_listeners.log', $query."\n", FILE_APPEND);
         $query = "UPDATE `groups_items` ".
         "SET `".$bAccessField."` = false ".
         "WHERE `".$bAccessField."` = true ".
         "AND (`".$sAccessDateField."` IS NULL OR `".$sAccessDateField."` > NOW());";
         $db->exec($query);
         //file_put_contents(__DIR__.'/../logs/groups_item_listeners.log', $query."\n", FILE_APPEND);
      }
   }

   public static function groupsItemsBefore($db) {
      //Listeners::groupsItemsComputeCached($db);
   }
}


1?>
