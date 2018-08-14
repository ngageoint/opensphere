goog.provide('os.ui.im.URLExistsChoice');
goog.provide('os.ui.im.URLExistsCtrl');
goog.provide('os.ui.im.urlExistsDirective');

goog.require('os.ui.Module');


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
  var scopeOptions = {
    'confirmCallback': confirm,
    'confirmValue': os.ui.im.URLExistsChoice.ACTIVATE,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon',
    'current': current,
    'url': url
  };

  var windowOptions = {
    'label': 'URL Exists!',
    'icon': 'fa fa-exclamation-triangle orange-icon',
    'x': 'center',
    'y': 'center',
    'width': 450,
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true',
    'no-scroll': 'true'
  };

  var template = '<confirm><urlexists></urlexists></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
