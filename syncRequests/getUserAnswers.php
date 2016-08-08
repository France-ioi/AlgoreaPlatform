<?php

class getUserAnswers {
   public static function getSyncRequests($requestSet, $minServerVersion) {
      global $db;
      if (!isset($requestSet['idItem']) || !isset($requestSet['idUser'])) {
         error_log('getUserAnswers requestSet with no idItem or no idUser argument.');
         return [];
      }

      $idUser = $requestSet['idUser'];
      $idItem = $requestSet['idItem'];

      $query = "select groups_ancestors.ID from groups_ancestors join users on groups_ancestors.idGroupChild = users.idGroupSelf where groups_ancestors.idGroupAncestor = :idGroupOwned and users.ID = :idUser;";
      $stmt=$db->prepare($query);
      $stmt->execute([
         'idGroupOwned' => $_SESSION['login']['idGroupOwned'],
         'idUser' => $idUser
      ]);
      $test = $stmt->fetchColumn();
      if (!$test) {
         error_log('warning: user '.$_SESSION['login']['ID'].' tried to access users_answers for user '.$requestSet['idUser'].' without permission.');
         return [];
      }

      // checking if user can access this item: TODO: maybe check descendants of groupOwned too?
      $query = "select users_items.ID, users_items.bValidated as bValidated,  MAX(`groups_items`.`bCachedAccessSolutions`) as bAccessSolutions from threads
      join groups_items on groups_items.idItem = :idItem
      join users_items on users_items.idItem = :idItem and users_items.idUser = :idUser
      join groups_ancestors as selfGroupAncestors on selfGroupAncestors.idGroupAncestor = groups_items.idGroup
      where
      ((`groups_items`.`bCachedGrayedAccess` = 1 OR `groups_items`.`bCachedPartialAccess` = 1 OR `groups_items`.`bCachedFullAccess` = 1) AND `selfGroupAncestors`.`idGroupChild` = :idGroupSelf) group by users_items.ID;";
      $stmt=$db->prepare($query);
      $stmt->execute([
         'idUser' => $_SESSION['login']['ID'],
         'idItem' => $idItem,
         'idGroupSelf' => $_SESSION['login']['idGroupSelf']
      ]);
      $test = $stmt->fetch();
      if (!$test || (!$test['bValidated'] && !$test['bAccessSolutions'])) {
         error_log('warning: user '.$_SESSION['login']['ID'].' tried to access users_answers for item '.$idItem.' without permission.');
         error_log(json_encode($test));
         return [];
      }

      $base_requests = syncGetTablesRequests(array('users_answers' => true), false);

      $requests = [];
      $requests['getUserAnswersSelf'] = $base_requests['users_answers'];
      $requests['getUserAnswersSelf']['filters']['idItem'] = $idItem;
      $requests['getUserAnswersSelf']['filters']['idUser'] = $idUser;

      foreach($requests as $requestName => &$request) {
         $request['requestSet'] = ['name' => 'getUserAnswers'];
         if (isset($requestSet['minVersion'])) {
            $request['minVersion'] = $requestSet['minVersion'];
         } else {
            $request['minVersion'] = $minServerVersion;
         }
      }

      return $requests;

   }
}
