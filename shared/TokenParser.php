<?php
/* Copyright (c) 2013 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

require_once(dirname(__FILE__)."/../vendor/autoload.php");

use Namshi\JOSE\JWS;

/**
 * Generates task token
 */
class TokenParser
{
   /**
    * Public key
    */
   private $publicKey;
   
   function __construct($publicKey) {
      $this->publicKey = openssl_pkey_get_public($publicKey);
   }
   /**
    * Decode tokens
    */
   public function decodeToken($encryptedParams)
   {
      $jws  = JWS::load($encryptedParams);;
      if ($jws->verify($this->publicKey)) {
          $params = $jws->getPayload();
      }
      $datetime = new DateTime();
      $datetime->modify('+1 day');
      $tomorrow = $datetime->format('d-m-Y');
      if (!isset($params['date'])) {
         if (!$params) {
            throw new Exception('Token cannot be decrypted, please check your SSL keys');
         }
         else {
            throw new Exception('Invalid Task token, unable to decrypt: '.$params.'; current: '.date('d-m-Y'));
         }
      }
      else if ($params['date'] != date('d-m-Y') && $params['date'] != $tomorrow) {
         throw new Exception('API token expired');
      }
      
      return $params;
   }
}
