<?php

// keeps loginModule message to platform in case platform cannot get it
// from js (in IE11)

require_once(__DIR__.'/../config.php');

session_start();

$request = json_decode(file_get_contents('php://input'), true);

if (isset($_GET['request'])) {
   $_SESSION['loginMessage'] = [];
   $_SESSION['loginMessage']['request'] = $_GET['request'];
   $_SESSION['loginMessage']['content'] = json_decode($_GET['content']);
   ?><!doctype html>
<html>
   <head>
   <script>
         window.close();
   </script>
   </head>
   <body>
   </body>
</html><?php
   return;
}

if (isset($request['get']) || isset($_GET['get'])) {
   if (isset($_SESSION['loginMessage'])) {
      echo json_encode($_SESSION['loginMessage']);
      unset($_SESSION['loginMessage']);
   } else {
      echo json_encode([]);
   }
}

if (isset($request['message'])) {
   $_SESSION['loginMessage'] = $request['message'];
}