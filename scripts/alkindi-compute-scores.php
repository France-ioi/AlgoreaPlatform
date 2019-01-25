<?php

require_once __DIR__.'/../shared/connect.php';

// Select teams which finished
// based on users_items.sFinishDate is set, or users started the contest more
// than 4 hours ago (if the user is not online when the timer expires,
// sFinishDate is not set)

// To force recomputation, remove the condition "thirdScore IS NULL"
$stmt = $db->prepare("
    SELECT DISTINCT idNewGroup FROM alkindi_teams
    JOIN groups_groups ON groups_groups.idGroupParent = alkindi_teams.idGroup
    JOIN users ON users.idGroupSelf = groups_groups.idGroupChild
    JOIN users_items ON users_items.idUser = users.ID AND users_items.idItem = 188362703395658565
    WHERE (users_items.sFinishDate IS NOT NULL OR users_items.sContestStartDate < NOW() - INTERVAL 4 HOUR)
    AND thirdScore IS NULL
    ;");
$stmt->execute();

// Set items IDs here
$items = [
    '1' => 0,
    '2' => 0,
    '3' => 0,
    '4' => 0
    ];

$scoresQuery = "SELECT alkindi_teams.idNewGroup";
foreach($items AS $idx => $idItem) {
    $scoresQuery .= ", MAX(ga$idx.iScore) AS score$idx";
}
$scoresQuery .= " FROM alkindi_teams";
foreach($items AS $idx => $idItem) {
    $scoresQuery .= " LEFT JOIN groups_attempts AS ga$idx ON ga$idx.idGroup = alkindi_teams.idNewGroup AND ga$idx.idItem = $idItem";
}
$scoresQuery .= " WHERE alkindi_teams.idNewGroup = :idGroup";

while($idGroup = $stmt->fetchColumn()) {
    echo "Computing for $idGroup...\n";
    flush();
    // Compute scores
    $stmt2 = $db->prepare($scoresQuery);
    $stmt2->execute(['idGroup' => $idGroup]);
    $scores = $stmt2->fetch();

    $totalScore = 0;
    $times = [];
    $updateQuery = "UPDATE alkindi_teams SET thirdScore = :thirdScore";
    $updateArgs = ['idGroup' => $idGroup];
    $updateTimes = [];
    foreach($items AS $idx => $idItem) {
        // Default score is 0
        $scores["score$idx"] = $scores["score$idx"] ? $scores["score$idx"] : 0;
        $totalScore += $scores["score$idx"];

        $times[$idx] = null;
        if($scores["score$idx"]) {
            // Get best time
            $stmt2 = $db->prepare("
                SELECT MIN(TIMEDIFF(sBestAnswerDate, sStartDate))
                FROM groups_attempts
                WHERE groups_attempts.idGroup = :idGroup AND groups_attempts.idItem = :idItem AND groups_attempts.iScore = :iScore");
            $stmt2->execute(['idGroup' => $idGroup, 'idItem' => $idItem, 'iScore' => $scores["score$idx" ]]);
            $times[$idx] = $stmt2->fetchColumn();
        }
        if(!$times[$idx]) {
            $times[$idx] = '00:00:00';
        }
        $updateQuery .= ", score$idx = :score$idx, time$idx = :time$idx";
        $updateArgs["score$idx"] = $scores["score$idx"];
        $updateArgs["time$idx"] = $times[$idx];
        $updateTimes[] = "time$idx";
    }

    $updateQuery .= ", thirdTime = ";
    $updateTimesQuery = array_pop($updateTimes);
    foreach($updateTimes as $ut) {
        $updateTimesQuery = "ADDTIME(" . $updateTimesQuery . ", " . $ut .")";
    }
    $updateQuery .= $updateTimesQuery;
    $updateQuery .= " WHERE idNewGroup = :idGroup";

    $updateArgs['thirdScore'] = $totalScore;

    $stmt2 = $db->prepare($updateQuery);
    $stmt2->execute($updateArgs);
}
