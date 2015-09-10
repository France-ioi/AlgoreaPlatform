-- consider the following: item_item deleted and recreated for the same parent/child relation,
-- if insertion is done before deletion, then unique index will prevent insertion

ALTER TABLE `items_items`
  DROP KEY `parentChild`,
  ADD KEY `parentChild` (`idItemParent`,`idItemChild`);
