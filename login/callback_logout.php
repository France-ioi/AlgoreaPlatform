<?php

    require_once __DIR__.'/../shared/connect.php';
    require_once __DIR__.'/../shared/listeners.php';
    require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
    require_once __DIR__.'/lib.php';

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    ob_start();
    $_SESSION['login'] = array();
    createTempUser($db);
    $json_result = ob_get_contents();
    ob_end_clean();
?>


<!DOCTYPE html>
<html>
<body>
    <script type="text/javascript">
        if(window.opener && window.opener['__LoginModuleOnLogout']) {
            window.opener.__LoginModuleOnLogout(<?=$json_result?>);
        } else {
            window.close();
        }
    </script>
</body>
</html>