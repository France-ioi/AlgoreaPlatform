<?php

class getThread {
   public static function getSyncRequests($requestSet) {
      global $db;
      if (!isset($requestSet['idThread'])) {
         return;
      }

      $requests = syncGetTablesRequests(array('messages' => true, 'users_answers' => true), false);
      $requests['messages']["requestSet"] = array("name" => "getThread");
      $requests['users_answers']["requestSet"] = array("name" => "getThread");
      $minVersion = 0;
      if (isset($requestSet["minVersion"])) {
         $minVersion = intval($requestSet["minVersion"]);
      }
      $requests['messages']["minVersion"] = $minVersion;
      $requests['users_answers']["minVersion"] = $minVersion;

      // if thread is not safe, no request will be return
      $requests['messages']['filters']['idThread'] = $requestSet['idThread'];

      $query = "select ID, idItem, idUserCreated from threads where ID=:ID;";
      $stmt=$db->prepare($query);
      $stmt->execute(['ID' => $requestSet['idThread']]);
      $thread = $stmt->fetch();
      if (!$thread) {
         error_log('warning: user '+$_SESSION['login']['ID']+' tried to access non-existant thread '+$requestSet['idThread']+'.');
         return;
      }
      $idItem = $thread['idItem'];
      // threads initiated by the user are already fetched in the thread_general request
      if ($idItem && $_SESSION['login']['ID'] != $thread['idUserCreated']) {
         $query = "select ID from threads
         join groups_items on groups_items.idItem = threads.idItem
         join groups_ancestors as selfGroupAncestors on groups_ancestors.idGroupAncestor = groups_items.idGroup
         where
         ((`[PREFIX]groups_items`.`bCachedGrayedAccess` = 1 OR `[PREFIX]groups_items`.`bCachedPartialAccess` = 1 OR `[PREFIX]groups_items`.`bCachedFullAccess` = 1) AND `[PREFIX]selfGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf)
         and threads.ID = :ID;";
         $stmt=$db->prepare($query);
         $stmt->execute(['ID' => $requestSet['idThread']]);
         $test = $stmt->fetch();
         if (!$test) {
            error_log('warning: user '+$_SESSION['login']['ID']+' tried to access thread '+$requestSet['idThread']+' without permission.');
            return;
         }
         $requests['users_answers']['filters']['accessible'] = $thread['idUserCreated'];
         return ['threadMessages' => $requests['messages'], 'threadAnswers' => $requests['users_answers']];
      } else {
         unset($requests['users_answers']);
         //print_r($requests['messages']);
         return ['threadMessages' => $requests['messages']];
      }
   }
}
