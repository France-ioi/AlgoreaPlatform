<?php
require_once __DIR__.'/../../vendor/autoload.php';
require_once __DIR__.'/../../shared/connect.php';
require_once __DIR__.'/../../config.php';

session_start();

function getUserId() {
    if(isset($_SESSION['login']) &&
        $_SESSION['login']['tempUser'] === 0 &&
        $_SESSION['login']['ID']) {
        return $_SESSION['login']['ID'];
    }
    return null;
}



function readTable($table, $idUser) {
    global $db;
    $query = 'select * from `'.$table.'` where `idUser` = :idUser';
    $stmt = $db->prepare($query);
    $stmt->execute(['idUser' => $idUser]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}


function printTable($table, $rows) {
    if(!count($rows)) return;
    echo '<h2>'.$table.'</h2><table>';
    $head_printed = false;
    foreach($rows as $row) {
        if(!$head_printed) {
            $head_printed = true;
            echo '<tr><th>'.implode('</th><th>', array_keys($row)).'</th></tr>';
        }
        echo '<tr><td>'.implode('</td><td>', array_values($row)).'</td></tr>';
    }
    echo '</table>';
}



$idUser = getUserId();
if($idUser === null) {
    // not logged - redirect back to LM and do auth
    try {
        $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
        $authorization_helper = $client->getAuthorizationHelper();
    } catch(Exception $e) {
        die($e->getMessage());
    }
    $_SESSION['ONLOGIN_REDIRECT_URL'] =
        (isset($_SERVER['HTTPS']) ? 'https' : 'http').
        '://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
    $url = $authorization_helper->getUrl();
    header('Location: '.$url);
    die();
}


$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : null;
switch($action) {
    case 'summary':
        echo '<a href="'.$config->login_module_client['base_url'].'/collected_data">Back to login module</a>';
        $rows = readTable('badges', $idUser);
        printTable('badges', $rows);
        break;
    case 'export':
        $data = [
            'badges' => readTable('badges', $idUser)
        ];
        header('Content-disposition: attachment; filename=algorea-profile-export.json');
        header('Content-type: application/json');
        die(json_encode($data));
        break;
    case 'delete':
        die('delete');
        break;
    default:
        die('Action param missed');
        break;
}