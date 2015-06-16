<?php

require 'TokenGenerator.php';

/*

Example of token generation.

In order to use these tokens, you need to have a working http://algorea.pem.dev
and have to insert the right keys in the tm_platform SQL table.

*/

require_once __DIR__.'/../config.php';

$tokenGenerator = new TokenGenerator($config->platform->name, $config->platform->private_key);

$params = array(
   'idTask'               => 1869,
   'idUser'               => -1,
   'idChapter'            => 642,
   'bIsAdmin'             => 0,
   'bIsTrainer'           => 0,
   'bHasAccessCorrection' => true,
   'bSubmissionPossible'  => true,
   'bIsDefault'           => 1,
   'sSubmissionMode'      => 'limited time',
   'sLogin'               => 'eroux',
   'bHasSolvedTask'       => true,
   'nbHintsGiven'         => 0,
   'nbHintsTotal'         => 0,
);

$token = $tokenGenerator->generateToken($params);

echo $token."\n";
