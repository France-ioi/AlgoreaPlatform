<?php
class PlatformRedirect {

    const KEY = '__platform_redirect';
    const KEYR = '__platform_redirect_remember';
    const YES = 'yes';
    const NO = 'no';
    const TPL_PATH = __DIR__.'/default_template.html';


    static function process($domain_cfg) {
        if(!property_exists($domain_cfg, 'offerRedirect')) return;

        if(isset($_COOKIE[self::KEYR])) return;

        if(session_status() === PHP_SESSION_NONE){
            session_start();
        }

        if(isset($_POST[self::KEY])) {
            switch($_POST[self::KEY]) {
                case self::YES:
                    self::actionYes($domain_cfg->offerRedirect['url']);
                    break;
                case self::NO:
                    self::actionNo();
                    break;
            }
        } else if(isset($_SESSION[self::KEY])) {
            switch($_SESSION[self::KEY]) {
                case self::YES:
                    self::redirect($domain_cfg->offerRedirect['url']);
                    break;
                case self::NO:
                    return;
                    break;
            }
        } else {
            $tplPath = self::TPL_PATH;
            if(isset($domain_cfg->offerRedirect['template']) && $domain_cfg->offerRedirect['template'] != '') {
                $tplPath = $domain_cfg->offerRedirect['template'];
            }
            $tpl = file_get_contents($tplPath);
            self::render($tpl, $domain_cfg->offerRedirect);
        }
    }


    static function extendTplParams($params) {
        return array_merge([
                'action' => self::requestUrl(),
                'key' => self::KEY,
                'keyr' => self::KEYR,
                'value_yes' => self::YES,
                'value_no' => self::NO,
            ], $params);
    }

    static function render($html, $params) {
        $params = self::extendTplParams($params);
        $keys = array_keys($params);
        foreach($keys as &$key) {
            $key = '{{'.$key.'}}';
        }
        die(str_replace($keys, array_values($params), $html));
    }

    static function actionYes($url) {
        // $_SESSION[self::KEY] = self::YES;
        // uncomment to save state
        unset($_SESSION[self::KEY]);
        self::redirect($url);
    }


    static function actionNo() {
        $_SESSION[self::KEY] = self::NO;
        if(isset($_POST[self::KEYR])) {
            setcookie(self::KEYR, 'no', time()+60*60*24*180);
        }
        self::redirect(self::requestUrl());
    }


    static function requestUrl() {
        return (isset($_SERVER['HTTPS']) ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
    }

    static function redirect($url) {
        header('Location: '.$url);
        exit;
    }

}
