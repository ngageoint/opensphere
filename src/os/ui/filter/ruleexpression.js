goog.declareModuleId('os.ui.filter.RuleExpression');

import Expression from './expression.js';
import Rule from './op/ruleop.js';


/**
 * Rule expression object
 */
export default class RuleExpression extends Expression {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getFilter() {
    if (this['op']) {
      return (
        /** @type {Rule} */
        (this['op']).getFilter('', this['literal'])
      );
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  setFilter(value) {
    if (value) {
      var el = angular.element(value);
      var ops = RuleExpression.OPS;

      this['literal'] = '';

      for (var i = 0, n = ops.length; i < n; i++) {
        if (ops[i].matches(el)) {
          this['op'] = ops[i];
          this['literal'] = ops[i].getLiteral(el);
          break;
        }
      }
    }
  }
}

/**
 * @type {Array<Rule>}
 */
RuleExpression.OPS = [
  new Rule('GreaterThan', 'more than', '>='),
  new Rule('LessThan', 'less than', '<=')
];
