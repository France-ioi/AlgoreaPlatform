<?php

require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/common.php';

$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
	echo json_encode(['success' => false, 'error' => "vous devez être connecté pour accéder au concours"]);
	return;
}

if (!isset($request['action'])) {
	echo json_encode(['success' => false, 'error' => "missing action"]);
	return;
}

function syncDebug($type, $b_or_e, $subtype='') {}

if ($request['action'] == 'getRemainingTime') {
	$answer = getRemainingTime();
	echo json_encode($answer);
	return;
}
if ($request['action'] == 'openContest') {
	if (!isset($request['idItem'])) {
		echo json_encode(['success' => false, 'error' => "missing idItem"]);
		return;
	}
	if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
		echo json_encode(['success' => false, 'error' => "vous devez être connecté pour accéder au concours"]);
		return;
	}
	$res = openContest($request['idItem'], $_SESSION['login']['ID'], $_SESSION['login']['idGroupSelf']);
	if ($res['success']) {
		$_SESSION['contest'] = [
			'endTime' => $res['endTime'],
			'startTime' => $res['startTime'],
			'idItem' => $request['idItem'],
			'duration' => $contestData['duration']
		];
	}
	echo json_encode($res);
}
if ($request['action'] == 'getContestData') {
	$answer = adjustContestAndGetData();
	echo json_encode($answer);
	return;
}