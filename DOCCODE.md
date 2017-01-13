# Code documentation

## Data synchronisation between server and client

The mechanism used here comes from [the commonFramework repository](https://github.com/France-ioi/commonFramework), quite complex and only partially documented ([this doc](https://docs.google.com/document/d/1i0lFz-UOtS4TeRy2iypCWa-ItWaRPN1x_bAPGXi5nO0) is not complete nor up to date but still useful).

The basic idea is the following:
- in the database, all data have a version, and there is an history of all changes in the corresponding `history_foo` tables
- on the server side, create php *request* objects describing the different fields, JOINs, WHEREs, etc. of the sql requests
- on the client size, ask for a particular request (giving it some arguments such as the minimum version of the data you want)
- at a client request, the server will create the `SQL` requests (select, insert, update or delete) based on the php *request* objects and the arguments given by the client

This mechanism uses a complex trigger machinery to fill the `history_foo` tables, and we add a few [custom triggers](shared/custom_triggers.php) on top of that. At each modification of the data, the mechanism calls some [custom code](shared/listeners.php).

The request objects are built by different files:
- [shared/models.php](shared/models.php) has the structure of the sql tables (`$tablesModels`) and contains the basis (joins, conditions, etc.) on top of which all the requests will be built (`$viewsModels`)
- [shared/syncRequests.php](shared/syncRequests.php) defines the requests for the groups and the admin interface
- [syncRequests/](syncRequests/) contains files to build other requests through a quite simple mechanism called "requestSet"

Note that [shared/syncRequests-users_items.inc.php](shared/syncRequests-users_items.inc.php) takes the data retrieved in sql and adds tokens for the users_items that have been fetched.

## The different parts

- URL handling is in [states.js](states.js)
- the [layout/ folder](layout/) contains everything related to the global layout (including some JavaScript)
- the basis of the UI (displaying items, left panel, breadcrumbs, menu, etc.) is in the [navigation/ folder](navigation/)
- the forum is in the [forum](forum/) folder, the files in this folder are also used for in-task forum display and group admin interface popups
- a complex administration interface lies in [admin/](admin/), it uses a different page accessed at the `admin/index.html` address
- a more simple group administration interface (for teachers) lies in the [groupAdmin/ folder](groupAdmin/)
- user group management (joining a group, accepting an invitation, etc.) is made in the [groupRequests/ folder](groupRequests/) folder
- the right panel is in the [community](community/) folder, but almost only includes the files from the group user interface in the [groupRequests](groupRequests) folder
- the glue with the [login module](https://github.com/France-ioi/login-module) is in the [login/ folder](login/)
- a deprecated mechanism to display a level as a map is present in [map/](map/)
- all the task handling mechanism (using the [API](https://docs.google.com/document/d/1JMca_fGNyLtSPjsTuIv2owcnNt2lH4iHkZ1pTURIL6A/edit), etc.) is in the [task/ folder](task/)
- when clicking on its user name, user gets to the [userInfos/ folder](userInfos/) files, mostly deprecated, they now mostly include groupRequests and groupAdmin
- translation strings (used with [angular-18next](https://github.com/i18next/ng-i18next)) are in [i18n/](i18n/)
