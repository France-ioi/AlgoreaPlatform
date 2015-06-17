<?php

require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . 'config.php';
/**
 * Your database authentication information goes here
 * @see http://dbv.vizuina.com/documentation/
 */
define('DB_HOST', $config->db->host);
define('DB_PORT', '3306');
define('DB_USERNAME', $config->db->user);
define('DB_PASSWORD', $config->db->password);
define('DB_NAME', $config->db->database);

/**
 * Authentication data for access to DBV itself
 * If you leave any of the two constants below blank, authentication will be disabled
 * @see http://dbv.vizuina.com/documentation/#optional-settings
 */
define('DBV_USERNAME', '');
define('DBV_PASSWORD', '');

/**
 * @see http://dbv.vizuina.com/documentation/#writing-adapters
 */
define('DB_ADAPTER', 'MySQL');

define('DS', DIRECTORY_SEPARATOR);
define('DBV_ROOT_PATH', dirname(__FILE__) . DIRECTORY_SEPARATOR . 'dbv');

/**
 * Only edit this lines if you want to place your schema files in custom locations
 * @see http://dbv.vizuina.com/documentation/#optional-settings
 */
define('DBV_DATA_PATH', DBV_ROOT_PATH . DS . 'data');
define('DBV_SCHEMA_PATH', DBV_DATA_PATH . DS . 'schema');
define('DBV_REVISIONS_PATH', DBV_DATA_PATH . DS . 'revisions');
define('DBV_META_PATH', DBV_DATA_PATH . DS . 'meta');

/**
 * Select revision storage
 * ADAPTER - store in DB
 * FILE - store on disk
 */
define('DBV_REVISION_STORAGE', 'FILE');

/**
 * Revision table name
 */
define('DBV_REVISION_TABLE', 'dbv_revision');

ini_set('magic_quotes_gpc', 'Off');
error_reporting(E_ALL ^ E_NOTICE);

/**
 * I18n support
 */
define('DBV_LANGUAGES_PATH', DBV_ROOT_PATH . DS . 'languages');
define('DEFAULT_LOCALE', 'en_US');
define('DEFAULT_ENCODING', 'UTF-8');
define('DEFAULT_DOMAIN', 'default');
putenv("LC_ALL=".DEFAULT_LOCALE);
setlocale(LC_ALL, DEFAULT_LOCALE);


require_once DBV_ROOT_PATH . '/lib/functions.php';
require_once DBV_ROOT_PATH . '/DBV.php';

$dbv = DBV::instance();
$dbv->authenticate();
$dbv->dispatch();
