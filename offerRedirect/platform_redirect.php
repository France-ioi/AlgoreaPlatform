<?php
class PlatformRedirect {

    const KEY = '__platform_redirect';
    const YES = 'yes';
    const NO = 'no';
    const TPL = <<<EOT
        <!DOCTYPE html>
            <html>
            <body>
                <style>
                    section {
                        width: 400px;
                        margin: 50px auto;
                    }
                    section.controls {
                        margin-top: 20px;
                        text-align: center;
                    }
                    form {
                        display: inline-block;
                    }
                </style>
                <section class="message">{{message}}</section>
                <section class="controls">
                    <form method="post" action="{{action}}">
                        <input type="hidden" name="{{key}}" value="{{value_yes}}"/>
                        <button type="submit">{{label_yes}}</button>
                    </form>
                    <form method="post" action="{{action}}">
                        <input type="hidden" name="{{key}}" value="{{value_no}}"/>
                        <button type="submit">{{label_no}}</button>
                    </form>
                </section>
            </body>
            </body>
EOT;


    static function process($domain_cfg) {
        if(!property_exists($domain_cfg, 'offerRedirect')) return;

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
            self::render(self::TPL, $domain_cfg->offerRedirect);
        }
    }


    static function extendTplParams($params) {
        return array_merge([
                'action' => self::requestUrl(),
                'key' => self::KEY,
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