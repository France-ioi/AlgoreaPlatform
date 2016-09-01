<?php

class getThread {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db;
      if (!isset($requestSet['idThread'])) {
         error_log('getThread requestSet with no idThread argument.');
         return [];
      }

      $requests = syncGetTablesRequests(array('messages' => true, 'users_answers' => true, 'users_items' => true, 'users_threads' => true, 'items' => true, 'items_strings' => true, 'threads' => true), false);
      $requests['messages']["requestSet"] = array("name" => "getThread");
      $requests['users_answers']["requestSet"] = array("name" => "getThread");
      $requests['users_items']["requestSet"] = array("name" => "getThread");
      $requests['users_threads']["requestSet"] = array("name" => "getThread");
      $requests['items']["requestSet"] = array("name" => "getThread");
      $requests['threads']["requestSet"] = array("name" => "getThread");
      $requests['items_strings']["requestSet"] = array("name" => "getThread");
      $requests['my_users_items'] = $requests['users_items'];
      $requests['other_users_items'] = $requests['users_items'];
      unset($requests['users_items']);
      $minVersion = $minServerVersion;
      if (isset($requestSet["minVersion"])) {
         $minVersion = intval($requestSet["minVersion"]);
      }
      $requests['messages']["minVersion"] = $minVersion;
      $requests['users_answers']["minVersion"] = $minVersion;
      $requests['my_users_items']["minVersion"] = $minVersion;
      $requests['other_users_items']["minVersion"] = $minVersion;
      $requests['users_threads']["minVersion"] = $minVersion;
      $requests['items']["minVersion"] = $minVersion;
      $requests['threads']["minVersion"] = $minVersion;
      $requests['items_strings']["minVersion"] = $minVersion;

      // if thread is not safe, no request will be return
      $requests['messages']['filters']['idThread'] = array(
         'values' => ['idThread' => $requestSet['idThread']],
      );
      $requests['users_threads']['filters']['idThread'] = $requestSet['idThread'];
      $requests['users_threads']['filters']['idUser'] = array(
         'values' => ['idUser' => $_SESSION['login']['ID']],
      );
      $requests['threads']['filters']['idThread'] = array(
         'values' => ['idThread' => $requestSet['idThread']],
      );

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

         // the idea here is to fetch some values from users's user_item and other user's user_item
         // so that we can build a token once we get the results
         $requests['my_users_items']['filters']['idItem'] = $idItem;
         $requests['other_users_items']['filters']['idItem'] = $idItem;
         $requests['my_users_items']['filters']['idUser'] = array(
            'values' => ['idUser' => $_SESSION['login']['ID']],
         );
         $requests['other_users_items']['filters']['idUser'] = array(
            'values' => ['idUser' => $thread['idUserCreated']],
         );

         $requests['users_answers']['filters']['idItem'] = array('values' => array('idItem' => $idItem));
         $requests['users_answers']['filters']['accessible'] = array('values' => array('idUser' => $thread['idUserCreated']));
         $requests['items']['filters']['idItem'] = array('values' => array('idItem' => $idItem));
         $requests['items_strings']['filters']['idItem'] = array('values' => array('idItem' => $idItem));

         //$requests["users_items"]['model']["fields"]['bAccessSolutions'] = array('sql' => 'MAX(`groups_items`.`bCachedAccessSolutions`)');
         $res = [
            'threadMessages' => $requests['messages'], 
            'threadAnswers' => $requests['users_answers'],
            'threadMyUserItem' => $requests['my_users_items'],
            'threadOtherUserItem' => $requests['other_users_items'],
            'threadUserThread' => $requests['users_threads'],
            'threadItem' => $requests['items'],
            'threadItemStrings' => $requests['items_strings'],
            'threadThread' => $requests['threads'],
         ];
         if ($thread['idUserCreated'] == $_SESSION['login']['ID']) {
            unset($res['other_users_items']);
         }
         return $res;
      } else {
         return ['threadMessages' => $requests['messages'], 'threadUserThread' => $requests['users_threads'], 'threadThread' => $requests['threads']];
      }
   }
}
