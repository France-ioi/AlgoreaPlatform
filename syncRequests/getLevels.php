<?php

class getLevels {
   public static function getSyncRequests($requestSet, $minServerVersion) {
	   global $config, $db;

	   if (!isset($_SESSION)) {
	      session_start();
	   }
	   if (!count($_SESSION) || !isset($_SESSION['login']) || !isset($_SESSION['login']['ID'])) {
	      return [];
	   }

      $baseRequests = syncGetTablesRequests(array('items' => true, 'items_items' => true, 'users_items' => true, 'items_strings' => true), false);

      $requests = [];
      $requests['getLevels_items'] = $baseRequests['items'];
      $requests['getLevels_items_items'] = $baseRequests['items_items'];
      $requests['getLevels_items_strings'] = $baseRequests['items_strings'];
      $requests['getLevels_users_items'] = $baseRequests['users_items'];
      //$requests['allLevels_groups_items'] = $baseRequests['groups_items']; not necessary for now
      
      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'getLevels'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }
   	
      $domainData = $config->shared->domains['current'];

   	$default_expanded_items = [
   	 	$domainData->ProgressRootItemId,
      	$domainData->PlatformItemId,
      	$domainData->OfficialProgressItemId,
      	$domainData->CustomProgressItemId,
      	$domainData->ContestRootItemId,
      	$domainData->CustomContestRootItemId,
      	$domainData->OfficialContestRootItemId
      ];

	   $items_condition = "(";
	   $first = true;
      foreach ($default_expanded_items as $ID) {
         if (!$first) {
            $items_condition .= ' OR ';
         }
         $first = false;
         $items_condition .= '`[PREFIX]items_items`.`idItemParent` = '.$db->quote($ID).' OR [FIELD] = '.$db->quote($ID);
      }
      $items_condition .= ')';

		$tables = array('items_items' => 'idItemParent', 'items' => 'ID', 'items_strings' => 'idItem', 'users_items' => 'idItem');
	   foreach($tables as $table => $field) {
	      $requests['getLevels_'.$table]["model"]["filters"]["getLevels"] = array(
	         "joins" => array("items_items"),
	         "condition" => str_replace('[FIELD]', '`[PREFIX]'.$table.'`.`'.$field.'`', $items_condition),
	         "ignoreValue" => true
	      );
	      $requests['getLevels_'.$table]["filters"]["getLevels"] = true;
	   }
	   $requests['getLevels_items']["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
	   $requests['getLevels_items_items']["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
	   $requests['getLevels_items_strings']["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
		$requests['getLevels_users_items']["filters"]["idUser"] = array('values' => array('idUser' => $_SESSION['login']['ID']));

	   $requests['getLevels_items']['model']['fields']['bGrayedAccess'] = array('sql' => 'IF (MAX(`groups_items`.`bCachedFullAccess` + `groups_items`.`bCachedPartialAccess`) = 0, 1, 0)', 'join' => 'groups_items');
	   array_push($requests["items"]['fields'], 'bGrayedAccess');
	   $requests['getLevels_users_items']['filters']['idUser'] = array('values' => ['idUser' => $_SESSION['login']['ID']]);

	   return $requests;
	}
}