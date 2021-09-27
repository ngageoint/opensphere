goog.declareModuleId('os.ui.column.mapping.ColumnModelTreeUI');

import Module from '../../module.js';
import {Controller as SlickTreeCtrl, directive as slickTreeDirective} from '../../slick/slicktree.js';
import {directiveTag as mappingExpressionUi} from './mappingexpression.js';


/**
 * Modifies the base slicktree directive with a new controller.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var conf = slickTreeDirective();
  conf.controller = Controller;
  return conf;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'columnmodeltree';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the column mapping tree
 * @unrestricted
 */
export class Controller extends SlickTreeCtrl {
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
