goog.declareModuleId('os.ui.filter.RuleExpressionUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {Controller as ExpressionCtrl, directive as expressionDirective} from './expressionui.js';
import RuleExpression from './ruleexpression.js';


/**
 * The rule-expression directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var directive = expressionDirective();
  directive.scope = {
    'expr': '='
  };
  directive.templateUrl = ROOT + 'views/filter/ruleexpression.html';
  directive.controller = Controller;
  return directive;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'rule-expression';

/**
 * Add the directive to the module
 */
Module.directive('ruleExpression', [directive]);

/**
 * Controller for the expression directive
 * @unrestricted
 */
export class Controller extends ExpressionCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
    this.scope['ops'] = RuleExpression.OPS;

    var expr = /** @type {RuleExpression} */ ($scope['expr']);
    expr['op'] = expr['op'] || RuleExpression.OPS[0];
    $scope.$watch('expr.op', this.runValidation.bind(this));
  }
}
