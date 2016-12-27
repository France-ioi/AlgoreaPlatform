-- consider the following: item_item deleted and recreated for the same parent/child relation,
-- if insertion is done before deletion, then unique index will prevent insertion

ALTER TABLE `items_items`
  ADD KEY `parentChild` (`idItemParent`,`idItemChild`);
--  DROP KEY `parentChild`,

ALTER TABLE `history_items_items`
  ADD KEY `parentChild` (`idItemParent`,`idItemChild`);
