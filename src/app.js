window.$ = window.jQuery = require('jquery');
window.bowser = require('../bower_components/bowser/src/bowser.js');
window.ErrorLogger = require('../errors/error_logger.js');


require('angular');
require("jquery-ui/ui/widgets/sortable");
require('angular-ui-sortable');
//require('angu-fixed-header-table');
require('../bower_components/angu-fixed-header-table/angu-fixed-header-table.js');
require('angular-ui-router');


// localization
require('../bower_components/angular-i18n/angular-locale_' + WEBPACK_ENV.DEFAULT_LOCALE + '.js');
require('../bower_components/angular-sanitize/angular-sanitize.min.js');
require('../bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js');
window.i18next = require('i18next');
window.i18nextXHRBackend = require('i18next-xhr-backend');
window.i18nextSprintfPostProcessor = require('i18next-sprintf-postprocessor');
require('ng-i18next');


// task/platform api
window.Channel = require('jschannel');
require('../bower_components/pem-platform/task-xd-pr.js');


// models
require('../commonFramework/modelsManager/modelsManager.js');
require('../commonFramework/sync/syncQueue.js');
require('../shared/models.js');
require('../i18n/i18n-object.js');
require('../shared/small-ui-confirm.js');




require('../login/service.js');
require('../algorea.js');
require('../contest/contestTimerService.js');
require('../contest/contestTimerDirective.js');
require('../layout.js');

require('../navigation/service.js');
require('../navigation/controllers.js');
require('../navigation/chapterController.js');
require('../navigation/directives.js');
require('../community/controller.js');

require('../login/controller.js');
require('../states.js');
require('../task/controller.js');
require('../task/directive.js');

require('../task/modifyController.js');
require('../profile/profileController.js');
require('../profile/myAccountController.js');
require('../profile/groupsOwnerController.js');
require('../profile/groupsMemberController.js');
require('../groupCodePrompt/controller.js');
require('../groupAdmin/groupAdminController.js');
require('../teams/controller.js');
require('../groupAdmin/groupAccountsManagerController.js');
require('../groupAdmin/groupSubgroupsController.js');
require('../userInfos/controller.js');


if(WEBPACK_ENV.USE_MAP) {
    require('../bower_components/paper/dist/paper-full.min.js');
    require('jquery-mousewheel');
    require('../bower_components/jquery-mousewheel/jquery.mousewheel.min.js');
    require('../map/mapService.js');
    require('../map/map.js');
}

if(WEBPACK_ENV.USE_FORUM) {
    require('jquery-ui/ui/widgets/dynatree');
    require('../bower_components/dynatree/dist/jquery.dynatree.min.js');
    require('../shared/utils.js');
    require('../ext/inheritance.js');
    require('../commonFramework/treeview/treeview.js');
    require('../forum/forumIndexController.js');
    require('../forum/forumFilterController.js');
    require('../shared/treeviewDirective.js');
    require('../forum/forumThreadController.js');

    require('../bower_components/dynatree/dist/skin/ui.dynatree.css');
    require('../forum/forum.css');
}


// styles
require('bootstrap/dist/css/bootstrap.css');
require('../layout/3columns-flex.css');
require('../layout/menu.css');
require('../layout/main.css');
require('../layout/sidebar-left.css');
require('../layout/sidebar-right.css');
require('../groupAdmin/groupAdmin.css');
require('../profile/groups.css');
require('../algorea.css');