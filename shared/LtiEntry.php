<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/LoginTokenEntry.php';

class LtiEntry {

    public static function handleRequest() {
        $lti = isset($_POST['lti_message_type']);
        if(!$lti) return;

        $lti_user_id = null;
        if(isset($_SESSION['login']) && isset($_SESSION['login']['lti_user_id'])) {
            $lti_user_id = $_SESSION['login']['lti_user_id'];
        }
        if($lti_user_id !== $_POST['user_id']) {
            self::doAuth();
        }
    }


    private static function doAuth() {
        global $config;
        session_destroy();
        session_start();

        $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? 'https' : 'http';
        $url = $protocol.'://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
        $params = [
            'post_params' => $_POST,
            'http_method' => $_SERVER['REQUEST_METHOD'],
            'http_url' => $url
        ];
        try {
            $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
            $lti = $client->getLtiInterface();
            $res = $lti->entry($params);
        } catch (\Exception $e) {
            die($e->getMessage());
        }
        LoginTokenEntry::apply($token);
/*
        $_SESSION['ONLOGIN_REDIRECT_URL'] = $url;
        $auth_params = [
          'locale' => $config->shared->domains['default']->defaultLanguage,
          'login' => $user['login'],
          'auto_login_token' => $user['auto_login_token']
        ];
        $authorization_helper = $client->getAuthorizationHelper();
        $url = $authorization_helper->getUrl($auth_params);

        header('Location: '.$url);
        die();
        */
    }

}