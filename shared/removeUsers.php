<?php

// Script to remove users and their associated data from the platform
require_once __DIR__."/connect.php";
require_once __DIR__."/RemoveUsersClass.php";

/*** Options ***/
// Base query to select the users to remove
$options = [
    'baseUserQuery' => "FROM users WHERE sLogin NOT IN ('usera', 'userb')",
    'mode' => 'count', // change this to 'delete' to start deletion
    'displayOnly' => false,
    'delete_history' => true
];
/*** End of options ***/


$remover = new RemoveUsersClass($db, $options);
$remover->execute();

// Put triggers back in place
// dropTriggers never called in prev version of script, why triggers reinit required?
//require_once __DIR__.'/../commonFramework/modelsManager/triggers.php';
