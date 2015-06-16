<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

header('Content-Type: application/json');

if (!isset($request['idThread']) || !isset($request['idItem']) || !isset($request['idUser'])) {
   echo json_encode(array('success' => false, 'error' => 'Missing info in request (idThread, idItem and idUser needed).', 'request' => $request));
   return;
}

session_start();

if(!isset($_SESSION) || !isset($_SESSION['login'])) {
   echo json_encode(array('success' => false, 'error' => 'Only logged users can read forum threads.'));
   return;
}

require_once __DIR__.'/../shared/connect.php';

// get self access data, self user_item and asked user's user_item, relative to asked item
$query = 'select 
            `items`.`ID`,
            `items`.`bHintsAllowed`,
            `items`.`sSupportedLangProg`,
            MAX(`groups_items`.`bCachedAccessSolutions`) as `bAccessSolutions`,
            IF (MAX(`groups_items`.`bCachedFullAccess` + `groups_items`.`bCachedPartialAccess`) = 0, 1, 0) as `bGrayedAccess`,
            `items`.`sType`,
            `my_user_item`.`bValidated` as `my_bValidated`,
            `my_user_item`.`nbHintsCached` as `my_nbHintsCached`,
            `other_user_item`.`bValidated` as `other_bValidated`,
            `other_user_item`.`sState` as `other_sState`,
            `other_user_item`.`nbHintsCached` as `other_nbHintsCached`
         from `items` 
         join `groups_items` on `groups_items`.`idItem` = `items`.`ID`
         left join `groups_ancestors` on `groups_ancestors`.`idGroupAncestor` = `groups_items`.`idGroup`
         join `users_items` as `my_user_item` on `my_user_item`.`idItem` = `items`.`ID`
         join `users_items` as `other_user_item` on `other_user_item`.`idItem` = `items`.`ID`
         where 
            (`groups_items`.`idGroup` = :idGroupSelf OR `groups_ancestors`.`idGroupChild` = :idGroupSelf) AND 
            `items`.`ID` = :idItem AND
            `items`.`sType` = \'Task\' AND
            `my_user_item`.`idUser` = :myIdUser AND 
            `other_user_item`.`idUser` = :otherIdUser
         group by `items`.`ID`;';

$stmt = $db->prepare($query);
$values = array(
   'idGroupSelf' => $_SESSION['login']['idGroupSelf'],
   'idItem' => $request['idItem'],
   'myIdUser' => $_SESSION['login']['ID'],
   'otherIdUser' => $request['idUser'],
   );
$stmt->execute($values);
$data = $stmt->fetch();
if (!isset($data) || !$data || $data['bGrayedAccess']) {
   echo json_encode(array('success' => false, 'error' => 'you cannot access this item', 'values' => $values));
   return;
}

require_once __DIR__.'/../shared/TokenGenerator.php';
$tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);
$tokenArgs = array(
   'bAccessSolutions' => $data['bAccessSolutions'],
   'bSubmissionPossible' => false,
   'bHintsAllowed' => $data['bHintsAllowed'],
   'nbHintsGiven' => min($data['my_nbHintsCached'], $data['other_nbHintsCached']),
   'bIsAdmin' => false,
   'bReadAnswers' => true,
   'idUser' => intval($request['idUser']),
   'idItem' => intval($request['idItem']),
   'sSupportedLangProg' => $data['sSupportedLangProg'],
   'bHasSolvedTask' => min($data['my_bValidated'], $data['other_bValidated']),
);
$tokenArgs['idTask'] = $tokenArgs['idItem']; // TODO: should disapear
$sToken = $tokenGenerator->generateToken($tokenArgs);

// getting other user's answers
$query = 'SELECT users_answers.*, user.sLogin as sLogin, user_grader.sLogin as graderLogin from users_answers join users as user on user.ID = users_answers.idUser left join users as user_grader on user_grader.ID = users_answers.idUserGrader where users_answers.idItem = :idItem and users_answers.idUser = :idUser;';
$stmt = $db->prepare($query);
$stmt->execute(array('idItem' => $request['idItem'], 'idUser' => $request['idUser']));
$other_answers = $stmt->fetchAll();

echo json_encode(array('success' => true, 
   'sToken' => $sToken,
   'other_nbHintsCached' => $data['other_nbHintsCached'],
   'other_bValidated' => $data['other_bValidated'],
   'other_sState' => $data['other_sState'],
   'other_answers' => $other_answers
));
