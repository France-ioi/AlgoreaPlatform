<?php

/*
Small service to get the user ID from a PHP session ID.
PHP session ID can be fetched in the 'PHPSESSID' cookie in any request sent by
the client.

Usage :
  Send a GET or POST request with 'sessionid' to get the corresponding userID.
Returns JSON-encoded data with two keys :
  userID : integer whose values are either
    > 0 : user ID
    -1 : no user logged in (or session not found)
    -2 : bad query
  error : error message, present only if returned userID = -2
*/

error_reporting(0);

function returnData($userId, $error=null) {
    // Return data as JSON and end script
    $ret = ['userID' => intval($userId)];
    if($error) { $ret['error'] = $error; }
    die(json_encode($ret));
}

set_error_handler(function() {
    // Only session_start should trigger this error handler, when the session
    // ID is invalid
    returnData(-2, "Invalid session ID (or other error).");
});

if(!isset($_GET['sessionid']) && !isset($_POST['sessionid'])) {
    returnData(-2, "Missing session ID.");
}

$sessionid = isset($_GET['sessionid']) ? $_GET['sessionid'] : $_POST['sessionid'];

session_id($sessionid);
session_start();

if(isset($_SESSION['login']['ID']) && $_SESSION['login']['ID']) {
    returnData($_SESSION['login']['ID']);
} else {
    returnData(-1);
}
