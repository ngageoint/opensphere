goog.provide('os.ui.filter.BasicFilterTreeCtrl');
goog.provide('os.ui.filter.basicFilterTreeDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.slickTreeDirective');


/**
 * @return {angular.Directive}
 */
os.ui.filter.basicFilterTreeDirective = function() {
  var conf = os.ui.slick.slickTreeDirective();
  conf.controller = os.ui.filter.BasicFilterTreeCtrl;
  conf.template = '<div class="c-slick-tree no-hover"></div>';
  return conf;
};


os.ui.Module.directive('basicfiltertree', [os.ui.filter.basicFilterTreeDirective]);



/**
 * Controller for basic filter tree
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.slick.SlickTreeCtrl}
 * @constructor
 * @ngInject
 */
os.ui.filter.BasicFilterTreeCtrl = function($scope, $element, $compile) {
  os.ui.filter.BasicFilterTreeCtrl.base(this, 'constructor', $scope, $element, $compile);
};
goog.inherits(os.ui.filter.BasicFilterTreeCtrl, os.ui.slick.SlickTreeCtrl);


/**
 * @inheritDoc
 */
os.ui.filter.BasicFilterTreeCtrl.prototype.treeFormatter = function(row, cell, value, columnDef, node) {
  return row % 2 == 1 ? '<div ng-bind="root.grouping"></div>' :
    '<expression expr="item.getExpression()" columns="columns"></expression>' +
      ('<span ng-if="hasMultipleFilters()">' +
          '<button class="btn btn-danger btn-sm" tabindex="-1" ng-click="$emit(\'filterbuilder.remove\', item)" ' +
          'title="Remove this expression"><i class="fa fa-times"></i></button></span>');
};


/**
 * @inheritDoc
 */
os.ui.filter.BasicFilterTreeCtrl.prototype.getOptions = function() {
  var opts = os.ui.filter.BasicFilterTreeCtrl.base(this, 'getOptions');
  opts['rowHeight'] = 30;
  return opts;
};


/**
 * @inheritDoc
 */
os.ui.filter.BasicFilterTreeCtrl.prototype.initRowScope = function(s, row, node, item) {
  s['columns'] = this.scope.$parent['columns'];
  s['root'] = this.scope.$parent['root'];
  s['hasMultipleFilters'] = this.hasMultipleFilters.bind(this);

  os.ui.filter.BasicFilterTreeCtrl.base(this, 'initRowScope', s, row, node, item);
};


/**
 * Check if there are multiple filter components. This is used to determine if the remove button should be displayed.
 *
 * @return {boolean}
 * @protected
 */
os.ui.filter.BasicFilterTreeCtrl.prototype.hasMultipleFilters = function() {
  if (this.scope && this.scope.$parent && this.scope.$parent['root']) {
    var children = this.scope.$parent['root'].getChildren();
    return !!children && children.length > 1;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.filter.BasicFilterTreeCtrl.prototype.updateData = function(data) {
  // insert the odd-numbered "group" rows
  for (var i = 1, n = 2 * data.length - 1; i < n; i += 2) {
    var node = new os.ui.slick.SlickTreeNode();
    node['id'] = 'g.' + i;
    data.splice(i, 0, node);
  }
  os.ui.filter.BasicFilterTreeCtrl.base(this, 'updateData', data);
};
