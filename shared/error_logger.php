<?php

$required = ['url', 'browser', 'details'];
$missed = array_diff($required, array_keys($_POST));
if(count($missed)) {
    $res = [
        'success' => false,
        'error' => 'missing argument(s): '.implode(',', $missed)
    ];
	die(json_encode($res));
}

require_once __DIR__.'/../shared/connect.php';
if(session_status() === PHP_SESSION_NONE) {
    session_start();
}
$params = array_intersect_key($_POST, array_flip($required));
$params['user_id'] = isset($_SESSION['login']) ? $_SESSION['login']['ID'] : null;
$stmt = $db->prepare('insert into error_log (date, url, browser, details, user_id) values (NOW(), :url, :browser, :details, :user_id)');
$stmt->execute($params);
echo json_encode(['success' => true]);