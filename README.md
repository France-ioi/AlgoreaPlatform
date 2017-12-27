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
git clone [repository url]
cd AlgoreaPlatform
git submodule update --init
bower install
composer install
cp -p config_local_template.php config_local.php
```

then fill `config_local.php` with your configuration, including database and item IDs (you can choose them arbitrarily).

To install the database, check the last version in the `schema` folder, and from it, execute `full_schema.sql` and then each revision in order or use commonFramework/schema-migrate.php script. (Check `schema/README.md` for more information.)

You must then run

```
php commonFramework/modelsManager/triggers.php
```

Finally, run

```
php shared/initPlatform.php
```

this will make a boilerplate for a platform. You can use this script again if you want to set up another platform on the same database, with different item IDs.

To add users as administrators on this platform, they must first log into the platform (to have their user created within the platform), then check the `shared/addAdmin.php` script to add them as users. You'll need to modify the configuration at the beginning of the file.

## Webserver configuration

Example webserver configurations.

### On Apache2

```
<VirtualHost *:80>
    [your other config]

    DocumentRoot /path/to/algorea/

    # Redirect all requests to index.php, except for existing files
    RewriteEngine on
    RewriteCond /path/to/algorea/%{REQUEST_FILENAME} !-d
    RewriteCond /path/to/algorea/%{REQUEST_FILENAME} !-f
    RewriteRule . /index.php [L,QSA]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</VirtualHost>
```

### On Nginx

```
server {
  [your other config]

  root /path/to/algorea;

  location / {
    try_files $uri /index.php;
    include /etc/nginx/mime.types;
  }
  location ~* \.php {
     try_files $uri =404;
     fastcgi_pass unix:/var/run/php5-fpm.sock;
     include fastcgi.conf;
     include fastcgi_params;
     fastcgi_read_timeout 120;
     fastcgi_cache off;
     fastcgi_buffer_size 256k;
     fastcgi_buffers 4 256k;
     fastcgi_busy_buffers_size 256k;
     fastcgi_param HTTP_AUTHORIZATION $http_authorization;
  }
}
```
