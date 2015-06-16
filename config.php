<?php

$config = (object) array(
   "db" => (object) array(
      "host" => "localhost",
      "database" => "franceioi",
      "user" => "",
      "password" => "",
      "logged" => false
   ),
   "platform" => (object) array(
      "name" => "http://algorea.pem.dev",
      "private_key" => "",
      "public_key" => ""
   ),
   "debug" => (object) array(
      "timers" => false,
      "types" => array(),
   ),
   "login" => (object) array(
      "public_key" => ""
   ),
   "sync" => (object) array(
      "server" => "",
      "params" => (object) array(  ),
      "useTransaction" => false,
      "maxChanges" => 2000,
   ),
   "shared" => (object) array(
      "RootItemId" => "1",
      "ProgressRootItemId" => "2",
      "OfficialProgressItemId" => "21",
      "OfficialProgressItemSonId" => "22",
      "CustomProgressItemId" => "23",
      "DiscoverRootItemId" => "3",
      "DiscoverRootSonItemId" => "31",
      "ContestRootItemId" => "4",
      "CustomContestRootItemId" => "41",
      "OfficialContestRootItemId" => "42",
      "OrphanedRootItemId" => "5",
      "RootGroupId" => "1",
      "RootSelfGroupId" => "2",
      "RootAdminGroupId" => "3",
      "RootTempGroupId" => "4"
   )
);

if (is_readable(__DIR__.'/config_local.php')) {
   include_once __DIR__.'/config_local.php';
} else if (is_readable(__DIR__.'/config.json')) {
   $config = json_decode(file_get_contents(__DIR__.'/config.json'));
}
