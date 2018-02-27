<?php

class groupAdmin {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db;
      $baseRequests = syncGetTablesRequests(array('groups' => true, 'groups_groups' => true, 'users' => true, 'users_items' => true, 'threads' => true, 'groups_login_prefixes' => true), false);

      $groupId = $requestSet['groupId'];
      $itemId = $requestSet['itemId'];

      if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
         return;
      }

      $query = "select ID from groups_ancestors where idGroupAncestor = :idGroupOwned and idGroupChild = :mainGroupId;";
      $stmt=$db->prepare($query);
      $stmt->execute([
         'idGroupOwned' => $_SESSION['login']['idGroupOwned'],
         'mainGroupId' => $groupId
      ]);
      $test = $stmt->fetchColumn();
      if (!$test) {
         error_log('warning: user '.$_SESSION['login']['ID'].' tried syncRequest groupAdmin with group '.$groupId.' without permission.');
         return []; // TODO: proper error message?
      }

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
      $requests['groupAdminGroupsLoginPrefixes'] = $baseRequests['groups_login_prefixes'];

      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'groupAdmin'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
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
      $requests['groupAdminGroupsLoginPrefixes']['filters']['group'] = ['values' => ['idGroup' => $groupId]];
      return $requests;
   }
}
