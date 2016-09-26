<doctype html>
<html>
<head>

</head>
<body>
<?php

/*

DROP TABLE IF EXISTS `test_items_ancestors`;
CREATE TABLE IF NOT EXISTS `test_items_ancestors` (
`ID` bigint(20) NOT NULL,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=999962248529799297 DEFAULT CHARSET=utf8;

ALTER TABLE `test_items_ancestors`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`), ADD KEY `idItemAncestortor` (`idItemAncestor`), ADD KEY `idItemChild` (`idItemChild`);

ALTER TABLE `test_items_ancestors`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=999962248529799297;

DROP TABLE IF EXISTS `test_items_propagate`;
CREATE TABLE IF NOT EXISTS `test_items_propagate` (
  `ID` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('todo','done','processing') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `test_items_propagate`
 ADD PRIMARY KEY (`ID`), ADD KEY `sAncestorsComputationDate` (`sAncestorsComputationState`);

*/

require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";

function syncDebug() {}

$db->exec('truncate test_items_ancestors');
$db->exec('truncate test_items_propagate');
$db->exec('insert ignore into test_items_propagate (ID, sAncestorsComputationState) select ID, \'todo\' from items;');
Listeners::createNewAncestors($db, "items", "Item", 'test_');

$diffQuery = "select test.ID as testID, test.idItemAncestor as testIdItemAncestor, test.idItemChild as testIdItemChild, normal.ID as normalID, normal.idItemAncestor as normalIdItemAncestor, normal.idItemChild as normalIdItemChild 
	from test_items_ancestors as test 
	right join items_ancestors as normal
	on normal.idItemAncestor = test.idItemAncestor and test.idItemChild = normal.idItemChild
	where test.ID IS NULL
union all
select test.ID as testID, test.idItemAncestor as testIdItemAncestor, test.idItemChild as testIdItemChild, normal.ID as normalID, normal.idItemAncestor as normalIdItemAncestor, normal.idItemChild as normalIdItemChild 
	from test_items_ancestors as test 
	left join items_ancestors as normal
	on normal.idItemAncestor = test.idItemAncestor and test.idItemChild = normal.idItemChild
	where normal.ID IS NULL;";

$stmt = $db->prepare($diffQuery);
$stmt->execute();

$rows = $stmt->fetchAll();

$diffCount = 0;
$notInTest = [];
$notInNormal = [];

foreach($rows as $row) {
	$diffCount += 1;
	if (!$row['testID']) {
		$notInTest[] = $row;
	} else {
		$notInNormal[] = $row;
	}
}

$notInTestCount = count($notInTest);
$notInNormalCount = count($notInNormal);

?>

Number of Differences: <?= $diffCount ?><br/>
Elements in items_ancestors not present in the fixed table: <?= $notInTestCount ?><br/>

<table>
<tr><td>idItemAncestor</td><td>idItemChild</td></tr>
<?php
foreach($notInTest as $row) {
	echo "<tr><td>".$row['normalIdItemAncestor']."</td><td>".$row['normalIdItemChild']."</td></tr>";
}
?>
</table>

Elements in the fixed table not present in items_ancestors: <?= $notInNormalCount ?><br/>

<table>
<tr><td>idItemAncestor</td><td>idItemChild</td></tr>
<?php
foreach($notInNormal as $row) {
	echo "<tr><td>".$row['testIdItemAncestor']."</td><td>".$row['testIdItemChild']."</td></tr>";
}
?>
</table>

</body>
</html>