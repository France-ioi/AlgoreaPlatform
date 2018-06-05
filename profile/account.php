<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__.'/../config.php';
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__."/../shared/connect.php";
require_once __DIR__.'/../shared/RemoveUsersClass.php';

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}



// locks
function getLocks() {
    global $db;
    $q = '
        SELECT
            g.lockUserDeletionDate,
            g.sName
        FROM
            groups_groups as gg
        LEFT JOIN
            groups as g
        ON
            gg.idGroupParent = g.ID
        WHERE
            gg.idGroupChild = :idGroupSelf AND
            g.lockUserDeletionDate >= NOW()';
    $stmt = $db->prepare($q);
    $stmt->execute([
        'idGroupSelf' => $_SESSION['login']['idGroupSelf']
    ]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


// export
function exportTable($table, $id) {
    global $db;
    $q = 'SELECT * FROM '.$table.' WHERE idUser = :id';
    $stmt = $db->prepare($q);
    $stmt->execute(['id' => $id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}



function getData() {
    $id = $_SESSION['login']['ID'];
    return [
        //'user' => $user,
        'badges' => exportTable('badges', $id),
        'filters' => exportTable('filters', $id),
        'messages' => exportTable('messages', $id),
        'users_answers' => exportTable('users_answers', $id),
        'users_items' => exportTable('users_answers', $id),
        'users_threads' => exportTable('users_answers', $id),
        //'owned_groups' => getOwnedGroups(),
        //'joined_groups' => getJoinedGroups(),
    ];
}



// delete
function deleteAccount() {
    global $db, $config;
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'FROM users WHERE `ID` = '.$_SESSION['login']['ID'],
        'output' => false
    ]);
    $remover->execute();

    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();
    $manager->unlinkClient([
        'user_id' => $_SESSION['login']['idUser']
    ]);

    session_destroy();
}



try {
    if(!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
        throw new Exception('Only identified users can use this feature');
    }


    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;
    switch($action) {
        case 'get_delete_locks':
            $res = getLocks();
            break;
        case 'export':
            $res = getData();
            break;
        case 'delete':
            if($_SERVER['REQUEST_METHOD'] == 'POST' && count(getLocks()) == 0) {
                deleteAccount();
            }
            $res = [
                'redirect' => $config->login_module_client['base_url'].'/collected_data'
            ];
            break;
        default:
            throw new Exception('Action param missed');
            break;
    }

} catch(Exception $e) {
    $res = [
        'error' => $e->getMessage()
    ];
}

header('Content-Type: application/json');
echo json_encode($res);