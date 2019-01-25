<?php

require_once __DIR__.'/../shared/connect.php';

// Configuration : ID of the contest item
// The ID can also be passed as GET argument ?idItem=
$idRootItem = '';

$idRootItem = isset($_GET['idItem']) ? $_GET['idItem'] : $idRootItem;

$stmt = $db->prepare("
    SELECT items_strings.*
    FROM items_strings
    JOIN items_ancestors ON items_ancestors.idItemChild = items_strings.idItem
    WHERE items_ancestors.idItemAncestor = :idItem;");
$stmt->execute(['idItem' => $idRootItem]);

$itemNames = [];
while($res = $stmt->fetch()) {
    $itemNames[$res['idItem']] = $res['sTitle'];
}

$query = "
    SELECT users_items.*, ui_root.sContestStartDate as startDate
    FROM users_items
    JOIN users ON users.ID = users_items.idUser
    JOIN users_items AS ui_root ON users.ID = ui_root.idUser AND ui_root.idItem = :idItem
    JOIN items_ancestors ON items_ancestors.idItemChild = users_items.idItem
    WHERE items_ancestors.idItemAncestor = :idItem AND ui_root.sContestStartDate IS NOT NULL";
$params = ['idItem' => $idRootItem];
if($_GET['date']) {
    $query .= " AND ui_root.sContestStartDate >= :date AND ui_root.sContestStartDate < DATE_ADD(:date, INTERVAL 1 DAY)";
    $params['date'] = $_GET['date'];
}
$stmt = $db->prepare($query);
$stmt->execute($params);

$itemStats = [];
$userStats = [];
while($res = $stmt->fetch()) {
    $idItem = $res['idItem'];
    $idUser = $res['idUser'];
    if(!isset($itemStats[$idItem])) {
        $itemStats[$idItem] = [
            'count' => 0,
            'iScore' => 0,
            'nbSubmissionsAttempts' => 0,
            'bValidated' => 0,
            'byScore' => []
            ];
    }
    if(!isset($userStats[$idUser])) {
        $userStats[$idUser] = [
            'count' => 0,
            'iScore' => 0,
            'nbSubmissionsAttempts' => 0,
            'bValidated' => 0
            ];
    }
    $itemStats[$idItem]['count'] += 1;
    $itemStats[$idItem]['iScore'] += $res['iScore'];
    $itemStats[$idItem]['nbSubmissionsAttempts'] += $res['nbSubmissionsAttempts'];
    $itemStats[$idItem]['bValidated'] += $res['bValidated'];
    if(!isset($itemStats[$idItem]['byScore'][$res['iScore']])) {
        $itemStats[$idItem]['byScore'][$res['iScore']] = 0;
    }
    $itemStats[$idItem]['byScore'][$res['iScore']] += 1;

    $userStats[$idUser]['count'] += 1;
    $userStats[$idUser]['iScore'] += $res['iScore'];
    $userStats[$idUser]['nbSubmissionsAttempts'] += $res['nbSubmissionsAttempts'];
    $userStats[$idUser]['bValidated'] += $res['bValidated'];
    $userStats[$idUser]['sContestStartDate'] = $res['startDate'];
}

$nbItems = count($itemStats);
$rootStats = [
    'count' => 0,
    'iScore' => 0,
    'iScoreAvg' => 0,
    'nbSubmissionsAttempts' => 0,
    'nbSubmissionsAttemptsAvg' => 0,
    'bValidated' => 0,
    'byCount' => [],
    'byScore' => []
    ];
$dateStats = [];

foreach($userStats as $userStat) {
    $date = substr($userStat['sContestStartDate'], 0, 10);
    if(!isset($dateStats[$date])) {
        $dateStats[$date] = [
            'count' => 0,
            'iScore' => 0,
            'iScoreAvg' => 0,
            'nbSubmissionsAttempts' => 0,
            'nbSubmissionsAttemptsAvg' => 0,
            'bValidated' => 0,
            'byCount' => [],
            'byScore' => []
        ];
    }
    $rootStats['count'] += 1;
    $rootStats['itemCount'] += $userStat['count'];
    $rootStats['iScore'] += $userStat['iScore'];
    $rootStats['nbSubmissionsAttempts'] += $userStat['nbSubmissionsAttempts'];
    $rootStats['nbSubmissionsAttemptsAvg'] += $userStat['nbSubmissionsAttempts'] / $userStat['count'];
    $rootStats['bValidated'] += $userStat['bValidated'];
    $dateStats[$date]['count'] += 1;
    $dateStats[$date]['itemCount'] += $userStat['count'];
    $dateStats[$date]['iScore'] += $userStat['iScore'];
    $dateStats[$date]['nbSubmissionsAttempts'] += $userStat['nbSubmissionsAttempts'];
    $dateStats[$date]['nbSubmissionsAttemptsAvg'] += $userStat['nbSubmissionsAttempts'] / $userStat['count'];
    $dateStats[$date]['bValidated'] += $userStat['bValidated'];
}
ksort($dateStats);
?>
<h2>Overall stats<?=isset($_GET['date']) ? ' for date ' . $_GET['date'] : '' ?></h2>
<table border="1">
  <tr>
    <td><b>Date</b></td>
    <td><b>Number of contestants</b></td>
    <td><b>Items opened per user</b></td>
    <td><b>Overall score</b></td>
    <td><b>Submissions per user</b></td>
    <td><b>Submissions per item</b></td>
    <td><b>Validations (score 100)</b></td>
    <td><b>Validations per user</b></td>
  </tr>
<?php
foreach($dateStats as $date => $dateStat) {
?>
  <tr>
    <td><b><?=$date ?></b></td>
    <td><?=$dateStats[$date]['count'] ?></td>
    <td><?=round($dateStats[$date]['itemCount'] / $dateStats[$date]['count'], 2) ?></td>
    <td><?=round($dateStats[$date]['iScore'] / $dateStats[$date]['count'] / $nbItems, 2) ?> / 100</td>
    <td><?=round($dateStats[$date]['nbSubmissionsAttempts'] / $dateStats[$date]['count'], 2) ?></td>
    <td><?=round($dateStats[$date]['nbSubmissionsAttemptsAvg'] / $dateStats[$date]['count'], 2) ?></td>
    <td><?=$dateStats[$date]['bValidated'] ?></td>
    <td><?=round($dateStats[$date]['bValidated'] / $dateStats[$date]['count'], 2) ?></td>
  </tr>
<?php
}
if(!isset($_GET['date'])) {
?>
  <tr>
    <td><b>Total</b></td>
    <td><?=$rootStats['count'] ?></td>
    <td><?=round($rootStats['itemCount'] / $rootStats['count'], 2) ?></td>
    <td><?=round($rootStats['iScore'] / $rootStats['count'] / $nbItems, 2) ?> / 100</td>
    <td><?=round($rootStats['nbSubmissionsAttempts'] / $rootStats['count'], 2) ?></td>
    <td><?=round($rootStats['nbSubmissionsAttemptsAvg'] / $rootStats['count'], 2) ?></td>
    <td><?=$rootStats['bValidated'] ?></td>
    <td><?=round($rootStats['bValidated'] / $rootStats['count'], 2) ?></td>
  </tr>
<?php
}
?>
</table>
<h2>Item stats<?=isset($_GET['date']) ? ' for date ' . $_GET['date'] : '' ?></h2>
<p>
  <a href="stats.php">View all days</a> or view by date :
<?php
// Quick script :)
foreach($dateStats as $date => $stats) {
    echo "  <a href=\"stats.php?date=$date\">$date</a>";
}
?>
</p>
<table border="1">
  <tr>
    <td><b>Item name</b></td>
    <td><b>Number of contestants</b></td>
    <td><b>Score</b></td>
    <td><b>Submissions per user</b></td>
    <td><b>Users with score 0</b></td>
    <td><b>Users with score 50</b></td>
    <td><b>Users with score 75</b></td>
    <td><b>Users with score 100</b></td>
<?php
foreach($itemStats as $idItem => $itemStat) {
?>
  <tr>
    <td><b><?=$itemNames[$idItem] ?></b></td>
    <td><?=$itemStat['count'] ?></td>
    <td><?=round($itemStat['iScore'] / $itemStat['count'], 2) ?> / 100</td>
    <td><?=round($itemStat['nbSubmissionsAttempts'] / $itemStat['count'], 2) ?></td>
    <td><?=$itemStat['byScore'][0] ?></td>
    <td><?=$itemStat['byScore'][50] ?></td>
    <td><?=$itemStat['byScore'][75] ?></td>
    <td><?=$itemStat['byScore'][100] ?></td>
  </tr>
<?php
}
?>
</table>
