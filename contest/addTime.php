<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">
</head>
<body>
<?php

if (session_status() === PHP_SESSION_NONE){session_start();}

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
	echo "vous devez être connecté pour utiliser cette page";
	return;
}

if (isset($_GET['login']) && $_GET['login'] && isset($_GET['nbMinutes']) && $_GET['nbMinutes']) {
	require_once '../shared/connect.php';
	$stmt = $db->prepare('select count(groups.ID) as ok, users.ID as idUser from groups 
		join groups_ancestors on groups_ancestors.idGroupChild = groups.ID
		join users on users.idGroupSelf = groups_ancestors.idGroupChild
		where groups_ancestors.idGroupAncestor = :idGroupOwned and users.sLogin = :login;');
	$stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'login' => $_GET['login']]);
	$res = $stmt->fetch();
	if (!$res || !$res['ok'] || $res['ok'] == '0') {
		echo 'Erreur: cet utilisateur n\'existe pas ou il n\'appartient pas à un de vos groupes.';
	} else {
		$idUser = $res['idUser'];
		$nbSeconds = intval($_GET['nbMinutes'] * 60);
		$stmt = $db->prepare('select items.ID as idItem, items_strings.sTitle as title from items
			join items_strings on items.ID = items_strings.idItem
			join users_items on items.ID = users_items.idItem
			where users_items.idUser = :idUser and users_items.sContestStartDate is not null and users_items.sFinishDate is null
			order by users_items.sContestStartDate desc;');
		$stmt->execute(['idUser' => $idUser]);
		$contestData = $stmt->fetch();
		if (!$contestData) {
			echo 'Erreur: l\'utilisateur n\'a aucun concours en cours';
		} else {
			$stmt = $db->prepare('update users_items set sAdditionalTime = SEC_TO_TIME(:nbSeconds) where idUser = :idUser and idItem = :idItem;');
			$stmt->execute(['idItem' => $contestData['idItem'], 'idUser' => $idUser, 'nbSeconds' => $nbSeconds]);
			echo 'L\'utilisateur '.$_GET['login'].' peut poursuivre le concours '.$contestData['title'].' pendant '.$_GET['nbMinutes'].'mn supplémentaires.';
		}
	}
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
	<button type="submit" class="btn btn-default">Soumettre</button>
</form>
</body>
</html>