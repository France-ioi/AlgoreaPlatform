<?php

class itemsDescendants {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db, $config;

      $baseRequests = syncGetTablesRequests(array('items' => true, 'items_items' => true, 'users_items' => true, 'users_answers' => true, 'items_strings' => true, 'threads' => true), false);

      $itemId = intval($requestSet['itemId']);

      $justNames = isset($requestSet['justNames']) && !!$requestSet['justNames'];

      if (!$itemId) {
         return [];
      }

      // TODO: check if user can access this group and item

      $requests = [];
      $requests['itemsDescendants_items'] = $baseRequests['items'];
      $requests['itemsDescendants_items_items'] = $baseRequests['items_items'];
      $requests['itemsDescendants_items_strings'] = $baseRequests['items_strings'];
      $requests['itemsDescendants_users_items'] = $baseRequests['users_items'];
      $requests['itemsDescendants_users_answers'] = $baseRequests['users_answers'];
      $requests['itemsDescendants_threads'] = $baseRequests['threads'];
      $requests['itemsDescendants_threads']['filters']['idUserCreated'] = $_SESSION['login']['ID'];
      //$requests['itemsDescendants_groups_items'] = $baseRequests['groups_items']; not necessary for now
      
      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'itemsDescendants'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      $requests["itemsDescendants_items_items"]["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
      $requests["itemsDescendants_items"]["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));

      array_push($requests["itemsDescendants_items"]["fields"], 'bGrayedAccess');
      $requests["itemsDescendants_items"]['model']['fields']['bGrayedAccess'] = array('sql' => 'IF (MAX(`groups_items`.`bCachedFullAccess` + `groups_items`.`bCachedPartialAccess`) = 0, 1, 0)');
      array_push($requests["itemsDescendants_items"]["fields"], 'bAccessSolutions');
      $requests["itemsDescendants_items"]['model']["fields"]['bAccessSolutions'] = array('sql' => 'MAX(`groups_items`.`bCachedAccessSolutions`)');
      $requests["itemsDescendants_items"]["model"]["fields"]["sType"]["groupBy"] = "`items`.`ID`";

      $requests["itemsDescendants_items_strings"]["filters"]["accessible"] = array('values' => array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));

      $requests['itemsDescendants_users_items']['filters']['idUser'] = array(
         'values' => ['idUser' => $_SESSION['login']['ID']],
      );

      $requests["itemsDescendants_items"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));
      $requests["itemsDescendants_items_strings"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));
      $requests["itemsDescendants_items_items"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));
      $requests["itemsDescendants_users_items"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));
      $requests["itemsDescendants_users_answers"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));
      $requests["itemsDescendants_threads"]["filters"]["idItemAncestor"] = array('values' => array('idItemAncestor' => $itemId));

      // returns true if a new sync is needed on groups_items, items, items_strings and users_items
      //         false if no sync is needed on any of these
      //         'user_items' if only a sync on users_items is needed
      function reallyNeedsMainClientSync($db, $params, $minServerVersion) {
         if ($minServerVersion == 0) {
            return true;
         }
         $stmt = $db->prepare('select max(iVersion) from groups_ancestors where idGroupChild = :idGroupSelf');
         $stmt->execute(array('idGroupSelf' => $_SESSION['login']['idGroupSelf']));
         $newAncestorVersion = $stmt->fetchColumn();
         if ($newAncestorVersion > $minServerVersion) {
            return true;
         }

         $stmt = $db->prepare('select max(groups_items.iVersion) from groups_items join groups_ancestors on groups_ancestors.idGroupAncestor = groups_items.idGroup join items_ancestors on items_ancestors.idItemChild = groups_items.idItem where groups_ancestors.idGroupChild = :idGroupSelf and groups_items.idItem = :idItemAncestor;');
         $stmt->execute(array('idGroupSelf' => $minServerVersion, 'idItemAncestor' => $itemId));
         $newGroupItemsVersion = $stmt->fetchColumn();
         if ($newGroupItemsVersion > $minServerVersion) {
            return true;
         }
         $stmt = $db->prepare('select max(users_items.iVersion) from users_items where idUser = :idUser');
         $stmt->execute(array('idUser' => $_SESSION['login']['ID']));
         $newUsersItemsVersion = $stmt->fetchColumn();
         if ($newUsersItemsVersion > $minServerVersion) {
            return 'users_items';
         }
         return false;
      }

      $needsChanges = reallyNeedsMainClientSync($db, $params, $minServerVersion);
      if (!$needsChanges || $needsChanges === 'users_items') {
         foreach($requests as $requestName => $_) {
            if (!$needsChanges || $requestsName != 'itemsDescendants_users_items') {
               unset($requests[$requestsName]);
            }
         }
      }

      if ($justNames) {
         //unset($requests['itemsDescendants_users_items']); possible problems with automatic user items creation
         unset($requests['itemsDescendants_users_answers']);
         unset($requests['itemsDescendants_threads']);
      }

      return $requests;
   }
}
