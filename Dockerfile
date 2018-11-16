FROM php:7.0-apache

RUN a2enmod rewrite headers

RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN php composer-setup.php --install-dir=/bin
RUN php -r "unlink('composer-setup.php');"

RUN apt-get update
RUN apt-get -y install git unzip nodejs-legacy vim mysql-client libgmp-dev build-essential libssl-dev gnupg2
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get -y install nodejs
RUN npm install -g bower

RUN docker-php-ext-install gmp mysqli pdo pdo_mysql

WORKDIR /var/www/html/

COPY composer.json composer.lock ./
RUN composer.phar install --no-plugins --no-scripts

COPY bower.json ./
RUN bower install --allow-root

COPY config/apache.conf /etc/apache2/sites-available/algorea.conf
RUN a2dissite 000-default
RUN a2ensite algorea
RUN mkdir /var/www/html/logs && ln -s /var/log/apache2 /var/www/html/logs/apache

COPY . ./
RUN chown -R www-data:www-data *

EXPOSE 80
