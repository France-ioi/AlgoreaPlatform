<?php

// API endpoint for badges

header("Content-Type: application/json");
header("Connection: close");

if (!isset($_POST['action'])) {
    die(json_encode(['success' => false, 'error' => 'No action given in POST.']);
    exit();
}

require_once __DIR__."/../shared/connect.php";

// *** Functions handling requests

function verifyCode($request) {
    if(!isset($request['code']) || !$request['code']) {
        return ['result' => false, 'error' => 'No code given.'];
    }
    // TODO :: system to request specific badges
    $stmt = $db->prepare('SELECT idUser FROM badges WHERE code = :code AND name IS NULL;');
    $stmt->execute(['code' => $request['code']]);
    $idUser = $stmt->fetchColumn();

    if(!$idUser) {
        return ['result' => false, 'error' => 'Invalid code.'];
    }

    $stmt = $db->prepare('SELECT * FROM users WHERE ID = :idUser;');
    $stmt->execute(['idUser' => $idUser]);
    $user = $stmt->fetch();

    if(!$user) {
        return ['result' => false, 'error' => 'Invalid code (user not found).'];
    }

    return [
        'result' => true,
        'sFirstName' => $user['sFirstName'],
        'sLastName' => $user['sLastName'],
        'grade' => $user['iGrade'],
        'sSex' => $user['sSex'],
        'sEmail' => $user['sEmail'],
        'sZipcode' => $user['sZipCode']
        ];
}


if($request['action'] == 'verifyCode') {
    die(json_encode(getTeam($request)));
} else {
    die(json_encode(['result' => false, 'error' => 'Action not recognized.']));
}
