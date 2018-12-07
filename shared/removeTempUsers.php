<?php

// Script to remove a chunk of temporary users
require_once __DIR__."/connect.php";
require_once __DIR__."/RemoveUsersClass.php";

/*** Options ***/
// Base query to select the users to remove
$options = [
    'baseUserQuery' => 'WHERE users.tempUser = 1 AND users.sRegistrationDate <= NOW() - INTERVAL 7 day',
    'mode' => 'delete',
    'output' => false,
    'displayOnly' => false,
    'displayFull' => true,
    'deleteHistory' => true,
    'deleteHistoryAll' => false
];
/*** End of options ***/

$remover = new RemoveUsersClass($db, $options);
$remover->execute();
