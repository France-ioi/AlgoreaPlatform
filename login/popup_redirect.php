<?php

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../config.php';

try {
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $redirect_helper = $client->getRedirectHelper();
} catch(Exception $e) {
    die($e->getMessage());
}


$action = isset($_GET['action']) ? $_GET['action'] : die('Empty action');
switch($action) {
    case 'login':
        $authorization_helper = $client->getAuthorizationHelper();
        $url = $authorization_helper->getUrl();
        break;
    case 'logout':
        $url = $redirect_helper->getLogoutUrl($config->shared->domains['default']->baseUrl.'/login/callback_logout.php');
        break;
    case 'profile':
        $url = $redirect_helper->getProfileUrl($config->shared->domains['default']->baseUrl.'/login/callback_profile.php');
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