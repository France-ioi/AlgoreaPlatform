<?php

function addCustomTriggers(&$triggers) {
   $objectNames = array("items" => "Item", "groups" => "Group");
   foreach ($objectNames as $objectName => $upObjectName) {
      $queryOld = '';
      // Mark as 'todo' the objects at both direct ends of the old relation
      $queryOld .= "INSERT IGNORE INTO `".$objectName."_propagate` ".
         "(`ID`, `sAncestorsComputationState`) VALUES (OLD.id".$upObjectName."Child, 'todo') ".
         "ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'; ".
         "INSERT IGNORE INTO `".$objectName."_propagate` ".
         "(`ID`, `sAncestorsComputationState`) VALUES (OLD.id".$upObjectName."Parent, 'todo') ".
         "ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'; ";

#      "UPDATE `".$objectName."` ".
#         "SET `".$objectName."`.`sAncestorsComputationState` = 'todo' ".
#         "WHERE `".$objectName."`.`ID` = OLD.`id".$upObjectName."Child` ".
#         "OR `".$objectName."`.`ID` = OLD.`id".$upObjectName."Parent`;";

      // Mark as 'todo' the objects that are descendants of the child object of the old relation
      $queryOld .= "INSERT IGNORE INTO `".$objectName."_propagate` (`ID`, `sAncestorsComputationState`) (SELECT `".$objectName."`.`ID`, 'todo' FROM `".$objectName."` ".
         "JOIN `".$objectName."_ancestors` `descendants` ON (`descendants`.`id".$upObjectName."Child` = `".$objectName."`.`ID`) ".
         "WHERE `descendants`.`id".$upObjectName."Ancestor` = OLD.`id".$upObjectName."Child`) ".
         "ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'; ";

#      $queryOld .= "UPDATE `".$objectName."` ".
#         "JOIN `".$objectName."_ancestors` `descendants` ON (`descendants`.`id".$upObjectName."Child` = `".$objectName."`.`ID`) ".
#         "SET `".$objectName."`.`sAncestorsComputationState` = 'todo' ".
#         "WHERE `descendants`.`id".$upObjectName."Ancestor` = OLD.`id".$upObjectName."Child`; ";

      // Mark as 'todo' the objects that are ancestors of the parent object of the old relation
      $queryOld .= "INSERT IGNORE INTO `".$objectName."_propagate` (`ID`, `sAncestorsComputationState`) (SELECT `".$objectName."`.`ID`, 'todo' FROM `".$objectName."` ".
         "JOIN `".$objectName."_ancestors` `ancestors` ON (`ancestors`.`id".$upObjectName."Ancestor` = `".$objectName."`.`ID`) ".
         "WHERE `ancestors`.`id".$upObjectName."Child` = OLD.`id".$upObjectName."Child`) ".
         "ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'; ";

#      $queryOld .= "UPDATE `".$objectName."` ".
#         "JOIN `".$objectName."_ancestors` `ancestors` ON (`ancestors`.`id".$upObjectName."Ancestor` = `".$objectName."`.`ID`) ".
#         "SET `".$objectName."`.`sAncestorsComputationState` = 'todo' ".
#         "WHERE `ancestors`.`id".$upObjectName."Child` = OLD.`id".$upObjectName."Child`; ";

      // We delete all bridges between ancestors of the parent and descendants of the child in the old relation
      $queryOld .= "DELETE `bridges` FROM `".$objectName."_ancestors` `child_descendants` ".
         "JOIN `".$objectName."_ancestors` `parent_ancestors` ".
         "JOIN `".$objectName."_ancestors` `bridges` ON (`bridges`.`id".$upObjectName."Ancestor` = `parent_ancestors`.`id".$upObjectName."Ancestor` AND ".
                                              "`bridges`.`id".$upObjectName."Child` = `child_descendants`.`id".$upObjectName."Child`) ".
         "WHERE `parent_ancestors`.`id".$upObjectName."Child` = OLD.`id".$upObjectName."Parent` ".
         "AND `child_descendants`.`id".$upObjectName."Ancestor` = OLD.`id".$upObjectName."Child`; ";

      // Delete all ancestry relationships of the child that were also ancestors of the parent in the old relation
      $queryOld .= "DELETE `child_ancestors` FROM `".$objectName."_ancestors` `parent_ancestors` ".
         "JOIN  `".$objectName."_ancestors` `child_ancestors` ON (`child_ancestors`.`id".$upObjectName."Child` = OLD.`id".$upObjectName."Child` AND ".
            "`child_ancestors`.`id".$upObjectName."Ancestor` = `parent_ancestors`.`id".$upObjectName."Ancestor`) ".
         "WHERE `parent_ancestors`.`id".$upObjectName."Child` = OLD.`id".$upObjectName."Parent`; ";

      // Delete all descendence relationships of the parent that were also descendants of the child in the old relation
      $queryOld .= "DELETE `parent_ancestors` FROM `".$objectName."_ancestors` `child_ancestors` ".
         "JOIN  `".$objectName."_ancestors` `parent_ancestors` ON (`parent_ancestors`.`id".$upObjectName."Ancestor` = OLD.`id".$upObjectName."Parent` AND ".
            "`child_ancestors`.`id".$upObjectName."Child` = `parent_ancestors`.`id".$upObjectName."Child`) ".
         "WHERE `child_ancestors`.`id".$upObjectName."Ancestor` = OLD.`id".$upObjectName."Parent` ";

      $triggers[$objectName."_".$objectName]["BEFORE DELETE"][] = $queryOld;

      // We mark as 'todo' the child of any new relation. Its descendants will be marked as 'todo' by the listener
      $queryNew = "INSERT IGNORE INTO `".$objectName."_propagate` ".
         "(ID, sAncestorsComputationState) VALUES (NEW.id".$upObjectName."Child, 'todo') ".
         "ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo' ";
      $triggers[$objectName."_".$objectName]["BEFORE INSERT"][] = $queryNew;

      // ancestors relations in groups are also influenced by sType
      if ($upObjectName == 'Item') {
         $queryOld = "IF (OLD.idItemChild != NEW.idItemChild OR OLD.idItemParent != NEW.idItemParent) THEN ".$queryOld." ; END IF";
         $queryNew = "IF (OLD.idItemChild != NEW.idItemChild OR OLD.idItemParent != NEW.idItemParent) THEN ".$queryNew." ; END IF";
      } else if ($upObjectName == 'Group') {
         $queryOld = "IF (OLD.idGroupChild != NEW.idGroupChild OR OLD.idGroupParent != NEW.idGroupParent OR OLD.sType != NEW.sType) THEN ".$queryOld." ; END IF";
         $queryNew = "IF (OLD.idGroupChild != NEW.idGroupChild OR OLD.idGroupParent != NEW.idGroupParent OR OLD.sType != NEW.sType) THEN ".$queryNew." ; END IF";
      }
      $triggers[$objectName."_".$objectName]["BEFORE UPDATE"][] = $queryOld;
      $triggers[$objectName."_".$objectName]["BEFORE UPDATE"][] = $queryNew;
   }

   // We reset the computation of access for any item that lost an ancestor, and any item that gained an ancestor
   $queryResetAccessOld = "UPDATE `groups_items_propagate` ".
      "JOIN `groups_items` ON `groups_items`.`ID` = `groups_items_propagate`.`ID`".
      "SET `groups_items_propagate`.`sPropagateAccess` = 'self' ".
      "WHERE `groups_items`.`idItem` = OLD.`idItemChild`";
   $triggers["items_items"]["BEFORE DELETE"][] = $queryResetAccessOld;
   $triggers["items_items"]["BEFORE UPDATE"][] = $queryResetAccessOld." OR `groups_items`.`idItem` = NEW.`idItemChild`";

   // We reset the computation of access for the group_item that was just modified
   $queryResetAccessNew = "IF NOT (NEW.`sFullAccessDate` <=> OLD.`sFullAccessDate`".
      "AND NEW.`sPartialAccessDate` <=> OLD.`sPartialAccessDate`".
      "AND NEW.`sAccessSolutionsDate` <=> OLD.`sAccessSolutionsDate`".
      "AND NEW.`bManagerAccess` <=> OLD.`bManagerAccess`".
      "AND NEW.`sAccessReason` <=> OLD.`sAccessReason`)".
      "THEN ".
      "INSERT IGNORE INTO `groups_items_propagate` (ID, sPropagateAccess) VALUES(NEW.ID, 'self') ON DUPLICATE KEY UPDATE sPropagateAccess='self'; ".
      "END IF";
   $triggers["groups_items"]["BEFORE UPDATE"][] = $queryResetAccessNew;
   $triggers["groups_items"]["AFTER DELETE"][] = "DELETE FROM groups_items_propagate where ID = OLD.ID ";
   //$triggers["groups_items"]["AFTER INSERT"][] = "INSERT IGNORE INTO `groups_items_propagate` (`ID`, `sPropagateAccess`) VALUES (NEW.`ID`, 'self') ON DUPLICATE KEY UPDATE `sPropagateAccess`='self' ";
   // filling groups_versions with last version of groups_items for the groups
#   $triggers["groups_items"]["AFTER INSERT"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) SELECT `descendants`.`ID`, @curVersion FROM `groups_ancestors` as `descendants` WHERE `descendants`.`idGroupAncestor` = NEW.`ID` ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";
#   $triggers["groups_items"]["AFTER DELETE"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) SELECT `descendants`.`ID`, @curVersion FROM `groups_ancestors` as `descendants` WHERE `descendants`.`idGroupAncestor` = OLD.`ID` ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";
#   $triggers["groups_items"]["AFTER UPDATE"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) SELECT `descendants`.`ID`, @curVersion FROM `groups_ancestors` as `descendants` WHERE `descendants`.`idGroupAncestor` = NEW.`ID` ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";
   $triggers["groups_items"]["AFTER INSERT"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) VALUES (NEW.`ID`, @curVersion) ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";
   $triggers["groups_items"]["AFTER DELETE"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) VALUES (OLD.`ID`, @curVersion) ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";
   $triggers["groups_items"]["AFTER UPDATE"][] = "SELECT `iVersion` INTO @curVersion FROM `synchro_version`; INSERT IGNORE INTO `groups_versions` (`idGroup`, `iVersion`) VALUES (NEW.`ID`, @curVersion) ON DUPLICATE KEY UPDATE `iVersion`=@curVersion ";

   $triggers["groups"]["AFTER DELETE"][] = "DELETE FROM groups_propagate where ID = OLD.ID ";
   $triggers["groups"]["AFTER INSERT"][] = "INSERT IGNORE INTO `groups_propagate` (`ID`, `sAncestorsComputationState`) VALUES (NEW.`ID`, 'todo') ";
   $triggers["items"]["AFTER DELETE"][] = "DELETE FROM items_propagate where ID = OLD.ID ";
   $triggers["items"]["AFTER INSERT"][] = "INSERT IGNORE INTO `items_propagate` (`ID`, `sAncestorsComputationState`) VALUES (NEW.`ID`, 'todo') ";
   //$queryResetCachedFullAccess = "IF NOT (NEW.`sCachedFullAccessDate` <=> OLD.`sCachedFullAccessDate`) THEN SET NEW.`bCachedFullAccess` = 0; END IF";
   //$triggers["groups_items"]["BEFORE UPDATE"][] = $queryResetCachedFullAccess;
   //$queryResetCachedPartialAccess = "IF NOT (NEW.`sPartialAccessDate` <=> OLD.`sPartialAccessDate`) THEN SET NEW.`bCachedPartialAccess` = 0; END IF";
   //$triggers["groups_items"]["BEFORE UPDATE"][] = $queryResetCachedPartialAccess;
}

?>
