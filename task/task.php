<?php

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

// TODO: handle platform token (currently not implemented in task platform)

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

if(empty($request)) {
  $request = $_POST;
}

require_once __DIR__.'/../config.php';

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'missing action'));
   exit();
}
if (!isset($_SESSION['login']) && $request['action'] != 'graderReturn') {
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
   if(isset($request['hintToken'])) {
      // There's a hintToken to decode too
      // Get task platform information
      $query = 'SELECT * from platforms join items on items.idPlatform = platforms.ID where items.ID = :idItem;';
      $stmt = $db->prepare($query);
      $stmt->execute(array('idItem' => $params['idItemLocal']));
      $platform = $stmt->fetch();

      if($platform['bUsesTokens']) {
         $taskTokenParser = new TokenParser($platform['sPublicKey'], $platform['sName']);
         try {
            $hintParams = $taskTokenParser->decodeJWS($request['hintToken']);
         } catch(Exception $e) {
            error_log("Unable to read hintToken from user " . $params['idUser'] . ", item " . $params['idItemLocal']);
         }
      } else {
         $hintParams = $request['hintToken'];
      }
      if(isset($hintParams['askedHint'])) {
         $params['askedHint'] = $hintParams['askedHint'];
      }
   }
   if (!isset($params['idItemLocal'])) {
      $stmt = $db->prepare('select idItem from users_answers where ID = :idUserAnswer;');
      $stmt->execute(['idUserAnswer' => $params['idUserAnswer']]);
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
   $stmt = $db->prepare("INSERT IGNORE INTO `users_items` (`ID`, `idUser`, `idItem`, `sAncestorsComputationState`) VALUES (:ID, :idUser, :idItem, 'todo');");
   $stmt->execute(['ID' => $userItemId,'idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']]);
}

function checkSubmissionRight($idItem, $idUser=false) {
   // Checks if submission for that item is allowed: checks if we're in a
   // contest and allowed, and whether the item is read-only
   global $db;
   // Check contest
   if(isset($_SESSION)) {
      $canValidate = checkContestSubmissionRight($idItem, $idUser);
      if (!$canValidate['submissionPossible']) {
         return ['result' => false, 'error' => $canValidate['error']];
      }
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
   $canValidate = checkSubmissionRight($params['idItemLocal'], $params['idUser']);
   if (!$canValidate['result']) {
      echo json_encode($canValidate);
      return;
   }
   createUserItemIfMissing($request['userItemId'], $params);
   $ID = getRandomID();
   $query = "INSERT INTO `users_answers` (`ID`, `idUser`, `idItem`, `idAttempt`, `sAnswer`, `sSubmissionDate`, `bValidated`) VALUES (:ID, :idUser, :idItem, :idAttempt, :sAnswer, NOW(), 0);";
   $stmt = $db->prepare($query);
   $stmt->execute(array('ID' => $ID, 'idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'idAttempt' => $params['idAttempt'], 'sAnswer' => $request['sAnswer']));
   $query = "SELECT sHintsRequested, nbHintsCached FROM `users_items` WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   $hintsInfo = $stmt->fetch(PDO::FETCH_ASSOC);
   $query = "UPDATE `users_items` SET nbSubmissionsAttempts = nbSubmissionsAttempts + 1 WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   unset($stmt);

   $answerParams = array(
      'sAnswer' => $request['sAnswer'],
      'idUser' => $_SESSION['login']['ID'],
      'idItem' => $params['idItem'],
      'idAttempt' => $params['idAttempt'],
      'itemUrl' => $params['itemUrl'],
      'idItemLocal' => $params['idItemLocal'],
      'idUserAnswer' => $ID,
      'platformName' => $config->platform->name,
      'randomSeed' => $params['randomSeed'],
      'sHintsRequested' => $hintsInfo['sHintsRequested'],
      'nbHintsGiven' => $hintsInfo['nbHintsCached']
   );
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $answerToken = $tokenGenerator->encodeJWS($answerParams);
   echo json_encode(array('result' => true, 'sAnswerToken' => $answerToken, 'answer' => $answerParams));
}

function askHint($request, $db) {
   global $config;
   // User asks for a hint: we record the request in users_items and generate a
   // new token to tell the task we recorded the hint request

   $params = getTokenParams($request);
   $canValidate = checkSubmissionRight($params['idItemLocal'], $params['idUser']);
   if (!$canValidate['result']) {
      echo json_encode($canValidate);
      return;
   }
   createUserItemIfMissing($request['userItemId'], $params);

   // Get the previours hints requested JSON data
   if($params['idAttempt']) {
      $stmt = $db->prepare("SELECT sHintsRequested FROM `groups_attempts` WHERE ID = :idAttempt;");
      $stmt->execute(array('idAttempt' => $params['idAttempt']));
   } else {
      $stmt = $db->prepare("SELECT sHintsRequested FROM `users_items` WHERE idUser = :idUser AND idItem = :idItem;");
      $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal']));
   }
   if($hintsRequested = $stmt->fetchColumn()) {
      try {
         $hintsRequested = json_decode($hintsRequested, true);
         if(!is_array($hintsRequested)) {
            error_log("Unable to read sHintsRequested from user " . $params['idUser'] . ", item " . $params['idItemLocal'] . " (not an array)");
            $hintsRequested = array();
         }
      } catch(Exception $e) {
         error_log("Unable to read sHintsRequested from user " . $params['idUser'] . ", item " . $params['idItemLocal'] . " (invalid JSON)");
         $hintsRequested = array(); // Should we just fail here?
      }
   } else {
      $hintsRequested = array();
   }

   // Add the new requested hint to the list if it's not in the list yet
   if(!in_array($params['askedHint'], $hintsRequested)) {
      $hintsRequested[] = $params['askedHint'];
   }

   // Update groups_attempts with the hint request
   if($params['idAttempt']) {
      $stmt = $db->prepare("UPDATE `groups_attempts` SET sHintsRequested = :hintsRequested, nbHintsCached = :nbHints, nbTasksWithHelp = 1, sAncestorsComputationState = 'todo', sLastActivityDate = NOW(), sLastHintDate = NOW() WHERE ID = :idAttempt;");
      $stmt->execute(array('idAttempt' => $params['idAttempt'], 'hintsRequested' => json_encode($hintsRequested), 'nbHints' => count($hintsRequested)));
   }

   // Update users_items with the hint request
   $query = "UPDATE `users_items` SET sHintsRequested = :hintsRequested, nbHintsCached = :nbHints, nbTasksWithHelp = 1, sAncestorsComputationState = 'todo', sLastActivityDate = NOW(), sLastHintDate = NOW() WHERE idUser = :idUser AND idItem = :idItem";
   if($params['idAttempt']) {
      $query .= " AND idAttemptActive = :idAttempt";
      $stmt = $db->prepare($query);
      $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'hintsRequested' => json_encode($hintsRequested), 'nbHints' => count($hintsRequested), 'idAttempt' => $params['idAttempt']));
   } else {
      $stmt = $db->prepare($query);
      $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'hintsRequested' => json_encode($hintsRequested), 'nbHints' => count($hintsRequested)));
   }
   unset($stmt);

   Listeners::GroupsAttemptsAfter($db);
   Listeners::UserItemsAfter($db);

   // Generate a new token
   $params['platformName'] = $config->platform->name;
   $params['sHintsRequested'] = json_encode($hintsRequested);
   $params['nbHintsGiven'] = count($hintsRequested);
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $token = $tokenGenerator->encodeJWS($params);
   echo json_encode(array('result' => true, 'sToken' => $token));
}

function graderResult($request, $db) {
   global $config;
   $params = getTokenParams($request);
   $canValidate = checkSubmissionRight($params['idItemLocal'], $params['idUser']);
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
   $bValidated = ($score > 99) ? 1 : 0;
   $bKeyObtained = 0;

   $query = "UPDATE `users_answers` SET sGradingDate = NOW(), bValidated = :bValidated, iScore = :iScore WHERE idUser = :idUser AND idItem = :idItem AND ID = :idUserAnswer;";
   $stmt = $db->prepare($query);
   $test = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'bValidated' => $bValidated, 'iScore' => $score, 'idUserAnswer' => $idUserAnswer));

   // Build query to update users_items
   $baseQuery = "SET iScore = GREATEST(:iScore, `iScore`), nbTasksTried = 1, sLastActivityDate = NOW(), sLastAnswerDate = NOW()";
   if ($bValidated) {
      // Item was validated
      $baseQuery .= ", sAncestorsComputationState = 'todo', bValidated = 1, bKeyObtained = 1, sValidationDate = IFNULL(sValidationDate,NOW())";
      $bKeyObtained = true;
   } else {
      // Item wasn't validated, check if we unlocked something
      $stmt = $db->prepare("SELECT idItemUnlocked, iScoreMinUnlock FROM items WHERE ID = :idItem;");
      $stmt->execute(['idItem' => $params['idItemLocal']]);
      $item = $stmt->fetch();
      if($item['idItemUnlocked'] && $score >= intval($item['iScoreMinUnlock'])) {
         $bKeyObtained = true;
         // Update sAncestorsComputationState only if we hadn't obtained the key before
         $baseQuery .= ", sAncestorsComputationState = IF(bKeyObtained = 0, 'todo', sAncestorsComputationState), bKeyObtained = 1";
      }
   }
   $userItemQuery = "UPDATE `users_items` " . $baseQuery . " WHERE idUser = :idUser AND idItem = :idItem;";
   $stmt = $db->prepare($userItemQuery);
   $res = $stmt->execute(array('idUser' => $params['idUser'], 'idItem' => $params['idItemLocal'], 'iScore' => $score));
   if($params['idAttempt']) {
      $attemptQuery = "UPDATE `groups_attempts` " . $baseQuery . " WHERE ID = :id;";
      $stmt = $db->prepare($attemptQuery);
      $res = $stmt->execute(array('id' => $params['idAttempt'], 'iScore' => $score));
   }
   $stmt = null;
   if ($bValidated || $bKeyObtained) {
      Listeners::propagateAttempts($db);
      Listeners::computeAllUserItems($db);
   }
   $token = isset($request['sToken']) ? $request['sToken'] : $request['scoreToken'];
   if ($bValidated && isset($params['bAccessSolutions']) && !$params['bAccessSolutions']) {
      $params['bAccessSolutions'] = true;
      $params['platformName'] = $config->platform->name;
      $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
      $token = $tokenGenerator->encodeJWS($params);
   }
   echo json_encode(array('result' => true, 'bValidated' => $bValidated, 'bKeyObtained' => $bKeyObtained, 'sToken' => $token));
}

function getToken($request, $db) {
   global $config;
   $query = 'select `users_items`.`idAttemptActive`, `users_items`.`sHintsRequested`, `users_items`.`nbHintsCached`, `users_items`.`bValidated`, `items`.`sUrl`, `items`.`ID`, `items`.`sTextId`, `items`.`bHintsAllowed`, `items`.`sSupportedLangProg`, MAX(`groups_items`.`bCachedAccessSolutions`) as `bAccessSolutions`, `items`.`sType` '.
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
   $query = 'select * from `users_answers` where `idUser` = :idUser and `idItem` = :idItem';
   $stmt = $db->prepare($query);
   $stmt->execute(array('idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem']));
   $answers = $sth->fetchAll();

   $bAccessSolutions = ($data['bAccessSolutions'] != '0' || $data['bValidated'] != '0') ? 1 : 0;
   $tokenArgs = array(
      'bAccessSolutions' => $bAccessSolutions,
      'bSubmissionPossible' => true,
      'bHintsAllowed' => $data['bHintsAllowed'],
      'sHintsRequested' => $data['sHintsRequested'],
      'nbHintsGiven' => $data['nbHintsCached'],
      'bIsAdmin' => false,
      'bReadAnswers' => true,
      'aAnswers' => $answers,
      'idUser' => intval($_SESSION['login']['ID']),
      'idItemLocal' => $request['idItem'],
      'idItem' => $data['sTextId'],
      'idAttempt' => $data['idAttemptActive'],
      'itemUrl' => $data['sUrl'],
      'sSupportedLangProg' => $data['sSupportedLangProg'],
      'randomSeed' => $data['idAttemptActive'] ? $data['idAttemptActive'] : $_SESSION['login']['ID'],
      'platformName' => $config->platform->name
   );
   $tokenArgs['id'+$data['sType']] = $tokenArgs['idItem']; // TODO: should disapear
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   $sToken = $tokenGenerator->encodeJWS($tokenArgs);
   return array('result' => true, 'sToken' => $stoken, 'tokenArgs' => $tokenArgs);
}


function getUserTeam($idItem, $idUserSelf, $db) {
   // Find the team of an user for an item
   $stmt = $db->prepare("
      SELECT groups.ID FROM groups
      JOIN groups_groups ON groups_groups.idGroupParent = groups.ID
      JOIN items_ancestors ON items_ancestors.idItemAncestor = groups.idTeamItem
      WHERE groups.sType = 'Team'
         AND groups_groups.idGroupChild = :idUserSelf
         AND (items_ancestors.idItemChild = :idItem OR groups.idTeamItem = :idItem);");
   $stmt->execute(['idUserSelf' => $idUserSelf, 'idItem' => $idItem]);
   return $stmt->fetchColumn();
}


function createAttempt($request, $db) {
   // Create an attempt on an item

   // Check the item has attempts activated
   $stmt = $db->prepare('SELECT bHasAttempts FROM items WHERE ID = :id;');
   $stmt->execute(['id' => $request['idItem']]);
   if(!$stmt->fetchColumn()) {
      return ['result' => false, 'error' => "This item doesn't support attempts."];
   }

   // Find the user's team for this item
   $idGroup = getUserTeam($request['idItem'], $_SESSION['login']['idGroupSelf'], $db);
   if(!$idGroup) {
      return ['result' => false, 'error' => "No team found for this user"];
   }

   // Create the attempt
   $newId = getRandomId();
   $stmt = $db->prepare('LOCK TABLES groups_attempts WRITE; SET @maxIOrder = IFNULL((SELECT MAX(iOrder) FROM groups_attempts WHERE idGroup = :idGroup AND idItem = :idItem), 0); INSERT INTO groups_attempts (ID, idGroup, idItem, idUserCreator, iOrder) VALUES (:id, :idGroup, :idItem, :idUser, @maxIOrder + 1); UNLOCK TABLES;');
   $stmt->execute(['id' => $newId, 'idGroup' => $idGroup, 'idItem' => $request['idItem'], 'idUser' => $_SESSION['login']['ID']]);

   return ['result' => true, 'attemptId' => $newId];
}


function selectAttempt($request, $db) {
   // Select an attempt
   global $config;
   $stmt = $db->prepare("UPDATE users_items JOIN groups_attempts ON groups_attempts.ID = :idAttempt SET users_items.idAttemptActive = :idAttempt, users_items.sHintsRequested = groups_attempts.sHintsRequested, users_items.nbHintsCached = groups_attempts.nbHintsCached WHERE users_items.idUser = :idUser AND users_items.idItem = :idItem;");
   $stmt->execute(['idAttempt' => $request['idAttempt'], 'idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem']]);
   Listeners::computeAllUserItems($db);

   $stmt = $db->prepare("SELECT * FROM items WHERE ID = :idItem;");
   $stmt->execute(['idItem' => $request['idItem']]);
   $item = ['data' => (object)$stmt->fetch()];
   $item['data']->bGrayedAccess = false;
   
   $stmt = $db->prepare("SELECT * FROM users_items WHERE idUser = :idUser AND idItem = :idItem;");
   $stmt->execute(['idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem']]);
   $userItem = ['data' => (object)$stmt->fetch()];

   require_once __DIR__.'/../shared/syncUserItems.php';
   require_once __DIR__."/../shared/TokenGenerator.php";
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   @generateUserItemToken($userItem, $tokenGenerator, $item);

   return ['result' => true, 'sToken' => $userItem['data']->sToken];
}


function keepState($request, $db) {
   // Keep the current state/answer

   if($request['isCurrent']) {
      $stmt = $db->prepare("SELECT ID FROM users_answers WHERE idUser = :idUser AND idItem = :idItem AND idAttempt = :idAttempt AND sType = 'Current';");
      $stmt->execute(['idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem'], 'idAttempt' => $request['idAttempt']]);
      if($ID = $stmt->fetchColumn()) {
         $stmt = $db->prepare("UPDATE users_answers SET sState = :sState, sAnswer = :sAnswer, sSubmissionDate = NOW() WHERE ID = :id;");
         $stmt->execute(['id' => $ID, 'sState' => $request['sState'], 'sAnswer' => $request['sAnswer']]);
      } else {
         $stmt = $db->prepare("INSERT INTO users_answers (ID, idUser, idItem, idAttempt, sType, sState, sAnswer, sSubmissionDate) VALUES (:id, :idUser, :idItem, :idAttempt, 'Current', :sState, :sAnswer, NOW());");
         $stmt->execute(['id' => getRandomId(), 'idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem'], 'idAttempt' => $request['idAttempt'], 'sState' => $request['sState'], 'sAnswer' => $request['sAnswer']]);
      }
   } else {
      $stmt = $db->prepare("SELECT ID FROM users_answers WHERE idItem = :idItem AND idAttempt = :idAttempt AND sState = :sState AND sAnswer = :sAnswer AND sType = 'Saved' ORDER BY sSubmissionDate DESC;");
      $stmt->execute(['idItem' => $request['idItem'], 'idAttempt' => $request['idAttempt'], 'sState' => $request['sState'], 'sAnswer' => $request['sAnswer']]);
      if($ID = $stmt->fetchColumn()) {
         $stmt = $db->prepare("UPDATE users_answers SET sSubmissionDate = NOW() WHERE ID = :id;");
         $stmt->execute(['id' => $ID]);
      } else {
         $stmt = $db->prepare("INSERT INTO users_answers (ID, idUser, idItem, idAttempt, sType, sState, sAnswer, sSubmissionDate) VALUES (:id, :idUser, :idItem, :idAttempt, 'Saved', :sState, :sAnswer, NOW());");
         $stmt->execute(['id' => getRandomId(), 'idUser' => $_SESSION['login']['ID'], 'idItem' => $request['idItem'], 'idAttempt' => $request['idAttempt'], 'sState' => $request['sState'], 'sAnswer' => $request['sAnswer']]);
      }
   }

   return ['result' => true];
}


function getHistory($request, $db) {
   $stmt = $db->prepare("
      SELECT users_answers.*
      FROM users_answers
      WHERE users_answers.idAttempt = :idAttempt");
   $stmt->execute(['idAttempt' => $request['idAttempt']]);
   return ['result' => true, 'history' => $stmt->fetchAll()];
}


function getTeamUsers($request, $db) {
   // Get users belonging to a team in common
   $stmt = $db->prepare("
      SELECT users.ID, users.sLogin, users.sFirstName, users.sLastName
      FROM users
      JOIN groups_groups ON groups_groups.idGroupChild = users.idGroupSelf
      JOIN (SELECT gt.ID FROM groups AS gt JOIN groups_groups AS ggteams ON gt.ID = ggteams.idGroupParent WHERE ggteams.idGroupChild = :idGroupSelf AND gt.sType = 'Team') AS teams ON teams.ID = groups_groups.idGroupParent");
   $stmt->execute(['idGroupSelf' => $_SESSION['login']['idGroupSelf']]);

   $users = [];
   while($user = $stmt->fetch()) {
      $users[$user['ID']] = $user;
   }
   return ['result' => true, 'teamUsers' => $users];
}


function getUsersAnswers($request, $db) {
   $thread = null;
   if(isset($request['idThread']) && $request['idThread']) {
      $stmt = $db->prepare("SELECT ID, idItem, idUserCreated FROM threads WHERE ID = :id;");
      $stmt->execute(['id' => $request['idThread']]);
      $thread = $stmt->fetch();
      if(!$thread) {
         return ['result' => false];
      }
      $idUser = $thread['idUserCreated'];
      $idItem = $thread['idItem'];
   } else {
      $idUser = $request['idUser'];
      $idItem = $request['idItem'];
   }

   if($idUser != $_SESSION['login']['ID']) {
      if(!$thread) {
         // Check user is admin of a group with that user
         $query = "select groups_ancestors.ID from groups_ancestors join users on groups_ancestors.idGroupChild = users.idGroupSelf where groups_ancestors.idGroupAncestor = :idGroupOwned and users.ID = :idUser;";
         $stmt = $db->prepare($query);
         $stmt->execute([
            'idGroupOwned' => $_SESSION['login']['idGroupOwned'],
            'idUser' => $idUser
         ]);
         $test = $stmt->fetchColumn();
         if (!$test) {
            error_log('warning: user '.$_SESSION['login']['ID'].' tried to access users_answers for user '.$idUser.' without permission.');
            return [];
         }
      }

      // Checking if user can access this item; TODO :: maybe check descendants of groupOwned too?
      $query = "SELECT users_items.ID, users_items.bValidated as bValidated, MAX(`groups_items`.`bCachedAccessSolutions`) as bAccessSolutions
      FROM users_items
      JOIN groups_items on groups_items.idItem = :idItem
      JOIN groups_ancestors as selfGroupAncestors on selfGroupAncestors.idGroupAncestor = groups_items.idGroup
      WHERE users_items.idItem = :idItem and users_items.idUser = :idUser
            AND (`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1 OR groups_items.bOwnerAccess = 1 OR groups_items.bManagerAccess = 1)
            AND `selfGroupAncestors`.`idGroupChild` = :idGroupSelf
      group by users_items.ID;";
      $stmt = $db->prepare($query);
      $stmt->execute([
         'idUser' => $_SESSION['login']['ID'],
         'idItem' => $idItem,
         'idGroupSelf' => $_SESSION['login']['idGroupSelf']
      ]);
      $test = $stmt->fetch();
      if (!$test || (!$test['bValidated'] && !$test['bAccessSolutions'])) {
         error_log('warning: user '.$_SESSION['login']['ID'].' tried to access users_answers for item '.$idItem.' without permission.');
         error_log(json_encode($test));
         return ['result' => false];
      }
   }
   $stmt = $db->prepare("SELECT * FROM users_answers WHERE idUser = :idUser AND idItem = :idItem;");
   $stmt->execute(['idUser' => $idUser, 'idItem' => $idItem]);
   return ['result' => true, 'usersAnswers' => $stmt->fetchAll()];
}


if ($request['action'] == 'askValidation') {
   askValidation($request, $db);
} elseif ($request['action'] == 'askHint') {
   askHint($request, $db);
} elseif ($request['action'] == 'graderResult' || $request['action'] == 'graderReturn') {
   graderResult($request, $db);
} elseif ($request['action'] == 'getToken') {
   echo json_encode(getToken($request, $db));
} elseif ($request['action'] == 'createAttempt') {
   echo json_encode(createAttempt($request, $db));
} elseif ($request['action'] == 'selectAttempt') {
   echo json_encode(selectAttempt($request, $db));
} elseif ($request['action'] == 'keepState') {
   echo json_encode(keepState($request, $db));
} elseif ($request['action'] == 'getHistory') {
   echo json_encode(getHistory($request, $db));
} elseif ($request['action'] == 'getTeamUsers') {
   echo json_encode(getTeamUsers($request, $db));
} elseif ($request['action'] == 'getUsersAnswers') {
   echo json_encode(getUsersAnswers($request, $db));
}
