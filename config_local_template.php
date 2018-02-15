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

// * Start of configuration block for one domain

$config->shared->domains['default'] = (object) array();
// Title shown on top left
$config->shared->domains['default']->title = "Algorea Platform";
// Platform default language
$config->shared->domains['default']->defaultLanguage = 'fr';
$config->shared->domains['default']->defaultAngularLocale = 'fr-fr';
// Optional: available languages
//$config->shared->domains['default']->availableLanguages = 'fr,en';
// Custom i18n strings to inclulde
$config->shared->domains['default']->customStringsName = null;
// Tagline for the platform
$config->shared->domains['default']->taglineHtml = "";
// Domain
$config->shared->domains['default']->domain = "algorea.example.com";
// Base URL of the platform
// To install platform in subfolder you must specify path:
// $config->shared->domains['default']->baseUrl = "http://algorea.example.com/test/";
$config->shared->domains['default']->baseUrl = "http://algorea.example.com";
// Assets base URL, by default the same base URL of the platform, except if you
// want to serve assets from another URL
// To install platform in subfolder you must specify path:
// $config->shared->domains['default']->assetsBaseUrl = "http://algorea.example.com/test/";
$config->shared->domains['default']->assetsBaseUrl = "http://algorea.example.com";
// Intro animation
$config->shared->domains['default']->animationHtmlFile = null;
// Activate Forum
$config->shared->domains['default']->usesForum = false;
// Hide the groups (join/create) interfaces in the profile
$config->shared->domains['default']->hideGroupsInterfaces = false;
// Item IDs for the various base platform items; can be anything as long as
// it's not already in use by another platform in the same database
$config->shared->domains['default']->PlatformItemId = "4028";
$config->shared->domains['default']->CustomProgressItemId = "4020";
$config->shared->domains['default']->OfficialProgressItemId = "4021";
$config->shared->domains['default']->DiscoverRootItemId = "4000";
$config->shared->domains['default']->DiscoverRootSonItemId = "4001";
$config->shared->domains['default']->ContestRootItemId = "4002";
$config->shared->domains['default']->CustomContestRootItemId = "4003";
$config->shared->domains['default']->ProgressRootItemId = "4026";
$config->shared->domains['default']->OfficialContestRootItemId = "4006";
// Default path when we arrive on the platform
$config->shared->domains['default']->defaultPath = "/contents/4026/4020";
// Default redirect path for group code auth (when groups.sRedirectPath is empty)
$config->shared->domains['default']->groupCodeAuthRedirect = null;

// Tabs on top of the UI
// Each tab is an array with:
//  * title: an i18next identifier
//  * path: item IDs path in the platform
//  * icon: the material icons identifier
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


// Domain redirect options
/*
$config->shared->domains['default']->offerRedirect = array(
        'template' => '', // path to template, leave empty for default template
        'url' => 'http://test.test',
        'message' => 'Redirect to .... ?',
        'label_yes' => 'Yes',
        'label_no' => 'No',
        'label_no' => "Don't ask again"
);
*/

// * End of configuration block for one domain

// *** Domain selection
$thisDomain = 'default';

// Example domain selection system (match $_SERVER['HTTP_HOST'])
foreach ($config->shared->domains as $domain => $domainData) {
   if ($domain != 'default' && isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], $domainData->domain) !== FALSE) {
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
