<?php

class RemoveUsersClass {

    private $db;
    private $options;
    private $default_options = [
        'baseUserQuery' => 'FROM users WHERE 0',
        'mode' => 'delete',
        'displayOnly' => false,
        'output' => true,
        'delete_history' => false
    ];

    public function __construct($db, $options) {
        $this->db = $db;
        $this->options = array_merge($this->default_options, $options);
        $this->tmp_table = 'tmp__groups_'.mt_rand();
    }


    // is it required?
    public function dropTriggers($table) {
        $this->db->exec("DROP TRIGGER IF EXISTS `delete_".$table."`");
        $this->db->exec("DROP TRIGGER IF EXISTS `custom_delete_".$table."`");
        $this->db->exec("DROP TRIGGER IF EXISTS `before_delete_".$table."`");
        $this->db->exec("DROP TRIGGER IF EXISTS `after_delete_".$table."`");
    }


    private function output($str) {
        if(!$this->options['output']) return;
        echo $str.PHP_EOL;
    }


    public function executeQuery($query) {
        if($this->options['mode'] == 'delete') {
            $fullQuery = "DELETE " . $query;
            $this->output($fullQuery);
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $this->output($stmt->rowCount() . " lines deleted.");
            }
        } elseif($this->options['mode'] == 'count') {
            $fullQuery = "SELECT COUNT(*) " . $query;
            $this->output($fullQuery);
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $this->output($stmt->fetchColumn() . " lines selected.");
            }
        } else {
            $fullQuery = "SELECT * " . $query;
            $this->output($fullQuery);
        }
    }


    public function removeHistory($table) {
        $this->executeQuery("FROM history_$table WHERE ID NOT IN (SELECT ID FROM $table)");
    }



    public function execute() {
        //$idUserQuery = "SELECT * FROM pixal.users WHERE `sLogin` LIKE 'ups%' AND NOT EXISTS (SELECT 1 FROM pixal.groups_ancestors WHERE (idGroupAncestor = 109102066123047656 OR idGroupAncestor = 477112099289678181 OR idGroupAncestor = 899084761192596830) AND idGroupChild = users.idGroupSelf)";
        $idUserQuery = "SELECT ID " . $this->options['baseUserQuery'];

        $this->executeQuery("FROM `users_threads` WHERE idUser IN ( $idUserQuery )");
        $this->executeQuery("FROM `users_answers` WHERE idUser IN ( $idUserQuery )");
        $this->executeQuery("FROM `users_items` WHERE idUser IN ( $idUserQuery )");

        $idGroupSelfQuery = "SELECT idGroupSelf " . $this->options['baseUserQuery'];
        $idGroupOwnedQuery = "SELECT idGroupOwned " . $this->options['baseUserQuery'];

        $this->db->exec("CREATE TEMPORARY TABLE $this->tmp_table (ID BIGINT)");
        $this->db->exec("INSERT IGNORE INTO $this->tmp_table ($idGroupSelfQuery)");
        $this->db->exec("INSERT IGNORE INTO $this->tmp_table ($idGroupOwnedQuery)");

        $this->executeQuery("FROM groups_items_propagate WHERE ID IN (SELECT ID FROM `groups_items` WHERE idGroup IN (SELECT ID FROM $this->tmp_table))");
        $this->executeQuery("FROM `groups_items` WHERE idGroup IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM groups_groups WHERE idGroupParent IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM groups_groups WHERE idGroupChild IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM groups_ancestors WHERE idGroupAncestor IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM groups_ancestors WHERE idGroupChild IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `groups_propagate` WHERE ID IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `groups` WHERE ID IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery($this->options['baseUserQuery']);

        if($this->options['delete_history']) {
            $this->removeHistory("users_threads");
            $this->removeHistory("users_answers");
            $this->removeHistory("users_items");
            $this->removeHistory("groups_items");
            $this->removeHistory("groups_groups");
            $this->removeHistory("groups_ancestors");
            $this->removeHistory("groups");
            $this->removeHistory("users");
        }

    }

}