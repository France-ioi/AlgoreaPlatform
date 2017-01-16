# AlgoreaPlatform

## Documentation

A [developer documentation](https://docs.google.com/document/d/1QV9RhYjtPfiTLJAOBRYtBtrOeUSclCKGjvtvJmVEdX0/edit?usp=sharing) of the architecture of this platform is available.

## Dependencies

The Algorea Platform depends on:

- php
- mysql
- zip
- composer
- bower

## Installation

This repository contains the source code for the Algorea Platform.

To set up:

```
git clone thisurl
git submodule update --init
bower install
composer install
cp config_local_template.php config_local.php
```

then fill `config_local_template.php` with your configuration, including database and item IDs (you can choose them arbitrarily).

To fill the database, visit `dbv/index.php` using the database login/password and follow the described steps. You must then run

```
php commonFramework/modelsManager/triggers.php
```

Finally, run 

```
php shared/initPlatform.php
```

this will make a boilerplate for a platform. You can use this script again if you want to set up another platform on the same database, with different item IDs.
