mysql -uroot -p algorea_platform_login_module_v2 < schema/1.1/full_schema.sql
cd commonFramework
php schema-migrate.php start 1.1/revision-001
php schema-migrate.php
cd ..
php commonFramework/modelsManager/triggers.php
php shared/initPlatform.php