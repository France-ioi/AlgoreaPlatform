<?php
/* Copyright (c) 2013 Association France-ioi, MIT License http://opensource.org/licenses/MIT */

require_once(dirname(__FILE__)."/../vendor/autoload.php");

use Jose\Factory\EncrypterFactory;
use Jose\Factory\SignerFactory;
use Jose\Factory\JWKFactory;
use Jose\Factory\JWSFactory;
use Jose\Factory\JWEFactory;
use Jose\Object\JWKSet;

/**
 * Generates task token
 */
class TokenGenerator
{
   private $keyName;
   private $key;
   
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
    * JWS encryption function // TODO: use spomky-labs/jose-service
    */
   public function encodeJWS($params)
   {
      $params['date'] = date('d-m-Y');
      $jws = JWSFactory::createJWS($params);
      $signer = SignerFactory::createSigner(['RS512']);
      $signer->addSignature(
         $jws,
         $this->key,
         ['alg' => 'RS512']
      );
      return $jws->toCompactJSON(0);
      //return $jws;
   }

   public function encodeJWE($params, $useKey2 = false)
   {
      if ($useKey2) {
        $key = $this->key2;
        $keyName = $this->key2Name;
      } else {
        $key = $this->key;
        $keyName = $this->keyName;
        $params['date'] = date('d-m-Y');
      }
      $jwe = JWEFactory::createJWE(
         $params,
         [
            'alg' => 'RSA-OAEP-256',
            'enc' => 'A256CBC-HS512',
            'zip' => 'DEF',
         ]
      );
      $encrypter = EncrypterFactory::createEncrypter(['RSA-OAEP-256','A256CBC-HS512']);
      $encrypter->addRecipient($jwe, $key);
      return $jwe->toCompactJSON(0);
   }

   // JWE token signed with key2, containing JWS token signed with key
   public function encodeJWES($params)
   {
      $jws = $this->encodeJWS($params);
      $jwes = $this->encodeJWE($jws, true);
      return $jwes;
   }
}
