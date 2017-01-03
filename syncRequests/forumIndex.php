<?php

// this file is used when fetching the threads on the forum index page
// this is by far the most complex request, it:
//   - handles pagination (TODO)
//   - handles sorting order (done on both the client and the server side) (TODO)
//   - fetches all filters
//   - fetches the current filter of the user and build the request against it (TODO)
//   - differenciate the request according to the current tab (TODO)
//   - add a flag showing if the user can access the thread or not (corresponding to groups_items.bFullAccess || groups_items.bAccessSolutions || users_items.bValidated) (TODO, could be made by splitting the "others" request into two)
//   - fetched counts to be printed in forum, through sync count requests (TODO)

// there is no need to fetch the items_strings.sTitle associated with the thread as the
// title of the thread is already the title of the item

class forumIndex {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db, $config;

      $baseRequests = syncGetTablesRequests(array('threads' => true, 'users_threads' => true, 'filters' => true, 'users_items' => true), false);

      //$filterId = $requestSet['filterId']; // TODO: use filters
      // To build the request against filter.idGroup and filter.idItem, use the "groupDescendants" and "idItemAncestor" sync filters of threads

      // TODO: use the 'globalFilter' argument of $requestSet if no filterId is provided (or combine them? I don't know)
      //       possible values are:
      //          * 'favorites' (selecting threads with users_threads.bStarred)
      //          * 'all' (doing nothing)
      //          * 'unread' (no users_threads or users_threads.sLastReadDate = NULL)
      //          * 'participated' (users_threads.bParticipated)

      // TODO: use the 'tab' argument of $requestSet, possible values:
      //          * 'helpOthers': threads.sType == 'Help' && threads.idUserCreated != $_SESSION['login']['ID']
      //          * 'getHelp': threads.sType == 'Help' && threads.idUserCreated == $_SESSION['login']['ID']
      //          * 'general': threads.sType == 'General'
      //          * 'technicalSupport': threads.sType == 'Bug'

      $requests = [];

      $baseRequests['users_threads']['filters']['accessible'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];
      $baseRequests['threads']['model']['fields']['sUserCreatedLogin'] = ['tableName' => 'users', 'fieldName' => 'sLogin', 'readOnly' => true];
      $baseRequests['threads']['fields'][] = 'sUserCreatedLogin';

      // the forumIndex_threads_general request fetches all the general threads (type Bug or General)
      $requests['forumIndex_threads_general'] = $baseRequests['threads'];
      // the forumIndex_threads_mine fetches all the threads started by the user
      $requests['forumIndex_threads_mine'] = $baseRequests['threads'];
      // fetches the threads started by others on items I can see (even grayed)
      $requests['forumIndex_threads_others'] = $baseRequests['threads'];

      // TODO: select _general, _mine and _other according to selected tab

	   $requests['forumIndex_users_threads'] = $baseRequests['users_threads'];
      $requests['forumIndex_filters'] = $baseRequests['filters'];
      //$requests['itemsDescendants_groups_items'] = $baseRequests['groups_items']; not necessary for now
      
      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'forumIndex'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      $requests['forumIndex_filters']['filters']['accessible'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];
	   $requests['forumIndex_threads_general']['filters']['generalRead'] = ['values' => []];
      $requests['forumIndex_threads_mine']['filters']['mine'] = ['values' => ['idUser' => $_SESSION['login']['ID']]];
      $requests['forumIndex_threads_others']['filters']['accessibleHelp'] = ['values' => ['idGroupSelf' => $_SESSION['login']['idGroupSelf']]];

	   return $requests;
	}
}
