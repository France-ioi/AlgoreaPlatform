<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/../login/lib.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../shared/RemoveUsersClass.php';

function syncDebug($type, $b_or_e, $subtype='') {}

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    http_response_code(400);
    die("Auth failed");
}


function createUser($user) {
    global $db;
    list($idGroupOwned, $idGroupSelf) = createGroupsFromLogin($db, $user['login']);
    $id = getRandomID();
    $query = '
        insert into `users` (
            `ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`
        ) values (
            :ID, :idUser, :sLogin, \'0\', NOW(), :idGroupSelf, :idGroupOwned
        )';
    $stmt = $db->prepare($query);
    $stmt->execute([
        'ID' => $id,
        'idUser' => $user['id'],
        'sLogin' => $user['login'],
        'idGroupSelf' => $idGroupSelf,
        'idGroupOwned' => $idGroupOwned,
    ]);
    return $idGroupSelf;
}


function addUserToGroup($algorea_user_id, $group_id) {
    global $db;
    $query = '
        insert ignore into `groups_groups` (
            idGroupParent, idGroupChild, sType, sRole, sStatusDate
        ) values (
            :idGroupParent, :idGroupChild, \'direct\', \'member\', NOW()
        )';
    $stmt = $db->prepare($query);
    $stmt->execute([
        'idGroupParent' => $group_id,
        'idGroupChild' => $algorea_user_id
    ]);
    Listeners::groupsGroupsAfter($db);
}


function deleteUsersByPrefix($prefix) {
    global $db;
    $prefix = str_replace('_', '\_', $prefix).'\_%';
    $prefix = $db->quote($prefix);
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'FROM users WHERE sLogin LIKE '.$prefix,
        'output' => false
    ]);
    $remover->execute();
}


function getLoginModulePrefix($prefix) {
    global $db;
    $query = '
        select
            loginModulePrefix
        from
            `users`
        where ID=:ID';
    $stm = $db->prepare($query);
    $stm->execute([
        'ID' => $_SESSION['login']['ID']
    ]);
    $res = $stm->fetch();
    if(!$res['loginModulePrefix']) {
        throw new Exception('Action not available, empty user.loginModulePrefix');
    }
    return $res['loginModulePrefix'].'_'.$prefix;
}


try {
    $request = json_decode(file_get_contents("php://input"), true);
    $action = isset($request['action']) ? $request['action'] : null;

    $prefix = isset($request['prefix']) ? trim($request['prefix']) : '';
    if($prefix == '') {
        throw new Exception('Empty prefix');
    }
    $prefix = getLoginModulePrefix($prefix);
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();

    switch($action) {
        case 'create':
            $amount = isset($request['amount']) ? (int) $request['amount'] : 0;
            if(!$amount || $amount > 50) {
                throw new Exception('Number of users in group must be 1..50');
            }
            $group_id = isset($request['group_id']) ? (int) $request['group_id'] : 0;
            if(!$group_id) {
                throw new Exception('Wrong grop id');
            }
            $res = $manager->create($prefix, $amount);
            foreach($res as $user) {
                $algorea_user_id = createUser($user);
                addUserToGroup($algorea_user_id, $group_id);
            }
            break;
        case 'delete':
            $res = $manager->delete($prefix);
            deleteUsersByPrefix($prefix);
            break;
        default:
            throw new Exception('Incorrect action');
    }
    echo json_encode([
        'success' => true,
        'data' => $res
    ]);
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}