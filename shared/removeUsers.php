<?php

// Script to remove users and their associated data from the platform

require_once __DIR__."/../shared/connect.php";

/*** Options ***/

// Base query to select the users to remove
$baseUserQuery = "FROM users WHERE sLogin NOT IN ('usera', 'userb')";

$mode = 'count'; // change this to 'delete' to start deletion
$displayOnly = false;

/*** End of options ***/

function dropTriggers($table) {
    global $db;
    $db->exec("DROP TRIGGER IF EXISTS `delete_".$tableName."`");
    $db->exec("DROP TRIGGER IF EXISTS `custom_delete_".$tableName."`");
    $db->exec("DROP TRIGGER IF EXISTS `before_delete_".$tableName."`");
    $db->exec("DROP TRIGGER IF EXISTS `after_delete_".$tableName."`");
}

function executeQuery($query) {
    global $db, $mode, $displayOnly;
    if($mode == 'delete') {
        $fullQuery = "DELETE " . $query;
        echo $fullQuery . "\n";
        if(!$displayOnly) {
            $stmt = $db->prepare($fullQuery);
            $stmt->execute();
            echo $stmt->rowCount() . " lines deleted.\n";
        }
    } elseif($mode == 'count') {
        $fullQuery = "SELECT COUNT(*) " . $query;
        echo $fullQuery . "\n";
        if(!$displayOnly) {
            $stmt = $db->prepare($fullQuery);
            $stmt->execute();
            echo $stmt->fetchColumn() . " lines selected.\n";
        }
    } else {
        $fullQuery = "SELECT * " . $query;
        echo $fullQuery . "\n";
    }
};

function removeHistory($table) {
    executeQuery("FROM history_$table WHERE ID NOT IN (SELECT ID FROM $table)");
};

//$idUserQuery = "SELECT * FROM pixal.users WHERE `sLogin` LIKE 'ups%' AND NOT EXISTS (SELECT 1 FROM pixal.groups_ancestors WHERE (idGroupAncestor = 109102066123047656 OR idGroupAncestor = 477112099289678181 OR idGroupAncestor = 899084761192596830) AND idGroupChild = users.idGroupSelf)";

$idUserQuery = "SELECT ID " . $baseUserQuery;

dropTriggers('users_threads');
executeQuery("FROM `users_threads` WHERE idUser IN ( $idUserQuery )");
dropTriggers('users_answers');
executeQuery("FROM `users_answers` WHERE idUser IN ( $idUserQuery )");
dropTriggers('users_items');
executeQuery("FROM `users_items` WHERE idUser IN ( $idUserQuery )");

$idGroupSelfQuery = "SELECT idGroupSelf " . $baseUserQuery;
$idGroupOwnedQuery = "SELECT idGroupOwned " . $baseUserQuery;

$db->exec("CREATE TEMPORARY TABLE tmp__groups (ID BIGINT)");
$db->exec("INSERT IGNORE INTO tmp__groups ($idGroupSelfQuery)");
$db->exec("INSERT IGNORE INTO tmp__groups ($idGroupOwnedQuery)");

executeQuery("FROM groups_items_propagate WHERE ID IN (SELECT ID FROM `groups_items` WHERE idGroup IN (SELECT ID FROM tmp__groups))");
dropTriggers('groups_items');
executeQuery("FROM `groups_items` WHERE idGroup IN (SELECT ID FROM tmp__groups)");

dropTriggers('groups_groups');
executeQuery("FROM groups_groups WHERE idGroupParent IN (SELECT ID FROM tmp__groups)");
executeQuery("FROM groups_groups WHERE idGroupChild IN (SELECT ID FROM tmp__groups)");

dropTriggers('groups_ancestors');
executeQuery("FROM groups_ancestors WHERE idGroupAncestor IN (SELECT ID FROM tmp__groups)");
executeQuery("FROM groups_ancestors WHERE idGroupChild IN (SELECT ID FROM tmp__groups)");

executeQuery("FROM `groups_propagate` WHERE ID IN (SELECT ID FROM tmp__groups)");
dropTriggers('groups');
executeQuery("FROM `groups` WHERE ID IN (SELECT ID FROM tmp__groups)");

dropTriggers('users');
executeQuery($baseUserQuery);

removeHistory("users_threads");
removeHistory("users_answers");
removeHistory("users_items");
removeHistory("groups_items");
removeHistory("groups_groups");
removeHistory("groups_ancestors");
removeHistory("groups");
removeHistory("users");

// Put triggers back in place
require __DIR__.'/../commonFramework/modelsManager/triggers.php';
