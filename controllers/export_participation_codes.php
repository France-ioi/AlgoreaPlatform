<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

if(session_status() === PHP_SESSION_NONE){session_start();}
if (!isset($_SESSION) || !isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo "Vous devez être connecté pour pouvoir accéder à cette fonctionnalité";
   return;
}


function getGroup() {
    global $db;

    $group_id = isset($_GET['group_id']) ? $_GET['group_id'] : null;
    if($group_id === null) {
        throw new Exception('Missed param group_id.');
    }

    $query = '
        SELECT
            sPassword,
            sName
        FROM
            groups
        WHERE
            ID=:group_id
        LIMIT 1
    ';
    $stmt = $db->prepare($query);
    $stmt->execute([
       'group_id' => $group_id
    ]);
    $group = $stmt->fetchObject();
    if(!$group) {
        throw new Exception('Group not found.');
    }
    return $group;
}


function getUser($user_id) {
    global $db;
    $query = '
        SELECT
            sFirstName,
            sLastName,
            iGrade
        FROM
            users
        WHERE
            loginID=:user_id
        LIMIT 1
    ';
    $stmt=$db->prepare($query);
    $stmt->execute([
       'user_id' => $user_id
    ]);
    return $stmt->fetchObject();
}


function getGroupUsers($group_id) {
    global $db;
    /*
    $query = '
        SELECT
            u.loginID,
            u.sFirstName,
            u.sLastName,
            u.iGrade
        FROM
            groups_groups AS gg
        JOIN
            users AS u
        ON
            u.idGroupSelf = gg.idGroupChild
        WHERE
            gg.sType = \'direct\' AND
            gg.idGroupParent = :group_id
    ';
    */
    $q = '
        SELECT groups.sName as `group`, users.loginID, users.sFirstName, users.sLastName, users.iGrade
        FROM groups_ancestors
        JOIN users
        ON users.idGroupSelf = groups_ancestors.idGroupChild
        JOIN groups
        ON groups.ID = groups_ancestors.idGroupAncestor
        WHERE groups_ancestors.idGroupAncestor = :group_id
    ';

    $stmt = $db->prepare($q);
    $stmt->execute([
       'group_id' => $group_id
    ]);
    return $stmt->fetchAll();
}


function getUserIds($users) {
    $user_ids = [];
    foreach($users as $user) {
        $user_ids[] = $user['loginID'];
    }
    return $user_ids;
}



function outputCSV($data) {
    $fp = fopen('php://temp', 'w+');
    $row = ['Group', 'First name', 'Last name', 'Grade', 'Participation code'];
    fputcsv($fp, $row);
    foreach($data as $row) {
        fputcsv($fp, $row);
    }
    rewind($fp);
    echo stream_get_contents($fp);
    fclose($fp);
}



try {
    $group_id = isset($_GET['group_id']) ? $_GET['group_id'] : null;
    if($group_id === null) {
        throw new Exception('Missed param group_id.');
    }

    $users = getGroupUsers($group_id);
    $data = [];
    if(count($users)) {
        $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
        $manager = $client->getAccountsManager();
        $res = $manager->participationCodes([
            'user_ids' => getUserIds($users)
        ]);
        if(!$res || !$res['success']) {
            throw new Exception(
                $res && isset($res['error']) ? $res['error'] : 'Login module not responding'
            );
        }
        $codes = $res['data'];

        foreach($users as &$user) {
            $data[] = [
                'group' => $user['group'],
                'sFirstName' => $user['sFirstName'],
                'sLastName' => $user['sLastName'],
                'iGrage' => $user['iGrade'],
                'code' => isset($codes[$user['loginID']]) ? $codes[$user['loginID']] : ''
            ];
        }
    }
} catch(Exception $e) {
    die($e->getMessage());
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-disposition: attachment; filename=participation-codes.csv');
outputCSV($data);