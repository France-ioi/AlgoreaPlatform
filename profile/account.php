<?php
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
            groups_ancestors as ga
        JOIN
            groups as g
        ON
            ga.idGroupAncestor = g.ID
        WHERE
            ga.idGroupChild = :idGroupSelf AND
            g.lockUserDeletionDate >= NOW()';
    $stmt = $db->prepare($q);
    $stmt->execute([
        'idGroupSelf' => $_SESSION['login']['idGroupSelf']
    ]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
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