goog.provide('os.ui.uniqueProviderTitle');

goog.require('os.data.DataManager');
goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.uniqueProviderTitle = function() {
  return {
    'require': 'ngModel',
    'link': os.ui.uniqueProviderTitle_
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
os.ui.uniqueProviderTitle_ = function($scope, $element, $attrs, $ctrl) {
  var check = function(viewValue) {
    var list = /** @type {Array.<os.data.IDataProvider>} */ (
        os.dataManager.getProviderRoot().getChildren());

    var provider = /** @type {?os.data.IDataProvider} */ ($scope['config']['provider'] || null);

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].getLabel() === viewValue && provider !== list[i]) {
          $ctrl.$setValidity('unique', false);
          return viewValue;
        }
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
os.ui.Module.directive('uniqueProviderTitle', [os.ui.uniqueProviderTitle]);


