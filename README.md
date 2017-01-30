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
cp -p config_local_template.php config_local.php
```

then fill `config_local.php` with your configuration, including database and item IDs (you can choose them arbitrarily).

To install the database, check the last version in the `schema` folder, and from it, execute `full_schema.sql` and then each revision in order. (Check `schema/README.md` for more information.)

You must then run

```
php commonFramework/modelsManager/triggers.php
```

Finally, run 

```
php shared/initPlatform.php
```

this will make a boilerplate for a platform. You can use this script again if you want to set up another platform on the same database, with different item IDs.
