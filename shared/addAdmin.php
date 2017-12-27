<?php

// This script adds an user as administrator of a domain on the platform.

// *** Configuration
// Domain (from config) on which the user should be added as administrator
$domain = 'current';
// SQL query to fetch the idGroupSelf of the user to add as administrator
$idGroupSelfQuery = "SELECT idGroupSelf FROM users WHERE sLogin = 'adminuser';";
// Comment the next line to allow script execution
die('No access.');


require_once 'connect.php';
require_once 'listeners.php';

function syncDebug() {}


function addUserAsAdmin($idGroupSelf, $idItem) {
    // Set the admin rights for the user identified by idGroupSelf on an item and its descendants
    global $db;

    // Add user as admin on item
    $stmt = $db->prepare("INSERT IGNORE INTO groups_items (idItem, idGroup, bOwnerAccess, bManagerAccess, bCachedManagerAccess) values (:idItem, :idGroup, 1, 1, 1);");
    $stmt->execute(['idItem' => $idItem, 'idGroup' => $idGroupSelf]);

    // Add user as admin on item descendants
    $stmt = $db->prepare("INSERT IGNORE INTO groups_items (idItem, idGroup, bOwnerAccess, bManagerAccess, bCachedManagerAccess) SELECT idItemChild as idItem, :idGroup as idGroup, 1 as bOwnerAccess, 1 as bManagerAccess, 1 as bCachedManagerAccess from items_ancestors where idItemAncestor = :idItem ON DUPLICATE KEY UPDATE bOwnerAccess = 1, bManagerAccess = 1, bCachedManagerAccess = 1;");
    $stmt->execute(['idItem' => $idItem, 'idGroup' => $idGroupSelf]);
}

// Get domain config
if(!isset($config->shared->domains[$domain])) {
    die('Unable to retreive domain config.');
}
$domainConfig = $config->shared->domains[$domain];

// Execute the query to get the idGroupSelf
$stmt = $db->prepare($idGroupSelfQuery);
$stmt->execute();
$idGroupSelf = $stmt->fetchColumn();

if(!$idGroupSelf) {
   die('No idGroupSelf fetched.');
}

// Make sure all ancestors are computed already
Listeners::itemsItemsAfter($db);

// Add user as admin on the three items
addUserAsAdmin($idGroupSelf, $domainConfig->OfficialProgressItemId);
addUserAsAdmin($idGroupSelf, $domainConfig->OfficialContestRootItemId);
addUserAsAdmin($idGroupSelf, $domainConfig->DiscoverRootItemId);

// Make sure rights are propagated properly
Listeners::groupsGroupsAfter($db);
Listeners::groupsItemsAfter($db);
Listeners::computeAllAccess($db);
