goog.module('os.ui.uniqueProviderTitle');

const DataManager = goog.require('os.data.DataManager');
const Module = goog.require('os.ui.Module');

const IDataProvider = goog.requireType('os.data.IDataProvider');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  'require': 'ngModel',
  'link': uniqueProviderTitle
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'unique-provider-title';

/**
 * Link function for unique title directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.Attributes} $attrs
 * @param {!Object} $ctrl
 * @ngInject
 */
const uniqueProviderTitle = function($scope, $element, $attrs, $ctrl) {
  var check = function(viewValue) {
    var list = /** @type {Array<IDataProvider>} */ (DataManager.getInstance().getProviderRoot().getChildren());

    var provider = /** @type {?IDataProvider} */ ($scope['config']['provider'] || null);

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
Module.directive('uniqueProviderTitle', [directive]);

exports = {
  directive,
  directiveTag
};
