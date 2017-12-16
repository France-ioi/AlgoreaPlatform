<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/../login/lib.php';
require_once __DIR__.'/../shared/listeners.php';

function syncDebug($type, $b_or_e, $subtype='') {}

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    http_response_code(400);
    die("Auth failed");
}


function escapePrefix($prefix) {
    return str_replace('_', '\_', $prefix).'\_%';
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


function deleteUserEntries($row) {
    global $db;
    //TODO: what more?
    $p = [
        'ID' => $row['ID'],
        'idGroupSelf' => $row['idGroupSelf'],
        'idGroupOwned' => $row['idGroupOwned']
    ];
    $query = '
        delete from `groups_groups`
        where idGroupChild IN (:idGroupSelf, :idGroupOwned, :ID)';
    $stmt = $db->prepare($query);
    $stmt->execute($p);

    $p = [
        'idGroupSelf' => $row['idGroupSelf'],
        'idGroupOwned' => $row['idGroupOwned']
    ];
    $query = '
        delete from `groups`
        where ID IN (:idGroupSelf, :idGroupOwned)';
    $stmt = $db->prepare($query);
    $stmt->execute($p);

    Listeners::groupsGroupsAfter($db);
}


function deleteUsersByPrefix($prefix) {
    global $db;
    $query = '
        select
            ID, idGroupSelf, idGroupOwned
        from
            `users`
        where
            sLogin like :prefix';
    $stm = $db->prepare($query);
    $stm->execute([
        'prefix' => escapePrefix($prefix)
    ]);
    $rows = $stm->fetchAll();
    if(count($rows)) {
        $ids = [];
        foreach($rows as $row) {
            deleteUserEntries($row);
            $ids[] = $row['ID'];
        }
        $query = '
            delete from
                `users`
            where
                ID in ('.implode(',', $ids).')';
        $stmt = $db->prepare($query);
        $stmt->execute([]);
    }
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
    return $res['loginModulePrefix'] ? $res['loginModulePrefix'].'_'.$prefix : $prefix;
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