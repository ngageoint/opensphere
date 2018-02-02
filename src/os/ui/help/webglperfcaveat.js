goog.provide('os.ui.help.webGLPerfCaveatDirective');
goog.require('goog.userAgent');
goog.require('os.config');
goog.require('os.ui.Module');
goog.require('os.ui.util.LinkyFilter');
goog.require('os.ui.window');


/**
 * The webglsupport directive
 * @return {angular.Directive}
 */
os.ui.help.webGLPerfCaveatDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/help/webglperfcaveat.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('webglperfcaveat', [os.ui.help.webGLPerfCaveatDirective]);



/**
 * Launches a dialog telling the user their browser is terrible.
 * @param {string=} opt_title The window title
 * @param {function()=} opt_overrideCallback The function to call if user decides to override
 */
os.ui.help.launchWebGLPerfCaveatDialog = function(opt_title, opt_overrideCallback) {
  var scopeOptions = {
    'confirmCallback': goog.nullFunction,
    'cancelCallback': opt_overrideCallback || goog.nullFunction,
    'hideCancel': !opt_overrideCallback,
    'supportLink': /** @type {string|undefined} */ (os.settings.get('webgl.performanceCaveat.supportLink')),
    'yesText': 'Got it!',
    'yesIcon': 'fa fa-thumbs-up',
    'yesButtonTitle': 'Cancel and continue using 2D.',
    'noText': 'Use 3D',
    'noIcon': 'fa fa-warning orange-icon',
    'noButtonTitle': 'Switch to 3D, but you may experience poor performance on this browser.'
  };

  var windowOptions = {
    'label': opt_title || 'WebGL Performance Issue',
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

  var template = '<confirm><webglperfcaveat></webglperfcaveat></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
