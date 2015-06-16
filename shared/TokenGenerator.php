<?php
/* Copyright (c) 2013 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

require_once(dirname(__FILE__)."/../vendor/autoload.php");

use Namshi\JOSE\JWS;

/**
 * Generates task token
 */
class TokenGenerator
{
   /**
    * Platform url.
    */
   private $platform;
   /**
    * Task private key
    */
   private $privateKey;
   
   function __construct($platform, $privateKey) {
      $this->platform = $platform;
      $this->privateKey = openssl_pkey_get_private($privateKey);
   }
   /**
    * Low level token encryption function
    */
   private function encodeToken($params)
   {
      $jws  = new JWS(array('alg' => 'RS512'));
      $jws->setPayload($params);
      $jws->sign($this->privateKey);
      return $jws->getTokenString();
   }
   /**
    * Generates the token. Expects the following parameters:
    *    => idUser
    *    => sLogin
    *    => isDefault (deprecated?)
    *    => bHasSolvedTask
    *    => nbHintsTotal
    *    => nbHintsGiven
    *    => bIsTrainer
    *    => bIsAdmin
    *    => bHasAccessCorrection
    *    => bSubmissionPossible
    *    => idTask
    *    => idChapter
    *    => sSubmissionMode (Contests, limited time, etc.)
    */
   public function generateToken($params)
   {
      $additionalParams = array(
          'date' => date('d-m-Y'),
          'platform' => urlencode($this->platform),
      );
      $sToken = $this->encodeToken(array_merge($params, $additionalParams));
      return $sToken;
   }
}
