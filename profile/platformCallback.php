<?php
require_once __DIR__.'/../config.php';
require_once __DIR__."/../shared/connect.php";

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if(!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    header('Location: '.$config->shared->domains['current']->baseUrl);
    die();
}

isset($_REQUEST['idPlatform']) or die('idPlatform param missed');

$q = '
    SELECT
        ID
    FROM
        platforms
    WHERE
        ID = :ID';
$stmt = $db->prepare($q);
$stmt->execute([
    'ID' => $_REQUEST['idPlatform']
]);
if($stmt->fetchColumn() === false) {
    die('Platform not found');
}


$q = '
    UPDATE
        users_items as ui
    JOIN
        items as i
    ON
        i.ID = ui.idItem
    SET
        ui.bPlatformDataRemoved = 1
    WHERE
        ui.idUser = :idUser AND
        i.idPlatform = :idPlatform';
$stmt = $db->prepare($q);
$stmt->execute([
    'idUser' => $_SESSION['login']['ID'],
    'idPlatform' => $_REQUEST['idPlatform']
]);

$url = rtrim($config->shared->domains['current']->baseUrl, '/').'/profile/myAccount#collected_data_controls';
header('Location: '.$url);