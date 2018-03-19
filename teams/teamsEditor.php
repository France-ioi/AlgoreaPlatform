<?php

// Configuration
// Login which is allowed to use this interface
$adminLogin = '';
// Pairs of ID and title
$selectItems = [
//    [id_of_the_item, "Name for the item"],
    ];


session_start();
if($_SESSION['login']['sLogin'] != $adminLogin) {
    die('Please log in as the right user to use this interface.');
}

if(isset($_POST['user_id'])) {
    require_once '../shared/connect.php';
    $user = null;
    if(isset($_POST['user_id']) && $_POST['user_id']) {
        $stmt = $db->prepare('SELECT * FROM users WHERE ID = :id;');
        $stmt->execute(['id' => $_POST['user_id']]);
        $user = $stmt->fetch();
    } elseif(isset($_POST['user_sLogin']) && $_POST['user_sLogin']) {
        $stmt = $db->prepare('SELECT * FROM users WHERE sLogin = :sLogin;');
        $stmt->execute(['sLogin' => $_POST['user_sLogin']]);
        $user = $stmt->fetch();
    } elseif(isset($_POST['user_loginId']) && $_POST['user_loginId']) {
        $stmt = $db->prepare('SELECT * FROM users WHERE loginId = :loginId;');
        $stmt->execute(['loginId' => $_POST['user_loginId']]);
        $user = $stmt->fetch();
    } else {
        die('No user selected.');
    }

    if(!$user) {
        die("Couldn't find user.");
    }
    $loginData = $user;
    $request = $_POST;
    $teamsApiBypass = false;
    require_once 'teamsApi.php';
}

?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Teams editor</title>
<script type="text/javascript" src="../bower_components/jquery/dist/jquery.min.js"></script>
<link rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">
<style>
body {width: 800px;margin-left:auto;margin-right:auto;margin-top:50px;}
</style>
</head>
<body>
  <h1>Teams editor</h1>
  <form id="form">
  <div class="well">
  <p>User ID : <input type="text" name="user_id" /></p>
  <p>or user login : <input type="text" name="user_sLogin" /></p>
  <p>or login ID : <input type="text" name="user_loginId" /></p>
  </div>
  <div class="well">
  <p>Action :
    <select name="action">
      <option>getTeam</option>
      <option>createTeam</option>
      <option>joinTeam</option>
      <option>startItem</option>
      <option value="removeTeamMember">removeTeamMember (only another member)</option>
      <option>leaveTeam</option>
    </select>
  </p>
  <p>Item :
    <select name="idItem">
<?php
foreach($selectItems as $si) {
    echo '<option value="'.$si[0].'">'.$si[1]."</option>\n";
}
?>
    </select>
  </p>
  <p>Name (createTeam) : <input type="text" name="name" /></p>
  <p>Password (createTeam, joinTeam) : <input type="text" name="password" /></p>
  <p>idGroupChild (removeTeamMember) : <input type="text" name="idGroupChild" /></p>
  </div>
  </form>
  <p><button onclick="execute();">Execute</button></p>
  <pre id="results"></pre>
  <script type="text/javascript">
function execute() {
    var formData = {};
    $.map($('#form').serializeArray(), function(n, i) {
        formData[n['name']] = n['value'];
    });
    $('#results').text(JSON.stringify(formData));
    $.post('teamsEditor.php', formData, function(res) {
        $('#results').text(JSON.stringify(JSON.parse(res), null, 2));
    });
}
  </script>
</body>
</html>
