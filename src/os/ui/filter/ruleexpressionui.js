goog.module('os.ui.filter.RuleExpressionUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {Controller: ExpressionCtrl, directive: expressionDirective} = goog.require('os.ui.filter.ExpressionUI');
const RuleExpression = goog.require('os.ui.filter.RuleExpression');


/**
 * The rule-expression directive
 *
 * @return {angular.Directive}
 */
const directive = () => {
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
const directiveTag = 'rule-expression';

/**
 * Add the directive to the module
 */
Module.directive('ruleExpression', [directive]);

/**
 * Controller for the expression directive
 * @unrestricted
 */
class Controller extends ExpressionCtrl {
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

exports = {
  Controller,
  directive,
  directiveTag
};
