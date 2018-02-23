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

#cleanTempUsers($db);

function syncDebug() {}

// *** Lines to clean the ancestors tables
//$db->exec('truncate groups_ancestors');
//$db->exec('truncate groups_propagate');
//$db->exec('insert ignore into groups_propagate (ID, sAncestorsComputationState) select ID, \'todo\' from groups;');
//$db->exec('update groups_propagate set sAncestorsComputationState = \'todo\';');
//Listeners::createNewAncestors($db, "groups", "Group");
//$db->exec('truncate items_ancestors');
//$db->exec('truncate items_propagate');
//$db->exec('insert ignore into items_propagate (ID, sAncestorsComputationState) select ID, \'todo\' from items;');
//Listeners::createNewAncestors($db, "items", "Item");
//$db->exec('insert ignore into groups_items_propagate (ID, sPropagateAccess) select ID, \'self\' from groups_items;');

Listeners::itemsItemsAfter($db);
Listeners::groupsGroupsAfter($db);
Listeners::groupsItemsAfter($db);
Listeners::propagateAttempts($db);
Listeners::computeAllUserItems($db);
Listeners::computeAllAccess($db);

#require_once __DIR__.'/../commonFramework/modelsManager/cleanHistory.php';
