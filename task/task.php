<?php

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

// TODO: handle platform token (currently not implemented in task platform)

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

require_once __DIR__.'/../config.php';

if (session_status() === PHP_SESSION_NONE){session_start();}
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
require_once(__DIR__.'/../contest/common.php');

function getTokenParams($request) {
   global $config, $db;
   $tokenParser = new TokenParser($config->platform->public_key, $config->platform->name);
   try {
      if (isset($request['sToken'])) {
         $params = $tokenParser->decodeJWS($request['sToken']);
      } elseif (isset($request['scoreToken'])) {
         $params = $tokenParser->decodeJWS($request['scoreToken']);
      } else {
         echo json_encode(array('result' => false, 'error' => 'no sToken nor scoreToken argument'));
         exit;
      }
   } catch (Exception $e) {
      echo json_encode(array('result' => false, 'error' => $e->getMessage()));
      exit;
   }
   if (!$params['idUser'] || (!$params['itemUrl'] && !$params['idItemLocal'])) {
      echo json_encode(array('result' => false, 'error' => 'missing idUser or itemUrl in token'));
      exit;
   }
   if (!$params['idItemLocal']) {
      $stmt = $db->prepare('select ID from items where sUrl = :itemUrl;');
      $stmt->execute(['itemUrl' => $params['itemUrl']]);
      $params['idItemLocal'] = $stmt->fetchColumn();
      if (!$params['idItemLocal']) {
         echo json_encode(array('result' => false, 'error' => 'cannot find item with url '.$params['itemUrl']));
         exit;     
      }
   }
   if (isset($_SESSION) && isset($_SESSION['login']) && $params['idUser'] != $_SESSION['login']['ID']) {
      echo json_encode(array('result' => false, 'error' => 'token doesn\'t correspond to user session: got '.$params['idUser'].', expected '.$_SESSION['login']['ID'], 'token' => $params, 'session' => $_SESSION));
      exit;
   }
   return $params;
}

// this function checks the platformToken if necessary an returns a safe score
// TODO: maybe sAnswer or bValidated should be added to the token?
function getScoreParams($request, $params, $otherPlatformToken, $db) {
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
      return ['score' => $request['score']];
   }
   if (!$otherPlatformToken) {
      echo json_encode(array('result' => false, 'error' => 'platform token was ommited, please transmit it.', 'token' => $params));
      exit;
   }
   $tokenParser = new TokenParser($platform['sPublicKey'], $platform['sName']);
   try {
      $params = $tokenParser->decodeJWS($otherPlatformToken);
   } catch (Exception $e) {
      echo json_encode(array('result' => false, 'error' => $e->getMessage(), 'platform' => $platform));
      exit;
   }
   if ($params['score'] != $request['score']) {
      echo json_encode(array('result' => false, 'error' => 'token and request do not correspond!', 'token' => $params, 'request' => $request));
      error_log('possible hack attempt from user ID '.$_SESSION['login']['ID']);
      exit;
   }
   return $params;
}

// function returning the idUserAnswer field of answerToken when no scoreToken is provided
function getIdUserAnswer($params, $answerToken) {
   global $config;
   $tokenParser = new TokenParser($config->platform->public_key, $config->platform->name);
   try {
      $answerParams = $tokenParser->decodeJWS($answerToken);
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

function createUserItemIfMissing($userItemId, $params) {
   global $db;
   if (!$userItemId) return;
   $stmt = $db->prepare("INSERT IGNORE INTO `users_items` (`ID`, `idUser`, `idItem`) VALUES (:ID, :idUser, :idItem);");
   $stmt->execute(['ID' => $userItemId,'idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']]);
}

function checkSubmissionRight($idItem) {
   // Checks if submission for that item is allowed: checks if we're in a
   // contest and allowed, and whether the item is read-only
   global $db;
   // Check contest
   $canValidate = checkContestSubmissionRight($idItem);
   if (!$canValidate['submissionPossible']) {
      return ['result' => false, 'error' => $canValidate['error']];
   }

   // Check whether item is read-only
   $stmt = $db->prepare("SELECT bReadOnly FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $idItem]);
   $readOnly = $stmt->fetchColumn();
   if($readOnly === false) {
      return ['result' => false, 'error' => 'Item not found'];
   } elseif($readOnly == 1) {
      return ['result' => false, 'error' => 'Item is read-only'];
   }
   return ['result' => true]; 
}

function askValidation($request, $db) {
   global $config;
   $params = getTokenParams($request);
   $canValidate = checkSubmissionRight($params['idItemLocal']);
   if (!$canValidate['result']) {
      echo json_encode($canValidate);
      return;
   }
   createUserItemIfMissing($request['userItemId'], $params);
   $ID = getRandomID();
   $query = "INSERT INTO `users_answers` (`ID`, `idUser`, `idItem`, `sAnswer`, `sSubmissionDate`, `bValidated`) VALUES (:ID, :idUser, :idItem, :sAnswer, NOW(), 0);";
   $stmt = $db->prepare($query);
   $stmt->execute(array('ID' => $ID, 'idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'sAnswer' => $request['sAnswer']));
   $query = "UPDATE `users_items` SET nbSubmissionsAttempts = nbSubmissionsAttempts + 1, sAncestorsComputationState = 'todo' WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   unset($stmt);

   $answerParams = array(
      'sAnswer' => $request['sAnswer'],
      'idUser' => $_SESSION['login']['ID'],
      'idItem' => $params['idItem'],
      'itemUrl' => $params['itemUrl'],
      'idItemLocal' => $params['idItemLocal'],
      'idUserAnswer' => $ID
   );
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $answerToken = $tokenGenerator->encodeJWS($answerParams);
   echo json_encode(array('result' => true, 'sAnswerToken' => $answerToken, 'answer' => $answerParams));
}

function askHint($request, $db) {
   global $config;
   $params = getTokenParams($request);
   $canValidate = checkSubmissionRight($params['idItemLocal']);
   if (!$canValidate['result']) {
      echo json_encode($canValidate);
      return;
   }
   createUserItemIfMissing($request['userItemId'], $params);
   $query = "UPDATE `users_items` SET nbHintsCached = nbHintsCached + 1, nbTasksWithHelp = 1, sAncestorsComputationState = 'todo', sLastActivityDate = NOW(), sLastHintDate = NOW() WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   Listeners::UserItemsAfter($db);

   $params['nbHintsGiven'] = $params['nbHintsGiven'] + 1;
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $token = $tokenGenerator->encodeJWS($params);
   echo json_encode(array('result' => true, 'sToken' => $token));
}

function graderResult($request, $db) {
   global $config;
   $params = getTokenParams($request);
   $canValidate = checkSubmissionRight($params['idItemLocal']);
   if (!$canValidate['result']) {
      echo json_encode($canValidate);
      return;
   }
   $scoreParams = getScoreParams($request, $params, isset($request['scoreToken']) ? $request['scoreToken'] : null, $db);
   $score = floatval($scoreParams['score']);
   if (!isset($request['scoreToken'])) {
      $idUserAnswer = getIdUserAnswer($params, $request['answerToken']);   
   } else {
      $idUserAnswer = isset($params['idUserAnswer']) ? $params['idUserAnswer'] : $scoreParams['idUserAnswer'];
   }
   // TODO: handle validation in a proper way
   $bValidated = ($score > 99);
   $bKeyObtained = false;

   $query = "UPDATE `users_answers` SET sGradingDate = NOW(), bValidated = :bValidated, iScore = :iScore WHERE idUser = :idUser AND idItem = :idItem AND ID = :idUserAnswer;";
   $stmt = $db->prepare($query);
   $test = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'bValidated' => $bValidated, 'iScore' => $score, 'idUserAnswer' => $idUserAnswer));

   // Build query to update users_items
   $query = "UPDATE `users_items` SET iScore = GREATEST(:iScore, `iScore`), nbTasksTried = 1, sLastActivityDate = NOW(), sLastAnswerDate = NOW()";
   if ($bValidated) {
      // Item was validated
      $query .= ", sAncestorsComputationState = 'todo', bValidated = 1, bKeyObtained = 1, sValidationDate = IFNULL(sValidationDate,NOW())";
      $bKeyObtained = true;
   } else {
      // Item wasn't validated, check if we unlocked something
      $stmt = $db->prepare("SELECT idItemUnlocked, iScoreMinUnlock FROM items WHERE ID = :idItem;");
      $stmt->execute(['idItem' => $params['idItemLocal']]);
      $item = $stmt->fetch();
      if($item['idItemUnlocked'] && $score >= intval($item['iScoreMinUnlock'])) {
         $bKeyObtained = true;
         // Update sAncestorsComputationState only if we hadn't obtained the key before
         $query .= ", sAncestorsComputationState = IF(bKeyObtained = 0, 'todo', sAncestorsComputationState), bKeyObtained = 1";
      }
   }
   $query .= " WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $res = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'iScore' => $score));
   if ($bValidated || $bKeyObtained) {
      Listeners::computeAllUserItems($db);
   }
   $token = $request['sToken'];
   if ($bValidated && isset($params['bAccessSolutions']) && !$params['bAccessSolutions']) {
      $params['bAccessSolutions'] = true;
      $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
      $token = $tokenGenerator->encodeJWS($params);
   }
   echo json_encode(array('result' => true, 'bValidated' => $bValidated, 'bKeyObtained' => $bKeyObtained, 'sToken' => $token));
}

function getToken($request, $db) {
   global $config;
   $query = 'select `users_items`.`nbHintsCached`, `users_items`.`bValidated`, `items`.`sUrl`, `items`.`ID`, `items`.`sTextId`, `items`.`bHintsAllowed`, `items`.`sSupportedLangProg`, MAX(`groups_items`.`bCachedAccessSolutions`) as `bAccessSolutions`, `items`.`sType` '.
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

   $bAccessSolutions = ($data['bAccessSolutions'] != '0' || $data['bValidated'] != '0') ? 1 : 0;
   $tokenArgs = array(
      'bAccessSolutions' => $bAccessSolutions,
      'bSubmissionPossible' => true,
      'bHintsAllowed' => $data['bHintsAllowed'],
      'nbHintsGiven' => $data['nbHintsCached'],
      'bIsAdmin' => false,
      'bReadAnswers' => true,
      'aAnswers' => $answers,
      'idUser' => intval($_SESSION['login']['ID']),
      'idItemLocal' => $request['idItem'],
      'idItem' => $data['sTextId'],
      'itemUrl' => $data['sUrl'],
      'sSupportedLangProg' => $data['sSupportedLangProg'],
   );
   $tokenArgs['id'+$data['sType']] = $tokenArgs['idItem']; // TODO: should disapear
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $sToken = $tokenGenerator->encodeJWS($tokenArgs);
   echo json_encode(array('result' => true, 'sToken' => $stoken, 'tokenArgs' => $tokenArgs));
}

if ($request['action'] == 'askValidation') {
   askValidation($request, $db);
} elseif ($request['action'] == 'askHint') {
   askHint($request, $db);
} elseif ($request['action'] == 'graderResult' || $request['action'] == 'graderReturn') {
   graderResult($request, $db);
} elseif ($request['action'] == 'getToken') {
   getToken($request, $db);
}
