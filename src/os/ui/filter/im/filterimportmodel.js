goog.provide('os.ui.filter.im.FilterImportModelCtrl');
goog.provide('os.ui.filter.im.filterImportModelDirective');

goog.require('os.ui.Module');


/**
 * The filterimportmodel directive
 *
 * @return {angular.Directive}
 */
os.ui.filter.im.filterImportModelDirective = function() {
  return {
    restrict: 'E',
    // this directive needs to be replace: false to display properly as it is recursive
    replace: false,
    scope: {
      'layerSelected': '=',
      'models': '=',
      'icon': '=',
      'found': '=',
      'isChild': '=?'
    },
    templateUrl: os.ROOT + 'views/filter/im/filterimportmodel.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('filterimportmodel', [os.ui.filter.im.filterImportModelDirective]);
