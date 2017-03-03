<?php

    require_once __DIR__.'/../config.php';

    $url = $config->login_module['logout']['url'].'?redirect_uri='.urlencode($config->login_module['logout']['redirectUri']);
    header('Location: '.$url);

?>