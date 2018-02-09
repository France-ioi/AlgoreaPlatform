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


function deleteUsersByPrefix($prefix) {
    global $db;
    $prefix = str_replace('_', '\_', $prefix).'%';
    $prefix = $db->quote($prefix);
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'FROM users WHERE sLogin LIKE '.$prefix,
        'output' => false
    ]);
    $remover->execute();
}


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


function prefixExists($prefix) {
    global $db;
    $query = '
        select
            count(*)
        from
            `groups_login_prefixes`
        where
            prefix = :prefix';
    $stm = $db->prepare($query);
    $stm->execute([
        'prefix' => $prefix
    ]);
    return (bool) $stm->fetchColumn();
}


function getNewPrefix($prefix) {
    $user_prefix = getUserPrefix();
    if(!$user_prefix) {
        throw new Exception('Action not available, empty user.loginModulePrefix');
    }
    $full_prefix = $user_prefix.'_'.$prefix.'_';
    if(prefixExists($full_prefix)) {
        throw new Exception('Prefix already used');
    }
    return $full_prefix;
}


try {
    $request = json_decode(file_get_contents("php://input"), true);
    $action = isset($request['action']) ? $request['action'] : null;

    $prefix = isset($request['prefix']) ? trim($request['prefix']) : '';
    if($prefix == '') {
        throw new Exception('Empty prefix');
    }
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();

    switch($action) {
        case 'create':
            if(preg_match("/^[a-z0-9-]+$/", $prefix) !== 1) {
                throw new Exception('Prefix contain wrong character(s)');
            }
            $prefix = getNewPrefix($prefix);
            $amount = isset($request['amount']) ? (int) $request['amount'] : 0;
            $postfix_length = isset($request['postfix_length']) ? (int) $request['postfix_length'] : 0;
            $password_length = isset($request['password_length']) ? (int) $request['password_length'] : 0;
            $group_id = isset($request['group_id']) ? (int) $request['group_id'] : 0;
            if(!$group_id) {
                throw new Exception('Wrong grop id');
            }
            $res = $manager->create([
                'prefix' => $prefix,
                'amount' => $amount,
                'login_fixed' => true,
                'postfix_length' => $postfix_length,
                'password_length' => $password_length
            ]);
            if($res && $res['success']) {
                foreach($res['data'] as $external_user) {
                    $user_helper = new UserHelperClass($db);
                    $user = $user_helper->createUser($external_user);
                    $user_helper->addUserToGroup($user['idGroupSelf'], $group_id);
                }
                $res = [
                    'prefix' => $prefix,
                    'accounts' => $res['data']
                ];
            } else {
                throw new Exception(
                    $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
                );
            }
            break;
        case 'delete':
            $res = $manager->delete([
                'prefix' => $prefix
            ]);
            if(!$res || !$res['success']) {
                throw new Exception(
                    $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
                );
            }
            $res = null;
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
    //http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}