goog.declareModuleId('os.ui.im.URLExistsUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as ConfirmUI from '../window/confirm.js';
import WindowEventType from '../windoweventtype.js';
import URLExistsChoice from './urlexistschoice.js';


/**
 * Dialog used when a user tries importing a duplicate url.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/im/urlexists.html',
  controller: Controller,
  controllerAs: 'urlExists'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'urlexists';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the URL Exists! window
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    $scope.$watch('confirmValue', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(WindowEventType.READY);
  }
}

/**
 * Launch a dialog prompting the user the url they're importing already exists and requesting action.
 *
 * @param {string} url
 * @param {string} current
 * @param {function(URLExistsChoice)} confirm
 */
export const launchURLExists = function(url, current, confirm) {
  var confirmOptions = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: URLExistsChoice.ACTIVATE,
    prompt: `<${directiveTag}></${directiveTag}>`,
    windowOptions: {
      'label': 'URL Exists!',
      'icon': 'fa fa-exclamation-triangle',
      'x': 'center',
      'y': 'center',
      'width': 450,
      'height': 'auto',
      'modal': true,
      'show-close': true
    }
  });

  var scopeOptions = {
    'current': current,
    'url': url
  };

  ConfirmUI.launchConfirm(confirmOptions, scopeOptions);
};
