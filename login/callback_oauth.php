<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/lib.php';
require_once __DIR__.'/../shared/UserHelperClass.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$groupCodeEnter = isset($_SESSION['groupCodeEnter']) ? $_SESSION['groupCodeEnter'] : null;
unset($_SESSION['groupCodeEnter']);
if(isset($_SESSION['login']) && is_array($_SESSION['login']) && $_SESSION['login']['ID'] != $groupCodeEnter['idUser']) {
    $groupCodeEnter = null;
}

ob_start();

try {
    $client = new FranceIOI\LoginModuleClient\Client($config->login_module_client);
    $authorization_helper = $client->getAuthorizationHelper();
    $authorization_helper->handleRequestParams($_GET);
    $user = $authorization_helper->queryUser();
    $params = remapUserArray($user);
    createUpdateUser($db, $params);
    $user_helper = new UserHelperClass($db);
    if($groupCodeEnter) {
        $user_helper->addUserToGroup(
            $_SESSION['login']['idGroupSelf'],
            $groupCodeEnter['idGroup']
        );
    }
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
        var platform = window.opener ? window.opener : parent;
        if(platform && platform['__LoginModuleOnLogin']) {
            platform.__LoginModuleOnLogin(<?=$json_result?>);
        }
        window.close();
        if(!platform || platform === window) {
            // If we get there, we weren't in a popup and we can redirect
            window.location = '<?php echo $config->shared->domains['current']->baseUrl ?>';
        }
    </script>
</body>
</html>
