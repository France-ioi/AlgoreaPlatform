This folder contains the SQL schema of the database, from old version to the latest one.

Each version 1.x is made of a base schema, `full_schema.sql`, completed with
incremental revisions in each numbered folder.

`full_schema.sql` is a consolidated version of the base version and all
revisions of the previous versions.

If installing: use the latest version, execute `full_schema.sql`, then each of
the revisions, or run (replace 1.1 with latest version):
```
php commonFramework/schema-migrate.php start 1.1/revision-001
php commonFramework/schema-migrate.php
```

If upgrading: apply revisions from your current version, and then the revisions
of each subsequent version. Ignore the files `full_schema.sql`.
