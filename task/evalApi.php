<?php
if (session_status() === PHP_SESSION_NONE){session_start();}

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
    echo "You must be logged in to use this page.";
    return;
}

require_once '../shared/connect.php';

ini_set('display_errors', '1');

if(!isset($_POST['groupId']) || !isset($_POST['itemId']) || !isset($_POST['action'])) {
    die(json_encode(['error' => true, 'errorMsg' => 'Required parameter missing']));
}

// Change here to disable rights checking
if(true) {
   // Check user has the rights over the group he wants to reevaluate
   $query  = "
      SELECT ID FROM groups_ancestors
      WHERE idGroupAncestor = :idGroupAncestor
            AND idGroupChild = :idGroupChild";
   // Comment this line if needs to allow self-reeval
   $query .= "  AND bIsSelf = 0";
   $stmt = $db->prepare($query);
   $stmt->execute(['idGroupAncestor' => $_SESSION['login']['idGroupOwned'], 'idGroupChild' => $_POST['groupId']]);
   if(!$stmt->fetchColumn()) {
      die(json_encode(['error' => true, 'errorMsg' => "You don't have rights over this group."]));
   }
}

if($_POST['action'] == 'start') {
    // Set users_items for reevaluation
    $startQuery = "
        UPDATE users_items
        JOIN users ON users_items.idUser = users.ID
        JOIN groups_ancestors ON groups_ancestors.idGroupChild = users.idGroupSelf
        SET iScoreReeval = NULL
        WHERE users_items.idItem = :idItem
              AND groups_ancestors.idGroupAncestor = :idGroup";
    $stmt = $db->prepare($startQuery);
    $res = $stmt->execute(['idGroup' => $_POST['groupId'], 'idItem' => $_POST['itemId']]);
    if($res) {
       echo json_encode(['error' => false, 'nbAnswers' => $stmt->rowCount()]);
    } else {
       echo json_encode(['error' => true, 'errorMsg' => 'Start query failed.']);
    }
} elseif($_POST['action'] == 'getCount') {
    // Get the number of evaluations left to do (separate action to not do the
    // request each time)
    $selectQuery = "
        SELECT COUNT(users_items.ID) FROM users_items
        JOIN users ON users_items.idUser = users.ID
        JOIN groups_ancestors ON groups_ancestors.idGroupChild = users.idGroupSelf
        WHERE users_items.idItem = :idItem
              AND groups_ancestors.idGroupAncestor = :idGroup
              AND iScoreReeval IS NULL";
    $stmt = $db->prepare($selectQuery);
    $res = $stmt->execute(['idGroup' => $_POST['groupId'], 'idItem' => $_POST['itemId']]);
    if(!$res) {
       die(json_encode(['error' => true, 'errorMsg' => 'Select query failed.']));
    }

    echo json_encode([
        'error' => false,
        'nbToGrade' => $stmt->fetchColumn()]);
} elseif($_POST['action'] == 'continue') {
    // Send a packet of data for reevaluation
    $itemQuery = "
        SELECT sUrl FROM items
        WHERE ID = :idItem";
    $stmt = $db->prepare($itemQuery);
    $res = $stmt->execute(['idItem' => $_POST['itemId']]);
    if(!$res) {
       die(json_encode(['error' => true, 'errorMsg' => 'Item select query failed.']));
    }
    $sUrl = $stmt->fetchColumn();

    $selectQuery = "
        SELECT users_items.ID, users_items.sState FROM users_items
        JOIN users ON users_items.idUser = users.ID
        JOIN groups_ancestors ON groups_ancestors.idGroupChild = users.idGroupSelf
        WHERE users_items.idItem = :idItem
              AND groups_ancestors.idGroupAncestor = :idGroup
              AND iScoreReeval IS NULL
        ORDER BY ID ASC
        LIMIT 5";
    $stmt = $db->prepare($selectQuery);
    $res = $stmt->execute(['idGroup' => $_POST['groupId'], 'idItem' => $_POST['itemId']]);
    if(!$res) {
       die(json_encode(['error' => true, 'errorMsg' => 'Select query failed.']));
    }

    $answersToGrade = [];
    foreach($stmt->fetchAll() as $row) {
        $stateData = json_decode($row['sState'], true);
        $answerStr = json_encode($stateData['levelAnswers']);
        $answersToGrade[] = ['ID' => $row['ID'], 'answerStr' => $answerStr];
    }

    echo json_encode([
        'error' => false,
        'itemUrl' => $sUrl,
        'answersToGrade' => $answersToGrade]);
} elseif($_POST['action'] == 'saveScores') {
    // Save a packet of scores
    $updateQuery = "
        UPDATE users_items
        SET iScoreReeval = :iScore
        WHERE ID = :id";
    $saveOk = 0;
    $saveError = 0;
    foreach($_POST['scores'] as $score) {
        $stmt = $db->prepare($updateQuery);
        $res = $stmt->execute(['iScore' => $score['score'], 'id' => $score['ID']]);
        if($res) {
            $saveOk += 1;
        } else {
            $saveError += 1;
        }
    }
    echo json_encode(['error' => ($saveError > 0), 'errorMsg' => $saveError, 'nbOk' => $saveOk]);
} elseif($_POST['action'] == 'finish') {
    // Finish the reevaluation, commit iScoreReeval to iScore
    // TODO
}
