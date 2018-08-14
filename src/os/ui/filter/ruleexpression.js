goog.provide('os.ui.filter.RuleExpression');
goog.provide('os.ui.filter.RuleExpressionCtrl');
goog.provide('os.ui.filter.ruleExpressionDirective');
goog.require('os.ui.Module');
goog.require('os.ui.filter.Expression');
goog.require('os.ui.filter.ExpressionCtrl');
goog.require('os.ui.filter.expressionDirective');
goog.require('os.ui.filter.op.Rule');
goog.require('os.ui.filter.op.opUISwitchDirective');


/**
 * The rule-expression directive
 * @return {angular.Directive}
 */
os.ui.filter.ruleExpressionDirective = function() {
  var directive = os.ui.filter.expressionDirective();
  directive.scope = {
    'expr': '='
  };
  directive.templateUrl = os.ROOT + 'views/filter/ruleexpression.html';
  directive.controller = os.ui.filter.RuleExpressionCtrl;
  return directive;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('ruleExpression', [os.ui.filter.ruleExpressionDirective]);



/**
 * Rule expression object
 * @extends {os.ui.filter.Expression}
 * @constructor
 */
os.ui.filter.RuleExpression = function() {
  os.ui.filter.RuleExpression.base(this, 'constructor');
};
goog.inherits(os.ui.filter.RuleExpression, os.ui.filter.Expression);


/**
 * @type {Array.<os.ui.filter.op.Rule>}
 */
os.ui.filter.RuleExpression.OPS = [
  new os.ui.filter.op.Rule('GreaterThan', 'more than', '>='),
  new os.ui.filter.op.Rule('LessThan', 'less than', '<=')
];


/**
 * @inheritDoc
 */
os.ui.filter.RuleExpression.prototype.getFilter = function() {
  if (this['op']) {
    return /** @type {os.ui.filter.op.Rule} */ (this['op']).getFilter('', this['literal']);
  }

  return null;
};


/**
 * @inheritDoc
 */
os.ui.filter.RuleExpression.prototype.setFilter = function(value) {
  if (value) {
    var el = angular.element(value);
    var ops = os.ui.filter.RuleExpression.OPS;

    this['literal'] = '';

    for (var i = 0, n = ops.length; i < n; i++) {
      if (ops[i].matches(el)) {
        this['op'] = ops[i];
        this['literal'] = ops[i].getLiteral(el);
        break;
      }
    }
  }
};



/**
 * Controller for the expression directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.filter.ExpressionCtrl}
 * @constructor
 * @ngInject
 */
os.ui.filter.RuleExpressionCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
  this.scope['ops'] = os.ui.filter.RuleExpression.OPS;

  var expr = /** @type {os.ui.filter.RuleExpression} */ ($scope['expr']);
  expr['op'] = expr['op'] || os.ui.filter.RuleExpression.OPS[0];
  $scope.$watch('expr.op', this.runValidation.bind(this));
};
goog.inherits(os.ui.filter.RuleExpressionCtrl, os.ui.filter.ExpressionCtrl);
