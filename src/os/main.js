import * as goog from 'google-closure-library/closure/goog/base.js';

goog.declareModuleId('osmain');

import './mixin/mixin.js';
import './ui/adddata.js';
import './ui/clear/clear.js';
import './ui/config/settingswindow.js';
import './ui/globalmenu.js';
import './ui/legend.js';
import './ui/map.js';
import './ui/metrics/metricscontainer.js';
import './ui/modal/aboutmodal.js';
import './ui/module.js';
import './ui/savedwindowui.js';
import './ui/servers.js';
import './ui/slick/slicktree.js';
import './ui/tristatecheckbox.js';
import SettingsInitializerManager from './config/settingsinitializermanager.js';
import FancierWindow from './debug/fancierwindow.js';
import MainCtrl from './mainctrl.js';
import Module from './module.js';
import addDefaultHandlers from './net/adddefaulthandlers.js';
import {ROOT, isMainWindow, setLogWindow} from './os.js';

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');


/**
 * The main directive
 *
 * @return {angular.Directive}
 */
export const mainDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: ROOT + 'views/main.html',
    controller: MainCtrl,
    controllerAs: 'mainCtrl'
  };
};

Module.directive('osMain', [mainDirective]);

/**
 * Load the settings, then manually bootstrap angular.
 * @todo should we display an informative error message if there are no settings?
 */
const appWait = new ConditionalDelay(function() {
  return window.osasm && !!osasm.geodesicInverse;
});

/**
 * After osasm loads, kick off the rest of the application
 */
appWait.onSuccess = function() {
  if (isMainWindow()) {
    try {
      // the main application doesn't care what opened it, and accessing window.opener may cause an exception. get rid
      // of it so things like os.instanceOf don't try using it.
      window.opener = null;
    } catch (e) {
      // this doesn't seem to fail in any browser, but in the off chance it does don't break everything
    }

    setLogWindow(new FancierWindow('os'));

    // set up request handlers
    addDefaultHandlers();

    // initialize settings for this app
    const settingsInitializer = SettingsInitializerManager.getInstance().getSettingsInitializer();
    settingsInitializer.init();
  }
};

appWait.start(50, 10000);
