<?php

// *** Database configuration
//$config->db->host = "";
$config->db->database = "";
$config->db->user = "";
$config->db->password = "";
// Whether this MySQL server supports fractionnal time (5.6.4+)
$config->db->fractionalTime = false;

// Local timezone
$config->shared->timezone = "Europe/Paris";

// *** Keys settings
$config->platform->name = "";
$config->platform->private_key = "";
$config->platform->public_key = "";

$config->login->name = "http://algorea.pem.dev";
$config->login->public_key = "";

// *** Root IDs for the whole platform
$config->shared->RootItemId = "5";
$config->shared->RootGroupId = "10";
$config->shared->RootSelfGroupId = "3";
$config->shared->RootAdminGroupId = "1";
$config->shared->RootTempGroupId = "2";
$config->shared->OrphanedRootItemId = "4004";

// *** Domains configuration
// An installation of the platform can host multiple domains in the same database.
//
// The domain named "current" will be the domain used.
// An example domain selection system can be found at the end of this file.
//
// The IDs can be chosen arbitrarily, but must be distinct for the IDs of other
// domains.

$config->shared->domains['default'] = (object) array();
$config->shared->domains['default']->title = "Algorea Platform";
$config->shared->domains['default']->defaultLanguage = 'fr';
$config->shared->domains['default']->defaultAngularLocale = 'fr-fr';
$config->shared->domains['default']->customStringsName = null;
$config->shared->domains['default']->taglineHtml = "";
$config->shared->domains['default']->domain = "algorea.example.com";
$config->shared->domains['default']->baseUrl = "http://algorea.example.com";
$config->shared->domains['default']->animationHtmlFile = null;
$config->shared->domains['default']->usesForum = false;
$config->shared->domains['default']->PlatformItemId = "4028";
$config->shared->domains['default']->CustomProgressItemId = "4020";
$config->shared->domains['default']->OfficialProgressItemId = "4021";
$config->shared->domains['default']->DiscoverRootItemId = "4000";
$config->shared->domains['default']->DiscoverRootSonItemId = "4001";
$config->shared->domains['default']->ContestRootItemId = "4002";
$config->shared->domains['default']->CustomContestRootItemId = "4003";
$config->shared->domains['default']->ProgressRootItemId = "4026";
$config->shared->domains['default']->OfficialContestRootItemId = "4006";
$config->shared->domains['default']->defaultPath = "/contents/4026/4020";
$config->shared->domains['default']->tabs = array();
$config->shared->domains['default']->tabs[0] = array(
        'title' => 'menu_discover',
        'path' => '4005',
        'icon' => 'explore'
        );
$config->shared->domains['default']->tabs[1] = array(
        'title' => 'menu_progress',
        'path' => '4026/4021',
        'icon' => 'trending_up'
        );
$config->shared->domains['default']->tabs[3] = array(
        'title' => 'menu_contest',
        'path' => '4002/4006',
        'icon' => 'create'
        );

// *** Domain selection
$thisDomain = 'default';

// Example domain selection system (match $_SERVER['HTTP_HOST'])
foreach ($config->shared->domains as $domain => $domainData) {
   if ($domain != 'default' && strpos($_SERVER['HTTP_HOST'], $domainData->domain) !== FALSE) {
      $thisDomain = $domain;
   }
}

$config->shared->domains['current'] = $config->shared->domains[$thisDomain];


// Login module
// Login module
$config->login_module_client = [
        'id' => '3',
        'secret' => '1AtKfSc7KbgIo8GDCI31pA9laP7pFoBqSg3RtVHq',
        'base_url' => 'http://login-module.dev',
        'redirect_uri' => $config->shared->domains['current']->baseUrl.'/login/callback_oauth.php',
];
?>