<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/../shared/UserHelperClass.php';

const LOGIN_PREFIX = 'user-';

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if(!isset($_SESSION) || !isset($_SESSION['login'])) {
    http_response_code(400);
    die("Auth failed");
}




function findGroup($code) {
    global $db;
    $query = 'select * from `groups` where `sPassword` = :code limit 1';
    $stmt = $db->prepare($query);
    $stmt->execute([ 'code' => $code ]);
    $group = $stmt->fetchObject();
    return $group ? (array) $group : null;
}


function enterGroup($group) {
    global $db, $config;
    $user_helper = new UserHelperClass($db);

    if($_SESSION['login']['tempUser']) {
        $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
        $manager = $client->getAccountsManager();
        $res = $manager->create([
            'prefix'=> LOGIN_PREFIX,
            'password_length' => 8,
            'postfix_length' => 8,
            'amount' => 1,
            'auto_login' => true,
            'participation_code' => true
        ]);
        if(!$res || !$res['success']) {
            throw new Exception('Server error');
        }
        $external_users = $res['data'];

        $_SESSION['groupCodeEnter'] = [
            'login_module_params' => [
                'login' => $external_users[0]['login'],
                'auto_login_token' => $external_users[0]['auto_login_token']
            ],
            'idGroup' => $group['ID'],
            'idUser' => $external_users[0]['id']
        ];
        return [
            'status' => 'account_created',
            'participation_code' => $external_users[0]['participation_code'],
            'redirect' => $group['sRedirectPath']
        ];
    }
    $user_helper->addUserToGroup(
        $_SESSION['login']['idGroupSelf'],
        $group['ID']
    );
    return [
        'status' => 'entered',
        'redirect' => $group['sRedirectPath']
    ];
}


try {
    $request = json_decode(file_get_contents("php://input"), true);
    $action = isset($request['action']) ? $request['action'] : null;
    $code = isset($request['code']) ? trim($request['code']) : null;
    if(empty($code)) {
        throw new Exception('Empty code');
    }
    switch($action) {
        case 'validate':
            $res = (bool) findGroup($code);
            break;
        case 'enter':
            if($group = findGroup($code)) {
                $res = enterGroup($group);
            } else {
                throw new Exception('Error');
            }
            break;
        default:
            throw new Exception('Incorrect action');
    }
    echo json_encode($res);
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
