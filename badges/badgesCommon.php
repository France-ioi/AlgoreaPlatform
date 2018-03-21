<?php
require_once __DIR__."/../shared/connect.php";


// *** Helper functions for badges

function getCode($idUser, $badgeName=null) {
    // Get the code for an user
    global $db;

    $query = 'SELECT code FROM badges WHERE idUser = :idUser';
    $queryArgs = ['idUser' => $idUser];
    if($badgeName) {
        $query .= ' AND name = :name';
        $queryArgs['name'] = $badgeName;
    } else {
        $query .= ' AND name IS NULL';
    }
    $stmt = $db->prepare($query);
    $stmt->execute($queryArgs);
    $badge = $stmt->fetchColumn();
    // Found a badge
    if($badge) { return $badge; }

    // No badge found, exit if we're looking for a specific badge
    if($badgeName) { return null; }

    // No badge name given, we're looking for the user badge, generate one
    // Check the user exists
    $stmt = $db->prepare('SELECT ID FROM users WHERE ID = :id;');
    $stmt->execute(['id' => $idUser]);
    $user = $stmt->fetchColumn();
    if(!$user) { return null; }

    // Create badge
    $attempts = 0;
    $characters = '3456789abcdefghijkmnpqrstuvwxy';
    while($attempts < 1000) {
        // Generate code
        $code = '';
        for($i = 0; $i < 8; $i++) {
            $code .= $characters[rand(0, strlen($characters)-1)];
        }

        // Check code is not already in use
        $stmt = $db->prepare('SELECT ID FROM badges WHERE code = :code AND name IS NULL;');
        $stmt->execute(['code' => $code]);
        if(!$stmt->fetchColumn()) {
            // This code is not in use, save it
            $stmt = $db->prepare('INSERT INTO badges (idUser, name, code) VALUES(:idUser, NULL, :code);');
            $stmt->execute(['idUser' => $idUser, 'code' => $code]);
            return $code;
        }
    }
    // Too many attempts
    return null;
}
