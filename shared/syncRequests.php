<?php

error_reporting(E_ERROR | E_WARNING | E_PARSE);

require_once __DIR__.'/syncUserItems.php';
require_once(__DIR__.'/../contest/common.php');

function checkExpandedItemResults(&$serverChanges) {
   /* specific to ExpandedItems request: we have marked the records with either
    * modelName (from the request handling expanded items requested at curent
    * version) or modelName_zero (requested at version 0). This function removes
    * records inserted by requests at version 0 that have been deleted by
    * request at current version.
   */
   $tables_to_check = array(
      "items" => true,
      "items_items" => true,
      "items_strings" => true,
      "groups_items" => true
   );
   foreach ($serverChanges as $modelName => $modelServerChanges) {
      if ($tables_to_check[$modelName]) {
         $deleted_records = array();
         foreach ($modelServerChanges["deleted"] as $recordID => $value) {
            if (property_exists($value['data'], 'requestName') && $value['data']->requestName == $modelName) {
               if (isset($modelServerChanges["inserted"][$recordID]) && 
                     property_exists($modelServerChanges["inserted"][$recordID]['data'], 'requestName') &&
                     $modelServerChanges["inserted"][$recordID]['data']->requestName == $modelName.'_zero') {
                  unset($modelServerChanges["inserted"][$recordID]);
               }
            }
         }
      }
   }
}

// will be filled in getSyncRequests
$contestData = null;

function syncAddCustomServerChanges($db, $minServerVersion, &$serverChanges, &$serverCounts, $params) {
   global $contestData;
   if (!empty($_SESSION) && !empty($_SESSION['login'])) {
      $serverChanges['loginData'] = $_SESSION['login'];
   } else {
      $serverChanges['loginData'] = null;
   }
   $serverChanges['contestData'] = $contestData;
   if (empty($_SESSION) || empty($_SESSION['login']) || !isset($_SESSION['login']['ID']) || empty($serverChanges) || (isset($params["requests"]["algorea"]['admin']) && $params["requests"]["algorea"]['admin'] == true)) {
      checkExpandedItemResults($serverChanges);
      return;
   }
   handleUserItems($db, $minServerVersion, $serverChanges, $serverCounts, $params);
   if (!isset($_SESSION['postLoginSyncDone']) || !$_SESSION['postLoginSyncDone']) {
      $_SESSION['postLoginSyncDone'] = true;
   }
}

function handleClientUserItems($db, $minServerVersion, &$clientChanges) {
   $queryCondition = '';
   $first = true;
   foreach($clientChanges['users_items']['updated'] as $id => &$data) {
      if (!$first) {
         $queryCondition .= ' OR ';
      }
      $first = false;
      //unset($data['data']['sToken']);
      if ($_SESSION['login']['ID'] != $data['data']['idUser']) {
         //die ('error: asked to change user_item with idUser='.$data['data']['idUser'].' while session contains idUser='.$_SESSION['login']['ID']);
      }
   }
}


function syncAddCustomClientChanges($db, $minServerVersion, &$clientChanges) {
   if (session_status() === PHP_SESSION_NONE){session_start();}
   if (empty($_SESSION) || empty($_SESSION['login']) || !$_SESSION['login']['ID'] || empty($clientChanges)) {
      return;
   }
   if (!isset($clientChanges['users_items']) || empty($clientChanges['users_items']['updated'])) {
      return;
   } else {
      handleClientUserItems($db, $minServerVersion, $clientChanges);
   }
}

function myDebugFunction($query, $values, $moment = '') {
   global $db;
   $res = $query;
   foreach ($values as $valueName => $value) {
      $res = str_replace(':'.$valueName, $db->quote($value), $res);
   }
   file_put_contents(__DIR__.'/../logs/sync-debug.log', date(DATE_RFC822).'  '.$moment.' '.$res.";\n", FILE_APPEND);
}

function getGroups ($params, &$requests) {
   global $config;
   $idRootSelf = $config->shared->RootSelfGroupId;
   $idRootOwned = $config->shared->RootAdminGroupId;
   $requests['groups_invitations'] = $requests['groups'];
   $requests['groups']["model"]["fields"]["sType"]["groupBy"] = "`groups`.`ID`";
   $requests["groups"]["model"]["filters"]["MyGroupsWrite"] = array(
      "joins" => array("myInvitationsLeft", "myGroupDescendantsLeft"),
      "condition"  => "`[PREFIX]groups`.`sType` != 'UserSelf' AND `[PREFIX]groups`.`sType` != 'UserAdmin' AND `[PREFIX]groups`.`sType` != 'Root' AND `[PREFIX]groups`.`sType` != 'RootSelf'  AND `[PREFIX]groups`.`sType` != 'RootAdmin' AND (`[PREFIX]myInvitationsLeft`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf OR `[PREFIX]myGroupDescendantsLeft`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned)",
   );
   $requests["groups"]["filters"]["MyGroupsWrite"] = array(
      'values' => array(
         'idGroupOwned' => $_SESSION['login']['idGroupOwned'], // TODO: vérifier pour les tempUsers
         'idGroupSelf'  => $_SESSION['login']['idGroupSelf'],
      ),
      'modes' => array('insert' => true, 'update' => true, 'delete' => true),
   );
   $requests["groups"]['model']['fields']['idUser'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'sql' => '`users`.`ID`');
   $requests["groups"]["model"]["filters"]["Mine"] = array(
      "joins" => array("myInvitationsLeft"),
      "condition"  => "(`[PREFIX]myInvitationsLeft`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf OR `[PREFIX]groups`.`ID` = :[PREFIX_FIELD]idGroupOwned OR `[PREFIX]groups`.`ID` = :[PREFIX_FIELD]idGroupSelf)",
   );
   $requests["groups"]["filters"]["Mine"] = array(
      'values' => array(
         'idGroupOwned' => $_SESSION['login']['idGroupOwned'], // TODO: vérifier pour les tempUsers
         'idGroupSelf'  => $_SESSION['login']['idGroupSelf'],
      ),
      'modes' => array('select' => true),
   );

   //$requests["groups_invitations"]['filters']['addUserID'] = array('modes' => array('select' => true));
   array_push($requests["groups_invitations"]["fields"], 'idUser');
   $requests["groups_invitations"]['model']['fields']['idUser'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'table' => 'users', 'fieldName' => 'ID');
   $requests["groups_invitations"]["model"]["filters"]["Invitations"] = array(
      "joins" => array("myInvitations"),
      "condition"  => "(`[PREFIX]myInvitations`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)",
   );
   $requests["groups_invitations"]["filters"]["Invitations"] = array(
      'values' => array(
         'idGroupSelf'  => $_SESSION['login']['idGroupSelf'],
      ),
      'modes' => array('select' => true),
   );

   $requests['groups_groups_invitations'] = $requests['groups_groups'];
   $requests["groups_groups_invitations"]['filters']['addLogin'] = array('modes' => array('select' => true));
   array_push($requests["groups_groups_invitations"]["fields"], 'sChildLogin');
   $requests["groups_groups_invitations"]['model']['fields']['sChildLogin'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'sql' => '`users`.`sLogin`');
   array_push($requests["groups_groups_invitations"]["fields"], 'sUserInvitingLogin');
   $requests["groups_groups_invitations"]['model']['fields']['sUserInvitingLogin'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'sql' => '`userInviting`.`sLogin`');
   //$requests['groups_groups']["model"]["fields"]["idGroupParent"]["groupBy"] = "`groups_groups`.`ID`";
   if (!$_SESSION['login']['tempUser']) {
      $requests['groups_groups']['filters']['descendantsRead'] = array('modes' => array('select' => true), 'values' => array('idGroupOwned' => $_SESSION['login']['idGroupOwned']));
      $requests['groups_groups_invitations']['filters']['invitationsRead'] = array('modes' => array('select' => true), 'values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
      //$requests['groups_groups']['filters']['invitationsAndDescendantsWrite'] = array('modes' => array('insert' => true, 'update' => true, 'delete' => true), 'values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf'], 'idRootSelf' => $idRootSelf, 'idGroupOwned' => $_SESSION['login']['idGroupOwned']));
      // TODO: find a working write filter (commented one can't work due to triggers)
   } else {
      $requests["groups_groups"]['readOnly'] = true;
   }
}

// only fetch public infos if not self
function filterUsers(&$requests) {
   $requests['users']['model']['filters']['me'] = array(
      "joins" => array(),
      "condition"  => "(`[PREFIX]users`.`ID` = :[PREFIX_FIELD]me)",
      "readOnly" => true
   );
   $requests['users']['filters']['me'] = $_SESSION['login']['ID'];
# Uncomment if you want all users but keeping private things private
#   static $privateFields = array('sEmail', 'sCountryCode', 'sTimeZone', 'sBirthDate', 'iGraduationYear', 'sSex', 'sAddress', 'sZipcode', 'sCity', 'sLandLineNumber', 'sCellPhoneNumber', 'sDefaultLanguage', 'sFreeText', 'sWebSite', 'idUserGodfather');
#   foreach($requests['users']['model']['fields'] as $fieldName => &$field) {
#      if ($fieldName == 'sFirstName') {
#            $field = array('sql' => 'IF (`users`.`ID` = '.$_SESSION['login']['ID'].' OR `bPublicFirstName`, `sFirstName`, NULL)');
#      } elseif ($fieldName == 'sLastName') {
#            $field = array('sql' => 'IF (`users`.`ID` = '.$_SESSION['login']['ID'].' OR `bPublicLastName`, `sLastName`, NULL)');
#      } elseif(in_array($fieldName, $privateFields)) {
#            $field = array('sql' => 'IF (`users`.`ID` = '.$_SESSION['login']['ID'].', `'.$fieldName.'`, NULL)');
#      }
#   }
}

function setupExpandedItemsRequests($params, &$requests) {
   global $config, $db;
   $requests["items"]["model"]["fields"]["sType"]["groupBy"] = "`items`.`ID`"; // Could be added to any field. TODO : fix group by system
   $requests["items"]["filters"]["accessible"] = array('modes' => array('select' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));
   $requests["items"]["filters"]["accessibleWrite"] = array('modes' => array('insert' => true, 'update' => true, 'delete' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));

   $requests["items_strings"]["model"]["fields"]["idItem"]["groupBy"] = "`items_strings`.`ID`"; // Could be added to any field. TODO : fix group by system
   $requests["items_strings"]["filters"]["accessible"] = array('modes' => array('select' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));
   $requests["items_strings"]["filters"]["accessibleWrite"] = array('modes' => array('update' => true, 'delete' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));// TODO: write insert filter

   $requests["items_items"]["model"]["fields"]["idItemParent"]["groupBy"] = "`items_items`.`ID`"; // Could be added to any field. TODO : fix group by system
   $requests["items_items"]["filters"]["accessible"] = array('modes' => array('select' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));
   $requests["items_items"]["filters"]["accessibleWrite"] = array('modes' => array('update' => true, 'delete' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));// TODO: write insert filter

   if ($_SESSION['login']['tempUser']) {
      $requests["groups_items"]["readOnly"] = true;
      $requests["groups_items"]["filters"]["myGroupSelf"] = array("values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf']));
   } else {
      $requests["groups_items"]["model"]["joins"]["items_items"] = array("srcTable" => "groups_items", "srcField" => "idItem", "dstField" => "idItemChild");
      $requests["groups_items"]["filters"]["descendantsRead"] = array('modes' => array('select' => true), "values" => array("idGroupOwned" => $_SESSION['login']['idGroupOwned']));
      //$requests["groups_items"]["filters"]["descendantsWrite"] = array('modes' => array('update' => true, 'delete' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf'], "idGroupOwned" => $_SESSION['login']['idGroupOwned']));// TODO: proper filter for write
      $requests["groups_items"]["model"]["fields"]["sType"]["groupBy"] = "`groups_items`.`ID`";
      //$requests['debugLogFunction'] = myDebugFunction;
      //$requests["groups_items"]["debugLogFunction"] = myDebugFunction;
      $requests["users_items"]["model"]["joins"]["items_items"] = array("srcTable" => "groups_items", "srcField" => "idItem", "dstField" => "idItemChild");
      $requests["users_items"]["filters"]["accessible"] = array('modes' => array('select' => true), "values" => array("idGroupSelf" => $_SESSION['login']['idGroupSelf'], "idGroupOwned" => $_SESSION['login']['idGroupOwned']));
      $requests["users_items"]["model"]["fields"]["sType"]["groupBy"] = "`users_items`.`ID`";
      //$requests["groups_groups"]["debugLogFunction"] = myDebugFunction;
      //$requests["users_items"]["debugLogFunction"] = myDebugFunction;
   }

   $expanded_items = array();
   $expanded_items_zero = array();
   // all these items are fetched in the first sync to make user experience smoother
   // TODO: do not sync them after first sync
   $default_expanded_items = array($config->shared->RootItemId);
   foreach ($config->shared->domains as $_ => $domainData) {
      $default_expanded_items[] = $domainData->ProgressRootItemId;
      $default_expanded_items[] = $domainData->PlatformItemId;
      $default_expanded_items[] = $domainData->OfficialProgressItemId;
      $default_expanded_items[] = $domainData->CustomProgressItemId;
      $default_expanded_items[] = $domainData->ContestRootItemId;
      $default_expanded_items[] = $domainData->CustomContestRootItemId;
      $default_expanded_items[] = $domainData->OfficialContestRootItemId;
   }

   if (isset($params["requests"]) && isset($params["requests"]["expandedItems"])) {
      foreach ($params["requests"]["expandedItems"] as $ID => $expandedItem) {
         if ($ID != 'minVersion' || $ID != 'resetMinVersion') {
            if (intval($expandedItem['minVersion']) == 0) {
               $expanded_items_zero[$ID] = true;
            } else {
               $expanded_items[$ID] = true;
            }
         }
      }
   }

   foreach ($default_expanded_items as $ID) {
      if (count($expanded_items) && $expanded_items_zero[$ID] != true) {
         $expanded_items[$ID] = true;
      } else {
         $expanded_items_zero[$ID] = true;
      }
   }

   // handling first sync correctly
   if (!count($expanded_items)) {
      $expanded_items = $expanded_items_zero;
      $expanded_items_zero = array();
   }

   $parents_condition = "(";
   $first = true;
   foreach ($expanded_items as $ID => $nothing) {
      if (!$first) {
         $parents_condition .= ' OR ';
      }
      $first = false;
      $parents_condition .= '`[PREFIX]items_items`.`idItemParent` = '.$db->quote($ID);
   }
   $parents_condition .= ')';

   $parents_condition_zero = "(";
   if (count($expanded_items_zero)) { // not first sync
      $first = true;
      foreach ($expanded_items_zero as $ID => $nothing) {
         if (!$first) {
            $parents_condition_zero .= ' OR ';
         }
         $first = false;
         $parents_condition_zero .= '`[PREFIX]items_items`.`idItemParent` = '.$db->quote($ID);
      }
      $parents_condition_zero .= ')';
   }
   //print_r($expanded_items);
   $tables = array('items_items' => 'idItemParent', 'items' => 'ID', 'items_strings' => 'idItem', 'groups_items' => 'idItem', 'users_items' => 'idItem'/*, 'users_answers' => 'idItem'*/);
   foreach($tables as $table => $field) {
      $requests[$table]["model"]["filters"]["idItemParent"] = array(
         "joins" => array($table == 'items_items' ? null : "items_items"),
         "condition" => $parents_condition,
      );
      $requests[$table]["filters"]["idItemParent"] = array('modes' => array('select' => true), 'values' => array());
      if (count($expanded_items_zero)) {
         $requests['zero_'.$table] = $requests[$table];
         $requests['zero_'.$table]["model"]["filters"]["idItemParent"]["condition"] = $parents_condition_zero;
         $requests['zero_'.$table]["minVersion"] = 0;
         //$requests['zero_'.$table]["debug"] = true;
      }
   }
   if (isset($requests['users_items'])) {
      unset($requests['users_items']);
   }
   if (isset($requests['zero_users_items'])) {
      unset($requests['zero_users_items']);
   }
   //file_put_contents(__DIR__.'/../logs/groups_items.log', date(DATE_RFC822).'  '.json_encode($requests['groups_items'])."\n", FILE_APPEND);
}

function algoreaCustomRequest($params, &$requests, $db, $minServerVersion) {
   global $config;
   if (!count($_SESSION) || !isset($_SESSION['login']) || !isset($_SESSION['login']['ID'])) {
      $requests = array();
      return;
   }

   // syncGetTablesRequests doesn't create requests when hasHistory = false (not sure why),
   // creating it by hand:
   $viewModel = createViewModelFromTable('windows');
   $requests['windows'] = array(
      "modelName" => 'windows',
      "model" => $viewModel,
      "fields" => getViewModelFieldsList($viewModel),
      "filters"  => ["accessible" => array(
         'values' => array('idUser' => $_SESSION['login']['ID']),
      )],
      "countRows" => false
   );
   $requests['windows']['getChanges'] = false;

   $admin = (isset($params["requests"]) && isset($params["requests"]["algorea"]) && isset($params["requests"]["algorea"]['admin']) && $params["requests"]["algorea"]['admin']);
   filterUsers($requests);
   if ( ! $admin) {
      $requests["filters"]["filters"]["accessible"] = array(
            'values' => array('idUser' => $_SESSION['login']['ID']),
         );
      $requests['filters']['writeOnly'] = true;
      $requests['filters']['getChanges'] = false;

      $requests['messages']['filters']['accessibleWrite'] = array(
         'modes' => array('insert' => true, 'update' => true, 'delete' => true), 
         'values' => array('idUser' => $_SESSION['login']['ID']),
      );
      $requests['messages']['writeOnly'] = true;
      $requests['messages']['getChanges'] = false;

      $requests['threads']['filters']['accessibleWrite'] = array(
         'modes' => array('insert' => true, 'update' => true, 'delete' => true), 
         'values' => array('idUser' => $_SESSION['login']['ID']),
      );
      $requests['threads']['writeOnly'] = true;
      $requests['threads']['getChanges'] = false;

      $requests['users_threads']['filters']['accessible'] = array(
         'values' => array('idUser' => $_SESSION['login']['ID']),
      );
      $requests['users_threads']['writeOnly'] = true;
      $requests['users_threads']['getChanges'] = false;

      $requests['items']['filters']['accessibleWrite'] = array(
         'values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']),
      );
      $requests['items']['writeOnly'] = true;
      $requests['items']['getChanges'] = false;

      $requests['items_items']['filters']['accessibleWrite'] = array(
         'values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']),
      );
      $requests['items_items']['writeOnly'] = true;
      $requests['items_items']['getChanges'] = false;

      $requests['items_strings']['filters']['accessibleWrite'] = array(
         'values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']),
      );
      $requests['items_strings']['writeOnly'] = true;
      $requests['items_strings']['getChanges'] = false;

      $requests['users_items']['filters']['idUser'] = $_SESSION['login']['ID'];
      $requests['users_items']['writeOnly'] = true;
      unset($requests['groups_items']);
      unset($requests['users_answers']);
   } else {
      //unset($requests["users_items"]);
      unset($requests["filters"]);
      unset($requests["users_answers"]);
      unset($requests["users_threads"]);
      unset($requests["threads"]);
      unset($requests["messages"]);
      setupExpandedItemsRequests($params, $requests);
   }
   //unset($requests['messages']);
   $requests['users_items']['insertBeforeUpdate'] = true;
   unset($requests["items_ancestors"]);
   unset($requests['languages']);
   //$requests['items_ancestors']['readOnly'] = true;
   //$requests['items_ancestors']['filters']['accessible'] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
   unset($requests["groups_ancestors"]);
   if (!$_SESSION['login']['tempUser']) {
      getGroups($params, $requests);
   } else {
      unset($requests['groups']);
      unset($requests['groups_groups']);
   }
   if (!$config->shared->domains['current']->usesForum) {
      unset($requests['users_threads']);
      unset($requests['threads']);
      unset($requests['messages']);
      unset($requests["filters"]);
   }
}

function getSyncRequests($params, $minServerVersion) {
   global $db, $contestData;
   if (session_status() === PHP_SESSION_NONE){session_start();}
   $contestData = adjustContestAndGetData();
   //echo json_encode($contestData);
   $requests = syncGetTablesRequests(null, false);
   $requests['messages']['lowPriority'] = true;
   $requests['users_threads']['lowPriority'] = true;
   $requests['groups_groups']['lowPriority'] = true;
   // these two aren't used yet, uncomment when ready
   unset($requests['cached_windows_items_access']);
   unset($requests['windows']);
   //var_export($requests);
   algoreaCustomRequest($params, $requests, $db, $minServerVersion);
   //echo json_encode($requests);
   //return [];
   return $requests;
}
