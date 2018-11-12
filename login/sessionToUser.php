<?php

/* Small service to get the user ID from a PHP session ID
Return values :
 -2 : bad query (missing or invalid sessionid)
 -1 : no user logged in (or session not found)
 ID > 0 : user ID
*/

error_reporting(0);

set_error_handler(function() {
    die('-2');
});
if(!isset($_GET['sessionid']) && !isset($_POST['sessionid'])) {
    die('-2');
}

$sessionid = isset($_GET['sessionid']) ? $_GET['sessionid'] : $_POST['sessionid'];

session_id($sessionid);
session_start();

if(isset($_SESSION['login']['ID']) && $_SESSION['login']['ID']) {
    die('' . $_SESSION['login']['ID']);
} else {
    die('-1');
}
