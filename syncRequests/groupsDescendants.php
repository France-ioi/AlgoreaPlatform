<?php

class groupsDescendants {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      $baseRequests = syncGetTablesRequests(array('groups' => true, 'groups_groups' => true), false);

      $groupId = $_SESSION['login']['idGroupOwned'];
      $requests = [];
      $requests['groupsDescendants'] = $baseRequests['groups'];
      $requests['groupsGroupsDescendants'] = $baseRequests['groups_groups'];

      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'groupsDescendants'];
         if (isset($requestSet['minServerVersion'])) {
            $request['minVersion'] = $requestSet['minServerVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      $requests['groupsDescendants']["filters"]["descendants"] = ['values' => ['idGroup' => $groupId]];
      $requests['groupsDescendants']["filters"]["sTypeExclude"] = ['modes' => ['select' => true], 'values' => ['sType' => 'UserSelf']];
      $requests['groupsGroupsDescendants']['filters']['descendantsRead'] = ['values' => ['idGroupOwned' => $groupId]];
      $requests['groupsGroupsDescendants']["filters"]["sTypeExclude"] = ['modes' => ['select' => true], 'values' => ['sType' => 'UserSelf']];

      return $requests;
   }
}
