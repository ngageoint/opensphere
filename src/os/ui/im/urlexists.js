goog.module('os.ui.im.URLExistsUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const URLExistsChoice = goog.require('os.ui.im.URLExistsChoice');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');


/**
 * Dialog used when a user tries importing a duplicate url.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/im/urlexists.html',
  controller: Controller,
  controllerAs: 'urlExists'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'urlexists';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the URL Exists! window
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
const launchURLExists = function(url, current, confirm) {
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

exports = {
  Controller,
  directive,
  directiveTag,
  launchURLExists
};
