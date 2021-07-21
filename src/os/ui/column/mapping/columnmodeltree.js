goog.module('os.ui.column.mapping.ColumnModelTreeUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const {directiveTag: mappingExpressionUi} = goog.require('os.ui.column.mapping.MappingExpressionUI');
const SlickTreeCtrl = goog.require('os.ui.slick.SlickTreeCtrl');
const slickTreeDirective = goog.require('os.ui.slick.slickTreeDirective');


/**
 * Modifies the base slicktree directive with a new controller.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var conf = slickTreeDirective();
  conf.controller = Controller;
  return conf;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'columnmodeltree';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the column mapping tree
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
    return `<${mappingExpressionUi} node="item"></${mappingExpressionUi}>`;
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    var opts = super.getOptions();
    opts['rowHeight'] = 30;
    opts['enableTextSelectionOnCells'] = true;
    return opts;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
