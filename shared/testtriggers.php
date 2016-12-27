<?php

require_once __DIR__."/../shared/connect.php";
require_once __DIR__."/../shared/listeners.php";

function syncDebug() {}

$db->exec('truncate test_items_ancestors');
$db->exec('truncate test_items_propagate');

$createQuery = "
CREATE TABLE IF NOT EXISTS `test_items_items` (
  `ID` bigint(20) NOT NULL,
  `idItemParent` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT IGNORE INTO `test_items_items` (`ID`, `idItemParent`, `idItemChild`) VALUES
(1, 1, 10),
(2, 1, 11),
(3, 10, 100),
(4, 10, 101),
(5, 11, 110),
(6, 11, 111),
(7, 100, 1000),
(8, 100, 1001),
(9, 101, 1010),
(10, 101, 1011),
(11, 110, 1100),
(12, 110, 1101),
(13, 111, 1110),
(14, 111, 1111);

ALTER TABLE `test_items_items`
 ADD PRIMARY KEY (`ID`), ADD KEY `idItemParent` (`idItemParent`,`idItemChild`);";


$db->exec($createQuery);

$db->exec('truncate test_items_propagate');
$db->exec('truncate test_items_ancestors');
$db->exec('insert ignore into test_items_propagate (ID, sAncestorsComputationState) select idItemParent, \'todo\' from test_items_items;');
$db->exec('insert ignore into test_items_propagate (ID, sAncestorsComputationState) select idItemChild, \'todo\' from test_items_items;');
Listeners::createNewAncestors($db, "items", "Item", "test_", "test_");
// now we have a real-life test_items_ancestors and test_items_propagate

$oldItemChild = '110';
$oldItemParent = '11';

function printState($comment, $printAncestors, $printPropagate) {
	global $db;
	echo $comment."\n";
	if ($printAncestors) {
		echo "ancestors:\n";
		$stmt = $db->prepare('select * from test_items_ancestors order by idItemAncestor ASC, idItemChild ASC;');
		$stmt->execute();
		$ancestors = $stmt->fetchAll();
		foreach($ancestors as $ancestor) {
			echo "  ".$ancestor['idItemAncestor']." -> ".$ancestor["idItemChild"]."\n";
		}
	}
	if ($printPropagate) {
		echo "items with 'todo' as propagate:\n";
		$stmt = $db->prepare('select * from test_items_propagate where sAncestorsComputationState = \'todo\' order by ID ASC;');
		$stmt->execute();
		$items = $stmt->fetchAll();
		foreach($items as $item) {
			echo "  ".$item['ID']."\n";
		}
	}
	echo "\n";
}

printState("initial state:", true, true);

// let's cut link 5 and apply triggers one by one:
$db->exec('delete from test_items_items where ID=5;');

echo "deleting link 11 -> 110\n\n";

echo "TRIGGERS:\n\n";


$db->exec("INSERT IGNORE INTO `test_items_propagate` (`ID`, `sAncestorsComputationState`) VALUES ($oldItemChild, 'todo') ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo';INSERT IGNORE INTO `test_items_propagate` (`ID`, `sAncestorsComputationState`) VALUES ($oldItemParent, 'todo') ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo';");

printState("Mark as 'todo' the objects at both direct ends of the old relation", false, true);

$db->exec(" INSERT IGNORE INTO `test_items_propagate` (`ID`, `sAncestorsComputationState`) (SELECT `test_items_ancestors`.`idItemChild`, 'todo' FROM `test_items_ancestors` WHERE `test_items_ancestors`.`idItemAncestor` = $oldItemChild) ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo';");

printState("Mark as 'todo' the objects that are descendants of the child object of the old relation", false, true);

$db->exec(" DELETE `bridges` FROM `test_items_ancestors` `child_descendants` JOIN `test_items_ancestors` `parent_ancestors` JOIN `test_items_ancestors` `bridges` ON (`bridges`.`idItemAncestor` = `parent_ancestors`.`idItemAncestor` AND `bridges`.`idItemChild` = `child_descendants`.`idItemChild`) WHERE `parent_ancestors`.`idItemChild` = $oldItemParent AND `child_descendants`.`idItemAncestor` = $oldItemChild;");

printState("We delete all bridges between ancestors of the parent and descendants of the child in the old relation", true, false);

$db->exec("DELETE `child_ancestors` FROM `test_items_ancestors` `child_ancestors` JOIN  `test_items_ancestors` `parent_ancestors` ON (`child_ancestors`.`idItemChild` = $oldItemChild AND `child_ancestors`.`idItemAncestor` = `parent_ancestors`.`idItemAncestor`) WHERE `parent_ancestors`.`idItemChild` = $oldItemParent;");

printState("Delete all ancestry relationships of the child that were also ancestors of the parent in the old relation", true, false);

$db->exec("DELETE `test_items_ancestors` from `test_items_ancestors` WHERE `test_items_ancestors`.`idItemChild` = $oldItemChild and `test_items_ancestors`.`idItemAncestor` = $oldItemParent;");

printState("Delete the old relationship", true, false);

$db->exec("DELETE `parent_ancestors` FROM `test_items_ancestors` `parent_ancestors` JOIN  `test_items_ancestors` `child_ancestors` ON (`parent_ancestors`.`idItemAncestor` = $oldItemParent AND `child_ancestors`.`idItemChild` = `parent_ancestors`.`idItemChild`) WHERE `child_ancestors`.`idItemAncestor` = $oldItemChild;");

printState("Delete all descendence relationships of the parent that were also descendants of the child in the old relation", true, false);


echo "\nLISTENERS:\n\n";

$db->exec(" INSERT IGNORE INTO  `test_items_propagate` (`ID`, `sAncestorsComputationState`) SELECT `descendants`.`ID`, 'todo' FROM `items` as `descendants` JOIN `test_items_ancestors` ON (`descendants`.`ID` = `test_items_ancestors`.`idItemChild`) JOIN `test_items_propagate` `ancestors` ON (`ancestors`.`ID` = `test_items_ancestors`.`idItemAncestor`) WHERE `ancestors`.`sAncestorsComputationState` = 'todo' ON DUPLICATE KEY UPDATE `sAncestorsComputationState` = 'todo'");

printState("mark as 'todo' all descendants of objects marked as 'todo'", false, true);

$hasChanges = true;
while ($hasChanges) {
	$db->exec("UPDATE `test_items_propagate` as `children` SET `sAncestorsComputationState` = 'processing' WHERE `sAncestorsComputationState` = 'todo' AND `children`.`ID` NOT IN (SELECT `idItemChild` FROM ( SELECT `test_items_items`.`idItemChild` FROM `test_items_items` JOIN `test_items_propagate` as `parents` ON (`parents`.`ID` = `test_items_items`.`idItemParent`) WHERE `parents`.`sAncestorsComputationState` <> 'done') as `notready`)");

	printState("We mark as 'processing' all objects that were marked as 'todo' and that have no parents not marked as 'done'", false, true);

	$db->exec("INSERT IGNORE INTO `test_items_ancestors` (`idItemAncestor`, `idItemChild`)SELECT `test_items_items`.`idItemParent`, `test_items_items`.`idItemChild` FROM `test_items_items` JOIN `test_items_propagate` ON (`test_items_items`.`idItemChild` = `test_items_propagate`.`ID` OR `test_items_items`.`idItemParent` = `test_items_propagate`.`ID`)  WHERE `test_items_propagate`.`sAncestorsComputationState` = 'processing' UNION SELECT `test_items_ancestors`.`idItemAncestor`, `test_items_items_join`.`idItemChild` FROM `test_items_ancestors` JOIN `test_items_items` as `test_items_items_join` ON (`test_items_items_join`.`idItemParent` = `test_items_ancestors`.`idItemChild`) JOIN `test_items_propagate` ON (`test_items_items_join`.`idItemChild` = `test_items_propagate`.`ID`) WHERE `test_items_propagate`.`sAncestorsComputationState` = 'processing';");

	printState("For every object marked as 'processing', we compute all its ancestors", true, false);

	$query = "UPDATE `test_items_propagate` SET `sAncestorsComputationState` = 'done' WHERE `sAncestorsComputationState` = 'processing';";
	$hasChanges = ($db->exec($query) > 0);
	printState("Objects marked as 'processing' are now marked as 'done'", false, true);
}

