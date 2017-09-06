<?php
if (session_status() === PHP_SESSION_NONE){session_start();}

if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
	echo "You must be logged in to use this page.";
	return;
}

require_once '../shared/connect.php';
?>
<!doctype html>
<html>
<head>
  <title>Task reevaluation</title>
  <meta charset="utf-8">

  <script type="text/javascript">
    <?php
      $domainConfig = $config->shared->domains['current'];
      $baseUrl = parse_url($domainConfig->baseUrl, PHP_URL_PATH) ?: '/';
      $assetsBaseUrl = $baseUrl;
      $urlArgs = '';
      if (property_exists($domainConfig, 'assetsBaseUrl')) {
        $assetsBaseUrl = parse_url($domainConfig->assetsBaseUrl, PHP_URL_PATH) ?: '/';
      }
      if (property_exists($domainConfig, 'urlArgs')) {
        $urlArgs = $domainConfig->urlArgs;
      }
      function includeFile($url) {
        global $assetsBaseUrl, $urlArgs;
        return $assetsBaseUrl.$url.$urlArgs;
      }
      echo 'var config = '.json_encode($config->shared).';';
    ?>
  </script>
  <link rel="stylesheet" href="<?= includeFile('bower_components/bootstrap/dist/css/bootstrap.min.css') ?>">
  <script src="<?= includeFile('errors/error_logger.js') ?>"></script>
  <script src="<?= includeFile('bower_components/bowser/src/bowser.js') ?>"></script>
  <script src="<?= includeFile('bower_components/jquery/dist/jquery.min.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('task/evalInterface.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('bower_components/jschannel/src/jschannel.js') ?>"></script>
  <script src="<?= includeFile('bower_components/pem-platform/task-xd-pr.js') ?>"></script>
</head>
<body>
<div class="container">
<?php
if(isset($_GET['groupId']) && isset($_GET['itemId']) && isset($_GET['action'])) {
  if($_GET['action'] == 'start') {
?>
<div><a href="evalInterface.php?groupId=<?=$_GET['groupId'] ?>&itemId=<?=$_GET['itemId'] ?>">Interrupt and return</a></div>
<div id="msg">Starting reevaluation...</div>
<script type="text/javascript">
$(function () {
  startReeval('<?=$_GET['groupId'] ?>', '<?=$_GET['itemId'] ?>');
});
</script>
<?php
  } elseif($_GET['action'] == 'continue') {
?>
<div><a href="evalInterface.php?groupId=<?=$_GET['groupId'] ?>&itemId=<?=$_GET['itemId'] ?>">Interrupt and return</a></div>
<div id="msg">Continuing reevaluation...</div>
<iframe id="evalIframe" width="100%" height="800px"></iframe>
<script type="text/javascript">
$(function () {
  continueReeval('<?=$_GET['groupId'] ?>', '<?=$_GET['itemId'] ?>');
});
</script>
<?php
  } else {
    die('Action '.$_GET['action'].' unknown. <a href="evalInterface.php">Return</a>');
  }
} else {
?>
<h1>Task reevaluation</h1>

<form method="get">
  <div class="form-group">
    <label for="groupId">Group ID</label>
    <input type="text" class="form-control" id="groupId" name="groupId" value="<?=(isset($_GET['groupId']) ? $_GET['groupId'] : '') ?>" />
  </div>
  <div class="form-group">
    <label for="itemId">Item ID</label>
    <input type="text" class="form-control" id="itemId" name="itemId" value="<?=(isset($_GET['itemId']) ? $_GET['itemId'] : '') ?>" />
  </div>
  <div class="form-group">
    Start or continue a reevaluation?
    <div class="radio">
      <label><input type="radio" name="action" value="start">Start</label>
    </div>
    <div class="radio">
      <label><input type="radio" name="action" value="continue" checked>Continue</label>
    </div>
  </div>
  <button type="submit" class="btn btn-default">Submit</button>
</form>
<?php
}
?>
</div>
</body>
</html>
