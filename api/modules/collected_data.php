<?php
require_once __DIR__.'/../../vendor/autoload.php';
require_once __DIR__.'/../../shared/connect.php';
require_once __DIR__.'/../../config.php';

session_start();

$logged_user_id = null;
if(isset($_SESSION['login']) &&
    $_SESSION['login']['tempUser'] === 0 &&
    $_SESSION['login']['ID']) {
        $logged_user_id = $_SESSION['login']['idUser'];
}

$requested_user_id = isset($_REQUEST['user_id']) ? (int) $_REQUEST['user_id'] : false;
if(!$requested_user_id) {
    die('Missed user_id param.');
}
if($logged_user_id !== $requested_user_id) {
    session_destroy();
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

$url = $config->shared->domains['default']->baseUrl.'/profile/myAccount#collected_data_controls';
header('Location: '.$url);
die();