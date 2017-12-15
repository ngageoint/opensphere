goog.provide('os.ui.grid.dataGridDirective');
goog.require('os.ui.Module');
goog.require('os.ui.grid.DataGridCtrl');


/**
 * The data-grid directive
 * @return {angular.Directive}
 */
os.ui.grid.dataGridDirective = function() {
  return {
    template: '<div class="data-grid"></div>',
    restrict: 'AE',
    replace: true,
    scope: {
      'data': '=',
      'columns': '=',
      'filter': '=',
      'options': '=',
      'defaultSortColumn': '@'
    },
    controllerAs: 'dataGrid',
    controller: os.ui.grid.DataGridCtrl
  };
};


/**
 * Register the data-grid directive.
 */
os.ui.Module.directive('datagrid', [os.ui.grid.dataGridDirective]);
