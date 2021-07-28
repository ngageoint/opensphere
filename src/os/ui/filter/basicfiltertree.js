goog.module('os.ui.filter.BasicFilterTreeUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const {Controller: SlickTreeCtrl, directive: slickTreeDirective} = goog.require('os.ui.slick.SlickTreeUI');


/**
 * @return {angular.Directive}
 */
const directive = () => {
  var conf = slickTreeDirective();
  conf.controller = Controller;
  conf.template = '<div class="c-slick-tree no-hover"></div>';
  return conf;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'basicfiltertree';

Module.directive(directiveTag, [directive]);

/**
 * Controller for basic filter tree
 * @unrestricted
 */
class Controller extends SlickTreeCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super($scope, $element, $compile);
  }

  /**
   * @inheritDoc
   */
  treeFormatter(row, cell, value, columnDef, node) {
    return row % 2 == 1 ? '<div ng-bind="root.grouping"></div>' :
      '<expression expr="item.getExpression()" columns="columns"></expression>' +
        ('<span ng-if="hasMultipleFilters()">' +
            '<button class="btn btn-danger btn-sm" tabindex="-1" ng-click="$emit(\'filterbuilder.remove\', item)" ' +
            'title="Remove this expression"><i class="fa fa-times"></i></button></span>');
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    var opts = super.getOptions();
    opts['rowHeight'] = 30;
    return opts;
  }

  /**
   * @inheritDoc
   */
  initRowScope(s, row, node, item) {
    s['columns'] = this.scope.$parent['columns'];
    s['root'] = this.scope.$parent['root'];
    s['hasMultipleFilters'] = this.hasMultipleFilters.bind(this);

    super.initRowScope(s, row, node, item);
  }

  /**
   * Check if there are multiple filter components. This is used to determine if the remove button should be displayed.
   *
   * @return {boolean}
   * @protected
   */
  hasMultipleFilters() {
    if (this.scope && this.scope.$parent && this.scope.$parent['root']) {
      var children = this.scope.$parent['root'].getChildren();
      return !!children && children.length > 1;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  updateData(data) {
    // insert the odd-numbered "group" rows
    for (var i = 1, n = 2 * data.length - 1; i < n; i += 2) {
      var node = new SlickTreeNode();
      node['id'] = 'g.' + i;
      data.splice(i, 0, node);
    }
    super.updateData(data);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
