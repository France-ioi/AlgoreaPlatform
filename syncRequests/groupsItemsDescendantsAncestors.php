<?php

class groupsItemsDescendantsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups_items' => true), false);
      $request = $request['groups_items'];
      $request["model"]["fields"]["idGroup"]["groupBy"] = "`groups_items`.`ID`";
      $request["model"]["filters"]["myGroupDescendantsAncestors"] = array(
         "joins" => array("myGroupDescendantsAncestors","myGroupDescendants"),
         "condition"  => '`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned',
      );
      $request["filters"]["myGroupDescendantsAncestors"] = array(
         "values" => array(
            'idGroupOwned' => $_SESSION['login']['idGroupOwned']
         ),
         "mode" => array("select" => true)
      );
      $request["debug"] = true;
      $request["requestSet"] = array("name" => "groupsItemsDescendantsAncestors");
      return array("groupsItemsDescendantsAncestors" => $request);
   }
}
