<?php

require_once __DIR__.'/../shared/connect.php';

// Compute all ranks
// To undisplay : UPDATE alkindi_teams SET rank = NULL;

// To force recomputation, remove the condition "thirdScore IS NULL"
$stmt = $db->prepare("
    SELECT * FROM (
        SELECT idGroup, finalScore, IFNULL(thirdScore, 0) AS thirdScore, thirdTime, bigRegion, region FROM `alkindi_teams` WHERE isOfficial = 1) q
    ORDER BY thirdScore DESC, thirdTime ASC, finalScore DESC");
$stmt->execute();

$curRank = 0; // Actual rank, counting tied teams
$curGroupNb = 0;
$curThirdScore = null;
$curThirdTime = null;
$curFinalScore = null;

$curRankRegions = array();
$curGroupNbRegions = array();
$curThirdScoreRegions = array();
$curThirdTimeRegions = array();
$curFinalScoreRegions = array();

while($group = $stmt->fetch()) {
//    $bigRegion = $group['bigRegion'];
    $bigRegion = $group['region'];
    if (!isset($curRankRegions[$bigRegion])) {
       $curRankRegions[$bigRegion] = 0;
       $curGroupNbRegions[$bigRegion] = 0;
       $curThirdScoreRegions[$bigRegion] = null;
       $curThirdTimeRegions[$bigRegion] = null;
       $curFinalScoreRegions[$bigRegion] = null;
    }
    $curGroupNb += 1;
    $curGroupNbRegions[$bigRegion] += 1;
    
    // Check if the current team is tied with the previous team
    $groupThirdScore = $group['thirdScore'] ? $group['thirdScore'] : 0;
    if($groupThirdScore != $curThirdScore || $group['thirdTime'] != $curThirdTime || (!$groupThirdScore && $group['finalScore'] != $curFinalScore)) {
        // It's not tied
        $curRank = $curGroupNb;
        $curThirdScore = $groupThirdScore;
        $curThirdTime = $group['thirdTime'];
        $curFinalScore = $group['finalScore'];
    }
    if($groupThirdScore != $curThirdScoreRegions[$bigRegion] ||
       $group['thirdTime'] != $curThirdTimeRegions[$bigRegion] ||
       (!$groupThirdScore && $group['finalScore'] != $curFinalScoreRegions[$bigRegion])) {
        // It's not tied
        $curRankRegions[$bigRegion] = $curGroupNbRegions[$bigRegion];
        $curThirdScoreRegions[$bigRegion] = $groupThirdScore;
        $curThirdTimeRegions[$bigRegion] = $group['thirdTime'];
        $curFinalScoreRegions[$bigRegion] = $group['finalScore'];
    }

//    $stmt2 = $db->prepare("UPDATE alkindi_teams SET rank = :rank, rankBigRegion = :rankBigRegion WHERE idGroup = :idGroup;");
    $stmt2 = $db->prepare("UPDATE alkindi_teams SET rank = :rank, rankRegion = :rankBigRegion WHERE idGroup = :idGroup;");

    $stmt2->execute(['rank' => $curRank, 'rankBigRegion' => $curRankRegions[$bigRegion], 'idGroup' => $group['idGroup']]);
    echo str_pad($curRank, 4)." assigned to group ".str_pad($group['idGroup'], 18)." (finalScore ".$group['finalScore'].", thirdScore " .$group['thirdScore'].", thirdTime ".$group['thirdTime'].") \n";
}

