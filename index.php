<?php
  require_once "config.php";
  require_once 'offerRedirect/platform_redirect.php';
  PlatformRedirect::process($config->shared->domains['current']);
  $base_href = parse_url($config->shared->domains['current']->baseUrl, PHP_URL_PATH) ?: '/';
  $defaultLanguage = $config->shared->domains['current']->defaultLanguage;
?>
<!DOCTYPE html>
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
    <link href='//fonts.googleapis.com/css?family=Roboto+Condensed:400,700' rel='stylesheet' type='text/css'>
    <link href='//fonts.googleapis.com/css?family=Roboto:300,700' rel='stylesheet' type='text/css'>
</head>
<body ng-controller="layoutController" id="body" ng-cloak ng-class="{'mobile-layout': isMobileLayout, 'has-sidebar-left-open': (hasSidebarLeft && sidebarLeftIsOpen)}">
<?php if ($animationHtmlFile): ?>
  <iframe id="animation-debut" src="<?= $animationHtmlFile ?>" onclick="animationFinished()" style="display:none;"></iframe>
<?php endif; ?>
  <div ng-if="showNavTopOverlay" id="navTopOverlay" ng-click="layout.closeNavTopOverlay()"></div>
  <div ng-if="showMobileNavTopOverlay" id="mobileNavTopOverlay" ng-click="layout.closeMobileNavTop()"></div>
  <div ng-if="showSidebarLeftOverlay" id="sidebarLeftOverlay" ng-click="layout.closeSidebarLeftOverlay()"></div>
  <div id="fixed-header-room" class="fixed-header-room"></div>
  <header ng-click="layout.menuClicked($event);" ng-include="templatesPrefix+'menu.html'"></header>

  <div id='main'>
    <nav ui-view="left" autoscroll="false" id="sidebar-left" class="sidebar-left" ng-class="{'sidebar-left-open': sidebarLeftIsOpen, 'sidebar-left-closed': !sidebarLeftIsOpen}" ng-show="hasSidebarLeft"></nav>
    <article id="view-right" ui-view="right" autoscroll="false"></article>
  </div>

  <footer id="footer" ng-include="<?= $footerHtmlFile ?>"></footer>

<?php if ($useMap): ?>
  <div id="map" class="map" style="display:none;" ng-include="templatesPrefix+'map/map.html'"></div>
<?php endif; ?>

<link href="/assets/vendor.css" rel="stylesheet" type="text/css"/>
<link href="/assets/app.css" rel="stylesheet" type="text/css"/>
<script src="/assets/vendor.js"></script>
<script src="/assets/app.js"></script>


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
  window.i18next.use(window.i18nextSprintfPostProcessor);
  window.i18next.init(i18nextOpts);
  window.i18next.on('initialized', function (options) {
    window.i18nextOptions = options;
  });
</script>
</body>
</html>