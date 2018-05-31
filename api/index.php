<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $module = isset($_REQUEST['module']) ? $_REQUEST['module'] : null;
    if(!$module) {
        throw new Exception('Module param missed');
    }
    $file = __DIR__.'/modules/'.$module.'.php';
    if(!file_exists($file)) {
        throw new Exception('Module not exists');
    }
    require_once($file);
} catch(Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}