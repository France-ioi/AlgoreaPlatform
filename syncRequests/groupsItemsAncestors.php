<?php

class groupsItemsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups_items' => true), false);
      $request = $request['groups_items'];
      $request["model"]["fields"]["idGroup"]["groupBy"] = "`groups_items`.`ID`";
      $request["filters"]["ancestorsRead"] = array(
         'modes' => array('select' => true), 
         "values" => array(
            "idGroupSelf" => $_SESSION['login']['idGroupSelf']
         )
      );
      $request["requestSet"] = array("name" => "groupsItemsAncestors");
      return array("groupsItemsAncestors" => $request);
   }
}
