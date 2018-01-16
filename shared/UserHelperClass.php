<?php
require_once __DIR__."/../commonFramework/modelsManager/modelsTools.inc.php"; // for getRandomID
require_once __DIR__."/../commonFramework/sync/syncCommon.php"; // for syncGetVersion
require_once __DIR__."/../login/lib.php";

class UserHelperClass {

    protected $db;

    public function __construct($db) {
        $this->db = $db;
    }

    function createUser($external_user) {
        list($idGroupOwned, $idGroupSelf) = createGroupsFromLogin($this->db, $external_user['login']);
        $id = getRandomID();
        $query = '
            insert into `users` (
                `ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`, `creatorID`
            ) values (
                :ID, :idUser, :sLogin, \'0\', NOW(), :idGroupSelf, :idGroupOwned, :creatorID
            )';
        $stmt = $this->db->prepare($query);
        $creatorID = isset($_SESSION['login']) && is_array($_SESSION['login']) && $_SESSION['login']['ID'] ? $_SESSION['login']['ID'] : null;
        $values = [
            'ID' => $id,
            'idUser' => $external_user['id'],
            'sLogin' => $external_user['login'],
            'idGroupSelf' => $idGroupSelf,
            'idGroupOwned' => $idGroupOwned,
            'creatorID' => $creatorID
        ];
        $stmt->execute($values);
        return $values;
    }


    public function addUserToGroup($idGroupUser, $idGroup) {
        $query = "
            lock tables groups_groups write;
            set @maxIChildOrder = IFNULL((select max(iChildOrder) from `groups_groups` where `idGroupParent` = :idGroup),0);
            insert ignore into
                `groups_groups`
                (`ID`, `idGroupParent`, `idGroupChild`, `iChildOrder`, sType, sStatusDate, iVersion)
            values
                (:ID, :idGroup, :idGroupSelf, @maxIChildOrder+1, 'direct', NOW(), :version);
            unlock tables;";
        $values = array(
            'ID' => getRandomID(),
            'idGroup' => $idGroup,
            'idGroupSelf' => $idGroupUser,
            'version' => syncGetVersion($this->db)
        );

        $stmt = $this->db->prepare($query);
        $stmt->execute($values);

        unset($stmt);
        Listeners::groupsGroupsAfter($this->db);
        return $values;
    }

}