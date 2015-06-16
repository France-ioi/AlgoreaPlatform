<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

// File to handle manual grading

$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['login'])) {
   echo json_encode(array('result' => false, 'error' => 'only identified users can use this file'));
   exit();
}
if (!isset($request['idUserAnswer'])) {
   echo json_encode(array('result' => false, 'error' => 'missing user_answer'));
   exit();
}

require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/listeners.php';

// checking rights TODO: do something better
$query = 'update users_answers'.
         ' join items on users_answers.idItem = items.ID'.
         ' join users_items as my_users_items on my_users_items.idItem = users_answers.idItem'.
         ' join users_items as other_users_items on other_users_items.idItem = users_answers.idItem and other_users_items.idUser = users_answers.idUser'.
         ' set users_answers.iScore = :iScore '.
         ' , users_answers.bValidated = :bValidated '.
         ' , users_answers.sGradingDate = NOW() '.
         ' , users_answers.idUserGrader = :idUser '.
//         ' , other_users_items.iScore = GREATEST(:iScore, other_users_items.iScore)'.
         ' where '.
         '    my_users_items.idUser = :idUser and '.
         '    my_users_items.bValidated = 1 and '.
         '    items.sValidationType = \'Manual\' and'.
         '    users_answers.ID = :idUserAnswer;';
$stmt = $db->prepare($query);
$res = $stmt->execute(array('idUser' => $_SESSION['login']['ID'], 'idUserAnswer' => $request['idUserAnswer'], 'iScore' => $request['iScore'], 'bValidated' => $request['bValidated']));
if ($res && $request['bValidated'] && $request['bValidated'] != '0') {
   $query = "UPDATE `users_items` join users_answers on users_items.idUser=users_answers.idUser and users_items.idItem = users_answers.idItem SET `users_items`.sAncestorsComputationState = 'todo', `users_items`.bValidated = 1, `users_items`.sValidationDate = COALESCE(`users_items`.`sValidationDate`, NOW()) WHERE users_answers.ID = :idUserAnswer;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUserAnswer' => $request['idUserAnswer']));
   Listeners::UserItemsAfter($db);
}
echo json_encode(array('success' => true));
