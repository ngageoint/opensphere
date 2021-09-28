goog.declareModuleId('os.ui.help.WebGLSupportUI');

import {getAppName, getSupportContact} from '../../config/config.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as ConfirmUI from '../window/confirm.js';
import WindowEventType from '../windoweventtype.js';

const userAgent = goog.require('goog.userAgent');


/**
 * The webglsupport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  link: webGLSupportLink,
  templateUrl: ROOT + 'views/help/webglsupport.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'webglsupport';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Fire the window ready event for auto height.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 */
const webGLSupportLink = function($scope) {
  $scope.$emit(WindowEventType.READY);
};

/**
 * Launches a dialog telling the user their browser is terrible.
 *
 * @param {string=} opt_title The window title
 */
export const launchWebGLSupportDialog = function(opt_title) {
  var scopeOptions = {
    'hideCancel': true
  };

  var windowOptions = {
    'label': opt_title || 'WebGL Not Supported',
    'headerClass': 'bg-warning u-bg-warning-text',
    'icon': 'fa fa-frown-o',
    'x': 'center',
    'y': 'center',
    'width': 525,
    'min-width': 300,
    'max-width': 1000,
    'height': 'auto',
    'min-height': 200,
    'max-height': 1000,
    'modal': true
  };

  scopeOptions['appName'] = getAppName('the application');
  scopeOptions['supportText'] = getSupportContact('your system administrator');

  if (userAgent.IE && userAgent.VERSION == 11) {
    scopeOptions['showIEHelp'] = true;
  } else if (userAgent.GECKO && userAgent.isVersionOrHigher(10)) {
    scopeOptions['showFFHelp'] = true;
  } else if (userAgent.WEBKIT && userAgent.isVersionOrHigher(28)) {
    scopeOptions['showGCHelp'] = true;
  }

  ConfirmUI.launchConfirm(/** @type {!osx.window.ConfirmOptions} */ ({
    prompt: `<${directiveTag}></${directiveTag}>`,
    windowOptions: windowOptions
  }), scopeOptions);
};
