<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/LoginTokenEntry.php';

class LtiEntry {

    public static function handleRequest() {
        $lti = isset($_POST['lti_message_type']);
        if(!$lti) {
            self::resetAuth();
            return;
        };

        $lti_user_id = null;
        if(isset($_SESSION['login']) && isset($_SESSION['login']['lti_user_id'])) {
            $lti_user_id = $_SESSION['login']['lti_user_id'];
        }
        if($lti_user_id !== $_POST['user_id']) {
            self::doAuth();
        }
    }


    private static function resetAuth() {
        if(!isset($_SESSION)) { return; }
        if(isset($_SESSION['lti']) && $_SESSION['lti']) {
            unset($_SESSION['lti']);
            unset($_SESSION['login']);
        }
    }


    private static function doAuth() {
        global $config, $db;
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
            $token = $lti->entry($params);
        } catch (\Exception $e) {
            die($e->getMessage());
        }
        $_SESSION['lti'] = true;
        LoginTokenEntry::apply($token);
        if(isset($_SESSION['login']['idGroupSelf'])) {
            $stmt = $db->prepare('SELECT ID FROM groups WHERE sTextID = :sTextId;');
            $stmt->execute(['sTextId' => 'lti_' . $config->shared->domains['current']->domain]);
            $idLtiGroup = $stmt->fetchColumn();
            if($idLtiGroup) {
                $stmt = $db->prepare('INSERT IGNORE INTO groups_groups (idGroupParent, idGroupChild) VALUES(:idGroupParent, :idGroupChild);');
                $stmt->execute(['idGroupParent' => $idLtiGroup, 'idGroupChild' => $_SESSION['login']['idGroupSelf']]);
                Listeners::createNewAncestors($db, "groups", "Group");
            }
        }
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
