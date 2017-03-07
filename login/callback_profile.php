<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/lib.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

ob_start();

try {
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $authorization_helper = $client->getAuthorizationHelper();
    $user = $authorization_helper->queryUser();
    $params = remapUserArray($user);
    createUpdateUser($db, $params);
} catch(Exception $e) {
    echo json_encode([
        'result' => true,
        'error' => $e->getMessage()
    ]);
}

$json_result = ob_get_contents();
ob_end_clean();

?>
<!DOCTYPE html>
<html>
<body>
    <script type="text/javascript">
        if(window.opener && window.opener['__LoginModuleOnProfile']) {
            window.opener.__LoginModuleOnProfile(<?=$json_result?>);
        } else {
            window.close();
        }
    </script>
</body>
</html>