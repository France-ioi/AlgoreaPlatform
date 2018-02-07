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



function verifyCode() {
    if(!isset($_POST['code'])) {
        throw new Exception('Code param missed');
    }
    global $db;
    $query = 'select * from `groups` where `sPassword` = :code limit 1';
    $stmt = $db->prepare($query);
    $stmt->execute([ 'code' => $_POST['code'] ]);
    if($stmt->fetchObject()) {
        return ['success' => true];
    } else {
        throw new Exception('Code not found');
    }
}

try {
    $action = isset($_POST['action']) ? $_POST['action'] : null;
    switch($action) {
        case 'verify_code':
            $res = verifyCode();
            break;
        default:
            throw new Exception('Action param missed');
            break;
    }
    echo json_encode($res);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}