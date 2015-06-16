<?php

class groupsDescendants {
   public static function getSyncRequests() {
      $request = syncGetTablesRequests(array('groups' => true));
      $request = $request['groups'];
      $request["model"]["filters"]["myGroupDescendants"] = array(
         "joins" => array("myGroupDescendants"),
         "condition"  => '`[PREFIX]myGroupDescendants`.`idGroupAncestor` = :[PREFIX_FIELD]idGroupOwned',
      );
      $request['filters']['addUserID'] = array('modes' => array('select' => true));
      array_push($request["fields"], 'idUser');
      $request['model']['fields']['idUser'] = array('readOnly' => true, 'modes' => array('select' => true), 'joins' => array('users'), 'sql' => '`users`.`ID`');
      $request["filters"]["myGroupDescendants"] = array(
         "values" => array(
            'idGroupOwned' => $_SESSION['login']['idGroupOwned']
         ),
         "mode" => array("select" => true)
      );
      $request["debug"] = true;
      $request["debugLogFunction"] = myDebugFunction;
      $request["requestSet"] = array("name" => "groupsDescendants");
      return array("groupsDescendants" => $request);
   }
}
