<?php

require_once 'connect.php';
require_once 'listeners.php';

function createItem($ID, $title, $type) {
	global $db, $config;
	$stmt = $db->prepare('insert ignore into items (ID, sType) values (:ID, :sType);');
	$stmt->execute(['ID' => $ID, 'sType' => $type]);
	$stmt = $db->prepare('insert ignore into items_strings (idItem, sTitle) values (:idItem, :sTitle);');
	$stmt->execute(['idItem' => $ID, 'sTitle' => $title]);
	$rootGroup = $config->shared->RootGroupId;
	$stmt = $db->prepare('insert ignore into groups_items (idItem, idGroup, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idItem, :idGroup, NOW(), NOW(), 1);');
	$stmt->execute(['idItem' => $ID, 'idGroup' => $rootGroup]);
}

function createItemItem($idItemParent, $idItemChild, $iChildOrder=null) {
	global $db;
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
	$domainConfig = $config->shared->domains['current'];
	createItem($domainConfig->PlatformItemId, 'Accueil', 'DomainRoot');
	createItem($domainConfig->CustomProgressItemId, 'Parcours personnalisés', 'CustomProgressRoot');
	createItem($domainConfig->OfficialProgressItemId, 'Parcours officiels', 'OfficialProgressRoot');
	createItem($domainConfig->DiscoverRootItemId, 'Bienvenue', 'Presentation');
	createItem($domainConfig->ContestRootItemId, 'Concours', 'Root');
	createItem($domainConfig->CustomContestRootItemId, 'Concours personnalisés', 'CustomContestRoot');
	createItem($domainConfig->ProgressRootItemId, 'Parcours', 'Root');
	createItem($domainConfig->OfficialContestRootItemId, 'Concours officiels', 'OfficialContestRoot');
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
}

function syncDebug() {}

main();

// at the end, add some admins with:
// insert ignore into groups_items (idItem, idGroup, bOwnerAccess, bManagerAccess, bCachedManagerAccess) select idItemChild as idItem, XX as idGroup, 1 as bOwnerAccess, 1 as bManagerAccess, 1 as bCachedManagerAccess from items_ancestors where idItemAncestor = YYY;
// insert ignore into groups_items (idItem, idGroup, bOwnerAccess, bManagerAccess, bCachedManagerAccess) values (YYY, XXX, 1, 1, 1);
// where YYY is the root of the platform and XXX the idGroupSelf of the user you want as admin
