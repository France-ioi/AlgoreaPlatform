<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';


if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   die("Auth failed");
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
            $amount = isset($request['amount']) ? (int) $request['amount'] : 0;
            if(!$amount) {
                throw new Exception('Number of users in group must be 1..50');
            }
            $res = $manager->create($prefix, $amount);
            break;
        case 'delete':
            $res = $manager->delete($prefix);
            break;
        default:
            throw new Exception('Incorrect action');
    }

    echo json_encode([
        'success' => true,
        'data' => $res
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}