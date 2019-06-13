<?php
    require __DIR__.'/../vendor/autoload.php';
    require __DIR__.'/../config.php';
    require_once __DIR__.'/../shared/connect.php';
    use Aiken\i18next\i18next;
    i18next::init($config->shared->domains['current']->defaultLanguage);
    function trans($key, $variables = []) {
        return i18next::getTranslation($key, $variables);
    }
?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title><?=trans('page_title')?></title>
<link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">
<style>
body {width: 800px;margin-left:auto;margin-right:auto;margin-top:50px;}
</style>
</head>
<body>
<?php

if (session_status() === PHP_SESSION_NONE){session_start();}

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    echo trans('auth_required');
    return;
}

//require_once '../shared/connect.php';

function getAccessibleContestList() {
    global $db;
    $stmt = $db->prepare('SELECT `items`.`ID` as idItem, `items_strings`.`sTitle`, `items_strings_parents`.sTitle as sTitleParent FROM `items`
        JOIN `groups_items` AS `groups_items` ON (`items`.`ID` = `groups_items`.`idItem`)
        JOIN `groups_ancestors` AS `selfGroupAncestors` ON (`groups_items`.`idGroup` = `selfGroupAncestors`.`idGroupAncestor`)
        JOIN `items_strings` AS `items_strings` ON (`items`.`ID` = `items_strings`.`idItem`)
        LEFT JOIN `items_items` AS `items_items` ON `items_items`.idItemChild = items.ID
        LEFT JOIN `items_strings` AS `items_strings_parents` ON (`items_items`.`idItemParent` = `items_strings_parents`.`idItem`)
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
    echo trans('empty_list', ['login' => $_SESSION['login']['sLogin']]);
    return;
}

require_once __DIR__.'/common.php';

function syncDebug($type, $b_or_e, $subtype='') {}

function processUser($idUser, $idGroupSelf, $idItem, $nbSeconds, $type) {
    global $db;

    $totalAdditionalTime = $nbSeconds;

    // Get user_item
    $stmt = $db->prepare("
        SELECT users_items.ID, users_items.sContestStartDate, users_items.sFinishDate, NOW() as now, TIME_TO_SEC(items.sDuration) AS baseSecs, TIME_TO_SEC(sAdditionalTime) as additionalSecs
        FROM users_items
        JOIN items ON items.ID = users_items.idItem
        WHERE users_items.idUser = :idUser and users_items.idItem = :idItem;
        ");
    $stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
    $userItem = $stmt->fetch();

    if($type == 'reset' && (!$userItem || !$userItem['sContestStartDate'])) {
        return ['success' => true];
    }

    if($userItem) {
        if($type == 'add') {
            $totalAdditionalTime = $nbSeconds+$userItem['additionalSecs'];
        }

        if($userItem['sFinishDate'] && $type != 'reset') {
            // User has finished the contest, we will reopen it but must check the time remaining first
            $userStartDate = new DateTime($userItem['sContestStartDate']);
            $now = new DateTime($userItem['now']);
            $participationSeconds = $now->getTimestamp() - $userStartDate->getTimestamp();
            if ($participationSeconds > $totalAdditionalTime + $userItem['baseSecs']) {
                // The time given wouldn't allow to continue the contest
                return ['success' => false, 'error' => trans('time_interval_error')];
            }
        } elseif(!$userItem['sFinishDate'] && $type == 'reset') {
            // We need to force-close the contest
            closeContest($idItem, $idUser);
        }
    }

    if($type == 'reset') {
        $stmt = $db->prepare('UPDATE users_items SET sContestStartDate = NULL, sFinishDate = NULL WHERE idUser = :idUser AND idItem = :idItem;');
        $stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
        return ['success' => true];
    } else {
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

$handleOutput = '';

function handleRequest($request) {
    global $contestList, $handleOutput;
    if (!checkContestAccess($request['idItem'], $contestList)) {
        echo trans('contest_access_error', ['id' => $request['idItem']]);
        return;
    }
    $userData = getUsersListFromRequest($request['login']);
    if (!$userData['success']) {
        echo $userData['error'];
        return;
    }
    $userList = $userData['usersList'];
    $nbSeconds = intval($_GET['nbMinutes'] * 60);
    foreach($userList as $user) {
        $res = processUser($user['idUser'], $user['idGroupSelf'], $request['idItem'], $nbSeconds, isset($request['type']) ? $request['type'] : 'replace');
        if (!$res['success']) {
            $handleOutput .= trans('error', ['error' => $res['error']]);
        } elseif(isset($res['totalAdditionalTime'])) {
            $nbMinutes = intval($res['totalAdditionalTime']) / 60;
            $handleOutput .= trans('success_message', [
                'login' => $user['sLogin'],
                'duration' => $nbMinutes,
                'id' => $request['idItem']
            ]);
        } else {
            $handleOutput .= trans('success_message_reset', [
                'login' => $user['sLogin'],
                'id' => $request['idItem']
            ]);
        }
        $handleOutput .= '<br>';
    }
}

if (isset($_GET['login']) && $_GET['login'] && isset($_GET['nbMinutes']) && isset($_GET['idItem']) && $_GET['idItem']) {
    handleRequest($_GET);
}

?>
<h1><?=trans('header')?></h1>
<p><?=trans('description')?></p>

<?php
if($handleOutput) {
?>
<div class="alert alert-info">
    <?=$handleOutput ?>
</div>
<?php
}
?>

<div>
  <form method="get">
    <div class="form-group">
      <label for="login"><?=trans('login_lbl')?></label>
      <input type="text" class="form-control" id="login" name="login" value="<?=isset($_GET['login']) ? $_GET['login'] : '' ?>">
    </div>
    <div class="well">
      <div class="form-group">
        <label for="nbMinutes"><?=trans('duration_lbl')?></label>
        <input type="text" class="form-control" id="nbMinutes" name="nbMinutes">
      </div>
      <div class="form-group">
        <?=trans('mode_lbl')?>
        <div class="radio">
          <label><input type="radio" name="type" value="replace" checked><?=trans('replace_lbl')?></label>
        </div>
        <div class="radio">
          <label><input type="radio" name="type" value="add"><?=trans('add_lbl')?></label>
        </div>
        <br>
        <i>Note : si l'utilisateur a terminé le concours récemment et que le temps supplémentaire lui aurait permis de continuer tout de suite, le concours sera réouvert automatiquement avec ce temps supplémentaire.</i>
      </div>
    </div>
    <div class="text-center" style="font-weight: bold; font-size: 24px;">
        &mdash; OU &mdash;
    </div>
    <div class="well">
      <div class="form-group">
        Réinitialiser la participation (permet de recommencer le concours comme si aucune participation n'avait été effectuée ; les scores sont conservés et l'utilisateur peut commencer à tout instant) :
        <div class="radio">
          <label><input type="radio" name="type" value="reset">Réinitialiser la participation</label>
        </div>
      </div>
    </div>
    <div class="form-group">
        <label for="idItem"><?=trans('item_lbl')?></label>
        <select class="form-control" id="idItem" name="idItem">
<?php
    $contestStrs = array();
    foreach($contestList as $contest) {
        $contestStrs[$contest['idItem']] = ($contest['sTitleParent'] ? $contest['sTitleParent'] . ' // ' : '') . $contest['sTitle'];
    }
    asort($contestStrs);
    $first = true;
    foreach($contestStrs as $idItem => $name) {
        echo '<option value="'.$idItem.'"'.($first ? ' selected' : '').'>' . $name . '</option>';
        $first = false;
    }
?>
        </select>
    </div>
    <button type="submit" class="btn btn-default"><?=trans('submit')?></button>
  </form>
</div>
<hr>
</body>
</html>
