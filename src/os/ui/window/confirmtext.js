goog.declareModuleId('os.ui.window.ConfirmTextUI');

import '../util/validationmessage.js';
import * as fn from '../../fn/fn.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as osWindow from '../window.js';
import WindowEventType from '../windoweventtype.js';
import {directiveTag as confirmUi} from './confirm.js';


/**
 * Text confirmation dialog.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/window/confirmtext.html',
  controller: Controller,
  controllerAs: 'confirmtext'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'confirmtext';

/**
 * Add the directive to the os.ui module
 */
Module.directive('confirmtext', [directive]);

/**
 * Controller for the text confirmation window.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    $scope.$watch('confirmValue', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Angular initialization lifecycle function.
   */
  $onInit() {
    if (this.scope_.$parent['select']) {
      this.element_.find('.js-confirm-input').select();
    }

    this.element_.find('.js-confirm-input').focus();
  }
}

/**
 * Launch a dialog prompting the user to enter some text.
 *
 * @param {osx.window.ConfirmTextOptions=} opt_options The window options
 */
export const launchConfirmText = function(opt_options) {
  var options = /** @type {!osx.window.ConfirmTextOptions} */ (opt_options || {});
  var scopeOptions = {
    'confirmCallback': options.confirm || fn.noop,
    'cancelCallback': options.cancel || fn.noop,
    'confirmValue': options.defaultValue,
    'yesText': options.yesText || 'OK',
    'yesIcon': options.yesIcon || 'fa fa-check',
    'yesButtonClass': options.yesButtonClass || 'btn-primary',
    'yesButtonTitle': options.yesButtonTitle || '',
    'noText': options.noText || 'Cancel',
    'noIcon': options.noIcon || 'fa fa-ban',
    'noButtonClass': options.noButtonClass || 'btn-secondary',
    'noButtonTitle': options.noButtonTitle || '',
    'checkboxText': options.checkboxText || '',
    'checkboxClass': options.checkboxClass || '',
    'checkboxCallback': options.checkbox || fn.noop,
    'checkboxValue': !!options.checkboxValue,

    // confirm text options
    'select': !!options.select,
    'limit': options.limit || 200,
    'formLabel': options.formLabel,
    'prompt': options.prompt,
    'subPrompt': options.subPrompt
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  var windowOptions = {
    'label': windowOverrides.label || 'Enter Text',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': windowOverrides.width || 325,
    'height': windowOverrides.height || 'auto',
    'modal': windowOverrides.modal != null ? windowOverrides.modal : 'true',
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : 'false'
  };

  var template = `<${confirmUi}><${directiveTag}></${directiveTag}></${confirmUi}>`;
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
