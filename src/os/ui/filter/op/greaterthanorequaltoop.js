goog.declareModuleId('os.ui.filter.op.GreaterThanOrEqualTo');

import {quoteString} from '../filterstring.js';
import Op from './op.js';

const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');


/**
 * A 'PropertyIsGreaterThanOrEqualTo' operation class.
 */
export default class GreaterThanOrEqualTo extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('PropertyIsGreaterThanOrEqualTo', 'is greater than or equal to', '>=');
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    if (!isEmptyOrWhitespace(makeSafe(literal))) {
      return varName + '>=' + quoteString(literal);
    }

    // null/empty string is not supported, so don't return an expression
    return '';
  }
}
