<?php

require_once __DIR__.'/../config.php';

header('Content-type: text/javascript');

//error_reporting(0);

?>

i18n.init(<?= json_encode([
  'lng' => $config->i18n->defaultLanguage,
  'fallbackLng' => [$config->i18n->defaultLanguage],
  'fallbackNS' => 'algorea',
  'ns' => [
    'namespaces' => $config->i18n->customStringsName ? [$config->i18n->customStringsName, 'commonFramework', 'algorea'] : ['commonFramework', 'algorea'],
    'defaultNs' => $config->i18n->customStringsName ? $config->i18n->customStringsName : 'translation',
  ],
  'getAsync' => false,
  'resGetPath' => '/i18n/__lng__/__ns__.json'
]); ?>, function () {
  window.i18nLoaded = true;
  $("title").i18n();
  $("body").i18n();
});

var i18nt = function (key) {
    return i18n.t(key);
}
