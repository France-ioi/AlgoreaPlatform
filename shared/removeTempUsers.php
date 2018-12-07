<?php

// Script to remove a chunk of temporary users
require_once __DIR__."/connect.php";
require_once __DIR__."/RemoveUsersClass.php";

/*** Options ***/
// How many temp users to delete on each execution
$chunkSize = 100;
// Start process only if we have at least that many users
$minChunkSize = 40;

// Base query to select the users to remove
$options = [
    'baseUserQuery' => '',
    'mode' => 'delete',
    'output' => false,
    'deleteHistory' => false,
    'deleteHistoryAll' => false
];
/*** End of options ***/

$stmt = $db->prepare('SELECT sLogin FROM users WHERE tempUser = 1 AND sRegistrationDate <= NOW() - INTERVAL 7 day LIMIT '.$chunkSize.';');
$res = $stmt->execute();

$chunk = [];
while($sLogin = $stmt->fetchColumn()) {
    $chunk[] = "sLogin = '$sLogin'";
    if(count($chunk) >= $chunkSize) { break; }
}
if(count($chunk) < $minChunkSize) { die(); }
$options['baseUserQuery'] = "FROM `[HISTORY]users` WHERE " . implode(' OR ', $chunk);
$remover = new RemoveUsersClass($db, $options);
$remover->execute();
