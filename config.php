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
   "login_module_client" => array(),
   "sync" => (object) array(
      "server" => "",
      "params" => (object) array(  ),
      "useTransaction" => false,
      "maxChanges" => 20000,
      "memLimit" => '',
      "debug" => false
   ),
   "shared" => (object) array(
      "RootItemId" => "1",
      "RootGroupId" => "1",
      "RootSelfGroupId" => "2",
      "RootAdminGroupId" => "3",
      "RootTempGroupId" => "4",
      "OrphanedRootItemId" => "5",
      "loginUrl" => "https://loginaws.algorea.org/login.html",
      "timezone" => ini_get('date.timezone'),
      "domains" => array( // global root
         "current" => (object) array( // domain-specific root. All config is read from "current", implement your own mechanism to make it point to the data you want to according to the domain
            "defaultLanguage" => 'fr',
            "defaultAngularLocale" => 'fr-fr',
            "customStringsName" => '',
            "title" => 'Change title here',
            "taglineHtml" => "Pour convertir ses idées<br>en applications numériques",
            "animationHtmlFile" => null,
            "usesLeftNavigation" => false,
            "baseUrl" => "http://localhost",
            "assetsBaseUrl" => "http://localhost",
            "compiledMode" => false,
            "domain" => 'domain name, optional',
            "defaultPath" => '/contents/4022/4023',
            "usesForum" => true,
            "additionalCssUrl" => 'additional css url',
            "ProgressRootItemId" => "2",
            "OfficialProgressItemId" => "21",
            "OfficialProgressItemSonId" => "22",
            "CustomProgressItemId" => "23",
            "DiscoverRootItemId" => "3",
            "DiscoverRootSonItemId" => "31",
            "ContestRootItemId" => "4",
            "CustomContestRootItemId" => "41",
            "OfficialContestRootItemId" => "42",
            "additionalLoginArgs" => "",
         )
      )
   )
);

// Tabs
$config->shared->domains['current']->tabs[0] = array(
      'title' => 'menu_discover',
      'path' => '4022/4023',
      'icon' => 'explore'
      );
$config->shared->domains['current']->tabs[1] = array(
      'title' => 'menu_progress',
      'path' => '4026/4021',
      'icon' => 'trending_up'
      );
$config->shared->domains['current']->tabs[2] = array(
      'title' => 'menu_forum',
      'path' => 'forum',
      'icon' => 'group'
      );

if (is_readable(__DIR__.'/config_local.php')) {
   include_once __DIR__.'/config_local.php';
}

date_default_timezone_set($config->shared->timezone);
