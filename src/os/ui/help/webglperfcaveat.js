goog.declareModuleId('os.ui.help.WebGLPerfCaveatUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
const {getAppName, getSupportContact} = goog.require('os.config');
const Settings = goog.require('os.config.Settings');


/**
 * The webglsupport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/help/webglperfcaveat.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'webglperfcaveat';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Launches a dialog telling the user their browser is terrible.
 *
 * @param {string=} opt_title The window title
 * @param {function()=} opt_overrideCallback The function to call if user decides to override
 */
export const launchWebGLPerfCaveatDialog = function(opt_title, opt_overrideCallback) {
  var scopeOptions = {
    'confirmCallback': () => {},
    'cancelCallback': opt_overrideCallback || (() => {}),
    'hideCancel': !opt_overrideCallback,
    'supportLink': /** @type {string|undefined} */ (Settings.getInstance().get('webgl.performanceCaveat.supportLink')),
    'yesText': 'Got it!',
    'yesIcon': 'fa fa-thumbs-up',
    'yesButtonTitle': 'Cancel and continue using 2D.',
    'yesButtonClass': 'btn-primary',
    'noText': 'Use 3D',
    'noIcon': 'fa fa-warning',
    'noButtonTitle': 'Switch to 3D, but you may experience poor performance on this browser.',
    'noButtonClass': 'btn-danger'
  };

  var windowOptions = {
    'label': opt_title || 'WebGL Performance Issue',
    'icon': 'fa fa-frown-o',
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

  scopeOptions['appName'] = getAppName('the application');
  scopeOptions['supportText'] = getSupportContact('your system administrator');

  var template = '<confirm><webglperfcaveat></webglperfcaveat></confirm>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
