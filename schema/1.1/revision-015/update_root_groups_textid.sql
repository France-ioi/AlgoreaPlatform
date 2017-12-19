UPDATE groups SET sName = 'RootTemp' WHERE sName = 'tempUsers';
UPDATE groups SET sTextId = sName WHERE sName IN ('Root', 'RootSelf', 'RootAdmin', 'RootTemp');
