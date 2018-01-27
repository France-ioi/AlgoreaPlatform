<?php

// creating a new user item
function default_user_item_factory($idUser, $item, $insertId) {
   $array = array(
      'ID'     => $insertId,
      'idUser' => $idUser,
      'idItem' => $item['data']->ID,
      'iScore' => 0,
      'iScoreComputed' => 0,
      'iScoreDiffManual' => 0,
      'sScoreDiffComment' => '',
      'nbSubmissionsAttempts' => 0,
      'nbTasksTried' => 0,
      'nbTasksSolved' => 0,
      'nbChildrenValidated' => 0,
      'bValidated' => 0,
      'bFinished' => 0,
      'nbTasksWithHelp' => 0,
      'sHintsRequested' => '',
      'nbHintsCached' => 0,
      'nbCorrectionsRead' => 0,
      'iPrecision' => 0,
      'iAutonomy' => 0,
      'sStartDate' => NULL,
      'sValidationDate' => NULL,
      'sFinishDate' => NULL,
      'sLastActivityDate' => NULL,
      'bRanked' => 0,
      'sAllLangProg' => '*',
      'sType' => $item['data']->sType,
      'sSupportedLangProg' => $item['data']->sSupportedLangProg,
      'bHintsAllowed' => $item['data']->bHintsAllowed,
      'bAccessSolutions' => $item['data']->bAccessSolutions,
      'bGrayedAccess' => $item['data']->bGrayedAccess,
      'sAncestorsComputationState' => 'todo',
      'iVersion' => 0 // TODO: really?
   );
   return array(
     'data' => (object) $array
   );
}

// type is "inserted" or "updated"
function createMissingUserItems($db, &$serverChanges, $type) {
   $userId = $_SESSION['login']['ID'];
   $items_ids = array_keys((array) $serverChanges['items'][$type]);
   $users_items_ids = array();
   if (isset($serverChanges['users_items']) && isset($serverChanges['users_items'][$type]) && count($serverChanges['users_items'][$type])) {
      foreach($serverChanges['users_items'][$type] as $id => $values) {
         $users_items_ids[] = $values['data']->idItem;
      }
   }
   $diff = array_diff($items_ids, $users_items_ids);
   // one big insert request with multiple values
   if (count($diff)) {
      $first = true;
      foreach ($diff as $nothing => $idItem) {
         if (!$first) {$request .= ",";}
         $ID = getRandomID();
         $first = false;
         $serverChanges['users_items'][$type][$ID] = default_user_item_factory($userId, $serverChanges['items'][$type][$idItem], $ID);
      }
   }
}

function generateUserItemToken(&$userItem, $tokenGenerator, $item) {
  global $config;
   static $token_fields = array(
      'bHasAccessCorrection' => null,
      'bAccessSolutions'     => null,
      'bSubmissionPossible'  => null,
      'bHintsAllowed'        => null, // from item
      'bHasSolvedTask'       => null,
      'sHintsRequested'      => null,
      'nbHintsGiven'         => null,
      'idItem'               => null,
      'itemUrl'              => null,
      'idUser'               => null,
      'idAttempt'            => null,
      'bIsAdmin'             => null,
      'bIsDefault'           => null,
      'sSupportedLangProg'   => null,
      'sLogin'               => null,
   );
   if ($item['data']->bUsesAPI && ($item['data']->sType == 'Task' || $item['data']->sType == 'Course')) {
      if (!isset($item['data']->bGrayedAccess) || $item['data']->bGrayedAccess) {
         $userItem['data']->sToken = ''; return;
      }
      $params = array_replace($_SESSION['login'], (array)$userItem['data'], (array)$item['data']);
      $params = array_intersect_key($params, $token_fields);
      $params['idItem'] = $item['data']->sTextId;
      $params['itemUrl'] = $item['data']->sUrl;
      $params['idItemLocal'] = $item['data']->ID;
      // case of a user_item fetched for a forum thread:
      if ($userItem['data']->idUser != $_SESSION['login']['ID']) {
         $params['bSubmissionPossible'] = false;
      } else {
         $params['bSubmissionPossible'] = true;
      }
      $params['idUser'] = $userItem['data']->idUser;
      $params['idAttempt'] = $userItem['data']->idAttemptActive;
      $params['sHintsRequested'] = $userItem['data']->sHintsRequested;
      $params['nbHintsGiven'] = $userItem['data']->nbHintsCached;
      $params['bHintPossible'] = true;
      // platform needs idTask:
      $params['id'.$item['data']->sType] = $params['idItem'];
      $params['bReadAnswers'] = true;

      $bAccessSolutions = ($userItem['data']->bAccessSolutions != '0' || $userItem['data']->bValidated != '0') ? '1': '0';
      $params['bAccessSolutions'] = $bAccessSolutions;

      $params['randomSeed'] = $userItem['data']->idAttemptActive ? $userItem['data']->idAttemptActive : $userItem['data']->idUser;
      $params['platformName'] = $config->platform->name;

      $token = $tokenGenerator->encodeJWS($params);
      $userItem['data']->sToken = $token;
   } else {
      $userItem['data']->sToken = '';
   }
}

// returns all items corresponding to users items in serverChanges
function fetchItemsIfMissing($serverChanges, $db) {
   if (!isset($serverChanges['items'])) {
      $items = array();
   } else {
      $items = array_replace($serverChanges['items']['updated'], $serverChanges['items']['inserted']);
   }
   if (!isset($serverChanges['items'])) {
      $items_ids = array();
   } else {
      $items_ids = array_keys((array) $serverChanges['items']['updated']);
      $items_ids = array_merge($items_ids, array_keys((array) $serverChanges['items']['inserted']));
   }
   $users_items_ids = array();
   if (isset($serverChanges['users_items']) && count($serverChanges['users_items']['updated'])) {
      foreach($serverChanges['users_items']['updated'] as $id => $values) {
         $users_items_ids[] = $values['data']->idItem;
      }
   }
   if (isset($serverChanges['users_items']) && count($serverChanges['users_items']['inserted'])) {
      foreach($serverChanges['users_items']['inserted'] as $id => $values) {
         $users_items_ids[] = $values['data']->idItem;
      }
   }
   foreach ($serverChanges['requestSets'] as &$requestSet) {
      if (isset($requestSet['users_items']) && isset($requestSet['users_items']['inserted'])) {
         foreach ((array) $requestSet['users_items']['inserted'] as $id => $values) {
            $users_items_ids[] = $values['data']->idItem;
         }
      }
      if (isset($requestSet['users_items']) && isset($requestSet['users_items']['updated'])) {
         foreach ((array) $requestSet['users_items']['updated'] as $id => $values) {
            $users_items_ids[] = $values['data']->idItem;
         }
      }
   }

   $missing_item_ids = array_diff($users_items_ids, $items_ids);
   if (count($missing_item_ids)) {
      $query = 'select `items`.`ID`, `items`.`sUrl`, `items`.`bUsesAPI`, `items`.`bHintsAllowed`, `items`.`sSupportedLangProg`, `items`.`sTextId`, MAX(`groups_items`.`bCachedAccessSolutions`) as `bAccessSolutions`, IF (MAX(`groups_items`.`bCachedFullAccess` + `groups_items`.`bCachedPartialAccess`) = 0, 1, 0) as `bGrayedAccess`, `items`.`sType` from `items` join `groups_items` on `groups_items`.`idItem` = `items`.`ID` join `groups_ancestors` on `groups_ancestors`.`idGroupAncestor` = `groups_items`.`idGroup` where `groups_ancestors`.`idGroupChild` = '.$_SESSION['login']['idGroupSelf'].' AND (';
      $first = true;
      foreach ($missing_item_ids as $id) {
         if (!$first) {
            $query .= ' OR ';
         }
         $first = false;
         $query .= '`items`.`ID` = \''.$id.'\'';
      }
      $query .= ') GROUP BY `items`.`ID`;';
      $sth = $db->prepare($query);
      $sth->execute();
      $results = $sth->fetchAll(PDO::FETCH_OBJ);
      foreach($results as $res) {
         $items[$res->ID] = array('data' => $res);
      }
   }
   return $items;
}

function hasMissingUserItems($serverChanges, $mode) {
   if (!isset($serverChanges['items']) || !isset($serverChanges['items'][$mode])) {
      return false;
   }
   if (!isset($serverChanges['users_items']) || !isset($serverChanges['users_items'][$mode])) {
      return true;
   }
   // first implementation used count, but in some cases the request for users_items also fetches
   // users_items for items to which the user doesn't have access anymore, and in vicious cases,
   // the count was the same, although some users_items were missing for actually fetched items
   $users_items_items = [];
   foreach ((array) $serverChanges['users_items']['inserted'] as $userItem) {
      $users_items_items[$userItem['data']->idItem] = true;
   }
   foreach ((array) $serverChanges['items'][$mode] as $item) {
      if (!isset($users_items_items[$item['data']->ID])) {
         return true;
      }
   }
   return false;
}

// returns an array containing the idItem of all the missing user_items
function handleUserItems($db, $minServerVersion, &$serverChanges, &$serverCounts, $params) {
   global $config;
   if (hasMissingUserItems($serverChanges, 'inserted')) {
      createMissingUserItems($db, $serverChanges, 'inserted');
   }
   if (hasMissingUserItems($serverChanges, 'updated')) {
      createMissingUserItems($db, $serverChanges, 'updated');
   }
   // no need for tokens when fetching levels
   if (!isset($params["requests"]["algorea"]['type']) || $params["requests"]["algorea"]['type'] == 'getAllLevels') {
      return;
   }
   $items = fetchItemsIfMissing($serverChanges, $db);
   // then we generate tokens for the user items corresponding to tasks and courses
   require_once(dirname(__FILE__)."/TokenGenerator.php");
   $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
   foreach ($serverChanges['requestSets'] as &$requestSet) {
      if (isset($requestSet['users_items']) && isset($requestSet['users_items']['inserted'])) {
         foreach ((array) $requestSet['users_items']['inserted'] as &$userItem) {
            generateUserItemToken($userItem, $tokenGenerator, $items[$userItem['data']->idItem]);
         }
      }
      if (isset($requestSet['users_items']) && isset($requestSet['users_items']['updated'])) {
         foreach ((array) $requestSet['users_items']['updated'] as &$userItem) {
            generateUserItemToken($userItem, $tokenGenerator, $items[$userItem['data']->idItem]);
         }
      }
   }
   if (isset($serverChanges['users_items']) && isset($serverChanges['users_items']['updated'])) {
      foreach ((array) $serverChanges['users_items']['updated'] as &$userItem) {
         generateUserItemToken($userItem, $tokenGenerator, $items[$userItem['data']->idItem]);
      }
   }
   if (isset($serverChanges['users_items']) && isset($serverChanges['users_items']['inserted'])) {
      foreach ((array) $serverChanges['users_items']['inserted'] as &$userItem) {
         generateUserItemToken($userItem, $tokenGenerator, $items[$userItem['data']->idItem]);
      }
   }
}
