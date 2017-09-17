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
$stmt = $db->prepare('insert into error_log (date, url, browser, details) values (NOW(), :url, :browser, :details)');
$stmt->execute($_POST);
echo json_encode(['success' => true]);