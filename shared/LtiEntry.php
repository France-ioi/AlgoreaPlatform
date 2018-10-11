<?php
require_once __DIR__.'/../vendor/autoload.php';


class LtiEntry {

    public static function handleRequest() {
        $lti = isset($_POST['lti_message_type']);
        if(!$lti) return;

        $lti_user_id = isset($_SESSION['login']) ? $_SESSION['login']['lti_user_id'] : null;
        if($lti_user_id !== $_POST['user_id']) {
            self::doAuth();
        }
    }


    private static function doAuth() {
        global $config;
        session_destroy();
        session_start();

        $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
        $lti = $client->getLtiInterface();
        $user = $lti->entry($_POST);

        $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $_SESSION['ONLOGIN_REDIRECT_URL'] = $protocol.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];

        $auth_params = [
          'locale' => $config->shared->domains['default']->defaultLanguage,
          'login' => $user['login'],
          'auto_login_token' => $user['auto_login_token']
        ];
        $authorization_helper = $client->getAuthorizationHelper();
        $url = $authorization_helper->getUrl($auth_params);

        header('Location: '.$url);
        die();
    }

}