<?php
require_once __DIR__.'/../config.php';
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__."/../shared/connect.php";

header('Content-disposition: attachment; filename=user-data-algorea.json');
header('Content-type: application/json');

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if(!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    die('null');
}


function exportUser() {
    global $db;
    echo '"user":';
    $q = 'SELECT * FROM users WHERE ID = :id';
    $stmt = $db->prepare($q);
    $stmt->execute(['id' => $_SESSION['login']['ID']]);
    $data = $stmt->fetchObject();
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}


function exportTable($table) {
    global $db;
    echo '"'.$table.'":';
    $q = 'SELECT * FROM '.$table.' WHERE idUser = :id';
    $stmt = $db->prepare($q);
    $stmt->execute(['id' => $_SESSION['login']['ID']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}


function exportGroups() {
    global $db;
    echo '"groups":{';

    echo '"owned_groups":';
    $q = '
        SELECT g.*
        FROM groups_ancestors as ga
        JOIN `groups` as g
        ON ga.idGroupChild = g.ID
        WHERE ga.idGroupAncestor = :idGroupOwned
    ';
    $stmt = $db->prepare($q);
    $stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    echo ',';

    echo '"joined_groups":';
    $q = '
        SELECT g.sName
        FROM groups_ancestors as ga
        JOIN `groups` as g
        ON ga.idGroupAncestor = g.ID
        WHERE ga.idGroupChild = :idGroupSelf
    ';
    $stmt = $db->prepare($q);
    $stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    echo '}';
}


$id = $_SESSION['login']['ID'];

echo '{';
exportUser($id);
echo ',';
exportGroups();
echo ',';
exportTable('badges', $id);
echo ',';
exportTable('filters', $id);
echo ',';
exportTable('messages', $id);
echo ',';
exportTable('users_answers', $id);
echo ',';
exportTable('users_answers', $id);
echo ',';
exportTable('users_answers', $id, false);
echo '}';
