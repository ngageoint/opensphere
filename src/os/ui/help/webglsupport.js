goog.provide('os.ui.help.webGLSupportDirective');
goog.require('goog.userAgent');
goog.require('os.config');
goog.require('os.ui.Module');
goog.require('os.ui.util.LinkyFilter');
goog.require('os.ui.window');


/**
 * The webglsupport directive
 * @return {angular.Directive}
 */
os.ui.help.webGLSupportDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/help/webglsupport.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('webglsupport', [os.ui.help.webGLSupportDirective]);


/**
 * Launches a dialog telling the user their browser is terrible.
 * @param {string=} opt_title The window title
 */
os.ui.help.launchWebGLSupportDialog = function(opt_title) {
  var scopeOptions = {
    'confirmCallback': goog.nullFunction,
    'hideCancel': true,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon'
  };

  var windowOptions = {
    'label': opt_title || 'WebGL Not Supported',
    'icon': 'fa fa-frown-o yellow-icon',
    'x': 'center',
    'y': 'center',
    'width': '425',
    'min-width': '300',
    'max-width': '600',
    'height': '200',
    'min-height': '200',
    'max-height': '500',
    'modal': 'true'
  };

  scopeOptions['appName'] = os.config.getAppName('the application');
  scopeOptions['supportText'] = os.config.getSupportContact('your system administrator');

  if (goog.userAgent.IE && goog.userAgent.VERSION == 11) {
    scopeOptions['showIEHelp'] = true;
    windowOptions['height'] = 300;
  } else if (goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher(10)) {
    scopeOptions['showFFHelp'] = true;
    windowOptions['height'] = 300;
  } else if (goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher(28)) {
    scopeOptions['showGCHelp'] = true;
    windowOptions['height'] = 300;
  }

  var template = '<confirm><webglsupport></webglsupport></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
