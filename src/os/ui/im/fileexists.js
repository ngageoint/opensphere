goog.module('os.ui.im.FileExistsUI');

const {ROOT} = goog.require('os');
const {getAppName} = goog.require('os.config');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const FileExistsChoice = goog.require('os.ui.im.FileExistsChoice');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');


/**
 * Dialog used when a user tries importing a duplicate file.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/im/fileexists.html',
  controller: Controller,
  controllerAs: 'fileExists'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'fileexists';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the File Exists! window
 * @unrestricted
 */
class Controller {
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
 * @param {!os.file.File} file
 * @param {function(FileExistsChoice)} confirm
 */
const launchFileExists = function(file, confirm) {
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

exports = {
  Controller,
  directive,
  directiveTag,
  launchFileExists
};
