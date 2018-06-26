goog.provide('os.ui.im.FileExistsChoice');
goog.provide('os.ui.im.FileExistsCtrl');
goog.provide('os.ui.im.fileExistsDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window.confirmDirective');


/**
 * @enum {string}
 */
os.ui.im.FileExistsChoice = {
  SAVE_NEW: 'saveNew',
  REPLACE: 'replace',
  REPLACE_AND_IMPORT: 'replaceAndImport'
};


/**
 * Dialog used when a user tries importing a duplicate file.
 * @return {angular.Directive}
 */
os.ui.im.fileExistsDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/im/fileexists.html',
    controller: os.ui.im.FileExistsCtrl,
    controllerAs: 'fileExists'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('fileexists', [os.ui.im.fileExistsDirective]);



/**
 * Controller for the File Exists! window
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.im.FileExistsCtrl = function($scope) {
  $scope.$watch('confirmValue', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    }
  });

  $scope['application'] = os.config.getAppName('the application');
  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 * @param {!os.file.File} file
 * @param {function(os.ui.im.FileExistsChoice)} confirm
 */
os.ui.im.launchFileExists = function(file, confirm) {
  var confirmOptions = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: os.ui.im.FileExistsChoice.SAVE_NEW,
    prompt: '<fileexists></fileexists>',
    windowOptions: {
      'label': 'File Exists!',
      'icon': 'fa fa-exclamation-triangle',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'modal': true,
      'show-close': true,
      'no-scroll': true
    }
  });

  var scopeOptions = {
    'fileName': file.getFileName()
  };

  os.ui.window.launchConfirm(confirmOptions, scopeOptions);
};
