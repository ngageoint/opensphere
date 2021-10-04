goog.declareModuleId('os.ui.im.FileExistsUI');

import {getAppName} from '../../config/config.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as ConfirmUI from '../window/confirm.js';
import WindowEventType from '../windoweventtype.js';
import FileExistsChoice from './fileexistschoice.js';

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Dialog used when a user tries importing a duplicate file.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/im/fileexists.html',
  controller: Controller,
  controllerAs: 'fileExists'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'fileexists';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the File Exists! window
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

    $scope['application'] = getAppName('the application');
    $scope.$emit(WindowEventType.READY);
  }
}

/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {!OSFile} file
 * @param {function(FileExistsChoice)} confirm
 */
export const launchFileExists = function(file, confirm) {
  var confirmOptions = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: FileExistsChoice.SAVE_NEW,
    prompt: `<${directiveTag}></${directiveTag}>`,
    windowOptions: {
      'label': 'File Exists!',
      'icon': 'fa fa-exclamation-triangle',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'modal': true,
      'show-close': true
    }
  });

  var scopeOptions = {
    'fileName': file.getFileName()
  };

  ConfirmUI.launchConfirm(confirmOptions, scopeOptions);
};
