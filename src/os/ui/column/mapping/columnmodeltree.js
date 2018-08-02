goog.provide('os.ui.column.mapping.ColumnModelTree');
goog.provide('os.ui.column.mapping.columnModelTreeDirective');
goog.require('os.ui.Module');
goog.require('os.ui.column.mapping.mappingExpressionDirective');
goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.slickTreeDirective');


/**
 * Modifies the base slicktree directive with a new controller.
 * @return {angular.Directive}
 */
os.ui.column.mapping.columnModelTreeDirective = function() {
  var conf = os.ui.slick.slickTreeDirective();
  conf.controller = os.ui.column.mapping.ColumnModelTree;
  return conf;
};


os.ui.Module.directive('columnmodeltree', [os.ui.column.mapping.columnModelTreeDirective]);



/**
 * Controller for the column mapping tree
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.slick.SlickTreeCtrl}
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.ColumnModelTree = function($scope, $element, $compile) {
  os.ui.column.mapping.ColumnModelTree.base(this, 'constructor', $scope, $element, $compile);
};
goog.inherits(os.ui.column.mapping.ColumnModelTree, os.ui.slick.SlickTreeCtrl);


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnModelTree.prototype.treeFormatter = function(row, cell, value, columnDef, node) {
  return '<mappingexpression node="item"></mappingexpression>';
};


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnModelTree.prototype.getOptions = function() {
  var opts = os.ui.column.mapping.ColumnModelTree.base(this, 'getOptions');
  opts['rowHeight'] = 30;
  opts['enableTextSelectionOnCells'] = true;
  return opts;
};
