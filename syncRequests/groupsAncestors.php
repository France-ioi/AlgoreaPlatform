<?php

class groupsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups' => true), false);
      $request = $request['groups'];
/*      $request["model"]["filters"] =  array(
         "myGroupAncestors" => array(
            "joins" => array("myGroupAncestors"),
            "condition"  => '`[PREFIX]myGroupAncestors`.`idGroupChild` = :[PREFIX_FIELD]idGroupSelf',
         ),
         "sTypeExclude" => array(
            "joins" => array(),
            "condition"  => '`[PREFIX]groups`.`sType` != :[PREFIX_FIELD]sType',
         )
      );
      $request["filters"]["myGroupAncestors"] = array(
         "values" => array(
            'idGroupSelf' => $_SESSION['login']['idGroupSelf']
         ),
         "mode" => array("select" => true)
      );*/
      $request["filters"]["ancestors"] = ['values' => ['idGroup' => $_SESSION['login']['idGroupSelf']]];
      $request["filters"]["sTypeExclude"] = ['modes' => ['select' => true], 'values' => ['sType' => 'UserSelf']];
      $request["debug"] = true;
      $request["requestSet"] = array("name" => "groupsAncestors");
      return array("groupsAncestors" => $request);
   }
}
