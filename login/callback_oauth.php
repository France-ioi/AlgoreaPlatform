<?php

require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../shared/connect.php';
require_once __DIR__.'/../shared/listeners.php';
require_once __DIR__.'/../commonFramework/modelsManager/modelsTools.inc.php';
require_once __DIR__.'/lib.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}



function remapUserArray($user) {
    $map = [
        'idUser' => 'id',
        'sLogin' => 'login',
        'sEmail' => 'primary_email',
        'sFirstName' => 'first_name',
        'sLastName' => 'last_name',
        'sStudentId' => 'student_id',
        'sCountryCode' => 'country_code',
        'sBirthDate' => 'birthday',
        'iGraduationYear' => 'graduation_year',
        'sAddress' => 'address',
        'sZipcode' => 'zipcode',
        'sCity' => 'city',
        'sLandLineNumber' => 'primary_phone',
        'sCellPhoneNumber' => 'secondary_phone',
        'sDefaultLanguage' => 'language',
        'sFreeText' => 'presentation',
        'sWebSite' => 'website',
        'sLastIP' => 'ip',
        'aBadges' => 'badges'
    ];
    $res = [];
    foreach($map as $k => $v) {
        $res[$k] = isset($user[$v]) ? $user[$v] : null;
    }

    $res['sSex'] = null;
    if(!empty($user['gender'])) {
        $res['sSex'] = $user['gender'] == 'm' ? 'Male' : 'Female';
    }
    $res['bEmailVerified'] = !empty($user['primary_email_verified']) ? 1 : 0;

    return $res;
}


ob_start();

try {
    if(!isset($_GET['code'])) {
        throw new Exception('Code missed');
    }
    $state = isset($_SESSION['oauth_state']) ? $_SESSION['oauth_state'] : null;
    unset($_SESSION['oauth_state']);
    if(!$state || !isset($_GET['state']) || $_GET['state'] != $state) {
        throw new Exception('Wrong OAuth state');
    }
    $provider = new \League\OAuth2\Client\Provider\GenericProvider($config->login_module['oauth']);
    $access_token = $provider->getAccessToken('authorization_code', [ 'code' => $_GET['code'] ]);
    $user = $provider->getResourceOwner($access_token)->toArray();
    $request = [
        'token' => $access_token->getToken()
    ];
    $params = remapUserArray($user);
} catch(Exception $e) {
    echo json_encode([
        'result' => true,
        'error' => $e->getMessage()
    ]);
    return;
}



if (!$params || empty($params) || !isset($params['idUser']) || !intval($params['idUser'])) {
    echo json_encode(["result" => false, "error" => "invalid or empty user data"]);
    return;
}

foreach ($params as $param_k => $param_v) {
    $_SESSION['login'][$param_k] = $param_v;
}
$_SESSION['login']['sToken'] = $request['token'];
$_SESSION['login']['tempUser'] = 0;
$_SESSION['login']['loginId'] = $params['idUser'];
$query = 'select ID, idGroupSelf, idGroupOwned, bIsAdmin from users where `loginID`= :idUser ;';
$stm = $db->prepare($query);
$stm->execute(array('idUser' => $params['idUser']));
$res = $stm->fetch();
if(!$res) {
    list($userAdminGroupId, $userSelfGroupId) = createGroupsFromLogin($db, $params['sLogin']);
    $userId = getRandomID();

    $stmt = $db->prepare("
        insert into `users`
        (`ID`, `loginID`, `sLogin`, `tempUser`, `sRegistrationDate`, `idGroupSelf`, `idGroupOwned`, `sEmail`, `sFirstName`, `sLastName`, `sStudentId`, `sCountryCode`, `sBirthDate`, `iGraduationYear`, `sAddress`, `sZipcode`, `sCity`, `sLandLineNumber`, `sCellPhoneNumber`, `sDefaultLanguage`, `sFreeText`, `sWebSite`, `sLastIP`)
        values
        (:ID, :idUser, :sLogin, '0', NOW(), :userSelfGroupId, :userAdminGroupId, :sEmail, :sFirstName, :sLastName, :sStudentId, :sCountryCode, :sBirthDate, :iGraduationYear, :sAddress, :sZipcode, :sCity, :sLandLineNumber, :sCellPhoneNumber, :sDefaultLanguage, :sFreeText, :sWebSite, :sLastIP);
    ");
    $stmt->execute([
        'ID' => $userId,
        'idUser' => $params['idUser'],
        'sLogin' => $params['sLogin'],
        'userAdminGroupId' => $userAdminGroupId,
        'userSelfGroupId' => $userSelfGroupId,
        'sEmail' => $params['sEmail'],
        'sFirstName' => $params['sFirstName'],
        'sLastName' => $params['sLastName'],
        'sStudentId' => $params['sStudentId'],
        'sCountryCode' => $params['sCountryCode'],
        'sBirthDate' => $params['sBirthDate'],
        'iGraduationYear' => $params['iGraduationYear'],
        'sAddress' => $params['sAddress'],
        'sZipcode' => $params['sZipcode'],
        'sCity' => $params['sCity'],
        'sLandLineNumber' => $params['sLandLineNumber'],
        'sCellPhoneNumber' => $params['sCellPhoneNumber'],
        'sDefaultLanguage' => $params['sDefaultLanguage'],
        'sFreeText' => $params['sFreeText'],
        'sWebSite' => $params['sWebSite'],
        'sLastIP' => $params['sLastIP'],
    ]);
    $_SESSION['login']['ID'] = $userId;
    $_SESSION['login']['idGroupSelf'] = $userSelfGroupId;
    $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
    $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
    $_SESSION['login']['idGroupOwned'] = $userAdminGroupId;
    $_SESSION['login']['bIsAdmin'] = false;
} else {
    if (isset($params['sEmail']) || isset($params['sFirstName']) || isset($params['sLastName'])) {
        $stmt = $db->prepare("
            update `users` set
                `sEmail` = :sEmail,
                `sFirstName` = :sFirstName,
                `sLastName` = :sLastName,
                `sStudentId` = :sStudentId ,
                `sCountryCode` = :sCountryCode,
                `sBirthDate` = :sBirthDate,
                `iGraduationYear` = :iGraduationYear,
                `sAddress` = :sAddress,
                `sZipcode` = :sZipcode,
                `sCity` = :sCity,
                `sLandLineNumber` = :sLandLineNumber,
                `sCellPhoneNumber` = :sCellPhoneNumber,
                `sDefaultLanguage` = :sDefaultLanguage,
                `sFreeText` = :sFreeText,
                `sWebSite` = :sWebSite,
                `sLastIP` = :sLastIP
            where ID = :ID;");
        $stmt->execute([
            'ID' => $res['ID'],
            'sEmail' => $params['sEmail'],
            'sFirstName' => $params['sFirstName'],
            'sLastName' => $params['sLastName'],
            'sStudentId' =>$params['sStudentId'],
            'sCountryCode' => $params['sCountryCode'],
            'sBirthDate' => $params['sBirthDate'],
            'iGraduationYear' => $params['iGraduationYear'],
            'sAddress' => $params['sAddress'],
            'sZipcode' => $params['sZipcode'],
            'sCity' => $params['sCity'],
            'sLandLineNumber' => $params['sLandLineNumber'],
            'sCellPhoneNumber' => $params['sCellPhoneNumber'],
            'sDefaultLanguage' => $params['sDefaultLanguage'],
            'sFreeText' => $params['sFreeText'],
            'sWebSite' => $params['sWebSite'],
            'sLastIP' => $params['sLastIP'],
        ]);
    }
    $_SESSION['login']['ID'] = $res['ID'];
    $_SESSION['login']['idGroupSelf'] = $res['idGroupSelf'];
    $_SESSION['login']['idGroupOwned'] = $res['idGroupOwned'];
    $_SESSION['login']['bIsAdmin'] = $res['bIsAdmin'];
    $_SESSION['login']['sFirstName'] = (isset($params['sFirstName']) ? $params['sFirstName'] : null);
    $_SESSION['login']['sLastName'] = (isset($params['sLastName']) ? $params['sLastName'] : null);
}
if (isset($params['aBadges'])) {
    handleBadges($_SESSION['login']['ID'], $_SESSION['login']['idGroupSelf'], $params['aBadges']);
}
echo json_encode(array('result' => true, 'sLogin' => $params['sLogin'], 'ID' => $_SESSION['login']['ID'], 'loginData' => $_SESSION['login']));

$json_result = ob_get_contents();
ob_end_clean();
?>

<!DOCTYPE html>
<html>
<body>
    <script type="text/javascript">
        if(window.opener && window.opener['__IOIAuthOnLogin']) {
            window.opener.__IOIAuthOnLogin(<?=$json_result?>);
        } else {
            window.close();
        }
    </script>
</body>
</html>