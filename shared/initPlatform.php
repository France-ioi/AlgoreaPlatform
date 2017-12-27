<?php

require_once 'connect.php';
require_once 'listeners.php';

function createGroup($ID, $name, $type) {
    global $db, $config;
    $stmt = $db->prepare('insert ignore into groups (ID, sName, sTextId, sType) values (:ID, :sName, :sTextId, :sType);');
    $stmt->execute(['ID' => $ID, 'sName' => $name, 'sTextId' => $name, 'sType' => $type]);
}

function createGroupGroup($idGroupParent, $idGroupChild, $iChildOrder) {
    global $db;

    // Check relation doesn't already exist
    $stmt = $db->prepare("select ID from groups_groups WHERE idGroupParent=:idGroupParent AND idGroupChild=:idGroupChild;");
    $stmt->execute(['idGroupParent' => $idGroupParent, 'idGroupChild' => $idGroupChild]);
    if($stmt->rowCount() > 0) {
        return;
    }

    $stmt = $db->prepare('insert ignore into groups_groups (idGroupParent, idGroupChild, iChildOrder) values (:idGroupParent, :idGroupChild, :iChildOrder);');
    $stmt->execute(['idGroupParent' => $idGroupParent, 'idGroupChild' => $idGroupChild, 'iChildOrder' => $iChildOrder]);
}

function createItem($ID, $title, $type, $bCustomChapter = 0) {
    global $db, $config;
    $stmt = $db->prepare('insert ignore into items (ID, sType, bCustomChapter, bDisplayChildrenAsTabs) values (:ID, :sType, :bCustomChapter, 1);');
    $stmt->execute(['ID' => $ID, 'sType' => $type, 'bCustomChapter' => $bCustomChapter]);
    $stmt = $db->prepare('insert ignore into items_strings (idItem, sTitle) values (:idItem, :sTitle);');
    $stmt->execute(['idItem' => $ID, 'sTitle' => $title]);
    $rootGroup = $config->shared->RootGroupId;
    $stmt = $db->prepare('insert ignore into groups_items (idItem, idGroup, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idItem, :idGroup, NOW(), NOW(), 1);');
    $stmt->execute(['idItem' => $ID, 'idGroup' => $rootGroup]);
}

function createItemItem($idItemParent, $idItemChild, $iChildOrder=null) {
    global $db;

    // Check relation doesn't already exist
    $stmt = $db->prepare("select ID from items_items WHERE idItemParent=:idItemParent AND idItemChild=:idItemChild;");
    $stmt->execute(['idItemParent' => $idItemParent, 'idItemChild' => $idItemChild]);
    if($stmt->rowCount() > 0) {
        return;
    }

    if ($iChildOrder == null) {
    	$stmt = $db->prepare("lock tables items_items write; set @maxIChildOrder = IFNULL((select max(iChildOrder) from `items_items` where `idItemParent` = :idItemParent),0); insert ignore into `items_items` (`idItemParent`, `idItemChild`, `iChildOrder`) values (:idItemParent, :idItemChild, @maxIChildOrder+1); unlock tables;");
    	$stmt->execute(['idItemParent' => $idItemParent, 'idItemChild' => $idItemChild]);
    } else {
    	$stmt = $db->prepare('insert ignore into items_items (idItemParent, idItemChild, iChildOrder) values (:idItemParent, :idItemChild, :iChildOrder);');
    	$stmt->execute(['idItemParent' => $idItemParent, 'idItemChild' => $idItemChild, 'iChildOrder' => $iChildOrder]);
    }
}

function main() {
    global $db, $config;

    // Create items and groups for the platform root
    createGroup($config->shared->RootGroupId, 'Root', 'Root');
    createGroup($config->shared->RootSelfGroupId, 'RootSelf', 'RootSelf');
    createGroup($config->shared->RootAdminGroupId, 'RootAdmin', 'RootAdmin');
    createGroup($config->shared->RootTempGroupId, 'RootTemp', 'UserSelf');
    createGroupGroup($config->shared->RootGroupId, $config->shared->RootSelfGroupId, 1);
    createGroupGroup($config->shared->RootGroupId, $config->shared->RootAdminGroupId, 2);
    createGroupGroup($config->shared->RootSelfGroupId, $config->shared->RootTempGroupId, 1);
    createItem($config->shared->RootItemId, 'Racine', 'Root');
    createItem($config->shared->OrphanedRootItemId, 'Items sans parents', 'Root');

    // Create items for the current domain
    $domainConfig = $config->shared->domains['current'];
    createItem($domainConfig->PlatformItemId, 'Accueil', 'Chapter');
    createItem($domainConfig->CustomProgressItemId, 'Parcours personnalisés', 'Chapter', 1);
    createItem($domainConfig->OfficialProgressItemId, 'Parcours officiels', 'Chapter');
    createItem($domainConfig->DiscoverRootItemId, 'Bienvenue', 'Course');
    createItem($domainConfig->ContestRootItemId, 'Concours', 'Root');
    createItem($domainConfig->CustomContestRootItemId, 'Concours personnalisés', 'Chapter', 1);
    createItem($domainConfig->ProgressRootItemId, 'Parcours', 'Root');
    createItem($domainConfig->OfficialContestRootItemId, 'Concours officiels', 'Chapter');
    createItemItem($config->shared->RootItemId, $domainConfig->PlatformItemId);
    createItemItem($domainConfig->PlatformItemId, $domainConfig->ProgressRootItemId, 0);
    createItemItem($domainConfig->PlatformItemId, $domainConfig->DiscoverRootItemId, 2);
    createItemItem($domainConfig->PlatformItemId, $domainConfig->ContestRootItemId, 1);
    createItemItem($domainConfig->ContestRootItemId, $domainConfig->OfficialContestRootItemId, 0);
    createItemItem($domainConfig->ContestRootItemId, $domainConfig->CustomContestRootItemId, 1);
    createItemItem($domainConfig->ProgressRootItemId, $domainConfig->OfficialProgressItemId, 0);
    createItemItem($domainConfig->ProgressRootItemId, $domainConfig->CustomProgressItemId, 1);
    Listeners::itemsItemsAfter($db);
    Listeners::groupsItemsAfter($db);
    Listeners::groupsGroupsAfter($db);
}

function syncDebug() {}

main();

// at the end, add some admins with the shared/addAdmin.php script
