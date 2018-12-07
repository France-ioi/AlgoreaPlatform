<?php

class RemoveUsersClass {

    private $db;
    private $options;
    private $default_options = [
        'baseUserQuery' => 'FROM users WHERE 0',
        'mode' => 'delete',
        'displayOnly' => false,
        'displayFull' => false,
        'output' => true,
        'deleteHistory' => false,
        'deleteHistoryAll' => false
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
        if(!$this->options['displayFull'] && !$this->options['displayOnly'] && strlen($str) > 78) {
            echo substr($str, 0, 75).'...'.PHP_EOL;
        } else {
            echo $str.PHP_EOL;
        }
    }


    public function executeDirectQuery($query) {
        if($this->options['mode'] == 'delete') {
            $fullQuery = "DELETE " . $query;
            $this->output($fullQuery.';');
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $count = $stmt->rowCount();
                $this->output($count . " lines deleted.");
                return $count;
            }
        } elseif($this->options['mode'] == 'count') {
            $fullQuery = "SELECT COUNT(*) " . $query;
            $this->output($fullQuery);
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $count = $stmt->fetchColumn();
                $this->output($count . " lines selected.");
                return $count;
            }
        } else {
            $fullQuery = "SELECT * " . $query;
            $this->output($fullQuery);
        }
        return null;
    }

    public function executeQuery($query) {
        $count = $this->executeDirectQuery(str_replace('[HISTORY]', '', $query));
        if($count !== 0 && $this->options['deleteHistory'] && strpos($query, '[HISTORY]') !== FALSE) {
            $this->executeDirectQuery(str_replace('[HISTORY]', 'history_', $query));
        }
    }

    public function removeHistory($table) {
        $this->executeDirectQuery("FROM history_$table WHERE ID NOT IN (SELECT ID FROM $table)");
    }



    public function execute() {
        //$idUserQuery = "SELECT * FROM pixal.users WHERE `sLogin` LIKE 'ups%' AND NOT EXISTS (SELECT 1 FROM pixal.groups_ancestors WHERE (idGroupAncestor = 109102066123047656 OR idGroupAncestor = 477112099289678181 OR idGroupAncestor = 899084761192596830) AND idGroupChild = users.idGroupSelf)";
        $idUserQuery = "SELECT ID " . str_replace('[HISTORY]', '', $this->options['baseUserQuery']);

        $this->executeQuery("FROM `[HISTORY]users_threads` WHERE idUser IN ( $idUserQuery )");
        $this->executeQuery("FROM `users_answers` WHERE idUser IN ( $idUserQuery )");
        $this->executeQuery("FROM `[HISTORY]users_items` WHERE idUser IN ( $idUserQuery )");

        $idGroupSelfQuery = "SELECT idGroupSelf " . str_replace('[HISTORY]', '', $this->options['baseUserQuery']);
        $idGroupOwnedQuery = "SELECT idGroupOwned " . str_replace('[HISTORY]', '', $this->options['baseUserQuery']);

        $this->db->exec("CREATE TEMPORARY TABLE $this->tmp_table (ID BIGINT)");
        $this->db->exec("INSERT IGNORE INTO $this->tmp_table ($idGroupSelfQuery)");
        $this->db->exec("INSERT IGNORE INTO $this->tmp_table ($idGroupOwnedQuery)");

        $this->executeQuery("FROM `groups_items_propagate` WHERE ID IN (SELECT ID FROM `groups_items` WHERE idGroup IN (SELECT ID FROM $this->tmp_table))");
        $this->executeQuery("FROM `[HISTORY]groups_items` WHERE idGroup IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `[HISTORY]groups_groups` WHERE idGroupChild IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `[HISTORY]groups_groups` WHERE idGroupParent IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `[HISTORY]groups_ancestors` WHERE idGroupChild IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `[HISTORY]groups_ancestors` WHERE idGroupAncestor IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `groups_propagate` WHERE ID IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery("FROM `[HISTORY]groups` WHERE ID IN (SELECT ID FROM $this->tmp_table)");
        $this->executeQuery($this->options['baseUserQuery']);

        if($this->options['deleteHistoryAll']) {
            $this->removeHistory("users_threads");
            $this->removeHistory("users_items");
            $this->removeHistory("groups_items");
            $this->removeHistory("groups_groups");
            $this->removeHistory("groups_ancestors");
            $this->removeHistory("groups");
            $this->removeHistory("users");
        }

    }

}
