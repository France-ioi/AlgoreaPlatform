ALTER TABLE  `items_ancestors` DROP INDEX  `idItemAncestor` , ADD UNIQUE  `idItemAncestor` (  `idItemAncestor` ,  `idItemChild` );
