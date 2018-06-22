<?php
require_once __DIR__.'/../config.php';
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/RemoveUsersClass.php';
require_once __DIR__.'/../shared/TokenGenerator.php';

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}



// locks
function getLocks() {
    global $db;
    $q = '
        SELECT
            g.lockUserDeletionDate,
            g.sName
        FROM
            groups_ancestors as ga
        JOIN
            groups as g
        ON
            ga.idGroupAncestor = g.ID
        WHERE
            ga.idGroupChild = :idGroupSelf AND
            g.lockUserDeletionDate >= NOW()';
    $stmt = $db->prepare($q);
    $stmt->execute([
        'idGroupSelf' => $_SESSION['login']['idGroupSelf']
    ]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}



// platforms
function getPlatforms() {
    global $db, $config;
    $q = '
        SELECT DISTINCT
            p.ID,
            p.sName,
            p.sBaseUrl as url
        FROM
            users_items as ui
        JOIN
            items as i
        ON
            i.ID = ui.idItem
        JOIN
            platforms as p
        ON
            p.ID = i.idPlatform
        WHERE
            ui.idUser = :idUser AND
            p.sBaseUrl IS NOT NULL AND
            ui.bPlatformDataRemoved = 0';
    $stmt = $db->prepare($q);
    $stmt->execute([
        'idUser' => $_SESSION['login']['ID']
    ]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

/*
//TODO: remove test
$res = [
    [
        'ID' => 1,
        'sName' => 'test',
        'url' => 'http://task-platform.test'
    ]
];
*/
    $tokenGenerator = new TokenGenerator($config->platform->private_key, $config->platform->name);
    foreach($res as &$row) {
        $token = [
            'idUser' => $_SESSION['login']['ID']
        ];
        $p = [
            'sToken' => $tokenGenerator->encodeJWS($token),
            'sPlatform' => $config->platform->name,
            'sCancelUrl' => rtrim($config->shared->domains['current']->baseUrl, '/').'/profile/myAccount#collected_data_controls',
            'sCallbackUrl' => rtrim($config->shared->domains['current']->baseUrl, '/').'/platformCallback.php?idPlatform='.$row['ID']
        ];
        $row['url'] = rtrim($row['url'], '/').'/profile/?'.http_build_query($p);
    }
    return $res;
}


// delete
function deleteAccount() {
    global $db, $config;
    $remover = new RemoveUsersClass($db, [
        'baseUserQuery' => 'FROM users WHERE `ID` = '.$_SESSION['login']['ID'],
        'output' => false
    ]);
    $remover->execute();

    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $manager = $client->getAccountsManager();
    $manager->unlinkClient([
        'user_id' => $_SESSION['login']['idUser']
    ]);

    session_destroy();
}



try {
    if(!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
        throw new Exception('Only identified users can use this feature');
    }


    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;
    switch($action) {
        case 'get_account_data_info':
            $res = [
                'locks' => getLocks(),
                'platforms' => getPlatforms()
            ];
            break;
        case 'delete':
            if($_SERVER['REQUEST_METHOD'] == 'POST' && count(getLocks()) == 0) {
                deleteAccount();
            }
            $res = [
                'redirect' => $config->login_module_client['base_url'].'/collected_data'
            ];
            break;
        default:
            throw new Exception('Action param missed');
            break;
    }

} catch(Exception $e) {
    $res = [
        'error' => $e->getMessage()
    ];
}

header('Content-Type: application/json');
echo json_encode($res);