goog.provide('os.ui.im.URLExistsChoice');
goog.provide('os.ui.im.URLExistsCtrl');
goog.provide('os.ui.im.urlExistsDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window.confirmDirective');


/**
 * @enum {string}
 */
os.ui.im.URLExistsChoice = {
  ACTIVATE: 'activate',
  REIMPORT: 'reimport',
  CREATE_NEW: 'createNew'
};


/**
 * Dialog used when a user tries importing a duplicate url.
 * @return {angular.Directive}
 */
os.ui.im.urlExistsDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/im/urlexists.html',
    controller: os.ui.im.URLExistsCtrl,
    controllerAs: 'urlExists'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('urlexists', [os.ui.im.urlExistsDirective]);



/**
 * Controller for the URL Exists! window
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.im.URLExistsCtrl = function($scope) {
  $scope.$watch('confirmValue', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    }
  });

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Launch a dialog prompting the user the url they're importing already exists and requesting action.
 * @param {string} url
 * @param {string} current
 * @param {function(os.ui.im.URLExistsChoice)} confirm
 */
os.ui.im.launchURLExists = function(url, current, confirm) {
  var confirmOptions = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: os.ui.im.URLExistsChoice.ACTIVATE,
    prompt: '<urlexists></urlexists>',
    windowOptions: {
      'label': 'URL Exists!',
      'icon': 'fa fa-exclamation-triangle',
      'x': 'center',
      'y': 'center',
      'width': 450,
      'height': 'auto',
      'modal': true,
      'show-close': true,
      'no-scroll': true
    }
  });

  var scopeOptions = {
    'current': current,
    'url': url
  };

  os.ui.window.launchConfirm(confirmOptions, scopeOptions);
};
