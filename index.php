<?php
        require_once "config.php";
        require_once 'offerRedirect/platform_redirect.php';
        PlatformRedirect::process($config->shared->domains['current']);
        $base_href = parse_url($config->shared->domains['current']->baseUrl, PHP_URL_PATH) ?: '/';
?>
<!DOCTYPE html>
<?php
require_once "config.php";

$defaultLanguage = $config->shared->domains['current']->defaultLanguage;
?>
<html lang="<?=$defaultLanguage ?>" ng-app="algorea"  ng-controller="navigationController">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Language" content="<?=$defaultLanguage ?>" />
    <title ng-bind="domainTitle"></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximal-scale=1.0, user-scalable=no, minimal-scale=1.0">
    <base href="<?=$base_href?>">
      <script type="text/javascript">
      <?php
        $assetsBaseUrl = '';
        $urlArgs = '';
        $compiledMode = false;
        $additionalCssUrl = null;
        $animationHtmlFile = null;
        $useMap = false;
        $usesForum = false;
        $footerHtmlFile = "templatesPrefix+'footer.html'";

        $domainConfig = $config->shared->domains['current'];
        if (property_exists($domainConfig, 'compiledMode')) {
          $compiledMode = $domainConfig->compiledMode;
        }
        if (property_exists($domainConfig, 'assetsBaseUrl')) {
          $assetsBaseUrl = $domainConfig->assetsBaseUrl;
        }
        if (property_exists($domainConfig, 'urlArgs')) {
          $urlArgs = $domainConfig->urlArgs;
        }
        if (property_exists($domainConfig, 'additionalCssUrl')) {
          $additionalCssUrl = $domainConfig->additionalCssUrl;
        }
        if (property_exists($domainConfig, 'animationHtmlFile')) {
          $animationHtmlFile = $domainConfig->animationHtmlFile;
        }
        if (property_exists($domainConfig, 'useMap')) {
          $useMap = $domainConfig->useMap;
        }
        if (property_exists($domainConfig, 'usesForum')) {
          $usesForum = $domainConfig->usesForum;
        }
        if (property_exists($domainConfig, 'footerHtmlFile')) {
          $footerHtmlFile = "'".$domainConfig->footerHtmlFile."'";
        }
        function includeFile($url) {
          global $assetsBaseUrl, $urlArgs;
          return $assetsBaseUrl.$url.$urlArgs;
        }
        echo 'var config = '.json_encode($config->shared).';';
      ?>
    </script>
    <link href="//fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <?php if (!$compiledMode): ?>
      <link rel="stylesheet" href="<?= includeFile('bower_components/bootstrap/dist/css/bootstrap.min.css') ?>">
      <link href="<?= includeFile('layout/3columns-flex.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/menu.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/main.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/sidebar-left.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/sidebar-right.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('groupAdmin/groupAdmin.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('profile/groups.css') ?>" rel="stylesheet" type="text/css" />
      <link rel="stylesheet" href="<?= includeFile('algorea.css') ?>" type="text/css">
      <?php if ($usesForum): ?>
        <link href="<?= includeFile('bower_components/dynatree/dist/skin/ui.dynatree.css') ?>" rel="stylesheet" type="text/css">
        <link rel="stylesheet" href="<?= includeFile('forum/forum.css') ?>" type="text/css">
      <?php endif; ?>
    <?php else: ?>
      <link rel="stylesheet" href="<?= includeFile('vendor.min.css') ?>">
      <link rel="stylesheet" href="<?= includeFile('algorea.min.css') ?>">
    <?php endif; ?>
    <?php if ($additionalCssUrl): ?>
      <link rel="stylesheet" href="<?= $additionalCssUrl.$urlArgs ?>" type="text/css">
    <?php endif; ?>
    <link href='//fonts.googleapis.com/css?family=Roboto+Condensed:400,700' rel='stylesheet' type='text/css'>
    <link href='//fonts.googleapis.com/css?family=Roboto:300,700' rel='stylesheet' type='text/css'>
    <style>
    #animation-debut {
      position:absolute;
      top:0px;
      left:0px;
      width:100%;
      height:100%;
      z-index:99;
      opacity:1;
      border:0px;
      transition: opacity 0.5s ease-in-out;
      overflow:hidden;
    }
    .animation-debut-fade {
      opacity:0 !important;
      z-index:-99 !important;
    }
    [ng\:cloak], [ng-cloak], [data-ng-cloak], [x-ng-cloak], .ng-cloak, .x-ng-cloak {
      display: none !important;
    }
    </style>
</head>
<body ng-controller="layoutController" id="body" ng-cloak ng-class="{'mobile-layout': isMobileLayout, 'has-sidebar-left-open': (hasSidebarLeft && sidebarLeftIsOpen)}">
<?php if ($animationHtmlFile): ?>
  <iframe id="animation-debut" src="<?= $animationHtmlFile ?>" onclick="animationFinished()" style="display:none;"></iframe>
<?php endif; ?>
<div ng-if="showNavTopOverlay" id="navTopOverlay" ng-click="layout.closeNavTopOverlay()"></div>
<div ng-if="showMobileNavTopOverlay" id="mobileNavTopOverlay" ng-click="layout.closeMobileNavTop()"></div>
<div ng-if="showSidebarLeftOverlay" id="sidebarLeftOverlay" ng-click="layout.closeSidebarLeftOverlay()"></div>
<div id="fixed-header-room" class="fixed-header-room"></div>
<header ng-click="layout.menuClicked($event);" ng-include="templatesPrefix+'menu.html'">
</header>
<div id='main'>

<nav ui-view="left" autoscroll="false" id="sidebar-left" class="sidebar-left" ng-class="{'sidebar-left-open': sidebarLeftIsOpen, 'sidebar-left-closed': !sidebarLeftIsOpen}" ng-show="hasSidebarLeft"></nav>

<article id="view-right" ui-view="right" autoscroll="false"></article>

</div>

<footer id="footer" ng-include="<?= $footerHtmlFile ?>"></footer>

<?php if ($useMap): ?>
  <div id="map" class="map" style="display:none;" ng-include="templatesPrefix+'map/map.html'"></div>
<?php endif; ?>

<script>
function animationFinished() {
  $('#animation-debut').addClass('animation-debut-fade');
  window.setTimeout(function() {
    $('#animation-debut').remove();
  }, 2000);
  document.getElementById('body').style['overflow-x']='auto';
  document.getElementById('body').style['overflow-y']='scroll';
}
function startAnimation() {
  document.getElementById('animation-debut').src=config.domains.current.animationHtmlFile;
  document.getElementById('animation-debut').style.display='block';
  document.getElementById('body').style['overflow-x']='hidden';
  document.getElementById('body').style['overflow-y']='hidden';
}
if (location.pathname=='/' && config.domains.current.animationHtmlFile) startAnimation();
</script>
<script src="<?= includeFile('errors/error_logger.js') ?>"></script>
<?php if (!$compiledMode): ?>
  <script src="<?= includeFile('bower_components/jquery/dist/jquery.min.js') ?>"></script>
  <?php if ($usesForum): ?>
    <script src="<?= includeFile('bower_components/jquery-ui/jquery-ui.min.js') ?>"></script>
    <script src="<?= includeFile('bower_components/dynatree/dist/jquery.dynatree.min.js') ?>" type="text/javascript"></script>
    <script src="<?= includeFile('shared/utils.js') ?>"></script>
    <script src="<?= includeFile('ext/inheritance.js') ?>" type="text/javascript"></script>
    <script src="<?= includeFile('commonFramework/treeview/treeview.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('bower_components/bowser/src/bowser.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular/angular.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-i18n/angular-locale_'.$config->shared->domains['current']->defaultAngularLocale.'.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-sanitize/angular-sanitize.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-ui-router/release/angular-ui-router.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/i18next/i18next.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/i18next-xhr-backend/i18nextXHRBackend.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/ng-i18next/dist/ng-i18next.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/js-md5/build/md5.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/jschannel/src/jschannel.js') ?>"></script>
  <script src="<?= includeFile('bower_components/pem-platform/task-xd-pr.js') ?>"></script>
  <script src="<?= includeFile('commonFramework/modelsManager/modelsManager.js') ?>"></script>
  <script src="<?= includeFile('commonFramework/sync/syncQueue.js') ?>"></script>
  <script src="<?= includeFile('shared/models.js') ?>"></script>
  <script src="<?= includeFile('i18n/i18n-object.js') ?>"></script>
  <script src="<?= includeFile('shared/small-ui-confirm.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('bower_components/angu-fixed-header-table/angu-fixed-header-table.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('bower_components/lodash/dist/lodash.min.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('login/service.js') ?>"></script>
  <script src="<?= includeFile('algorea.js') ?>"></script>
  <script src="<?= includeFile('contest/contestTimerService.js') ?>"></script>
  <script src="<?= includeFile('contest/contestTimerDirective.js') ?>"></script>
  <script src="<?= includeFile('layout.js') ?>"></script>
  <script src="<?= includeFile('navigation/service.js') ?>"></script>
  <script src="<?= includeFile('navigation/controllers.js') ?>"></script>
  <script src="<?= includeFile('navigation/directives.js') ?>"></script>

  <script src="<?= includeFile('community/controller.js') ?>"></script>
  <?php if ($useMap): ?>
    <script src="<?= includeFile('bower_components/paper/dist/paper-full.min.js') ?>"></script>
    <script src="<?= includeFile('bower_components/jquery-mousewheel/jquery.mousewheel.min.js') ?>"></script>
    <script src="<?= includeFile('map/mapService.js') ?>"></script>
    <script src="<?= includeFile('map/map.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('login/controller.js') ?>"></script>
  <script src="<?= includeFile('states.js') ?>"></script>
  <script src="<?= includeFile('task/controller.js') ?>"></script>
  <script src="<?= includeFile('task/directive.js') ?>"></script>

  <script src="<?= includeFile('profile/profileController.js') ?>"></script>
  <script src="<?= includeFile('profile/myAccountController.js') ?>"></script>
  <script src="<?= includeFile('profile/groupsOwnerController.js') ?>"></script>
  <script src="<?= includeFile('profile/groupsMemberController.js') ?>"></script>

  <script src="<?= includeFile('groupCodePrompt/controller.js') ?>"></script>
  <script src="<?= includeFile('groupAdmin/groupAdminController.js') ?>"></script>
  <script src="<?= includeFile('teams/controller.js') ?>"></script>
  <script src="<?= includeFile('groupAdmin/groupAccountsManagerController.js') ?>"></script>
  <script src="<?= includeFile('groupAdmin/groupSubgroupsController.js') ?>"></script>
  <script src="<?= includeFile('userInfos/controller.js') ?>"></script>
  <?php if ($usesForum): ?>
    <script src="<?= includeFile('forum/forumIndexController.js') ?>"></script>
    <script src="<?= includeFile('forum/forumFilterController.js') ?>"></script>
    <script src="<?= includeFile('shared/treeviewDirective.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('forum/forumThreadController.js') ?>"></script>
<?php else: ?>
  <script src="<?= includeFile('vendor.min.js') ?>"></script>
  <script src="<?= includeFile('algorea.min.js') ?>"></script>
  <script src="<?= includeFile('templates.js') ?>"></script>
<?php endif; ?>
<script>
  window.i18next.use(window.i18nextXHRBackend);
  var i18nextOpts = <?= json_encode([
    'lng' => $defaultLanguage,
    'fallbackLng' => ['en', 'fr'],
//    'debug' => true,
    'fallbackNS' => $config->shared->domains['current']->customStringsName ? [$config->shared->domains['current']->customStringsName, 'commonFramework', 'algorea'] : ['commonFramework', 'algorea'],
    'ns' => $config->shared->domains['current']->customStringsName ? [$config->shared->domains['current']->customStringsName, 'commonFramework', 'algorea'] : ['commonFramework', 'algorea']
    ]); ?>;
  i18nextOpts['backend'] = {
    'allowMultiLoading': false,
    'loadPath': function (lng, ns) {
                    if(ns == 'commonFramework') {
                      return config.domains.current.baseUrl + '/commonFramework/i18n/'+lng+'/'+ns+'.json';
                    } else {
                      return config.domains.current.baseUrl + '/i18n/'+lng+'/'+ns+'.json';
                    }
                  }
    };
  window.i18next.init(i18nextOpts);
  window.i18next.on('initialized', function (options) {
    window.i18nextOptions = options;
  });
</script>
</body>
</html>
