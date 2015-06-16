<?php

require_once __DIR__.'/config.php';

header('Content-type: text/javascript');

$configArray = $config->shared;

echo 'var config = '.json_encode($configArray).';';
