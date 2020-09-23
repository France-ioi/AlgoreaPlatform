<?php

// This script sets bIsAdmin to users having any editing rights.
// bIsAdmin is currently only used to determine whether groups_items should be
// synchronized on the client.

require_once 'connect.php';
require_once 'listeners.php';

function syncDebug() {}


$stmt = $db->prepare("
    UPDATE users
    JOIN groups_ancestors ON groups_ancestors.idGroupChild = users.idGroupSelf
    JOIN groups_items ON groups_items.idGroup = groups_ancestors.idGroupAncestor
    SET users.bIsAdmin = 1
    WHERE users.bIsAdmin = 0 AND groups_items.bOwnerAccess = 1 OR groups_items.bManagerAccess = 1;
    ");
$stmt->execute();
