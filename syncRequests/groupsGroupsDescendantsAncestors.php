<?php

class groupsGroupsDescendantsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups_groups' => true), false);
      $request = $request['groups_groups'];
      $request["model"]["fields"]["sType"]["groupBy"] = "`groups_groups`.`ID`";
      $request["model"]["filters"]["myGroupDescendantsAncestors"] =  array(
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
      $request["requestSet"] = array("name" => "groupsGroupsDescendantsAncestors");
      return array("groupsGroupsDescendantsAncestors" => $request);
   }
}
