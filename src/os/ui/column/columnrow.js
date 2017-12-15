goog.provide('os.ui.column.ColumnRowCtrl');
goog.provide('os.ui.column.columnRowDirective');
goog.require('os.ui.Module');


/**
 * The columnrow directive
 * @return {angular.Directive}
 */
os.ui.column.columnRowDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'item': '='
    },
    templateUrl: os.ROOT + 'views/column/columnrow.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('columnrow', [os.ui.column.columnRowDirective]);
