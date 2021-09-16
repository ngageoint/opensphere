goog.module('osmain');

goog.require('os.mixin');
goog.require('os.ui.AddDataUI');
goog.require('os.ui.GlobalMenuUI');
goog.require('os.ui.LegendUI');
goog.require('os.ui.Map');
goog.require('os.ui.Module');
goog.require('os.ui.SavedWindowUI');
goog.require('os.ui.ServersUI');
goog.require('os.ui.TriStateCheckboxUI');
goog.require('os.ui.clear.ClearUI');
goog.require('os.ui.config.SettingsWindowUI');
goog.require('os.ui.metrics.MetricsContainerUI');
goog.require('os.ui.modal.AboutModalUI');
goog.require('os.ui.slick.SlickTreeUI');

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const {ROOT, isMainWindow, setLogWindow} = goog.require('os');
const MainCtrl = goog.require('os.MainCtrl');
const {default: Module} = goog.require('os.Module');
const SettingsInitializerManager = goog.require('os.config.SettingsInitializerManager');
const FancierWindow = goog.require('os.debug.FancierWindow');
const addDefaultHandlers = goog.require('os.net.addDefaultHandlers');


/**
 * The main directive
 *
 * @return {angular.Directive}
 */
const mainDirective = function() {
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
var appWait = new ConditionalDelay(function() {
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
    var settingsInitializer = SettingsInitializerManager.getInstance().getSettingsInitializer();
    settingsInitializer.init();
  }
};

appWait.start(50, 10000);
