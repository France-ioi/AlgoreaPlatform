<?php

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

// TODO: handle platform token (currently not implemented in task platform)

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

require_once __DIR__.'/../config.php';

session_start();
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'missing action'));
   exit();
}
if (!isset($_SESSION['login'])) {
   echo json_encode(array('result' => false, 'error' => 'only identified users can use this file'));
   exit();
}

require_once(dirname(__FILE__)."/../shared/TokenParser.php");
require_once(__DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php');

function getTokenParams($request) {
   global $config;
   $tokenParser = new TokenParser($config->platform->public_key);
   try {
      $params = $tokenParser->decodeToken($request['sToken']);
   } catch (Exception $e) {
      echo json_encode(array('result' => false, 'error' => $e->getMessage()));
      exit;
   }
   return $params;
}


function checkParams($params) {
   if ($params['idUser'] != $_SESSION['login']['ID']) {
      echo json_encode(array('result' => false, 'error' => 'token doesn\'t correspond to user session: got '.$params['idUser'].', expected '.$_SESSION['login']['ID'], 'token' => $params, 'session' => $_SESSION));
      exit;
   }
}

// this function checks the platformToken if necessary an returns a safe score
// TODO: maybe sAnswer or bValidated should be added to the token?
function getScore($request, $params, $otherPlatformToken, $db) {
   if (!isset($params['idItemLocal']) || !intval($params['idItemLocal'])) {
      echo json_encode(array('result' => false, 'error' => 'no item ID!', 'token' => $params));
      exit;
   }
   $query = 'SELECT * from platforms join items on items.idPlatform = platforms.ID where items.ID = :idItem;';
   $stmt = $db->prepare($query);
   $stmt->execute(array('idItem' => $params['idItemLocal']));
   $platform = $stmt->fetch();
   if (!$platform || !count($platform)) {
      echo json_encode(array('result' => false, 'error' => 'Unable to find corresponding platform', 'token' => $params, 'platform' => $platform));
      exit;
   }
   if (!$platform['bUsesTokens']) {
      return 10 * floatval($request['score']);  // XXX: hack to get score on 100 instead of 10, should be removed when beaver tasks are transformed
   }
   if (!$otherPlatformToken) {
      echo json_encode(array('result' => false, 'error' => 'platform token was ommited, please transmit it.', 'token' => $params));
      exit;
   }
   $tokenParser = new TokenParser($platform['sPublicKey']);
   try {
      $params = $tokenParser->decodeToken($otherPlatformToken);
   } catch (Exception $e) {
      echo json_encode(array('result' => false, 'error' => $e->getMessage(), 'platform' => $platform));
      exit;
   }
   if ($params['score'] != $request['score']) {
      echo json_encode(array('result' => false, 'error' => 'token and request do not correspond!', 'token' => $params, 'request' => $request));
      error_log('possible hack attempt from user ID '.$_SESSION['login']['ID']);
      exit;
   }
   return 10 * floatval($params['score']); // XXX: hack to get score on 100 instead of 10, should be removed when beaver tasks are transformed
}

// function returning the idUserAnswer field of $otherPlatformToken, an
// answerToken as returned by askHint()
function getIdUserAnswer($params, $answerToken) {
   global $config;
   $tokenParser = new TokenParser($config->platform->public_key);
   try {
      $answerParams = $tokenParser->decodeToken($answerToken);
   } catch (Exception $e) {
      echo json_encode(array('result' => false, 'error' => $e->getMessage()));
      exit;
   }
   if ($params['idItem'] != $answerParams['idItem'] || $params['idUser'] != $answerParams['idUser']) {
      echo json_encode(array('result' => false, 'error' => 'token and request do not correspond!', 'token' => $params, 'answerToken' => $answerParams));
      error_log('possible hack attempt from user ID '.$_SESSION['login']['ID']);
      exit;
   }
   return $answerParams['idUserAnswer'];
}

require_once("../shared/connect.php");
if (file_exists( __DIR__."/../shared/debug.php")) {
   include_once __DIR__."/../shared/debug.php"; // not required
} else {
   function syncDebug($type, $b_or_e, $subtype='') {}
}
require_once("../shared/listeners.php");
require_once(dirname(__FILE__)."/../shared/TokenGenerator.php");

function askValidation($request, $db) {
   global $config;
   $params = getTokenParams($request);
   $ID = getRandomID();
   checkParams($params);
   $query = "INSERT INTO `users_answers` (`ID`, `idUser`, `idItem`, `sAnswer`, `sSubmissionDate`, `bValidated`) VALUES (:ID, :idUser, :idItem, :sAnswer, NOW(), 0);";
   $stmt = $db->prepare($query);
   $stmt->execute(array('ID' => $ID, 'idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'sAnswer' => $request['sAnswer']));
   $query = "UPDATE `users_items` SET nbSubmissionsAttempts = nbSubmissionsAttempts + 1, nbTasksTried = 1, sAncestorsComputationState = 'todo' WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   unset($stmt);

   $answerParams = array(
      'sAnswer' => $request['sAnswer'],
      'idUser' => intval($_SESSION['login']['ID']),
      'idItem' => intval($params['idItem']),
      'idItemLocal' => intval($params['idItemLocal']),
      'idUserAnswer' => $ID
   );
   $tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);
   $answerToken = $tokenGenerator->generateToken($answerParams);
   echo json_encode(array('result' => true, 'sAnswerToken' => $answerToken, 'answer' => $answerParams));
}

function askHint($request, $db) {
   global $config;
   $params = getTokenParams($request);
   checkParams($params);
   $query = "UPDATE `users_items` SET nbHintsCached = nbHintsCached + 1, nbTasksWithHelp = 1, sAncestorsComputationState = 'todo', sLastActivityDate = NOW(), sLastHintDate = NOW() WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   Listeners::UserItemsAfter($db);

   $params['nbHintsGiven'] = $params['nbHintsGiven'] + 1;
   $tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);
   $token = $tokenGenerator->generateToken($params);
   echo json_encode(array('result' => true, 'sToken' => $token));
}

function graderResult($request, $db) {
   global $config;
   $params = getTokenParams($request);
   checkParams($params);
   $score = getScore($request, $params, isset($request['scoreToken']) ? $request['scoreToken'] : null, $db);
   $idUserAnswer = getIdUserAnswer($params, $request['answerToken']);
   // TODO: handle validation in a proper way
   $bValidated = ($score > 50);
   $query = "UPDATE `users_answers` SET sGradingDate = NOW(), bValidated = :bValidated, iScore = :iScore WHERE idUser = :idUser AND idItem = :idItem AND ID = :idUserAnswer;";
   $stmt = $db->prepare($query);
   $test = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'bValidated' => $bValidated, 'iScore' => $score, 'idUserAnswer' => $idUserAnswer));
   $query = "UPDATE `users_items` SET iScore = GREATEST(:iScore, `iScore`), sLastActivityDate = NOW(), sLastAnswerDate = NOW() WHERE idUser = :idUser AND idItem = :idItem;";
   if ($bValidated) {
      $query = "UPDATE `users_items` SET sAncestorsComputationState = 'todo', bValidated = 1, iScore = GREATEST(:iScore, `iScore`), sValidationDate = NOW() WHERE idUser = :idUser AND idItem = :idItem;";
   }
   $stmt = $db->prepare($query);
   $res = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'iScore' => $score));
   if ($bValidated) {
      Listeners::computeAllUserItems($db);
   }
   $token = $request['sToken'];
   if ($bValidated && !$params['bAccessSolutions']) {
      $params['bAccessSolutions'] = true;
      $tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);
      $token = $tokenGenerator->generateToken($params);
   }
   echo json_encode(array('result' => true, 'bValidated' => $bValidated, 'sToken' => $token));
}

function getToken($request, $db) {
   global $config;
   $query = 'select `users_items`.`nbHintsCached`, `users_items`.`bValidated`, `items`.`ID`, `items`.`sTextId`, `items`.`bHintsAllowed`, `items`.`sSupportedLangProg`, MAX(`groups_items`.`bCachedAccessSolutions`) as `bAccessSolutions`, `items`.`sType` '.
   'from `items` '.
   'join `groups_items` on `groups_items`.`idItem` = `items`.`ID` '.
   'join `users_items` on `users_items`.`idItem` = `items`.`ID` '.
   'left join `groups_ancestors` on `groups_ancestors`.`idGroupAncestor` = `groups_items`.`idGroup` .'.
   'where `groups_items`.`idGroup` = idGroupSelf OR `groups_ancestors`.`idGroupChild` = :idGroupSelf AND '.
   '`users_items`.`idUser` = :idUser and `items`.`ID` = :idItem AND'.
   '(`items`.`sType` = \'Task\' OR `items`.`sType` = \'Course\') AND '.
   'MAX(`groups_items`.`bCachedFullAccess` + `groups_items`.`bCachedPartialAccess`) != 0 '.
   'group by `items`.`ID`;';
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']));
   $data = $sth->fetch();
   if (!count($data)) {
      echo json_encode(array('result' => false, 'error' => 'you are not allowed to access this item', 'data' => $data, 'session' => $_SESSION));
      exit();
   }
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem'], 'idGroupSelf' => $_SESSION['login']['idGroupSelf']));
   $data = $sth->fetch();
   $query = 'select * from `users_answers` where `idUser` = :idUser and `idItem` = :idItem';
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem']));
   $answers = $sth->fetchAll();

   $tokenArgs = array(
      'bAccessSolutions' => $data['bAccessSolutions'],
      'bSubmissionPossible' => true,
      'bHintsAllowed' => $data['bHintsAllowed'],
      'nbHintsGiven' => $data['nbHintsCached'],
      'bIsAdmin' => false,
      'bReadAnswers' => true,
      'aAnswers' => $answers,
      'idUser' => intval($_SESSION['login']['ID']),
      'idItemLocal' => intval($request['idItem']),
      'idItem' => $data['sTextId'],
      'sSupportedLangProg' => $data['sSupportedLangProg'],
      'bHasSolvedTask' => $data['bValidated'],
   );
   $tokenArgs['id'+$data['sType']] = $tokenArgs['idItem']; // TODO: should disapear
   $tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);
   $sToken = $tokenGenerator->generateToken($tokenArgs);
   echo json_encode(array('result' => true, 'sToken' => $stoken, 'tokenArgs' => $tokenArgs));
}

if ($request['action'] == 'askValidation') {
   askValidation($request, $db);
} elseif ($request['action'] == 'askHint') {
   askHint($request, $db);
} elseif ($request['action'] == 'graderResult') {
   graderResult($request, $db);
} elseif ($request['action'] == 'getToken') {
   getToken($request, $db);
}
