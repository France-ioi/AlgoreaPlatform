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
	return ['now' => $now->getTimestamp(), 'duration' => $totalDuration, 'idItem' => $res['idItem'], 'endTime' => $endTime->getTimestamp(), 'startTime' => $startTime->getTimestamp(), 'test' => ($endTime < $now), 'idUser' => $_SESSION['login']['ID']];
}

function getContestEndTime($sContestStartDate, $duration) {
	$date = new DateTime($sContestStartDate);
	$duration = new DateInterval('PT'.$duration.'S');
	$date->add($duration);
	return $date;
}

function openContest($idItem, $idUser, $idGroupSelf, $reopen = false) {
	global $db;
	$stmt = $db->prepare('select NOW() as now, items.*, users_items.*, TIME_TO_SEC(items.sDuration) as duration, max(groups_items.bCachedFullAccess) as fullAccess from items
		left join users_items on users_items.idItem = items.ID and users_items.idUser = :idUser
		JOIN groups_ancestors as my_groups_ancestors ON my_groups_ancestors.idGroupChild = :idGroupSelf
        JOIN groups_items ON groups_items.idGroup = my_groups_ancestors.idGroupAncestor AND groups_items.idItem = items.ID
        WHERE items.ID = :idItem AND (`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) group by items.ID;');
	$stmt->execute(['idItem' => $idItem, 'idUser' => $idUser, 'idGroupSelf' => $idGroupSelf]);
	$contestData = $stmt->fetch();
	if (!$contestData) {
		return ['success' => false, 'error' => "le concours n'existe pas ou vous n'y avez pas accès"];
	}
	if (!intval($contestData['duration'])) {
		return ['success' => false, 'error' => "l'item demandé n'est pas un concours"];
	}
	if ($contestData['sAccessOpenDate'] && !$contestData['fullAccess'] && $contestData['sAccessOpenDate'] > $contestData['now']) {
		return ['success' => false, 'error' => "le concours n'a pas encore commencé"];
	}
	if ($contestData['sEndContestDate'] && !$contestData['fullAccess'] && $contestData['sEndContestDate'] < $contestData['now']) {
		return ['success' => false, 'error' => "le concours est terminé"];
	}
	if (isset($contestData['sContestStartDate']) && $contestData['sContestStartDate'] && !$reopen) {
		return ['success' => false, 'error' => "vous avez déjà commencé ce concours"];
	}
	// TODO: what if the user has a different user_item in its client?
	$query = 'insert into users_items (idUser, idItem, sContestStartDate, sLastActivityDate, sStartDate) values (:idUser, :idItem, NOW(), NOW(), NOW()) on duplicate key update sContestStartDate = NOW(), sLastActivityDate = NOW(), sStartDate = NOW();';
	if ($reopen) {
		$query = 'insert into users_items (idUser, idItem, sFinishDate) values (:idUser, :idItem, NULL) on duplicate key update sFinishDate = NULL;';
	}
	$stmt = $db->prepare($query);
	$stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
	$stmt = $db->prepare('insert into groups_items (idGroup, idItem, sPartialAccessDate, sCachedPartialAccessDate, bCachedPartialAccess) values (:idGroupSelf, :idItem, NOW(), NOW(), 1) on duplicate key update sPartialAccessDate = NOW(), sCachedPartialAccessDate = NOW(), bCachedPartialAccess = 1;');
	$stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $idGroupSelf]);
	require_once __DIR__.'/../shared/listeners.php';
	Listeners::groupsItemsAfter($db);
	$endTime = getContestEndTime($contestData['now'], $contestData['duration']);
	$startTime = new DateTime($contestData['now']);
	return ['success' => true, 'endTime' => $endTime->getTimestamp(), 'startTime' => $startTime->getTimestamp(), 'duration' => $contestData['duration']];
}

function closeContest($idItem) {
	global $db;
	$stmt = $db->prepare('update users_items set sFinishDate = NOW() where idItem = :idItem and idUser = :idUser;');
	$stmt->execute(['idItem' => $idItem, 'idUser' => $_SESSION['login']['ID']]);
	// TODO: remove partial access if other access were present
	$stmt = $db->prepare('update groups_items set sPartialAccessDate = null, sCachedPartialAccessDate = null, bCachedPartialAccess = 0 where idItem = :idItem and idGroup = :idGroupSelf and bManagerAccess = 0;');
	$stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
    $db->exec("LOCK TABLES
        groups_items WRITE,
        history_groups_items WRITE,
        items_ancestors READ,
        history_items_ancestors READ;");
	$stmt = $db->prepare('delete groups_items from groups_items join items_ancestors on groups_items.idItem = items_ancestors.idItemChild where items_ancestors.idItemAncestor = :idItem and groups_items.idGroup = :idGroupSelf and bCachedFullAccess = 0 and bOwnerAccess = 0 and bManagerAccess = 0;');
	$stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
    $db->exec("UNLOCK TABLES;");
	require_once __DIR__.'/../shared/listeners.php';
	Listeners::groupsItemsAfter($db);
}

function checkContestSubmissionRight($idItem, $idUser=false) {
    global $db;
    $idGroupSelf = false;
    if(isset($_SESSION['login']['idGroupSelf'])) {
       $idGroupSelf = $_SESSION['login']['idGroupSelf'];
    } elseif($idUser) {
       $stmt = $db->prepare('SELECT idGroupSelf FROM users WHERE ID = :idUser;');
       $stmt->execute(['idUser' => $idUser]);
       $idGroupSelf = $stmt->fetchColumn();
    }
    if(!$idGroupSelf) {
        return ['submissionPossible' => false, 'error' => "Vous n'êtes pas connecté."];
    }

    // TODO: handle case where the item is both in a contest and in a non-contest chapter the user has access to
    $stmt = $db->prepare('select items.ID as idItem, max(groups_items.bCachedFullAccess) as fullAccess from items
            JOIN items_ancestors on items_ancestors.idItemAncestor = items.ID
            JOIN groups_ancestors as my_groups_ancestors ON my_groups_ancestors.idGroupChild = :idGroupSelf
    JOIN groups_items ON groups_items.idGroup = my_groups_ancestors.idGroupAncestor AND groups_items.idItem = items.ID
    WHERE (items_ancestors.idItemChild = :idItem or items.ID = :idItem) and items.sDuration is not null AND (`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) group by items.ID;');
    $stmt->execute(['idItem' => $idItem, 'idGroupSelf' => $idGroupSelf]);
    $contestItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$contestItems || !count($contestItems)) {
        return ['submissionPossible' => true];
    }
    $contestData = adjustContestAndGetData();
    if (!$contestData) {
        return ['submissionPossible' => false, 'error' => 'Vous ne pouvez pas soumettre de réponse à cet exercice car vous n\'avez pas commencé ou avez déjà terminé le concours.'];
    }
    foreach ($contestItems as $contestItem) {
    	if ($contestItem['fullAccess'] || $contestData['idItem'] == $contestItem['idItem']) {
    		return ['submissionPossible' => true];
    	}
    }
    return ['submissionPossible' => false, 'error' => 'L\'exercice pour lequel vous souhaitez soumettre une réponse fait partie d\'un concours différent que celui en cours.'];
}

