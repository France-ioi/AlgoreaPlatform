<?php

class getThread {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db;
      if (!isset($requestSet['idThread'])) {
         error_log('getThread requestSet with no idThread argument.');
         return [];
      }

      $requests = syncGetTablesRequests(array('messages' => true, 'users_items' => true), false);
      $requests['messages']["requestSet"] = array("name" => "getThread");
      $requests['users_items']["requestSet"] = array("name" => "getThread");
      $requests['my_users_items'] = $requests['users_items'];
      $requests['other_users_items'] = $requests['users_items'];
      unset($requests['users_items']);
      $minVersion = $minServerVersion;
      if (isset($requestSet["minVersion"])) {
         $minVersion = intval($requestSet["minVersion"]);
      }
      $requests['messages']["minVersion"] = $minVersion;
      $requests['my_users_items']["minVersion"] = $minVersion;
      $requests['other_users_items']["minVersion"] = $minVersion;

      // if thread is not safe, no request will be return
      $requests['messages']['filters']['idThread'] = $requestSet['idThread'];

      $query = "select ID, idItem, idUserCreated from threads where ID=:ID;";
      $stmt=$db->prepare($query);
      $stmt->execute(['ID' => $requestSet['idThread']]);
      $thread = $stmt->fetch();
      if (!$thread) {
         error_log('warning: user '.$_SESSION['login']['ID'].' tried to access non-existant thread '.$requestSet['idThread'].'.');
         return [];
      }
      $idItem = $thread['idItem'];
      // threads initiated by the user are already fetched in the thread_general request
      if ($idItem) {
         $query = "select threads.ID, threads.idUserCreated, users_items.bValidated as bValidated,  MAX(`groups_items`.`bCachedAccessSolutions`) as bAccessSolutions from threads
         join groups_items on groups_items.idItem = :idItem
         join users_items on users_items.idItem = :idItem and users_items.idUser = :idUser
         join groups_ancestors as selfGroupAncestors on selfGroupAncestors.idGroupAncestor = groups_items.idGroup
         where
         ((`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) AND `selfGroupAncestors`.`idGroupChild` = :idGroupSelf)
         and threads.ID = :ID group by threads.ID;";
         $stmt=$db->prepare($query);
         $stmt->execute([
            'ID' => $requestSet['idThread'],
            'idUser' => $_SESSION['login']['ID'],
            'idItem' => $idItem,
            'idGroupSelf' => $_SESSION['login']['idGroupSelf']
         ]);
         $test = $stmt->fetch();
         if (!$test || (!$test['bValidated'] && !$test['bAccessSolutions'] && $test['idUserCreated'] != $_SESSION['login']['ID'])) {
            error_log('warning: user '.$_SESSION['login']['ID'].' tried to access thread '.$requestSet['idThread'].' without permission.');
            return [];
         }

         $requests['my_users_items']['filters']['idItem'] = $idItem;
         $requests['other_users_items']['filters']['idItem'] = $idItem;
         $requests['my_users_items']['filters']['idUser'] = $_SESSION['login']['ID'];
         $requests['other_users_items']['filters']['idUser'] = $thread['idUserCreated'];

         // the idea here is to fetch some values from users's user_item and other user's user_item
         // so that we can build a token once we get the results

         //$requests["users_items"]['model']["fields"]['bAccessSolutions'] = array('sql' => 'MAX(`groups_items`.`bCachedAccessSolutions`)');
         return [
            'threadMessages' => $requests['messages'], 
            //'threadMyUserItem' => $requests['my_users_items'], not useful for now
            'threadOtherUserItem' => $requests['other_users_items']
         ];
      } else {
         unset($requests['my_users_items']);
         unset($requests['other_users_items']);
         //print_r($requests['messages']);
         return ['threadMessages' => $requests['messages']];
      }
   }
}
