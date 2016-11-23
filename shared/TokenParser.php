<?php
/* Copyright (c) 2013 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

require_once(dirname(__FILE__)."/../vendor/autoload.php");

use Jose\Factory\DecrypterFactory;
use Jose\Factory\VerifierFactory;
use Jose\Factory\JWKFactory;
use Jose\Loader;
use Jose\Object\JWKSet;

/**
 * Generates task token
 */
class TokenParser
{
   private $key;
   private $keyName;
   
   private $key2;
   private $key2Name;
   
   // for just jws or just jwe, use key, for jws then jwe, key is for jws, key2 for jwe
   function __construct($key, $keyName, $keyType=null, $key2 = null, $key2Name = null, $key2Type = null) {
      $this->key = JWKFactory::createFromKey($key, null, array('kid' => $keyName));
      $this->keyName = $keyName;
      $this->keys = new JWKSet();
      $this->keys = $this->keys->addKey($this->key);
      if ($key2) {
         $this->key2 = JWKFactory::createFromKey($key2, null, array('kid' => $key2Name));
         $this->key2Name = $key2Name;
         $this->keys = $this->keys->addKey($this->key2);
      }
   }

   /**
    * Decode JWS tokens
    */
   public function decodeJWS($tokenString)
   {
      $loader = new Loader();
      $signature_index = null;
      $result = $loader->loadAndVerifySignatureUsingKey(
         $tokenString,
         $this->key,
         ['RS512'],
         $signature_index
      );
      $datetime = new DateTime();
      $datetime->modify('+1 day');
      $tomorrow = $datetime->format('d-m-Y');
      $params = $result->getPayload();
      if (!isset($params['date'])) {
         if (!$params) {
            throw new Exception('Token cannot be decrypted, please check your SSL keys');
         }
         else {
            throw new Exception('Invalid Task token, unable to decrypt: '.json_encode($params).'; current: '.date('d-m-Y'));
         }
      }
      else if ($params['date'] != date('d-m-Y') && $params['date'] != $tomorrow) {
         throw new Exception('API token expired');
      }
      
      return $params;
   }

   /**
    * Decode JWE tokens// TODO: test
    */
   public function decodeJWE($tokenString)
   {
      $result = Loader::load($tokenString);
      $decrypter = DecrypterFactory::createDecrypter(['A256CBC-HS512','RSA-OAEP-256']);
      $decrypter->decryptUsingKeySet($result, $this->keys);
      return $result->getPayload();
   }

   // JWE token signed with key2, containing JWS token signed with key
   public function decodeJWES($tokenString)
   {
      $jws = $this->decodeJWE($tokenString);
      return $this->decodeJWS($jws);
   }

}
