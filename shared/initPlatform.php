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

function createItemItem($idItemParent, $idItemChild, $iChildOrder) {
	global $db;
	$stmt = $db->prepare('insert ignore into items_items (idItemParent, idItemChild, iChildOrder) values (:idItemParent, :idItemChild, :iChildOrder);');
	$stmt->execute(['idItemParent' => $idItemParent, 'idItemChild' => $idItemChild, 'iChildOrder' => $iChildOrder]);
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