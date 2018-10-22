<?php

// File called through json ajax with a token, verifies the token and puts
// informations in a session.

// JSON request (default in AngularJS $http.post) + PHP crazyness, see
// http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once(__DIR__.'/../shared/LoginTokenEntry.php');

$loginToken = $_GET['loginToken'];
if (!$loginToken) {
   die('missing loginToken param');
}
session_start();
if(!LoginTokenEntry::apply($loginToken)) {
    $res = '{"result": false, "error": "invalid or empty token"}';
    die($res);
}
?>

<!doctype html>
<html>
   <head>
   <script>
      window.parent.location.href = "/";
   </script>
   </head>
   <body>
   </body>
</html>
