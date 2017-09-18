<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Ajout de temps sur un concours</title>
<link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">
<style>
body {width: 800px;margin-left:auto;margin-right:auto;margin-top:50px;}
</style>
</head>
<body>
<?php

if (session_status() === PHP_SESSION_NONE){session_start();}

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
	echo "vous devez être connecté pour utiliser cette page";
	return;
}

require_once '../shared/connect.php';

function getAccessibleContestList() {
	global $db;
	$stmt = $db->prepare('SELECT `items`.`ID` as idItem, `items_strings`.`sTitle` FROM `items`
		JOIN `groups_items` AS `groups_items` ON (`items`.`ID` = `groups_items`.`idItem`)
		JOIN `groups_ancestors` AS `selfGroupAncestors` ON (`groups_items`.`idGroup` = `selfGroupAncestors`.`idGroupAncestor`)
		JOIN `items_strings` AS `items_strings` ON (`items`.`ID` = `items_strings`.`idItem`)
		WHERE
			(
				(`groups_items`.`bCachedAccessSolutions` = 1 OR `groups_items`.`bCachedFullAccess` = 1) AND
				`selfGroupAncestors`.`idGroupChild` = :idGroupSelf
			) AND
			items.sDuration is not null GROUP BY `items`.`ID`
	');
	$stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
	return $stmt->fetchAll();
}

$contestList = getAccessibleContestList();

if (!$contestList || !count($contestList)) {
	echo '<p>Vous n\'avez un accès complet à aucun concours, si vous devez bien être connecté en tant que '.$_SESSION['login']['sLogin'].' pour utiliser cette interface, merci de rapporter le problème.</p>';
	return;
}

require_once __DIR__.'/common.php';

function syncDebug($type, $b_or_e, $subtype='') {}

function addTimeToUser($idUser, $idGroupSelf, $idItem, $nbSeconds, $add) {
	global $db;
	$stmt = $db->prepare('select ID, sContestStartDate, sFinishDate, NOW() as now, TIME_TO_SEC(sAdditionalTime) as additionalSecs from users_items
		where idUser = :idUser and idItem = :idItem;');
	$stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
	$userItem = $stmt->fetch();
	$totalAdditionalTime = $nbSeconds;
	if ($add && $userItem) {
		$totalAdditionalTime = $nbSeconds+$userItem['additionalSecs'];
	}
	if ($userItem && $userItem['sFinishDate']) {
		// user has finished the contest, we must reopen it, under certain conditions:
		$userFinishDate = new DateTime($userItem['sFinishDate']);
		$now = new DateTime($userItem['now']);
		$secondsSinceEnd = $now->getTimestamp() - $userFinishDate->getTimestamp();
		if ($secondsSinceEnd > $nbSeconds) {
			return ['success' => false, 'error' => 'le temps supplémentaire ne permettra pas à l\'utilisateur de continuer le concours car il l\'a terminé depuis trop longtemps.'];
		}
	}
	// TODO: what if the user has a different user_item in its client?
	$stmt = $db->prepare('insert into users_items (idUser, idItem, sAdditionalTime) values (:idUser, :idItem, SEC_TO_TIME(:totalAdditionalTime)) on duplicate key update sAdditionalTime = SEC_TO_TIME(:totalAdditionalTime), sFinishDate = NULL;');
	$stmt->execute(['idItem' => $idItem, 'idUser' => $idUser, 'totalAdditionalTime' => $totalAdditionalTime]);
	if ($userItem && $userItem['sFinishDate']) {
		$res = openContest($idItem, $idUser, $idGroupSelf, true);
		if (!$res['success']) {
			return $res;
		}
	}
	return ['success' => true, 'totalAdditionalTime' => $totalAdditionalTime];
}

function checkContestAccess($idItem, $contestList) {
	global $contestList;
	foreach($contestList as $contest) {
		if ($contest['idItem'] == $idItem) {
			return true;
		}
	}
	return false;
}

function getUserFromLogin($login) {
	global $db;
	$stmt = $db->prepare('select users.ID as idUser, users.idGroupSelf as idGroupSelf, users.sLogin from groups
		join groups_ancestors on groups_ancestors.idGroupChild = groups.ID
		join users on users.idGroupSelf = groups_ancestors.idGroupChild
		where groups_ancestors.idGroupAncestor = :idGroupOwned and users.sLogin = :login;');
	$stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'login' => $login]);
	return $stmt->fetch();
}

function getUserListFromGroupName($groupName) {
	global $db;
	$stmt = $db->prepare('select groups.ID from groups
		join groups_ancestors on groups_ancestors.idGroupChild = groups.ID
		where groups_ancestors.idGroupAncestor = :idGroupOwned and groups.sName = :groupName;');
	$stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'groupName' => $groupName]);
	$idGroup = $stmt->fetchColumn();
	if (!$idGroup) {
		return ['success' => false, 'error' => 'impossible de trouver l\'utilisateur ou le groupe '.$groupName];
	}
	$stmt = $db->prepare('select users.ID as idUser, users.idGroupSelf, users.sLogin from users
		join groups_ancestors on groups_ancestors.idGroupChild = users.idGroupSelf
		where groups_ancestors.idGroupAncestor = :idGroup;');
	$stmt->execute(['idGroup' => $idGroup]);
	$users = $stmt->fetchAll();
	if (!$users || !count($users)) {
	return ['success' => false, 'error' => 'le groupe '.$groupName.' ne contient aucun utilisateur'];
	}
	return ['success' => true, 'usersList' => $users];
}

function getUsersListFromRequest($loginOrGroupName) {
	$loginOrGroupName = trim($loginOrGroupName);
	$user = getUserFromLogin($loginOrGroupName);
	if (!$user) {
		return getUserListFromGroupName($loginOrGroupName);
	} else {
		return ['success' => true, 'usersList' => [$user]];
	}
}

function handleRequest($request) {
	global $contestList;
	if (!checkContestAccess($request['idItem'], $contestList)) {
		echo '<p>Erreur : vous n\'avez pas accès au concours ID '.$request['idItem'].'</p>';
		return;
	}
	$add = (isset($request['type']) && $request['type'] == 'add');
	$userData = getUsersListFromRequest($request['login']);
	if (!$userData['success']) {
		echo $userData['error'];
		return;
	}
	$userList = $userData['usersList'];
	$nbSeconds = intval($_GET['nbMinutes'] * 60);
	foreach($userList as $user) {
		$res = addTimeToUser($user['idUser'], $user['idGroupSelf'], $request['idItem'], $nbSeconds, $add);
		if (!$res['success']) {
			echo 'Erreur: '.$res['error'];
		} else {
			$nbMinutes = intval($res['totalAdditionalTime']) / 60;
			echo "<p>L'utilisateur ".$user['sLogin']." bénéficie désormais de ".$nbMinutes."mn supplémentaires sur le concours ID ".$request['idItem']."</p>";
		}
	}
}

if (isset($_GET['login']) && $_GET['login'] && isset($_GET['nbMinutes']) && isset($_GET['idItem']) && $_GET['idItem']) {
	handleRequest($_GET);
}

?>
<h1>Ajout de temps sur un concours</h1>

<p>Sur cette page vous pouvez ajouter du temps de concours (auquel vous avez un accès complet ou un accès aux solutions) à un élève qui est dans un des groupes que vous administrez :</p>

<form method="get">
	<div class="form-group">
	  <label for="login">Login de l'utilisateur ou nom exact du groupe :</label>
	  <input type="text" class="form-control" id="login" name="login">
	</div>
	<div class="form-group">
	  <label for="nbMinutes">Nombre de minutes de temps supplémentaire (peut être négatif) :</label>
	  <input type="text" class="form-control" id="nbMinutes" name="nbMinutes">
	</div>
	<div class="form-group">
	  Assigner ce temps supplémentaire ou l'ajouter au temps supplémentaire déjà présent ?
	  <div class="radio">
	    <label><input type="radio" name="type" value="replace" checked>Assigner</label>
	  </div>
	  <div class="radio">
	    <label><input type="radio" name="type" value="add">ajouter</label>
	  </div>
	</div>
	<div class="form-group">
		<label for="idItem">Nom du concours sur lequel le temps sera rajouté :</label>
		<select class="form-control" id="idItem" name="idItem">
			<?php
			    $first = true;
				foreach($contestList as $contest) {
					echo '<option value="'.$contest['idItem'].'"'.($first ? ' selected' : '').'>'.$contest['sTitle'].'</option>';
					$first = false;
				}
			?>
		</select>
	</div>
	<button type="submit" class="btn btn-default">Soumettre</button>
</form>
</body>
</html>