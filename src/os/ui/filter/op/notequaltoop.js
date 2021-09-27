goog.declareModuleId('os.ui.filter.op.NotEqualTo');

import {quoteString} from '../filterstring.js';
import Op from './op.js';


/**
 * A 'PropertyIsNotEqualTo' operation class.
 */
export default class NotEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super(
        'PropertyIsNotEqualTo',
        'is not equal to',
        '!=',
        undefined,
        undefined,
        'e.g. Abc' + Op.TEXT.CASE_SENSITIVE,
        undefined,
        undefined,
        Op.TEXT.CASE_SENSITIVE_TITLE,
        Op.TEXT.CASE_SENSITIVE_DETAIL
    );
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (literal != null) {
      return varName + '!=' + quoteString(literal);
    }

    // null is not supported, so don't return an expression
    return '';
  }
}
