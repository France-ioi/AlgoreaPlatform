<?php

    require_once __DIR__.'/../vendor/autoload.php';
    require_once __DIR__.'/../config.php';

    session_start();
    $provider = new \League\OAuth2\Client\Provider\GenericProvider($config->login_module['oauth']);
    $url = $provider->getAuthorizationUrl(['scope' => 'account']);
    $_SESSION['oauth_state'] = $provider->getState();
    header('Location: '.$url);

?>