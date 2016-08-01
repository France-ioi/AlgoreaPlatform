<?php

class groupAdmin {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      $baseRequests = syncGetTablesRequests(array('groups' => true, 'groups_groups' => true, 'users' => true, 'users_items' => true, 'threads' => true), false);

      $groupId = $requestSet['groupId'];
      $itemId = $requestSet['itemId'];

      // TODO: check if user can access this group and item

      $requests = [];
      $requests['groupAdminThreadsDescendants'] = $baseRequests['threads'];
      $requests['groupAdminGroupsParents'] = $baseRequests['groups'];
      $requests['groupAdminGroupsDescendants'] = $baseRequests['groups'];
      $requests['groupAdminGroupsInvited'] = $baseRequests['groups'];
      $requests['groupAdminGroupsGroupsParents'] = $baseRequests['groups_groups'];
      $requests['groupAdminGroupsGroupsDescendants'] = $baseRequests['groups_groups'];
      $requests['groupAdminGroupsGroupsInvited'] = $baseRequests['groups_groups'];
      $requests['groupAdminUsersAncestors'] = $baseRequests['users'];
      $requests['groupAdminUsersDescendants'] = $baseRequests['users'];
      $requests['groupAdminUsersInvited'] = $baseRequests['users'];
      $requests['groupAdminUsersItemsDescendants'] = $baseRequests['users_items'];

      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'groupAdmin'];
         if (isset($requestSet['minServerVersion'])) {
            $request['minVersion'] = $requestSet['minServerVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      $requests['groupAdminThreadsDescendants']["filters"]["groupDescendants"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminThreadsDescendants']["filters"]["itemDescendants"] = ['values' => ['idItem' => $itemId]];
      $requests['groupAdminGroupsParents']["filters"]["parents"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminGroupsDescendants']["filters"]["descendants"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminGroupsInvited']["filters"]["invited"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminGroupsGroupsDescendants']['filters']['descendantsRead'] = ['values' => ['idGroupOwned' => $groupId]];
      $requests['groupAdminGroupsGroupsParents']['filters']['parents'] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminGroupsGroupsInvited']['filters']['invited'] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminUsersAncestors']["filters"]["ancestorsOwned"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminUsersDescendants']["filters"]["descendants"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminUsersInvited']["filters"]["invited"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminUsersItemsDescendants']["filters"]["groupDescendants"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupAdminUsersItemsDescendants']["filters"]["itemsDescendants"] = ['values' => ['idItem' => $itemId]];
      $requests['groupAdminGroupsGroupsParents']['debugLogFunction'] = myDebugFunction;
      return $requests;
   }
}
