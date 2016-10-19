<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Ajout de temps sur des concours</title>
<link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">
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
		WHERE ((`groups_items`.`bCachedAccessSolutions` = 1 OR `groups_items`.`bCachedFullAccess` = 1) AND `selfGroupAncestors`.`idGroupChild` = :idGroupSelf) AND items.sDuration is not null GROUP BY `items`.`ID`;');
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

function addTimeToUser($idUser, $idGroupSelf, $idItem, $nbSeconds) {
	global $db;
	$stmt = $db->prepare('select ID, sContestStartDate, sFinishDate, NOW() as now from users_items
		where idUser = :idUser and idItem = :idItem;');
	$stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
	$userItem = $stmt->fetch();
	if ($userItem && $userItem['sFinishDate']) {
		// user has finished the contest, we must reopen it, under certain conditions:
		$userFinishDate = new DateTime($userItem['sFinishDate']);
		$now = new DateTime($userItem['now']);
		$secondsSinceEnd = $now->getTimestamp() - $userFinishDate->getTimestamp();
		if ($secondsSinceEnd > $nbSeconds) {
			return ['success' => false, 'error' => 'le temps supplémentaire ne permettra pas à l\'utilisateur de continuer le concours car il l\'a terminé depuis trop longtemps.'];
		}
		if ($secondsSinceEnd > 30*60) {
			return ['success' => false, 'error' => 'il est impossible de rajouter du temps à des utilisateurs qui ont terminé un concours depuis plus de 30mn'];
		}
	}
	// TODO: what if the user has a different user_item in its client?
	$stmt = $db->prepare('insert into users_items (idUser, idItem, sAdditionalTime) values (:idUser, :idItem, SEC_TO_TIME(:nbSeconds)) on duplicate key update sAdditionalTime = SEC_TO_TIME(:nbSeconds), sFinishDate = NULL;');
	$stmt->execute(['idItem' => $idItem, 'idUser' => $idUser, 'nbSeconds' => $nbSeconds]);
	if ($userItem && $userItem['sFinishDate']) {
		$res = openContest($idItem, $idUser, $idGroupSelf, true);
		if (!$res['success']) {
			return $res;
		}
	}
	return ['success' => true];
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
	$stmt = $db->prepare('select count(groups.ID) as ok, users.ID as idUser, users.idGroupSelf as idGroupSelf from groups 
		join groups_ancestors on groups_ancestors.idGroupChild = groups.ID
		join users on users.idGroupSelf = groups_ancestors.idGroupChild
		where groups_ancestors.idGroupAncestor = :idGroupOwned and users.sLogin = :login;');
	$stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'login' => $_GET['login']]);
	return $stmt->fetch();
}

function handleRequest($request) {
	global $contestList;
	if (!checkContestAccess($request['idItem'], $contestList)) {
		echo '<p>Erreur : vous n\'avez pas accès au concours ID '.$request['idItem'].'</p>';
		return;
	}
	$user = getUserFromLogin($request['login']);
	if (!$user || !$user['ok'] || $user['ok'] == '0') {
		echo 'Erreur: cet utilisateur n\'existe pas ou il n\'appartient pas à un de vos groupes.';
		return;
	}
	$nbSeconds = intval($_GET['nbMinutes'] * 60);
	$res = addTimeToUser($user['idUser'], $user['idGroupSelf'], $request['idItem'], $nbSeconds);
	if (!$res['success']) {
		echo 'Erreur: '.$res['error'];
	} else {
		echo "<p>L'utilisateur ".$request['login']." bénéficie désormais de ".$request['nbMinutes']." supplémentaires sur le concours ID ".$request['idItem']."</p>";
	}
}

if (isset($_GET['login']) && $_GET['login'] && isset($_GET['nbMinutes']) && $_GET['nbMinutes'] && isset($_GET['idItem']) && $_GET['idItem']) {
	handleRequest($_GET);
}

?>
<p>Sur cette page vous pouvez ajouter du temps de concours à un élève qui est dans un de vos groupes :</p>

<form method="get">
	<div class="form-group">
	  <label for="login">Login de l'utilisateur :</label>
	  <input type="text" class="form-control" id="login" name="login">
	</div>
	<div class="form-group">
	  <label for="nbMinutes">Nombre de minutes à rajouter :</label>
	  <input type="text" class="form-control" id="nbMinutes" name="nbMinutes">
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