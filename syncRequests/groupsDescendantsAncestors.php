<?php

class groupsDescendantsAncestors {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups' => true), fase);
      $request = $request['groups'];
      $request["model"]["fields"]["sType"]["groupBy"] = "`groups`.`ID`";
      $request["model"]["filters"]["myGroupDescendantsAncestors"] = array(
         "joins" => array("myGroupDescendantsAncestors","myGroupDescendants"),
         "condition"  => '`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned',
      );
      $request['filters']['addUserID'] = array('modes' => array('select' => true));
      array_push($request["fields"], 'idUser');
      $request['model']['fields']['idUser'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'sql' => '`users`.`ID`');
      $request["filters"]["myGroupDescendantsAncestors"] = array(
         "values" => array(
            'idGroupOwned' => $_SESSION['login']['idGroupOwned']
         ),
         "mode" => array("select" => true)
      );
      $request["debug"] = true;
      $request["requestSet"] = array("name" => "groupsDescendantsAncestors");
      return array("groupsDescendantsAncestors" => $request);
   }
}
