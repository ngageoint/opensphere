goog.provide('os.ui.uniqueServerUrl');

goog.require('os.data.DataManager');
goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.uniqueServerUrl = function() {
  return {
    'require': 'ngModel',
    'link': os.ui.uniqueServerUrl_
  };
};


/**
 * Link function for unique title directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.Attributes} $attrs
 * @param {!Object} $ctrl
 * @ngInject
 * @private
 */
os.ui.uniqueServerUrl_ = function($scope, $element, $attrs, $ctrl) {
  var check = function(viewValue) {
    // mark empty URL's as unique. they will be marked invalid by require, otherwise assumed valid.
    if (viewValue && $scope['config']) {
      var config = $scope['config'];
      var alternateUrls = config['alternateUrls'] || [];
      var index = alternateUrls.indexOf(viewValue);
      if (index != $scope['$index'] && index != -1) {
        $ctrl.$setValidity('unique', false);
        return viewValue;
      }
    }

    $ctrl.$setValidity('unique', true);
    return viewValue;
  };

  $ctrl.$formatters.unshift(check);
  $ctrl.$parsers.unshift(check);
};


/**
 * Add the unique title directive
 */
os.ui.Module.directive('uniqueServerUrl', [os.ui.uniqueServerUrl]);


