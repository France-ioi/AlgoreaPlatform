<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/../login/lib.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../shared/RemoveUsersClass.php';
require_once __DIR__.'/../shared/UserHelperClass.php';

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    http_response_code(400);
    die("Auth failed");
}

//error_reporting(E_ALL);
//ini_set('display_errors', 1);


function getUserPrefix() {
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
    return $stm->fetchColumn();
}


function getPrefixes($idGroup) {
    global $db;
    $query = '
        select
            *
        from
            `groups_login_prefixes`
        where
            idGroup = :idGroup
        order by
            prefix';
    $stm = $db->prepare($query);
    $stm->execute([
        'idGroup' => $idGroup
    ]);

    $res = [];
    while($row = $stm->fetch()) {
        $res[] = [
            'ID' => $row['ID'],
            'prefix' => $row['prefix'],
        ];
    }
    return $res;
}


function checkCreatePrefix($idGroup, $prefix) {
    global $db;

    $stmt = $db->prepare("SELECT idGroup FROM groups_login_prefixes WHERE prefix = :prefix;");
    $stmt->execute(['prefix' => $prefix]);
    $idPrefixGroup = $stmt->fetchColumn();
    if($idPrefixGroup && $idPrefixGroup != $idGroup) {
        return false;
    }

    $query = '
        INSERT IGNORE INTO `groups_login_prefixes`
            (idGroup, idUserCreator, prefix)
        VALUES
            (:idGroup, :idUser, :prefix)';
    $stm = $db->prepare($query);
    $stm->execute([
        'idGroup' => $idGroup,
        'idUser' => $_SESSION['login']['ID'],
        'prefix' => $prefix
    ]);
    return true;
}

function handleCreate($request) {
    global $config, $db;

    $prefix = isset($request['prefix']) ? trim($request['prefix']) : '';
    if($prefix == '' || preg_match("/^[a-z0-9-]+$/", $prefix) !== 1) {
        return ['success' => false, 'error' => 'Invalid prefix.'];
    }

    $user_prefix = getUserPrefix();
    if(!$user_prefix) {
        return ['success' => false, 'error' => 'This action is not available for your user.'];
    }
    $prefix = $user_prefix.'_'.$prefix.'_';

    $amount = isset($request['amount']) ? (int) $request['amount'] : 0;
    if(!$amount) {
        return ['success' => false, 'error' => 'Wrong amount of users'];
    }
    $postfix_length = isset($request['postfix_length']) ? (int) $request['postfix_length'] : 0;
    $password_length = isset($request['password_length']) ? (int) $request['password_length'] : 0;

/*    $groups = [];
    if(isset($request['groups'])) {
        $groups = explode(';', $request['groups']);
        $groups = array_filter($groups, function($id) {
            $id = (int) $id;
            return $id > 0;
        });
        $groups = array_values($groups);
    }
    if(!count($groups)) {
        throw new Exception('Wrong groups param');
    }*/
    $groups = [$request['group_id']];

    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();

    if(!checkCreatePrefix($request['group_id'], $prefix)) {
        return ['success' => false, 'error' => 'This prefix is already taken. Please choose another one.'];
    }

    $res = $manager->create([
        'prefix' => $prefix,
        'amount' => $amount * count($groups),
        'login_fixed' => true,
        'postfix_length' => $postfix_length,
        'password_length' => $password_length
    ]);
    if(!$res || !$res['success']) {
        return [
            'success' => false,
            'error' => $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
        ];
    }

    $i = 0;
    $user_helper = new UserHelperClass($db);
    foreach($groups as $group_id) {
        for($j=0; $j<$amount; $j++) {
            $external_user =& $res['data'][$i];
            $i++;
            $user = $user_helper->createUser($external_user);
            $user_helper->addUserToGroup($user['idGroupSelf'], $group_id);
            $external_user['algoreaGroupId'] = $group_id;
        }
    }
    $res = [
        'prefixes' => getPrefixes($request['group_id']),
        'accounts' => $res['data']
    ];

    return ['success' => true, 'data' => $res];
}

function handleDelete($request) {
    global $config, $db;

    if(!isset($request['prefix'])) {
        return ['success' => false, 'error' => 'Empty prefix'];
    }
    $prefix = $request['prefix'];

    // Check the prefix exists for this group
    $stmt = $db->prepare("SELECT ID FROM groups_login_prefixes WHERE idGroup = :idGroup AND prefix = :prefix;");
    $stmt->execute(['idGroup' => $request['group_id'], 'prefix' => $prefix]);
    if(!$stmt->fetchColumn()) {
        return ['success' => false, 'error' => 'Prefix not found for this group'];
    }

    // Delete users from the login module
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();

    $res = $manager->delete([
        'prefix' => $prefix
    ]);
    if(!$res || !$res['success']) {
        return [
            'success' => false,
            'error' => $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
        ];
    }

    // Delete users data
    $prefixLike = $db->quote(str_replace('_', '\_', $prefix).'%');
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'WHERE users.sLogin LIKE '.$prefixLike,
        'output' => false
    ]);
    $remover->execute();

    // Delete prefix in database
    $stmt = $db->prepare("DELETE FROM groups_login_prefixes WHERE idGroup = :idGroup AND prefix = :prefix;");
    $stmt->execute(['idGroup' => $request['group_id'], 'prefix' => $prefix]);

    return ['success' => true];
}

function handleGetPrefixes($request) {
    return ['success' => true, 'data' => getPrefixes($request['group_id'])];
}

function handleRequest($request) {
    global $db;

    $action = isset($request['action']) ? $request['action'] : null;

    // Check group rights
    if(!isset($request['group_id'])) {
        return ['success' => false, 'error' => 'No group_id'];
    }
    $stmt = $db->prepare('SELECT ID FROM groups_ancestors WHERE idGroupAncestor = :idGroupOwned AND idGroupChild = :idGroup;');
    $stmt->execute(['idGroupOwned' => $_SESSION['login']['idGroupOwned'], 'idGroup' => $request['group_id']]);
    if(!$stmt->fetchColumn()) {
        return ['success' => false, 'error' => 'No rights'];
    }

    switch($action) {
        case 'create':
            return handleCreate($request);

        case 'delete':
            return handleDelete($request);

        case 'get_prefixes':
            return handleGetPrefixes($request);

        default:
            return ['success' => false, 'error' => 'Incorrect action'];
    }
}

$request = json_decode(file_get_contents("php://input"), true);
echo json_encode(handleRequest($request));
