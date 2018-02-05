<?php

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../config.php';

try {
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $redirect_helper = $client->getRedirectHelper();
} catch(Exception $e) {
    die($e->getMessage());
}

if(session_status() === PHP_SESSION_NONE) {
    session_start();
}

$auth_params = [
    'locale' => isset($_GET['locale']) ? $_GET['locale'] : $config->shared->domains['default']->defaultLanguage
];
$groupCodeEnter = isset($_SESSION['groupCodeEnter']) ? $_SESSION['groupCodeEnter'] : null;
if($groupCodeEnter && is_array($groupCodeEnter['login_module_params'])) {
    $auth_params = array_merge($auth_params, $groupCodeEnter['login_module_params']);
}

$action = isset($_GET['action']) ? $_GET['action'] : die('Empty action');
switch($action) {
    case 'login':
        $authorization_helper = $client->getAuthorizationHelper();
        $url = $authorization_helper->getUrl($auth_params);
        break;
    case 'logout':
        $url = $redirect_helper->getLogoutUrl($config->shared->domains['current']->baseUrl.'/login/callback_logout.php');
        break;
    case 'profile':
        $url = $redirect_helper->getProfileUrl($config->shared->domains['current']->baseUrl.'/login/callback_profile.php');
        break;
    case 'badge':
        $url = $redirect_helper->getBadgeUrl($config->shared->domains['current']->baseUrl.'/login/callback_profile.php');
        break;
    case 'password':
        $url = $redirect_helper->getPasswordUrl();
        break;
    case 'auth_methods':
        $url = $redirect_helper->getAuthMethodsUrl();
        break;
    default:
        die('Invalid action');
}
header('Location: '.$url);
