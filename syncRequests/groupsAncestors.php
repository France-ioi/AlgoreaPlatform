<?php

class groupsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups' => true));
      $request = $request['groups'];
      $request["model"]["filters"] =  array(
         "myGroupAncestors" => array(
            "joins" => array("myGroupAncestors"),
            "condition"  => '`[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf',
         )
      );
      $request["filters"]["myGroupAncestors"] = array(
         "values" => array(
            'idGroupSelf' => $_SESSION['login']['idGroupSelf']
         ),
         "mode" => array("select" => true)
      );
      $request["debug"] = true;
      $request["requestSet"] = array("name" => "groupsAncestors");
      return array("groupsAncestors" => $request);
   }
}
