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


    private function output($str) {
        if(!$this->options['output']) return;
        if(!$this->options['displayFull'] && !$this->options['displayOnly'] && strlen($str) > 78) {
            echo substr($str, 0, 75).'...'.PHP_EOL;
        } else {
            echo $str.PHP_EOL;
        }
    }


    public function executeSubQuery($table, $query) {
        if($this->options['mode'] == 'delete') {
            $fullQuery = "DELETE `$table` FROM `$table` $query";
            $this->output($fullQuery.';');
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $count = $stmt->rowCount();
                $this->output($count . " lines deleted.");
                return $count;
            }
        } elseif($this->options['mode'] == 'count') {
            $fullQuery = "SELECT COUNT(*) FROM `$table` $query";
            $this->output($fullQuery);
            if(!$this->options['displayOnly']) {
                $stmt = $this->db->prepare($fullQuery);
                $stmt->execute();
                $count = $stmt->fetchColumn();
                $this->output($count . " lines selected.");
                return $count;
            }
        } else {
            $fullQuery = "SELECT * FROM `$table` $query";
            $this->output($fullQuery);
        }
        return null;
    }

    public function executeQuery($table, $query, $hasHistory=false) {
        $count = $this->executeSubQuery($table, $query);
        if($count !== 0 && $this->options['deleteHistory'] && $hasHistory) {
            $this->executeSubQuery('history_'.$table, str_replace($table, 'history_'.$table, $query));
        }
    }

    public function removeHistory($table) {
        $this->executeDirectQuery("FROM history_$table WHERE ID NOT IN (SELECT ID FROM $table)");
    }



    public function execute() {
        $this->executeQuery('users_threads', 'JOIN users ON users.ID = users_threads.idUser '.$this->options['baseUserQuery'], true);
        $this->executeQuery('users_answers', 'JOIN users ON users.ID = users_answers.idUser '.$this->options['baseUserQuery']);
        $this->executeQuery('users_items', 'JOIN users ON users.ID = users_items.idUser '.$this->options['baseUserQuery'], true);

        $this->executeQuery('groups_items_propagate', 'JOIN groups_items ON groups_items.ID = groups_items_propagate.ID JOIN users ON (groups_items.idGroup = users.idGroupSelf OR groups_items.idGroup = users.idGroupOwned) '.$this->options['baseUserQuery']);
        $this->executeQuery('groups_items', 'JOIN users ON (groups_items.idGroup = users.idGroupSelf OR groups_items.idGroup = users.idGroupOwned) '.$this->options['baseUserQuery'], true);
        $this->executeQuery('groups_groups', 'JOIN users ON (groups_groups.idGroupParent = users.idGroupSelf OR groups_groups.idGroupParent = users.idGroupOwned OR groups_groups.idGroupChild = users.idGroupSelf OR groups_groups.idGroupChild = users.idGroupOwned) '.$this->options['baseUserQuery'], true);
        $this->executeQuery('groups_ancestors', 'JOIN users ON (groups_ancestors.idGroupAncestor = users.idGroupSelf OR groups_ancestors.idGroupAncestor = users.idGroupOwned OR groups_ancestors.idGroupChild = users.idGroupSelf OR groups_ancestors.idGroupChild = users.idGroupOwned) '.$this->options['baseUserQuery'], true);
        $this->executeQuery('groups_propagate', 'JOIN users ON (groups_propagate.ID = users.idGroupSelf OR groups_propagate.ID = users.idGroupOwned) '.$this->options['baseUserQuery']);
        $this->executeQuery('groups', 'JOIN users ON (groups.ID = users.idGroupSelf OR groups.ID = users.idGroupOwned) '.$this->options['baseUserQuery'], true);
        $this->executeQuery('users', ' '.$this->options['baseUserQuery'], true);

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
