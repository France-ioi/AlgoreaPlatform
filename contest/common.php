<?php

require_once __DIR__.'/../shared/connect.php';

function getRemainingTime() {
	if (!isset($_SESSION['contest'])) {
		return ['success' => true, 'remainingTime' => 0];
	}
	$now = new DateTime();
	$endTime = $_SESSION['contest']['endTime'];
	$diff = $endTime->getTimestamp() - $now->getTimestamp();
	if ($diff < 0) $diff = 0;
	return ['success' => true, 'remainingTime' => $diff, 'endTime' => $endTime, 'now' => $now];
}

function adjustContestAndGetData() {
	global $db;
	if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
		return null;
	}
	$stmt = $db->prepare('select NOW() as now, TIME_TO_SEC(items.sDuration) as duration, items.ID as idItem, IF(users_items.sAdditionalTime IS NULL, 0, TIME_TO_SEC(users_items.sAdditionalTime)) as additionalTime, users_items.sContestStartDate as sContestStartDate from items
		left join users_items on users_items.idItem = items.ID and users_items.idUser = :idUser
        WHERE users_items.sContestStartDate is not null and users_items.sFinishDate is null order by users_items.sContestStartDate desc;');
	$stmt->execute(['idUser' => $_SESSION['login']['ID']]);
	$res = $stmt->fetch();
	if (!$res) {
		return null;
	}
	$now = new DateTime($res['now']);
	$startTime = new DateTime($res['sContestStartDate']);
	$totalDuration = intval($res['duration'])+intval($res['additionalTime']);
	$endTime = getContestEndTime($res['sContestStartDate'], $totalDuration);
	if ($endTime < $now) {
		closeContest($res['idItem']);
		return null;
	}
	return ['now' => $now->getTimestamp(), 'duration' => $totalDuration, 'idItem' => $res['idItem'], 'endTime' => $endTime->getTimestamp(), 'startTime' => $startTime->getTimestamp(), 'test' => ($endTime < $now)];
}

function getContestEndTime($sContestStartDate, $duration) {
	$date = new DateTime($sContestStartDate);
	$duration = new DateInterval('PT'.$duration.'S');
	$date->add($duration);
	return $date;
}

function openContest($idItem) {
	global $db;
	if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
		echo json_encode(['success' => false, 'error' => "vous devez être connecté pour accéder au concours"]);
		return;
	}
	if (isset($_SESSION['contestItemId']) && $_SESSION['contestItemId'] != $idItem) {
		echo json_encode(['success' => false, 'error' => "vous avez déjà commencé un autre concours"]);
		return;
	}
	$stmt = $db->prepare('select NOW() as now, items.*, users_items.*, TIME_TO_SEC(items.sDuration) as duration, max(groups_items.bCachedFullAccess) as fullAccess from items
		left join users_items on users_items.idItem = items.ID and users_items.idUser = :idUser
		JOIN groups_ancestors as my_groups_ancestors ON my_groups_ancestors.idGroupChild = :idGroupSelf
        JOIN groups_items ON groups_items.idGroup = my_groups_ancestors.idGroupAncestor AND groups_items.idItem = items.ID
        WHERE items.ID = :idItem AND (`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) group by items.ID;');
	$stmt->execute(['idItem' => $idItem, 'idUser' => $_SESSION['login']['ID'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
	$contestData = $stmt->fetch();
	if (!$contestData) {
		echo json_encode(['success' => false, 'error' => "le concours n'existe pas ou vous n'y avez pas accès"]);
		return;
	}
	if (!intval($contestData['duration'])) {
		echo json_encode(['success' => false, 'error' => "l'item demandé n'est pas un concours"]);
		return;
	}
	if ($contestData['sAccessOpenDate'] && !$contestData['fullAccess'] && $contestData['sAccessOpenDate'] > $contestData['now']) {
		echo json_encode(['success' => false, 'error' => "le concours n'a pas encore commencé"]);
		return;
	}
	if ($contestData['sEndContestDate'] && !$contestData['fullAccess'] && $contestData['sEndContestDate'] < $contestData['now']) {
		echo json_encode(['success' => false, 'error' => "le concours est terminé"]);
		return;
	}
	if (isset($contestData['sContestStartDate']) && $contestData['sContestStartDate']) {
		echo json_encode(['success' => false, 'error' => "vous avez déjà commencé ce concours"]);
		return;
	}
	$stmt = $db->prepare('insert into users_items (idUser, idItem, sContestStartDate, sLastActivityDate, sStartDate) values (:idUser, :idItem, NOW(), NOW(), NOW()) on duplicate key update sContestStartDate = NOW(), sLastActivityDate = NOW(), sStartDate = NOW();');
	$stmt->execute(['idUser' => $_SESSION['login']['ID'], 'idItem' => $idItem]);
	$stmt = $db->prepare('insert into groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idGroupSelf, :idItem, NOW(), NOW(), 1) on duplicate key update sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;');
	$stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
	require_once __DIR__.'/../shared/listeners.php';
	Listeners::groupsItemsAfter($db);
	$endTime = getContestEndTime($contestData['now'], $contestData['duration']);
	$startTime = new DateTime($contestData['now']);
	$_SESSION['contest'] = [
		'endTime' => $endTime->getTimestamp(),
		'startTime' => $startTime->getTimestamp(),
		'idItem' => $idItem,
		'duration' => $contestData['duration']
	];
	echo json_encode(['success' => true, 'endTime' => $endTime->getTimestamp(), 'startTime' => $startTime->getTimestamp(), 'duration' => $contestData['duration']]);
}

function closeContest($idItem) {
	global $db;
	$stmt = $db->prepare('update users_items set sFinishDate = NOW() where idItem = :idItem and idUser = :idUser;');
	$stmt->execute(['idItem' => $_SESSION['contest']['idItem'], 'idUser' => $_SESSION['login']['ID']]);
	// TODO: remove partial access if other access were present
	$stmt = $db->prepare('update groups_items set sPartialAccessDate = null, sCachedPartialAccessDate = null, bCachedPartialAccess = 0 where idItem = :idItem and idGroup = :idGroupSelf and bManagerAccess = 0;');
	$stmt->execute(['idItem' => $_SESSION['contest']['idItem'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
	$stmt = $db->prepare('delete groups_items from groups_items join items_ancestors on groups_items.idItem = items_ancestors.idItemChild where items_ancestors.idItemAncestor = :idItem and groups_items.idGroup = :idGroupSelf and bCachedFullAccess = 0 and bOwnerAccess = 0 and bManagerAccess = 0;');
	$stmt->execute(['idItem' => $_SESSION['contest']['idItem'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
	unset($_SESSION['contest']);
	require_once __DIR__.'/../shared/listeners.php';
	Listeners::groupsItemsAfter($db);
}

function checkContestSubmissionRight($idItem) {
	global $db;
	// TODO: handle case where the item is both in a contest and in a non-contest chapter the user has access to
	$stmt = $db->prepare('select items.ID from items
		join items_ancestors on items_ancestors.idItemAncestor = items.ID 
		where (items_ancestors.idItemChild = :idItem or items.ID = :idItem) and items.sDuration is not null;');
	$stmt->execute(['idItem' => $idItem]);
	$contestItem = $stmt->fetchColumn();
	if (!$contestItem) {
		return ['submissionPossible' => true];
	}
	$contestData = adjustContestAndGetData();
	if (!$contestData) {
		return ['submissionPossible' => false, 'error' => 'vous ne pouvez pas soumettre de réponse à cet exercice car vous n\'avez pas commencé ou déjà terminé le concours'];
	}
	if ($contestData['idItem'] != $contestItem) {
		return ['submissionPossible' => false, 'error' => 'l\'exercice pour lequel vous souhaitez soumettre une réponse fait partie d\'un concours différent que celui en cours'];
	}
	return ['submissionPossible' => true];
}

