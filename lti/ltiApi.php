<?php

$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'api_error'));
   exit();
}
if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo json_encode(array('result' => false, 'error' => 'api_needs_login'));
   exit();
}

if(!function_exists('syncDebug')) { function syncDebug($type, $b_or_e, $subtype='') {} }

require_once __DIR__."/../shared/connect.php";
require_once __DIR__.'/../vendor/autoload.php';


function getChapterScore($idItem) {
    // Get grades, weights, and chapter grade
    global $db;

    $stmt = $db->prepare("
        SELECT items_items.iWeight, items.ID AS idItem, items.sType AS sType, IFNULL(users_items.iScore, 0) AS iScore, items_strings.sTitle AS sTitle
        FROM items_items
        JOIN items ON items_items.idItemChild = items.ID
        JOIN items_strings ON items_strings.idItem = items.ID
        LEFT JOIN users_items ON users_items.idItem = items.ID AND users_items.idUser = :idUser
        WHERE items_items.idItemParent = :idItem AND (items.sType = 'Task' OR items.sType = 'Chapter')
        GROUP BY items.ID
        ORDER BY items_items.iChildOrder ASC;
        ");
    $stmt->execute(['idItem' => $idItem, 'idUser' => $_SESSION['login']['ID']]);

    $totalScore = 0;
    $totalWeight = 0;
    $scores = [];

    while($row = $stmt->fetch()) {
        if($row['sType'] == 'Chapter') {
            $chapterScore = getChapterScore($row['idItem']);
            if(count($chapterScore['scores']) == 0) { continue; }
            $row['iScore'] = $chapterScore['total_score'];
            $row['children'] = $chapterScore['scores'];
        }
        $scores[] = $row;
        $totalScore += $row['iWeight'] * $row['iScore'];
        $totalWeight += $row['iWeight'];
    }

    $totalScore = $totalWeight == 0 ? 0 : round($totalScore / $totalWeight, 2);
    if($totalWeight == 0) {
        $totalScore = 0;
    }

    return ['result' => true, 'total_score' => $totalScore, 'scores' => $scores];
}

function getScores($request) {
    $itemScores = getChapterScore($request['idItem']);
    if(isset($request['idItemParent'])) {
        $itemScores['parent_score'] = getChapterScore($request['idItemParent'])['total_score'];
    }
    return $itemScores;
}


function sendScore($request) {
    // Send score to the LTI
    global $config;
    $totalScore = getScores($request)['total_score'];

    if(!isset($_SESSION['login']['lti_connection_id'])) {
        return ['result' => false, 'error' => 'lti_not_connected'];
    }

    try {
        $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
        $lti = $client->getLtiInterface();
        $lti->sendResult([
            'lti_connection_id' => $_SESSION['login']['lti_connection_id'],
            'score' => $totalScore / 100
            ]);
    } catch (\Exception $e) {
        return ['result' => false, 'error' => 'lti_send_failure', 'error_full' => $e->getMessage()];
    }

    return ['result' => true, 'sent_score' => $totalScore / 100];
}

if($request['action'] == 'getScores') {
   die(json_encode(getScores($request)));
} elseif($request['action'] == 'sendScore') {
   die(json_encode(sendScore($request)));
} else {
   die(json_encode(['result' => false, 'error' => 'api_error']));
}
