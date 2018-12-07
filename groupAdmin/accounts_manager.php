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


function deleteUsersByPrefix($prefix) {
    global $db;
    $prefix = str_replace('_', '\_', $prefix).'%';
    $prefix = $db->quote($prefix);
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'WHERE users.sLogin LIKE '.$prefix,
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


function createPrefix($idGroup, $prefix) {
    global $db;
    $query = '
        insert into `groups_login_prefixes`
            (idGroup, prefix)
        values
            (:idGroup, :prefix)';
    $stm = $db->prepare($query);
    $stm->execute([
        'idGroup' => $idGroup,
        'prefix' => $prefix
    ]);
}

function deletePrefix($prefix) {
    global $db;
    $query = '
        delete from
            `groups_login_prefixes`
        where
            prefix = :prefix
        limit 1';
    $stm = $db->prepare($query);
    $stm->execute([
        'prefix' => $prefix
    ]);
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

    switch($action) {

        // delete accounts
        case 'create':
            $prefix = isset($request['prefix']) ? trim($request['prefix']) : '';
            if($prefix == '') {
                throw new Exception('Empty prefix');
            }
            $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
            $manager = $client->getAccountsManager();

            if(preg_match("/^[a-z0-9-]+$/", $prefix) !== 1) {
                throw new Exception('Prefix contain wrong character(s)');
            }
            $prefix = getNewPrefix($prefix);
            $amount = isset($request['amount']) ? (int) $request['amount'] : 0;
            if(!$amount || $amount > 50) {
                throw new Exception('Wrong amount of users');
            }
            $postfix_length = isset($request['postfix_length']) ? (int) $request['postfix_length'] : 0;
            $password_length = isset($request['password_length']) ? (int) $request['password_length'] : 0;

            $groups = [];
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
            }

            createPrefix($groups[0], $prefix);

//$timers[] = round(microtime(true) * 1000);
            $res = $manager->create([
                'prefix' => $prefix,
                'amount' => $amount * count($groups),
                'login_fixed' => true,
                'postfix_length' => $postfix_length,
                'password_length' => $password_length
            ]);
//$timers[] = round(microtime(true) * 1000);
            if($res && $res['success']) {
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
                    'prefixes' => getPrefixes($groups[0]),
                    'accounts' => $res['data'],
//                    'timers' => $timers
                ];
            } else {
                throw new Exception(
                    $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
                );
            }
            break;


        // delete accounts
        case 'delete':
            $prefix = isset($request['prefix']) ? trim($request['prefix']) : '';
            if($prefix == '') {
                throw new Exception('Empty prefix');
            }
            $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
            $manager = $client->getAccountsManager();

            $res = $manager->delete([
                'prefix' => $prefix
            ]);
            if(!$res || !$res['success']) {
                throw new Exception(
                    $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
                );
            }
            deleteUsersByPrefix($prefix);
            deletePrefix($prefix);
            $res = null;
            break;

        // get group account prefixes
        case 'get_prefixes':
            if(!isset($request['group_id'])) {
                throw new Exception('Wrong group_id param');
            }
            $res = getPrefixes($request['group_id']);
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
