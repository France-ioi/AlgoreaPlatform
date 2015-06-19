<?php

require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";

function cleanTempUsers($db) {
   $query = 'delete users_items from users_items left join users on users_items.idUser = users.ID where users.tempUser = 1;';
   echo $query."\n";
   $db->exec($query);
   $query = 'delete users_items from users_items left join users on users_items.idUser = users.ID where users.tempUser = 1;';
   echo $query."\n";
   $db->exec($query);
   $query = 'delete groups_groups from groups_groups left join users on
      groups_groups.idGroupChild = users.idGroupSelf or
      groups_groups.idGroupParent = users.idGroupSelf or
      groups_groups.idGroupChild = users.idGroupOwned or
      groups_groups.idGroupParent = users.idGroupOwned
      where users.tempUser = 1;';
   echo $query."\n";
   $db->exec($query);
   $query = 'delete groups from groups left join users on
      groups.ID = users.idGroupSelf or
      groups.ID = users.idGroupOwned
      where users.tempUser = 1;';
   echo $query."\n";
   $db->exec($query);
   $query = 'delete users from users
      where users.tempUser = 1;';
   echo $query."\n";
   $db->exec($query);
   // should disappear
   $query = 'delete groups_groups from groups_groups left join groups
      on groups.ID = groups_groups.idGroupChild or groups.ID = groups_groups.idGroupParent
      where groups.sName LIKE \'tmp%\';';
   echo $query."\n";
   $db->exec($query);
   $query = 'delete groups from groups
      where groups.sName LIKE \'tmp%\';';
   echo $query."\n";
   $db->exec($query);
}

function generateGroupVersion() {
   $query = 'insert ignore into `groups_versions` (`idGroup`, `iVersion`) select `groups`.`ID`, MAX(`groups_items`.`iVersion`) from `groups` join `groups_items` on `groups_items`.`idGroup` = `groups`.`ID` group by `groups`.`ID` on duplicate key update `iVersion` = VALUES(`iVersion`);';
   echo $query."\n";
   $db->exec($query);
}

function generateUserItemGroup() {
   $query = 'update users_items join users on users.ID = users_items.idUser set users_items.idGroup = users.idGroupSelf;';
   echo $query."\n";
   $db->exec($query);
}

#cleanTempUsers($db);
#generateGroupVersion();

$db->exec('truncate groups_ancestors');
$db->exec('update groups_propagate set sAncestorsComputationState = \'todo\';');
Listeners::createNewAncestors($db, "groups", "Group");
//$db->exec('truncate items_ancestors');
//$db->exec('update items set sAncestorsComputationState = \'todo\';');
//Listeners::createNewAncestors($db, "items", "Item");
//Listeners::groupsItemsAfter($db);
//Listeners::computeAllAccess($db);

#require_once __DIR__.'/../modelsManager/cleanHistory.php';
