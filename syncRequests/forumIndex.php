<?php

class forumIndex {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db, $config;

      $baseRequests = syncGetTablesRequests(array('threads' => true, 'users_threads' => true, 'filters' => true, 'users_items' => true), false);

      //$filterId = $requestSet['filterId']; // TODO: use filters

      $requests = [];

      $baseRequests['users_threads']['filters']['accessible'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];
      $baseRequests['threads']['model']['fields']['sUserCreatedLogin'] = ['tableName' => 'users', 'fieldName' => 'sLogin', 'readOnly' => true];
      $baseRequests['threads']['fields'][] = 'sUserCreatedLogin';

      $requests['forumIndex_threads_general_mine'] = $baseRequests['threads'];
      $requests['forumIndex_threads_others'] = $baseRequests['threads'];
	   $requests['forumIndex_users_threads_general_mine'] = $baseRequests['users_threads'];
      $requests['forumIndex_users_threads_others'] = $baseRequests['users_threads'];
      $requests['forumIndex_filters'] = $baseRequests['filters'];
      //$requests['itemsDescendants_groups_items'] = $baseRequests['groups_items']; not necessary for now
      
      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'itemsDescendants'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      $requests['forumIndex_filters']['filters']['accessible'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];
	   $requests['forumIndex_threads_general_mine']['filters']['accessibleGeneralOrMineRead'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];

	   return $requests;
	}
}